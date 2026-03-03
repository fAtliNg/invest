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
      `SELECT p.* FROM portfolios p 
       JOIN users u ON p.user_id = u.id 
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
      value: parseFloat(row.current_value)
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
    const { title, description, image } = req.body;

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
      `INSERT INTO portfolios (user_id, title, description, image_url, current_value)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING *`,
      [userId, title, description, image]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      uuid: row.uuid,
      title: row.title,
      description: row.description,
      image: row.image_url,
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
    const { title, description, image } = req.body;

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
       SET title = $1, description = $2, image_url = $3 
       WHERE uuid = $4 
       RETURNING *`,
      [title, description, image, uuid]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      uuid: row.uuid,
      title: row.title,
      description: row.description,
      image: row.image_url,
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
      `SELECT p.id, p.title, p.description FROM portfolios p 
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

    const send = (data: string) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const messages = [
      { 
        role: 'system', 
        content: getSystemPrompt(portfolio)
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
          model: 'deepseek-reasoner',
          messages,
          max_tokens: 2000,
          stream: true
        })
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
              model: 'deepseek-reasoner',
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
      send('[DONE]');
      res.end();
    } catch (err: any) {
      console.error('DeepSeek SSE error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      // Fallback inside catch
      try {
        const fallbackResp = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-reasoner',
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
        try { send(JSON.stringify({ type: 'error', message: 'AI streaming failed', detail })); } catch {}
      }
      res.end();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process chat message (stream)' });
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
    const { content } = req.body || {};

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const portfolioResult = await query(
      `SELECT p.id, p.title, p.description FROM portfolios p 
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
      [portfolioId, 'user', content]
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

    const send = (data: string) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const history = chatHistory.rows;
    const limitedHistory = history.slice(Math.max(history.length - 30, 0));

    const messages = [
      { 
        role: 'system', 
        content: getSystemPrompt(portfolio)
      },
      ...limitedHistory.map(row => ({ role: row.role, content: row.content }))
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
          model: 'deepseek-reasoner',
          messages,
          max_tokens: 2000,
          stream: true
        })
      });

      let assistantContent = '';
      if (!aiResponse.ok || !aiResponse.body) {
        const errorText = await aiResponse.text().catch(() => '');
        // Fallback: request non-streaming response
        try {
          const fallbackResp = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-reasoner',
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
          try { send(JSON.stringify({ type: 'error', message: 'AI streaming failed', detail })); } catch {}
        }
        res.end();
        return;
      }

      let buffer = '';

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
                send(delta);
              }
            } catch {}
          }
        }
      }

      if (buffer.trim() && buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          const delta = data.choices?.[0]?.delta?.content || '';
          if (delta) {
            assistantContent += delta;
            send(delta);
          }
        } catch {}
      }

      if (assistantContent) {
        await query(
          'INSERT INTO portfolio_chats (portfolio_id, role, content) VALUES ($1, $2, $3)',
          [portfolioId, 'assistant', assistantContent]
        );
      }

      send('[DONE]');
      res.end();
    } catch (err: any) {
      console.error('DeepSeek SSE error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      // Fallback inside catch
      try {
        const fallbackResp = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-reasoner',
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
        try { send(JSON.stringify({ type: 'error', message: 'AI streaming failed', detail })); } catch {}
      }
      res.end();
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

    if (!content) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    // Check ownership and get portfolio details
    const portfolioResult = await query(
      `SELECT p.id, p.title, p.description FROM portfolios p 
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

    // Call DeepSeek API
    const messages = [
      { 
        role: 'system', 
        content: `Ты — финансовый помощник. Отвечай строго на русском в чистом Markdown (GFM).
Всегда возвращай только Markdown без дополнительных символов и эмодзи. Следи за парностью символов форматирования (*, **, \`\`\`).
Используй списки и заголовки по необходимости, не добавляй декоративные конструкции вроде "— *".
Контекст: портфель "${portfolio.title}". Описание: "${portfolio.description}".` 
      },
      ...chatHistory.rows.map(row => ({ role: row.role, content: row.content }))
    ];

    try {
      const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-reasoner',
          messages: messages,
          max_tokens: 2000,
          stream: true
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
      let buffer = '';

      console.log('Starting stream from DeepSeek...');

      // Iterate over the stream
      // @ts-ignore: fetch is global in Node 18+ and body is iterable
      for await (const chunk of aiResponse.body) {
        const chunkStr = Buffer.from(chunk).toString('utf8');
        // console.log(`Received chunk: ${chunkStr.length} chars`);
        buffer += chunkStr;
        
        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') continue;
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                assistantContent += content;
                res.write(content);
                // Flush explicitly if possible (Node.js doesn't always need this but helps with proxies)
                // if ((res as any).flush) (res as any).flush();
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      // Process remaining buffer if any
      if (buffer.trim() && buffer.startsWith('data: ')) {
         try {
            const data = JSON.parse(buffer.slice(6));
            const content = data.choices[0]?.delta?.content || '';
            if (content) {
              assistantContent += content;
              res.write(content);
            }
         } catch (e) {
            console.error('Error parsing final chunk:', e);
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
