import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from './db';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { fetchMoexData, updateQuotesInDb, getQuotesFromDb } from './services/moex';
import { getSystemPrompt } from './prompts';
import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
// @ts-ignore
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/portfolios';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'portfolio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Create HTTP server manually to attach WS
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const ensurePortfolioAssetsTable = async () => {
  try {
    await query(`
      ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS strategy TEXT;
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS portfolio_assets (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
        secid VARCHAR(32) NOT NULL,
        shortname VARCHAR(255),
        quantity NUMERIC NOT NULL DEFAULT 0,
        buy_price NUMERIC NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_portfolio_assets_portfolio_id ON portfolio_assets (portfolio_id);
      CREATE INDEX IF NOT EXISTS idx_portfolio_assets_secid ON portfolio_assets (secid);
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_portfolio_assets_portfolio_secid ON portfolio_assets (portfolio_id, secid);
    `);
  } catch (e) {
    console.error('Failed to ensure portfolio_assets table', e);
  }
};

const buildPortfolioAssetsSummary = async (portfolioId: number) => {
  const result = await query(
    `SELECT pa.secid,
            COALESCE(pa.shortname, q.shortname) AS shortname,
            pa.quantity,
            pa.buy_price,
            q.price AS current_price
     FROM portfolio_assets pa
     LEFT JOIN quotes q ON q.secid = pa.secid
     WHERE pa.portfolio_id = $1
     ORDER BY shortname ASC`,
    [portfolioId]
  );

  const fmt = (n: number | null) => (n == null ? '-' : n.toFixed(2));
  const fmtPct = (n: number | null) =>
    n == null ? '-' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

  const header = `### Состав портфеля (актуально на ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })})`;
  const tableHeader =
    '| Тикер | Бумага | Кол-во | Покупка, ₽ | Текущая, ₽ | Стоимость покупки, ₽ | Текущая стоимость, ₽ | Изм., ₽ | Изм., % |\n' +
    '|---|---|---:|---:|---:|---:|---:|---:|---:|';
  const rows: string[] = [];
  let totalPurchase = 0;
  let totalCurrent = 0;
  for (const r of result.rows) {
    const secid = r.secid;
    const shortname = r.shortname || secid;
    const quantity = parseFloat(r.quantity || 0);
    const buy = parseFloat(r.buy_price || 0);
    const current = r.current_price != null ? parseFloat(r.current_price) : null;
    const purchaseCost = quantity && buy ? quantity * buy : 0;
    const currentCost = quantity && current != null ? quantity * current : 0;
    totalPurchase += purchaseCost || 0;
    totalCurrent += currentCost || 0;
    const changeAbs = (currentCost || 0) - (purchaseCost || 0);
    const changePct = buy > 0 && current != null ? ((current / buy) - 1) * 100 : null;

    rows.push(
      `| ${secid} | ${String(shortname).replace(/\|/g, '\\|')} | ${fmt(quantity)} | ${fmt(buy)} | ${fmt(
        current
      )} | ${fmt(purchaseCost)} | ${fmt(currentCost)} | ${fmt(changeAbs)} | ${fmtPct(changePct)} |`
    );
  }
  const totalChange = totalCurrent - totalPurchase;
  const totalPct = totalPurchase > 0 ? ((totalCurrent / totalPurchase) - 1) * 100 : null;

  const totals = `**Итого (стоимость):** ${fmt(totalPurchase)} → ${fmt(totalCurrent)}; **изм:** ${fmt(
    totalChange
  )} (${fmtPct(totalPct)})`;

  if (rows.length === 0) {
    return [header, '', 'В портфеле нет бумаг.', '', totals].join('\n');
  }

  return [header, '', tableHeader, ...rows, '', totals].join('\n');
};

const appendPortfolioSystemMessage = async (portfolioId: number, content: string) => {
  await query(
    'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
    [portfolioId, 'system', content]
  );
};

