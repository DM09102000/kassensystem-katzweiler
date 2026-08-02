import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

import { populateDefaultProductImages } from './seed_product_images.js';

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
      // Auto-migrate: Add email, avatar_url and image_url columns if not exist
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;');
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;');
      await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;');
      
      // Auto-populate / update all product images with dynamic 4:3 graphics containing size/unit
      await populateDefaultProductImages((text, params) => client.query(text, params), true);

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
