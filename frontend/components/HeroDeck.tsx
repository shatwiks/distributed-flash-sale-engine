"use client";

import React, { useState } from "react";
import {
  Ticket,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Database,
  Cpu,
  Clock,
  Sparkles,
} from "lucide-react";
import { EventData, prewarmEvent } from "@/lib/api";

interface HeroDeckProps {
  event: EventData | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function HeroDeck({ event, onRefresh, isRefreshing }: HeroDeckProps) {
  const [copied, setCopied] = useState(false);
  const [isPrewarming, setIsPrewarming] = useState(false);
  const [prewarmMsg, setPrewarmMsg] = useState<string | null>(null);

  if (!event) {
    return (
      <div className="card-craft flex flex-col items-center justify-center p-12 text-center">
        <Ticket className="h-12 w-12 text-[#8C6239] opacity-40 animate-pulse" />
        <h3 className="mt-4 text-lg font-serif font-semibold text-[#F5EFEB]">
          No Active Flash-Sale Event Loaded
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-[#D4B996]/70">
          Create an event to start simulating atomic concurrency checkouts.
        </p>
      </div>
    );
  }

  const available = event.available_tickets;
  const total = event.total_tickets;
  const percentage = Math.max(0, Math.min(100, Math.round((available / total) * 100)));
  const isSoldOut = available === 0;

  // Dynamic hue calculation: Brass/Gold -> Warm Amber -> Terracotta
  const getStockBarColor = () => {
    if (percentage > 50) {
      return "from-[#C5A059] to-[#D4B996]";
    }
    if (percentage > 20) {
      return "from-[#8C6239] to-[#C5A059]";
    }
    return "from-[#C8553D] to-[#E07A5F]";
  };

  const handleCopy = () => {
    if (!event) return;
    navigator.clipboard.writeText(event.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrewarm = async () => {
    if (!event) return;
    setIsPrewarming(true);
    setPrewarmMsg(null);
    try {
      await prewarmEvent(event.id);
      setPrewarmMsg("Redis In-Memory Cache Pre-warmed!");
      onRefresh();
      setTimeout(() => setPrewarmMsg(null), 3000);
    } catch {
      setPrewarmMsg("Pre-warm Failed");
      setTimeout(() => setPrewarmMsg(null), 3000);
    } finally {
      setIsPrewarming(false);
    }
  };

  return (
    <div className="card-craft relative overflow-hidden p-6 sm:p-8">
      {/* Subtle Grain Background Glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#C5A059]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[#8C6239]/10 blur-3xl" />

      {/* Header Row: Event Title, Status Badge & Action Controls */}
      <div className="relative flex flex-col justify-between gap-4 border-b border-[#3D2B1F] pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide ${
                isSoldOut
                  ? "border border-[#C8553D]/40 bg-[#3D1D18] text-[#E07A5F]"
                  : "border border-[#588157]/40 bg-[#1F2D1F] text-[#8FBC8F]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isSoldOut ? "bg-[#E07A5F]" : "animate-ping bg-[#8FBC8F]"
                }`}
              />
              {isSoldOut ? "SOLD OUT" : "ACTIVE SALE"}
            </span>

            <span className="rounded border border-[#3D2B1F] bg-[#17100C] px-2 py-0.5 font-mono text-xs text-[#D4B996]/80">
              O(1) LUA GATE
            </span>
          </div>

          <h2 className="mt-2 text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#F5EFEB]">
            {event.name}
          </h2>

          {/* Event UUID with Copy Button */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-[#D4B996]/60">Event UUID:</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded border border-[#3D2B1F] bg-[#17100C] px-2 py-0.5 font-mono text-xs text-[#D4B996] transition-colors hover:border-[#6B4D36] hover:text-[#F5EFEB]"
              title="Copy Event UUID"
            >
              <span className="max-w-[180px] truncate sm:max-w-none">
                {event.id}
              </span>
              {copied ? (
                <Check className="h-3 w-3 text-[#8FBC8F]" />
              ) : (
                <Copy className="h-3 w-3 text-[#8C6239]" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Actions: Pre-warm & Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrewarm}
            disabled={isPrewarming}
            className="flex items-center gap-1.5 rounded-lg border border-[#C5A059]/40 bg-[#221712] px-3 py-2 text-xs font-medium text-[#C5A059] shadow-sm transition hover:border-[#C5A059] hover:bg-[#2A1D17] disabled:opacity-50"
          >
            <Zap className={`h-3.5 w-3.5 ${isPrewarming ? "animate-spin text-[#C5A059]" : ""}`} />
            <span>{isPrewarming ? "Pre-warming..." : "Pre-warm Cache"}</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-[#3D2B1F] bg-[#1E1611] px-3 py-2 text-xs font-medium text-[#D4B996] transition hover:border-[#6B4D36] hover:text-[#F5EFEB]"
            title="Refresh Stock"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#C5A059]" : ""}`} />
          </button>
        </div>
      </div>

      {prewarmMsg && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#C5A059]/30 bg-[#2A1D17] p-2.5 text-xs text-[#D4B996]">
          <Sparkles className="h-4 w-4 text-[#C5A059]" />
          <span>{prewarmMsg}</span>
        </div>
      )}

      {/* Main Inventory Meter Deck */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
        {/* Large Counter Readout */}
        <div className="lg:col-span-7">
          <div className="flex items-baseline gap-3">
            <span
              className={`font-mono text-5xl sm:text-6xl font-extrabold tracking-tight ${
                isSoldOut ? "text-[#E07A5F]" : "text-[#F5EFEB]"
              }`}
            >
              {available.toLocaleString()}
            </span>
            <span className="font-mono text-xl sm:text-2xl text-[#D4B996]/60">
              / {total.toLocaleString()} Tickets
            </span>
          </div>

          <p className="mt-1 text-xs text-[#D4B996]/80">
            Real-time atomic reservation capacity synchronized between Redis memory and PostgreSQL.
          </p>

          {/* Visual Stock Bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs font-mono text-[#D4B996]">
              <span>Inventory Remaining</span>
              <span className="font-bold text-[#F5EFEB]">{percentage}%</span>
            </div>
            <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full border border-[#4E3727] bg-[#17100C] p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getStockBarColor()} transition-all duration-500 ease-out shadow-sm`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dual-State Latency & Architecture Badges */}
        <div className="lg:col-span-5 flex flex-col gap-3 rounded-xl border border-[#3D2B1F] bg-[#17100C]/70 p-4">
          <div className="text-xs font-mono font-semibold tracking-wider text-[#D4B996]/70 uppercase">
            Two-Layer Latency Profile
          </div>

          {/* Layer 1: In-Memory Redis Gate */}
          <div className="flex items-center justify-between rounded-lg border border-[#3D2B1F]/60 bg-[#1E1611] p-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#C5A059]/30 bg-[#2A1D17]">
                <Cpu className="h-4 w-4 text-[#C5A059]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#F5EFEB]">
                  Fast-Path In-Memory Gate
                </div>
                <div className="text-[11px] text-[#D4B996]/60">
                  Redis 7 Single-Threaded Lua
                </div>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-sm font-bold text-[#8FBC8F]">&lt; 1.8 ms</span>
              <div className="text-[10px] text-[#D4B996]/50">O(1) Memory</div>
            </div>
          </div>

          {/* Layer 2: Scoped DB Persistence */}
          <div className="flex items-center justify-between rounded-lg border border-[#3D2B1F]/60 bg-[#1E1611] p-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#8C6239]/30 bg-[#2A1D17]">
                <Database className="h-4 w-4 text-[#C5A059]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#F5EFEB]">
                  Scoped PostgreSQL Persistence
                </div>
                <div className="text-[11px] text-[#D4B996]/60">
                  Only Confirmed Orders
                </div>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-sm font-bold text-[#D4B996]">ACID Pool</span>
              <div className="text-[10px] text-[#8FBC8F]">0% Contention</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
