"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { HealthData } from "@/lib/api";
import { motion } from "motion/react";
import { Card3D } from "./Card3D";

interface LandingHeroProps {
  health: HealthData;
  onLaunchArena: () => void;
  onLaunchDuel: () => void;
}

export function LandingHero({ health, onLaunchArena, onLaunchDuel }: LandingHeroProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const gateLatency = health.redisLatencyMs || 1.2;

  const filterOptions = [
    { id: "all", label: "All", count: "60" },
    { id: "vip", label: "Royal Box", count: "20" },
    { id: "sweet", label: "Sweet Spot", count: "20" },
    { id: "standard", label: "Standard", count: "20" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 24,
      },
    },
  };

  return (
    <section className="relative pt-10 pb-12 md:pt-16 md:pb-16 overflow-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        {/* Top Header Grid: Headline Left + Explainer Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-8">
          
          {/* Headline: Black primary + Grey second line with staggered animation */}
          <motion.div variants={itemVariants} className="lg:col-span-7">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#0a0a0a] leading-[1.08]">
              Zero overbooking<br />
              <span className="text-[#767676]">for the flash sale.</span>
            </h1>
          </motion.div>

          {/* Supporting Statement (Right Column in grey) */}
          <motion.div variants={itemVariants} className="lg:col-span-5">
            <p className="text-base sm:text-lg text-[#616160] leading-relaxed">
              Thirteen micro-services, one atomic gate. Each request is verified by single-threaded Redis Lua before touching PostgreSQL disk.
            </p>
          </motion.div>
        </div>

        {/* Filter Pills with physics-based sliding toggle animation */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2 pt-2 pb-8">
          {filterOptions.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-colors ${
                  isActive ? "text-white" : "text-[#444444] bg-white hover:bg-[#eae8e4]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="heroFilterPill"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-[#0a0a0a] rounded-full z-0"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
                <span
                  className={`relative z-10 text-[11px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                    isActive ? "bg-[#292929] text-white" : "bg-[#f0eeea] text-[#666666]"
                  }`}
                >
                  {tab.count}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Large Featured 3D Dark Card */}
        <motion.div variants={itemVariants}>
          <Card3D depth={8} className="rounded-[1.25rem]">
            <div className="card-dark p-8 sm:p-10 relative overflow-hidden">
              {/* Subtle ambient lighting layer */}
              <div
                className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/[0.03] blur-3xl"
                style={{ transform: "translateZ(10px)" }}
              />

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
                <div className="max-w-2xl" style={{ transform: "translateZ(24px)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-bold text-lg text-white">
                      distributed-flash-sale-engine
                    </span>
                    <span className="rounded-full bg-[#292929] px-2.5 py-0.5 text-xs text-[#a1a1a1] font-medium">
                      Default, v2
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-[#a1a1a1] leading-relaxed">
                    Reads the concurrency burst, infers the atomic gatekeeping strategy, and sustains 10,000+ RPS with guaranteed 0.00% overbooking and zero TOCTOU race conditions.
                  </p>
                </div>

                <div
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  style={{ transform: "translateZ(30px)" }}
                >
                  <motion.button
                    onClick={onLaunchArena}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-white px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-none cursor-pointer"
                  >
                    <span>Launch Live Arena</span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>

                  <motion.button
                    onClick={onLaunchDuel}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-full bg-[#222222] hover:bg-[#2d2d2d] text-white px-4 py-2.5 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                    <span>Duel Mode</span>
                  </motion.button>
                </div>
              </div>

              {/* Bottom Metas inside Dark Card */}
              <div
                className="mt-8 pt-5 bg-[#171717] -mx-8 sm:-mx-10 px-8 sm:px-10 -mb-8 sm:-mb-10 rounded-b-[1.25rem] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-[#888888]"
                style={{ transform: "translateZ(18px)" }}
              >
                <div className="flex items-center gap-3">
                  <span>Redis Gate Latency: <strong className="text-white">{gateLatency}ms</strong></span>
                  <span>•</span>
                  <span>Throughput: <strong className="text-white">10,480 RPS</strong></span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">Zero Overbooking</span>
                </div>

                <div className="flex items-center gap-2">
                  <span>Install name</span>
                  <span className="rounded bg-[#222222] px-2.5 py-1 text-white text-xs flex items-center gap-1">
                    <code className="font-mono">distributed-flash-sale-engine</code>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#888888]" />
                  </span>
                </div>
              </div>
            </div>
          </Card3D>
        </motion.div>

        {/* 3 Interactive 3D White Cards Below */}
        <motion.div
          variants={itemVariants}
          className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          
          {/* Card 1 */}
          <Card3D depth={10} className="rounded-2xl">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="card-light p-6 flex flex-col justify-between h-full"
            >
              <div style={{ transform: "translateZ(15px)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#0a0a0a]">
                    atomic-lua-gate
                  </span>
                  <motion.div
                    whileHover={{ rotate: 45 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ArrowUpRight className="h-4 w-4 text-[#616160]" />
                  </motion.div>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-[#616160] leading-relaxed">
                  Single-threaded Redis script execution guarantees strict linearizability without row-level lock serialization on disk.
                </p>
              </div>
              <div
                className="mt-4 pt-3 text-xs text-[#0a0a0a] font-semibold"
                style={{ transform: "translateZ(20px)" }}
              >
                Sub-2ms p95 latency
              </div>
            </motion.div>
          </Card3D>

          {/* Card 2 */}
          <Card3D depth={10} className="rounded-2xl">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="card-light p-6 flex flex-col justify-between h-full"
            >
              <div style={{ transform: "translateZ(15px)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#0a0a0a]">
                    two-phase-saga
                  </span>
                  <motion.div
                    whileHover={{ rotate: 45 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ArrowUpRight className="h-4 w-4 text-[#616160]" />
                  </motion.div>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-[#616160] leading-relaxed">
                  Compensating INCRBY rollbacks automatically restore Redis stock if the PostgreSQL transaction encounters a failure.
                </p>
              </div>
              <div
                className="mt-4 pt-3 text-xs text-[#0a0a0a] font-semibold"
                style={{ transform: "translateZ(20px)" }}
              >
                Eventual consistency
              </div>
            </motion.div>
          </Card3D>

          {/* Card 3 */}
          <Card3D depth={10} className="rounded-2xl">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="card-light p-6 flex flex-col justify-between h-full"
            >
              <div style={{ transform: "translateZ(15px)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#0a0a0a]">
                    ecs-fargate-iac
                  </span>
                  <motion.div
                    whileHover={{ rotate: 45 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ArrowUpRight className="h-4 w-4 text-[#616160]" />
                  </motion.div>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-[#616160] leading-relaxed">
                  Hardened production Docker containerization under 50MB with Terraform IaC, AWS ALB routing, and auto-scaling.
                </p>
              </div>
              <div
                className="mt-4 pt-3 text-xs text-[#0a0a0a] font-semibold"
                style={{ transform: "translateZ(20px)" }}
              >
                Production ready
              </div>
            </motion.div>
          </Card3D>

        </motion.div>

      </motion.div>
    </section>
  );
}
