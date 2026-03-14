import { Pool } from 'pg';
import axios from 'axios';
import { parseAllFundamentals, FundamentalsRow } from './smartlab-parser';

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'invest_db',
    user: process.env.DB_USER || 'invest_user',
    password: process.env.DB_PASSWORD || '',
});

/**
 * Получить цены с MOEX ISS API для всех тикеров
 */
async function fetchMoexPrices(): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    try {
        const url = 'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&securities.columns=SECID,PREVPRICE';
        const { data } = await axios.get(url, { timeout: 10000 });
        const cols = data.securities.columns as string[];
        const rows = data.securities.data as any[][];
        const secidIdx = cols.indexOf('SECID');
        const priceIdx = cols.indexOf('PREVPRICE');
        for (const row of rows) {
            if (row[secidIdx] && row[priceIdx]) {
                prices.set(row[secidIdx], row[priceIdx]);
            }
        }
        console.log(`[MOEX] Fetched prices for ${prices.size} tickers`);
    } catch (err: any) {
        console.error(`[MOEX] Error fetching prices: ${err.message}`);
    }
    return prices;
}

/**
 * Upsert одной записи в БД
 */
async function upsertFundamental(row: FundamentalsRow): Promise<void> {
    await pool.query(
        `INSERT INTO fundamentals (ticker, company_name, price, p_e, p_s, ev_ebitda, net_debt_ebitda, roe, net_income, dividend_yield, report_type, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         ON CONFLICT (ticker) DO UPDATE SET
            company_name = COALESCE(EXCLUDED.company_name, fundamentals.company_name),
            price = COALESCE(EXCLUDED.price, fundamentals.price),
            p_e = COALESCE(EXCLUDED.p_e, fundamentals.p_e),
            p_s = COALESCE(EXCLUDED.p_s, fundamentals.p_s),
            ev_ebitda = COALESCE(EXCLUDED.ev_ebitda, fundamentals.ev_ebitda),
            net_debt_ebitda = COALESCE(EXCLUDED.net_debt_ebitda, fundamentals.net_debt_ebitda),
            roe = COALESCE(EXCLUDED.roe, fundamentals.roe),
            net_income = COALESCE(EXCLUDED.net_income, fundamentals.net_income),
            dividend_yield = COALESCE(EXCLUDED.dividend_yield, fundamentals.dividend_yield),
            report_type = COALESCE(EXCLUDED.report_type, fundamentals.report_type),
            updated_at = NOW()`,
        [
            row.ticker, row.company_name || null, row.price || null,
            row.p_e || null, row.p_s || null, row.ev_ebitda || null,
            row.net_debt_ebitda || null, row.roe || null,
            row.net_income || null, row.dividend_yield || null,
            row.report_type || null,
        ]
    );
}

/**
 * Полный сбор данных: одна страница Smart-lab + цены MOEX
 */
export async function collectAll(): Promise<void> {
    console.log('[COLLECTOR] Starting full collection...');

    // 1. Парсим сводную таблицу Smart-lab (один запрос!)
    const fundamentals = await parseAllFundamentals();
    if (fundamentals.length === 0) {
        console.error('[COLLECTOR] No data from Smart-lab summary table');
        return;
    }

    // 2. Получаем цены с MOEX
    const prices = await fetchMoexPrices();

    // 3. Добавляем цены и сохраняем в БД
    let saved = 0;
    for (const row of fundamentals) {
        const price = prices.get(row.ticker);
        if (price) row.price = price;

        try {
            await upsertFundamental(row);
            saved++;
        } catch (err: any) {
            console.error(`[COLLECTOR] Error saving ${row.ticker}: ${err.message}`);
        }
    }

    console.log(`[COLLECTOR] Done. Saved ${saved}/${fundamentals.length} companies.`);
}
