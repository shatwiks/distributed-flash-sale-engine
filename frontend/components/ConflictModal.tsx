"use client";

import React from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  CheckCircle2,
  X,
} from "lucide-react";
import { CheckoutResult } from "@/lib/api";

export interface ConflictModalState {
  isOpen: boolean;
  type: "success" | "conflict";
  result?: CheckoutResult;
  device?: string;
}

interface ConflictModalProps {
  modalState: ConflictModalState;
  onClose: () => void;
  eventName: string;
}

export function ConflictModal({
  modalState,
  onClose,
}: ConflictModalProps) {
  if (!modalState.isOpen || !modalState.result) return null;

  const { result, device } = modalState;
  const seatNumber = result.seat_number || result.seatNumber || "D5";
  const gateLatency = result.gateLatencyMs || 1.8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="relative w-full max-w-lg rounded-2xl card-light p-6"
      >
        {/* Close Button */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-4 right-4 rounded-full p-1.5 text-[#616160] hover:text-[#0a0a0a] transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </motion.button>

        {/* Header Alert Banner */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fee2e2] text-[#9f1239]"
          >
            <ShieldAlert className="h-6 w-6" />
          </motion.div>
          <div>
            <span className="text-xs font-semibold text-[#9f1239]">
              Race condition intercepted
            </span>
            <h3 className="text-xl font-bold tracking-tight text-[#0a0a0a]">
              HTTP 409 Conflict: Seat Contention
            </h3>
          </div>
        </div>

        {/* Body Description */}
        <div className="mt-4 rounded-xl bg-[#fff1f2] border border-[#fecdd3] p-4 text-xs leading-relaxed text-[#9f1239]">
          <p>
            {result.message ||
              `A concurrent transaction on another device reached the Redis Lua Atomic Gate nanoseconds ahead. Seat ${seatNumber} has already been claimed.`}
          </p>
        </div>

        {/* Micro-Timeline Breakdown */}
        <div className="mt-4 bg-[#f5f4f2] border border-[#e5e3df] rounded-xl p-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between pb-1 text-xs">
            <span className="text-[#616160]">Target Seat:</span>
            <span className="text-[#0a0a0a] font-bold">{seatNumber}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#616160]">Requesting Device:</span>
            <span className="text-[#0a0a0a] font-semibold">{device || "Device B (Chrome)"}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#616160]">Gate Interception Latency:</span>
            <span className="text-[#0a0a0a] font-bold">{gateLatency}ms</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#616160]">Database Impact:</span>
            <span className="text-[#065f46] font-bold">Zero DB Calls (Protected)</span>
          </div>
        </div>

        {/* Guarantee Banner */}
        <div className="mt-5 flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-xs text-[#065f46] font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Invariant Preserved: available &gt;= 0</span>
          </div>

          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="btn-black px-5 py-2 text-xs font-semibold cursor-pointer"
          >
            Acknowledge
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
