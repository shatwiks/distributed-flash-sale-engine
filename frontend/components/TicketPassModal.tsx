"use client";

import React from "react";
import { X, Sparkles, QrCode, Ticket, CheckCircle2, Zap } from "lucide-react";
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
    ? "Royal Box / VIP Suite"
    : isAcoustic
    ? "Acoustic Sweet Spot"
    : "Standard Orchestra Stalls";
  const price = isVip ? "$45.00" : isAcoustic ? "$25.00" : "$18.50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-[#4E3727] bg-[#1C1512] text-[#D4B996] hover:border-[#C5A059] hover:text-[#F7F2EA] transition-all shadow-lg"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Skeuomorphic Artisan Concert Pass Card */}
        <div className="relative flex flex-col md:flex-row overflow-hidden rounded-2xl border-2 border-[#8C6239]/60 bg-gradient-to-br from-[#2A1E18] via-[#1C1512] to-[#140E0B] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)]">
          {/* Embossed Brass Grain Border Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8C6239] via-[#C5A059] to-[#8C6239]" />

          {/* Main Body (Left / Top on mobile) */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-full border border-[#C5A059]/40 bg-[#3D2B1F]/60 px-3 py-1 text-[10px] font-bold tracking-widest text-[#C5A059] uppercase">
                  <Sparkles className="h-3 w-3" />
                  <span>Artisan Hall Admission</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-[#8FBC8F]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Secured in {result.gateLatencyMs || 1.2}ms</span>
                </div>
              </div>

              {/* Event Name & Hall */}
              <h2 className="mt-4 font-serif text-2xl font-bold tracking-tight text-[#F7F2EA]">
                {eventName}
              </h2>
              <p className="mt-1 text-xs text-[#D4B996]/80 tracking-wide font-serif">
                Vienna Konzerthaus • Grand Acoustic Auditorium
              </p>
            </div>

            {/* Middle Specs Grid */}
            <div className="my-6 grid grid-cols-2 gap-4 border-y border-[#3D2B1F] py-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#D4B996]/50 uppercase tracking-wider">
                  Tier / Section
                </span>
                <p className="font-semibold text-[#F7F2EA] truncate">{tierName}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#D4B996]/50 uppercase tracking-wider">
                  Tier Price
                </span>
                <p className="font-bold text-[#C5A059]">{price}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#D4B996]/50 uppercase tracking-wider">
                  User Holder
                </span>
                <p className="font-semibold text-[#F7F2EA] truncate">
                  {result.user_id || "user_alpha"}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-[#D4B996]/50 uppercase tracking-wider">
                  Idempotency UUID
                </span>
                <p className="font-mono text-[11px] text-[#D4B996]/80 truncate">
                  {result.idempotency_key?.slice(0, 16) || "idem_verified"}...
                </p>
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#D4B996]/40">
                AUTH: {result.id || "tx_verified_01"}
              </span>
              <button
                onClick={onClose}
                className="btn-brass rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 transition-transform"
              >
                Close &amp; Reserve Another
              </button>
            </div>
          </div>

          {/* Perforated Divider Line */}
          <div className="relative flex md:flex-col items-center justify-between border-t md:border-t-0 md:border-l-2 border-dashed border-[#8C6239]/40 bg-[#17100C]/50 px-4 md:px-0 py-2 md:py-4">
            {/* Top Cutout Circle */}
            <div className="hidden md:block absolute -top-4 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full bg-[#120D0A] border border-[#4E3727]" />
            {/* Bottom Cutout Circle */}
            <div className="hidden md:block absolute -bottom-4 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full bg-[#120D0A] border border-[#4E3727]" />
          </div>

          {/* Perforated Stub (Right side) */}
          <div className="flex md:w-44 flex-col items-center justify-between border-t md:border-t-0 border-[#3D2B1F] bg-[#1E1611] p-6 text-center">
            <span className="text-[10px] font-mono tracking-widest text-[#D4B996]/50 uppercase">
              Seat Stub
            </span>

            {/* Giant Seat Number Badge */}
            <div className="my-2 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 border-[#C5A059] bg-[#2A1E18] text-[#F7F2EA] shadow-brassGlow">
              <span className="text-[9px] uppercase tracking-widest text-[#D4B996]/70">Seat</span>
              <span className="font-serif text-3xl font-extrabold text-[#C5A059]">
                {seatNumber}
              </span>
              <span className="text-[8px] font-mono text-[#8FBC8F]">ROW {row}</span>
            </div>

            {/* Simulated QR Code Graphic */}
            <div className="rounded-lg border border-[#4E3727] bg-[#140E0B] p-2 text-[#D4B996]">
              <QrCode className="h-12 w-12 text-[#C5A059]" />
            </div>

            <span className="mt-2 text-[9px] font-mono text-[#D4B996]/40 uppercase tracking-wider">
              Scan at Stage Gate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
