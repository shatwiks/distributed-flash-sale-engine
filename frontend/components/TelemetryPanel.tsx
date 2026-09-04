"use client";

import React from "react";
import {
  Activity,
  Cpu,
  Database,
  Server,
  TrendingUp,
  ShieldCheck,
  HardDrive,
} from "lucide-react";
import { HealthData } from "@/lib/api";

interface TelemetryPanelProps {
  health: HealthData;
}

export function TelemetryPanel({ health }: TelemetryPanelProps) {
  const pgUp = health.services?.postgres === "up";
  const redisUp = health.services?.redis === "up";

  return (
    <div className="card-craft p-6 sm:p-8">
      {/* Panel Title */}
      <div className="flex items-center justify-between border-b border-[#3D2B1F] pb-4">
        <div>
          <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#F5EFEB]">
            <Activity className="h-5 w-5 text-[#C5A059]" />
            Cluster Telemetry & Health
          </h3>
          <p className="text-xs text-[#D4B996]/70">
            Real-time polling (every 1,500ms) against the containerized production stack.
          </p>
        </div>

        <span className="flex items-center gap-1.5 rounded-full border border-[#588157]/40 bg-[#1F2D1F] px-2.5 py-1 text-[11px] font-mono font-medium text-[#8FBC8F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#8FBC8F] animate-pulse" />
          LIVE HEARTBEAT
        </span>
      </div>

      {/* Grid of Micro Telemetry Gauges */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* PostgreSQL Health */}
        <div className="rounded-xl border border-[#3D2B1F] bg-[#17100C] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#D4B996]/70">PostgreSQL 16</span>
            <Database className="h-4 w-4 text-[#8C6239]" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                pgUp ? "bg-[#588157] shadow-[0_0_8px_#588157]" : "bg-[#E07A5F]"
              }`}
            />
            <span className="font-mono text-sm font-bold text-[#F5EFEB]">
              {pgUp ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-[#D4B996]/60">
            Pool: Max 50 Clients (5s Timeout)
          </div>
        </div>

        {/* Redis In-Memory Gate */}
        <div className="rounded-xl border border-[#3D2B1F] bg-[#17100C] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#D4B996]/70">Redis 7 AOF</span>
            <Cpu className="h-4 w-4 text-[#C5A059]" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                redisUp ? "bg-[#588157] shadow-[0_0_8px_#588157]" : "bg-[#E07A5F]"
              }`}
            />
            <span className="font-mono text-sm font-bold text-[#F5EFEB]">
              {redisUp ? "OPERATIONAL" : "UNREACHABLE"}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-[#D4B996]/60">
            Single-Threaded O(1) Lua Gate
          </div>
        </div>

        {/* Target-Tracking Auto-scaling */}
        <div className="rounded-xl border border-[#3D2B1F] bg-[#17100C] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#D4B996]/70">ECS Auto-scaling</span>
            <TrendingUp className="h-4 w-4 text-[#C5A059]" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#F5EFEB]">
              2 - 10 Tasks
            </span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-[#D4B996]/60">
            1,000 req/min Target Tracking
          </div>
        </div>

        {/* Round-Trip Latency */}
        <div className="rounded-xl border border-[#3D2B1F] bg-[#17100C] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#D4B996]/70">Heartbeat Ping</span>
            <Server className="h-4 w-4 text-[#8C6239]" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#8FBC8F]">
              {health.latencyMs !== undefined ? `${health.latencyMs} ms` : "N/A"}
            </span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-[#D4B996]/60">
            Node 20 Alpine &lt; 50MB Image
          </div>
        </div>
      </div>
    </div>
  );
}
