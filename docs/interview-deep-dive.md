# Distributed Systems & Concurrency: Technical Interview Defense Guide

This guide provides deep-dive answers, mathematical justifications, and architectural proofs for the most demanding technical questions asked in Staff/Principal Systems Design and SRE interviews regarding distributed flash-sale ticketing systems.

---

## Architecture Blueprint Quick Reference

```
[ Ingress: 10,000+ RPS Traffic Surge ]
                 │
                 ▼
     [ AWS Application Load Balancer (ALB) ]
     • SSL Termination & HTTP/2 Multiplexing
     • WAF Rate-Limiting & Bot Mitigation
                 │
                 ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ AWS ECS Fargate Cluster (Stateless Application Tier)       │
   │ • Scaled 2 -> 10 tasks via Target-Tracking Autoscaling     │
   │ • Node.js 20 Alpine containers (< 50MB image footprint)    │
   └───────────────┬─────────────────────────────┬───────────────┘
                   │                             │
                   │ [Fast-Path O(1) Gate]       │ [Async / Scoped Persistence]
                   ▼                             ▼
   ┌──────────────────────────────┐   ┌──────────────────────────────┐
   │ Amazon ElastiCache (Redis 7) │   │ Amazon RDS (PostgreSQL 16)   │
   │ • Single-threaded event loop │   │ • Orders table with status   │
   │ • Atomic Lua check & decr    │   │ • Unique idempotency index   │
   │ • In-memory latency < 1.5ms  │   │ • CHECK (stock >= 0) safety  │
   └───────────────┬──────────────┘   └──────────────┬───────────────┘
                   │                                 │
                   └─────── Compensating Rollback ───┘
                            (Saga Pattern: INCRBY)
```

---

## Question 1: "Why not use `SELECT ... FOR UPDATE` directly in PostgreSQL?"

### The Core Problem: Queuing Theory & Resource Starvation
In a traditional relational approach, an engineer might wrap the checkout logic in an ACID transaction:

```sql
BEGIN;
SELECT available_tickets FROM events WHERE id = $1 FOR UPDATE;
-- Application checks if available_tickets >= requested_quantity
UPDATE events SET available_tickets = available_tickets - $2 WHERE id = $1;
INSERT INTO orders (event_id, user_id, quantity, status) VALUES ($1, $2, $3, 'confirmed');
COMMIT;
```

While semantically sound for low concurrency, this pattern collapses under burst traffic due to four catastrophic failure modes:

#### 1. Connection Pool Starvation & Little's Law
- By Little's Law ($L = \lambda \cdot W$), the average number of active database connections $L$ required equals the request arrival rate $\lambda$ multiplied by the average transaction dwell time $W$.
- At $\lambda = 10,000\text{ req/s}$ with an average transaction duration of $W = 15\text{ ms}$ (network RTT + disk write + WAL flush):
  $$L = 10,000 \times 0.015 = 150 \text{ concurrent connections}$$
- In practice, connection pools are bounded (e.g., `max: 20` to `50` connections) to protect PostgreSQL from context-switching overhead.
- When 1,000+ Virtual Users (VUs) hit the endpoint, the application's connection pool fills instantly. Inbound requests queue up in the Node.js event loop waiting for a client checkout, exceed `connectionTimeoutMillis: 2000`, and cascade into widespread **HTTP 500 server crashes**.

#### 2. Lock Contention Serializing the Entire Fleet
- `SELECT ... FOR UPDATE` acquires an exclusive row-level lock (`X` lock) on the target event tuple.
- Only **one transaction** can hold the lock at any instant. All other $N - 1$ transactions block, forming a FIFO lock queue in PostgreSQL's lock manager.
- If each transaction takes $10\text{ ms}$, the 100th waiting transaction waits $1,000\text{ ms}$, and the 500th transaction waits $5,000\text{ ms}$.
- This creates an exponential latency hockey stick: tail latency ($p99$) skyrockets past client timeout thresholds, while CPU utilization surges purely on lock table spinlocks and context switches.