// Shared tool definitions for AI chat
const getToolDefinitions = () => [
  {
    type: 'function',
    function: {
      name: 'set_strategy',
      description: 'Сохранить согласованную стратегию инвестирования для портфеля.',
      parameters: {
        type: 'object',
        properties: {
          strategy: {
            type: 'string',
            description: 'Полный текст стратегии в формате Markdown.'
          }
        },
        required: ['strategy']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_asset',
      description: 'Добавить бумагу в портфель. Если бумага уже есть, её количество будет увеличено, а средняя цена покупки пересчитана.',
      parameters: {
        type: 'object',
        properties: {
          secid: {
            type: 'string',
            description: 'Тикер бумаги на Московской Бирже (заглавными буквами, например SBER, GAZP, LKOH).'
          },
          quantity: {
            type: 'number',
            description: 'Количество бумаг для добавления (положительное число).'
          },
          buy_price: {
            type: 'number',
            description: 'Цена покупки одной бумаги в рублях.'
          },
          shortname: {
            type: 'string',
            description: 'Краткое название бумаги (необязательно).'
          }
        },
        required: ['secid', 'quantity', 'buy_price']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_asset',
      description: 'Изменить количество или цену покупки существующей бумаги в портфеле.',
      parameters: {
        type: 'object',
        properties: {
          secid: {
            type: 'string',
            description: 'Тикер бумаги (заглавными буквами).'
          },
          quantity: {
            type: 'number',
            description: 'Новое количество бумаг (положительное число).'
          },
          buy_price: {
            type: 'number',
            description: 'Новая цена покупки одной бумаги в рублях.'
          }
        },
        required: ['secid', 'quantity', 'buy_price']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_asset',
      description: 'Удалить бумагу из портфеля. Вызывать только после явного подтверждения пользователя.',
      parameters: {
        type: 'object',
        properties: {
          secid: {
            type: 'string',
            description: 'Тикер бумаги для удаления (заглавными буквами).'
          }
        },
        required: ['secid']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bulk_add_assets',
      description: 'Добавить несколько бумаг в портфель одним вызовом. Используй этот инструмент, когда нужно добавить 2 и более бумаг (например, из файла или списка).',
      parameters: {
        type: 'object',
        properties: {
          assets: {
            type: 'array',
            description: 'Массив бумаг для добавления.',
            items: {
              type: 'object',
              properties: {
                secid: {
                  type: 'string',
                  description: 'Тикер бумаги (заглавными буквами).'
                },
                quantity: {
                  type: 'number',
                  description: 'Количество бумаг.'
                },
                buy_price: {
                  type: 'number',
                  description: 'Цена покупки одной бумаги в рублях.'
                },
                shortname: {
                  type: 'string',
                  description: 'Краткое название бумаги (необязательно).'
                }
              },
              required: ['secid', 'quantity', 'buy_price']
            }
          }
        },
        required: ['assets']
      }
    }
  }
];

// Execute asset-related tool calls, returns a summary string or null
// sendNotification writes raw JSON object to SSE (not double-encoded by send())
const executeAssetToolCall = async (
  toolCallName: string,
  toolCallArguments: string,
  portfolioId: number,
  sendNotification?: (notification: object) => void
): Promise<string | null> => {
  try {
    const args = JSON.parse(toolCallArguments);

    if (toolCallName === 'add_asset') {
      const secid = String(args.secid || '').trim().toUpperCase();
      const qty = Number(args.quantity);
      const price = Number(args.buy_price);
      const shortname = args.shortname ? String(args.shortname) : null;

      if (!secid || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) {
        console.error('Invalid add_asset args:', args);
        return null;
      }

      await ensurePortfolioAssetsTable();
      await query(
        `INSERT INTO portfolio_assets (portfolio_id, secid, shortname, quantity, buy_price)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (portfolio_id, secid)
         DO UPDATE SET
           shortname = COALESCE(EXCLUDED.shortname, portfolio_assets.shortname),
           buy_price = CASE
             WHEN (portfolio_assets.quantity + EXCLUDED.quantity) = 0 THEN portfolio_assets.buy_price
             ELSE ((portfolio_assets.quantity * portfolio_assets.buy_price) + (EXCLUDED.quantity * EXCLUDED.buy_price)) / (portfolio_assets.quantity + EXCLUDED.quantity)
           END,
           quantity = portfolio_assets.quantity + EXCLUDED.quantity`,
        [portfolioId, secid, shortname, qty, price]
      );

      console.log(`Asset added via chat: ${secid} qty=${qty} price=${price}`);
      if (sendNotification) sendNotification({ type: 'asset_updated', message: `Бумага ${secid} добавлена в портфель (${qty} шт. по ${price} ₽)` });

      const summary = await buildPortfolioAssetsSummary(portfolioId);
      await appendPortfolioSystemMessage(portfolioId, `Обновление портфеля: добавлена позиция ${secid}.\n\n${summary}`);
      return `Добавлено: ${secid}`;
    }

    if (toolCallName === 'edit_asset') {
      const secid = String(args.secid || '').trim().toUpperCase();
      const qty = Number(args.quantity);
      const price = Number(args.buy_price);

      if (!secid || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) {
        console.error('Invalid edit_asset args:', args);
        return null;
      }

      await ensurePortfolioAssetsTable();
      const updateResult = await query(
        `UPDATE portfolio_assets
         SET quantity = $3, buy_price = $4
         WHERE portfolio_id = $1 AND secid = $2
         RETURNING id`,
        [portfolioId, secid, qty, price]
      );

      if (updateResult.rows.length === 0) {
        console.error(`Asset ${secid} not found for edit`);
        return null;
      }

      console.log(`Asset edited via chat: ${secid} qty=${qty} price=${price}`);
      if (sendNotification) sendNotification({ type: 'asset_updated', message: `Бумага ${secid} изменена (${qty} шт. по ${price} ₽)` });

      const summary = await buildPortfolioAssetsSummary(portfolioId);
      await appendPortfolioSystemMessage(portfolioId, `Обновление портфеля: изменена позиция ${secid}.\n\n${summary}`);
      return `Изменено: ${secid}`;
    }

    if (toolCallName === 'remove_asset') {
      const secid = String(args.secid || '').trim().toUpperCase();

      if (!secid) {
        console.error('Invalid remove_asset args:', args);
        return null;
      }

      await ensurePortfolioAssetsTable();
      await query(
        'DELETE FROM portfolio_assets WHERE portfolio_id = $1 AND secid = $2',
        [portfolioId, secid]
      );

      console.log(`Asset removed via chat: ${secid}`);
      if (sendNotification) sendNotification({ type: 'asset_updated', message: `Бумага ${secid} удалена из портфеля` });

      const summary = await buildPortfolioAssetsSummary(portfolioId);
      await appendPortfolioSystemMessage(portfolioId, `Обновление портфеля: удалена позиция ${secid}.\n\n${summary}`);
      return `Удалено: ${secid}`;
    }

    if (toolCallName === 'bulk_add_assets') {
      const assets = args.assets;
      if (!Array.isArray(assets) || assets.length === 0) {
        console.error('Invalid bulk_add_assets args:', args);
        return null;
      }

      await ensurePortfolioAssetsTable();
      const added: string[] = [];

      for (const asset of assets) {
        const secid = String(asset.secid || '').trim().toUpperCase();
        const qty = Number(asset.quantity);
        const price = Number(asset.buy_price);
        const shortname = asset.shortname ? String(asset.shortname) : null;

        if (!secid || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) {
          console.error('Skipping invalid asset in bulk:', asset);
          continue;
        }

        await query(
          `INSERT INTO portfolio_assets (portfolio_id, secid, shortname, quantity, buy_price)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (portfolio_id, secid)
           DO UPDATE SET
             shortname = COALESCE(EXCLUDED.shortname, portfolio_assets.shortname),
             buy_price = CASE
               WHEN (portfolio_assets.quantity + EXCLUDED.quantity) = 0 THEN portfolio_assets.buy_price
               ELSE ((portfolio_assets.quantity * portfolio_assets.buy_price) + (EXCLUDED.quantity * EXCLUDED.buy_price)) / (portfolio_assets.quantity + EXCLUDED.quantity)
             END,
             quantity = portfolio_assets.quantity + EXCLUDED.quantity`,
          [portfolioId, secid, shortname, qty, price]
        );
        added.push(secid);
        console.log(`Bulk asset added: ${secid} qty=${qty} price=${price}`);
      }

      if (added.length > 0) {
        if (sendNotification) sendNotification({ type: 'asset_updated', message: `Добавлено ${added.length} бумаг: ${added.join(', ')}` });
        const summary = await buildPortfolioAssetsSummary(portfolioId);
        await appendPortfolioSystemMessage(portfolioId, `Массовое обновление портфеля: добавлены позиции ${added.join(', ')}.\n\n${summary}`);
      }
      return `Добавлено: ${added.join(', ')}`;
    }

    return null;
  } catch (e) {
    console.error('Failed to execute asset tool call:', e);
    return null;
  }
};


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

app.get(['/currency-names', '/api/currency-names'], async (req, res) => {
  try {
    const result = await query('SELECT * FROM currency_names');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch currency names' });
  }
});

app.get(['/quotes', '/api/quotes'], async (req, res) => {
  try {
    const q = String((req.query as any)?.q || '').trim();
    const limitParam = parseInt(String((req.query as any)?.limit || '100'), 10);
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 100)) : 100;

    let rows: any[] = [];
    if (q) {
      const term = `%${q}%`;
      const result = await query(
        'SELECT * FROM quotes WHERE secid ILIKE $1 OR shortname ILIKE $1 ORDER BY secid LIMIT $2',
        [term, limit]
      );
      rows = result.rows;
    } else {
      const result = await query('SELECT * FROM quotes ORDER BY secid LIMIT $1', [limit]);
      rows = result.rows;
    }

    const data = rows
      .map(row => ({
        secid: row.secid,
        shortname: row.shortname,
        price: row.price != null ? parseFloat(row.price) : null,
        high: row.high != null ? parseFloat(row.high) : null,
        low: row.low != null ? parseFloat(row.low) : null,
        change: row.change != null ? parseFloat(row.change) : null,
        change_pct: row.change_pct != null ? parseFloat(row.change_pct) : null,
        volume: row.volume != null ? parseInt(String(row.volume), 10) : 0,
        lot_size: row.lot_size != null ? parseInt(String(row.lot_size), 10) : 0,
        type: row.type || 'share',
        isin: row.isin || null
      }))
      .filter((quote: any) => !(quote.type === 'currency' && (quote.price == null || quote.price <= 0)));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

app.get(['/portfolios', '/api/portfolios'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined in backend .env');
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    if (!email) {
      res.status(400).json({ error: 'Email not found in token' });
      return;
    }

    const result = await query(
      `SELECT p.*, 
              COALESCE(agg.total_value, 0) AS computed_value
       FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       LEFT JOIN (
         SELECT pa.portfolio_id, 
                SUM(pa.quantity * COALESCE(q.price, pa.buy_price)) AS total_value
         FROM portfolio_assets pa
         LEFT JOIN quotes q ON q.secid = pa.secid
         GROUP BY pa.portfolio_id
       ) agg ON agg.portfolio_id = p.id
       WHERE u.email = $1 
       ORDER BY p.created_at ASC`,
      [email]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      uuid: row.uuid,
      title: row.title,
      description: row.description,
      image: row.image_url,
      value: parseFloat(row.computed_value) || 0
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch portfolios' });
  }
});

app.post(['/portfolios', '/api/portfolios'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { title, description, image, strategy } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    // Get user id
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userId = userResult.rows[0].id;

    const result = await query(
      `INSERT INTO portfolios (user_id, title, description, image_url, strategy, current_value)
       VALUES ($1, $2, $3, $4, $5, 0)
       RETURNING *`,
      [userId, title, description, image, strategy]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      uuid: row.uuid,
      title: row.title,
      description: row.description,
      image: row.image_url,
      strategy: row.strategy,
      value: parseFloat(row.current_value)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create portfolio' });
  }
});

app.get(['/portfolios/:uuid', '/api/portfolios/:uuid'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid } = req.params;

    const result = await query(
      `SELECT p.* FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (result.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      uuid: row.uuid,
      title: row.title,
      description: row.description,
      image: row.image_url,
      strategy: row.strategy,
      value: parseFloat(row.current_value)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch portfolio details' });
  }
});

app.put(['/portfolios/:uuid', '/api/portfolios/:uuid'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid } = req.params;
    const { title, description, image, strategy } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    // Check ownership before update
    const checkResult = await query(
      `SELECT p.id FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (checkResult.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    const result = await query(
      `UPDATE portfolios 
       SET title = $1, description = $2, image_url = $3, strategy = $4
       WHERE uuid = $5 
       RETURNING *`,
      [title, description, image, strategy, uuid]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      uuid: row.uuid,
      title: row.title,
      description: row.description,
      image: row.image_url,
      strategy: row.strategy,
      value: parseFloat(row.current_value)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update portfolio' });
  }
});

app.delete(['/portfolios/:uuid', '/api/portfolios/:uuid'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid } = req.params;

    // Check ownership before delete
    const checkResult = await query(
      `SELECT p.id FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (checkResult.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    await query('DELETE FROM portfolios WHERE uuid = $1', [uuid]);

    res.json({ message: 'Portfolio deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete portfolio' });
  }
});

app.get(['/portfolios/:uuid/assets', '/api/portfolios/:uuid/assets'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid } = req.params;

    const portfolioResult = await query(
      `SELECT p.id FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (portfolioResult.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    const portfolioId = portfolioResult.rows[0].id;

    let rows: any[] = [];
    try {
      const result = await query(
        `SELECT pa.secid,
                COALESCE(pa.shortname, q.shortname) AS shortname,
                pa.quantity,
                pa.buy_price,
                q.price AS current_price,
                q.isin
         FROM portfolio_assets pa
         LEFT JOIN quotes q ON q.secid = pa.secid
         WHERE pa.portfolio_id = $1
         ORDER BY shortname ASC`,
        [portfolioId]
      );
      rows = result.rows;
    } catch (e: any) {
      if (String(e?.message || '').includes('relation "portfolio_assets" does not exist')) {
        await ensurePortfolioAssetsTable();
        rows = [];
      } else {
        throw e;
      }
    }

    const data = rows.map((r) => {
      const quantity = parseFloat(r.quantity || 0);
      const buyPrice = parseFloat(r.buy_price || 0);
      const currentPrice = r.current_price != null ? parseFloat(r.current_price) : null;
      const purchaseCost = quantity && buyPrice ? quantity * buyPrice : null;
      const currentCost = quantity && currentPrice != null ? quantity * currentPrice : null;
      const changeAbs =
        currentCost != null && purchaseCost != null ? currentCost - purchaseCost : null;
      const changePct =
        buyPrice > 0 && currentPrice != null ? ((currentPrice / buyPrice) - 1) * 100 : null;

      return {
        secid: r.secid,
        shortname: r.shortname || r.secid,
        isin: r.isin || null,
        quantity: quantity || 0,
        buy_price: buyPrice || 0,
        purchase_cost: purchaseCost,
        current_price: currentPrice,
        current_cost: currentCost,
        change_abs: changeAbs,
        change_pct: changePct
      };
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch portfolio assets' });
  }
});

app.post(['/portfolios/:uuid/assets', '/api/portfolios/:uuid/assets'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid } = req.params;
    const { secid, quantity, buy_price, shortname } = req.body || {};

    const secidValue = String(secid || '').trim().toUpperCase();
    const quantityValue = Number(quantity);
    const buyPriceValue = Number(buy_price);

    if (!secidValue) {
      res.status(400).json({ error: 'secid is required' });
      return;
    }
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      res.status(400).json({ error: 'quantity must be a positive number' });
      return;
    }
    if (!Number.isFinite(buyPriceValue) || buyPriceValue <= 0) {
      res.status(400).json({ error: 'buy_price must be a positive number' });
      return;
    }

    const portfolioResult = await query(
      `SELECT p.id FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (portfolioResult.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    const portfolioId = portfolioResult.rows[0].id;
    await ensurePortfolioAssetsTable();

    const result = await query(
      `INSERT INTO portfolio_assets (portfolio_id, secid, shortname, quantity, buy_price)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (portfolio_id, secid)
       DO UPDATE SET
         shortname = COALESCE(EXCLUDED.shortname, portfolio_assets.shortname),
         buy_price = CASE
           WHEN (portfolio_assets.quantity + EXCLUDED.quantity) = 0 THEN portfolio_assets.buy_price
           ELSE ((portfolio_assets.quantity * portfolio_assets.buy_price) + (EXCLUDED.quantity * EXCLUDED.buy_price)) / (portfolio_assets.quantity + EXCLUDED.quantity)
         END,
         quantity = portfolio_assets.quantity + EXCLUDED.quantity
       RETURNING id, portfolio_id, secid, shortname, quantity, buy_price, created_at`,
      [portfolioId, secidValue, shortname ? String(shortname) : null, quantityValue, buyPriceValue]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      secid: row.secid,
      shortname: row.shortname || row.secid,
      quantity: parseFloat(row.quantity || 0),
      buy_price: parseFloat(row.buy_price || 0),
      created_at: row.created_at
    });

    try {
      const summary = await buildPortfolioAssetsSummary(portfolioId);
      await appendPortfolioSystemMessage(portfolioId, `Обновление портфеля: добавлена позиция ${secidValue}.\n\n${summary}`);
    } catch (e) {
      console.error('Failed to append system summary after add:', e);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add portfolio asset' });
  }
});

app.put(['/portfolios/:uuid/assets/:secid', '/api/portfolios/:uuid/assets/:secid'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid, secid } = req.params;
    const { quantity, buy_price, shortname } = req.body || {};

    const secidValue = String(secid || '').trim().toUpperCase();
    const quantityValue = Number(quantity);
    const buyPriceValue = Number(buy_price);

    if (!secidValue) {
      res.status(400).json({ error: 'secid is required' });
      return;
    }
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      res.status(400).json({ error: 'quantity must be a positive number' });
      return;
    }
    if (!Number.isFinite(buyPriceValue) || buyPriceValue <= 0) {
      res.status(400).json({ error: 'buy_price must be a positive number' });
      return;
    }

    const portfolioResult = await query(
      `SELECT p.id FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (portfolioResult.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    const portfolioId = portfolioResult.rows[0].id;
    await ensurePortfolioAssetsTable();

    const updateResult = await query(
      `UPDATE portfolio_assets
       SET quantity = $3,
           buy_price = $4,
           shortname = COALESCE($5, shortname)
       WHERE portfolio_id = $1 AND secid = $2
       RETURNING id, portfolio_id, secid, shortname, quantity, buy_price, created_at`,
      [portfolioId, secidValue, quantityValue, buyPriceValue, shortname ? String(shortname) : null]
    );

    if (updateResult.rows.length === 0) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    const row = updateResult.rows[0];
    res.json({
      id: row.id,
      secid: row.secid,
      shortname: row.shortname || row.secid,
      quantity: parseFloat(row.quantity || 0),
      buy_price: parseFloat(row.buy_price || 0),
      created_at: row.created_at
    });

    try {
      const summary = await buildPortfolioAssetsSummary(portfolioId);
      await appendPortfolioSystemMessage(portfolioId, `Обновление портфеля: изменена позиция ${secidValue}.\n\n${summary}`);
    } catch (e) {
      console.error('Failed to append system summary after update:', e);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update portfolio asset' });
  }
});

app.post(['/portfolios/:uuid/assets/delete', '/api/portfolios/:uuid/assets/delete'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid } = req.params;
    const { secids } = req.body || {};

    const list = Array.isArray(secids) ? secids : [];
    const normalized = Array.from(
      new Set(
        list
          .map((s) => String(s || '').trim().toUpperCase())
          .filter(Boolean)
      )
    );

    if (normalized.length === 0) {
      res.status(400).json({ error: 'secids must be a non-empty array' });
      return;
    }

    const portfolioResult = await query(
      `SELECT p.id FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (portfolioResult.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    const portfolioId = portfolioResult.rows[0].id;
    await ensurePortfolioAssetsTable();

    const result = await query(
      'DELETE FROM portfolio_assets WHERE portfolio_id = $1 AND secid = ANY($2::text[])',
      [portfolioId, normalized]
    );

    res.json({ deleted: result.rowCount || 0 });

    try {
      const summary = await buildPortfolioAssetsSummary(portfolioId);
      await appendPortfolioSystemMessage(portfolioId, `Обновление портфеля: удалены позиции ${normalized.join(', ')}.\n\n${summary}`);
    } catch (e) {
      console.error('Failed to append system summary after delete:', e);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete portfolio assets' });
  }
});

// ---------- Portfolio Dynamics (aggregated chart) ----------
const DYNAMICS_PERIODS: Record<string, { interval: number; duration: number }> = {
  '1D': { interval: 10, duration: 1 },
  '1W': { interval: 60, duration: 7 },
  '1M': { interval: 24, duration: 30 },
  '6M': { interval: 24, duration: 180 },
  '1Y': { interval: 24, duration: 365 },
  'ALL': { interval: 31, duration: 365 * 5 }
};

// Simple in-memory cache for board lookups (secid -> board info)
const boardCache = new Map<string, { engine: string; market: string; boardid: string }>();

async function resolveMoexBoard(secid: string) {
  if (boardCache.has(secid)) return boardCache.get(secid)!;
  try {
    const res = await axios.get(`https://iss.moex.com/iss/securities/${secid}.json?iss.meta=off&iss.only=boards`);
    const columns = res.data?.boards?.columns || [];
    const rows = res.data?.boards?.data || [];
    const boards = rows.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
      return obj;
    });
    let target = boards.find((b: any) => b.is_primary === 1);
    if (!target) target = boards.find((b: any) => ['TQBR', 'TQCB', 'TQOB', 'TQTF'].includes(b.boardid));
    if (!target && boards.length > 0) target = boards[0];
    if (!target) return null;
    const info = { engine: target.engine, market: target.market, boardid: target.boardid };
    boardCache.set(secid, info);
    return info;
  } catch (e) {
    console.error(`Failed to resolve board for ${secid}:`, e);
    return null;
  }
}

function parseMoexTable(json: any, tableName: string) {
  if (!json || !json[tableName]) return [];
  const columns = json[tableName].columns;
  const data = json[tableName].data;
  return data.map((row: any[]) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
    return obj;
  });
}

app.get(['/portfolios/:uuid/dynamics', '/api/portfolios/:uuid/dynamics'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) { res.status(500).json({ error: 'Internal server configuration error' }); return; }

    let decoded: any;
    try { decoded = jwt.verify(token, JWT_SECRET); } catch { res.status(401).json({ error: 'Invalid token' }); return; }

    const email = decoded.email;
    const { uuid } = req.params;
    const periodKey = String(req.query.period || '1Y').toUpperCase();
    const periodConfig = DYNAMICS_PERIODS[periodKey] || DYNAMICS_PERIODS['1Y'];

    const portfolioResult = await query(
      `SELECT p.id FROM portfolios p JOIN users u ON p.user_id = u.id WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );
    if (portfolioResult.rows.length === 0) { res.status(403).json({ error: 'Access denied or portfolio not found' }); return; }
    const portfolioId = portfolioResult.rows[0].id;

    // Get portfolio assets
    let assetsRows: any[] = [];
    try {
      const result = await query(
        `SELECT pa.secid, pa.quantity, pa.buy_price, q.price AS current_price
         FROM portfolio_assets pa LEFT JOIN quotes q ON q.secid = pa.secid
         WHERE pa.portfolio_id = $1 AND pa.quantity > 0`,
        [portfolioId]
      );
      assetsRows = result.rows;
    } catch (e: any) {
      if (String(e?.message || '').includes('relation "portfolio_assets" does not exist')) {
        assetsRows = [];
      } else throw e;
    }

    if (assetsRows.length === 0) {
      res.json({ points: [], totalCurrent: 0, totalPurchase: 0, changeAbs: 0, changePct: 0 });
      return;
    }

    const till = new Date();
    const from = new Date();
    from.setDate(from.getDate() - periodConfig.duration);
    const fromStr = from.toISOString().split('T')[0];
    const tillStr = till.toISOString().split('T')[0];

    // Fetch candle data for each asset in parallel
    const assetCandles = await Promise.all(assetsRows.map(async (asset) => {
      const quantity = parseFloat(asset.quantity || 0);
      if (quantity <= 0) return { secid: asset.secid, quantity, candles: [] };

      const board = await resolveMoexBoard(asset.secid);
      if (!board) return { secid: asset.secid, quantity, candles: [] };

      try {
        const url = `https://iss.moex.com/iss/engines/${board.engine}/markets/${board.market}/boards/${board.boardid}/securities/${asset.secid}/candles.json?from=${fromStr}&till=${tillStr}&interval=${periodConfig.interval}&iss.meta=off`;
        const candlesRes = await axios.get(url, { timeout: 10000 });
        let candles = parseMoexTable(candlesRes.data, 'candles');

        // For 1D period, filter to last trading day only
        if (periodKey === '1D' && candles.length > 0) {
          const dates = candles.map((c: any) => new Date(c.end));
          const maxDate = dates.reduce((max: Date, d: Date) => (d > max ? d : max), dates[0]);
          const maxDateStr = maxDate.toDateString();
          candles = candles.filter((c: any) => new Date(c.end).toDateString() === maxDateStr);
        }

        return { secid: asset.secid, quantity, candles };
      } catch (e) {
        console.error(`Failed to fetch candles for ${asset.secid}:`, e);
        return { secid: asset.secid, quantity, candles: [] };
      }
    }));

    // Merge all candles into a unified timeline with carry-forward
    // First, build per-asset date->close maps and collect a unified date set
    const allDates = new Set<string>();
    const assetDateMaps: { quantity: number; dateCloseMap: Map<string, number> }[] = [];

    for (const { quantity, candles } of assetCandles) {
      const dateCloseMap = new Map<string, number>();
      for (const c of candles) {
        const dateKey = periodKey === '1D'
          ? new Date(c.end).toISOString()
          : (c.end ? c.end.split(' ')[0] || c.end.split('T')[0] : c.begin?.split(' ')[0] || '');
        if (!dateKey) continue;
        const close = c.close != null ? parseFloat(c.close) : 0;
        dateCloseMap.set(dateKey, close);
        allDates.add(dateKey);
      }
      assetDateMaps.push({ quantity, dateCloseMap });
    }

    // Sort all dates
    const sortedDates = Array.from(allDates).sort();

    // For each date, sum value across all assets using carry-forward
    const points: { date: string; value: number }[] = [];
    const lastKnownPrice = new Array(assetDateMaps.length).fill(0);

    for (const date of sortedDates) {
      let totalValue = 0;
      for (let i = 0; i < assetDateMaps.length; i++) {
        const { quantity, dateCloseMap } = assetDateMaps[i];
        if (dateCloseMap.has(date)) {
          lastKnownPrice[i] = dateCloseMap.get(date)!;
        }
        totalValue += lastKnownPrice[i] * quantity;
      }
      points.push({ date, value: Math.round(totalValue * 100) / 100 });
    }

    // Compute totals
    let totalPurchase = 0;
    let totalCurrent = 0;
    for (const asset of assetsRows) {
      const qty = parseFloat(asset.quantity || 0);
      const buyPrice = parseFloat(asset.buy_price || 0);
      const curPrice = asset.current_price != null ? parseFloat(asset.current_price) : 0;
      totalPurchase += qty * buyPrice;
      totalCurrent += qty * curPrice;
    }
    const changeAbs = totalCurrent - totalPurchase;
    const changePct = totalPurchase > 0 ? ((totalCurrent / totalPurchase) - 1) * 100 : 0;

    res.json({
      points,
      totalCurrent: Math.round(totalCurrent * 100) / 100,
      totalPurchase: Math.round(totalPurchase * 100) / 100,
      changeAbs: Math.round(changeAbs * 100) / 100,
      changePct: Math.round(changePct * 100) / 100
    });
  } catch (err) {
    console.error('Failed to fetch portfolio dynamics:', err);
    res.status(500).json({ error: 'Failed to fetch portfolio dynamics' });
  }
});

