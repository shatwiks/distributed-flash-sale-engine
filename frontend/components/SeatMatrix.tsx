"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Ticket,
  Key,
  Swords,
  Loader2,
  Volume2,
  Crown,
  Check,
  Copy,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ScreenCurvature } from "./ScreenCurvature";
import { DeviceType } from "./TopWidgetsBar";

const ROWS = ["A", "B", "C", "D", "E", "F"];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function getTierForSeat(seatId?: string | null) {
  const row = seatId && seatId.length > 0 ? seatId[0] : "A";
  if (row === "E" || row === "F") {
    return {
      tier: "Royal Box, VIP Suite",
      price: 45.0,
      badge: "VIP $45.00",
      accent: "text-[#0a0a0a] bg-[#f5f4f2] border border-[#e5e3df]",
    };
  }
  if (row === "C" || row === "D") {
    return {
      tier: "Acoustic Sweet Spot",
      price: 25.0,
      badge: "Sweet Spot $25.00",
      accent: "text-[#0a0a0a] bg-[#f5f4f2] border border-[#e5e3df]",
    };
  }
  return {
    tier: "Standard Stalls",
    price: 18.5,
    badge: "Stalls $18.50",
    accent: "text-[#616160] bg-[#f5f4f2] border border-[#e5e3df]",
  };
}

interface SeatMatrixProps {
  eventId: string;
  eventName: string;
  bookedSeats: string[];
  contestedSeat: string | null;
  activeDevice: DeviceType;
  selectedSeat: string;
  onSelectSeat: (seatNumber: string) => void;
  onBookSeat: (seatNumber: string, device: DeviceType) => Promise<void>;
  onSimulateCollision: (seatNumber: string) => Promise<void>;
  isBooking: boolean;
  isSimulating: boolean;
}

