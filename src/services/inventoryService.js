const { redis } = require('../cache/redis');
const pool = require('../db/pool');
const RedlockModule = require('redlock');
const Redlock = RedlockModule.default || RedlockModule;

// ============================================================================
// LUA SCRIPTS
// ============================================================================
/**
 * Atomic stock check and decrement Lua script.
 * KEYS[1]: event stock key (event:{id}:stock)
 * ARGV[1]: requested decrement quantity
 *
 * Returns:
 *    1  -> Successfully reserved stock (decremented by quantity)
 *    0  -> Insufficient stock (sold out / not enough tickets)
 *   -1  -> Key does not exist in Redis (cache miss)
 * -404  -> Event marked as non-existent (negative cache lookup)
 */
const RESERVE_STOCK_LUA = `
local key = KEYS[1]
local qty = tonumber(ARGV[1])

local exists = redis.call('EXISTS', key)
if exists == 0 then
    return -1
end

local current_stock = tonumber(redis.call('GET', key))
if current_stock == -999 then
    return -404
end

if current_stock >= qty then
    redis.call('DECRBY', key, qty)
    return 1
else
    return 0
end
`;

/**
 * Atomic cache seed and reservation Lua script for cache miss handling.
 * KEYS[1]: event stock key (event:{id}:stock)
 * ARGV[1]: requested decrement quantity
 * ARGV[2]: seed available stock from PostgreSQL
 * ARGV[3]: cache TTL in seconds
 *
 * Atomically sets stock if key does not exist yet (avoiding race conditions
 * between concurrent workers seeding), then executes check and decrement.
 */
const SEED_AND_RESERVE_LUA = `
local key = KEYS[1]
local qty = tonumber(ARGV[1])
local seed_stock = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])

if redis.call('EXISTS', key) == 0 then
    redis.call('SET', key, seed_stock, 'EX', ttl)
end

local current_stock = tonumber(redis.call('GET', key))
if current_stock >= qty then
    redis.call('DECRBY', key, qty)
    return 1
else
    return 0
end
`;

/**
 * Safe stock restoration Lua script.
 * Restores stock only if key exists and is non-negative.
 */
const SAFE_RELEASE_LUA = `
local key = KEYS[1]
local qty = tonumber(ARGV[1])
if redis.call('EXISTS', key) == 1 then
    local current_stock = tonumber(redis.call('GET', key))
    if current_stock >= 0 then
        return redis.call('INCRBY', key, qty)
    end
end
return 0
`;

/**
 * Atomic seat check and reserve Lua script.
 * KEYS[1]: event booked seats set key (event:{id}:booked_seats)
 * KEYS[2]: event stock key (event:{id}:stock)
 * ARGV[1]: seatNumber (e.g. "D5")
 * ARGV[2]: requested decrement quantity (usually 1)
 *
 * Returns:
 *    1  -> Successfully reserved seat and decremented stock
 *    0  -> Insufficient stock (event sold out)
 *   -1  -> Stock key does not exist (cache miss)
 *   -2  -> Seat already booked / lock contention collision!
 */
const RESERVE_SEAT_LUA = `
local booked_key = KEYS[1]
local stock_key = KEYS[2]
local seat = ARGV[1]
local qty = tonumber(ARGV[2])

if redis.call('SISMEMBER', booked_key, seat) == 1 then
    return -2
end

local exists = redis.call('EXISTS', stock_key)
if exists == 0 then
    return -1
end

local current_stock = tonumber(redis.call('GET', stock_key))
if current_stock < qty then
    return 0
end

redis.call('SADD', booked_key, seat)
redis.call('DECRBY', stock_key, qty)
return 1
`;

/**
 * Release seat and restore stock Lua script.
 * KEYS[1]: event booked seats set key (event:{id}:booked_seats)
 * KEYS[2]: event stock key (event:{id}:stock)
 * ARGV[1]: seatNumber
 * ARGV[2]: quantity to restore
 */
const RELEASE_SEAT_LUA = `
local booked_key = KEYS[1]
local stock_key = KEYS[2]
local seat = ARGV[1]
local qty = tonumber(ARGV[2])

redis.call('SREM', booked_key, seat)
if redis.call('EXISTS', stock_key) == 1 then
    redis.call('INCRBY', stock_key, qty)
end
return 1
`;

