"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface LifecycleStage {
  id: string;
  clause: string;
  bg: string;
  text: string;
  muted: string;
  cardBg: string;
  cardText: string;
  cardMuted: string;
  statusLabel: string;
  statusTone: string;
  latency: string;
  seatState: string;
  command: string;
  problem: string;
  solution: string;
  codeSnippet: string;
}

const STAGES: LifecycleStage[] = [
  {
    id: "arrival",
    clause: "First, it lands at the gate.",
    bg: "bg-[#ffffff]",
    text: "text-[#0a0a0a]",
    muted: "text-[#616160]",
    cardBg: "bg-[#f5f4f2]",
    cardText: "text-[#0a0a0a]",
    cardMuted: "text-[#616160]",
    statusLabel: "Incoming checkout",
    statusTone: "bg-[#0a0a0a] text-white",
    latency: "0.0 ms",
    seatState: "Seat D5 · Requested",
    command: "POST /events/:id/checkout",
    problem:
      "At 10,000 requests per second, holding relational row locks for 25ms requires 250 concurrent PostgreSQL connections (Little's Law: L = λW). Standard pools hold 20 to 50 connections, cascading into HTTP 500 timeouts.",
    solution:
      "Every checkout arrives with a unique idempotency key and never touches PostgreSQL until the in-memory gate clears it. Duplicate retries short-circuit before stock is evaluated.",
    codeSnippet: `-- Traditional Relational Bottleneck (Avoided):
BEGIN;
SELECT available_tickets FROM events WHERE id = $1 FOR UPDATE;
UPDATE events SET available_tickets = available_tickets - 1 WHERE id = $1;
COMMIT;`,
  },
  {
    id: "redis-gate",
    clause: "Then Redis claims the seat.",
    bg: "bg-[#edebe7]",
    text: "text-[#0a0a0a]",
    muted: "text-[#616160]",
    cardBg: "bg-[#ffffff]",
    cardText: "text-[#0a0a0a]",
    cardMuted: "text-[#616160]",
    statusLabel: "Lua gate locked",
    statusTone: "bg-[#0a0a0a] text-white",
    latency: "1.2 ms",
    seatState: "Seat D5 · Reserved in RAM",
    command: "EVALSHA reserve_seat.lua",
    problem:
      "Separate read-then-write checks create a Time-of-Check to Time-of-Use window where hundreds of concurrent workers read identical stock counts and oversell the auditorium.",
    solution:
      "Single-threaded Redis Lua evaluates membership and decrements inventory in one atomic tick. Sold-out or contested requests return HTTP 409 in under two milliseconds with zero database calls.",
    codeSnippet: `-- Atomic Redis Lua Gate (src/services/inventoryService.js):
if redis.call('SISMEMBER', KEYS[1], ARGV[1]) == 1 then return -2 end
local stock = tonumber(redis.call('GET', KEYS[2]))
if stock < tonumber(ARGV[2]) then return 0 end
redis.call('SADD', KEYS[1], ARGV[1])
redis.call('DECRBY', KEYS[2], ARGV[2])
return 1`,
  },
  {
    id: "postgres-commit",
    clause: "Next, Postgres writes disk.",
    bg: "bg-[#e2dfd9]",
    text: "text-[#0a0a0a]",
    muted: "text-[#616160]",
    cardBg: "bg-[#ffffff]",
    cardText: "text-[#0a0a0a]",
    cardMuted: "text-[#616160]",
    statusLabel: "201 Confirmed",
    statusTone: "bg-[#047857] text-white",
    latency: "14.8 ms",
    seatState: "Seat D5 · Ticket Issued",
    command: "INSERT INTO orders ... COMMIT",
    problem:
      "In-memory caches are fast but volatile. Financial audit trails, admission passes, and idempotency guarantees must survive container restarts on durable ACID storage.",
    solution:
      "Only winning reservations acquire a scoped PostgreSQL pool client to persist the confirmed order and sync durable stock. Pool utilization stays below 10% even under 10k RPS bursts.",
    codeSnippet: `-- Scoped Durable Order Commit (src/services/ticketService.js):
BEGIN;
INSERT INTO orders (event_id, user_id, quantity, status, seat_number, idempotency_key)
VALUES ($1, $2, $3, 'confirmed', $4, $5)
RETURNING id, seat_number, created_at;
UPDATE events SET available_tickets = available_tickets - $3 WHERE id = $1;
COMMIT;`,
  },
  {
    id: "saga-rollback",
    clause: "Or the saga rolls back.",
    bg: "bg-[#111111]",
    text: "text-white",
    muted: "text-[#a1a1a1]",
    cardBg: "bg-[#1c1c1c]",
    cardText: "text-white",
    cardMuted: "text-[#a1a1a1]",
    statusLabel: "INCRBY (+1) Restored",
    statusTone: "bg-[#be123c] text-white",
    latency: "1.6 ms",
    seatState: "Seat D5 · Returned to Pool",
    command: "SREM + INCRBY event:stock 1",
    problem:
      "If Redis decrements a seat but PostgreSQL crashes or times out before committing, that seat vanishes into phantom inventory leakage.",
    solution:
      "A two-phase compensating transaction catches any database failure and immediately executes RELEASE_SEAT_LUA to remove the seat lock and restore stock in Redis.",
    codeSnippet: `// Compensating Saga Rollback (src/services/ticketService.js):
try {
  await client.query('COMMIT');
} catch (dbErr) {
  await client.query('ROLLBACK');
  await inventoryService.releaseSeat(eventId, seatNumber, quantity);
  throw dbErr;
}`,
  },
];

