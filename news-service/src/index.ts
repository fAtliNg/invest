import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import 'dotenv/config';

import { query } from './db';
import { fetchAllNews } from './rss-fetcher';
import { processNews } from './ai-processor';
import { generateDigestText } from './digest-generator';

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'news-service' });
});

// GET /news — list news with pagination, optional category and source filters
app.get('/news', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = parseInt(req.query.offset as string) || 0;
        const category = req.query.category as string | undefined;
        const source = req.query.source as string | undefined;

        const conditions: string[] = [];
        const params: any[] = [];
        let paramIdx = 1;

        if (category) {
            conditions.push(`category = $${paramIdx++}`);
            params.push(category);
        }
        if (source) {
            conditions.push(`source = $${paramIdx++}`);
            params.push(source);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
      SELECT id, external_id, source, title, description, link, image_url, category, author, tags, published_at, created_at
      FROM news
      ${whereClause}
      ORDER BY published_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
        params.push(limit, offset);

        const result = await query(sql, params);

        // Total count
        const countSql = `SELECT COUNT(*) FROM news ${whereClause}`;
        const countParams = params.slice(0, conditions.length);
        const countResult = await query(countSql, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            data: result.rows,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        });
    } catch (err: any) {
        console.error('[API] Error fetching news:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /news/:id — single news item with full text
app.get('/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM news WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'News not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (err: any) {
        console.error('[API] Error fetching news item:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /categories — list all categories with counts
app.get('/categories', async (_req, res) => {
    try {
        const result = await query(`
      SELECT category, COUNT(*) as count
      FROM news
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);
        res.json(result.rows);
    } catch (err: any) {
        console.error('[API] Error fetching categories:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /sources — list all sources with counts
app.get('/sources', async (_req, res) => {
    try {
        const result = await query(`
      SELECT source, COUNT(*) as count
      FROM news
      GROUP BY source
      ORDER BY count DESC
    `);
        res.json(result.rows);
    } catch (err: any) {
        console.error('[API] Error fetching sources:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /digest — unified news digest text for the last week
app.get('/digest', async (_req, res) => {
    try {
        const text = await generateDigestText();
        res.type('text/plain; charset=utf-8').send(text);
    } catch (err: any) {
        console.error('[API] Error generating digest:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /digest/json — digest as JSON
app.get('/digest/json', async (_req, res) => {
    try {
        const result = await query(
            `SELECT digest_date, content, source_news_ids, created_at
             FROM news_digest
             WHERE digest_date >= CURRENT_DATE - 7
             ORDER BY digest_date DESC, created_at ASC`
        );
        res.json(result.rows);
    } catch (err: any) {
        console.error('[API] Error fetching digest JSON:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`News Service running on port ${PORT}`);

    // Fetch + process chain
    async function fetchAndProcess() {
        await fetchAllNews();
        await processNews();
    }

    // Initial run on startup
    console.log('[CRON] Running initial fetch + AI processing...');
    fetchAndProcess().catch(err => console.error('[CRON] Initial run failed:', err));

    // Schedule every minute: fetch RSS then immediately process new items through AI
    cron.schedule('* * * * *', () => {
        console.log('[CRON] Scheduled fetch + AI processing triggered');
        fetchAndProcess().catch(err => console.error('[CRON] Scheduled run failed:', err));
    });
    console.log('[CRON] Scheduled fetch + AI processing every minute');
});
