"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Skull,
  Clock,
  Flame,
  CheckCircle2,
} from "lucide-react";

interface ChaosControlsProps {
  injectLatency: boolean;
  onToggleLatency: (enabled: boolean) => void;
  onSimulateCrash: () => Promise<void>;
  isCrashing: boolean;
  lastCrashReport: {
    seatNumber: string;
    message: string;
    step: number;
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
    <div className="card-light p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5">
        <div className="flex items-center gap-2">
          <Skull className="h-4 w-4 text-[#0a0a0a]" />
          <h3 className="text-sm font-semibold text-[#0a0a0a]">
            Chaos engineering and saga rollback
          </h3>
        </div>
        <span className="rounded-full bg-[#f5f4f2] border border-[#e5e3df] px-2.5 py-0.5 text-xs text-[#0a0a0a] font-medium">
          Fault injection rack
        </span>
      </div>

      {/* Controls Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        
        {/* Toggle 1: Database Latency */}
        <div className="bg-[#f5f4f2] border border-[#e5e3df] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0a0a0a]" />
              <div>
                <span className="font-bold text-[#0a0a0a] block">Inject DB latency</span>
                <p className="text-xs text-[#616160]">Delay DB write by 3000ms</p>
              </div>
            </div>

            <button
              onClick={() => onToggleLatency(!injectLatency)}
              className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
                injectLatency ? "bg-[#0a0a0a]" : "bg-[#d4d2ce]"
              }`}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  injectLatency ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-2">
            <span className="text-[#616160]">Redis Gate:</span>
            <span className="text-emerald-700 font-semibold">&lt; 2ms (Isolated)</span>
          </div>
        </div>

        {/* Toggle 2: Simulate Database Crash */}
        <div className="bg-[#f5f4f2] border border-[#e5e3df] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#0a0a0a]" />
              <div>
                <span className="font-bold text-[#0a0a0a] block">Crash DB write</span>
                <p className="text-xs text-[#616160]">Trigger compensating saga</p>
              </div>
            </div>

            <motion.button
              onClick={onSimulateCrash}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              disabled={isCrashing}
              className="btn-black rounded-full px-3.5 py-1.5 text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              {isCrashing ? "Rolling Back..." : "Trigger Crash"}
            </motion.button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-2">
            <span className="text-[#616160]">Compensating:</span>
            <span className="text-rose-700 font-semibold">INCRBY (+1)</span>
          </div>
        </div>

      </div>

      {/* 4-Step Saga Stepper Visualizer with progress tracking */}
      <div className="mt-4 bg-[#f5f4f2] border border-[#e5e3df] rounded-xl p-3.5 text-xs">
        <span className="text-xs text-[#616160] block mb-2 font-semibold">
          Two-phase saga transaction stepper
        </span>

        <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
          <motion.div
            animate={lastCrashReport ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`p-1.5 rounded-lg transition-colors ${
              lastCrashReport ? "bg-[#0a0a0a] text-white font-semibold" : "bg-white border border-[#e5e3df] text-[#616160]"
            }`}
          >
            1. Redis DECR
          </motion.div>

          <motion.div
            animate={lastCrashReport ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`p-1.5 rounded-lg transition-colors ${
              lastCrashReport ? "bg-[#0a0a0a] text-white font-semibold" : "bg-white border border-[#e5e3df] text-[#616160]"
            }`}
          >
            2. DB Begin
          </motion.div>

          <motion.div
            animate={lastCrashReport ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`p-1.5 rounded-lg transition-colors ${
              lastCrashReport ? "bg-[#e11d48] text-white font-bold" : "bg-white border border-[#e5e3df] text-[#616160]"
            }`}
          >
            3. DB Crash
          </motion.div>

          <motion.div
            animate={lastCrashReport ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.3, delay: 0.3 }}
            className={`p-1.5 rounded-lg transition-colors ${
              lastCrashReport ? "bg-[#10b981] text-white font-bold" : "bg-white border border-[#e5e3df] text-[#616160]"
            }`}
          >
            4. INCRBY Rollback
          </motion.div>
        </div>

        {/* Live Crash Report Output */}
        <AnimatePresence>
          {lastCrashReport && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="mt-3 p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-xs text-[#065f46]"
            >
              <div className="flex items-center gap-1.5 font-bold text-[#065f46]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Compensating Rollback Verified</span>
              </div>
              <p className="mt-1 text-[#047857] leading-snug">
                {lastCrashReport.message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
