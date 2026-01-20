import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { query } from './db';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { fetchMoexData, updateQuotesInDb, getQuotesFromDb } from './services/moex';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Create HTTP server manually to attach WS
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.get('/', (req, res) => {
  res.json({ message: 'Profit Case API is running' });
});

// Example route to test DB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.get(['/changelog', '/api/changelog'], async (req, res) => {
  try {
    const result = await query('SELECT * FROM changelog ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch changelog' });
  }
});

app.get(['/orderbook', '/api/orderbook'], async (req, res) => {
  try {
    const { secid, engine, market, depth } = req.query;

    if (!secid || !engine || !market) {
      res.status(400).json({ error: 'Missing required parameters: secid, engine, market' });
      return;
    }

    const depthValue = typeof depth === 'string' ? depth : '10';

    const url = `https://iss.moex.com/iss/engines/${encodeURIComponent(
      String(engine)
    )}/markets/${encodeURIComponent(String(market))}/orderbook.json?securities=${encodeURIComponent(
      String(secid)
    )}&depth=${encodeURIComponent(depthValue)}`;

    const response = await axios.get(url);
    const data = response.data;

    const parseTable = (table: any) => {
      if (!table || !Array.isArray(table.columns) || !Array.isArray(table.data)) {
        return [];
      }

      const priceIndex = table.columns.indexOf('PRICE');
      const quantityIndex = table.columns.indexOf('QUANTITY');

      if (priceIndex === -1 || quantityIndex === -1) {
        return [];
      }

      return table.data
        .map((row: any[]) => ({
          price: row[priceIndex],
          quantity: row[quantityIndex]
        }))
        .filter(
          (item: { price: number | null; quantity: number | null }) =>
            item.price != null && item.quantity != null
        );
    };

    const bids = parseTable(data.bids || data.orderbook);
    const offers = parseTable(data.offers || data.orderbook);

    res.json({
      bids,
      asks: offers
    });
  } catch (err) {
    console.error('Error fetching orderbook from MOEX:', err);
    res.status(500).json({ error: 'Failed to fetch orderbook' });
  }
});

// Broadcast function
const broadcast = (data: any) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Polling loop
const POLLING_INTERVAL = 2000; // 1 second
let isPolling = false;

const pollMoex = async () => {
  if (isPolling) return;
  isPolling = true;

  try {
    let quotes = await fetchMoexData();
    
    if (quotes.length > 0) {
      await updateQuotesInDb(quotes);
    } else {
      console.log('MOEX API failed, fetching from DB...');
      quotes = await getQuotesFromDb();
    }

    broadcast({ type: 'QUOTES_UPDATE', data: quotes });
  } catch (error) {
    console.error('Polling error:', error);
  } finally {
    isPolling = false;
  }
};

// Start polling
setInterval(pollMoex, POLLING_INTERVAL);
// Initial fetch
pollMoex();

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial data immediately upon connection
  getQuotesFromDb().then(quotes => {
     if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'QUOTES_UPDATE', data: quotes }));
     }
  }).catch(err => {
     console.error('Error sending initial data:', err);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