app.get(['/portfolios/:uuid/chat', '/api/portfolios/:uuid/chat'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid } = req.params;

    // Check ownership and get portfolio id
    const portfolioResult = await query(
      `SELECT p.id FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (portfolioResult.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    const portfolioId = portfolioResult.rows[0].id;

    const chatResult = await query(
      "SELECT role, content, created_at FROM portfolio_chats WHERE portfolio_id = $1 AND (status = 'active' OR status IS NULL) ORDER BY created_at ASC",
      [portfolioId]
    );

    res.json(chatResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

app.post(['/portfolios/:uuid/chat/archive', '/api/portfolios/:uuid/chat/archive'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid } = req.params;

    // Check ownership and get portfolio id
    const portfolioResult = await query(
      `SELECT p.id FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (portfolioResult.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    const portfolioId = portfolioResult.rows[0].id;

    const result = await query(
      "UPDATE portfolio_chats SET status = 'archived' WHERE portfolio_id = $1",
      [portfolioId]
    );
    console.log(`Archived ${result.rowCount} messages for portfolio ${portfolioId}`);

    res.json({ message: 'Chat history archived successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to archive chat history' });
  }
});

app.get(['/portfolios/:uuid/chat/stream', '/api/portfolios/:uuid/chat/stream'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid } = req.params;
    const content = String(req.query.content || '').trim();

    if (!content) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // Check ownership and get portfolio details
    const portfolioResult = await query(
      `SELECT p.id, p.title, p.description, p.strategy FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (portfolioResult.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    const portfolio = portfolioResult.rows[0];
    const portfolioId = portfolio.id;

    // Store user message
    await query(
      'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
      [portfolioId, 'user', content]
    );

    // Get chat history for context
    const chatHistory = await query(
      "SELECT role, content FROM portfolio_chats WHERE portfolio_id = $1 AND (status = 'active' OR status IS NULL) ORDER BY created_at ASC",
      [portfolioId]
    );

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      res.status(500).json({ error: 'DeepSeek API key is not configured' });
      return;
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if ((res as any).flushHeaders) (res as any).flushHeaders();

    // Abort controller for DeepSeek API — aborts on timeout or client disconnect
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let clientDisconnected = false;

    req.on('close', () => {
      clientDisconnected = true;
      controller.abort();
      clearTimeout(timeout);
    });

    const send = (data: string) => {
      if (clientDisconnected) return;
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (e) {
        clientDisconnected = true;
        controller.abort();
      }
    };

    let portfolioContext = '';
    try {
      portfolioContext = await buildPortfolioAssetsSummary(portfolioId);
    } catch (e) {
      console.error('Failed to build portfolio summary for prompt:', e);
    }

    const messages = [
      {
        role: 'system',
        content: `${getSystemPrompt(portfolio)}\n\n${portfolioContext ? `Состав портфеля (актуально):\n${portfolioContext}` : ''}`.trim()
      },
      ...chatHistory.rows.map(row => ({ role: row.role, content: row.content }))
    ];

    try {
      const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'User-Agent': 'ProfitCase/1.0'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          max_tokens: 2000,
          stream: true
        }),
        signal: controller.signal
      });

      let assistantContent = '';
      if (!aiResponse.ok || !aiResponse.body) {
        const errorText = await aiResponse.text().catch(() => '');
        console.error('DeepSeek API error (SSE):', errorText);
        // Fallback: request non-streaming response
        try {
          const fallbackResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages,
              max_tokens: 1200,
              stream: false
            })
          });
          const fbText = await fallbackResp.text();
          if (fallbackResp.ok) {
            const fbJson = JSON.parse(fbText);
            const content = fbJson.choices?.[0]?.message?.content || '';
            if (content) {
              assistantContent += content;
              send(content);
              // Save and finish
              await query(
                'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
                [portfolioId, 'assistant', assistantContent]
              );
              send('[DONE]');
              res.end();
              return;
            }
          }
          send(JSON.stringify({ type: 'error', message: 'AI non-streaming fallback failed', detail: fbText.slice(0, 500) }));
        } catch (fbErr: any) {
          send(JSON.stringify({ type: 'error', message: 'AI fallback exception', detail: fbErr?.message }));
        }
        res.end();
        return;
      }

      let buffer = '';

      // Use Web ReadableStream reader to avoid async-iterability issues
      const reader = (aiResponse.body as ReadableStream).getReader();
      const decoder = new TextDecoder('utf-8');
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        buffer += chunkStr;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          if (line.trim() === 'data: [DONE]') continue;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta?.content || '';
              if (delta) {
                assistantContent += delta;
                // Send plain text chunk as SSE data line
                send(delta);
              }
            } catch (e) {
              console.error('Chunk parse error (SSE):', e);
            }
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim() && buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          const delta = data.choices?.[0]?.delta?.content || '';
          if (delta) {
            assistantContent += delta;
            send(delta);
          }
        } catch (e) {
          console.error('Final chunk parse error (SSE):', e);
        }
      }

      // Save assistant message
      if (assistantContent) {
        await query(
          'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
          [portfolioId, 'assistant', assistantContent]
        );
      }

      // Signal done
      clearTimeout(timeout);
      send('[DONE]');
      if (!clientDisconnected) res.end();
    } catch (err: any) {
      clearTimeout(timeout);
      console.error('DeepSeek SSE error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      // Fallback inside catch
      try {
        const fallbackResp = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-chat',
          messages,
          max_tokens: 1200,
          stream: false
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'User-Agent': 'ProfitCase/1.0'
          }
        });

        const content = fallbackResp.data.choices?.[0]?.message?.content || '';
        if (content) {
          await query(
            'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
            [portfolioId, 'assistant', content]
          );
          send(content);
          send('[DONE]');
          res.end();
          return;
        }
        send(JSON.stringify({ type: 'error', message: 'AI streaming failed', detail: 'Empty response from fallback' }));
      } catch (fbErr: any) {
        const detail = fbErr.response?.data ? JSON.stringify(fbErr.response.data) : fbErr.message;
        try { send(JSON.stringify({ type: 'error', message: 'AI streaming failed', detail })); } catch { }
      }
      if (!clientDisconnected) res.end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process chat message (stream)' });
  }
});

// --- File upload for chat analysis ---
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls', '.txt', '.md', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Неподдерживаемый формат файла: ${ext}. Допустимые: ${allowed.join(', ')}`));
    }
  }
});

