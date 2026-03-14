import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import 'dotenv/config';

import { query } from './db';
import { collectAll } from './collector';
import { collectMacro, getMacroData, formatMacroText } from './macro-collector';

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'fundamental-data-service' });
});

/**
 * GET /fundamentals
 * Возвращает фундаментальные данные по всем компаниям (или по конкретному тикеру).
 */
app.get('/fundamentals', async (req, res) => {
    try {
        const ticker = req.query.ticker as string | undefined;

        let sql = 'SELECT * FROM fundamentals';
        const params: any[] = [];

        if (ticker) {
            sql += ' WHERE ticker = $1';
            params.push(ticker.toUpperCase());
        }

        sql += ' ORDER BY ticker ASC';

        const result = await query(sql, params);

        if (result.rows.length === 0) {
            res.type('text/plain; charset=utf-8').send(
                ticker ? `Нет данных для тикера ${ticker}` : 'Нет данных'
            );
            return;
        }

        const lines = result.rows.map((row: any) => {
            const parts: string[] = [];

            // Цена убрана — уже доступна в других частях приложения
            if (row.p_e != null) parts.push(`P/E: ${Number(row.p_e).toFixed(1)}`);
            // P/S > 100 — аномалия (техническая ошибка Smart-lab)
            if (row.p_s != null && Math.abs(Number(row.p_s)) <= 100) {
                parts.push(`P/S: ${Number(row.p_s).toFixed(2)}`);
            }
            // EV/EBITDA и Долг/EBITDA: |x| > 20 — бессмысленен (отрицательная EBITDA)
            if (row.ev_ebitda != null && Math.abs(Number(row.ev_ebitda)) <= 20) {
                parts.push(`EV/EBITDA: ${Number(row.ev_ebitda).toFixed(1)}`);
            }
            if (row.net_debt_ebitda != null && Math.abs(Number(row.net_debt_ebitda)) <= 20) {
                parts.push(`Долг/EBITDA: ${Number(row.net_debt_ebitda).toFixed(1)}`);
            }
            if (row.roe != null) parts.push(`ROE: ${Number(row.roe).toFixed(0)}%`);
            if (row.net_income != null) {
                const ni = Number(row.net_income);
                if (Math.abs(ni) >= 1) {
                    parts.push(`Чист.прибыль: ${ni.toFixed(0)} млрд`);
                } else {
                    parts.push(`Чист.прибыль: ${(ni * 1000).toFixed(0)} млн`);
                }
            }
            // Див.доход > 50% — помечаем как аномалию
            if (row.dividend_yield != null) {
                const dy = Number(row.dividend_yield);
                if (dy > 50) {
                    parts.push(`Див.доход: ${dy.toFixed(1)}% (АНОМАЛИЯ, вероятно разовая выплата)`);
                } else {
                    parts.push(`Див.доход: ${dy.toFixed(1)}%`);
                }
            }

            if (row.report_type) parts.push(`Отчет: ${row.report_type}`);

            return `${row.ticker} ${parts.join(' | ')}`;
        });

        res.type('text/plain; charset=utf-8').send(lines.join('\n'));
    } catch (err: any) {
        console.error('[API] Error fetching fundamentals:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /fundamentals/json
 * JSON-формат для программного потребления.
 */
app.get('/fundamentals/json', async (req, res) => {
    try {
        const ticker = req.query.ticker as string | undefined;

        let sql = 'SELECT * FROM fundamentals';
        const params: any[] = [];

        if (ticker) {
            sql += ' WHERE ticker = $1';
            params.push(ticker.toUpperCase());
        }

        sql += ' ORDER BY ticker ASC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err: any) {
        console.error('[API] Error fetching fundamentals JSON:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /macro
 * Макроэкономические показатели: ключевая ставка, курсы валют, нефть, золото, индексы.
 * Формат: text/plain (для промпта ИИ).
 */
app.get('/macro', (_req, res) => {
    const data = getMacroData();
    const text = formatMacroText(data);
    if (!text) {
        res.type('text/plain; charset=utf-8').send('Макро-данные ещё не загружены');
        return;
    }
    res.type('text/plain; charset=utf-8').send(text);
});

/**
 * GET /macro/json
 * JSON-формат макро-данных.
 */
app.get('/macro/json', (_req, res) => {
    res.json(getMacroData());
});

/**
 * GET /quotes?tickers=SBER,LKOH,GAZP
 * Текущие котировки бумаг (MOEX PREVPRICE из БД).
 * Формат: text/plain (для промпта ИИ).
 */
app.get('/quotes', async (req, res) => {
    try {
        const tickersParam = req.query.tickers as string;
        if (!tickersParam) {
            res.type('text/plain; charset=utf-8').send('Укажите параметр tickers');
            return;
        }
        const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
        if (tickers.length === 0) {
            res.type('text/plain; charset=utf-8').send('Нет тикеров');
            return;
        }

        const placeholders = tickers.map((_, i) => `$${i + 1}`).join(',');
        const result = await query(
            `SELECT ticker, price FROM fundamentals WHERE ticker IN (${placeholders}) AND price IS NOT NULL ORDER BY ticker`,
            tickers
        );

        if (result.rows.length === 0) {
            res.type('text/plain; charset=utf-8').send('Нет данных по котировкам');
            return;
        }

        const lines = result.rows.map((row: any) => `${row.ticker}: ${Number(row.price)} ₽`);
        res.type('text/plain; charset=utf-8').send(lines.join('\n'));
    } catch (err: any) {
        console.error('[API] Error fetching quotes:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Fundamental Data Service running on port ${PORT}`);

    // Startup: collect all data
    console.log('[STARTUP] Collecting data...');
    Promise.all([
        collectAll().catch((err: any) => console.error('[STARTUP] Fundamentals failed:', err)),
        collectMacro().catch((err: any) => console.error('[STARTUP] Macro failed:', err)),
    ]);

    // Schedule: fundamentals update every Monday at 03:00
    cron.schedule('0 3 * * 1', () => {
        console.log('[CRON] Weekly fundamentals update');
        collectAll().catch((err: any) => console.error('[CRON] Fundamentals failed:', err));
    });

    // Schedule: macro update every 10 minutes
    cron.schedule('*/10 * * * *', () => {
        collectMacro().catch((err: any) => console.error('[CRON] Macro update failed:', err));
    });

    console.log('[CRON] Scheduled: fundamentals weekly Mon 03:00, macro every 10 min');
});
