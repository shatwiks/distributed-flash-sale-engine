"use client";

import React from "react";
import { Ticket, Plus } from "lucide-react";
import { HealthData } from "@/lib/api";
import { motion } from "motion/react";

interface NavbarProps {
  health: HealthData;
  onOpenCreateModal: () => void;
  onNavigateToArena?: () => void;
  onNavigateToDuel?: () => void;
}

export function Navbar({ health, onOpenCreateModal, onNavigateToArena, onNavigateToDuel }: NavbarProps) {
  const isHealthy = health.status === "ok";
  const gateLatency = health.redisLatencyMs || 1.2;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f5f4f2]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        
        {/* Brand */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0a0a0a] text-white">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-[#0a0a0a]">
                Flash-Sale Engine
              </span>
              <span className="hidden sm:inline-block rounded-full bg-[#e5e3df] px-2.5 py-0.5 text-xs font-semibold text-[#0a0a0a]">
                10k RPS
              </span>
            </div>
          </div>
        </motion.div>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#555555]">
          <a
            href="#live-arena"
            className="hover:text-[#0a0a0a] transition-colors"
          >
            Live Arena
          </a>
          <button
            onClick={onNavigateToDuel}
            className="hover:text-[#0a0a0a] transition-colors cursor-pointer"
          >
            Duel Mode
          </button>
          <a
            href="#architecture"
            className="hover:text-[#0a0a0a] transition-colors"
          >
            Architecture
          </a>
          <a
            href="#benchmarks"
            className="hover:text-[#0a0a0a] transition-colors"
          >
            Benchmarks
          </a>
        </nav>

        {/* Health & Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs">
            <motion.span
              animate={isHealthy ? { scale: [1, 1.25, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className={`h-2 w-2 rounded-full ${
                isHealthy ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span className="text-[#333333] font-medium hidden sm:inline">
              {isHealthy ? "Gate active" : "Degraded"}
            </span>
            <span className="text-[#0a0a0a] font-bold">
              {gateLatency}ms
            </span>
          </div>

          <motion.button
            onClick={onOpenCreateModal}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="btn-black flex items-center gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Event</span>
          </motion.button>
        </div>

      </div>
    </header>
  );
}
