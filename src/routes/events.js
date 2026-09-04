const express = require('express');
const ticketService = require('../services/ticketService');
const { redis } = require('../cache/redis');
const pool = require('../db/pool');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_POSTGRES_INT = 2147483647;
const MAX_CHECKOUT_QUANTITY = 100;

/**
 * Health check handler that pings BOTH PostgreSQL (SELECT 1) and Redis (PING).
 * Returns 200 OK only if both services are reachable and healthy,
 * otherwise 503 Service Unavailable with detailed component status.
 */
const healthHandler = asyncHandler(async (req, res) => {
  let dbHealthy = false;
  let redisHealthy = false;

  // 1. Check PostgreSQL pool connectivity
  try {
    dbHealthy = await ticketService.checkHealth();
  } catch (err) {
    dbHealthy = false;
  }

  // 2. Check Redis connection
  try {
    const pong = await redis.ping();
    redisHealthy = pong === 'PONG';
  } catch (err) {
    redisHealthy = false;
  }

  const isHealthy = dbHealthy && redisHealthy;
  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: isHealthy ? 'ok' : 'degraded',
    services: {
      postgres: dbHealthy ? 'up' : 'down',
      redis: redisHealthy ? 'up' : 'down',
    },
    pool: {
      total: pool.totalCount || 0,
      idle: pool.idleCount || 0,
      waiting: pool.waitingCount || 0,
      active: Math.max(0, (pool.totalCount || 0) - (pool.idleCount || 0)),
    },
  });
});

/**
 * @route   GET /health (also accessible via /events/health)
 * @desc    Checks PostgreSQL and Redis connectivity
 * @access  Public
 */
router.get('/health', healthHandler);

/**
 * @route   GET /events
 * @desc    Retrieves all available events (auto-seeds defaults if needed)
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const events = await ticketService.listEvents();
  return res.status(200).json(events);
}));

/**
 * @route   GET /events/:id/seats
 * @desc    Retrieves seat reservation matrix and booked seats for an event
 * @access  Public
 */
router.get('/:id/seats', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Event ID must be a valid UUID.' });
  }

  const seatData = await ticketService.getEventSeats(id);
  return res.status(200).json(seatData);
}));

/**
 * @route   POST /events/:id/reset
 * @desc    Restores all seats to available and syncs Redis inventory counter
 * @access  Public
 */
router.post('/:id/reset', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Event ID must be a valid UUID.' });
  }

  const resetResult = await ticketService.resetEvent(id);
  return res.status(200).json(resetResult);
}));

/**
 * @route   POST /events/:id/prewarm
 * @desc    Pre-warms in-memory inventory in Redis from PostgreSQL ahead of flash-sale traffic
 * @access  Public
 * @param   {string} req.params.id - Event UUID
 */
router.post('/:id/prewarm', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Event ID must be a valid UUID.' });
  }

  const prewarmResult = await ticketService.prewarmEvent(id);

  return res.status(200).json({
    message: 'Event inventory pre-warmed in Redis successfully.',
    ...prewarmResult,
  });
}));

/**
 * @route   GET /events/:id
 * @desc    Retrieves single event details including available_tickets
 * @access  Public
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Event ID must be a valid UUID.' });
  }

  const event = await ticketService.getEventById(id);
  if (!event) {
    return res.status(404).json({ error: `Event with ID '${id}' not found.` });
  }

  return res.status(200).json(event);
}));

/**
 * @route   POST /events
 * @desc    Creates a new event and pre-warms inventory in Redis
 * @access  Public
 * @body    { name: string, total_tickets: number }
 */
router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { name, total_tickets } = body;

  // Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Field "name" is required and must be a non-empty string.' });
  }
  if (name.trim().length > 255) {
    return res.status(400).json({ error: 'Field "name" cannot exceed 255 characters.' });
  }

  // Validate total_tickets strictly (disallow booleans, floats, negatives, and overflow)
  if (
    total_tickets === undefined ||
    total_tickets === null ||
    typeof total_tickets !== 'number' ||
    !Number.isInteger(total_tickets) ||
    total_tickets <= 0 ||
    total_tickets > MAX_POSTGRES_INT
  ) {
    return res.status(400).json({
      error: `Field "total_tickets" must be a positive integer between 1 and ${MAX_POSTGRES_INT}.`,
    });
  }

  const event = await ticketService.createEvent({
    name: name.trim(),
    totalTickets: total_tickets,
  });

  return res.status(201).json(event);
}));

/**
 * @route   POST /events/:id/checkout
 * @desc    Executes hardened checkout using Redis Lua atomic reservation gate
 * @access  Public
 * @param   {string} req.params.id - Event UUID
 * @body    {string} userId - User identifier
 * @body    {number} quantity - Number of tickets to purchase
 * @body    {string} [idempotencyKey] - Optional idempotency token
 * @body    {string} [seatNumber] - Optional specific seat identifier (e.g. "D5")
 */
router.post('/:id/checkout', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const { userId, quantity, idempotencyKey, seatNumber, chaosDelayMs, chaosFailDb } = body;

  // Validate Event ID
  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Event ID must be a valid UUID.' });
  }

  // Validate userId
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({ error: 'Field "userId" is required and must be a non-empty string.' });
  }
  if (userId.trim().length > 128) {
    return res.status(400).json({ error: 'Field "userId" cannot exceed 128 characters.' });
  }

  // Validate quantity strictly
  if (
    quantity === undefined ||
    quantity === null ||
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    quantity > MAX_CHECKOUT_QUANTITY
  ) {
    return res.status(400).json({
      error: `Field "quantity" must be a positive integer between 1 and ${MAX_CHECKOUT_QUANTITY}.`,
    });
  }

  // Validate optional idempotencyKey
  if (idempotencyKey !== undefined && idempotencyKey !== null) {
    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
      return res.status(400).json({ error: 'Field "idempotencyKey", if provided, must be a non-empty string.' });
    }
    if (idempotencyKey.trim().length > 256) {
      return res.status(400).json({ error: 'Field "idempotencyKey" cannot exceed 256 characters.' });
    }
  }

  // Validate optional seatNumber
  if (seatNumber !== undefined && seatNumber !== null) {
    if (typeof seatNumber !== 'string' || seatNumber.trim() === '') {
      return res.status(400).json({ error: 'Field "seatNumber", if provided, must be a non-empty string.' });
    }
    if (seatNumber.trim().length > 16) {
      return res.status(400).json({ error: 'Field "seatNumber" cannot exceed 16 characters.' });
    }
  }

  const { order, statusCode } = await ticketService.processCheckout({
    eventId: id,
    userId: userId.trim(),
    quantity,
    idempotencyKey: idempotencyKey ? idempotencyKey.trim() : null,
    seatNumber: seatNumber ? seatNumber.trim() : null,
    chaosDelayMs: chaosDelayMs ? Number(chaosDelayMs) : 0,
    chaosFailDb: Boolean(chaosFailDb),
  });

  return res.status(statusCode).json(order);
}));

module.exports = router;
module.exports.healthHandler = healthHandler;
