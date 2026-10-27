"use client";

import React, { useState } from "react";
import {
  Clock,
  Trash2,
  Layers,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { CheckoutResult } from "@/lib/api";

export interface StreamItem extends CheckoutResult {
  timestamp: string;
}

interface ActivityStreamProps {
  items: StreamItem[];
  onClear: () => void;
}

export function ActivityStream({ items, onClear }: ActivityStreamProps) {
  const [filter, setFilter] = useState<"all" | "confirmed" | "blocked">("all");

  const filteredItems = items.filter((item) => {
    if (filter === "confirmed") return item.statusCode === 201 || item.statusCode === 200;
    if (filter === "blocked") return item.statusCode === 409 || item.contested;
    return true;
  });

  return (
    <div className="card-light p-5 flex flex-col">
      {/* Stream Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3.5 gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#0a0a0a]">
            <Layers className="h-4 w-4 text-[#0a0a0a]" />
            <span>Live Concurrency Audit Stream</span>
          </h3>
          <p className="text-xs text-[#616160] mt-0.5">
            Real-time chronological log of seat acquisition attempts and Redis Lua gate decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filter Buttons */}
          <div className="flex items-center rounded-full bg-[#f5f4f2] border border-[#e5e3df] p-1 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-full transition-colors ${
                filter === "all" ? "bg-[#0a0a0a] text-white font-semibold" : "text-[#616160] hover:text-[#0a0a0a]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("confirmed")}
              className={`px-3 py-1 rounded-full transition-colors ${
                filter === "confirmed" ? "bg-[#0a0a0a] text-white font-semibold" : "text-[#616160] hover:text-[#0a0a0a]"
              }`}
            >
              201
            </button>
            <button
              onClick={() => setFilter("blocked")}
              className={`px-3 py-1 rounded-full transition-colors ${
                filter === "blocked" ? "bg-[#0a0a0a] text-white font-semibold" : "text-[#616160] hover:text-[#0a0a0a]"
              }`}
            >
              409
            </button>
          </div>

          {items.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 rounded-full bg-[#f5f4f2] hover:bg-[#edebe7] border border-[#e5e3df] px-3 py-1 text-xs text-[#0a0a0a] font-medium transition-colors"
              title="Clear activity log"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Stream Feed */}
      <div className="mt-3 overflow-x-auto max-h-[360px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="bg-[#f5f4f2] border border-[#e5e3df] rounded-2xl flex flex-col items-center justify-center p-8 text-center">
            <Clock className="h-7 w-7 text-[#a1a1a1] mb-2" />
            <p className="text-xs text-[#616160]">
              No transactions recorded yet. Click a seat and confirm, or test a 2-client collision.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#616160] text-xs font-semibold bg-[#f5f4f2] rounded-lg">
                <th className="py-2.5 px-3 rounded-l-lg">Time</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Seat</th>
                <th className="py-2.5 px-3">Gate Decision</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3 rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => {
                const isSuccess = item.statusCode === 201 || item.statusCode === 200;
                const seat = item.seat_number || item.seatNumber || "--";
                const gateMs = item.gateLatencyMs || 1.2;

                return (
                  <tr
                    key={item.id || `${item.timestamp}_${idx}`}
                    className="hover:bg-[#f5f4f2] transition-colors rounded-lg"
                  >
                    <td className="py-2.5 px-2.5 text-[#616160] text-xs">
                      <code className="font-mono text-xs text-[#616160]">{item.timestamp}</code>
                    </td>
                    <td className="py-2.5 px-2.5 text-[#0a0a0a] font-medium truncate max-w-[100px]">
                      {item.user_id?.includes("alpha")
                        ? "Device A"
                        : item.user_id?.includes("beta")
                        ? "Device B"
                        : "Primary User"}
                    </td>
                    <td className="py-2.5 px-2.5 font-bold text-[#0a0a0a]">
                      {seat}
                    </td>
                    <td className="py-2.5 px-2.5">
                      {isSuccess ? (
                        <span className="flex items-center gap-1.5 font-medium text-[#065f46]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Acquired (atomic)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 font-medium text-[#9f1239]">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Blocked (conflict)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 text-[#616160]">
                      <code className="font-mono text-xs text-[#616160]">{gateMs}ms</code>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isSuccess
                            ? "bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]"
                            : "bg-[#fff1f2] border border-[#fecdd3] text-[#9f1239]"
                        }`}
                      >
                        {isSuccess ? "201 Created" : "409 Conflict"}
                      </span>
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
