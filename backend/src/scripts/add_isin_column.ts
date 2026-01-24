import { query } from '../db';
import dotenv from 'dotenv';

dotenv.config();

const migrate = async () => {
  try {
    console.log('Adding isin column to quotes table...');
    await query(`
      ALTER TABLE quotes 
      ADD COLUMN IF NOT EXISTS isin VARCHAR(50);
    `);
    
    // Create an index on isin just in case
    await query(`
      CREATE INDEX IF NOT EXISTS idx_quotes_isin ON quotes(isin);
    `);

    console.log('Column isin added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
