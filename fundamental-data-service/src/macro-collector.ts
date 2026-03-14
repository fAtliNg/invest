import axios from 'axios';
import * as cheerio from 'cheerio';

export interface MacroData {
    key_rate?: number;          // Ключевая ставка ЦБ, %
    usd_rub?: number;           // Курс USD/RUB
    eur_rub?: number;           // Курс EUR/RUB
    cny_rub?: number;           // Курс CNY/RUB
    brent?: number;             // Нефть Brent, $/баррель
    gold_rub?: number;          // Золото, руб/г
    imoex?: number;             // Индекс Мосбиржи
    rgbi?: number;              // Индекс гос. облигаций RGBI
    updated_at?: string;        // Время обновления
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

// В памяти — нет смысла хранить в БД, обновляется каждые 10 мин
let cachedData: MacroData = {};

/**
 * Получить кешированные макро-данные
 */
export function getMacroData(): MacroData {
    return cachedData;
}

/**
 * Ключевая ставка ЦБ РФ — парсим страницу cbr.ru
 */
async function fetchKeyRate(): Promise<number | undefined> {
    try {
        const { data } = await axios.get('https://www.cbr.ru/hd_base/KeyRate/', {
            headers: { 'User-Agent': UA },
            timeout: 10000,
        });
        const $ = cheerio.load(data);
        // Первая строка таблицы — текущая ставка
        const rateText = $('td').eq(1).text().trim().replace(',', '.');
        const rate = parseFloat(rateText);
        if (!isNaN(rate)) {
            console.log(`[MACRO] Key rate: ${rate}%`);
            return rate;
        }
    } catch (err: any) {
        console.error(`[MACRO] Error fetching key rate: ${err.message}`);
    }
    return undefined;
}

/**
 * Курсы валют ЦБ РФ — XML API
 */
async function fetchCurrencyRates(): Promise<{ usd?: number; eur?: number; cny?: number }> {
    try {
        const { data } = await axios.get('https://www.cbr.ru/scripts/XML_daily.asp', {
            timeout: 10000,
            responseType: 'text',
        });
        const result: { usd?: number; eur?: number; cny?: number } = {};

        // Простой XML парсинг через regex (не нужен полный XML парсер)
        const parseRate = (charCode: string): number | undefined => {
            const regex = new RegExp(`<CharCode>${charCode}</CharCode>.*?<VunitRate>([\\d.,]+)</VunitRate>`, 's');
            const match = data.match(regex);
            if (match) {
                return parseFloat(match[1].replace(',', '.'));
            }
            return undefined;
        };

        result.usd = parseRate('USD');
        result.eur = parseRate('EUR');
        result.cny = parseRate('CNY');

        console.log(`[MACRO] Currencies: USD=${result.usd}, EUR=${result.eur}, CNY=${result.cny}`);
        return result;
    } catch (err: any) {
        console.error(`[MACRO] Error fetching currencies: ${err.message}`);
        return {};
    }
}

/**
 * MOEX данные: IMOEX, RGBI, золото, валюты
 */
async function fetchMoexData(): Promise<{
    imoex?: number;
    rgbi?: number;
    gold_rub?: number;
    brent?: number;
}> {
    const result: { imoex?: number; rgbi?: number; gold_rub?: number; brent?: number } = {};

    try {
        // Индексы IMOEX, RGBI
        const indexUrl = 'https://iss.moex.com/iss/engines/stock/markets/index/securities.json?iss.meta=off&marketdata.columns=SECID,CURRENTVALUE';
        const { data: indexData } = await axios.get(indexUrl, { timeout: 10000 });
        for (const row of indexData.marketdata.data) {
            if (row[0] === 'IMOEX' && row[1]) result.imoex = row[1];
            if (row[0] === 'RGBI' && row[1]) result.rgbi = row[1];
        }
        console.log(`[MACRO] IMOEX=${result.imoex}, RGBI=${result.rgbi}`);
    } catch (err: any) {
        console.error(`[MACRO] Error fetching indices: ${err.message}`);
    }

    try {
        // Золото (GLDRUB_TOM) — валютный рынок
        const goldUrl = 'https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities.json?iss.meta=off&marketdata.columns=SECID,LAST';
        const { data: goldData } = await axios.get(goldUrl, { timeout: 10000 });
        for (const row of goldData.marketdata.data) {
            if (row[0] === 'GLDRUB_TOM' && row[1]) result.gold_rub = row[1];
        }
        console.log(`[MACRO] Gold: ${result.gold_rub} руб/г`);
    } catch (err: any) {
        console.error(`[MACRO] Error fetching gold: ${err.message}`);
    }

    try {
        // Brent (ближайший фьючерс BR*)
        const brentUrl = 'https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?iss.meta=off&marketdata.columns=SECID,LAST';
        const { data: brentData } = await axios.get(brentUrl, { timeout: 10000 });
        for (const row of brentData.marketdata.data) {
            if (row[0] && row[0].startsWith('BR') && row[0].length === 4 && row[1]) {
                result.brent = row[1];
                break; // берём ближайший фьючерс
            }
        }
        console.log(`[MACRO] Brent: $${result.brent}`);
    } catch (err: any) {
        console.error(`[MACRO] Error fetching Brent: ${err.message}`);
    }

    return result;
}

/**
 * Собрать все макро-данные
 */
export async function collectMacro(): Promise<MacroData> {
    console.log('[MACRO] Collecting macro data...');

    const [keyRate, currencies, moex] = await Promise.all([
        fetchKeyRate(),
        fetchCurrencyRates(),
        fetchMoexData(),
    ]);

    const data: MacroData = {
        key_rate: keyRate,
        usd_rub: currencies.usd,
        eur_rub: currencies.eur,
        cny_rub: currencies.cny,
        brent: moex.brent,
        gold_rub: moex.gold_rub,
        imoex: moex.imoex,
        rgbi: moex.rgbi,
        updated_at: new Date().toISOString(),
    };

    cachedData = data;
    console.log('[MACRO] Collection complete');
    return data;
}

/**
 * Форматирование макро-данных в текстовый формат (для промпта ИИ)
 */
export function formatMacroText(data: MacroData): string {
    const lines: string[] = [];

    if (data.key_rate != null) lines.push(`Ключевая ставка ЦБ РФ: ${data.key_rate}%`);
    if (data.usd_rub != null) lines.push(`USD/RUB: ${data.usd_rub.toFixed(2)}`);
    if (data.eur_rub != null) lines.push(`EUR/RUB: ${data.eur_rub.toFixed(2)}`);
    if (data.cny_rub != null) lines.push(`CNY/RUB: ${data.cny_rub.toFixed(2)}`);
    if (data.brent != null) lines.push(`Нефть Brent: $${data.brent.toFixed(2)}`);
    if (data.gold_rub != null) lines.push(`Золото: ${data.gold_rub.toFixed(1)} руб/г`);
    if (data.imoex != null) lines.push(`Индекс Мосбиржи (IMOEX): ${data.imoex.toFixed(2)}`);
    if (data.rgbi != null) lines.push(`Индекс гос. облигаций (RGBI): ${data.rgbi.toFixed(2)}`);

    return lines.join('\n');
}
