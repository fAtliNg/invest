import { query } from '../db';
import dotenv from 'dotenv';

dotenv.config();

const migrate = async () => {
  try {
    console.log('Adding volume and lot_size columns...');
    await query(`
      ALTER TABLE quotes 
      ADD COLUMN IF NOT EXISTS volume BIGINT,
      ADD COLUMN IF NOT EXISTS lot_size INTEGER;
    `);
    console.log('Columns added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
