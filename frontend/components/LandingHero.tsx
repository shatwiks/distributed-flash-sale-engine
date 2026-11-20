"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Swords, ShieldCheck, Lock } from "lucide-react";
import { EventData, HealthData } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { Card3D } from "./Card3D";

interface LandingHeroProps {
  health: HealthData;
  activeEvent: EventData | null;
  bookedSeats: string[];
  onLaunchArena: () => void;
  onLaunchDuel: () => void;
}

const MINI_ROWS = ["A", "B", "C", "D", "E", "F"];
const MINI_COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const TIER_SPOTLIGHTS = [
  {
    name: "Royal Box, VIP Suite",
    rows: "Rows E–F",
    price: "$45.00",
    seats: "20 acoustic box seats",
  },
  {
    name: "Acoustic Sweet Spot",
    rows: "Rows C–D",
    price: "$25.00",
    seats: "20 center-stage seats",
  },
  {
    name: "Standard Stalls",
    rows: "Rows A–B",
    price: "$18.50",
    seats: "20 front-row seats",
  },
];

export function LandingHero({
  health,
  activeEvent,
  bookedSeats,
  onLaunchArena,
  onLaunchDuel,
}: LandingHeroProps) {
  const [tierIndex, setTierIndex] = useState(0);
  const gateLatency = health.redisLatencyMs || 1.2;
  const totalSeats = activeEvent?.total_tickets || 60;
  const remainingSeats = Math.max(0, totalSeats - bookedSeats.length);
  const eventTitle = activeEvent?.name || "Oppenheimer 70mm";

  // Slow crossfade between acoustic tier spotlights (paused when tab is hidden)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setTierIndex((prev) => (prev + 1) % TIER_SPOTLIGHTS.length);
    }, 5200);
    return () => clearInterval(interval);
  }, []);

  const activeTier = TIER_SPOTLIGHTS[tierIndex];

  return (
    <section className="pt-4 pb-16 md:pt-6 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 50/50 Split: Printed Ticket Card (Left) + Live Auditorium Gate Stage (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* LEFT HALF: Printed Ticket Card crowned with Perforation Stripe Motif */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-between rounded-2xl bg-[#ffffff] overflow-hidden"
          >
            {/* Signature Motif: Alternating Ink & Paper Ticket Perforation Band */}
            <div
              aria-hidden="true"
              className="ticket-stripe h-10 sm:h-12 bg-[#f5f4f2]"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full flex-1 ${
                    i % 2 === 0 ? "bg-[#0a0a0a]" : "bg-[#f5f4f2]"
                  }`}
                />
              ))}
            </div>

            {/* Printed Card Content */}
            <div className="flex flex-1 flex-col justify-between p-7 sm:p-10 lg:p-12">
              <div className="pt-4 sm:pt-8">
                <h1 className="font-display text-[2.25rem] sm:text-[3.1rem] xl:text-[3.75rem] font-bold uppercase tracking-[-0.035em] leading-[0.94] text-[#0a0a0a]">
                  Zero oversold
                  <br />
                  at 10K RPS.
                </h1>

                <p className="mt-7 font-serif text-lg sm:text-[1.1875rem] leading-[1.55] text-[#0a0a0a] max-w-[38ch]">
                  One single-threaded Redis Lua gate checks and claims every
                  auditorium seat in under two milliseconds before PostgreSQL
                  touches disk.
                </p>

                {/* Primary Notched Ticket Action + Secondary Duel Link */}
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <motion.button
                    type="button"
                    onClick={onLaunchArena}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="ticket-btn relative flex items-center gap-2.5 px-7 py-4 text-sm tracking-tight cursor-pointer"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#ffffff]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#ffffff]"
                    />
                    <span>Reserve a Seat</span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={onLaunchDuel}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-4 py-3.5 text-sm font-semibold text-[#0a0a0a] hover:text-[#616160] transition-colors cursor-pointer"
                  >
                    <Swords className="h-4 w-4" />
                    <span>Run 2-Client Duel</span>
                  </motion.button>
                </div>
              </div>

              {/* Card Foot: Three Plain Navigation Links */}
              <div className="mt-12 pt-6 flex flex-wrap items-center justify-between gap-4 text-sm font-medium text-[#616160]">
                <div className="flex flex-wrap items-center gap-6">
                  <a
                    href="#live-arena"
                    className="text-[#0a0a0a] hover:text-[#616160] transition-colors"
                  >
                    Live Seat Matrix
                  </a>
                  <a
                    href="#architecture"
                    className="hover:text-[#0a0a0a] transition-colors"
                  >
                    Saga Architecture
                  </a>
                  <a
                    href="#benchmarks"
                    className="hover:text-[#0a0a0a] transition-colors"
                  >
                    k6 Benchmarks
                  </a>
                </div>
                <span className="text-[13px] font-semibold tabular-nums text-[#616160]">
                  Redis 7 · PostgreSQL 16
                </span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT HALF: Live Auditorium Ticket-Stub Console (data-ui) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex"
          >
            <Card3D depth={6} className="w-full rounded-2xl">
              <div
                data-ui
                className="relative flex h-full w-full flex-col justify-between rounded-2xl bg-[#111111] p-7 sm:p-10 text-white overflow-hidden"
              >
                {/* Ticket Stub Side Notches cutting into the page ground */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[#f5f4f2]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[#f5f4f2]"
                />

                {/* Top Ticket Header: Active Production & Real-Time Inventory */}
                <div
                  className="flex items-start justify-between gap-4"
                  style={{ transform: "translateZ(18px)" }}
                >
                  <div>
                    <p className="text-sm font-medium text-[#a1a1a1]">
                      Live Auditorium Admission
                    </p>
                    <p className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      {eventTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl sm:text-4xl font-bold tabular-nums leading-none text-white">
                      {remainingSeats}
                      <span className="text-base font-medium text-[#a1a1a1]">
                        /{totalSeats}
                      </span>
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#10b981]">
                      Seats open in Redis
                    </p>
                  </div>
                </div>

                {/* Live 60-Seat Auditorium Mini-Matrix synced with Redis */}
                <div
                  className="my-8 rounded-xl bg-[#1a1a1a] p-5"
                  style={{ transform: "translateZ(24px)" }}
                >
                  <div className="mb-4 flex items-center justify-between text-xs text-[#a1a1a1]">
                    <span>Stage Acoustic Arc</span>
                    <span className="tabular-nums text-white font-semibold">
                      Gate: {gateLatency}ms · 0.00% Overbooking
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {MINI_ROWS.map((row) => (
                      <div
                        key={row}
                        className="grid grid-cols-[16px_1fr_14px_1fr] items-center gap-1.5"
                      >
                        <span className="text-[11px] font-semibold text-[#767676]">
                          {row}
                        </span>
                        <div className="grid grid-cols-5 gap-1.5">
                          {MINI_COLS.slice(0, 5).map((col) => {
                            const id = `${row}${col}`;
                            const booked = bookedSeats.includes(id);
                            return (
                              <div
                                key={id}
                                title={`Seat ${id}: ${booked ? "Locked in Redis" : "Available"}`}
                                className={`flex h-6 items-center justify-center rounded text-[10px] font-semibold transition-colors ${
                                  booked
                                    ? "bg-[#2e2e2e] text-[#616160]"
                                    : "bg-[#f5f4f2] text-[#0a0a0a]"
                                }`}
                              >
                                {booked ? <Lock className="h-2.5 w-2.5" /> : id}
                              </div>
                            );
                          })}
                        </div>
                        <div />
                        <div className="grid grid-cols-5 gap-1.5">
                          {MINI_COLS.slice(5, 10).map((col) => {
                            const id = `${row}${col}`;
                            const booked = bookedSeats.includes(id);
                            return (
                              <div
                                key={id}
                                title={`Seat ${id}: ${booked ? "Locked in Redis" : "Available"}`}
                                className={`flex h-6 items-center justify-center rounded text-[10px] font-semibold transition-colors ${
                                  booked
                                    ? "bg-[#2e2e2e] text-[#616160]"
                                    : "bg-[#f5f4f2] text-[#0a0a0a]"
                                }`}
                              >
                                {booked ? <Lock className="h-2.5 w-2.5" /> : id}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Stub: Slow Crossfade Tier Spotlight + Atomic Gate Command */}
                <div
                  className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2"
                  style={{ transform: "translateZ(18px)" }}
                >
                  <div className="min-h-[48px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTier.name}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        <p className="text-sm font-bold text-white">
                          {activeTier.name} · {activeTier.price}
                        </p>
                        <p className="text-xs text-[#a1a1a1] mt-0.5">
                          {activeTier.rows} — {activeTier.seats}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#a1a1a1]">
                    <ShieldCheck className="h-4 w-4 text-[#10b981] shrink-0" />
                    <code className="font-mono text-white">
                      EVALSHA reserve_seat.lua
                    </code>
                  </div>
                </div>
              </div>
            </Card3D>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