export function ArchitectureDeepDive() {
  const [selectedId, setSelectedId] = useState<string>("redis-gate");
  const activeStage = STAGES.find((s) => s.id === selectedId) || STAGES[1];

  return (
    <section id="architecture" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading — No eyebrow pill, <= 2 lines at every viewport */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] leading-[1.02] text-[#0a0a0a]">
            From click to ticket.
          </h2>
          <p className="font-serif text-base sm:text-lg text-[#0a0a0a] max-w-[40ch] leading-relaxed">
            Follow a single reservation for Seat D5 across four stages. Click any
            field below to inspect its exact production code.
          </p>
        </div>
      </div>

      {/* Full-Width Four-Field Strip (Zero Gaps, Tonal Step Separation) */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden">
          {STAGES.map((stage) => {
            const isSelected = stage.id === selectedId;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedId(stage.id)}
                aria-pressed={isSelected}
                className={`${stage.bg} ${stage.text} group relative flex min-h-[340px] lg:min-h-[400px] flex-col justify-between p-7 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-3px]`}
              >
                {/* Top indicator */}
                <div className="flex items-center justify-between text-[13px] font-semibold">
                  <span className={stage.muted}>{stage.latency}</span>
                  {isSelected && (
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        stage.id === "saga-rollback" ? "bg-white" : "bg-[#0a0a0a]"
                      }`}
                    />
                  )}
                </div>

                {/* Same Ticket Card Advancing Through Lifecycle (data-ui) */}
                <div
                  data-ui
                  className={`${stage.cardBg} ${stage.cardText} relative my-6 rounded-xl p-4 transition-transform duration-150 group-hover:-translate-y-1.5`}
                >
                  {/* Mini ticket notches */}
                  <span
                    aria-hidden="true"
                    className={`absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full ${stage.bg}`}
                  />
                  <span
                    aria-hidden="true"
                    className={`absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full ${stage.bg}`}
                  />

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold">
                      Seat D5
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[13px] font-semibold ${stage.statusTone}`}
                    >
                      {stage.statusLabel}
                    </span>
                  </div>

                  <p className={`mt-2 text-[13px] ${stage.cardMuted}`}>
                    {stage.seatState}
                  </p>

                  <div className="mt-3 pt-2.5 text-[13px]">
                    <code className="font-mono block truncate">{stage.command}</code>
                  </div>
                </div>

                {/* Bottom Order Clause */}
                <p className="font-display text-xl sm:text-2xl font-bold tracking-[-0.02em] leading-[1.12]">
                  {stage.clause}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Stage Deep-Dive & Code Panel (Borderless Tonal Surface) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4"
          >
            <div className="lg:col-span-6 rounded-2xl bg-[#ffffff] p-7 sm:p-9 flex flex-col justify-between gap-6">
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#0a0a0a]">
                  {activeStage.clause}
                </h3>
                <p className="mt-4 font-serif text-base text-[#0a0a0a] leading-relaxed">
                  {activeStage.solution}
                </p>
              </div>
              <div className="rounded-xl bg-[#f5f4f2] p-4">
                <p className="text-[13px] font-bold text-[#0a0a0a]">
                  Why naive architectures break here
                </p>
                <p className="mt-1.5 font-serif text-sm text-[#0a0a0a] leading-relaxed">
                  {activeStage.problem}
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-2xl bg-[#111111] p-7 sm:p-9 text-white flex flex-col justify-between">
              <div className="flex items-center justify-between text-[13px] text-[#a1a1a1] mb-4">
                <span className="font-semibold text-white">
                  Production Implementation
                </span>
                <code className="font-mono">{activeStage.command}</code>
              </div>
              <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-[#e5e3df]">
                <code>{activeStage.codeSnippet}</code>
              </pre>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
