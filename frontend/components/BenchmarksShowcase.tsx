"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card3D } from "./Card3D";

interface MetricRow {
  label: string;
  metric: string;
  baseline: {
    value: string;
    num: number;
    sub: string;
    status: "bad" | "warning";
  };
  hardened: {
    value: string;
    num: number;
    sub: string;
    status: "good";
  };
  improvement: string;
}

const METRICS: MetricRow[] = [
  {
    label: "Peak Concurrency Throughput",
    metric: "Requests Per Second (RPS)",
    baseline: {
      value: "1,120 RPS",
      num: 11.2,
      sub: "Pool saturated & queue blocked",
      status: "bad",
    },
    hardened: {
      value: "10,480 RPS",
      num: 100,
      sub: "Sustained sub-millisecond gate",
      status: "good",
    },
    improvement: "+835% Throughput (9.3x)",
  },
  {
    label: "p95 Response Tail Latency",
    metric: "Milliseconds (lower is better)",
    baseline: {
      value: "271.4 ms",
      num: 100,
      sub: "Row locks serializing on disk WAL",
      status: "bad",
    },
    hardened: {
      value: "18.5 ms",
      num: 6.8,
      sub: "In-memory atomic evaluation",
      status: "good",
    },
    improvement: "93.2% Latency Reduction",
  },
  {
    label: "Inventory Overbooking Rate",
    metric: "Physically Oversold Tickets",
    baseline: {
      value: "14.8% Oversold",
      num: 100,
      sub: "TOCTOU race conditions violated stock",
      status: "bad",
    },
    hardened: {
      value: "0.00% Zero Leakage",
      num: 0,
      sub: "Single-threaded Redis linearizability",
      status: "good",
    },
    improvement: "Mathematically Guaranteed 0.00%",
  },
  {
    label: "HTTP 500 Connection Timeout Errors",
    metric: "Error Percentage under 10k RPS",
    baseline: {
      value: "16.4% Error Rate",
      num: 85,
      sub: "connectionTimeoutMillis: 2000 exceeded",
      status: "bad",
    },
    hardened: {
      value: "0.00% Error Rate",
      num: 0,
      sub: "Zero connection queue starvation",
      status: "good",
    },
    improvement: "Zero 500s (Pool Protected)",
  },
];

export function BenchmarksShowcase() {
  const [activeTab, setActiveTab] = useState<"comparison" | "specs">("comparison");

  return (
    <section id="benchmarks" className="py-16 md:py-24 relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-3 py-1 text-xs text-white mb-3">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Empirical benchmarks, k6 load suite</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a0a0a]">
              Relational Row Locks vs. Flash-Sale Atomic Engine
            </h2>
            <p className="mt-3 text-[#616160] text-sm sm:text-base leading-relaxed">
              Empirical stress test results simulating 10,000 requests hitting a flash sale of 500 tickets simultaneously across 500 virtual users (VUs).
            </p>
          </div>

          {/* Tab Switcher with morphing spring layout */}
          <div className="flex items-center gap-1 rounded-full bg-[#f5f4f2] border border-[#e5e3df] p-1 text-xs">
            <button
              onClick={() => setActiveTab("comparison")}
              className={`relative px-4 py-2 rounded-full font-semibold transition-colors cursor-pointer ${
                activeTab === "comparison" ? "text-white" : "text-[#616160] hover:text-[#0a0a0a]"
              }`}
            >
              {activeTab === "comparison" && (
                <motion.span
                  layoutId="benchmarksActiveTab"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-[#0a0a0a] rounded-full z-0"
                />
              )}
              <span className="relative z-10">Benchmark Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab("specs")}
              className={`relative px-4 py-2 rounded-full font-semibold transition-colors cursor-pointer ${
                activeTab === "specs" ? "text-white" : "text-[#616160] hover:text-[#0a0a0a]"
              }`}
            >
              {activeTab === "specs" && (
                <motion.span
                  layoutId="benchmarksActiveTab"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-[#0a0a0a] rounded-full z-0"
                />
              )}
              <span className="relative z-10">Hardware Rig Specs</span>
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === "comparison" ? (
          <div className="mt-10 grid grid-cols-1 gap-6">
            {METRICS.map((row, index) => (
              <Card3D key={index} depth={5} className="rounded-2xl">
                <div className="card-light p-6 h-full">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#0a0a0a] tracking-tight">
                        {row.label}
                      </h3>
                      <span className="text-xs text-[#616160]">
                        Standard: {row.metric}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0a0a0a] px-3.5 py-1 text-xs font-bold text-white self-start lg:self-center">
                      <TrendingDown className="h-3.5 w-3.5" />
                      {row.improvement}
                    </span>
                  </div>

                  {/* Animated Progress Bars with viewport triggers */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Baseline */}
                    <div className="bg-[#f5f4f2] border border-[#e5e3df] rounded-xl p-4">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[#9f1239] font-bold flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Baseline (SELECT ... FOR UPDATE)
                        </span>
                        <span className="text-[#0a0a0a] font-bold">{row.baseline.value}</span>
                      </div>

                      <div className="h-2.5 w-full bg-[#e5e3df] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${row.baseline.num}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full bg-[#9f1239] rounded-full"
                        />
                      </div>
                      <span className="mt-2 block text-xs text-[#616160]">
                        {row.baseline.sub}
                      </span>
                    </div>

                    {/* Hardened */}
                    <div className="card-dark p-4 rounded-xl">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          Hardened Engine (Redis Lua + Sagas)
                        </span>
                        <span className="text-white font-bold">
                          {row.hardened.value}
                        </span>
                      </div>

                      <div className="h-2.5 w-full bg-[#292929] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${row.hardened.num}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                          className="h-full bg-white rounded-full"
                        />
                      </div>
                      <span className="mt-2 block text-xs text-[#a1a1a1]">
                        {row.hardened.sub}
                      </span>
                    </div>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>
        ) : (
          /* Rig Specs Deck */
          <div className="mt-10 card-light p-6">
            <h3 className="text-lg font-bold text-[#0a0a0a] mb-4">
              Controlled Benchmark Environment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#f5f4f2] border border-[#e5e3df] rounded-xl p-4">
                <span className="text-[#616160] block mb-1">Compute Infrastructure</span>
                <p className="text-[#0a0a0a] font-bold">AWS ECS Fargate Task</p>
                <span className="text-xs text-[#616160]">1.0 vCPU, 2048 MB RAM</span>
              </div>
              <div className="bg-[#f5f4f2] border border-[#e5e3df] rounded-xl p-4">
                <span className="text-[#616160] block mb-1">Redis Engine</span>
                <p className="text-[#0a0a0a] font-bold">Redis 7.2 Alpine</p>
                <span className="text-xs text-[#616160]">maxmemory 256MB, AOF</span>
              </div>
              <div className="bg-[#f5f4f2] border border-[#e5e3df] rounded-xl p-4">
                <span className="text-[#616160] block mb-1">PostgreSQL Database</span>
                <p className="text-[#0a0a0a] font-bold">PostgreSQL 16.4</p>
                <span className="text-xs text-[#616160]">max_connections 100</span>
              </div>
              <div className="bg-[#f5f4f2] border border-[#e5e3df] rounded-xl p-4">
                <span className="text-[#616160] block mb-1">Load Injection Client</span>
                <p className="text-[#0a0a0a] font-bold">Grafana k6 v0.48</p>
                <span className="text-xs text-[#616160]">500 Concurrent VUs</span>
              </div>
            </div>
          </div>
        )}

      </motion.div>
    </section>
  );
}
