import axios from 'axios';
import { getSmartLabData } from './smartlab-parser';

interface FundamentalData {
    ticker: string;
    shortname?: string;
    price?: number;
    change_pct?: number;
    market_cap?: number;
    issue_size?: number;
    year_high?: number;
    year_low?: number;
    dividend_last?: number;
    dividend_yield?: number;
    volume_today?: number;
}

const CACHE = new Map<string, { data: FundamentalData; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 минут

function parseMoexData(json: any, tableName: string): any[] {
    if (!json || !json[tableName]) return [];
    const columns = json[tableName].columns;
    const data = json[tableName].data;
    return data.map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col: string, i: number) => {
            obj[col] = row[i];
        });
        return obj;
    });
}

async function fetchTickerData(ticker: string): Promise<FundamentalData> {
    const cached = CACHE.get(ticker);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.data;
    }

    const data: FundamentalData = { ticker };

    try {
        const marketRes = await axios.get(
            `https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/${ticker}.json?iss.meta=off`,
            { timeout: 10000 }
        );

        const securities = parseMoexData(marketRes.data, 'securities');
        const marketdata = parseMoexData(marketRes.data, 'marketdata');

        if (securities.length > 0) {
            data.shortname = securities[0].SHORTNAME;
            data.issue_size = securities[0].ISSUESIZE;
        }

        if (marketdata.length > 0) {
            const md = marketdata[0];
            data.price = md.LAST;
            data.change_pct = md.LASTTOPREVPRICE;
            data.market_cap = md.ISSUECAPITALIZATION;
            data.volume_today = md.VOLTODAY;
        }

        try {
            const from = new Date();
            from.setFullYear(from.getFullYear() - 1);
            const candleRes = await axios.get(
                `https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/${ticker}/candles.json?from=${from.toISOString().split('T')[0]}&till=${new Date().toISOString().split('T')[0]}&interval=24&iss.meta=off`,
                { timeout: 10000 }
            );
            const candles = parseMoexData(candleRes.data, 'candles');
            if (candles.length > 0) {
                data.year_high = Math.max(...candles.map((c: any) => c.high));
                data.year_low = Math.min(...candles.map((c: any) => c.low));
            }
        } catch (e) { }

        try {
            const divRes = await axios.get(
                `https://iss.moex.com/iss/securities/${ticker}/dividends.json?iss.meta=off`,
                { timeout: 10000 }
            );
            const dividends = parseMoexData(divRes.data, 'dividends');
            if (dividends.length > 0) {
                const sorted = [...dividends].sort((a: any, b: any) =>
                    new Date(a.registryclosedate).getTime() - new Date(b.registryclosedate).getTime()
                );
                data.dividend_last = Number(sorted[sorted.length - 1].value) || undefined;
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                const trailing = sorted
                    .filter((d: any) => new Date(d.registryclosedate) >= oneYearAgo)
                    .reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);
                if (trailing > 0 && data.price) {
                    data.dividend_yield = (trailing / data.price) * 100;
                }
            }
        } catch (e) { }
    } catch (err: any) {
        console.error(`[MOEX] Error fetching data for ${ticker}:`, err.message);
    }

    CACHE.set(ticker, { data, ts: Date.now() });
    return data;
}

function formatLargeNumber(n: number): string {
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)} трлн ₽`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} млрд ₽`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)} млн ₽`;
    return `${n.toFixed(0)} ₽`;
}

export async function buildFundamentalsSummary(tickers: string[]): Promise<string> {
    if (!tickers.length) return '';

    const moexResults = await Promise.all(
        tickers.map(t => fetchTickerData(t).catch(() => ({ ticker: t } as FundamentalData)))
    );

    const smartLabResults = await Promise.all(
        tickers.map(t => getSmartLabData(t).catch((): any => ({})))
    );

    const lines: string[] = [];
    for (let i = 0; i < moexResults.length; i++) {
        const d = moexResults[i];
        const sl = smartLabResults[i];
        const parts: string[] = [];

        if (d.shortname) parts.push(d.shortname);
        if (d.price != null) parts.push(`Цена: ${d.price.toFixed(2)} ₽`);
        if (d.change_pct != null) parts.push(`Изм: ${d.change_pct >= 0 ? '+' : ''}${d.change_pct.toFixed(2)}%`);
        if (d.market_cap != null) parts.push(`Капитализация: ${formatLargeNumber(d.market_cap)}`);
        if (d.year_high != null && d.year_low != null) parts.push(`52нед: ${d.year_low.toFixed(2)}–${d.year_high.toFixed(2)} ₽`);
        if (d.dividend_yield != null) parts.push(`Дивдоходность: ${d.dividend_yield.toFixed(2)}%`);
        if (d.dividend_last != null) parts.push(`Посл.дивиденд: ${d.dividend_last.toFixed(2)} ₽`);
        // Smart-lab
        if (sl.p_e != null) parts.push(`P/E: ${sl.p_e.toFixed(2)}`);
        if (sl.p_bv != null) parts.push(`P/BV: ${sl.p_bv.toFixed(2)}`);
        if (sl.ev_ebitda != null) parts.push(`EV/EBITDA: ${sl.ev_ebitda.toFixed(2)}`);
        if (sl.ebitda != null) parts.push(`EBITDA: ${sl.ebitda} млрд ₽`);
        if (sl.net_income != null) parts.push(`Чист.прибыль: ${sl.net_income} млрд ₽`);
        if (sl.fcf != null) parts.push(`FCF: ${sl.fcf} млрд ₽`);
        if (sl.net_debt != null) parts.push(`Чист.долг: ${sl.net_debt} млрд ₽`);
        if (sl.net_debt_ebitda != null) parts.push(`Долг/EBITDA: ${sl.net_debt_ebitda.toFixed(2)}`);
        if (sl.roe != null) parts.push(`ROE: ${sl.roe.toFixed(1)}%`);

        if (parts.length > 1) lines.push(`${d.ticker}: ${parts.join(' | ')}`);
    }

    return lines.join('\n');
}
