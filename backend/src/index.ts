import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Broadcast function
const broadcast = (data: any) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Polling loop
const POLLING_INTERVAL = 5000; // 5 seconds
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
