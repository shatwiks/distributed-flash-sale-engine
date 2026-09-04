const pool = require('../db/pool');
const inventoryService = require('./inventoryService');
const { redis } = require('../cache/redis');

class TicketService {
  /**
   * Health check query to verify database connectivity.
   * Runs SELECT 1 using the connection pool.
   *
   * @returns {Promise<boolean>} Resolves true if database is reachable
   */
  async checkHealth() {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (err) {
      console.error('[Health Check Failure] Database unreachable:', err.message);
      return false;
    }
  }

  /**
   * Retrieves an event by UUID including total and available tickets.
   *
   * @param {string} eventId - UUID of the event
   * @returns {Promise<object|null>} Event object or null if not found
   */
  async getEventById(eventId) {
    const result = await pool.query(
      'SELECT id, name, total_tickets, available_tickets, created_at FROM events WHERE id = $1',
      [eventId]
    );
    return result.rows[0] || null;
  }

  /**
   * Creates a new event record in PostgreSQL and immediately pre-warms the
   * in-memory inventory counter in Redis.
   *
   * @param {object} params
   * @param {string} params.name - Event title
   * @param {number} params.totalTickets - Total ticket capacity
   * @returns {Promise<object>} Created event record
   */
  async createEvent({ name, totalTickets }) {
    const result = await pool.query(
      `INSERT INTO events (name, total_tickets, available_tickets)
       VALUES ($1, $2, $2)
       RETURNING id, name, total_tickets, available_tickets, created_at`,
      [name, totalTickets]
    );

    const event = result.rows[0];

    // Pre-warm Redis cache with the initial inventory
    try {
      await inventoryService.prewarmStock(event.id, event.available_tickets);
    } catch (redisErr) {
      console.warn(
        `[Cache Prewarm Warning] Failed to prewarm Redis cache for event ${event.id}:`,
        redisErr.message
      );
    }

    return event;
  }

