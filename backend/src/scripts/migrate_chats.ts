import { query } from '../db/index';

async function migrate() {
  console.log('Starting manual migration...');
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS portfolio_chats (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table portfolio_chats created successfully.');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_portfolio_chats_portfolio_id ON portfolio_chats(portfolio_id);
    `);
    console.log('Index idx_portfolio_chats_portfolio_id created successfully.');
    
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
