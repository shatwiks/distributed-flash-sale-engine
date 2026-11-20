"use client";

import React from "react";
import { Plus } from "lucide-react";
import { HealthData } from "@/lib/api";
import { motion } from "motion/react";

interface NavbarProps {
  health: HealthData;
  onOpenCreateModal: () => void;
  onNavigateToArena?: () => void;
  onNavigateToDuel?: () => void;
}

export function Navbar({
  health,
  onOpenCreateModal,
  onNavigateToDuel,
}: NavbarProps) {
  const isHealthy = health.status === "ok";
  const gateLatency = health.redisLatencyMs || 1.2;

  return (
    <header className="relative z-40 w-full bg-[#f5f4f2]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Brand Wordmark with Notched Ticket Mark */}
        <a
          href="#"
          className="flex items-center gap-3 text-[#0a0a0a] focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <span
            aria-hidden="true"
            className="relative flex h-8 w-10 items-center justify-center rounded-md bg-[#0a0a0a] text-white"
          >
            <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#f5f4f2]" />
            <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#f5f4f2]" />
            <span className="text-[11px] font-extrabold tracking-tighter">FS</span>
          </span>
          <span className="text-base font-bold tracking-tight text-[#0a0a0a]">
            Flash-Sale Engine
          </span>
        </a>

        {/* Center Plain Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#616160]"
        >
          <a
            href="#live-arena"
            className="hover:text-[#0a0a0a] transition-colors"
          >
            Live Arena
          </a>
          <button
            type="button"
            onClick={onNavigateToDuel}
            className="hover:text-[#0a0a0a] transition-colors cursor-pointer"
          >
            Duel Mode
          </button>
          <a
            href="#architecture"
            className="hover:text-[#0a0a0a] transition-colors"
          >
            How It Works
          </a>
          <a
            href="#benchmarks"
            className="hover:text-[#0a0a0a] transition-colors"
          >
            Benchmarks
          </a>
        </nav>

        {/* Live Gate Telemetry + Primary Action */}
        <div className="flex items-center gap-3">
          <div
            data-ui
            className="flex items-center gap-2 rounded-lg bg-[#ffffff] px-3.5 py-2 text-[13px]"
            aria-label={`Redis gate status: ${isHealthy ? "active" : "degraded"}, ${gateLatency} milliseconds`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isHealthy ? "bg-[#10b981]" : "bg-[#e11d48]"
              }`}
            />
            <span className="text-[#616160] font-medium hidden sm:inline">
              {isHealthy ? "Redis gate" : "Degraded"}
            </span>
            <span className="text-[#0a0a0a] font-bold tabular-nums">
              {gateLatency}ms
            </span>
          </div>

          <motion.button
            type="button"
            onClick={onOpenCreateModal}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            className="ticket-btn flex items-center gap-1.5 px-4 py-2 text-[13px] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Event</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
