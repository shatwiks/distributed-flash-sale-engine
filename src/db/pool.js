const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[Warning] DATABASE_URL is not set in environment variables.');
}

const pool = new Pool({
  connectionString,
  max: 50, // Maximum number of clients in the pool (scaled for burst checkouts)
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Allow up to 5 seconds during burst write saturation
});

// Capture unexpected errors on idle pool clients
pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error] Unexpected error on idle client:', err.message);
});

module.exports = pool;
