const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[Warning] DATABASE_URL is not set in environment variables.');
}

const isProduction = process.env.NODE_ENV === 'production';
const requiresSSL = connectionString && (
  connectionString.includes('sslmode=require') ||
  connectionString.includes('supabase') ||
  connectionString.includes('render.com') ||
  connectionString.includes('railway') ||
  process.env.PGSSLMODE === 'require'
);

const poolConfig = {
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX || '50', 10), // Maximum clients in the pool (scaled for burst checkouts)
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Allow up to 5 seconds during burst write saturation
};

// Enable SSL with self-signed certificate acceptance for cloud database providers (Supabase, Render, Railway, RDS)
if (requiresSSL || (isProduction && connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1') && !connectionString.includes('postgres:5432'))) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

// Capture unexpected errors on idle pool clients
pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error] Unexpected error on idle client:', err.message);
});

module.exports = pool;
