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
}

export const fetchMoexData = async (): Promise<MoexData[]> => {
  try {
    // Fetch TQBR board (shares)
    const url = 'https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME&marketdata.columns=SECID,LAST,HIGH,LOW,CHANGE,LASTTOPREVPRICE';
    
    const response = await axios.get(url);
    const data = response.data;

    if (!data.securities || !data.marketdata) {
      throw new Error('Invalid MOEX data structure');
    }

    // Helper to map columns to indices
    const getIndex = (columns: string[], name: string) => columns.indexOf(name);

    const secColumns = data.securities.columns;
    const mdColumns = data.marketdata.columns;

    const secIdIdx = getIndex(secColumns, 'SECID');
    const nameIdx = getIndex(secColumns, 'SHORTNAME');

    const mdSecIdIdx = getIndex(mdColumns, 'SECID');
    const lastIdx = getIndex(mdColumns, 'LAST');
    const highIdx = getIndex(mdColumns, 'HIGH');
    const lowIdx = getIndex(mdColumns, 'LOW');
    const changeIdx = getIndex(mdColumns, 'CHANGE');
    const changePctIdx = getIndex(mdColumns, 'LASTTOPREVPRICE');

    // Create a map for market data
    const marketDataMap = new Map();
    data.marketdata.data.forEach((row: any[]) => {
      marketDataMap.set(row[mdSecIdIdx], {
        price: row[lastIdx],
        high: row[highIdx],
        low: row[lowIdx],
        change: row[changeIdx],
        change_pct: row[changePctIdx]
      });
    });

    const quotes: MoexData[] = [];

    // Merge securities with market data
    data.securities.data.forEach((row: any[]) => {
      const secid = row[secIdIdx];
      const md = marketDataMap.get(secid);
      
      // Even if md is missing or partial, we should add the stock
      // But for better UX, let's include if at least price is available OR just list it with dashes
      if (md) {
        quotes.push({
          secid,
          shortname: row[nameIdx],
          price: md.price || 0,
          high: md.high || 0,
          low: md.low || 0,
          change: md.change || 0,
          change_pct: md.change_pct || 0
        });
      }
    });

    console.log(`Fetched ${quotes.length} quotes from MOEX`); // Debug log

    return quotes;

  } catch (error) {
    console.error('Error fetching from MOEX:', error);
    return [];
  }
};

export const updateQuotesInDb = async (quotes: MoexData[]) => {
  if (quotes.length === 0) return;

  // Note: 'client' was unused and incorrect usage of query
  // const client = await import('../db').then(m => m.query('BEGIN').then(() => m));
  
  try {
    // We use Promise.all to run updates in parallel (limited by pool size)
    console.log(`Updating ${quotes.length} quotes in DB...`); // Debug log
    
    const updatePromises = quotes.map(quote => {
      const queryText = `
        INSERT INTO quotes (secid, shortname, price, high, low, change, change_pct, last_updated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (secid) DO UPDATE SET
          shortname = EXCLUDED.shortname,
          price = EXCLUDED.price,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          change = EXCLUDED.change,
          change_pct = EXCLUDED.change_pct,
          last_updated = NOW();
      `;
      const values = [
        quote.secid,
        quote.shortname,
        quote.price,
        quote.high,
        quote.low,
        quote.change,
        quote.change_pct
      ];
      return query(queryText, values);
    });

    await Promise.all(updatePromises);
    console.log('DB update complete');
    
    // await query('COMMIT'); // If we used explicit transaction
  } catch (error) {
    // await query('ROLLBACK');
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
        change_pct: parseFloat(row.change_pct)
    }));
  } catch (error) {
    console.error('Error getting quotes from DB:', error);
    return [];
  }
};
