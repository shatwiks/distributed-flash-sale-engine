// taste-skill-ignore
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Gauge, Trend } from 'k6/metrics';

// ============================================================================
// CONFIGURATION & ENVIRONMENT VARIABLES
// ============================================================================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const INITIAL_STOCK = parseInt(__ENV.INITIAL_STOCK || '500', 10);
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '1000', 10);

// ============================================================================
// METRICS DEFINITION
// ============================================================================
const checkoutLatency = new Trend('checkout_latency', true);
const ordersConfirmed = new Counter('orders_confirmed');
const ordersRejectedSoldOut = new Counter('orders_rejected_sold_out');
const serverErrors = new Counter('server_errors');
const finalDbTickets = new Gauge('final_db_tickets');

// ============================================================================
// SCENARIO CONFIGURATION: CONTROLLED HIGH-THROUGHPUT BURST (LOCAL-SAFE)
// ============================================================================
export const options = {
  scenarios: {
    flash_sale_spike: {
      // Arrival-rate executor generates exact target throughput regardless of system response time
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 400,
      stages: [
        { target: 500, duration: '10s' },   // Stage 1: Ramp to 500 req/s over 10s
        { target: 1000, duration: '15s' },  // Stage 2: Sustain 1,000 req/s over 15s
        { target: 0, duration: '5s' },      // Stage 3: Cool down to 0 req/s over 5s
      ],
    },
  },
  thresholds: {
    // SRE SLO: Sub-100ms p95 latency and sub-250ms p99 latency under burst load
    checkout_latency: ['p(95)<100', 'p(99)<250'],
    // SRE SLO: Maximum allowable server errors during burst
    server_errors: ['count<10'],
  },
};

