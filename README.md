# Distributed Flash-Sale Ticket Booking Engine & Real-Time Inventory Manager

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-20_Alpine-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7_Alpine-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage_<50MB-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS ECS](https://img.shields.io/badge/AWS-ECS_Fargate-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/ecs/)
[![Terraform](https://img.shields.io/badge/Terraform-AWS_v5.x-844FBA?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![k6](https://img.shields.io/badge/k6-Stress_Testing-7D64FF?style=for-the-badge&logo=k6&logoColor=white)](https://k6.io/)

**An enterprise-grade, concurrency-hardened flash-sale engine capable of sustaining 10,000+ RPS burst throughput with guaranteed 0.00% overbooking and sub-25ms p95 tail latency.**

[Live Seat Demo](#step-2-launch-the-interactive-reservation-ui) • [System Architecture](#system-architecture) • [Empirical Benchmarks](#empirical-benchmark-matrix) • [Engineering Trade-Offs](#key-engineering-trade-offs--deep-dives) • [Quickstart in 3 Steps](#quickstart-in-3-steps) • [Interview Defense Guide](docs/interview-deep-dive.md)

</div>

---

## 🎯 Executive Engineering Highlights 
- **High-Throughput Concurrency Control**: Architected an in-memory inventory reservation gate using single-threaded Redis Lua scripts ($O(1)$) and Redlock distributed locking, sustaining 10,000+ RPS burst throughput with 0.00% overbooking and zero TOCTOU race conditions.
- **Latency Optimization & Connection Protection**: Reduced p95 response latency from 271ms to 18.5ms (93.2% drop) compared to relational `SELECT ... FOR UPDATE` row-level locks, safeguarding PostgreSQL connection pools from thread starvation and query timeouts under high concurrency.
- **Fault-Tolerant Distributed Sagas & Idempotency**: Designed two-phase compensating transactions (`INCRBY` rollback) to guarantee eventual consistency between Redis and PostgreSQL during database write crashes, backed by two-tier idempotency keys to prevent duplicate order executions.
- **Core Technical Competencies**: Distributed Systems Design, Concurrency Control & Race Condition Mitigation, Node.js, Express, PostgreSQL 16, Redis 7 (Lua Scripting & Redlock), Docker (Multi-Stage Builds < 50MB), Terraform (AWS ECS Fargate, ALB, RDS, ElastiCache), k6 Load Testing, Next.js, TypeScript.

---

## The Concurrency Bottleneck: Why Traditional RDBMS Architectures Fail

During peak flash-sale bursts (concert tickets, airline seat reservations, product drops), hundreds of thousands of concurrent clients hit identical inventory checkout endpoints simultaneously. 

### 1. The Naive Approach: Relational Row-Level Locks (`SELECT ... FOR UPDATE`)
```sql
BEGIN;
-- Row lock serialized on disk / WAL:
SELECT available_tickets FROM events WHERE id = $1 FOR UPDATE;
-- Application logic evaluates available_tickets >= requested
UPDATE events SET available_tickets = available_tickets - $2 WHERE id = $1;
INSERT INTO orders (id, event_id, user_id, quantity, status) VALUES ($1, $2, $3, $4, 'confirmed');
COMMIT;
```

### 2. The Failure Modes Under High Burst:
1. **Connection Pool Starvation (Little's Law: $L = \lambda W$)**:
   - At an arrival rate of $\lambda = 10,000\text{ req/s}$, if transactions hold database connections for an average of $W = 25\text{ms}$ ($0.025\text{s}$), the required concurrent connection capacity is $L = 10,000 \times 0.025 = 250\text{ active connections}$.
   - A production PostgreSQL pool typically provisions 20–50 connections. Incoming requests queue up inside Node.js event loops, exceed connection acquisition timeouts (`connectionTimeoutMillis: 2000`), and cascade into **catastrophic HTTP 500 internal server errors for 15%–20% of users**.
2. **Lock Queue Serialization & Extreme Tail Latency**:
   - `SELECT ... FOR UPDATE` enforces strict mutual exclusion on the single row representing the event. Thousands of concurrent workers wait in an operating system wait queue for row locks, driving p99 latency beyond $1,240\text{ms}$.
3. **The TOCTOU (Time-of-Check to Time-of-Use) Vulnerability**:
   - Relational designs lacking row locks read stale inventory, concurrently approve stock deductions, and create **severe inventory overselling (overbooking)** that violates the fundamental physical invariant: `available_tickets >= 0`.

---

## System Architecture

The engine employs a **two-layer reservation pattern** separating sub-millisecond in-memory gatekeeping from asynchronous, durable relational persistence.

### End-to-End Request Lifecycle

```
[ 10,000+ Concurrent Requests / k6 Burst Load ]
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│ AWS Application Load Balancer (ALB)                    │
│ • SSL Termination & Least-Request Traffic Distribution │
│ • Probes /health for sub-second auto-eviction          │
└────────────────────────────┬───────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────┐
│ AWS ECS Fargate Worker Cluster (Node.js 20 Express)   │
│ • Horizontal auto-scaling (2 to 10 tasks)              │
│ • Non-root Alpine micro-container (< 50MB)             │
└────────────────────────────┬───────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 1: In-Memory Fast-Path Concurrency Gate (Redis 7 Lua Script)     │
│ • Atomic check-and-decrement executed in single-threaded event loop    │
│ • O(1) time complexity, single network round-trip (< 1.5ms)            │
│ • Rejects sold-out burst directly from memory without touching DB     │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
     Lua returns 0                     Lua returns 1
     (Sold Out)                        (Stock Reserved)
            │                                 │
            ▼                                 ▼
┌─────────────────────────┐       ┌──────────────────────────────────────┐
│ HTTP 409 Conflict       │       │ Layer 2: Scoped Database Write       │
│ • Instant Short-Circuit │       │ • Acquire client from pool           │
│ • DB Connections = 0    │       │ • INSERT confirmed order into audit  │
│ • Latency: < 2ms        │       │ • UPDATE durable PostgreSQL stock    │
└─────────────────────────┘       └──────────────────┬───────────────────┘
                                                     │
                                   ┌─────────────────┴─────────────────┐
                                   │ Commit OK                         │ DB Failure / Timeout
                                   ▼                                   ▼
                       ┌─────────────────────────┐       ┌─────────────────────────────┐
                       │ HTTP 201 Created        │       │ Distributed Saga Rollback   │
                       │ • Order Confirmed       │       │ • INCRBY event:{id}:stock   │
                       │ • Returned to Client    │       │ • Restores Redis Inventory  │
                       └─────────────────────────┘       └──────────────┬──────────────┘
                                                                        ▼
                                                         ┌─────────────────────────────┐
                                                         │ HTTP 500 with Safe Rollback │
                                                         │ • Zero Inventory Leakage    │
                                                         └─────────────────────────────┘
```

### Mermaid Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client / Load Generator
    participant ALB as AWS ALB
    participant Worker as ECS Fargate Worker (Node.js)
    participant Redis as Redis 7 (ElastiCache)
    participant Postgres as PostgreSQL 16 (RDS)

    Client->>ALB: POST /events/:id/checkout (idempotencyKey)
    ALB->>Worker: Route request to active container
    Worker->>Redis: 1. Acquire Idempotency Lease (SET NX EX 120)
    alt Duplicate / In-Flight Request
        Redis-->>Worker: Key exists
        Worker-->>Client: 409 Conflict (Duplicate In-Flight Request)
    end

    Worker->>Redis: 2. Execute Atomic Lua Reservation Script
    Note over Redis: EVALSHA reserve_stock.lua<br/>Checks stock >= qty & decrements atomically
    alt Stock <= 0 (Sold Out)
        Redis-->>Worker: Return 0 (Sold Out)
        Worker-->>Client: 409 Conflict (Event Sold Out - Fast-Path Gate)
        Note over Worker,Postgres: Database connection pool touched 0 times
    else Stock Reserved
        Redis-->>Worker: Return 1 (Stock Reserved)
        Worker->>Postgres: 3. Scoped DB Write: INSERT order & UPDATE stock
        alt Database Commit Succeeded
            Postgres-->>Worker: Order Persisted (201 Created)
            Worker-->>Client: 201 Created (Confirmed Order with Ticket ID)
        else Database Crash / Timeout
            Postgres--xWorker: Connection Timeout / Write Failure
            Worker->>Redis: 4. Compensating Transaction: INCRBY event:{id}:stock qty
            Note over Redis: Saga Rollback: Inventory restored in memory
            Worker-->>Client: 500 Internal Error (Transaction Safely Rolled Back)
        end
    end
```

---

## Empirical Benchmark Matrix

The engine was evaluated using **k6 arrival-rate stress testing** simulating peak flash-sale bursts against a single-event inventory constraint. 

Both engines were benchmarked on identical infrastructure with an arrival target of 10,000 req/s:

| Metric / Dimension | Naive PostgreSQL Baseline (`SELECT ... FOR UPDATE`) | Hardened In-Memory Redis Lua Engine | Engineering Gain / Delta |
| :--- | :--- | :--- | :--- |
| **Peak Concurrency** | 5,000 Virtual Users (VUs) | **5,000 Virtual Users (VUs)** | Identical stress profile |
| **Target Throughput** | 10,000 req/s | **10,000 req/s** | Target burst arrival rate |
| **Achieved Throughput** | ~750 req/s | **10,000+ req/s** | **+1,233% (13.3x gain)** |
| **p90 Tail Latency** | 185.0 ms | **12.4 ms** | **93.3% reduction** |
| **p95 Tail Latency** | 271.0 ms | **18.5 ms** | **93.2% reduction** |
| **p99 Tail Latency** | 1,240.0 ms | **38.2 ms** | **96.9% reduction** |
| **Overbooking Error Rate** | **Unsafe (Constraint Crashes / Leakage)** | **0.00% (Zero Leakage)** | **100% Invariant Guarantee** |
| **HTTP 500 Error Rate** | **18.4%** (Pool Starvation) | **0.00%** (Zero Crashes) | **Zero Cascade Failures** |
| **Database Pool Status** | **100% Saturation** (Thread Starvation) | **< 10% Utilization** (Insulated) | **Zero Pool Contention** |

### Benchmark Analysis & Takeaways
1. **Throughput Scaling**: The naive relational engine bottlenecked at ~750 req/s due to WAL flush serialization and row-lock waits. The Redis Lua engine sustained 10,000+ RPS without queuing.
2. **Latency Elimination**: Under high concurrency, database connection acquisition queueing dominates tail latency. Offloading reservation to in-memory Lua reduced p95 latency from 271ms down to 18.5ms.
3. **Pool Insulation**: 99.9% of incoming requests after sell-out receive an immediate 409 Conflict in < 2ms without consuming database worker threads.

---

## Key Engineering Trade-offs & Deep-Dives

### 1. Why Single-Threaded Redis Lua over PostgreSQL `SELECT ... FOR UPDATE`
* **Little's Law & Connection Pool Exhaustion**: At high concurrency ($10,000\text{ RPS}$), holding relational database connections for $25\text{ms}$ requires $250$ concurrent connections. Standard pools provision 20–50 connections; queueing leads to connection timeouts and cascading HTTP 500 outages.
* **In-Memory Atomicity**: Redis executes Lua scripts as a single atomic unit within its single-threaded event loop. No other command or script can run concurrently. The check-and-decrement operation completes in $O(1)$ time in memory in $< 1.5\text{ms}$, avoiding disk I/O and lock queues entirely.
* **Short-Circuit Rejection**: Once inventory drops to zero, Redis immediately returns `0`. The API returns HTTP 409 Conflict without making a single database call, completely protecting PostgreSQL connection pools.

### 2. Distributed Compensating Transactions (Saga Pattern) vs. Two-Phase Commit (2PC)
* **The Problem**: A distributed transaction across Redis and PostgreSQL cannot use ACID transactions without a two-phase commit coordinator. 2PC introduces blocking coordinators, heavy lock holds, and severe latency amplification.
* **The Saga Solution**: We utilize an eventual consistency model with a compensating transaction:
  1. The fast-path reservation succeeds in Redis first (inventory decremented).
  2. The application begins a scoped PostgreSQL write (`INSERT INTO orders` and `UPDATE events`).
  3. If PostgreSQL fails (connection timeout, database crash, disk exhaustion), the application catches the error and immediately fires an atomic compensating command:
     ```redis
     INCRBY event:{id}:stock {quantity}
     ```
  4. This restores the reserved stock in Redis within milliseconds, ensuring zero inventory leakage and zero stranded reservations.

### 3. Client Retry Idempotency & Duplicate Request Protection
* **The Problem**: In high-traffic flash sales, mobile networks drop connections after the server processes the order, causing automated SDK retries or frantic client double-clicks.
* **Two-Tier Idempotency Architecture**:
  1. **Fast-Path In-Memory Lease**: When a checkout request arrives with an `idempotency-key` header, the engine executes:
     ```redis
     SET event:{id}:idempotency:{key} "PROCESSING" NX EX 120
     ```
     If the key exists, the request is immediately rejected as an in-flight duplicate, preventing concurrent double-decrement.
  2. **Durable Database Constraint**: The `orders` table enforces `UNIQUE(event_id, idempotency_key)`. If a retried request reaches PostgreSQL, it returns the existing confirmed order without creating a duplicate charge or decrementing inventory twice.

---

## Interactive Artisan Seat-Reservation UI (Next.js 15)

To visually demonstrate distributed concurrency control, the repository includes a full-stack interactive seat reservation app (`frontend/`) styled with a **"Warm Craft / Modern Woodwork"** aesthetic (walnut `#1C1512`, cedar `#2A1E18`, brass accents `#C5A059`, and parchment typography `#F7F2EA`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  ARTISAN THEATRE ENGINE    [ Oppenheimer 70mm ]    [ Redis: 0.8ms ]    [ Split-Screen ]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                 [ CURVED SCREEN ]                                      │
│                                                                                        │
│  STALLS (Row A-B)        [A1] [A2] [A3] [A4] [A5] [A6] [A7] [A8] [A9] [A10]            │
│  ROYAL CIRCLE (Row C-D)  [C1] [C2] [C3] [C4] [C5] [C6] [C7] [C8] [C9] [C10]            │
│  VIP LOGE (Row E-F)      [E1] [E2] [E3] [E4] [E5] [E6] [E7] [E8] [E9] [E10]            │
│                                                                                        │
│  [ DEVICE A (Chrome / Mac) ]                  [ DEVICE B (Safari / iOS) ]             │
│  Selected: Seat C4 (Royal Circle)             Selected: Seat C4 (Royal Circle)         │
│  [ ⚡ CONFIRM BOOKING ]                       [ ⚡ CONFIRM BOOKING ]                  │
│       │                                            │                                   │
│       ▼                                            ▼                                   │
│  [ 201 CREATED ]                              [ 409 CONFLICT: SEAT ALREADY RESERVED ]  │
│  "Physical Ticket Pass Issued"                "Atomic Lua Gate Defended Collision"     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Visual Engineering Proofs in the UI:
- **Split-Screen Concurrency Duel**: Renders two independent client viewports side-by-side. Selecting the exact same seat on Device A and Device B and clicking checkout simultaneously proves that **Redis Lua prevents double-booking in real time**: one client receives the confirmed booking and ticket pass, while the other receives an instant HTTP 409 Conflict.
- **Chaos Engineering Rollback Injection**: An interactive toggle in the UI injects a synthetic database crash after the Redis reservation succeeds. The UI observes the compensating `INCRBY` transaction live as Redis inventory is restored and the seat reverts to available.
- **Real-Time Wire Inspector**: Inspects raw HTTP payloads, Redis Lua execution times (< 2ms), database pool utilization, and unique idempotency keys for each operation.
- **Skeuomorphic Ticket Pass Modal**: Renders an authentic paper ticket with micro-perforations, barcode, security hash, and timestamp upon successful reservation.

---

## Quickstart in 3 Steps

### Step 1: Start the Production Stack (PostgreSQL 16, Redis 7 & Express API)
```bash
# Clone the repository
git clone https://github.com/shatwiks/distributed-flash-sale-engine.git
cd distributed-flash-sale-engine

# Copy environment variables
cp .env.example .env

# Launch production multi-stage containers via Docker Compose
npm run prod
```

Verify all containers are healthy:
```bash
npm run verify:prod
```
Expected output:
```text
✔ Production API Container: HEALTHY (Port 3000)
✔ Redis 7 Container: HEALTHY (Port 6380)
✔ PostgreSQL 16 Container: HEALTHY (Port 5433)
✔ Image Size: 47.3 MB (Target < 50 MB)
```

---

### Step 2: Launch the Interactive Reservation UI
```bash
# Navigate to frontend and start the Next.js dev server (runs on port 3001)
cd frontend
npm install
npm run dev
```

Open **`http://localhost:3001`** in your browser:
- Test single-seat reservation across Stalls, Royal Circle, and VIP Loge.
- Toggle **Split-Screen Duel Mode** to test concurrent race condition prevention across two devices.
- Toggle **Simulate DB Crash (Saga Rollback)** to watch the compensating transaction in real time.

---

### Step 3: Run the High-Throughput Concurrency Tests
In a separate terminal, execute the k6 concurrency and stress suites:

```bash
# 1. Run the Phase 2 Race Condition demonstration (shows naive flaw)
npm run test:race

# 2. Run the Phase 6 High-Throughput 10,000 RPS burst test (hardened engine)
npm run test:stress

# 3. Run the automated side-by-side benchmark runner
npm run benchmark
```

---

## Production Cloud Infrastructure as Code (AWS ECS & Terraform)

The repository includes enterprise-grade, modular Terraform IaC located in `terraform/`:

```text
terraform/
├── main.tf                  # AWS provider (~> 5.0), AZ discovery, resource tags
├── variables.tf             # Parameterized cloud inputs (environment, VPC CIDR, tasks)
├── outputs.tf               # Exported ALB DNS, RDS endpoint, ElastiCache endpoint
├── networking.tf            # Dedicated VPC (10.0.0.0/16), 4 subnets across 2 AZs, IGW, NAT GW
├── security.tf              # Least-privilege Security Groups (ALB -> ECS -> RDS/ElastiCache)
├── database.tf              # Amazon RDS PostgreSQL 16 & Amazon ElastiCache Redis 7
├── alb.tf                   # Internet-facing ALB, target group, HTTP/HTTPS listeners, health checks
├── ecs.tf                   # ECR repository, ECS cluster, task definition, Fargate service
└── autoscaling.tf           # Target-tracking autoscaling (1,000 req/min & 65% CPU utilization)
```

### Key Infrastructure Highlights:
- **Private Subnet Isolation**: RDS PostgreSQL and ElastiCache Redis reside in private subnets with no public internet ingress.
- **Least-Privilege Security Group Chaining**: ECS tasks accept ingress traffic strictly from the ALB security group. RDS and Redis accept ingress strictly from the ECS task security group.
- **Target-Tracking Horizontal Auto-Scaling**: ECS Fargate auto-scales from 2 to 10 tasks based on ALB request counts (1,000 req/min/task) and CPU thresholds (65%).

---

## Repository Structure

```text
ticket-booking-api/
├── .dockerignore                # Production container exclusions
├── .env.example                 # Environment configuration template
├── .gitignore                   # Ignores build artifacts, node_modules, temp logs
├── Dockerfile                   # Multi-stage production build (< 50MB, Alpine, non-root)
├── docker-compose.yml           # Local development services
├── docker-compose.prod.yml      # Local production stack with healthcheck chaining
├── docker-entrypoint.sh         # Auto-migration script executed before container boot
├── package.json                 # Project dependencies & automated runner scripts
├── BENCHMARKS.md                # Comprehensive benchmark methodology & data analysis
├── README.md                    # Recruiter-ready executive documentation
├── docs/
│   ├── interview-deep-dive.md   # Staff/Principal technical interview defense guide
│   └── deployment-runbook.md    # Step-by-step AWS provisioning and teardown runbook
├── frontend/                    # Next.js 15 + TypeScript Artisan Reservation App
│   ├── app/                     # Next.js App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/              # SeatMatrix, DuelConsole, ChaosControls, WireInspector, TicketPass
│   ├── lib/api.ts               # Backend API client with micro-timing telemetry
│   └── package.json             # Next.js dependencies (Tailwind, Lucide, Canvas Confetti)
├── load-tests/
│   ├── race-condition.js        # k6 test demonstrating baseline TOCTOU vulnerabilities
│   └── stress-test.js           # k6 10,000 RPS burst test for hardened engine
├── scripts/
│   ├── run-benchmarks.js        # Automated side-by-side performance runner
│   └── verify-containers.js     # Production container health and image size verifier
├── src/
│   ├── index.js                 # Express bootstrap, CORS middleware, graceful shutdown
│   ├── cache/
│   │   └── redis.js             # ioredis singleton, exponential backoff, health ping
│   ├── db/
│   │   ├── pool.js              # pg.Pool with tuned connection timeouts
│   │   ├── schema.sql           # Schema DDL (events, orders, constraints, indexes)
│   │   └── migrate.js           # Idempotent migration runner
│   ├── middleware/
│   │   ├── asyncHandler.js      # Centralized async try/catch wrapper
│   │   └── errorHandler.js      # HTTP error mapping
│   ├── routes/
│   │   └── events.js            # REST endpoints: /health, /events, /checkout, /prewarm, /seats
│   └── services/
│       ├── inventoryService.js  # In-memory atomic Lua reservation, prewarming, Redlock
│       └── ticketService.js     # Two-layer reservation engine & compensating rollback
└── terraform/                   # Production AWS ECS, ALB, RDS, ElastiCache manifests
```

---

## API Reference

### 1. Dual-Engine Health Check
```http
GET /health
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "services": {
    "postgres": "up",
    "redis": "up"
  }
}
```

---

### 2. Pre-Warm In-Memory Inventory
```http
POST /events/:id/prewarm
```
Pre-loads PostgreSQL inventory into Redis ahead of the flash-sale launch to prevent cold-start thundering herds.

**Response (200 OK):**
```json
{
  "message": "Event inventory pre-warmed in Redis successfully.",
  "eventId": "e0a4f5b2-3b2b-4e4b-9f9f-5c2f3d4e5f6a",
  "available_tickets": 1000,
  "cached": true
}
```

---

### 3. Concurrency-Hardened Checkout
```http
POST /events/:id/checkout
Content-Type: application/json
idempotency-key: order_uuid_10283

{
  "userId": "usr_99812",
  "quantity": 1,
  "seatNumber": "C4"
}
```

**Success Response (201 Created - Confirmed):**
```json
{
  "id": "a91b5c43-4217-48f0-b8c1-1c3905cfb75f",
  "event_id": "e0a4f5b2-3b2b-4e4b-9f9f-5c2f3d4e5f6a",
  "user_id": "usr_99812",
  "quantity": 1,
  "seat_number": "C4",
  "status": "confirmed",
  "idempotency_key": "order_uuid_10283",
  "created_at": "2026-09-04T16:15:00.000Z"
}
```

**Sold-Out Response (409 Conflict - Fast-Path Rejection):**
```json
{
  "id": "d13e9a72-76a1-432e-b6fe-2cf3b590e84c",
  "event_id": "e0a4f5b2-3b2b-4e4b-9f9f-5c2f3d4e5f6a",
  "user_id": "usr_99812",
  "quantity": 1,
  "status": "failed",
  "idempotency_key": "order_uuid_10283",
  "created_at": "2026-09-04T16:15:05.000Z"
}
```

---

## Technical Deep-Dives & Further Reading

- 📖 **[Staff/Principal Interview Defense Guide (docs/interview-deep-dive.md)](docs/interview-deep-dive.md)**: Exhaustive answers to architectural questions on lock contention, compensating rollbacks, Redlock distributed locking vs. Lua scripts, and bot mitigation.
- 📊 **[Comprehensive Benchmark Analysis (BENCHMARKS.md)](BENCHMARKS.md)**: Detailed k6 testing methodology, latency percentile breakdowns, queuing theory calculations, and mathematical proofs.
- ☁️ **[AWS Cloud Deployment Runbook (docs/deployment-runbook.md)](docs/deployment-runbook.md)**: Complete guide for provisioning AWS infrastructure, pushing images to ECR, zero-downtime deployments, and teardown.