// ============================================================================
// REDLOCK CONFIGURATION
// ============================================================================
const redlock = new Redlock(
  [redis],
  {
    // The expected clock drift; for more details see: http://redis.io/topics/distlock
    driftFactor: 0.01, // time in ms = 0.01 * ttl

    // The max number of times Redlock will attempt to lock a resource before failing
    retryCount: 10,

    // The time in ms between attempts
    retryDelay: 50, // 50ms between retries

    // The max time in ms randomly added to retries to prevent split-brain thundering herds
    retryJitter: 20, // 20ms jitter

    // The minimum remaining time on a lock before an extension is performed
    automaticExtensionThreshold: 500,
  }
);

redlock.on('error', (error) => {
  // ResourceLockedError is expected under high contention and safely handled by callers
  if (error.name === 'ResourceLockedError') {
    return;
  }
  console.error('[Redlock System Error]', error.message);
});

// ============================================================================
// INVENTORY SERVICE
// ============================================================================
class InventoryService {
  /**
   * Helper to format Redis stock key for an event.
   * @param {string} eventId
   * @returns {string}
   */
  getStockKey(eventId) {
    return `event:${eventId}:stock`;
  }

  /**
   * Helper to format Redis lock key for an event.
   * @param {string} eventId
   * @returns {string}
   */
  getLockKey(eventId) {
    return `locks:events:${eventId}`;
  }

  /**
   * Helper to format Redis booked seats set key for an event.
   * @param {string} eventId
   * @returns {string}
   */
  getBookedSeatsKey(eventId) {
    return `event:${eventId}:booked_seats`;
  }

