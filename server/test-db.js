import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function testConnection() {
  console.log('Testing database connection with:', connectionString);
  const pool = new pg.Pool({ connectionString });
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database.');
    const res = await client.query('SELECT NOW()');
    console.log('Current time from DB:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Failed to connect to the database:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