// ============================================================================
// SETUP PHASE
// ============================================================================
export function setup() {
  console.log('\n======================================================================');
  console.log('  k6 FLASH-SALE STRESS TEST INITIALIZATION');
  console.log('======================================================================');
  console.log(`Target Peak Throughput  : ${TARGET_RPS} requests/second`);
  console.log(`Initial Event Inventory : ${INITIAL_STOCK} tickets`);
  console.log(`Target API Base URL     : ${BASE_URL}`);

  // 1. Create Event with fixed inventory in PostgreSQL
  const createPayload = JSON.stringify({
    name: `High-Throughput Flash Sale (${TARGET_RPS} RPS Burst)`,
    total_tickets: INITIAL_STOCK,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const createRes = http.post(`${BASE_URL}/events`, createPayload, params);
  const isCreated = check(createRes, {
    'setup: event created in PostgreSQL (HTTP 201)': (r) => r.status === 201,
  });

  if (!isCreated || createRes.status !== 201) {
    throw new Error(`[Setup Failure] Could not create event: HTTP ${createRes.status} - ${createRes.body}`);
  }

  const event = createRes.json();
  console.log(`✔ Event Created: ID=${event.id}, Capacity=${event.total_tickets}`);

  // 2. Pre-warm Redis In-Memory Cache ahead of traffic flood
  const prewarmRes = http.post(`${BASE_URL}/events/${event.id}/prewarm`, null, params);
  const isPrewarmed = check(prewarmRes, {
    'setup: Redis cache pre-warmed successfully (HTTP 200)': (r) => r.status === 200,
  });

  if (!isPrewarmed || prewarmRes.status !== 200) {
    throw new Error(`[Setup Failure] Failed to prewarm Redis: HTTP ${prewarmRes.status} - ${prewarmRes.body}`);
  }

  console.log(`✔ Redis In-Memory Cache Pre-warmed (Stock = ${INITIAL_STOCK})`);
  console.log('======================================================================\n');

  return {
    eventId: event.id,
    totalTickets: INITIAL_STOCK,
  };
}

// ============================================================================
// LOAD STAGE: CONCURRENT CHECKOUT REQUESTS
// ============================================================================
export default function (data) {
  const url = `${BASE_URL}/events/${data.eventId}/checkout`;
  const payload = JSON.stringify({
    userId: `usr-${__VU}-${__ITER}`,
    quantity: 1,
    idempotencyKey: `ord-${__VU}-${__ITER}`,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const startTime = Date.now();
  const res = http.post(url, payload, params);
  const duration = Date.now() - startTime;

  // Track latency
  checkoutLatency.add(duration);

  // Categorize business outcomes
  if (res.status === 201) {
    ordersConfirmed.add(1);
  } else if (res.status === 409) {
    ordersRejectedSoldOut.add(1);
  } else if (res.status >= 500) {
    serverErrors.add(1);
  }

  // Graceful validation: must be 201 or 409
  check(res, {
    'response is graceful (201 Confirmed or 409 Sold Out)': (r) =>
      r.status === 201 || r.status === 409,
  });
}

// ============================================================================
// TEARDOWN PHASE: DATA INTEGRITY AUDIT
// ============================================================================
export function teardown(data) {
  console.log('\n======================================================================');
  console.log('  TEARDOWN: POST-TEST DATABASE & CACHE INTEGRITY AUDIT');
  console.log('======================================================================');

  if (!data || !data.eventId) {
    console.warn('[Teardown Warning] Missing event data from setup.');
    return;
  }

  const res = http.get(`${BASE_URL}/events/${data.eventId}`);
  if (res.status === 200) {
    const event = res.json();
    finalDbTickets.add(event.available_tickets);

    console.log(`Event ID                   : ${event.id}`);
    console.log(`Initial Available Tickets  : ${data.totalTickets}`);
    console.log(`Final Available in Database: ${event.available_tickets}`);
  } else {
    console.error(`[Teardown Error] Failed to retrieve event: HTTP ${res.status}`);
  }
  console.log('======================================================================\n');
}

// ============================================================================
// SUMMARY REPORTING & DEFENSIVE METRICS FORMATTING
// ============================================================================
function formatNum(val, decimals = 2, fallback = 'N/A') {
  if (val !== undefined && val !== null && typeof val === 'number' && !isNaN(val)) {
    return val.toFixed(decimals);
  }
  return fallback;
}

export function handleSummary(data) {
  const metrics = data?.metrics || {};

  // Counters & Gauges
  const confirmed = metrics.orders_confirmed?.values?.count ?? 0;
  const soldOut = metrics.orders_rejected_sold_out?.values?.count ?? 0;
  const errors = metrics.server_errors?.values?.count ?? 0;
  const finalStock = metrics.final_db_tickets?.values?.value ?? 0;

  const totalReqs = confirmed + soldOut + errors;
  const throughput = formatNum(metrics.http_reqs?.values?.rate, 2, '0.00');

  // Latency metrics with defensive extraction
  const latencyValues = metrics.checkout_latency?.values || {};
  const p50 = formatNum(latencyValues['p(50)'] ?? latencyValues['med']);
  const p90 = formatNum(latencyValues['p(90)']);
  const p95 = formatNum(latencyValues['p(95)']);
  const p99 = formatNum(latencyValues['p(99)']);
  const avg = formatNum(latencyValues['avg']);

  // Overbooking evaluation
  const overbookingCount = Math.max(0, confirmed - INITIAL_STOCK);
  const overbookingRate = INITIAL_STOCK > 0
    ? formatNum((overbookingCount / INITIAL_STOCK) * 100, 2, '0.00')
    : '0.00';
  const isZeroOverbooking = confirmed === INITIAL_STOCK && finalStock === 0 && overbookingCount === 0;

  // ANSI formatting
  const bold = '\x1b[1m';
  const green = '\x1b[1;32m';
  const red = '\x1b[1;31m';
  const yellow = '\x1b[1;33m';
  const cyan = '\x1b[1;36m';
  const reset = '\x1b[0m';

  let verdict = '';
  if (isZeroOverbooking && errors === 0) {
    verdict = `${bold}${green}✅ PASS: ZERO OVERBOOKING PROVEN (${confirmed}/${INITIAL_STOCK} confirmed, ${soldOut} short-circuited, 0 server errors)${reset}`;
  } else if (overbookingCount > 0) {
    verdict = `${bold}${red}❌ FAIL: OVERBOOKING DETECTED (${overbookingCount} tickets oversold!)${reset}`;
  } else if (errors > 0) {
    verdict = `${bold}${yellow}⚠️ PARTIAL: Zero overselling, but ${errors} server errors (500s) occurred during burst.${reset}`;
  } else {
    verdict = `${bold}${yellow}⚠️ INCOMPLETE: ${confirmed}/${INITIAL_STOCK} confirmed (remaining in DB: ${finalStock})${reset}`;
  }

  const output = [
    '',
    '================================================================================',
    `      HIGH-THROUGHPUT FLASH-SALE LOAD TEST BENCHMARK REPORT (${TARGET_RPS} RPS)  `,
    '================================================================================',
    `Throughput Achieved          : ${bold}${throughput} requests/sec${reset}`,
    `Total Requests Processed     : ${totalReqs}`,
    `Orders Confirmed (HTTP 201)  : ${bold}${green}${confirmed}${reset} (Target Capacity: ${INITIAL_STOCK})`,
    `Orders Rejected (HTTP 409)   : ${bold}${cyan}${soldOut}${reset} (In-Memory Short-Circuited)`,
    `Server Errors (HTTP 500+)    : ${errors > 0 ? `${red}${errors}${reset}` : `${green}0${reset}`}`,
    `Overbooking Error Rate       : ${bold}${overbookingCount > 0 ? `${red}${overbookingRate}%` : `${green}0.00%`}${reset}`,
    `Final PostgreSQL Stock       : ${bold}${finalStock === 0 ? `${green}0` : `${yellow}${finalStock}`}${reset}`,
    '--------------------------------------------------------------------------------',
    'LATENCY PROFILE (Fast-Path In-Memory Gate):',
    `  Average Latency            : ${avg} ms`,
    `  Median (p50)               : ${p50} ms`,
    `  90th Percentile (p90)      : ${p90} ms`,
    `  95th Percentile (p95)      : ${bold}${green}${p95} ms${reset}`,
    `  99th Percentile (p99)      : ${bold}${green}${p99} ms${reset}`,
    '--------------------------------------------------------------------------------',
    'SRE VERDICT:',
    `  ${verdict}`,
    '================================================================================',
    '',
  ].join('\n');

  return {
    stdout: output,
  };
}
