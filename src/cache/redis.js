const Redis = require('ioredis');
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Returns default configuration options for ioredis,
 * including exponential backoff retry logic and connection timeouts.
 *
 * @param {object} [customOptions={}]
 * @returns {object}
 */
function getRedisOptions(customOptions = {}) {
  return {
    retryStrategy(times) {
      // Exponential backoff: 50ms, 100ms, 150ms ... up to max 2000ms
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 5000,
    ...customOptions,
  };
}

/**
 * Dedicated primary singleton Redis client instance.
 */
const redis = new Redis(REDIS_URL, getRedisOptions());

// Robust error handling to prevent unhandled 'error' events from crashing the Node.js process
redis.on('error', (err) => {
  console.error('[Redis Client Error]', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected to Redis server');
});

redis.on('reconnecting', (time) => {
  console.warn(`[Redis] Reconnecting in ${time}ms...`);
});

/**
 * Factory / duplicate method for multi-client requirements (such as Redlock).
 * Produces an independently connected ioredis client using identical connection
 * parameters and retry semantics.
 *
 * @param {object} [customOptions={}]
 * @returns {Redis}
 */
function createRedisClient(customOptions = {}) {
  const client = new Redis(REDIS_URL, getRedisOptions(customOptions));
  client.on('error', (err) => {
    console.error('[Redis Duplicate Client Error]', err.message);
  });
  return client;
}

/**
 * Gracefully terminates the primary Redis client connection.
 * Attempts QUIT, falling back to DISCONNECT on timeout or failure.
 *
 * @returns {Promise<void>}
 */
async function closeRedis() {
  try {
    if (redis.status !== 'end') {
      await redis.quit();
      console.log('[Redis] Connection closed gracefully.');
    }
  } catch (err) {
    console.error('[Redis Shutdown Error] Falling back to disconnect:', err.message);
    redis.disconnect();
  }
}

// Graceful shutdown support for process termination signals
let isShuttingDown = false;
async function onShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Process] Received ${signal}. Closing Redis connections...`);
  await closeRedis();
}

process.once('SIGTERM', () => onShutdown('SIGTERM'));
process.once('SIGINT', () => onShutdown('SIGINT'));

module.exports = {
  redis,
  createRedisClient,
  closeRedis,
};