async function extractTextFromFile(buffer: Buffer, originalname: string): Promise<string> {
  const ext = path.extname(originalname).toLowerCase();

  if (ext === '.csv') {
    const text = buffer.toString('utf-8');
    try {
      const records = csvParse(text, { delimiter: [',', ';', '\t'], relax_column_count: true, skip_empty_lines: true });
      return records.map((row: string[]) => row.join(' | ')).join('\n');
    } catch {
      return text; // return raw text if CSV parsing fails
    }
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const lines: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ' | ' });
      if (workbook.SheetNames.length > 1) {
        lines.push(`--- Лист: ${sheetName} ---`);
      }
      lines.push(csv);
    }
    return lines.join('\n');
  }

  // .txt, .md — plain text
  if (ext === '.txt' || ext === '.md') {
    return buffer.toString('utf-8');
  }

  // .pdf
  if (ext === '.pdf') {
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  return buffer.toString('utf-8');
}

app.post(['/portfolios/:uuid/chat/upload', '/api/portfolios/:uuid/chat/upload'], (req: any, res, next) => {
  chatUpload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Файл слишком большой. Максимум 5 МБ.' });
      }
      return res.status(400).json({ error: err.message || 'Ошибка загрузки файла' });
    }
    next();
  });
}, async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) { res.status(500).json({ error: 'Internal server configuration error' }); return; }

    try { jwt.verify(token, JWT_SECRET); } catch { res.status(401).json({ error: 'Invalid token' }); return; }

    if (!req.file) {
      res.status(400).json({ error: 'Файл не загружен' });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

    if (imageExts.includes(ext)) {
      // OCR: extract text from image
      try {
        const { data: { text: ocrText } } = await Tesseract.recognize(req.file.buffer, 'rus+eng');
        res.json({
          fileName: req.file.originalname,
          text: (ocrText || '').trim().slice(0, 15000)
        });
      } catch (ocrErr) {
        console.error('OCR error:', ocrErr);
        res.status(500).json({ error: 'Не удалось распознать текст на изображении' });
      }
    } else {
      const text = await extractTextFromFile(req.file.buffer, req.file.originalname);
      res.json({
        fileName: req.file.originalname,
        text: text.slice(0, 15000)
      });
    }
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Ошибка при обработке файла' });
  }
});

