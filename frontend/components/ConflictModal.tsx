"use client";

import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  Zap,
  Lock,
  Ticket,
  QrCode,
  Sparkles,
  ArrowRight,
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
  eventName,
}: ConflictModalProps) {
  if (!modalState.isOpen || !modalState.result) return null;

  const { result, type, device } = modalState;
  const isConflict = type === "conflict" || result.contested || result.statusCode === 409;
  const seatNumber = result.seat_number || result.seatNumber || "D5";
  const gateLatency = result.gateLatencyMs || 1.8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#4E3727] bg-[#1E1611] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-[#D4B996]/60 hover:bg-[#2A1D17] hover:text-[#F5EFEB] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {isConflict ? (
          /* ================================================================= */
          /* 409 CONFLICT / LOCK CONTENTION VIEW                               */
          /* ================================================================= */
          <div className="flex flex-col gap-5">
            {/* Header Alert Banner */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/40 bg-red-950/60 text-red-400 shadow-md">
                <ShieldAlert className="h-6 w-6 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">
                    HTTP 409 Conflict
                  </span>
                  <span className="rounded bg-red-950/80 px-2 py-0.5 font-mono text-[10px] text-red-300 border border-red-800/40">
                    Race Detected
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#F5EFEB]">
                  Lock Contention: Seat {seatNumber} Acquired
                </h3>
              </div>
            </div>

            {/* Core Contention Telemetry Box */}
            <div className="timber-inset p-4 text-xs space-y-3">
              <p className="text-sm font-medium text-red-200 leading-relaxed">
                {result.message ||
                  `Lock Contention: Seat ${seatNumber} was acquired by another transaction (Redis Gate rejected in ${gateLatency}ms).`}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#3D2B1F]">
                <div>
                  <span className="text-[#D4B996]/60 text-[11px]">Attempted By:</span>
                  <p className="font-mono font-medium text-[#F5EFEB]">
                    {device || result.user_id || "Device B (Client)"}
                  </p>
                </div>
                <div>
                  <span className="text-[#D4B996]/60 text-[11px]">Redis Rejection Latency:</span>
                  <p className="font-mono font-semibold text-[#8FBC8F] flex items-center gap-1">
                    <Zap className="h-3 w-3 text-[#C5A059]" />
                    {gateLatency} ms
                  </p>
                </div>
                <div>
                  <span className="text-[#D4B996]/60 text-[11px]">Distributed Guard:</span>
                  <p className="font-mono text-[#D4B996]">Redis Atomic Lua Gate</p>
                </div>
                <div>
                  <span className="text-[#D4B996]/60 text-[11px]">Database Integrity:</span>
                  <p className="font-mono text-[#8FBC8F]">0.00% Overbooking</p>
                </div>
              </div>
            </div>

            {/* Explanation Note */}
            <p className="text-xs text-[#D4B996]/70 leading-normal">
              In-memory atomic serialization via Redis Lua scripts prevented a TOCTOU
              (Time-Of-Check to Time-Of-Use) race condition without placing locks on PostgreSQL.
            </p>

            {/* Dismiss Button */}
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-lg border border-red-700/60 bg-red-950/40 py-2.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-900/60"
            >
              Acknowledge Collision
            </button>
          </div>
        ) : (
          /* ================================================================= */
          /* 201 CREATED / CONFIRMED TICKET RECEIPT MODAL                     */
          /* ================================================================= */
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#C5A059]/50 bg-[#2A1D17] text-[#C5A059] shadow-brassGlow">
                <Ticket className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#8FBC8F] uppercase tracking-widest">
                    HTTP 201 Created
                  </span>
                  <span className="rounded bg-[#8FBC8F]/20 px-2 py-0.5 font-mono text-[10px] text-[#8FBC8F] border border-[#8FBC8F]/30">
                    Confirmed
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#F5EFEB]">
                  Seat Reservation Secured
                </h3>
              </div>
            </div>

            {/* Tactile Ticket Mockup */}
            <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-[#8C6239]/60 bg-gradient-to-b from-[#2A1D17] to-[#1E1611] p-5 shadow-lg">
              {/* Top Notch Cutouts */}
              <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#120D0A] border border-[#4E3727]" />
              <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#120D0A] border border-[#4E3727]" />

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] tracking-widest text-[#D4B996]/60 uppercase">
                    Official Admission
                  </span>
                  <h4 className="font-serif text-base font-bold text-[#F5EFEB]">
                    {eventName}
                  </h4>
                  <p className="text-xs text-[#D4B996]/70">70mm Acoustic Stage • Row {seatNumber[0]}</p>
                </div>

                <div className="flex flex-col items-center rounded-lg border border-[#C5A059] bg-[#3D2B1F] px-3 py-1.5 shadow-sm">
                  <span className="text-[9px] uppercase tracking-wider text-[#D4B996]/70">Seat</span>
                  <span className="font-serif text-xl font-extrabold text-[#C5A059]">
                    {seatNumber}
                  </span>
                </div>
              </div>

              <div className="my-4 border-t border-dashed border-[#4E3727]" />

              {/* Ticket Details */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-[#D4B996]/50 text-[10px]">RESERVATION ID</span>
                  <p className="truncate text-[#F5EFEB]">
                    {result.id || "rec_8a92f01c"}
                  </p>
                </div>
                <div>
                  <span className="text-[#D4B996]/50 text-[10px]">RESERVED BY</span>
                  <p className="truncate text-[#F5EFEB]">
                    {device || result.user_id || "Device A (Client)"}
                  </p>
                </div>
                <div>
                  <span className="text-[#D4B996]/50 text-[10px]">REDIS GATE LATENCY</span>
                  <p className="text-[#8FBC8F] font-semibold">{gateLatency} ms</p>
                </div>
                <div>
                  <span className="text-[#D4B996]/50 text-[10px]">TOTAL PAID</span>
                  <p className="text-[#C5A059] font-bold">$18.50 VIP</p>
                </div>
              </div>

              {/* Mock Barcode */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#3D2B1F]">
                <div className="flex gap-1 h-7 items-center opacity-70">
                  <div className="w-1 h-full bg-[#D4B996]" />
                  <div className="w-0.5 h-full bg-[#D4B996]" />
                  <div className="w-1.5 h-full bg-[#D4B996]" />
                  <div className="w-0.5 h-full bg-[#D4B996]" />
                  <div className="w-2 h-full bg-[#D4B996]" />
                  <div className="w-0.5 h-full bg-[#D4B996]" />
                  <div className="w-1 h-full bg-[#D4B996]" />
                  <div className="w-2 h-full bg-[#D4B996]" />
                  <div className="w-0.5 h-full bg-[#D4B996]" />
                  <div className="w-1.5 h-full bg-[#D4B996]" />
                  <div className="w-1 h-full bg-[#D4B996]" />
                </div>
                <span className="text-[10px] font-mono text-[#D4B996]/60">
                  {result.idempotency_key?.slice(0, 16) || "IDEM-VERIFIED"}
                </span>
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={onClose}
              className="btn-brass w-full rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              View in Seat Matrix
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
