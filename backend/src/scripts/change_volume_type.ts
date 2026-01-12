import { query } from '../db';
import dotenv from 'dotenv';

dotenv.config();

const migrate = async () => {
  try {
    console.log('Changing volume column type to NUMERIC...');
    await query(`
      ALTER TABLE quotes 
      ALTER COLUMN volume TYPE NUMERIC USING volume::numeric;
    `);
    
    console.log('Column volume type changed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