  /**
   * Executes atomic stock check and decrement inside Redis in a single round-trip.
   * If the Redis key does not exist (cold cache), seeds inventory from PostgreSQL
   * and executes the atomic decrement.
   *
   * @param {string} eventId - UUID of the event
   * @param {number} quantity - Quantity of tickets to reserve
   * @param {number} [ttlSeconds=86400] - Cache TTL (default: 24h)
   * @returns {Promise<number>} Returns 1 on success, 0 on insufficient stock
   */
  async reserveStock(eventId, quantity, ttlSeconds = 86400) {
    const key = this.getStockKey(eventId);

    // 1. Fast-path: Execute atomic Lua script in Redis
    let result = await redis.eval(RESERVE_STOCK_LUA, 1, key, quantity);

    // Negative cache hit (event confirmed non-existent)
    if (result === -404) {
      const notFoundErr = new Error(`Event '${eventId}' not found.`);
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    // 2. Cache miss handling: Key doesn't exist yet in Redis
    if (result === -1) {
      // Query current available_tickets from PostgreSQL
      const dbRes = await pool.query(
        'SELECT available_tickets FROM events WHERE id = $1',
        [eventId]
      );

      if (dbRes.rows.length === 0) {
        // Protect PostgreSQL from cache penetration: cache negative lookup for 30s
        try {
          await redis.set(key, -999, 'EX', 30);
        } catch {}
        const notFoundErr = new Error(`Event '${eventId}' not found.`);
        notFoundErr.statusCode = 404;
        throw notFoundErr;
      }

      const availableTickets = dbRes.rows[0].available_tickets;

      // Atomically seed cache if missing and execute check & decrement
      result = await redis.eval(
        SEED_AND_RESERVE_LUA,
        1,
        key,
        quantity,
        availableTickets,
        ttlSeconds
      );
    }

    return Number(result);
  }

  /**
   * Compensating transaction: restores decremented stock back to Redis
   * in the event that downstream PostgreSQL operations fail.
   *
   * @param {string} eventId - UUID of the event
   * @param {number} quantity - Quantity to restore
   * @returns {Promise<number>} New stock level in Redis
   */
  async releaseStock(eventId, quantity) {
    const key = this.getStockKey(eventId);
    const newStock = await redis.eval(SAFE_RELEASE_LUA, 1, key, quantity);
    return Number(newStock);
  }

  /**
   * Explicitly pre-warms inventory in Redis from PostgreSQL ahead of flash-sale traffic.
   *
   * @param {string} eventId - UUID of the event
   * @param {number} availableTickets - Initial available stock count
   * @param {number} [ttlSeconds=86400] - Cache TTL (default: 24h)
   * @returns {Promise<void>}
   */
  async prewarmStock(eventId, availableTickets, ttlSeconds = 86400) {
    const key = this.getStockKey(eventId);
    await redis.set(key, availableTickets, 'EX', ttlSeconds);
  }

  /**
   * Inspects current in-memory stock count in Redis.
   *
   * @param {string} eventId - UUID of the event
   * @returns {Promise<number|null>} Stock count or null if key does not exist
   */
  async getStock(eventId) {
    const key = this.getStockKey(eventId);
    const val = await redis.get(key);
    if (val === null || val === '-999') return null;
    return parseInt(val, 10);
  }

  /**
   * Atomically reserves a specific seat for an event in Redis using RESERVE_SEAT_LUA.
   * If the seat is already occupied in the Redis Set, returns -2 (contested / conflict).
   *
   * @param {string} eventId - UUID of the event
   * @param {string} seatNumber - Seat identifier (e.g. "D5")
   * @param {number} [quantity=1] - Quantity of tickets (default: 1)
   * @param {number} [ttlSeconds=86400] - Cache TTL
   * @returns {Promise<number>} 1 = Success, 0 = Sold out, -2 = Seat collision / Contested
   */
  async reserveSeat(eventId, seatNumber, quantity = 1, ttlSeconds = 86400) {
    const bookedKey = this.getBookedSeatsKey(eventId);
    const stockKey = this.getStockKey(eventId);

    let result = await redis.eval(
      RESERVE_SEAT_LUA,
      2,
      bookedKey,
      stockKey,
      seatNumber,
      quantity
    );

    // Cache miss handling: If stock key missing in Redis, seed from PostgreSQL
    if (result === -1) {
      const dbRes = await pool.query(
        'SELECT available_tickets FROM events WHERE id = $1',
        [eventId]
      );
      if (dbRes.rows.length === 0) {
        const notFoundErr = new Error(`Event '${eventId}' not found.`);
        notFoundErr.statusCode = 404;
        throw notFoundErr;
      }
      const availableTickets = dbRes.rows[0].available_tickets;
      await redis.set(stockKey, availableTickets, 'EX', ttlSeconds);

      // Retry seat reservation
      result = await redis.eval(
        RESERVE_SEAT_LUA,
        2,
        bookedKey,
        stockKey,
        seatNumber,
        quantity
      );
    }

    return Number(result);
  }

  /**
   * Compensating rollback for a seat: removes seat from booked set and restores stock.
   *
   * @param {string} eventId
   * @param {string} seatNumber
   * @param {number} [quantity=1]
   */
  async releaseSeat(eventId, seatNumber, quantity = 1) {
    const bookedKey = this.getBookedSeatsKey(eventId);
    const stockKey = this.getStockKey(eventId);
    await redis.eval(RELEASE_SEAT_LUA, 2, bookedKey, stockKey, seatNumber, quantity);
  }

  /**
   * Retrieves all currently booked seat numbers for an event from Redis.
   *
   * @param {string} eventId
   * @returns {Promise<string[]>}
   */
  async getBookedSeats(eventId) {
    const bookedKey = this.getBookedSeatsKey(eventId);
    const seats = await redis.smembers(bookedKey);
    return seats || [];
  }

  /**
   * Resets all booked seats and stock counter for an event in Redis.
   *
   * @param {string} eventId
   * @param {number} totalSeats
   */
  async resetSeats(eventId, totalSeats = 60) {
    const bookedKey = this.getBookedSeatsKey(eventId);
    const stockKey = this.getStockKey(eventId);
    await redis.del(bookedKey);
    await redis.set(stockKey, totalSeats, 'EX', 86400);
  }

  /**
   * Acquires a distributed lock on a given resource key.
   *
   * @param {string} resourceKey - Unique resource identifier to lock
   * @param {number} ttlMs - Lock TTL in milliseconds
   * @returns {Promise<import('redlock').Lock>}
   */
  async acquireLock(resourceKey, ttlMs = 5000) {
    return await redlock.acquire([resourceKey], ttlMs);
  }

  /**
   * Executes a callback within the context of a distributed lock.
   * Automatically guarantees lock release in a `finally` block even if the callback throws.
   *
   * @template T
   * @param {string} resourceKey - Resource to lock
   * @param {number} ttlMs - Lock expiration in milliseconds
   * @param {(lock: import('redlock').Lock) => Promise<T>} callback - Async work to execute
   * @returns {Promise<T>} Result of the callback
   */
  async withLock(resourceKey, ttlMs, callback) {
    const lock = await redlock.acquire([resourceKey], ttlMs);
    try {
      return await callback(lock);
    } finally {
      try {
        await lock.release();
      } catch (releaseErr) {
        // Under high contention or long callback execution, lock may expire before release
        console.warn(
          `[Redlock Release Warning] Could not release lock '${resourceKey}': ${releaseErr.message}`
        );
      }
    }
  }
}

module.exports = new InventoryService();