export function SeatMatrix({
  eventId,
  eventName,
  bookedSeats,
  contestedSeat,
  activeDevice,
  selectedSeat,
  onSelectSeat,
  onBookSeat,
  onSimulateCollision,
  isBooking,
  isSimulating,
}: SeatMatrixProps) {
  const [customIdempotencyKey, setCustomIdempotencyKey] = useState<string>("idem_c92b8f10");
  const [copiedIdem, setCopiedIdem] = useState(false);

  useEffect(() => {
    setCustomIdempotencyKey(`idem_${Math.random().toString(36).substring(2, 10)}`);
  }, []);

  const handleSeatClick = (seatId: string) => {
    if (bookedSeats.includes(seatId) || isBooking || isSimulating) return;
    onSelectSeat(seatId);
    setCustomIdempotencyKey(`idem_${Math.random().toString(36).substring(2, 10)}`);
  };

  const handleCopyIdem = () => {
    navigator.clipboard.writeText(customIdempotencyKey);
    setCopiedIdem(true);
    setTimeout(() => setCopiedIdem(false), 2000);
  };

  const handleConfirm = async () => {
    if (!selectedSeat || bookedSeats.includes(selectedSeat)) return;
    await onBookSeat(selectedSeat, activeDevice);
    try {
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.65 },
        colors: ["#0a0a0a", "#10b981", "#edebe7", "#616160"],
      });
    } catch {
      // ignore
    }
  };

  const currentTier = getTierForSeat(selectedSeat);

  return (
    <div className="card-light p-6 flex flex-col">
      {/* 70mm Laser Screen Banner */}
      <ScreenCurvature />

      {/* Tier Category Indicators */}
      <div className="mx-auto mb-5 flex flex-wrap items-center justify-center gap-4 text-xs text-[#616160]">
        <span className="flex items-center gap-1.5 font-semibold text-[#0a0a0a]">
          <Crown className="h-3.5 w-3.5 text-[#0a0a0a]" />
          <span>Rows E to F: Royal Box ($45)</span>
        </span>
        <span className="text-[#616160]">•</span>
        <span className="flex items-center gap-1.5 font-medium text-[#444444]">
          <Volume2 className="h-3.5 w-3.5 text-[#444444]" />
          <span>Rows C to D: Sweet Spot ($25)</span>
        </span>
        <span className="text-[#616160]">•</span>
        <span className="text-[#616160]">Rows A to B: Standard ($18.50)</span>
      </div>

      {/* 2D Interactive Seating Matrix with physics drag */}
      <div className="mx-auto w-full max-w-3xl overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none">
        <motion.div
          drag="x"
          dragConstraints={{ left: -80, right: 80 }}
          dragElastic={0.15}
          className="min-w-[620px] flex flex-col items-center gap-2.5"
        >
          {ROWS.map((row) => (
            <div key={row} className="flex items-center gap-3">
              {/* Row Letter (Left) */}
              <div className="flex w-6 flex-col items-end">
                <span className="text-xs font-bold text-[#616160]">
                  {row}
                </span>
              </div>

              {/* Left Aisle (Seats 1-5) */}
              <div className="flex gap-2">
                {COLS.slice(0, 5).map((col) => {
                  const seatId = `${row}${col}`;
                  const isBooked = bookedSeats.includes(seatId);
                  const isSelected = selectedSeat === seatId && !isBooked;
                  const isContested = contestedSeat === seatId;

                  return (
                    <SeatTile
                      key={seatId}
                      seatId={seatId}
                      row={row}
                      isBooked={isBooked}
                      isSelected={isSelected}
                      isContested={isContested}
                      onClick={() => handleSeatClick(seatId)}
                    />
                  );
                })}
              </div>

              {/* Center Aisle Spacer */}
              <div className="flex h-10 w-8 items-center justify-center" />

              {/* Right Aisle (Seats 6-10) */}
              <div className="flex gap-2">
                {COLS.slice(5, 10).map((col) => {
                  const seatId = `${row}${col}`;
                  const isBooked = bookedSeats.includes(seatId);
                  const isSelected = selectedSeat === seatId && !isBooked;
                  const isContested = contestedSeat === seatId;

                  return (
                    <SeatTile
                      key={seatId}
                      seatId={seatId}
                      row={row}
                      isBooked={isBooked}
                      isSelected={isSelected}
                      isContested={isContested}
                      onClick={() => handleSeatClick(seatId)}
                    />
                  );
                })}
              </div>

              {/* Row Letter (Right) */}
              <span className="w-6 text-left text-xs font-bold text-[#616160]">
                {row}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Seat State Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-[#616160]">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-[#f5f4f2] border border-[#e5e3df]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-[#0a0a0a]" />
          <span className="text-[#0a0a0a] font-semibold">Selected (Target)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-4 w-4 items-center justify-center rounded bg-[#edebe7] text-[#616160]">
            <Lock className="h-2.5 w-2.5" />
          </div>
          <span>Reserved (Redis Locked)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-[#e11d48]" />
          <span className="text-[#e11d48] font-semibold">Contested (409 Blocked)</span>
        </div>
      </div>

      {/* Seat Selection Drawer & Collision Action Bar */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="mt-6 rounded-2xl bg-[#f5f4f2] border border-[#e5e3df] p-4"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Selected Seat Metadata */}
          <div className="flex items-center gap-4">
            <motion.div
              key={selectedSeat}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-[#0a0a0a] text-white"
            >
              <span className="text-lg font-bold text-white">
                {selectedSeat || "--"}
              </span>
              <span className="text-xs text-[#d4d2ce]">
                Seat
              </span>
            </motion.div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#0a0a0a]">
                  {selectedSeat
                    ? `${currentTier.tier}, Seat ${selectedSeat}`
                    : "Select a seat on the matrix"}
                </span>
                <span className="rounded-full bg-[#0a0a0a] text-white px-2.5 py-0.5 text-xs font-semibold">
                  ${currentTier.price.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#616160] mt-1">
                <button
                  onClick={handleCopyIdem}
                  className="flex items-center gap-1 hover:text-[#0a0a0a] transition-colors"
                  title="Click to copy idempotency key"
                >
                  <Key className="h-3 w-3 text-[#0a0a0a]" />
                  <code className="text-[#616160] font-mono text-[11px]">{customIdempotencyKey}</code>
                  {copiedIdem ? (
                    <motion.span
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <Check className="h-3 w-3 text-emerald-600 ml-0.5" />
                    </motion.span>
                  ) : (
                    <Copy className="h-3 w-3 text-[#a1a1a1] hover:text-[#0a0a0a] ml-0.5" />
                  )}
                </button>
                <span>•</span>
                <span className="truncate max-w-[200px]">{eventName}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons with physical active press states */}
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              onClick={handleConfirm}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.95, y: 1 }}
              disabled={
                !selectedSeat ||
                bookedSeats.includes(selectedSeat) ||
                isBooking ||
                isSimulating
              }
              className="btn-black flex items-center gap-2 px-5 py-2.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Reserving...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-white" />
                  <span>Reserve Seat {selectedSeat || "Now"}</span>
                </>
              )}
            </motion.button>

            <motion.button
              onClick={() => onSimulateCollision(selectedSeat || "D5")}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.95, y: 1 }}
              disabled={
                !selectedSeat ||
                bookedSeats.includes(selectedSeat) ||
                isBooking ||
                isSimulating
              }
              className="btn-white flex items-center gap-2 px-4 py-2.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Swords className={`h-4 w-4 text-[#0a0a0a] ${isSimulating ? "animate-spin" : ""}`} />
              <span>{isSimulating ? "Racing..." : "Test 2-Client Collision"}</span>
            </motion.button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

interface SeatTileProps {
  seatId: string;
  row: string;
  isBooked: boolean;
  isSelected: boolean;
  isContested: boolean;
  onClick: () => void;
}

function SeatTile({
  seatId,
  isBooked,
  isSelected,
  isContested,
  onClick,
}: SeatTileProps) {
  let baseStyle = "bg-[#f5f4f2] text-[#0a0a0a] border border-[#e5e3df] hover:bg-[#edebe7] hover:border-[#d4d2ce]";

  if (isBooked) {
    baseStyle = "bg-[#edebe7] text-[#a1a1a1] border border-transparent cursor-not-allowed";
  } else if (isSelected) {
    baseStyle = "bg-[#0a0a0a] text-white font-bold border border-[#0a0a0a]";
  } else if (isContested) {
    baseStyle = "bg-[#e11d48] text-white font-bold border border-[#e11d48]";
  }

  return (
    <motion.button
      whileHover={!isBooked ? { scale: 1.14, y: -2 } : {}}
      whileTap={!isBooked ? { scale: 0.92, y: 1 } : {}}
      animate={
        isContested
          ? {
              x: [-6, 6, -5, 5, -2, 2, 0],
              transition: { duration: 0.4, repeat: 2 },
            }
          : isSelected
          ? {
              scale: [0.95, 1.05, 1],
              transition: { duration: 0.25, ease: "easeOut" },
            }
          : {}
      }
      onClick={onClick}
      disabled={isBooked}
      className={`relative flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer touch-manipulation before:absolute before:-inset-1 before:content-[''] ${baseStyle}`}
      title={
        isBooked
          ? `Seat ${seatId}: Reserved (Locked in Redis)`
          : `Seat ${seatId}: Available`
      }
    >
      {isBooked ? (
        <Lock className="h-3.5 w-3.5 opacity-40" />
      ) : (
        <span>{seatId}</span>
      )}
    </motion.button>
  );
}
