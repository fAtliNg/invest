import { query } from '../db';
import dotenv from 'dotenv';

dotenv.config();

const migrate = async () => {
  try {
    console.log('Adding type column to quotes table...');
    await query(`
      ALTER TABLE quotes 
      ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'share';
    `);
    
    // Create an index on type for faster filtering
    await query(`
      CREATE INDEX IF NOT EXISTS idx_quotes_type ON quotes(type);
    `);

    console.log('Column type added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
