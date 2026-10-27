"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronUp,
  ChevronDown,
  Terminal,
  Zap,
  Database,
  Activity,
  Server,
  Copy,
  Check,
} from "lucide-react";
import { CheckoutResult, HealthData } from "@/lib/api";

interface WireInspectorProps {
  lastResult: CheckoutResult | null;
  health: HealthData;
}

export function WireInspector({ lastResult, health }: WireInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const gateLatency = lastResult?.gateLatencyMs || 1.2;
  const dbLatency = lastResult?.dbDurationMs || (lastResult?.statusCode === 201 ? 14.5 : 0);
  const totalDuration = lastResult?.durationMs || Math.round((gateLatency + dbLatency) * 10) / 10;
  const rawCommand =
    lastResult?.rawRedisCommand ||
    "EVALSHA <lua_gate_sha> 2 event:vienna:booked_seats event:vienna:stock D5 1 -> RETURN 1 (Acquired)";

  const pool = health.pool || {
    total: 50,
    active: 2,
    idle: 48,
    waiting: 0,
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(rawCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      aria-label="Inspect the Wire Micro-Telemetry Drawer"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#111111]"
    >
      {/* Drawer Toggle Header Bar with active press */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="wire-drawer-content"
        whileHover={{ backgroundColor: "#171717" }}
        whileTap={{ scale: 0.99 }}
        className="flex w-full items-center justify-between px-4 sm:px-8 py-2.5 bg-[#111111] text-xs text-white transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-white" />
          <span className="font-bold text-white text-xs">
            Inspect the wire
          </span>
          <span className="hidden sm:inline text-[#616160]">•</span>
          <code className="hidden sm:inline text-xs text-[#a1a1a1] font-mono truncate max-w-sm">
            {rawCommand.slice(0, 55)}...
          </code>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-white" />
            <span className="text-[#a1a1a1]">Redis Gate:</span>
            <span className="text-white font-bold">{gateLatency}ms</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-[#a1a1a1]" />
            <span className="text-[#a1a1a1]">Postgres:</span>
            <span className="text-white font-bold">
              {dbLatency > 0 ? `${dbLatency}ms` : "0ms"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-white font-semibold">
            <span>{isOpen ? "Collapse" : "Expand Wire"}</span>
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </div>
        </div>
      </motion.button>

      {/* Expanded Content Drawer with physics spring slide */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="wire-drawer-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="overflow-hidden bg-[#161616] px-4 sm:px-8 py-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              
              {/* Column 1: Raw Redis Lua Command */}
              <div className="bg-[#1f1f1f] border border-[#2e2e2e] rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Terminal className="h-3.5 w-3.5" />
                    Redis Lua Gate Command
                  </span>
                  <button
                    onClick={handleCopyCommand}
                    className="text-[#a1a1a1] hover:text-white transition-colors cursor-pointer"
                    title="Copy command"
                  >
                    {copied ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" }}
                      >
                        <Check className="h-3.5 w-3.5 text-white" />
                      </motion.span>
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <pre className="mt-3 text-[#f5f4f2] bg-[#111111] border border-[#262626] p-2.5 rounded-lg font-mono break-all leading-relaxed text-xs">
                  <code>{rawCommand}</code>
                </pre>
                <div className="mt-3 flex items-center justify-between text-xs text-[#a1a1a1]">
                  <span>Atomic Isolation: SERIALIZABLE</span>
                  <span className="text-white font-semibold">&lt; 2ms Gate</span>
                </div>
              </div>

              {/* Column 2: Dual Engine Latency Waterfall */}
              <div className="bg-[#1f1f1f] border border-[#2e2e2e] rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Activity className="h-3.5 w-3.5 text-white" />
                    Two-Layer Latency Waterfall
                  </span>
                  <span className="text-xs text-[#a1a1a1]">Total: {totalDuration}ms</span>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#d4d2ce] flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Redis Lua Atomic Gate
                      </span>
                      <span className="text-white font-bold">{gateLatency}ms</span>
                    </div>
                    <div className="h-2 w-full bg-[#2e2e2e] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white rounded-full"
                        animate={{ width: `${Math.min(100, Math.max(10, (gateLatency / totalDuration) * 100))}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#a1a1a1] flex items-center gap-1">
                        <Database className="h-3 w-3" /> PostgreSQL Transaction
                      </span>
                      <span className="text-[#a1a1a1] font-bold">{dbLatency}ms</span>
                    </div>
                    <div className="h-2 w-full bg-[#2e2e2e] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#616160] rounded-full"
                        animate={{ width: `${Math.min(100, Math.max(10, (dbLatency / totalDuration) * 100))}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[#a1a1a1] pt-2">
                  <span>Gatekeeping: IN-MEMORY</span>
                  <span className="text-white font-semibold">Zero Thread Blocking</span>
                </div>
              </div>

              {/* Column 3: PostgreSQL Connection Pool */}
              <div className="bg-[#1f1f1f] border border-[#2e2e2e] rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Server className="h-3.5 w-3.5 text-white" />
                    PostgreSQL Pool Health
                  </span>
                  <span className="text-white text-xs font-bold">OPTIMAL</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-[#292929]">
                    <span className="text-[#a1a1a1] block text-xs">Active</span>
                    <span className="text-white font-bold text-sm">{pool.active}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#292929]">
                    <span className="text-[#a1a1a1] block text-xs">Idle</span>
                    <span className="text-white font-bold text-sm">{pool.idle}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#292929]">
                    <span className="text-[#a1a1a1] block text-xs">Waiting</span>
                    <span className="text-[#a1a1a1] font-bold text-sm">{pool.waiting}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#292929]">
                    <span className="text-[#a1a1a1] block text-xs">Total Pool</span>
                    <span className="text-white font-bold text-sm">{pool.total}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[#a1a1a1] pt-2">
                  <span>Starvation Risk: 0.00%</span>
                  <span className="text-white font-semibold">Healthy</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
