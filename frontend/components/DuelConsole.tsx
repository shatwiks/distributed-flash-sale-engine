"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Laptop,
  Smartphone,
  Swords,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { DeviceType } from "./TopWidgetsBar";
import { CheckoutResult } from "@/lib/api";
import { getTierForSeat } from "./SeatMatrix";
import { Card3D } from "./Card3D";

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
  bookedSeats,
  onBookSeat,
  onSimulateCollision,
  isBooking,
  isSimulating,
  lastDuelResult,
}: DuelConsoleProps) {
  const currentTier = getTierForSeat(selectedSeat);
  const targetSeat = selectedSeat || "D5";
  const isBooked = bookedSeats.includes(targetSeat);

  return (
    <div id="duel-console" className="card-light p-6 relative">
      {/* Duel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-[#0a0a0a]" />
            <h2 className="text-xl font-bold tracking-tight text-[#0a0a0a]">
              Split-Screen Concurrency Duel Arena
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#616160]">
            Simulate or fire simultaneous race-condition checkouts targeting seat {targetSeat} across two separate clients.
          </p>
        </div>

        {/* Central Collision Trigger Button with active press state */}
        <motion.button
          onClick={() => onSimulateCollision(targetSeat)}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.95, y: 1 }}
          disabled={isBooking || isSimulating || isBooked}
          className="group relative flex items-center justify-center gap-2 btn-black px-6 py-3 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Swords className={`h-4 w-4 text-white ${isSimulating ? "animate-spin" : ""}`} />
          <span>{isSimulating ? "Racing to Redis Gate..." : `Simulate Collision on Seat ${targetSeat}`}</span>
        </motion.button>
      </div>

      {/* Split-Screen 2-Column 3D Deck */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Device A: Safari, macOS in 3D Card */}
        <Card3D depth={8} className="rounded-2xl">
          <div className="rounded-2xl card-dark p-5 flex flex-col justify-between h-full">
            <div style={{ transform: "translateZ(15px)" }}>
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#292929] text-white">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Device A: Safari, macOS
                    </h4>
                    <span className="text-xs text-[#a1a1a1]">
                      user_alpha (192.168.1.10)
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-[#292929] px-2.5 py-0.5 text-xs text-white font-semibold">
                  Client 1
                </span>
              </div>

              {/* Terminal State */}
              <div className="mt-4 surface-inset-dark p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#a1a1a1]">Target Seat:</span>
                  <span className="text-white font-bold">{targetSeat}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a1a1a1]">Seat Tier:</span>
                  <span className="text-[#d4d2ce]">{currentTier.tier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a1a1a1]">Idempotency Key:</span>
                  <code className="text-[#a1a1a1] text-xs font-mono">idem_dev_a_{targetSeat}</code>
                </div>
              </div>

              {/* Duel Battle Output for Device A */}
              {lastDuelResult?.winner?.user_id?.includes("alpha") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 rounded-xl bg-[#14291e] border border-[#1b4332] p-3.5 text-xs text-emerald-200"
                >
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Race Winner: HTTP 201 Created</span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-300">
                    Claimed seat in {lastDuelResult.winner.gateLatencyMs || 1.2}ms via Redis Lua gate.
                  </p>
                </motion.div>
              )}

              {lastDuelResult?.rejected?.user_id?.includes("alpha") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 rounded-xl bg-[#2d1217] border border-[#4c1d24] p-3.5 text-xs text-rose-200"
                >
                  <div className="flex items-center gap-2 font-bold text-rose-400">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Collision Blocked: HTTP 409 Conflict</span>
                  </div>
                  <p className="mt-1 text-xs text-rose-300">
                    Rejected in {lastDuelResult.rejected.gateLatencyMs || 1.5}ms. Zero overbooking.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Action Trigger */}
            <div style={{ transform: "translateZ(20px)" }}>
              <motion.button
                onClick={() => onBookSeat(targetSeat, "device_a")}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96, y: 1 }}
                disabled={isBooking || isSimulating || isBooked}
                className="mt-5 btn-white w-full py-2.5 rounded-full text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Authorize Purchase from Device A
              </motion.button>
            </div>
          </div>
        </Card3D>

        {/* Device B: Chrome, Android in 3D Card */}
        <Card3D depth={8} className="rounded-2xl">
          <div className="rounded-2xl bg-[#f5f4f2] border border-[#e5e3df] p-5 flex flex-col justify-between h-full text-[#0a0a0a]">
            <div style={{ transform: "translateZ(15px)" }}>
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edebe7] text-[#0a0a0a]">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0a0a0a]">
                      Device B: Chrome, Android
                    </h4>
                    <span className="text-xs text-[#616160]">
                      user_beta (192.168.1.42)
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-[#edebe7] border border-[#e5e3df] px-2.5 py-0.5 text-xs text-[#0a0a0a] font-semibold">
                  Client 2
                </span>
              </div>

              {/* Terminal State */}
              <div className="mt-4 bg-white border border-[#e5e3df] rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#616160]">Target Seat:</span>
                  <span className="text-[#0a0a0a] font-bold">{targetSeat}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#616160]">Seat Tier:</span>
                  <span className="text-[#444444]">{currentTier.tier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#616160]">Idempotency Key:</span>
                  <code className="text-[#616160] text-xs font-mono">idem_dev_b_{targetSeat}</code>
                </div>
              </div>

              {/* Duel Battle Output for Device B */}
              {lastDuelResult?.winner?.user_id?.includes("beta") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] p-3.5 text-xs text-[#065f46]"
                >
                  <div className="flex items-center gap-2 font-bold text-[#065f46]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Race Winner: HTTP 201 Created</span>
                  </div>
                  <p className="mt-1 text-xs text-[#047857]">
                    Claimed seat in {lastDuelResult.winner.gateLatencyMs || 1.2}ms via Redis Lua gate.
                  </p>
                </motion.div>
              )}

              {lastDuelResult?.rejected?.user_id?.includes("beta") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 rounded-xl bg-[#fff1f2] border border-[#fecdd3] p-3.5 text-xs text-[#9f1239]">
                  <div className="flex items-center gap-2 font-bold text-[#9f1239]">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Collision Blocked: HTTP 409 Conflict</span>
                  </div>
                  <p className="mt-1 text-xs text-[#be123c]">
                    Rejected in {lastDuelResult.rejected.gateLatencyMs || 1.5}ms. Zero overbooking.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Action Trigger */}
            <div style={{ transform: "translateZ(20px)" }}>
              <motion.button
                onClick={() => onBookSeat(targetSeat, "device_b")}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96, y: 1 }}
                disabled={isBooking || isSimulating || isBooked}
                className="mt-5 btn-black w-full py-2.5 rounded-full text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Authorize Purchase from Device B
              </motion.button>
            </div>
          </div>
        </Card3D>

      </div>
    </div>
  );
}