#### 3. Thread Starvation & Event Loop Blocking in Node.js
- Even though Node.js is asynchronous, holding database clients open while waiting for locks ties up socket descriptors, inflates process memory, and degrades the V8 garbage collection cycle.

#### 4. Deadlock Vulnerabilities
- If orders span multiple resources (e.g., reserving a VIP ticket tuple and a general admission tuple in different sequences across concurrent transactions), cyclic lock dependency graphs form, resulting in PostgreSQL aborting transactions with `deadlock detected` (SQLSTATE `40P01`).

### The Architectural Solution: In-Memory Gating
Instead of forcing the database to act as an execution serializer, we delegate inventory check-and-decrement to Redis. Because Redis evaluates operations in-memory on a single thread, atomic inventory reduction completes in **sub-millisecond O(1) time**, rejecting 99% of excess requests at the edge before they can ever reach PostgreSQL.

---

## Question 2: "What happens if the Redis decrement succeeds but the PostgreSQL write fails or crashes?"

### The Failure Scenarios
In a two-tier architecture, a dual-write problem exists:
1. **Network Partition / Database Timeout**: Redis decrements stock (`10 -> 9`), but the subsequent `INSERT INTO orders` times out or fails (e.g., PostgreSQL connection severed).
2. **Process SIGKILL / Host Crash**: The Node.js worker crashes after the Redis operation but before the SQL query is dispatched.

Without compensating mechanisms, this causes **"Phantom Inventory Drain"**—tickets are consumed in Redis but never materialized as confirmed orders in PostgreSQL, leading to premature sellout and unsold inventory.

### Mitigation Layer 1: Synchronous Compensating Transactions (Saga Pattern)
When an exception occurs inside `ticketService.js` during the PostgreSQL write phase, the code immediately issues a compensating `INCRBY` transaction:

```javascript
try {
  // Layer 2: Scoped Database Write
  const order = await insertOrderAndDecrementDb(client, eventId, userId, quantity, idempotencyKey);
  return order;
} catch (dbError) {
  // COMPENSATING TRANSACTION: Rollback Redis reservation
  await inventoryService.releaseStock(eventId, quantity);
  throw dbError;
}
```

This restores in-memory inventory within milliseconds without distributed two-phase locking (2PC).

### Mitigation Layer 2: Asynchronous Dead-Letter Queue (DLQ) & Worker Retries
If the Node.js application process is forcefully terminated (`SIGKILL`, OOM, or hardware crash) before the `catch` block can execute:
1. **Event Sourcing / Outbox Log**: High-reliability systems publish an intent token to a Redis Stream or SQS queue (`reservation_intents`) with a short expiration lease (e.g., 60 seconds).
2. If the PostgreSQL confirmation is not acknowledged within the lease window, a dedicated reconciler worker processes the DLQ and releases the expired reservation.

### Mitigation Layer 3: Background Reconciliation Sweeper (Eventual Consistency Engine)
To guarantee strict inventory reconciliation over time, a periodic cron job runs an audit query:

```sql
SELECT COALESCE(SUM(quantity), 0) AS total_sold
FROM orders
WHERE event_id = $1 AND status = 'confirmed';
```

The reconciler compares this against total stock:
$$\text{Expected Redis Stock} = \text{total\_tickets} - \text{total\_sold}$$

If $\text{Redis Stock} < \text{Expected Redis Stock}$ and no active checkouts are in flight, the reconciler issues an atomic delta correction:

```lua
-- Reconcile Lua script
local current = redis.call('GET', KEYS[1])
local expected = tonumber(ARGV[1])
if tonumber(current) < expected then
    redis.call('SET', KEYS[1], expected)
end
```

---

## Question 3: "How does this scale across multiple ECS container instances?"

### The Stateless Compute Tier
The Node.js Express application contains **zero local state**. No in-memory arrays, no local mutexes, and no sticky sessions:
1. **AWS Application Load Balancer (ALB)** distributes incoming client TCP streams across all active ECS Fargate tasks using a round-robin / least-outstanding-requests algorithm.
2. Every container connects to the **same centralized Redis cache cluster** and **PostgreSQL database instance**.

