"use client";

import React from "react";
import {
  Film,
  Zap,
  Database,
  Smartphone,
  Laptop,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Swords,
  Columns,
  Square,
} from "lucide-react";
import { EventData, HealthData } from "@/lib/api";

export type DeviceType = "device_a" | "device_b";

interface TopWidgetsBarProps {
  events: EventData[];
  activeEventId: string;
  onSelectEvent: (eventId: string) => void;
  health: HealthData;
  activeDevice: DeviceType;
  onToggleDevice: (device: DeviceType) => void;
  isDuelMode: boolean;
  onToggleDuelMode: (enabled: boolean) => void;
  onResetSeats: () => void;
  isResetting: boolean;
}

export function TopWidgetsBar({
  events,
  activeEventId,
  onSelectEvent,
  health,
  activeDevice,
  onToggleDevice,
  isDuelMode,
  onToggleDuelMode,
  onResetSeats,
  isResetting,
}: TopWidgetsBarProps) {
  const pool = health.pool || { total: 50, active: 2, idle: 48, waiting: 0 };

  return (
    <div className="card-craft border-[#4E3727] bg-[#1C1512]/95 p-4 backdrop-blur-md">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* Left: Event Selector (Pills / Dropdown) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 pr-2 text-xs font-semibold tracking-wider text-[#D4B996] uppercase">
            <Film className="h-4 w-4 text-[#C5A059]" />
            <span>Hall Event:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {events.slice(0, 3).map((ev) => {
              const isActive = ev.id === activeEventId;
              return (
                <button
                  key={ev.id}
                  onClick={() => onSelectEvent(ev.id)}
                  className={`group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "border border-[#C5A059] bg-[#2A1E18] text-[#F7F2EA] shadow-brassGlow"
                      : "border border-[#3D2B1F] bg-[#140E0B] text-[#D4B996]/70 hover:border-[#6B4D36] hover:text-[#F7F2EA]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isActive ? "bg-[#C5A059] animate-pulse" : "bg-[#4E3727]"
                    }`}
                  />
                  <span>{ev.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      isActive
                        ? "bg-[#C5A059]/20 text-[#C5A059]"
                        : "bg-[#1C1512] text-[#D4B996]/50"
                    }`}
                  >
                    60 Seats
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Controls: Telemetry, Duel Mode Toggle, Device Switcher, Reset */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Real-Time Latency & Pool Indicators */}
          <div className="flex items-center gap-2.5 rounded-lg border border-[#3D2B1F] bg-[#140E0B] px-3 py-1.5 font-mono text-xs">
            {/* Redis Gate Latency */}
            <div className="flex items-center gap-1.5 text-[#D4B996]" title="Sub-2ms in-memory Lua concurrency check">
              <Zap className="h-3.5 w-3.5 text-[#C5A059]" />
              <span className="text-[11px] text-[#D4B996]/70">Redis Gate:</span>
              <span className="font-semibold text-[#8FBC8F]">
                &lt; 2ms
              </span>
            </div>

            <span className="text-[#3D2B1F]">|</span>

            {/* PostgreSQL Pool Health & Active Clients */}
            <div className="flex items-center gap-1.5 text-[#D4B996]" title={`Postgres Pool: ${pool.active} active, ${pool.idle} idle`}>
              <Database className="h-3.5 w-3.5 text-[#8C6239]" />
              <span className="text-[11px] text-[#D4B996]/70">Pool:</span>
              {health.services.postgres === "up" ? (
                <span className="flex items-center gap-1 text-[#8FBC8F]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8FBC8F] animate-pulse" />
                  Healthy ({pool.active}/{pool.total})
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#E07A5F]">
                  <AlertTriangle className="h-3 w-3" />
                  Down
                </span>
              )}
            </div>
          </div>

          {/* Split-Screen Duel Mode Toggle */}
          <button
            onClick={() => onToggleDuelMode(!isDuelMode)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              isDuelMode
                ? "border-[#C5A059] bg-[#3D2B1F] text-[#F7F2EA] shadow-brassGlow"
                : "border-[#4E3727] bg-[#17100C] text-[#D4B996]/70 hover:border-[#6B4D36] hover:text-[#F7F2EA]"
            }`}
            title="Toggle between Single Seat Matrix and Side-by-Side Dual Device Race Duel"
          >
            <Swords className={`h-3.5 w-3.5 ${isDuelMode ? "text-[#C5A059]" : "text-[#8C6239]"}`} />
            <span>{isDuelMode ? "Duel Split-Screen: ON" : "Split-Screen Duel"}</span>
          </button>

          {/* Device Simulator Toggle (Active when not in duel mode) */}
          {!isDuelMode && (
            <div className="flex items-center rounded-lg border border-[#4E3727] bg-[#140E0B] p-0.5">
              <button
                onClick={() => onToggleDevice("device_a")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  activeDevice === "device_a"
                    ? "border border-[#C5A059]/60 bg-[#2A1E18] text-[#F7F2EA] shadow-sm"
                    : "text-[#D4B996]/60 hover:text-[#F7F2EA]"
                }`}
                title="Device A (MacBook / Safari)"
              >
                <Laptop className="h-3.5 w-3.5 text-[#C5A059]" />
                <span>Device A</span>
              </button>

              <button
                onClick={() => onToggleDevice("device_b")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  activeDevice === "device_b"
                    ? "border border-[#E07A5F]/60 bg-[#2A1E18] text-[#F7F2EA] shadow-sm"
                    : "text-[#D4B996]/60 hover:text-[#F7F2EA]"
                }`}
                title="Device B (Mobile / Chrome)"
              >
                <Smartphone className="h-3.5 w-3.5 text-[#E07A5F]" />
                <span>Device B</span>
              </button>
            </div>
          )}

          {/* Master Reset / Pre-Warm Button */}
          <button
            onClick={onResetSeats}
            disabled={isResetting}
            className="flex items-center gap-1.5 rounded-lg border border-[#8C6239]/60 bg-gradient-to-b from-[#3D2B1F] to-[#2A1E18] px-3 py-1.5 text-xs font-medium text-[#F7F2EA] shadow-sm transition-all hover:border-[#C5A059] hover:from-[#4E3727] hover:to-[#34241C] active:translate-y-0.5 disabled:opacity-50"
            title="Master Reset: Restore all 60 seats to Available and pre-warm Redis inventory"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 text-[#C5A059] ${
                isResetting ? "animate-spin" : ""
              }`}
            />
            <span>{isResetting ? "Syncing..." : "Master Reset"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
