/**
 * End-to-End Verification Script: Next.js Frontend + Express Backend
 */

async function main() {
  console.log('======================================================================');
  console.log('  END-TO-END VERIFICATION: NEXT.JS FRONTEND + EXPRESS BACKEND          ');
  console.log('======================================================================\n');

  // 1. Verify Next.js frontend response
  const homeRes = await fetch('http://localhost:3001');
  console.log('1. GET http://localhost:3001 Status:', homeRes.status);
  const html = await homeRes.text();
  console.log('   Rendered HTML contains page title:', html.includes('Flash-Sale Engine'));

  // 2. Create Event through Next.js proxy
  const createRes = await fetch('http://localhost:3001/api/backend/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Integration Test Event', total_tickets: 10 })
  });
  const event = await createRes.json();
  console.log('2. Created Event via Proxy: ID =', event.id, '| Capacity =', event.total_tickets);

  // 3. Pre-warm cache
  const prewarmRes = await fetch('http://localhost:3001/api/backend/events/' + event.id + '/prewarm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('3. Pre-warmed Redis Cache via Proxy:', prewarmRes.status === 200 ? 'SUCCESS' : 'FAILED');

  // 4. Simulate 25-request concurrent burst
  console.log('4. Firing 25 concurrent checkouts for quantity 1 against 10 tickets...');
  const startBurst = Date.now();
  const runId = Date.now();
  const results = await Promise.all(
    Array.from({ length: 25 }, (_, i) =>
      fetch('http://localhost:3001/api/backend/events/' + event.id + '/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'idempotency-key': `burst-idem-${runId}-${i}`
        },
        body: JSON.stringify({
          userId: `burst-user-${i}`,
          quantity: 1,
          idempotencyKey: `burst-idem-${runId}-${i}`
        })
      }).then(r => r.status)
    )
  );
  const burstDuration = Date.now() - startBurst;

  const count201 = results.filter(s => s === 201).length;
  const count409 = results.filter(s => s === 409).length;
  const count500 = results.filter(s => s >= 500).length;

  console.log('   Burst Duration          :', burstDuration, 'ms');
  console.log('   HTTP 201 Confirmed      :', count201, '(Expected: 10)');
  console.log('   HTTP 409 Sold-Out Gate  :', count409, '(Expected: 15)');
  console.log('   HTTP 500 Server Errors  :', count500, '(Expected: 0)');

  // 5. Inspect final DB stock
  const verifyRes = await fetch('http://localhost:3001/api/backend/events/' + event.id);
  const finalEvent = await verifyRes.json();
  console.log('5. Final PostgreSQL Stock   :', finalEvent.available_tickets, '(Expected: 0)');

  const success = count201 === 10 && count409 === 15 && count500 === 0 && finalEvent.available_tickets === 0;
  console.log('\n======================================================================');
  console.log(success ? '  ✔ END-TO-END VERIFICATION PASSED PERFECTLY!' : '  ❌ VERIFICATION FAILED');
  console.log('======================================================================\n');

  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