  /**
   * Pre-warms in-memory Redis inventory from PostgreSQL for an existing event.
   *
   * @param {string} eventId - Event UUID
   * @returns {Promise<{ eventId: string, available_tickets: number, cached: boolean }>}
   */
  async prewarmEvent(eventId) {
    const event = await this.getEventById(eventId);
    if (!event) {
      const notFoundErr = new Error(`Event with ID '${eventId}' not found.`);
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    await inventoryService.prewarmStock(event.id, event.available_tickets);

    return {
      eventId: event.id,
      available_tickets: event.available_tickets,
      cached: true,
    };
  }

  /**
   * Executes hardened ticket checkout using a two-layer reservation engine:
   *
   * Layer 1: Fast-Path In-Memory Gate (Redis Lua Script)
   * - Atomically checks if Redis stock >= quantity and decrements stock in a single round-trip.
   * - If stock is 0 (sold out), immediately short-circuits with HTTP 409 without touching PostgreSQL.
   *
   * Layer 2: Scoped Database Write & Compensating Transaction
   * - Acquires a client from the connection pool only for confirmed reservations.
   * - Inserts confirmed order and syncs available_tickets in PostgreSQL.
   * - Handles concurrent duplicate idempotency keys gracefully without overselling.
   * - If PostgreSQL fails (e.g. timeout or crash), triggers a compensating transaction
   *   (`INCRBY event:{id}:stock {quantity}`) to restore stock in Redis before propagating the error.
   *
   * @param {object} params
   * @param {string} params.eventId - Event UUID
   * @param {string} params.userId - User identifier
   * @param {number} params.quantity - Number of tickets requested
   * @param {string} [params.idempotencyKey] - Optional unique key for idempotent requests
   * @returns {Promise<{ order: object, statusCode: number }>}
   */
  /**
   * Executes hardened ticket checkout using a two-layer reservation engine:
   *
   * Layer 1: Fast-Path In-Memory Gate (Redis Lua Script)
   * - Atomically checks if seat is available in Redis Set (or if stock >= quantity).
   * - If seat already taken, returns -2 (409 Conflict with contention telemetry).
   * - If stock is 0 (sold out), immediately short-circuits with HTTP 409 without touching PostgreSQL.
   *
   * Layer 2: Scoped Database Write & Compensating Transaction
   * - Acquires a client from the connection pool only for confirmed reservations.
   * - Inserts confirmed order (including seat_number) and syncs available_tickets in PostgreSQL.
   * - Handles concurrent duplicate idempotency keys gracefully without overselling.
   * - If PostgreSQL fails (e.g. timeout or crash), triggers a compensating transaction
   *   (releaseSeat or releaseStock) to restore state in Redis before propagating error.
   *
   * @param {object} params
   * @param {string} params.eventId - Event UUID
   * @param {string} params.userId - User identifier
   * @param {number} params.quantity - Number of tickets requested
   * @param {string} [params.idempotencyKey] - Optional unique key for idempotent requests
   * @param {string} [params.seatNumber] - Optional seat number (e.g. "D5")
   * @returns {Promise<{ order: object, statusCode: number }>}
   */
  async processCheckout({
    eventId,
    userId,
    quantity,
    idempotencyKey = null,
    seatNumber = null,
    chaosDelayMs = 0,
    chaosFailDb = false,
  }) {
    // 1. Idempotency Check: if key provided and order exists, return unchanged
    if (idempotencyKey) {
      const existing = await pool.query(
        'SELECT id, event_id, user_id, quantity, status, seat_number, idempotency_key, created_at FROM orders WHERE idempotency_key = $1',
        [idempotencyKey]
      );
      if (existing.rows.length > 0) {
        const existingOrder = existing.rows[0];
        const statusCode = existingOrder.status === 'confirmed' ? 200 : 409;
        return { order: existingOrder, statusCode };
      }
    }

    // 2. Fast-Path Gate: In-Memory Stock or Seat Reservation
    let reserveStatus;
    const gateStart = performance.now();

    if (seatNumber) {
      reserveStatus = await inventoryService.reserveSeat(eventId, seatNumber, quantity);
    } else {
      reserveStatus = await inventoryService.reserveStock(eventId, quantity);
    }
    const gateDurationMs = Math.round((performance.now() - gateStart) * 10) / 10;
    const rawRedisCommand = seatNumber
      ? `EVALSHA <lua_gate> 2 event:${eventId}:booked_seats event:${eventId}:stock ${seatNumber} ${quantity} -> RETURN ${reserveStatus}`
      : `EVALSHA <lua_stock> 1 event:${eventId}:stock ${quantity} -> RETURN ${reserveStatus}`;

    // 3. Collision / Short-Circuit checks:
    if (reserveStatus === -2) {
      // Distributed Race Condition: Seat already booked / locked!
      return {
        order: {
          status: 'failed',
          contested: true,
          seatNumber,
          gateLatencyMs: gateDurationMs,
          rawRedisCommand,
          message: `Race Condition Blocked: Seat ${seatNumber} was claimed by another transaction via Redis Lua Gate (rejected in ${gateDurationMs}ms).`,
          eventId,
          userId,
        },
        statusCode: 409,
      };
    }

    if (reserveStatus === 0) {
      return {
        order: {
          status: 'failed',
          message: 'Sold out / Insufficient tickets',
          rawRedisCommand,
          eventId,
          userId,
          quantity,
        },
        statusCode: 409,
      };
    }

    // 4. Database Sync: Scoped PostgreSQL transaction for confirmed reservation
    const dbStart = performance.now();
    const client = await pool.connect();
    let isCommitted = false;
    let clientError = null;

    try {
      await client.query('BEGIN');

      // Chaos Injection: Simulated Database Latency (+3000ms)
      if (chaosDelayMs && Number(chaosDelayMs) > 0) {
        await new Promise((resolve) => setTimeout(resolve, Number(chaosDelayMs)));
      }

      // Chaos Injection: Simulated Database Crash (triggers Saga Compensating Rollback)
      if (chaosFailDb) {
        throw new Error('CHAOS_SIMULATION: Simulated PostgreSQL crash during checkout commit');
      }

      const orderRes = await client.query(
        `INSERT INTO orders (event_id, user_id, quantity, status, seat_number, idempotency_key)
         VALUES ($1, $2, $3, 'confirmed', $4, $5)
         RETURNING id, event_id, user_id, quantity, status, seat_number, idempotency_key, created_at`,
        [eventId, userId, quantity, seatNumber, idempotencyKey]
      );

      const updateRes = await client.query(
        `UPDATE events
         SET available_tickets = available_tickets - $1
         WHERE id = $2`,
        [quantity, eventId]
      );

      if (updateRes.rowCount === 0) {
        throw new Error(`Event '${eventId}' was not found during stock update.`);
      }

      await client.query('COMMIT');
      isCommitted = true;
      const dbDurationMs = Math.round((performance.now() - dbStart) * 10) / 10;

      return {
        order: {
          ...orderRes.rows[0],
          gateLatencyMs: gateDurationMs,
          dbDurationMs,
          rawRedisCommand,
          poolStats: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
          },
        },
        statusCode: 201,
      };
    } catch (dbErr) {
      clientError = dbErr;
      const dbDurationMs = Math.round((performance.now() - dbStart) * 10) / 10;

      // Safely rollback PostgreSQL transaction if not already committed
      if (!isCommitted) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackErr) {
          console.error(
            `[DB Rollback Warning] Failed to rollback client for event ${eventId}:`,
            rollbackErr.message
          );
        }
      }