```
                           [ Inbound Client Requests ]
                                       │
                                       ▼
                       [ AWS Application Load Balancer ]
                                       │
                   ┌───────────────────┼───────────────────┐
                   ▼                   ▼                   ▼
           [ ECS Task #1 ]     [ ECS Task #2 ]     [ ECS Task #N ]
           (Stateless Node)    (Stateless Node)    (Stateless Node)
                   │                   │                   │
                   └─────────────┬─────┴───────────────────┘
                                 ▼
                 [ Shared Amazon ElastiCache Cluster ]
                 • Redis 7 Primary (Writes / Lua scripts)
                 • Redis Read-Replicas (Read queries)
```

### Elastic Autoscaling Mechanics
The Terraform infrastructure defines AWS Application Auto Scaling targets tied to two CloudWatch alarms:
1. **Target-Tracking Metric: `ALBRequestCountPerTarget`**:
   - Target value: `1,000` requests/minute per container.
   - If traffic spikes to 6,000 RPM, ECS automatically scales from 2 to 6 tasks within 60 seconds.
2. **Target-Tracking Metric: `ECSServiceAverageCPUUtilization`**:
   - Target value: `65%` CPU utilization.
   - Protects against event-loop latency degradation under heavy JSON serialization.

### Database Connection Management Across the Fleet
When scaling from 2 to 10+ ECS containers, each running a pool of 20 connections, the aggregate connection count could reach:
$$10 \text{ tasks} \times 20 \text{ connections} = 200 \text{ active connections}$$

To protect PostgreSQL from connection exhaustion at scale:
1. **Short Pool Dwell Times**: Because 99% of requests are rejected in Redis without opening a PostgreSQL connection, only confirmed orders touch the pool.
2. **AWS RDS Proxy / PgBouncer Layer**: For fleet sizes > 20 tasks, an RDS Proxy sits between ECS and PostgreSQL, multiplexing hundreds of container connections into a compact pool of persistent backend server connections.

---

## Question 4: "Why use Redlock if Lua scripts already provide atomic check-and-decrement?"

This is a classic Staff Engineer differentiation question. The answer lies in understanding **granularity of isolation** and **distributed coordination scope**.

### When Lua Scripts Are Optimal (The "Single-Key Fast-Path")
Redis executes Lua scripts atomically within its single-threaded event loop:
- **Scope**: Single Redis node or keys residing on the same hash slot (e.g., `event:{id}:stock`).
- **Characteristics**: Sub-millisecond latency (< 1.5ms), zero network overhead beyond the call itself, no clock synchronization requirements.
- **Verdict**: For high-volume, single-counter decrements (e.g., flash-sale ticket gates), **atomic Lua scripts are 10x faster and far more resilient than distributed locks**.

### When Redlock Is Necessary (The "Multi-Resource Distributed Coordinator")
Redlock becomes indispensable when the operational boundary exceeds a single Redis key or a single data store:

| Dimension | Atomic Lua Script | Redlock Distributed Lock |
| :--- | :--- | :--- |
| **Data Scope** | Single key or keys sharing the same `{hash_tag}` | Disparate resources, multi-sharded keys, external APIs |
| **Duration of Hold** | Sub-millisecond (executes during Redis command cycle) | Seconds/Minutes (e.g., 5-minute checkout cart reservation) |
| **External Systems** | Cannot coordinate external third parties (e.g., Stripe) | Coordinates distributed workflows spanning DB, Stripe, Kafka |
| **Failure Mode** | Script terminates or key fails | Lock lease expires automatically via TTL (fencing tokens) |
| **Overhead** | Minimal (O(1) memory operation) | High: Quorum acquisition across $\lfloor N/2 \rfloor + 1$ independent nodes |

