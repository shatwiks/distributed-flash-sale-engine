"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Flame,
  Ticket,
  Key,
  Swords,
  Loader2,
  Volume2,
  Crown,
  Sparkles,
} from "lucide-react";
import { ScreenCurvature } from "./ScreenCurvature";
import { DeviceType } from "./TopWidgetsBar";

const ROWS = ["A", "B", "C", "D", "E", "F"];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function getTierForSeat(seatId?: string | null) {
  const row = seatId && seatId.length > 0 ? seatId[0] : "A";
  if (row === "E" || row === "F") {
    return {
      tier: "Royal Box / VIP",
      price: 45.0,
      badge: "VIP $45.00",
      accent: "border-[#C5A059] text-[#C5A059]",
    };
  }
  if (row === "C" || row === "D") {
    return {
      tier: "Acoustic Sweet Spot",
      price: 25.0,
      badge: "Sweet Spot $25.00",
      accent: "border-[#8C6239] text-[#D4B996]",
    };
  }
  return {
    tier: "Standard Stalls",
    price: 18.5,
    badge: "Stalls $18.50",
    accent: "border-[#4E3727] text-[#D4B996]/80",
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

  useEffect(() => {
    setCustomIdempotencyKey(`idem_${Math.random().toString(36).substring(2, 10)}`);
  }, []);

  const handleSeatClick = (seatId: string) => {
    if (bookedSeats.includes(seatId) || isBooking || isSimulating) return;
    onSelectSeat(seatId);
    setCustomIdempotencyKey(`idem_${Math.random().toString(36).substring(2, 10)}`);
  };

  const handleConfirm = () => {
    if (!selectedSeat || bookedSeats.includes(selectedSeat)) return;
    onBookSeat(selectedSeat, activeDevice);
  };

  const currentTier = getTierForSeat(selectedSeat);

  return (
    <div className="card-craft flex flex-col border-[#4E3727] bg-[#1A120E] p-6 shadow-card">
      {/* Theater Stage Curvature Banner */}
      <ScreenCurvature />

      {/* Tier Category Indicator Bar */}
      <div className="mx-auto mb-4 flex items-center gap-4 text-[11px] font-mono text-[#D4B996]/70">
        <span className="flex items-center gap-1.5">
          <Crown className="h-3.5 w-3.5 text-[#C5A059]" />
          <span>Rows E–F: Royal Box ($45)</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          <Volume2 className="h-3.5 w-3.5 text-[#8C6239]" />
          <span>Rows C–D: Sweet Spot ($25)</span>
        </span>
        <span>•</span>
        <span>Rows A–B: Standard ($18.50)</span>
      </div>

      {/* 2D Interactive Seating Grid Container */}
      <div className="mx-auto w-full max-w-3xl overflow-x-auto pb-4">
        <div className="min-w-[620px] flex flex-col items-center gap-3">
          {ROWS.map((row) => (
            <div key={row} className="flex items-center gap-3">
              {/* Row Letter Indicator (Left) */}
              <div className="flex w-6 flex-col items-end">
                <span className="font-mono text-xs font-bold text-[#D4B996]/60">
                  {row}
                </span>
                {row === "E" && (
                  <Crown className="h-2.5 w-2.5 text-[#C5A059] opacity-70" />
                )}
                {row === "C" && (
                  <Volume2 className="h-2.5 w-2.5 text-[#8C6239] opacity-70" />
                )}
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

              {/* Center Aisle Spacer with Wood Joinery Accent */}
              <div className="flex h-10 w-8 items-center justify-center">
                <div className="h-6 w-[1px] bg-[#4E3727]/60" />
              </div>

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

              {/* Row Letter Indicator (Right) */}
              <span className="w-6 text-left font-mono text-xs font-bold text-[#D4B996]/60">
                {row}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Seat State Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-[#3D2B1F] pt-4 text-xs text-[#D4B996]/75">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border border-[#4E3727] bg-[#2A1E18]" />
          <span>Available (Walnut)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-[#C5A059] bg-[#3D2B1F] shadow-brassGlow" />
          <span className="text-[#F7F2EA] font-medium">Selected (Bronze Ring)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-4 w-4 items-center justify-center rounded border border-[#2B1B14] bg-[#140E0B] text-[#D4B996]/40">
            <Lock className="h-2.5 w-2.5" />
          </div>
          <span>Occupied (Locked Cedar)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border border-red-400 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.7)] animate-pulse" />
          <span className="text-red-400 font-medium">Contested (Redis Gate Rejection)</span>
        </div>
      </div>

      {/* Seat Selection Drawer & Collision Action Bar */}
      <div className="mt-6 rounded-xl border border-[#4E3727] bg-[#140E0B] p-4 shadow-inner">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Selected Seat Metadata */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-[#C5A059]/40 bg-[#2A1E18] text-[#F7F2EA] shadow-sm">
              <span className="font-serif text-lg font-bold text-[#C5A059]">
                {selectedSeat || "--"}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#D4B996]/60">
                Seat
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-semibold text-[#F7F2EA]">
                  {selectedSeat
                    ? `${currentTier.tier} • Seat ${selectedSeat}`
                    : "No seat selected"}
                </span>
                <span className="rounded bg-[#8C6239]/20 px-2 py-0.5 font-mono text-[11px] font-medium text-[#C5A059]">
                  ${currentTier.price.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#D4B996]/60">
                <span
                  suppressHydrationWarning
                  className="flex items-center gap-1 font-mono text-[11px]"
                >
                  <Key className="h-3 w-3 text-[#C5A059]" />
                  {customIdempotencyKey}
                </span>
                <span>•</span>
                <span>{eventName}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Confirm Reservation & Simulate Collision */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Built-in Concurrency Demonstration Button */}
            <button
              onClick={() => onSimulateCollision(selectedSeat)}
              disabled={isBooking || isSimulating || bookedSeats.includes(selectedSeat)}
              className="group relative flex items-center gap-2 rounded-lg border border-red-500/60 bg-gradient-to-b from-red-950/60 to-[#2A1410] px-4 py-2 text-xs font-semibold text-red-200 shadow-sm transition-all hover:border-red-400 hover:from-red-900/80 hover:text-white active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              title="Deliberately fire parallel async requests from Device A & Device B for this seat"
            >
              <Swords className={`h-4 w-4 text-red-400 ${isSimulating ? "animate-spin" : "group-hover:scale-110"}`} />
              <div className="flex flex-col items-start leading-tight">
                <span>{isSimulating ? "Simulating Race..." : "Simulate Collision"}</span>
                <span className="font-mono text-[10px] text-red-400/80">Device A vs B Race</span>
              </div>
            </button>

            {/* Single Reservation Button */}
            <button
              onClick={handleConfirm}
              disabled={isBooking || isSimulating || bookedSeats.includes(selectedSeat)}
              className="btn-brass flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#120D0A]" />
                  <span>Locking Gate...</span>
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4 text-[#120D0A]" />
                  <span>
                    Book {selectedSeat} as {activeDevice === "device_a" ? "Device A" : "Device B"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
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
  row,
  isBooked,
  isSelected,
  isContested,
  onClick,
}: SeatTileProps) {
  const isVip = row === "E" || row === "F";
  const isAcoustic = row === "C" || row === "D";

  if (isContested) {
    return (
      <button
        disabled
        className="relative flex h-10 w-11 flex-col items-center justify-center rounded-md border border-red-400 bg-red-600 text-white font-mono text-[11px] font-bold shadow-lg animate-contest"
        title={`Seat ${seatId} - Lock Contention Collision Detected!`}
      >
        <Flame className="h-3.5 w-3.5 animate-bounce" />
        <span className="text-[9px]">{seatId}</span>
      </button>
    );
  }

  if (isBooked) {
    return (
      <button
        disabled
        className="relative flex h-10 w-11 flex-col items-center justify-center rounded-md border border-[#2A1E18] bg-[#140E0B] text-[#D4B996]/30 cursor-not-allowed opacity-75 shadow-inner"
        title={`Seat ${seatId} - Confirmed & Occupied`}
      >
        <Lock className="h-3 w-3 mb-0.5 text-[#8C6239]/60" />
        <span className="font-mono text-[10px]">{seatId}</span>
      </button>
    );
  }

  if (isSelected) {
    return (
      <button
        onClick={onClick}
        className="relative flex h-10 w-11 flex-col items-center justify-center rounded-md border-2 border-[#C5A059] bg-[#3D2B1F] text-[#F7F2EA] font-mono text-[11px] font-bold shadow-brassGlow scale-105 transition-all duration-150"
        title={`Seat ${seatId} - Selected`}
      >
        <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#C5A059]" />
        <span>{seatId}</span>
      </button>
    );
  }

  // Available Seat with Tier Specific Styling
  return (
    <button
      onClick={onClick}
      className={`group relative flex h-10 w-11 flex-col items-center justify-center rounded-md font-mono text-[11px] font-medium shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 ${
        isVip
          ? "border border-[#8C6239] bg-[#2A1E18] text-[#C5A059] hover:border-[#C5A059] hover:bg-[#3D2B1F]"
          : isAcoustic
          ? "border border-[#4E3727] bg-[#221712] text-[#D4B996] hover:border-[#C5A059] hover:bg-[#2A1E18]"
          : "border border-[#3D2B1F] bg-[#1C1512] text-[#D4B996]/80 hover:border-[#6B4D36] hover:bg-[#261A14]"
      }`}
      title={`Seat ${seatId} - ${
        isVip ? "Royal Box ($45)" : isAcoustic ? "Sweet Spot ($25)" : "Standard ($18.50)"
      }`}
    >
      <span>{seatId}</span>
      {isVip && <span className="text-[7px] text-[#C5A059]/70 -mt-1 font-sans">VIP</span>}
    </button>
  );
}