      // Chaos Crash Handling: Compensating Rollback Animation Support
      if (chaosFailDb || (dbErr.message && dbErr.message.includes('CHAOS_SIMULATION'))) {
        console.warn(
          `[Chaos Rollback Triggered] Releasing seat '${seatNumber}' and restoring stock in Redis...`
        );
        try {
          if (seatNumber) {
            await inventoryService.releaseSeat(eventId, seatNumber, quantity);
          } else {
            await inventoryService.releaseStock(eventId, quantity);
          }
        } catch (compErr) {
          console.error(`[Compensating Error]:`, compErr.message);
        }

        return {
          order: {
            status: 'failed',
            chaosRollback: true,
            seatNumber,
            gateLatencyMs: gateDurationMs,
            dbDurationMs,
            rawRedisCommand,
            message: `Compensating Rollback Executed: Database write crashed. Redis INCRBY (+1) restored stock and released seat ${seatNumber}.`,
            eventId,
            userId,
          },
          statusCode: 500,
        };
      }

      // Edge Case 1: Concurrent Idempotency Key Race Condition
      if (dbErr.code === '23505' && idempotencyKey) {
        console.warn(
          `[Idempotency Race Detected] Key '${idempotencyKey}' already inserted. Releasing redundant Redis reservation.`
        );
        try {
          if (seatNumber) {
            await inventoryService.releaseSeat(eventId, seatNumber, quantity);
          } else {
            await inventoryService.releaseStock(eventId, quantity);
          }
        } catch (compErr) {
          console.error(`[Compensating Error] Failed to release duplicate stock:`, compErr.message);
        }

        const existing = await pool.query(
          'SELECT id, event_id, user_id, quantity, status, seat_number, idempotency_key, created_at FROM orders WHERE idempotency_key = $1',
          [idempotencyKey]
        );
        if (existing.rows.length > 0) {
          return { order: existing.rows[0], statusCode: 200 };
        }
      }

      // Edge Case 2: Database Invariant Violation (available_tickets < 0)
      if (dbErr.code === '23514') {
        console.warn(
          `[Inventory Invariant Alert] Database CHECK constraint failed for event ${eventId}. Synchronizing Redis stock to 0.`
        );
        try {
          await redis.set(inventoryService.getStockKey(eventId), 0);
          if (seatNumber) {
            await inventoryService.releaseSeat(eventId, seatNumber, 0);
          }
        } catch (syncErr) {
          console.error(`[Redis Sync Error] Failed to set stock to 0:`, syncErr.message);
        }
        return {
          order: {
            status: 'failed',
            message: 'Sold out / Insufficient tickets',
            eventId,
            userId,
            quantity,
          },
          statusCode: 409,
        };
      }