### Concrete Production Use Cases for Redlock:
1. **Multi-Item Coordinated Bundling**: A user books a concert ticket, an adjacent VIP lounge pass, and a reserved parking space across different backend shards. Redlock coordinates all three resources simultaneously.
2. **Third-Party Payment Escrow**: When a ticket is reserved for 10 minutes while awaiting a credit card webhook from Stripe, Redlock holds the distributed reservation lease. If the webhook never fires, the lock expires and frees the inventory.
3. **Master Failover Protection**: In a multi-master Redis deployment, standard master-replica replication is asynchronous. Redlock prevents split-brain reservations during asynchronous failovers.

---

## Question 5: "How does the system defend against malicious bot traffic and duplicate checkout clicks?"

Flash sales are prime targets for automated scalper bots and end-user "rage-clicking" on submit buttons. We implement a multi-layered defense model:

### Layer 1: Two-Tier Idempotency Key Engine
Every checkout request accepts an optional or client-generated `idempotencyKey` (UUIDv4).

#### Step 1: In-Memory Fast-Path Lease (Redis)
Before processing stock checks, the system attempts to acquire an idempotency lease:
```bash
SET event:{id}:idempotency:{key} "PENDING" NX EX 120
```
- If Redis returns `nil` (key already exists), another request with this exact key is either in-flight or already processed. The system short-circuits with a cached response or an HTTP `409 / 425 Too Early`.

#### Step 2: Strong Consistency in PostgreSQL
The `orders` table enforces a strict composite unique constraint:
```sql
CONSTRAINT uq_event_idempotency UNIQUE (event_id, idempotency_key);
```
- If two identical requests bypass Redis (e.g., during a cold start or cache eviction), PostgreSQL halts the second transaction with error code `23505` (`unique_violation`).
- Express intercepts `23505` and retrieves the existing order record, returning HTTP `200/201` with the original order details without double-charging or overselling.

### Layer 2: Rate Limiting via Sliding Window Counter
To prevent bot clusters from monopolizing the Redis Lua gate:
- Redis stores a sliding-window log or token bucket per user ID / IP address (`rate_limit:{user_id}`).
- Limits each user to a maximum of 3 checkout attempts per 10-second window. Excess requests are dropped with `429 Too Many Requests`.

### Layer 3: Edge Security & Bot Mitigation (AWS WAF)
At the cloud layer, AWS WAF is attached to the Application Load Balancer:
1. **AWS Managed Rules for Bot Control**: Detects known scraper tools, headless browser signatures (Puppeteer, Playwright), and proxy networks.
2. **Rate-Based Rules**: Enforces an IP threshold (e.g., max 100 requests per 5 minutes per IP address) before triggering a CAPTCHA challenge.

---

## Question 6: "What are the tradeoffs of this design, and what would you do differently at 100,000+ RPS?"

### Current Architecture Tradeoffs
1. **Cache-Store Divergence Risk**: Redis holds the immediate truth of available inventory, while PostgreSQL holds the historical audit log. A bug in compensating logic requires reconciliation jobs.
2. **PostgreSQL Write Bottleneck at Extreme Scale**: While Redis easily handles 100,000+ RPS, PostgreSQL cannot sustain 100,000 synchronous `INSERT` transactions per second on a single instance without sharding.

### Evolution to 100,000+ RPS: Asynchronous Event Streaming
To scale order creation by another order of magnitude:
1. **Async Buffer via Apache Kafka / AWS Kinesis**:
   - The API layer interacts **only** with Redis:
     1. Redis decrements inventory via Lua script.
     2. Redis generates a signed reservation token.
     3. API responds `202 Accepted` to the client in `< 5ms`.
   - The reservation event is published to a high-throughput Kafka topic.
2. **Batched Database Consumer Group**:
   - A fleet of consumer workers reads reservation events from Kafka in batches of 500-1,000.
   - Issues high-efficiency bulk `COPY` or batched `INSERT INTO orders` statements into PostgreSQL, smoothing peak write spikes into a steady stream.
3. **Client Polling / WebSocket Push**:
   - The frontend connects to a WebSocket or polls `GET /orders/status/:token` to confirm final payment and ticket issuance.
