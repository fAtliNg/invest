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
    console.error('Database query failed for changelog, returning fallback data');
    const fallbackChangelog = [
      { version: 'v1.0.2', date: '2026-02-06', description: 'Улучшена надежность API, добавлены резервные данные для currency-names и changelog. Реализован локальный запуск с SSR страницами.' },
      { version: 'v1.0.1', date: '2026-01-10', description: 'Добавлен полноценный кредитный калькулятор: расчет графика платежей, переплаты и выгоды от досрочных погашений с интерактивной визуализацией.' },
      { version: 'v1.0.0', date: '2022-02-04', description: 'Запуск MVP c базовым функционалом: калькулятор сложного процента и визуализация роста капитала.' }
    ];
    res.json(fallbackChangelog);
  }
});

const fallbackCurrencyNames = [
  { secid: 'AEDRUBTODTOM', name: 'Дирхам ОАЭ Своп TOD/TOM', shortname: 'AED_TODTOM' },
  { secid: 'AEDRUB_SPT', name: 'Дирхам ОАЭ SPOT', shortname: 'AEDRUB_SPT' },
  { secid: 'AEDRUB_TMS', name: 'Дирхам ОАЭ (малые лоты) TMS', shortname: 'AEDRUB_TMS' },
  { secid: 'AEDRUB_TOD', name: 'Дирхам ОАЭ TOD', shortname: 'AEDRUB_TOD' },
  { secid: 'AEDRUB_TOM', name: 'Дирхам ОАЭ TOM', shortname: 'AEDRUB_TOM' },
  { secid: 'CNYRUB_TOM', name: 'Китайский юань TOM', shortname: 'CNYRUB_TOM' },
  { secid: 'EUR_RUB__TOM', name: 'Евро TOM', shortname: 'EURRUB_TOM' },
  { secid: 'USD000000TOD', name: 'Доллар США TOD', shortname: 'USDRUB_TOD' },
  { secid: 'USD000UTSTOM', name: 'Доллар США TOM', shortname: 'USDRUB_TOM' },
  // Add more common ones if needed, or rely on DB for full list
];

app.get(['/currency-names', '/api/currency-names'], async (req, res) => {
  try {
    const result = await query('SELECT * FROM currency_names');
    res.json(result.rows);
  } catch (err) {
    console.error('Database query failed, returning fallback data for currency-names');
    res.json(fallbackCurrencyNames);
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
const POLLING_INTERVAL = 2000;
let isPolling = false;

// Minimal safe fallback to avoid empty UI when MOEX and DB are unavailable
const FALLBACK_QUOTES = [
  {
    secid: 'SBER',
    shortname: 'Сбербанк',
    price: 285.5,
    high: 287.2,
    low: 282.1,
    change: 1.2,
    change_pct: 0.42,
    volume: 1240000,
    lot_size: 10,
    type: 'share',
    isin: 'RU0009029540'
  },
  {
    secid: 'GAZP',
    shortname: 'Газпром',
    price: 162.4,
    high: 164.0,
    low: 160.2,
    change: -0.6,
    change_pct: -0.37,
    volume: 980000,
    lot_size: 10,
    type: 'share',
    isin: 'RU0007661625'
  },
  {
    secid: 'USD000UTSTOM',
    shortname: 'Доллар США TOM',
    price: 92.35,
    high: 92.70,
    low: 91.90,
    change: 0.25,
    change_pct: 0.27,
    volume: 0,
    lot_size: 1,
    type: 'currency',
    isin: null
  },
  {
    secid: 'CNYRUB_TOM',
    shortname: 'Китайский юань TOM',
    price: 12.85,
    high: 12.95,
    low: 12.80,
    change: 0.05,
    change_pct: 0.39,
    volume: 0,
    lot_size: 1,
    type: 'currency',
    isin: null
  }
];

const pollMoex = async () => {
  if (isPolling) return;
  isPolling = true;

  try {
    let quotes = await fetchMoexData();
    
    if (quotes.length > 0) {
      try {
        await updateQuotesInDb(quotes);
      } catch (dbError) {
        console.error('Failed to update DB with new quotes:', dbError);
      }
    } else {
      console.log('MOEX API failed, fetching from DB...');
      quotes = await getQuotesFromDb();
      if (quotes.length === 0) {
        console.warn('DB returned empty quotes, using minimal fallback dataset');
        quotes = FALLBACK_QUOTES;
      }
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
        const initial = quotes.length > 0 ? quotes : FALLBACK_QUOTES;
        ws.send(JSON.stringify({ type: 'QUOTES_UPDATE', data: initial }));
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