      // Edge Case 3: Transient Database Error (Connection timeout, deadlock, etc.)
      console.error(
        `[Checkout DB Error] Transaction failed for event ${eventId}. Executing compensating rollback in Redis:`,
        dbErr.message
      );
      try {
        if (seatNumber) {
          await inventoryService.releaseSeat(eventId, seatNumber, quantity);
        } else {
          await inventoryService.releaseStock(eventId, quantity);
        }
      } catch (compensationErr) {
        console.error(
          `[CRITICAL COMPENSATING ERROR] Failed to restore Redis inventory for event ${eventId}:`,
          compensationErr.message
        );
      }

      throw dbErr;
    } finally {
      client.release(clientError && clientError.code === '57P01' ? true : undefined);
    }
  }

  /**
   * Returns seat reservation status for an event (booked seats list, total seats, available).
   * @param {string} eventId
   */
  async getEventSeats(eventId) {
    const event = await this.getEventById(eventId);
    if (!event) {
      const err = new Error(`Event '${eventId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    let bookedSeats = await inventoryService.getBookedSeats(eventId);

    // If Redis is empty but DB has confirmed orders with seat_number, re-sync Redis
    if (bookedSeats.length === 0) {
      const dbOrders = await pool.query(
        `SELECT DISTINCT seat_number FROM orders WHERE event_id = $1 AND status = 'confirmed' AND seat_number IS NOT NULL`,
        [eventId]
      );
      if (dbOrders.rows.length > 0) {
        const seats = dbOrders.rows.map(r => r.seat_number);
        const bookedKey = inventoryService.getBookedSeatsKey(eventId);
        for (const s of seats) {
          await redis.sadd(bookedKey, s);
        }
        bookedSeats = seats;
      }
    }

    return {
      eventId: event.id,
      name: event.name,
      totalSeats: event.total_tickets,
      availableTickets: event.available_tickets,
      bookedSeats,
    };
  }

  /**
   * Resets all booked seats and stock counter for an event.
   * @param {string} eventId
   */
  async resetEvent(eventId) {
    const event = await this.getEventById(eventId);
    if (!event) {
      const err = new Error(`Event '${eventId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    // Delete orders for this event to reset testing state
    await pool.query('DELETE FROM orders WHERE event_id = $1', [eventId]);

    // Restore available_tickets = total_tickets in Postgres
    await pool.query(
      'UPDATE events SET available_tickets = total_tickets WHERE id = $1',
      [eventId]
    );

    // Reset Redis stock and clear booked_seats set
    await inventoryService.resetSeats(eventId, event.total_tickets);

    return {
      eventId: event.id,
      message: 'Event seats and inventory reset successfully.',
      totalSeats: event.total_tickets,
      availableTickets: event.total_tickets,
      bookedSeats: [],
    };
  }

  /**
   * Lists events, auto-seeding the 3 default featured cinema & concert events if needed.
   */
  async listEvents() {
    const defaultEvents = [
      { name: 'Oppenheimer 70mm', totalTickets: 60 },
      { name: 'Hans Zimmer Live', totalTickets: 60 },
      { name: 'Interstellar Re-release', totalTickets: 60 },
    ];

    const res = await pool.query(
      'SELECT id, name, total_tickets, available_tickets, created_at FROM events ORDER BY created_at DESC'
    );

    for (const def of defaultEvents) {
      const exists = res.rows.find(e => e.name.toLowerCase().includes(def.name.toLowerCase()));
      if (!exists) {
        await this.createEvent(def);
      }
    }

    const updatedRes = await pool.query(
      'SELECT id, name, total_tickets, available_tickets, created_at FROM events ORDER BY created_at DESC'
    );
    return updatedRes.rows;
  }

  /**
   * Alias for processCheckout to maintain backward compatibility with Phase 1 callers.
   */
  async checkout(params) {
    return this.processCheckout(params);
  }
}

module.exports = new TicketService();
