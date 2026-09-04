"use client";

import React, { useState } from "react";
import {
  Laptop,
  Smartphone,
  Swords,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Ticket,
  Lock,
  ArrowRight,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { DeviceType } from "./TopWidgetsBar";
import { CheckoutResult } from "@/lib/api";
import { getTierForSeat } from "./SeatMatrix";

interface DuelConsoleProps {
  selectedSeat: string;
  onSelectSeat: (seatId: string) => void;
  bookedSeats: string[];
  contestedSeat: string | null;
  onBookSeat: (seatNumber: string, device: DeviceType) => Promise<void>;
  onSimulateCollision: (seatNumber: string) => Promise<void>;
  isBooking: boolean;
  isSimulating: boolean;
  lastDuelResult: {
    winner: CheckoutResult | null;
    rejected: CheckoutResult | null;
  } | null;
}

export function DuelConsole({
  selectedSeat,
  onSelectSeat,
  bookedSeats,
  contestedSeat,
  onBookSeat,
  onSimulateCollision,
  isBooking,
  isSimulating,
  lastDuelResult,
}: DuelConsoleProps) {
  return (
    <div className="card-craft border-[#4E3727] bg-[#1A120E] p-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#3D2B1F] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-[#C5A059]" />
            <h2 className="font-serif text-lg font-bold text-[#F7F2EA]">
              Dual-Device Concurrency Duel Console
            </h2>
          </div>
          <p className="text-xs text-[#D4B996]/70">
            Simulate or execute simultaneous race conditions targeting the exact same seat across two distinct clients.
          </p>
        </div>

        {/* Central Collision Trigger Button */}
        <button
          onClick={() => onSimulateCollision(selectedSeat || "D5")}
          disabled={isBooking || isSimulating || bookedSeats.includes(selectedSeat)}
          className="group relative flex items-center gap-2 rounded-xl border-2 border-red-500/80 bg-gradient-to-r from-red-950 via-[#3D1410] to-red-950 px-5 py-2.5 text-xs font-bold text-red-100 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:border-red-400 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Swords className={`h-4 w-4 text-red-400 ${isSimulating ? "animate-spin" : "group-hover:rotate-45 transition-transform"}`} />
          <span>{isSimulating ? "Racing Redis Gate..." : `Simulate Concurrent Collision on ${selectedSeat || "D5"}`}</span>
        </button>
      </div>

      {/* Split-Screen 2-Column Duel Deck */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================================================================= */}
        {/* LEFT: Device A (Safari / MacBook)                                  */}
        {/* ================================================================= */}
        <div className="rounded-2xl border-2 border-[#C5A059]/40 bg-[#1C1512] p-5 shadow-lg flex flex-col justify-between">
          <div>
            {/* Device Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#3D2B1F]">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C5A059] bg-[#2A1E18] text-[#C5A059] shadow-brassGlow">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#F7F2EA]">
                    Device A — Safari / MacBook
                  </h4>
                  <span className="font-mono text-[10px] text-[#C5A059]">
                    User: user_alpha (192.168.1.10)
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#C5A059]/20 px-2 py-0.5 font-mono text-[10px] text-[#C5A059] border border-[#C5A059]/30 font-semibold">
                Client 1
              </span>
            </div>

            {/* Target Seat Info */}
            <div className="my-4 timber-inset p-3.5 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[#D4B996]/60">Target Seat:</span>
                <span className="rounded bg-[#3D2B1F] px-2 py-0.5 text-[#C5A059] font-bold border border-[#4E3727]">
                  {selectedSeat || "D5"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#D4B996]/60">Ticket Tier:</span>
                <span className="text-[#F7F2EA]">
                  {getTierForSeat(selectedSeat).tier} (${getTierForSeat(selectedSeat).price.toFixed(2)})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#D4B996]/60">Redis Atomic Gate:</span>
                <span className="text-[#8FBC8F]">&lt; 2ms In-Memory</span>
              </div>
            </div>

            {/* Duel Result Card for Device A */}
            {lastDuelResult?.winner && (
              <div className="rounded-xl border border-[#8FBC8F]/50 bg-[#1F2D1F]/60 p-3 text-xs font-mono animate-in fade-in">
                <div className="flex items-center gap-1.5 text-[#8FBC8F] font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>HTTP 201 Created — Transaction Won</span>
                </div>
                <p className="mt-1 text-[11px] text-[#F7F2EA]">
                  Acquired seat {lastDuelResult.winner.seat_number} in {lastDuelResult.winner.gateLatencyMs}ms.
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => onBookSeat(selectedSeat || "D5", "device_a")}
            disabled={isBooking || isSimulating || bookedSeats.includes(selectedSeat)}
            className="btn-brass mt-4 w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Ticket className="h-4 w-4" />
            <span>Book {selectedSeat || "D5"} from Device A</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* RIGHT: Device B (Chrome / Mobile)                                 */}
        {/* ================================================================= */}
        <div className="rounded-2xl border-2 border-[#E07A5F]/40 bg-[#1C1512] p-5 shadow-lg flex flex-col justify-between">
          <div>
            {/* Device Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#3D2B1F]">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E07A5F] bg-[#2A1410] text-[#E07A5F] shadow-sm">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#F7F2EA]">
                    Device B — Chrome / Mobile
                  </h4>
                  <span className="font-mono text-[10px] text-[#E07A5F]">
                    User: user_beta (10.0.0.42)
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-[#E07A5F]/20 px-2 py-0.5 font-mono text-[10px] text-[#E07A5F] border border-[#E07A5F]/30 font-semibold">
                Client 2
              </span>
            </div>

            {/* Target Seat Info */}
            <div className="my-4 timber-inset p-3.5 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[#D4B996]/60">Target Seat:</span>
                <span className="rounded bg-[#3D2B1F] px-2 py-0.5 text-[#C5A059] font-bold border border-[#4E3727]">
                  {selectedSeat || "D5"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#D4B996]/60">Ticket Tier:</span>
                <span className="text-[#F7F2EA]">
                  {getTierForSeat(selectedSeat).tier} (${getTierForSeat(selectedSeat).price.toFixed(2)})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#D4B996]/60">Collision Guard:</span>
                <span className="text-[#E07A5F]">Redis Lua Gate SISMEMBER</span>
              </div>
            </div>

            {/* Duel Result Card for Device B */}
            {lastDuelResult?.rejected && (
              <div className="rounded-xl border border-red-500/50 bg-red-950/70 p-3 text-xs font-mono animate-in fade-in">
                <div className="flex items-center gap-1.5 text-red-300 font-bold">
                  <ShieldAlert className="h-4 w-4 animate-pulse" />
                  <span>HTTP 409 Conflict — Race Condition Blocked</span>
                </div>
                <p className="mt-1 text-[11px] text-red-200 leading-tight">
                  Seat {lastDuelResult.rejected.seat_number} was claimed by another transaction. Rejected in {lastDuelResult.rejected.gateLatencyMs}ms.
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => onBookSeat(selectedSeat || "D5", "device_b")}
            disabled={isBooking || isSimulating || bookedSeats.includes(selectedSeat)}
            className="mt-4 w-full rounded-xl border border-[#E07A5F] bg-gradient-to-b from-[#3D1E18] to-[#2A1410] py-2.5 text-xs font-bold text-[#F7F2EA] uppercase tracking-wider flex items-center justify-center gap-2 hover:border-[#F87171] active:translate-y-0.5 disabled:opacity-40"
          >
            <Ticket className="h-4 w-4" />
            <span>Book {selectedSeat || "D5"} from Device B</span>
          </button>
        </div>
      </div>
    </div>
  );
}
