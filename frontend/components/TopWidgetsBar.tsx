"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Film,
  Zap,
  Database,
  Smartphone,
  Laptop,
  RotateCcw,
  Swords,
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
  const gateLatency = health.redisLatencyMs || 1.2;

  return (
    <div className="card-light p-3 sm:p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        
        {/* Left: Event Selection Pills with layoutId morphing */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 pr-2 text-xs font-semibold text-[#616160]">
            <Film className="h-4 w-4 text-[#0a0a0a]" />
            <span>Active event:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {events.slice(0, 3).map((ev) => {
              const isActive = ev.id === activeEventId;
              return (
                <motion.button
                  key={ev.id}
                  onClick={() => onSelectEvent(ev.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs transition-colors cursor-pointer ${
                    isActive
                      ? "text-white font-semibold"
                      : "bg-[#f5f4f2] text-[#444444] hover:text-[#0a0a0a] hover:bg-[#edebe7] border border-[#e5e3df] font-medium"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeEventPill"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 bg-[#0a0a0a] rounded-full z-0"
                    />
                  )}
                  <span
                    className={`relative z-10 h-1.5 w-1.5 rounded-full ${
                      isActive ? "bg-white" : "bg-[#616160]"
                    }`}
                  />
                  <span className="relative z-10">{ev.name}</span>
                  <span
                    className={`relative z-10 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      isActive
                        ? "bg-[#292929] text-white"
                        : "bg-[#e5e3df] text-[#616160]"
                    }`}
                  >
                    60 Seats
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Micro Telemetry Indicator */}
          <div className="flex items-center gap-2.5 rounded-full bg-[#f5f4f2] border border-[#e5e3df] px-3.5 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-[#616160]">
              <Zap className="h-3.5 w-3.5 text-[#0a0a0a]" />
              <span>Gate:</span>
              <span className="font-bold text-[#0a0a0a]">{gateLatency}ms</span>
            </div>

            <span className="text-[#616160]">•</span>

            <div className="flex items-center gap-1.5 text-[#616160]">
              <Database className="h-3.5 w-3.5 text-[#616160]" />
              <span>Pool:</span>
              <span className="font-semibold text-[#0a0a0a]">
                {pool.active}/{pool.total}
              </span>
            </div>
          </div>

          {/* Mode Switcher */}
          <motion.button
            onClick={() => onToggleDuelMode(!isDuelMode)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              isDuelMode
                ? "bg-[#0a0a0a] text-white"
                : "bg-[#f5f4f2] border border-[#e5e3df] text-[#444444] hover:text-[#0a0a0a] hover:bg-[#edebe7]"
            }`}
          >
            <Swords className={`h-3.5 w-3.5 ${isDuelMode ? "text-white" : "text-[#616160]"}`} />
            <span>{isDuelMode ? "Duel Console: Active" : "Duel Mode"}</span>
          </motion.button>

          {/* Device Switcher with morphing spring indicator */}
          {!isDuelMode && (
            <div className="relative flex items-center rounded-full bg-[#f5f4f2] border border-[#e5e3df] p-1">
              <button
                onClick={() => onToggleDevice("device_a")}
                className={`relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  activeDevice === "device_a"
                    ? "text-white font-semibold"
                    : "text-[#616160] hover:text-[#0a0a0a]"
                }`}
              >
                {activeDevice === "device_a" && (
                  <motion.span
                    layoutId="activeDeviceSwitch"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-[#0a0a0a] rounded-full z-0"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Laptop className="h-3.5 w-3.5" />
                  <span>Device A</span>
                </span>
              </button>

              <button
                onClick={() => onToggleDevice("device_b")}
                className={`relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  activeDevice === "device_b"
                    ? "text-white font-semibold"
                    : "text-[#616160] hover:text-[#0a0a0a]"
                }`}
              >
                {activeDevice === "device_b" && (
                  <motion.span
                    layoutId="activeDeviceSwitch"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-[#0a0a0a] rounded-full z-0"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Device B</span>
                </span>
              </button>
            </div>
          )}

          {/* Master Reset Button */}
          <motion.button
            onClick={onResetSeats}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            disabled={isResetting}
            className="flex items-center gap-1.5 rounded-full bg-[#f5f4f2] hover:bg-[#edebe7] border border-[#e5e3df] px-3.5 py-1.5 text-xs font-semibold text-[#0a0a0a] transition-colors disabled:opacity-50 cursor-pointer"
            title="Pre-warm Redis inventory and restore all 60 seats"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 text-[#0a0a0a] ${isResetting ? "animate-spin" : ""}`}
            />
            <span>{isResetting ? "Pre-Warming..." : "Master Reset"}</span>
          </motion.button>

        </div>
      </div>
    </div>
  );
}
