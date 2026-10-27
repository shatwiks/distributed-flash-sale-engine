"use client";

import React from "react";
import { motion } from "motion/react";
import { X, Sparkles, Ticket, CheckCircle2 } from "lucide-react";
import { CheckoutResult } from "@/lib/api";

interface TicketPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CheckoutResult | null;
  eventName: string;
}

export function TicketPassModal({
  isOpen,
  onClose,
  result,
  eventName,
}: TicketPassModalProps) {
  if (!isOpen || !result) return null;

  const seatNumber = result.seat_number || result.seatNumber || "D5";
  const row = seatNumber[0] || "D";
  const isVip = row === "E" || row === "F";
  const isAcoustic = row === "C" || row === "D";
  const tierName = isVip
    ? "Royal Box, VIP Suite"
    : isAcoustic
    ? "Acoustic Sweet Spot"
    : "Standard Orchestra Stalls";
  const price = isVip ? "$45.00" : isAcoustic ? "$25.00" : "$18.50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="relative w-full max-w-xl"
      >
        {/* Close Button */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="absolute -top-3 -right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] border border-[#333333] text-[#a1a1a1] hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </motion.button>

        {/* Digital Boarding Pass */}
        <div className="relative flex flex-col md:flex-row overflow-hidden rounded-2xl bg-[#111111] border border-[#222222] text-white">
          
          {/* Main Body */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-full bg-[#292929] px-3 py-1 text-xs font-semibold text-white">
                  <Sparkles className="h-3 w-3 text-white" />
                  <span>Confirmed Admission Pass</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Secured in {result.gateLatencyMs || 1.2}ms</span>
                </div>
              </div>

              {/* Event Name */}
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
                {eventName}
              </h2>
              <p className="mt-1 text-xs text-[#a1a1a1] tracking-wide">
                Vienna Konzerthaus, Grand Laser Acoustic Hall
              </p>
            </div>

            {/* Middle Specs Grid */}
            <div className="my-6 grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#1c1c1c] text-xs">
              <div>
                <span className="text-xs text-[#a1a1a1] block">
                  Tier / Section
                </span>
                <p className="font-bold text-white truncate mt-0.5">{tierName}</p>
              </div>

              <div>
                <span className="text-xs text-[#a1a1a1] block">
                  Price Tariff
                </span>
                <p className="font-bold text-white mt-0.5">{price}</p>
              </div>

              <div>
                <span className="text-xs text-[#a1a1a1] block">
                  Order UUID
                </span>
                <code className="text-xs text-[#d4d2ce] truncate mt-0.5 font-mono block">
                  {result.id || `ord_${Math.random().toString(36).substring(2, 10)}`}
                </code>
              </div>

              <div>
                <span className="text-xs text-[#a1a1a1] block">
                  Concurrency Gate
                </span>
                <p className="text-xs text-emerald-400 font-bold mt-0.5">
                  Redis Lua O(1) Atomic
                </p>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#a1a1a1]">
                Idempotency: <code>{result.idempotency_key?.slice(0, 16) || "idem_verified"}</code>...
              </span>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="btn-white px-5 py-2 text-xs font-semibold cursor-pointer"
              >
                Done
              </motion.button>
            </div>
          </div>

          {/* Right Ticket Stub */}
          <div className="flex flex-col items-center justify-between bg-[#181818] p-6 text-center md:w-44">
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#292929] text-white">
                <Ticket className="h-8 w-8" />
              </div>
              <span className="mt-3 text-xs text-[#a1a1a1]">
                Seat Assignment
              </span>
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.15, 1] }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-3xl font-black text-white"
              >
                {seatNumber}
              </motion.span>
            </div>

            {/* Verification Tag */}
            <div className="mt-6 flex flex-col items-center">
              <span className="rounded-full bg-[#292929] px-2.5 py-1 text-[10px] font-semibold text-white">
                Verified Gate Entry
              </span>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
