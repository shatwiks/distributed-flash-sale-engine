// taste-skill-ignore
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Gauge } from 'k6/metrics';

// ============================================================================
// CONFIGURATION & OPTIONS
// ============================================================================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom k6 metrics to track checkout order outcomes
const confirmedOrders = new Counter('confirmed_orders');
const failedOrders = new Counter('failed_orders');
const finalAvailableGauge = new Gauge('final_available_tickets');

export const options = {
  scenarios: {
    race_condition: {
      // High-concurrency scenario: 50 virtual users execute 50 total iterations
      // with no ramp-up, firing all requests as close to simultaneously as possible.
      // (Alternatively, executor: 'per-vu-iterations' with vus: 50, iterations: 1)
      executor: 'shared-iterations',
      vus: 50,
      iterations: 50,
      maxDuration: '30s',
    },
  },
};

// ============================================================================
// SETUP PHASE
// ============================================================================
/**
 * Setup runs once before the load stage.
 * Creates an event with total_tickets: 10 and returns the event ID.
 */
export function setup() {
  const payload = JSON.stringify({
    name: 'Flash Sale Race Condition Test',
    total_tickets: 10,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/events`, payload, params);

  const isCreated = check(res, {
    'setup: event created successfully (HTTP 201)': (r) => r.status === 201,
  });

  if (!isCreated || res.status !== 201) {
    throw new Error(`[Setup Failed] Failed to create event: HTTP ${res.status} - ${res.body}`);
  }

  const event = res.json();
  console.log('\n======================================================');
  console.log(`[SETUP] Event created: ID=${event.id}, total_tickets=10`);
  console.log(`[SETUP] Firing 50 concurrent checkout requests...`);
  console.log('======================================================\n');

  return {
    eventId: event.id,
    totalTickets: 10,
  };
}

// ============================================================================
// MAIN TEST FUNCTION (LOAD STAGE)
// ============================================================================
/**
 * Main function executed by virtual users concurrently.
 * Each VU sends exactly ONE checkout request for quantity: 1, with a unique
 * userId and idempotencyKey.
 */
export default function (data) {
  const url = `${BASE_URL}/events/${data.eventId}/checkout`;
  const payload = JSON.stringify({
    userId: `user-${__VU}`,
    quantity: 1,
    idempotencyKey: `key-${__VU}-${__ITER}`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  // Requirement 2: Check that the response is either 201 or 409.
  // Flags if the naive implementation crashes with 500 (e.g. pool exhaustion or unhandled error)
  // instead of failing gracefully.
  const isGraceful = check(res, {
    'status is 201 or 409 (graceful handling, not 500)': (r) =>
      r.status === 201 || r.status === 409,
  });

  if (res.status === 201) {
    confirmedOrders.add(1);
  } else if (res.status === 409) {
    failedOrders.add(1);
  }
}

// ============================================================================
// TEARDOWN PHASE
// ============================================================================
/**
 * Teardown runs once after all VUs complete.
 * Calls GET /events/:id to inspect the final inventory state in PostgreSQL
 * and records the gauge for summary reporting.
 */
export function teardown(data) {
  const res = http.get(`${BASE_URL}/events/${data.eventId}`);

  if (res.status === 200) {
    const event = res.json();
    const available = event.available_tickets;
    finalAvailableGauge.add(available);

    console.log('\n=================== TEARDOWN ===================');
    console.log(`[Teardown] Event ID               : ${event.id}`);
    console.log(`[Teardown] Initial Total Tickets  : ${data.totalTickets}`);
    console.log(`[Teardown] Final available_tickets: ${available}`);
    console.log(`[Teardown] Aggregate 201 vs 409 counts are summarized below.`);
    console.log('================================================\n');
  } else {
    console.error(`[Teardown Error] Failed to fetch event ${data.eventId}: HTTP ${res.status}`);
  }
}

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
/**
 * ARCHITECTURAL INSIGHT:
 * PostgreSQL CHECK Constraint vs Application Business Logic
 * -----------------------------------------------------------
 * In a naive checkout implementation lacking row locks (`SELECT ... FOR UPDATE`),
 * multiple concurrent requests execute the SELECT query before any pending UPDATE
 * commits. Because no row-level lock is held, all concurrent transactions see the
 * exact same `available_tickets` snapshot (e.g. 10 tickets remaining), pass the
 * `if (available_tickets >= quantity)` condition, and attempt to decrement inventory.
 *
 * In PostgreSQL, schema.sql defines:
 *   available_tickets INT NOT NULL CHECK (available_tickets >= 0)
 *
 * Under concurrent traffic:
 * 1. The first 10 requests serialize their UPDATEs, decrementing inventory to 0 (201 Confirmed).
 * 2. Subsequent requests attempt:
 *      UPDATE events SET available_tickets = available_tickets - 1 WHERE id = $2
 *    This would set available_tickets to -1, violating the CHECK constraint.
 * 3. PostgreSQL aborts those transactions with SQLSTATE 23514 (check_violation).
 * 4. The Express centralized errorHandler catches '23514' and maps it to HTTP 409 Conflict.
 *
 * CRITICAL DISTINCTION:
 * While the client sees a 409 Conflict, it was NOT caused by the application's
 * business logic check (`available_tickets >= quantity`). The application code was
 * completely oblivious and attempted to oversell; the transaction was aborted at the
 * database layer by the CHECK constraint.
 *
 * If the CHECK constraint were absent, `available_tickets` would plunge to negative
 * numbers (-40) and all 50 orders would be confirmed (massive overselling).
 * Furthermore, under 50 concurrent requests, PostgreSQL pool exhaustion (`max: 20`,
 * `connectionTimeoutMillis: 2000`) can trigger unhandled connection errors and HTTP 500s.
 */
export function handleSummary(data) {
  const confirmed = (data.metrics && data.metrics.confirmed_orders && data.metrics.confirmed_orders.values)
    ? data.metrics.confirmed_orders.values.count
    : 0;
  const failed = (data.metrics && data.metrics.failed_orders && data.metrics.failed_orders.values)
    ? data.metrics.failed_orders.values.count
    : 0;
  const finalAvailable = (data.metrics && data.metrics.final_available_tickets && data.metrics.final_available_tickets.values)
    ? data.metrics.final_available_tickets.values.value
    : 0;

  const totalTickets = 10;
  const otherResponses = Math.max(0, 50 - (confirmed + failed));

  // ANSI escape codes for formatting
  const redBold = '\x1b[1;31m';
  const greenBold = '\x1b[1;32m';
  const yellowBold = '\x1b[1;33m';
  const bold = '\x1b[1m';
  const reset = '\x1b[0m';

  let verdict = '';

  // Verdict logic
  if (confirmed > totalTickets) {
    verdict += `${redBold}❌ OVERSELLING DETECTED: ${confirmed} tickets confirmed against ${totalTickets} available${reset}\n`;
  } else if (confirmed === totalTickets && finalAvailable >= 0) {
    verdict += `${greenBold}✅ No overselling detected${reset}\n`;
  } else {
    verdict += `${yellowBold}⚠️ Partial fulfillment: ${confirmed} tickets confirmed against ${totalTickets} available (available in DB: ${finalAvailable})${reset}\n`;
  }

  // Check if final available_tickets is negative
  if (finalAvailable !== null && finalAvailable < 0) {
    verdict += `\n${yellowBold}⚠️ WARNING: final available_tickets in Postgres is negative (${finalAvailable})!\n` +
      `The database CHECK constraint (available_tickets >= 0) should have prevented this —\n` +
      `meaning the constraint was bypassed or failed.${reset}\n`;
  } else {
    verdict += `\n${bold}Constraint & Concurrency Analysis:${reset}\n` +
      `- Initial Stock       : ${totalTickets}\n` +
      `- Final Stock in DB   : ${finalAvailable}\n` +
      `- Confirmed (201)     : ${confirmed}\n` +
      `- Failed (409)        : ${failed}\n` +
      `- Crashes / 500s      : ${otherResponses}\n\n` +
      `Note: If confirmed orders stopped at ${totalTickets} and remaining requests received 409,\n` +
      `the requests tripped PostgreSQL CHECK constraint 23514 rather than failing at the\n` +
      `application business-logic check. If 500s occurred, the connection pool was exhausted.\n`;
  }

  const output = [
    '',
    '================================================================================',
    '                 LOAD TEST SUMMARY: CONCURRENCY RACE CONDITION                  ',
    '================================================================================',
    `Total Checkout Requests Fired : 50`,
    `Confirmed Orders (HTTP 201)   : ${confirmed}`,
    `Failed Orders (HTTP 409)      : ${failed}`,
    `Errors / 500s                 : ${otherResponses}`,
    `Initial Available Tickets     : ${totalTickets}`,
    `Final Available in Database   : ${finalAvailable}`,
    '--------------------------------------------------------------------------------',
    'VERDICT:',
    verdict.trim(),
    '================================================================================',
    '',
  ].join('\n');

  return {
    stdout: output,
  };
}