app.post(['/portfolios/:uuid/chat/stream', '/api/portfolios/:uuid/chat/stream'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid } = req.params;
    const { content, fileContent, fileName } = req.body || {};

    if ((!content || typeof content !== 'string' || !content.trim()) && !fileContent) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // Build the actual message: file content + user text
    let userMessage = (content || '').trim();
    if (fileContent && typeof fileContent === 'string') {
      const filePart = `Пользователь отправил файл «${fileName || 'файл'}»:\n\n${fileContent}`;
      userMessage = userMessage
        ? `${filePart}\n\nКомментарий пользователя: ${userMessage}`
        : filePart;
    }

    const portfolioResult = await query(
      `SELECT p.id, p.title, p.description, p.strategy FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (portfolioResult.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    const portfolio = portfolioResult.rows[0];
    const portfolioId = portfolio.id;

    await query(
      'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
      [portfolioId, 'user', userMessage]
    );

    const chatHistory = await query(
      "SELECT role, content FROM portfolio_chats WHERE portfolio_id = $1 AND (status = 'active' OR status IS NULL) ORDER BY created_at ASC",
      [portfolioId]
    );

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      res.status(500).json({ error: 'DeepSeek API key is not configured' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if ((res as any).flushHeaders) (res as any).flushHeaders();

    // Abort controller for DeepSeek API — aborts on timeout or client disconnect
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let clientDisconnected = false;

    req.on('close', () => {
      clientDisconnected = true;
      controller.abort();
      clearTimeout(timeout);
    });

    const send = (data: string) => {
      if (clientDisconnected) return;
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (e) {
        clientDisconnected = true;
        controller.abort();
      }
    };

    const history = chatHistory.rows;
    const limitedHistory = history.slice(Math.max(history.length - 30, 0));

    // Clean history
    const cleanHistory = limitedHistory.map(row => {
      let content = row.content;
      content = content.replace(/```(?:json)?\s*(\{[\s\S]*?"action":\s*"set_strategy"[\s\S]*?\})\s*```/gi, '');
      content = content.replace(/({[\s\S]*?"action":\s*"set_strategy"[\s\S]*?})/gi, '');
      content = content.replace(/```json\s*\n\s*{\s*"action":\s*"SET_STRATEGY"[\s\S]*?}\s*\n\s*```/gi, '');
      return { role: row.role, content: content.trim() };
    }).filter(msg => msg.content.length > 0);

    let portfolioContext = '';
    try {
      portfolioContext = await buildPortfolioAssetsSummary(portfolioId);
    } catch (e) {
      console.error('Failed to build portfolio summary for prompt:', e);
    }

    const messages: any[] = [
      {
        role: 'system',
        content: `${getSystemPrompt(portfolio)}\n\n${portfolioContext ? `Состав портфеля (актуально):\n${portfolioContext}` : ''}`.trim()
      },
      ...cleanHistory
    ];

    const tools = getToolDefinitions();

    try {
      const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'User-Agent': 'ProfitCase/1.0'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          max_tokens: 2000,
          stream: true,
          tools: tools,
          tool_choice: 'auto'
        }),
        signal: controller.signal
      });

      let assistantContent = '';
      if (!aiResponse.ok || !aiResponse.body) {
        const errorText = await aiResponse.text().catch(() => '');
        // Fallback: request non-streaming response
        try {
          const fallbackResp = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages,
            max_tokens: 1200,
            stream: false
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
              'User-Agent': 'ProfitCase/1.0'
            }
          });

          const content = fallbackResp.data.choices?.[0]?.message?.content || '';
          if (content) {
            assistantContent += content;
            send(content);
            await query(
              'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
              [portfolioId, 'assistant', assistantContent]
            );
            send('[DONE]');
            res.end();
            return;
          }
          send(JSON.stringify({ type: 'error', message: 'AI streaming failed', detail: 'Empty response from fallback' }));
        } catch (fbErr: any) {
          const detail = fbErr.response?.data ? JSON.stringify(fbErr.response.data) : fbErr.message;
          try { send(JSON.stringify({ type: 'error', message: 'AI streaming failed', detail })); } catch { }
        }
        res.end();
        return;
      }

      let buffer = '';
      // Accumulate multiple tool calls by index
      const toolCalls: Record<number, { name: string; arguments: string }> = {};

      const reader = (aiResponse.body as ReadableStream).getReader();
      const decoder = new TextDecoder('utf-8');
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        buffer += chunkStr;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          if (line.trim() === 'data: [DONE]') continue;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta;

              if (delta) {
                if (delta.content) {
                  assistantContent += delta.content;
                  send(delta.content);
                }

                if (delta.tool_calls) {
                  delta.tool_calls.forEach((toolCall: any) => {
                    const idx = toolCall.index ?? 0;
                    if (!toolCalls[idx]) {
                      toolCalls[idx] = { name: '', arguments: '' };
                    }
                    if (toolCall.function) {
                      if (toolCall.function.name) {
                        toolCalls[idx].name = toolCall.function.name;
                        console.log(`Stream Tool call [${idx}]:`, toolCalls[idx].name);
                      }
                      if (toolCall.function.arguments) {
                        toolCalls[idx].arguments += toolCall.function.arguments;
                      }
                    }
                  });
                }
              }
            } catch (e) {
              console.error('Error parsing stream chunk:', e);
            }
          }
        }
      }

      // Process all tool calls
      const toolCallEntries = Object.values(toolCalls).filter(tc => tc.name);
      if (toolCallEntries.length > 0) {
        console.log(`Processing ${toolCallEntries.length} tool call(s)`);
        const sendNotification = (notification: object) => {
          if (clientDisconnected) return;
          try {
            res.write(`data: ${JSON.stringify(notification)}\n\n`);
          } catch (e) { clientDisconnected = true; }
        };

        for (const tc of toolCallEntries) {
          console.log('Executing tool call:', tc.name, tc.arguments);
          if (tc.name === 'set_strategy') {
            try {
              const args = JSON.parse(tc.arguments);
              if (args.strategy) {
                console.log('Updating strategy via tool call');
                await query(
                  'UPDATE portfolios SET strategy = $1 WHERE id = $2',
                  [args.strategy, portfolioId]
                );
              }
            } catch (e) {
              console.error('Failed to parse tool arguments:', e);
            }
          } else if (['add_asset', 'edit_asset', 'remove_asset', 'bulk_add_assets'].includes(tc.name)) {
            await executeAssetToolCall(tc.name, tc.arguments, portfolioId, sendNotification);
          }
        }
      } else {
        // Fallback check: sometimes the model just outputs JSON in the content
        try {
          const jsonRegex = /({[\s\S]*?"action":\s*"set_strategy"[\s\S]*?})/i;
          const match = assistantContent.match(jsonRegex);
          if (match) {
            console.log('Found fallback JSON in content');
            try {
              const action = JSON.parse(match[1]);
              if (action.strategy) {
                console.log('Updating strategy via fallback JSON');
                await query(
                  'UPDATE portfolios SET strategy = $1 WHERE id = $2',
                  [action.strategy, portfolioId]
                );
              }
            } catch (e) {
              console.error('Failed to parse fallback JSON strict:', e);
            }
          }
        } catch (e) {
          console.error('Failed to parse fallback JSON regex:', e);
        }
      }

      if (assistantContent) {
        await query(
          'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
          [portfolioId, 'assistant', assistantContent]
        );
      }

      clearTimeout(timeout);
      send('[DONE]');
      if (!clientDisconnected) res.end();
    } catch (err: any) {
      clearTimeout(timeout);
      console.error('DeepSeek SSE error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      // Fallback inside catch
      try {
        const fallbackResp = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-chat',
          messages,
          max_tokens: 1200,
          stream: false
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'User-Agent': 'ProfitCase/1.0'
          }
        });
        const content = fallbackResp.data.choices?.[0]?.message?.content || '';
        if (content) {
          await query(
            'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
            [portfolioId, 'assistant', content]
          );
          send(content);
          send('[DONE]');
          res.end();
          return;
        }
        send(JSON.stringify({ type: 'error', message: 'AI streaming failed', detail: 'Empty response from fallback' }));
      } catch (fbErr: any) {
        const detail = fbErr.response?.data ? JSON.stringify(fbErr.response.data) : fbErr.message;
        try { send(JSON.stringify({ type: 'error', message: 'AI streaming failed', detail })); } catch { }
      }
      if (!clientDisconnected) res.end();
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to process chat message (stream)' });
  }
});

app.post(['/portfolios/:uuid/chat', '/api/portfolios/:uuid/chat'], async (req: any, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'Internal server configuration error' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const email = decoded.email;
    const { uuid } = req.params;
    const { content } = req.body;

    console.log(`Received chat message for portfolio ${uuid}: ${content.substring(0, 50)}...`);

    if (!content) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // Check ownership and get portfolio details
    const portfolioResult = await query(
      `SELECT p.id, p.title, p.description, p.strategy FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.email = $1 AND p.uuid = $2`,
      [email, uuid]
    );

    if (portfolioResult.rows.length === 0) {
      res.status(403).json({ error: 'Access denied or portfolio not found' });
      return;
    }

    const portfolio = portfolioResult.rows[0];
    const portfolioId = portfolio.id;

    // Store user message
    await query(
      'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
      [portfolioId, 'user', content]
    );

    // Get chat history for context
    const chatHistory = await query(
      'SELECT role, content FROM portfolio_chats WHERE portfolio_id = $1 ORDER BY created_at ASC',
      [portfolioId]
    );

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
      res.status(500).json({ error: 'DeepSeek API key is not configured' });
      return;
    }

    // Build context prompt
    let portfolioContext = '';
    try {
      portfolioContext = await buildPortfolioAssetsSummary(portfolioId);
    } catch (e) {
      console.error('Failed to build portfolio summary for prompt:', e);
    }

    // Call DeepSeek API
    const cleanHistory = chatHistory.rows.map(row => {
      let content = row.content;
      // Remove legacy strategy JSON blocks to prevent model confusion
      content = content.replace(/```(?:json)?\s*(\{[\s\S]*?"action":\s*"set_strategy"[\s\S]*?\})\s*```/gi, '');
      content = content.replace(/({[\s\S]*?"action":\s*"set_strategy"[\s\S]*?})/gi, '');
      // Also remove the old SET_STRATEGY block if present (from previous attempts)
      content = content.replace(/```json\s*\n\s*{\s*"action":\s*"SET_STRATEGY"[\s\S]*?}\s*\n\s*```/gi, '');
      return { role: row.role, content: content.trim() };
    }).filter(msg => msg.content.length > 0);

    const messages = [
      {
        role: 'system',
        content: `${getSystemPrompt(portfolio)}\n\n${portfolioContext ? `Состав портфеля (актуально):\n${portfolioContext}` : ''}`.trim()
      },
      ...cleanHistory
    ];

    const tools = getToolDefinitions();

    try {
      const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: messages,
          max_tokens: 2000,
          stream: true,
          tools: tools,
          tool_choice: 'auto'
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('DeepSeek API error:', errorText);
        res.status(500).json({ error: 'Failed to get response from AI' });
        return;
      }

      if (!aiResponse.body) {
        console.error('DeepSeek API response has no body');
        res.status(500).json({ error: 'Failed to get response from AI' });
        return;
      }

      // Let's use raw text chunks for simplicity on client side as per user request "type like other AI chats"
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      // Flush headers immediately
      if (res.flushHeaders) res.flushHeaders();

      let assistantContent = '';
      // Accumulate multiple tool calls by index
      const toolCalls: Record<number, { name: string; arguments: string }> = {};
      let buffer = '';

      console.log('Starting stream from DeepSeek...');

      // Iterate over the stream
      // @ts-ignore: fetch is global in Node 18+ and body is iterable
      for await (const chunk of aiResponse.body) {
        const chunkStr = Buffer.from(chunk).toString('utf8');
        buffer += chunkStr;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') continue;

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices[0]?.delta;

              if (delta) {
                // Handle text content
                if (delta.content) {
                  assistantContent += delta.content;
                  res.write(delta.content);
                }

                // Handle tool calls
                if (delta.tool_calls) {
                  delta.tool_calls.forEach((toolCall: any) => {
                    const idx = toolCall.index ?? 0;
                    if (!toolCalls[idx]) {
                      toolCalls[idx] = { name: '', arguments: '' };
                    }
                    if (toolCall.function) {
                      if (toolCall.function.name) {
                        toolCalls[idx].name = toolCall.function.name;
                        console.log(`Tool call name received [${idx}]:`, toolCalls[idx].name);
                      }
                      if (toolCall.function.arguments) {
                        toolCalls[idx].arguments += toolCall.function.arguments;
                      }
                    }
                  });
                }
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      // Process all tool calls
      const toolCallEntries = Object.values(toolCalls).filter(tc => tc.name);
      if (toolCallEntries.length > 0) {
        console.log(`Processing ${toolCallEntries.length} tool call(s)`);
        for (const tc of toolCallEntries) {
          console.log('Executing tool call:', tc.name, tc.arguments);
          if (tc.name === 'set_strategy') {
            try {
              const args = JSON.parse(tc.arguments);
              if (args.strategy) {
                console.log('Updating strategy via tool call');
                await query(
                  'UPDATE portfolios SET strategy = $1 WHERE id = $2',
                  [args.strategy, portfolioId]
                );
              }
            } catch (e) {
              console.error('Failed to parse tool arguments:', e);
            }
          } else if (['add_asset', 'edit_asset', 'remove_asset', 'bulk_add_assets'].includes(tc.name)) {
            await executeAssetToolCall(tc.name, tc.arguments, portfolioId);
          }
        }
      } else {
        // Fallback check: sometimes the model just outputs JSON in the content
        // if it fails to use tool calls properly
        try {
          // Try to find JSON with action: set_strategy, even if not in markdown block
          const jsonRegex = /({[\s\S]*?"action":\s*"set_strategy"[\s\S]*?})/i;
          const match = assistantContent.match(jsonRegex);
          if (match) {
            console.log('Found fallback JSON in content');
            // Try to parse the found JSON string
            // It might be surrounded by other text, so we might need to be careful
            // But let's try strict parse first
            try {
              const action = JSON.parse(match[1]);
              if (action.strategy) {
                console.log('Updating strategy via fallback JSON');
                await query(
                  'UPDATE portfolios SET strategy = $1 WHERE id = $2',
                  [action.strategy, portfolioId]
                );
              }
            } catch (e) {
              console.error('Failed to parse fallback JSON strict:', e);
              // If strict parse fails, maybe we captured too much or too little?
              // For now, let's rely on tool calls primarily.
            }
          }
        } catch (e) {
          console.error('Failed to parse fallback JSON regex:', e);
        }
      }

      if (assistantContent) {
        // Store assistant message
        await query(
          'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
          [portfolioId, 'assistant', assistantContent]
        );
      }
      res.end();

    } catch (aiErr: any) {
      console.error('DeepSeek API error:', aiErr.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to get response from AI' });
      } else {
        res.end();
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process chat message' });
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

// Ensure required tables exist
(async () => {
  await ensurePortfolioAssetsTable();
})();
