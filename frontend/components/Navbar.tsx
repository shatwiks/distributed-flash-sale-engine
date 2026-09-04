"use client";

import React from "react";
import { Sparkles, Cpu, Flame, Layers, Activity, Ticket } from "lucide-react";
import { HealthData } from "@/lib/api";

interface NavbarProps {
  health: HealthData;
  onOpenCreateModal: () => void;
}

export function Navbar({ health, onOpenCreateModal }: NavbarProps) {
  const isHealthy = health.status === "ok";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#3D2B1F] bg-[#140E0B]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand and Artisan Hall Tag */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C5A059]/50 bg-gradient-to-br from-[#2A1E18] to-[#1C1512] text-[#C5A059] shadow-brassGlow">
            <Ticket className="h-5 w-5 text-[#C5A059]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight text-[#F7F2EA]">
                GRAND ARTISAN HALL
              </span>
              <span className="rounded border border-[#8C6239]/60 bg-[#2A1E18] px-2 py-0.5 text-[9px] font-mono tracking-widest text-[#C5A059] uppercase">
                Acoustic Concurrency
              </span>
            </div>
            <p className="text-xs text-[#D4B996]/75">
              Cinema &amp; Concert Reservation Engine • Redis Lua Atomic Gate
            </p>
          </div>
        </div>

        {/* System Architecture Pills & Health Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-[#3D2B1F] bg-[#1C1512] px-3 py-1.5 md:flex">
            <Cpu className="h-3.5 w-3.5 text-[#C5A059]" />
            <span className="font-mono text-xs text-[#D4B996]">Redis 7 Lua Gate</span>
            <span className="text-[#3D2B1F]">|</span>
            <Layers className="h-3.5 w-3.5 text-[#8C6239]" />
            <span className="font-mono text-xs text-[#D4B996]">PostgreSQL 16 Pool</span>
          </div>

          {/* Real-time Cluster State */}
          <div className="flex items-center gap-2 rounded-lg border border-[#3D2B1F] bg-[#1C1512] px-3 py-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isHealthy
                  ? "animate-pulse bg-[#588157] shadow-[0_0_8px_#588157]"
                  : "bg-[#E07A5F] shadow-[0_0_8px_#E07A5F]"
              }`}
            />
            <span className="font-mono text-xs font-semibold text-[#F7F2EA]">
              {isHealthy ? "GATE ACTIVE" : "DEGRADED"}
            </span>
          </div>

          {/* Quick Create Event Button */}
          <button
            onClick={onOpenCreateModal}
            className="btn-brass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Event</span>
          </button>
        </div>
      </div>
    </header>
  );
}
