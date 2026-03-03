import { query } from '../db';

const addChatStatusColumn = async () => {
  try {
    console.log('Adding status column to portfolio_chats table...');
    await query(`
      ALTER TABLE portfolio_chats 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
    `);
    
    // Set existing records to 'active'
    await query(`
      UPDATE portfolio_chats 
      SET status = 'active' 
      WHERE status IS NULL
    `);
    
    console.log('Column added successfully');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    process.exit();
  }
};

addChatStatusColumn();
