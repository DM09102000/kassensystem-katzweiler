import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/kantine_db'
});

// Test DB Connection on startup with retries
const maxRetries = 10;
let retries = 0;

async function testConnection() {
  while (retries < maxRetries) {
    try {
      const client = await pool.connect();
      console.log('Successfully connected to PostgreSQL database!');
      // Auto-migrate: Add email column if not exists
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;');
      client.release();
      break;
    } catch (err) {
      retries++;
      console.error(`Database connection failed (Attempt ${retries}/${maxRetries}):`, err.message);
      if (retries === maxRetries) {
        console.error('Could not connect to database. Exiting...');
        process.exit(1);
      }
      // Wait 3 seconds before next retry
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

testConnection();

export const query = (text, params) => pool.query(text, params);
export default pool;
