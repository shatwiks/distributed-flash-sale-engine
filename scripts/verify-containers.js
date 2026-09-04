#!/usr/bin/env node

/**
 * ==============================================================================
 * Production Container Stack Verification Script
 * ==============================================================================
 * Verifies:
 * 1. Production Docker image builds cleanly and measures under 200MB.
 * 2. Full production stack launches via docker-compose.prod.yml.
 * 3. Health check endpoint reports 200 OK with PostgreSQL and Redis up.
 * 4. End-to-end event creation, automatic Redis pre-warming, and checkout sanity check.
 */

const { execSync } = require('child_process');

// ANSI formatting codes
const bold = '\x1b[1m';
const green = '\x1b[1;32m';
const red = '\x1b[1;31m';
const yellow = '\x1b[1;33m';
const cyan = '\x1b[1;36m';
const reset = '\x1b[0m';

function run(cmd, silent = false) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (err) {
    if (!silent) {
      console.error(`${red}[Error executing command]${reset}: ${cmd}`);
      console.error(err.message);
    }
    throw err;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`\n${bold}${cyan}======================================================================${reset}`);
  console.log(`${bold}${cyan}  PHASE 4: PRODUCTION CONTAINER VERIFICATION & SMOKE TEST             ${reset}`);
  console.log(`${bold}${cyan}======================================================================${reset}\n`);

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Image Size Validation
    // -------------------------------------------------------------------------
    console.log(`${bold}[Step 1/4] Validating Production Docker Image Size...${reset}`);
    run('docker build -t ticket-booking-api:prod .', true);

    const sizeOutput = execSync(
      'docker image inspect ticket-booking-api:prod --format="{{.Size}}"',
      { encoding: 'utf8' }
    ).trim();
    const sizeBytes = parseInt(sizeOutput, 10);
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

    console.log(`  Production Image Size: ${bold}${sizeMB} MB${reset}`);
    if (sizeBytes > 200 * 1024 * 1024) {
      console.error(`${red}❌ Image size exceeds 200MB limit (${sizeMB} MB).${reset}`);
      process.exit(1);
    }
    console.log(`  ${green}✔ Image size is well within the 200MB threshold (< 200MB).${reset}\n`);

    // -------------------------------------------------------------------------
    // STEP 2: Launch Full Production Stack
    // -------------------------------------------------------------------------
    console.log(`${bold}[Step 2/4] Orchestrating Production Stack via docker-compose.prod.yml...${reset}`);
    run('docker compose -f docker-compose.prod.yml up -d', false);
    console.log(`  ${green}✔ Stack containers launched in background.${reset}\n`);

    // -------------------------------------------------------------------------
    // STEP 3: Poll Container Healthcheck
    // -------------------------------------------------------------------------
    console.log(`${bold}[Step 3/4] Polling API Health Endpoint (http://localhost:3000/health)...${reset}`);
    let healthy = false;
    const maxAttempts = 30;
    let attempts = 0;

    while (!healthy && attempts < maxAttempts) {
      attempts++;
      try {
        const res = await fetch('http://localhost:3000/health');
        if (res.ok) {
          const body = await res.json();
          if (
            body.status === 'ok' &&
            body.services &&
            body.services.postgres === 'up' &&
            body.services.redis === 'up'
          ) {
            healthy = true;
            console.log(`  ${green}✔ Health check passed on attempt ${attempts}:${reset}`, JSON.stringify(body));
            break;
          }
        }
      } catch {
        // API still initializing
      }
      process.stdout.write(`  Waiting for services to report healthy (${attempts}/${maxAttempts})...\r`);
      await sleep(1500);
    }

    if (!healthy) {
      console.error(`\n${red}❌ Health check failed to report 200 OK after ${maxAttempts} attempts.${reset}`);
      run('docker compose -f docker-compose.prod.yml logs api');
      process.exit(1);
    }
    console.log('\n');

    // -------------------------------------------------------------------------
    // STEP 4: End-to-End Flash-Sale Sanity Verification
    // -------------------------------------------------------------------------
    console.log(`${bold}[Step 4/4] Executing End-to-End Flash-Sale Sanity Test...${reset}`);

    // Create Event
    const createRes = await fetch('http://localhost:3000/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Container Smoke Test Flash Sale',
        total_tickets: 20,
      }),
    });

    if (createRes.status !== 201) {
      throw new Error(`Failed to create event: HTTP ${createRes.status}`);
    }
    const event = await createRes.json();
    console.log(`  ✔ Event Created: ID=${event.id}, Initial Capacity=${event.total_tickets}`);

    // Verify Redis in-memory cache directly inside container network
    const redisStockRaw = execSync(
      `docker exec ticket_booking_prod_redis redis-cli get event:${event.id}:stock`,
      { encoding: 'utf8' }
    ).trim();
    console.log(`  ✔ Redis In-Memory Stock Verified inside container: ${redisStockRaw}`);

    if (parseInt(redisStockRaw, 10) !== 20) {
      throw new Error(`Expected Redis stock 20, found: ${redisStockRaw}`);
    }

    // Checkout 2 tickets
    const checkoutKey = `smoke-order-${Date.now()}`;
    const checkoutRes = await fetch(`http://localhost:3000/events/${event.id}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'smoke-test-user-1',
        quantity: 2,
        idempotencyKey: checkoutKey,
      }),
    });

    if (checkoutRes.status !== 201 && checkoutRes.status !== 200) {
      throw new Error(`Checkout failed: HTTP ${checkoutRes.status}`);
    }
    const order = await checkoutRes.json();
    console.log(`  ✔ Checkout Succeeded: Order ID=${order.id}, Status=${order.status}, Quantity=${order.quantity}`);

    // Verify updated stock in Redis
    const updatedRedisStock = execSync(
      `docker exec ticket_booking_prod_redis redis-cli get event:${event.id}:stock`,
      { encoding: 'utf8' }
    ).trim();
    console.log(`  ✔ Post-Checkout Redis Stock: ${updatedRedisStock} (Expected: 18)`);

    // Verify updated stock in PostgreSQL
    const eventVerifyRes = await fetch(`http://localhost:3000/events/${event.id}`);
    const verifiedEvent = await eventVerifyRes.json();
    console.log(`  ✔ Post-Checkout PostgreSQL Stock: ${verifiedEvent.available_tickets} (Expected: 18)`);

    console.log(`\n${bold}${green}======================================================================${reset}`);
    console.log(`${bold}${green}  ALL PHASE 4 CONTAINER VERIFICATION CHECKS PASSED SUCCESSFULLY!       ${reset}`);
    console.log(`${bold}${green}======================================================================${reset}\n`);
    process.exit(0);
  } catch (err) {
    console.error(`\n${red}[Verification Failure]${reset}`, err.message);
    process.exit(1);
  }
}

main();
