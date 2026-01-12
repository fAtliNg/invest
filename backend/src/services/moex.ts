import axios from 'axios';
import { query } from '../db';

interface MoexData {
  secid: string;
  shortname: string;
  price: number | null;
  high: number | null;
  low: number | null;
  change: number | null;
  change_pct: number | null;
  volume: number | null;
  lot_size: number | null;
  type: string; // 'share', 'bond', 'fund', 'currency', 'future'
}

interface MoexSource {
  type: string;
  url: string;
}

const SOURCES: MoexSource[] = [
  { type: 'share', url: 'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,LOTSIZE,PREVPRICE&marketdata.columns=SECID,LAST,HIGH,LOW,CHANGE,LASTTOPREVPRICE,VOLTODAY' },
  { type: 'bond', url: 'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQCB/securities.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,LOTSIZE,PREVPRICE&marketdata.columns=SECID,LAST,HIGH,LOW,CHANGE,LASTTOPREVPRICE,VOLTODAY' }, // Corp bonds
  { type: 'bond', url: 'https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,LOTSIZE,PREVPRICE&marketdata.columns=SECID,LAST,HIGH,LOW,CHANGE,LASTTOPREVPRICE,VOLTODAY' }, // OFZ
  { type: 'fund', url: 'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQTF/securities.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,LOTSIZE,PREVPRICE&marketdata.columns=SECID,LAST,HIGH,LOW,CHANGE,LASTTOPREVPRICE,VOLTODAY' }, // ETFs
  { type: 'currency', url: 'https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,LOTSIZE,PREVPRICE&marketdata.columns=SECID,LAST,HIGH,LOW,CHANGE,LASTTOPREVPRICE,VOLTODAY' },
  { type: 'future', url: 'https://iss.moex.com/iss/engines/futures/markets/forts/boards/RFUD/securities.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,LOTSIZE,PREVPRICE&marketdata.columns=SECID,LAST,HIGH,LOW,CHANGE,LASTTOPREVPRICE,VOLTODAY' }
];

const fetchFromSource = async (source: MoexSource): Promise<MoexData[]> => {
  try {
    const response = await axios.get(source.url);
    const data = response.data;

    if (!data.securities || !data.marketdata) {
      // Some boards might be empty or closed, log warning but don't crash
      console.warn(`Empty or invalid data for ${source.type} from ${source.url}`);
      return [];
    }

    const getIndex = (columns: string[], name: string) => columns.indexOf(name);
    const secColumns = data.securities.columns;
    const mdColumns = data.marketdata.columns;

    const secIdIdx = getIndex(secColumns, 'SECID');
    const nameIdx = getIndex(secColumns, 'SHORTNAME');
    const lotSizeIdx = getIndex(secColumns, 'LOTSIZE');
    const prevPriceIdx = getIndex(secColumns, 'PREVPRICE');

    const mdSecIdIdx = getIndex(mdColumns, 'SECID');
    const lastIdx = getIndex(mdColumns, 'LAST');
    const highIdx = getIndex(mdColumns, 'HIGH');
    const lowIdx = getIndex(mdColumns, 'LOW');
    const changeIdx = getIndex(mdColumns, 'CHANGE');
    const changePctIdx = getIndex(mdColumns, 'LASTTOPREVPRICE');
    const volumeIdx = getIndex(mdColumns, 'VOLTODAY');

    // Create a map for market data
    const marketDataMap = new Map();
    data.marketdata.data.forEach((row: any[]) => {
      marketDataMap.set(row[mdSecIdIdx], {
        price: row[lastIdx],
        high: row[highIdx],
        low: row[lowIdx],
        change: row[changeIdx],
        change_pct: row[changePctIdx],
        volume: row[volumeIdx]
      });
    });

    const quotes: MoexData[] = [];

    const cleanShortname = (name: string): string => {
      return name.replace(/^[i\+](?=[А-ЯЁA-Z])/, '');
    };

    data.securities.data.forEach((row: any[]) => {
      const secid = row[secIdIdx];
      const md = marketDataMap.get(secid);
      const prevPrice = prevPriceIdx !== -1 ? (row[prevPriceIdx] || 0) : 0;
      
      // Filter out items without market data or with very basic missing info if needed
      // But for now we keep them if md exists
      if (md) {
        quotes.push({
          secid,
          shortname: cleanShortname(row[nameIdx] || secid), // Fallback to secid if name is missing
          price: md.price || prevPrice || 0,
          high: md.high || 0,
          low: md.low || 0,
          change: md.change || 0,
          change_pct: md.change_pct || 0,
          volume: md.volume || 0,
          lot_size: lotSizeIdx !== -1 ? (row[lotSizeIdx] || 0) : 0, // Handle missing LOTSIZE column
          type: source.type
        });
      }
    });
    
    return quotes;

  } catch (error) {
    console.error(`Error fetching ${source.type}:`, error);
    return [];
  }
};

export const fetchMoexData = async (): Promise<MoexData[]> => {
  try {
    const results = await Promise.all(SOURCES.map(source => fetchFromSource(source)));
    const allQuotes = results.flat();
    console.log(`Fetched total ${allQuotes.length} quotes from MOEX`);
    return allQuotes;
  } catch (error) {
    console.error('Error fetching from MOEX:', error);
    return [];
  }
};

export const updateQuotesInDb = async (quotes: MoexData[]) => {
  if (quotes.length === 0) return;

  try {
    console.log(`Updating ${quotes.length} quotes in DB...`); 
    
    // Batch processing to avoid huge Promise.all if list is very long?
    // 260 shares + bonds + etc could be 1000+ items.
    // Promise.all with 1000 queries is okay for pg pool (default size 10), it will queue them.
    
    const updatePromises = quotes.map(quote => {
      const queryText = `
        INSERT INTO quotes (secid, shortname, price, high, low, change, change_pct, volume, lot_size, type, last_updated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (secid) DO UPDATE SET
          shortname = EXCLUDED.shortname,
          price = EXCLUDED.price,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          change = EXCLUDED.change,
          change_pct = EXCLUDED.change_pct,
          volume = EXCLUDED.volume,
          lot_size = EXCLUDED.lot_size,
          type = EXCLUDED.type,
          last_updated = NOW();
      `;
      const values = [
        quote.secid,
        quote.shortname,
        quote.price,
        quote.high,
        quote.low,
        quote.change,
        quote.change_pct,
        quote.volume,
        quote.lot_size,
        quote.type
      ];
      return query(queryText, values);
    });

    await Promise.all(updatePromises);
    console.log('DB update complete');
    
  } catch (error) {
    console.error('Error updating DB:', error);
  }
};

export const getQuotesFromDb = async (): Promise<MoexData[]> => {
  try {
    const result = await query('SELECT * FROM quotes ORDER BY secid');
    return result.rows.map(row => ({
        secid: row.secid,
        shortname: row.shortname,
        price: parseFloat(row.price),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        change: parseFloat(row.change),
        change_pct: parseFloat(row.change_pct),
        volume: parseInt(row.volume || '0', 10),
        lot_size: parseInt(row.lot_size || '0', 10),
        type: row.type || 'share'
    }));
  } catch (error) {
    console.error('Error getting quotes from DB:', error);
    return [];
  }
};
