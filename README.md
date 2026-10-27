# Distributed Flash-Sale Ticket Booking Engine & Real-Time Inventory Manager

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-20_Alpine-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7_Alpine-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage_<50MB-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS ECS](https://img.shields.io/badge/AWS-ECS_Fargate-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/ecs/)
[![Terraform](https://img.shields.io/badge/Terraform-AWS_v5.x-844FBA?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![k6](https://img.shields.io/badge/k6-Stress_Testing-7D64FF?style=for-the-badge&logo=k6&logoColor=white)](https://k6.io/)

**An enterprise-grade, concurrency-hardened flash-sale engine capable of sustaining 10,000+ RPS burst throughput with guaranteed 0.00% overbooking and sub-25ms p95 tail latency.**

[⚡ Run on Your Laptop](#-how-to-run-on-your-laptop-60-second-quickstart) • [Live UI Architecture](#interactive-seat-reservation-ui--live-telemetry) • [System Architecture](#system-architecture) • [Empirical Benchmarks](#empirical-benchmark-matrix) • [Engineering Trade-Offs](#key-engineering-trade-offs--deep-dives) • [Cloud IaC](#production-cloud-infrastructure-as-code-aws-ecs--terraform) • [Interview Defense Guide](docs/interview-deep-dive.md)

</div>

---

## 🎯 Executive Engineering Highlights 
- **High-Throughput Concurrency Control**: Architected an in-memory inventory reservation gate using single-threaded Redis Lua scripts ($O(1)$) and Redlock distributed locking, sustaining 10,000+ RPS burst throughput with 0.00% overbooking and zero TOCTOU race conditions.
- **Latency Optimization & Connection Protection**: Reduced p95 response latency from 271ms to 18.5ms (93.2% drop) compared to relational `SELECT ... FOR UPDATE` row-level locks, safeguarding PostgreSQL connection pools from thread starvation and query timeouts under high concurrency.
- **Fault-Tolerant Distributed Sagas & Idempotency**: Designed two-phase compensating transactions (`INCRBY` rollback) to guarantee eventual consistency between Redis and PostgreSQL during database write crashes, backed by two-tier idempotency keys to prevent duplicate order executions.
- **Turnkey Production Deployments**: Scripted across three deployment pathways: 1-Click PaaS ([`render.yaml`](render.yaml) + [`vercel.json`](vercel.json)), Enterprise AWS Cloud ([`terraform/`](terraform/)), and Single-VM Docker Compose ([`docker-compose.prod.yml`](docker-compose.prod.yml)).

---

## ⚡ How to Run on Your Laptop (60-Second Quickstart)

Follow these simple steps to spin up the entire distributed system and launch the interactive visualizer locally:

### Prerequisites
- **Docker Desktop** installed & running ([Download Docker](https://www.docker.com/products/docker-desktop/))
- **Node.js 18+** installed ([Download Node](https://nodejs.org/))

---

### Step 1: Boot the Production Engine
```bash
# 1. Clone repository
git clone https://github.com/shatwiks/distributed-flash-sale-engine.git
cd distributed-flash-sale-engine

# 2. Copy environment template
cp .env.example .env

# 3. Boot backend engine (PostgreSQL 16, Redis 7 & Express API containers)
npm run prod
```
> **Under the hood:** Docker Compose builds the hardened Node.js API container (< 50MB), runs PostgreSQL migrations automatically, and chains service healthchecks.

---

### Step 2: Start the Interactive UI
```bash
# In the same directory, run:
npm run frontend:dev
```
*(Or navigate to `cd frontend && npm install && npm run dev`)*

---

### Step 3: Open in Your Browser

| Service | URL | Description |
| :--- | :--- | :--- |
| 🎟️ **Artisan Live UI** | **`http://localhost:3001`** | Interactive seat matrix, split-screen concurrency duel & chaos rollback simulator. |
| 🩺 **API Health Check** | **`http://localhost:3000/health`** | Real-time dual-engine ping status for Redis 7 and PostgreSQL 16. |
| 📊 **REST Endpoints** | **`http://localhost:3000/events`** | API endpoints for event creation, pre-warming, and checkouts. |

---

## 🏛️ Interactive Seat-Reservation UI & Live Telemetry

To visually demonstrate distributed concurrency control, the repository includes a full-stack Next.js 16 interactive terminal (`frontend/`) engineered with a **Precision Avionics & Technical Ink** aesthetic (`#f5f4f2` warm paper ground, `#ffffff` surface cards, `#111111` technical accents) with 3D perspective physics, shared layout transitions, and live telemetry:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  PRECISION AVIONICS ENGINE   [ Live Status: Healthy ]  [ Redis: 0.8ms ]  [ Duel Mode ] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                 [ CURVED STAGE SCREEN ]                                │
│                                                                                        │
│  STALLS (Row A-B)        [A1] [A2] [A3] [A4] [A5] [A6] [A7] [A8] [A9] [A10]            │
│  ROYAL CIRCLE (Row C-D)  [C1] [C2] [C3] [C4] [C5] [C6] [C7] [C8] [C9] [C10]            │
│  VIP LOGE (Row E-F)      [E1] [E2] [E3] [E4] [E5] [E6] [E7] [E8] [E9] [E10]            │
│                                                                                        │
│  [ DEVICE A (Chrome / Client 1) ]             [ DEVICE B (Safari / Client 2) ]         │
│  Target: Seat C4 (Royal Circle)               Target: Seat C4 (Royal Circle)           │
│  [ ⚡ CONFIRM BOOKING ]                       [ ⚡ CONFIRM BOOKING ]                    │
│       │                                            │                                   │
│       ▼                                            ▼                                   │
│  [ 201 CREATED ]                              [ 409 CONFLICT: ALREADY RESERVED ]       │
│  "Physical Ticket Pass Issued"                "Atomic Lua Gate Defended Collision"     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4 Live Engineering Demonstrations Built into the UI:

1. **Split-Screen Concurrency Duel**:
   * Click **"Duel Mode"** in the top navigation bar. Two independent client viewports (Device A and Device B) render side-by-side.
   * Clicking the exact same seat on both devices simultaneously demonstrates **in-memory atomicity**: Redis Lua grants the lock to the sub-millisecond winner while instantly returning an HTTP 409 Conflict rejection to the other.

2. **Chaos Engineering & Saga Stepper**:
   * Toggle **"Simulate DB Crash"** under Chaos Controls.
   * Attempting a checkout successfully reserves the seat in Redis, but triggers an intentional PostgreSQL write failure.
   * The live UI animates the 4-stage saga stepper as the **compensating `INCRBY` rollback** fires in Redis, restoring available inventory with zero data leakage.

3. **Sub-2ms Wire Inspector Drawer**:
   * Click the bottom telemetry drawer to inspect live wire payloads, Redis Lua gate execution times ($< 2\text{ms}$), PostgreSQL transaction times, and connection pool saturation metrics (`active`, `idle`, `waiting`).

4. **Skeuomorphic Ticket Pass Modal**:
   * Confirmed bookings issue an authenticated digital ticket pass with unique idempotency UUID, timestamp, seat tier pricing, and cryptographic barcode.

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
   - At an arrival rate of $\lambda = 10,000\text{ req/s}$, if transactions hold database connections for an average of $W = 25\text{ms}$ ($0.025\text{s}$), the required concurrent connection capacity is:
     $$L = 10,000 \times 0.025 = 250\text{ active connections}$$
   - A standard PostgreSQL pool typically provisions 20–50 connections. Incoming requests queue up inside Node.js event loops, exceed connection acquisition timeouts (`connectionTimeoutMillis: 2000`), and cascade into **catastrophic HTTP 500 errors for 15%–20% of users**.
2. **Lock Queue Serialization & Extreme Tail Latency**:
   - `SELECT ... FOR UPDATE` enforces strict mutual exclusion on the single row representing the event. Thousands of concurrent workers wait in an operating system wait queue for row locks, driving p99 latency beyond $1,240\text{ms}$.
3. **The TOCTOU (Time-of-Check to Time-of-Use) Vulnerability**:
   - Relational designs lacking row locks read stale inventory, concurrently approve stock deductions, and create **severe inventory overselling (overbooking)** that violates the fundamental invariant: $\text{available\_tickets} \ge 0$.

---

## System Architecture

The engine employs a **two-layer reservation pattern** separating sub-millisecond in-memory gatekeeping from asynchronous, durable relational persistence.

### End-to-End Request Lifecycle

```text
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
    participant ALB as AWS ALB / Gateway
    participant Worker as ECS Fargate Worker (Node.js)
    participant Redis as Redis 7 (In-Memory Gate)
    participant Postgres as PostgreSQL 16 (Durable Store)

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

## 🚀 Production Deployment Pathways

This project supports three deployment methods documented in [`DEPLOYMENT.md`](DEPLOYMENT.md):

### 1. 1-Click Cloud (Render + Vercel)
- **Backend & Databases on Render:** Connect GitHub repository, select **Blueprint**, and Render will automatically read [`render.yaml`](render.yaml) to provision the Node.js API, PostgreSQL 16 database, and Redis 7 cache.
- **Frontend on Vercel:** Import repository, set `NEXT_PUBLIC_API_URL` to your Render API URL, and deploy in 60 seconds via [`vercel.json`](vercel.json).

### 2. Enterprise Cloud IaC (AWS ECS Fargate + Terraform)
Modular Terraform manifests in [`terraform/`](terraform/) provision a production VPC, private subnets, RDS PostgreSQL 16, ElastiCache Redis 7, ALB, and auto-scaling ECS Fargate worker clusters. See [`docs/deployment-runbook.md`](docs/deployment-runbook.md).

### 3. Single-Server VPS (Docker Compose)
Run the entire production container stack on any Ubuntu VM:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🧪 Benchmark & Concurrency Testing

```bash
# 1. Race condition demonstration (demonstrates naive TOCTOU vulnerability)
npm run test:race

# 2. 10,000 RPS burst stress test (hardened engine)
npm run test:stress

# 3. Automated side-by-side performance runner
npm run benchmark
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
  },
  "pool": {
    "total": 1,
    "idle": 1,
    "waiting": 0,
    "active": 0
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

**Success Response (201 Created):**
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

**Fast-Path Rejection (409 Conflict):**
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

## Repository Structure

```text
distributed-flash-sale-engine/
├── .agents/                     # Impeccable & Taste-Skill v2 intelligence, rules, playbooks
├── .dockerignore                # Production container exclusions
├── .env.example                 # Environment configuration template
├── .gitignore                   # Ignores build artifacts, node_modules, temp logs
├── Dockerfile                   # Multi-stage production build (< 50MB, Alpine, non-root)
├── docker-compose.yml           # Local development services
├── docker-compose.prod.yml      # Local production stack with healthcheck chaining
├── docker-entrypoint.sh         # Auto-migration script executed before container boot
├── package.json                 # Project dependencies & automated runner scripts
├── BENCHMARKS.md                # Comprehensive benchmark methodology & data analysis
├── DEPLOYMENT.md                # 5-minute Render + Vercel and AWS deployment guide
├── DESIGN.md                    # Precision Avionics design tokens and component specs
├── PRODUCT.md                   # Product truth schema and architectural invariants
├── render.yaml                  # 1-click Render blueprint (API + PostgreSQL 16 + Redis 7)
├── vercel.json                  # Next.js 16 build configuration for Vercel
├── docs/
│   ├── interview-deep-dive.md   # Staff/Principal technical interview defense guide
│   └── deployment-runbook.md    # Step-by-step AWS provisioning and teardown runbook
├── frontend/                    # Next.js 16 + TypeScript Artisan UI
│   ├── app/                     # Next.js App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/              # SeatMatrix, DuelConsole, ChaosControls, WireInspector, Card3D
│   ├── lib/api.ts               # Backend API client with micro-timing telemetry
│   └── package.json             # Next.js dependencies (Tailwind, Lucide, Canvas Confetti)
├── load-tests/
│   ├── race-condition.js        # k6 test demonstrating baseline TOCTOU vulnerabilities
│   └── stress-test.js           # k6 10,000 RPS burst test for hardened engine
├── scripts/
│   ├── run-benchmarks.js        # Automated side-by-side performance runner
│   └── verify-containers.js     # Production container health and image size verifier
├── src/
│   ├── index.js                 # Express bootstrap, dynamic CORS, graceful shutdown
│   ├── cache/
│   │   └── redis.js             # ioredis singleton, exponential backoff, TLS support
│   ├── db/
│   │   ├── pool.js              # pg.Pool with tuned timeouts and cloud SSL auto-negotiation
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

## Technical Deep-Dives & Further Reading

- 📖 **[Staff/Principal Interview Defense Guide (docs/interview-deep-dive.md)](docs/interview-deep-dive.md)**: Exhaustive answers to architectural questions on lock contention, compensating rollbacks, Redlock distributed locking vs. Lua scripts, and bot mitigation.
- 📊 **[Comprehensive Benchmark Analysis (BENCHMARKS.md)](BENCHMARKS.md)**: Detailed k6 testing methodology, latency percentile breakdowns, queuing theory calculations, and mathematical proofs.
- 🚀 **[Deployment Runbook & PaaS Guide (DEPLOYMENT.md)](DEPLOYMENT.md)**: Detailed instructions for 1-click Render + Vercel and AWS Cloud deployments.
- ☁️ **[AWS Cloud Infrastructure Runbook (docs/deployment-runbook.md)](docs/deployment-runbook.md)**: Complete guide for provisioning AWS infrastructure, pushing images to ECR, zero-downtime deployments, and teardown.
