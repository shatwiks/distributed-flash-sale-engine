"use client";

import React, { useState } from "react";
import { motion } from "motion/react";

interface MetricRow {
  label: string;
  baseline: string;
  hardened: string;
  delta: string;
}

const K6_METRICS: MetricRow[] = [
  {
    label: "Peak Concurrency Throughput",
    baseline: "1,120 req/s",
    hardened: "10,480 req/s",
    delta: "9.3× higher",
  },
  {
    label: "p95 Tail Latency",
    baseline: "271.4 ms",
    hardened: "18.5 ms",
    delta: "93.2% lower",
  },
  {
    label: "p99 Tail Latency",
    baseline: "1,240.0 ms",
    hardened: "38.2 ms",
    delta: "96.9% lower",
  },
  {
    label: "Physically Oversold Tickets",
    baseline: "14.8% oversold",
    hardened: "0.00% leakage",
    delta: "Zero overbooking",
  },
  {
    label: "HTTP 500 Pool Timeouts",
    baseline: "16.4% failed",
    hardened: "0.00% errors",
    delta: "Pool insulated",
  },
];

const PRODUCTION_SPECS = [
  { label: "Container Footprint", value: "47.3 MB Alpine (Non-root)" },
  { label: "Redis Gate Complexity", value: "O(1) single-threaded Lua" },
  { label: "PostgreSQL Pool Cap", value: "50 connections · < 10% load" },
  { label: "ECS Auto-Scaling", value: "2 to 10 Fargate tasks" },
  { label: "Idempotency Layers", value: "Redis SET NX + Postgres UNIQUE" },
  { label: "Load Suite", value: "k6 · 5,000 VUs · 10k RPS burst" },
];

export function BenchmarksShowcase() {
  const [arrivalRate, setArrivalRate] = useState<number>(10000);
  const [activeTab, setActiveTab] = useState<"k6" | "specs">("k6");

  // Honest Little's Law calculation: L = λ × W (where W = 25ms = 0.025s avg relational lock hold)
  const requiredDbConnections = Math.round(arrivalRate * 0.025);
  const poolCap = 50;
  const overloadFactor = (requiredDbConnections / poolCap).toFixed(1);
  const poolSaturated = requiredDbConnections > poolCap;

  return (
    <section id="benchmarks" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* STATEMENT BLOCK: Figure Set by a Slider (Little's Law Live Calculator) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl bg-[#ffffff] p-8 sm:p-12 lg:p-14"
        >
          {/* Top-Left: Question Heading + Interactive Slider Control */}
          <div className="max-w-xl">
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-[-0.03em] leading-[1.02] text-[#0a0a0a]">
              How fast is your flash sale?
            </h2>

            <div data-ui className="mt-7 max-w-md">
              <div className="flex items-baseline justify-between text-sm font-semibold text-[#0a0a0a]">
                <label htmlFor="rps-slider">Peak arrival rate</label>
                <span className="font-display text-lg font-bold tabular-nums">
                  {arrivalRate.toLocaleString()} req/s
                </span>
              </div>
              <input
                id="rps-slider"
                type="range"
                min={500}
                max={10000}
                step={500}
                value={arrivalRate}
                onChange={(e) => setArrivalRate(Number(e.target.value))}
                className="engine-slider mt-3 w-full"
              />
              <div className="mt-2 flex justify-between text-[13px] text-[#616160] tabular-nums">
                <span>500 req/s</span>
                <span>5,000 req/s</span>
                <span>10,000 req/s</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Giant Dynamic Figure (Left) + Honest Formula Explanation (Right) */}
          <div className="mt-14 sm:mt-20 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-display text-[4.5rem] sm:text-[7.5rem] lg:text-[9.5rem] font-extrabold tracking-[-0.04em] leading-[0.84] tabular-nums text-[#0a0a0a]">
                  {requiredDbConnections}
                </span>
                <span className="font-display text-xl sm:text-3xl font-bold text-[#616160]">
                  DB connections
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold text-[#0a0a0a]">
                {poolSaturated ? (
                  <>
                    Exceeds a 50-connection Postgres pool by{" "}
                    <span className="text-[#be123c]">{overloadFactor}×</span> —
                    Redis Lua absorbs the burst at{" "}
                    <span className="text-[#047857]">18.5 ms p95</span>.
                  </>
                ) : (
                  <>
                    Within a 50-connection Postgres pool — slide higher to see
                    where relational row locks collapse.
                  </>
                )}
              </p>
            </div>

            <p className="font-serif text-base sm:text-lg text-[#0a0a0a] max-w-[34ch] leading-relaxed">
              By Little&rsquo;s Law (L = &lambda;W), holding a relational row
              lock for 25ms at {arrivalRate.toLocaleString()} req/s demands{" "}
              {requiredDbConnections} concurrent connections. Offloading the hot
              decrement to Redis Lua keeps Postgres insulated.
            </p>
          </div>
        </motion.div>

        {/* Empirical k6 Benchmark Table + Production Specs */}
        <div className="mt-6 rounded-2xl bg-[#edebe7] p-7 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-[#0a0a0a]">
              Measured k6 burst results
            </h3>

            <div className="inline-flex rounded-lg bg-[#e2dfd9] p-1 self-start">
              <button
                type="button"
                onClick={() => setActiveTab("k6")}
                className={`rounded-md px-4 py-2 text-[13px] font-semibold transition-colors cursor-pointer ${
                  activeTab === "k6"
                    ? "bg-[#0a0a0a] text-white"
                    : "text-[#0a0a0a] hover:bg-[#d8d5ce]"
                }`}
              >
                k6 Comparison
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className={`rounded-md px-4 py-2 text-[13px] font-semibold transition-colors cursor-pointer ${
                  activeTab === "specs"
                    ? "bg-[#0a0a0a] text-white"
                    : "text-[#0a0a0a] hover:bg-[#d8d5ce]"
                }`}
              >
                Production Specs
              </button>
            </div>
          </div>

          {activeTab === "k6" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[13px] font-semibold text-[#0a0a0a]">
                    <th className="pb-4 pr-4">Metric</th>
                    <th className="pb-4 px-4">PostgreSQL Row Locks</th>
                    <th className="pb-4 px-4">Redis Lua Engine</th>
                    <th className="pb-4 pl-4 text-right">Measured Gain</th>
                  </tr>
                </thead>
                <tbody className="text-sm sm:text-base">
                  {K6_METRICS.map((row, idx) => (
                    <tr
                      key={row.label}
                      className={idx % 2 === 0 ? "bg-[#f5f4f2]" : "bg-[#ffffff]"}
                    >
                      <td className="py-4 pl-4 pr-4 font-semibold text-[#0a0a0a] rounded-l-lg">
                        {row.label}
                      </td>
                      <td className="py-4 px-4 text-[#616160] tabular-nums">
                        {row.baseline}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#0a0a0a] tabular-nums">
                        {row.hardened}
                      </td>
                      <td className="py-4 pl-4 pr-4 text-right font-semibold text-[#047857] rounded-r-lg tabular-nums">
                        {row.delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRODUCTION_SPECS.map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-xl bg-[#ffffff] p-5 flex flex-col justify-between gap-2"
                >
                  <span className="text-[13px] font-semibold text-[#616160]">
                    {spec.label}
                  </span>
                  <span className="font-display text-lg font-bold text-[#0a0a0a]">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
