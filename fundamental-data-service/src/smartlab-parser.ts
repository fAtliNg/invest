import axios from 'axios';
import * as cheerio from 'cheerio';

export interface FundamentalsRow {
    ticker: string;
    company_name?: string;
    price?: number;
    p_e?: number;
    p_s?: number;
    ev_ebitda?: number;
    net_debt_ebitda?: number;
    roe?: number;
    net_income?: number;       // млрд ₽
    dividend_yield?: number;   // %
    report_type?: string;      // напр. '2025-МСФО'
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Парсит число из текста ячейки таблицы Smart-lab.
 */
function parseNum(text: string): number | undefined {
    const clean = text.trim()
        .replace(/\s/g, '')
        .replace(/,/g, '.')
        .replace(/%$/, '')
        .replace(/\*+/g, '');  // убираем сноски ** и т.п.
    if (!clean || clean === '—' || clean === '-' || clean === '&nbsp;') return undefined;
    const val = parseFloat(clean);
    return isNaN(val) ? undefined : val;
}

/**
 * Парсит сводную таблицу Smart-lab /q/shares_fundamental/
 * 
 * На странице 2 таблицы:
 * 
 * ТАБЛИЦА 0 (компании, 19 колонок):
 *   0:№ 1:Название 2:Тикер 3:chart 4:chart 5:Капит-я 6:EV 7:Выручка
 *   8:Чист.прибыль 9:ДД_ао% 10:ДД_ап% 11:ДД/ЧП%
 *   12:P/E 13:P/S 14:P/B 15:EV/EBITDA 16:Рентаб.EBITDA 17:долг/EBITDA 18:отчет
 * 
 * ТАБЛИЦА 1 (банки, 17 колонок):
 *   0:№ 1:Название 2:Тикер 3:chart 4:chart 5:Капит-я 6:Чист.опер.доход
 *   7:Чист.прибыль 8:ДД_ао% 9:ДД_ап% 10:ДД/ЧП%
 *   11:P/E 12:P/B 13:ЧПМ% 14:RoE 15:RoA 16:отчет
 */
export async function parseAllFundamentals(): Promise<FundamentalsRow[]> {
    const url = 'https://smart-lab.ru/q/shares_fundamental/';

    console.log('[PARSER] Fetching summary table from Smart-lab...');

    const { data: html } = await axios.get(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'ru-RU,ru;q=0.9' },
        timeout: 30000,
    });

    const $ = cheerio.load(html);
    const tables = $('table.simple-little-table.trades-table');
    const results: FundamentalsRow[] = [];

    // --- Таблица 0: обычные компании ---
    if (tables.length >= 1) {
        const rows = $(tables[0]).find('tr');
        for (let i = 1; i < rows.length; i++) {
            const cells = $(rows[i]).find('td');
            if (cells.length < 18) continue;

            const ticker = $(cells[2]).text().trim();
            if (!ticker) continue;

            const row: FundamentalsRow = { ticker };
            const name = $(cells[1]).text().trim();
            if (name) row.company_name = name;

            const netIncome = parseNum($(cells[8]).text());
            const divYield = parseNum($(cells[9]).text());
            const pe = parseNum($(cells[12]).text());
            const ps = parseNum($(cells[13]).text());
            const evEbitda = parseNum($(cells[15]).text());
            const debtEbitda = parseNum($(cells[17]).text());

            if (netIncome !== undefined) row.net_income = netIncome;
            if (divYield !== undefined) row.dividend_yield = divYield;
            if (pe !== undefined) row.p_e = pe;
            if (ps !== undefined) row.p_s = ps;
            if (evEbitda !== undefined) row.ev_ebitda = evEbitda;
            if (debtEbitda !== undefined) row.net_debt_ebitda = debtEbitda;

            const report = $(cells[18]).text().trim();
            if (report) row.report_type = report;

            results.push(row);
        }
        console.log(`[PARSER] Table 0 (companies): ${results.length} rows`);
    }

    // --- Таблица 1: банки ---
    if (tables.length >= 2) {
        const rows = $(tables[1]).find('tr');
        let bankCount = 0;
        for (let i = 1; i < rows.length; i++) {
            const cells = $(rows[i]).find('td');
            if (cells.length < 16) continue;

            const ticker = $(cells[2]).text().trim();
            if (!ticker) continue;

            const row: FundamentalsRow = { ticker };
            const name = $(cells[1]).text().trim();
            if (name) row.company_name = name;

            const netIncome = parseNum($(cells[7]).text());
            const divYield = parseNum($(cells[8]).text());
            const pe = parseNum($(cells[11]).text());
            const roe = parseNum($(cells[14]).text());

            if (netIncome !== undefined) row.net_income = netIncome;
            if (divYield !== undefined) row.dividend_yield = divYield;
            if (pe !== undefined) row.p_e = pe;
            if (roe !== undefined) row.roe = roe;

            const report = $(cells[16]).text().trim();
            if (report) row.report_type = report;

            results.push(row);
            bankCount++;
        }
        console.log(`[PARSER] Table 1 (banks): ${bankCount} rows`);
    }

    console.log(`[PARSER] Total: ${results.length} companies parsed`);
    return results;
}
