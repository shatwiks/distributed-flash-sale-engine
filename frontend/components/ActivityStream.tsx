"use client";

import React from "react";
import { Clock, ShieldCheck, AlertCircle, Trash2, Layers, Flame } from "lucide-react";
import { CheckoutResult } from "@/lib/api";

export interface StreamItem extends CheckoutResult {
  timestamp: string;
}

interface ActivityStreamProps {
  items: StreamItem[];
  onClear: () => void;
}

export function ActivityStream({ items, onClear }: ActivityStreamProps) {
  return (
    <div className="card-craft p-5 sm:p-6">
      {/* Stream Header */}
      <div className="flex items-center justify-between border-b border-[#3D2B1F] pb-3">
        <div>
          <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#F5EFEB]">
            <Layers className="h-4 w-4 text-[#C5A059]" />
            Live Distributed Audit Stream
          </h3>
          <p className="text-xs text-[#D4B996]/70">
            Real-time chronological log of seat acquisition attempts and Redis Lua gate decisions.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-lg border border-[#3D2B1F] bg-[#1E1611] px-2.5 py-1 text-xs text-[#D4B996]/70 transition hover:border-[#6B4D36] hover:text-[#F5EFEB]"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Stream Table / Feed */}
      <div className="mt-3 overflow-x-auto">
        {items.length === 0 ? (
          <div className="timber-inset flex flex-col items-center justify-center p-6 text-center">
            <Clock className="h-6 w-6 text-[#8C6239] opacity-40" />
            <p className="mt-2 text-xs text-[#D4B996]/60">
              No transactions recorded yet. Click a seat and confirm, or trigger a collision test.
            </p>
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#3D2B1F] text-[#D4B996]/60 text-[11px]">
                <th className="py-2 px-2.5">Time</th>
                <th className="py-2 px-2.5">User/Device</th>
                <th className="py-2 px-2.5">Seat</th>
                <th className="py-2 px-2.5">Gate Decision</th>
                <th className="py-2 px-2.5">Latency</th>
                <th className="py-2 px-2.5">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A1D17]">
              {items.slice(0, 10).map((item, idx) => {
                const isConfirmed = item.statusCode === 201 || item.statusCode === 200;
                const isContested = item.contested || item.statusCode === 409;
                const seatNum = item.seat_number || item.seatNumber || "--";

                return (
                  <tr
                    key={idx}
                    className="transition-colors hover:bg-[#2A1D17]/50"
                  >
                    <td className="py-2 px-2.5 text-[#D4B996]/80 text-[11px]">{item.timestamp}</td>
                    <td className="py-2 px-2.5 text-[#F5EFEB] font-medium text-[11px]">
                      {item.user_id || "buyer_anon"}
                    </td>
                    <td className="py-2 px-2.5">
                      <span className="rounded bg-[#3D2B1F] px-1.5 py-0.5 text-[11px] font-bold text-[#C5A059] border border-[#4E3727]">
                        {seatNum}
                      </span>
                    </td>
                    <td className="py-2 px-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isConfirmed
                            ? "border border-[#588157]/40 bg-[#1F2D1F] text-[#8FBC8F]"
                            : isContested
                            ? "border border-red-500/50 bg-red-950/80 text-red-400"
                            : "border border-[#E07A5F]/40 bg-[#2D1B17] text-[#E07A5F]"
                        }`}
                      >
                        {isConfirmed ? (
                          <ShieldCheck className="h-2.5 w-2.5" />
                        ) : isContested ? (
                          <Flame className="h-2.5 w-2.5 animate-pulse" />
                        ) : (
                          <AlertCircle className="h-2.5 w-2.5" />
                        )}
                        {item.statusCode === 201
                          ? "Confirmed 201"
                          : item.statusCode === 200
                          ? "Idempotent 200"
                          : item.contested
                          ? "Contention 409"
                          : "Sold Out 409"}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-[#8FBC8F] text-[11px]">
                      {item.gateLatencyMs ? `${item.gateLatencyMs} ms` : `${item.durationMs} ms`}
                    </td>
                    <td className="py-2 px-2.5 text-[#D4B996]/70 truncate max-w-[120px] text-[10px]">
                      {item.id || item.idempotency_key || "short-circuited"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
