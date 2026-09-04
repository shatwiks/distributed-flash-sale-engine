"use client";

import React, { useState } from "react";
import {
  Skull,
  Clock,
  RotateCcw,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Layers,
} from "lucide-react";

interface ChaosControlsProps {
  injectLatency: boolean;
  onToggleLatency: (enabled: boolean) => void;
  onSimulateCrash: () => Promise<void>;
  isCrashing: boolean;
  lastCrashReport: {
    seatNumber: string;
    message: string;
    step: number; // 1: Redis Decr, 2: DB Crash, 3: Compensating INCRBY, 4: Restored
  } | null;
}

export function ChaosControls({
  injectLatency,
  onToggleLatency,
  onSimulateCrash,
  isCrashing,
  lastCrashReport,
}: ChaosControlsProps) {
  return (
    <div className="card-craft border-[#4E3727] bg-[#1C1512] p-5 shadow-card">
      <div className="flex items-center justify-between pb-3 border-b border-[#3D2B1F]">
        <div className="flex items-center gap-2">
          <Skull className="h-4 w-4 text-[#E07A5F]" />
          <h3 className="font-serif text-sm font-bold text-[#F7F2EA] uppercase tracking-wider">
            Chaos Engineering Rack &amp; Rollback Kill-Switch
          </h3>
        </div>
        <span className="rounded bg-[#E07A5F]/20 px-2 py-0.5 font-mono text-[10px] text-[#E07A5F] border border-[#E07A5F]/30">
          Saga Failure Testing
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {/* Control 1: Inject Database Latency (+3000ms) */}
        <div className="timber-inset p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#C5A059]" />
              <div>
                <span className="font-bold text-[#F7F2EA]">Inject DB Latency</span>
                <p className="text-[10px] text-[#D4B996]/60">Delay PostgreSQL write by +3000ms</p>
              </div>
            </div>

            <button
              onClick={() => onToggleLatency(!injectLatency)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                injectLatency ? "bg-[#C5A059]" : "bg-[#2A1E18]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  injectLatency ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-[#3D2B1F]/60">
            <span className="text-[#D4B996]/70">Redis Gate:</span>
            <span className="text-[#8FBC8F]">&lt; 2ms (Zero Leakage)</span>
          </div>
        </div>

        {/* Control 2: Simulate Database Crash (Compensating Rollback) */}
        <div className="timber-inset p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#E07A5F]" />
              <div>
                <span className="font-bold text-[#F7F2EA]">Crash DB Commit</span>
                <p className="text-[10px] text-[#D4B996]/60">Trigger Saga compensating rollback</p>
              </div>
            </div>

            <button
              onClick={onSimulateCrash}
              disabled={isCrashing}
              className="rounded-md border border-[#E07A5F]/60 bg-gradient-to-b from-[#3D1E18] to-[#2A1410] px-3 py-1 text-[11px] font-bold text-[#F7F2EA] hover:border-[#E07A5F] active:translate-y-0.5 disabled:opacity-40"
            >
              {isCrashing ? "Rolling Back..." : "Trigger Crash"}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-[#3D2B1F]/60">
            <span className="text-[#D4B996]/70">Rollback Mechanism:</span>
            <span className="text-[#C5A059]">Redis INCRBY &amp; SREM</span>
          </div>
        </div>
      </div>

      {/* Real-time Saga Rollback Animated Pipeline */}
      {lastCrashReport && (
        <div className="mt-4 rounded-xl border border-[#E07A5F]/40 bg-gradient-to-r from-[#2A1410] to-[#1C1512] p-4 text-xs font-mono animate-in fade-in duration-300">
          <div className="flex items-center gap-2 pb-2 text-[#E07A5F] font-bold">
            <ShieldAlert className="h-4 w-4 animate-pulse" />
            <span>Saga Compensating Rollback Live Flow:</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            {/* Step 1: Redis Gate */}
            <div className="flex items-center gap-1 rounded bg-[#1C1512] px-2.5 py-1 text-[#8FBC8F] border border-[#3D2B1F]">
              <CheckCircle2 className="h-3 w-3" />
              <span>1. Redis DECR: Seat {lastCrashReport.seatNumber}</span>
            </div>

            <ArrowRight className="h-3 w-3 text-[#D4B996]/50" />

            {/* Step 2: DB Crash */}
            <div className="flex items-center gap-1 rounded bg-red-950/80 px-2.5 py-1 text-red-300 border border-red-800">
              <AlertTriangle className="h-3 w-3" />
              <span>2. Postgres Crash (Commit Failed)</span>
            </div>

            <ArrowRight className="h-3 w-3 text-[#D4B996]/50" />

            {/* Step 3: Compensating Undo */}
            <div className="flex items-center gap-1 rounded bg-[#2A1E18] px-2.5 py-1 text-[#C5A059] border border-[#C5A059]/40">
              <RotateCcw className="h-3 w-3 animate-spin" />
              <span>3. Redis INCRBY (+1) Compensate</span>
            </div>

            <ArrowRight className="h-3 w-3 text-[#D4B996]/50" />

            {/* Step 4: Restored */}
            <div className="flex items-center gap-1 rounded bg-[#1F2D1F] px-2.5 py-1 text-[#8FBC8F] border border-[#8FBC8F]/50 font-bold">
              <CheckCircle2 className="h-3 w-3" />
              <span>4. Stock Restored (0 Leaks)</span>
            </div>
          </div>

          <p className="mt-2.5 text-[10px] text-[#D4B996]/70 leading-normal">
            {lastCrashReport.message}
          </p>
        </div>
      )}
    </div>
  );
}
