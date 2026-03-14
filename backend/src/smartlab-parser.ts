import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SmartLabData {
    p_e?: number;
    p_bv?: number;
    ev_ebitda?: number;
    ebitda?: number;          // млрд руб
    net_income?: number;      // млрд руб
    fcf?: number;             // млрд руб
    net_debt?: number;        // млрд руб
    net_debt_ebitda?: number;
    roe?: number;             // %
    revenue?: number;         // млрд руб
}

// Метрики для парсинга
// Банки имеют другой набор (нет EBITDA, FCF)
const BANK_TICKERS = new Set(['SBER', 'SBERP', 'VTBR', 'BSPB', 'CBOM', 'TCSG']);

const METRICS_GENERAL: Array<{ key: keyof SmartLabData; path: string }> = [
    { key: 'p_e', path: 'p_e' },
    { key: 'p_bv', path: 'p_bv' },
    { key: 'ev_ebitda', path: 'ev_ebitda' },
    { key: 'ebitda', path: 'ebitda' },
    { key: 'net_income', path: 'net_income' },
    { key: 'fcf', path: 'fcf' },
    { key: 'net_debt', path: 'net_debt' },
    { key: 'net_debt_ebitda', path: 'net_debt_ebitda' },
    { key: 'roe', path: 'roe' },
    { key: 'revenue', path: 'revenue' },
];

const METRICS_BANK: Array<{ key: keyof SmartLabData; path: string }> = [
    { key: 'p_e', path: 'p_e' },
    { key: 'p_bv', path: 'p_b' },
    { key: 'net_income', path: 'net_income' },
    { key: 'roe', path: 'roe' },
];

const CACHE = new Map<string, { data: SmartLabData; ts: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 часов

/**
 * Парсит значение метрики со страницы Smart-lab.
 * Ищет в таблице #years первую строку данных (после header_row) и берёт последнее значение.
 */
function parseMetricValue(html: string): number | undefined {
    const $ = cheerio.load(html);
    const table = $('table#years');
    if (table.length === 0) return undefined;

    // Находим строку данных — первый <tr> после header_row, содержащий <td> с числами
    const rows = table.find('tr');
    let dataRow: any = null;

    for (let i = 0; i < rows.length; i++) {
        const row = $(rows[i]);
        // Пропускаем заголовки, вкладки и пустые строки
        if (row.hasClass('header_row')) continue;
        if (row.find('.tabs-block').length > 0) continue;
        if (row.find('h1, h2').length > 0) continue;

        // Ищем строку, где есть <td> с числовыми значениями
        const cells = row.find('td');
        let hasNumericCell = false;
        cells.each((_: any, cell: any) => {
            const text = $(cell).text().trim().replace(/\s/g, '').replace(/,/g, '.');
            if (/^-?[\d.]+%?$/.test(text)) {
                hasNumericCell = true;
            }
        });

        if (hasNumericCell) {
            dataRow = row;
            break;
        }
    }

    if (!dataRow) return undefined;

    // Собираем все числовые значения из строки
    const values: number[] = [];
    dataRow.find('td').each((_: any, cell: any) => {
        const $cell = $(cell);
        // Пропускаем разделитель LTM
        if ($cell.hasClass('ltm_spc')) return;

        const text = $cell.text().trim().replace(/\s/g, '').replace(/,/g, '.');
        if (/^-?[\d.]+$/.test(text)) {
            values.push(parseFloat(text));
        }
    });

    if (values.length === 0) return undefined;

    // Последнее значение — самое актуальное (либо LTM, либо последний год)
    return values[values.length - 1];
}

/**
 * Получить значение одной метрики со Smart-lab
 */
async function fetchMetric(ticker: string, metricPath: string): Promise<number | undefined> {
    try {
        const url = `https://smart-lab.ru/q/${ticker}/MSFO/${metricPath}/`;
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'ru-RU,ru;q=0.9',
            },
            timeout: 10000,
        });
        return parseMetricValue(html);
    } catch (err: any) {
        if (err.response?.status !== 404) {
            console.error(`[SMART-LAB] Error fetching ${ticker}/${metricPath}:`, err.message);
        }
        return undefined;
    }
}

/**
 * Получить все фундаментальные данные по тикеру из Smart-lab
 */
export async function getSmartLabData(ticker: string): Promise<SmartLabData> {
    const cached = CACHE.get(ticker);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.data;
    }

    const isBank = BANK_TICKERS.has(ticker);
    const metrics = isBank ? METRICS_BANK : METRICS_GENERAL;
    const data: SmartLabData = {};

    // Запрашиваем пакетами по 3, чтобы не нагружать Smart-lab
    const batchSize = 3;
    for (let i = 0; i < metrics.length; i += batchSize) {
        const batch = metrics.slice(i, i + batchSize);
        const results = await Promise.all(
            batch.map(m => fetchMetric(ticker, m.path))
        );
        batch.forEach((m, idx) => {
            if (results[idx] !== undefined) {
                (data as any)[m.key] = results[idx];
            }
        });
        if (i + batchSize < metrics.length) {
            await new Promise(r => setTimeout(r, 200));
        }
    }

    CACHE.set(ticker, { data, ts: Date.now() });
    return data;
}

/**
 * Форматировать число для вывода (млрд руб)
 */
function formatBln(n: number): string {
    if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)} трлн`;
    return `${n.toFixed(1)} млрд`;
}

/**
 * Сформировать строку для промпта из Smart-lab данных
 */
export function formatSmartLabForPrompt(ticker: string, d: SmartLabData): string {
    const parts: string[] = [];
    if (d.p_e != null) parts.push(`P/E: ${d.p_e.toFixed(2)}`);
    if (d.p_bv != null) parts.push(`P/BV: ${d.p_bv.toFixed(2)}`);
    if (d.ev_ebitda != null) parts.push(`EV/EBITDA: ${d.ev_ebitda.toFixed(2)}`);
    if (d.ebitda != null) parts.push(`EBITDA: ${formatBln(d.ebitda)} ₽`);
    if (d.net_income != null) parts.push(`Чистая прибыль: ${formatBln(d.net_income)} ₽`);
    if (d.fcf != null) parts.push(`FCF: ${formatBln(d.fcf)} ₽`);
    if (d.net_debt != null) parts.push(`Чистый долг: ${formatBln(d.net_debt)} ₽`);
    if (d.net_debt_ebitda != null) parts.push(`Долг/EBITDA: ${d.net_debt_ebitda.toFixed(2)}`);
    if (d.roe != null) parts.push(`ROE: ${d.roe.toFixed(1)}%`);
    if (d.revenue != null) parts.push(`Выручка: ${formatBln(d.revenue)} ₽`);
    return parts.length > 0 ? `${ticker} (Smart-lab): ${parts.join(' | ')}` : '';
}
