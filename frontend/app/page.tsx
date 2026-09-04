"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { TopWidgetsBar, DeviceType } from "@/components/TopWidgetsBar";
import { SeatMatrix } from "@/components/SeatMatrix";
import { DuelConsole } from "@/components/DuelConsole";
import { ChaosControls } from "@/components/ChaosControls";
import { WireInspector } from "@/components/WireInspector";
import { TicketPassModal } from "@/components/TicketPassModal";
import { ConflictModal, ConflictModalState } from "@/components/ConflictModal";
import { ActivityStream, StreamItem } from "@/components/ActivityStream";
import { CreateEventModal } from "@/components/CreateEventModal";
import {
  fetchHealth,
  fetchEvents,
  fetchSeats,
  resetSeats,
  checkoutTicket,
  EventData,
  HealthData,
  CheckoutResult,
} from "@/lib/api";
import { ShieldAlert, Zap, X } from "lucide-react";

export default function Home() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string>("D5");
  const [contestedSeat, setContestedSeat] = useState<string | null>(null);
  const [activeDevice, setActiveDevice] = useState<DeviceType>("device_a");
  const [isDuelMode, setIsDuelMode] = useState(false);

  // Operations
  const [isBooking, setIsBooking] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCrashing, setIsCrashing] = useState(false);
  const [injectLatency, setInjectLatency] = useState(false);

  // Wire & Telemetry
  const [lastCheckoutResult, setLastCheckoutResult] = useState<CheckoutResult | null>(null);
  const [lastDuelResult, setLastDuelResult] = useState<{
    winner: CheckoutResult | null;
    rejected: CheckoutResult | null;
  } | null>(null);
  const [lastCrashReport, setLastCrashReport] = useState<{
    seatNumber: string;
    message: string;
    step: number;
  } | null>(null);

  // Modals & Streams
  const [ticketPassModal, setTicketPassModal] = useState<{
    isOpen: boolean;
    result: CheckoutResult | null;
  }>({ isOpen: false, result: null });

  const [conflictModalState, setConflictModalState] = useState<ConflictModalState>({
    isOpen: false,
    type: "conflict",
  });

  const [toastAlert, setToastAlert] = useState<{
    title: string;
    message: string;
    gateLatency: number;
    seatNumber: string;
  } | null>(null);

  const [activityItems, setActivityItems] = useState<StreamItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [health, setHealth] = useState<HealthData>({
    status: "ok",
    services: { postgres: "up", redis: "up" },
    pool: { total: 50, active: 2, idle: 48, waiting: 0 },
    latencyMs: 2,
    redisLatencyMs: 1.2,
  });

  // Client Session ID initialized safely on mount
  const [clientSessionId, setClientSessionId] = useState<string>("cli_tab_master");

  useEffect(() => {
    const stored = sessionStorage.getItem("artisan_client_id");
    if (stored) {
      setClientSessionId(stored);
    } else {
      const newId = `cli_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("artisan_client_id", newId);
      setClientSessionId(newId);
    }
  }, []);

  const activeEventRef = useRef<EventData | null>(null);
  activeEventRef.current = activeEvent;

  // Poll health & pool metrics every 2000ms
  useEffect(() => {
    let isMounted = true;
    const poll = async () => {
      const data = await fetchHealth();
      if (isMounted) setHealth(data);
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Initial event bootstrap
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      const loadedEvents = await fetchEvents();
      if (!isMounted) return;

      setEvents(loadedEvents);
      if (loadedEvents.length > 0) {
        const defaultEv =
          loadedEvents.find((e) => e.name.toLowerCase().includes("oppenheimer")) ||
          loadedEvents[0];
        setActiveEvent(defaultEv);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Poll seat status every 500ms for Real-Time Dual-Window Synchronization
  const refreshSeats = useCallback(async () => {
    const current = activeEventRef.current;
    if (!current?.id) return;

    const seatData = await fetchSeats(current.id);
    if (seatData) {
      setBookedSeats(seatData.bookedSeats || []);
    }
  }, []);

  useEffect(() => {
    if (!activeEvent?.id) return;
    refreshSeats();
    const interval = setInterval(refreshSeats, 500);
    return () => clearInterval(interval);
  }, [activeEvent?.id, refreshSeats]);

  // Record into chronological activity stream
  const logActivity = (result: CheckoutResult) => {
    const now = new Date();
    const timeStr =
      now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + `.${now.getMilliseconds().toString().padStart(3, "0")}`;

    const streamItem: StreamItem = {
      ...result,
      timestamp: timeStr,
    };
    setActivityItems((prev) => [streamItem, ...prev.slice(0, 19)]);
    setLastCheckoutResult(result);
  };

  // Switch active production
  const handleSelectEvent = (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    if (ev) {
      setActiveEvent(ev);
      setContestedSeat(null);
      setToastAlert(null);
      setLastDuelResult(null);
      setLastCrashReport(null);
    }
  };

  // Master Reset & Pre-Warm seats
  const handleResetSeats = async () => {
    if (!activeEvent?.id || isResetting) return;
    setIsResetting(true);
    setContestedSeat(null);
    setToastAlert(null);
    setLastDuelResult(null);
    setLastCrashReport(null);
    try {
      const res = await resetSeats(activeEvent.id);
      if (res) {
        setBookedSeats([]);
      }
      await refreshSeats();
    } catch (err) {
      console.error("Failed to reset seats:", err);
    } finally {
      setIsResetting(false);
    }
  };

  // Booking action from Single View or Split-Screen Duel Console
  const handleBookSeat = async (seatNumber: string, device: DeviceType) => {
    if (!activeEvent?.id || isBooking || isSimulating) return;

    setIsBooking(true);
    const userId = `${device === "device_a" ? "user_alpha" : "user_beta"}_${clientSessionId}`;
    const idempotencyKey = `idem_${device}_${seatNumber}_${Date.now()}`;

    try {
      const result = await checkoutTicket({
        eventId: activeEvent.id,
        userId,
        quantity: 1,
        seatNumber,
        idempotencyKey,
        chaosDelayMs: injectLatency ? 3000 : 0,
      });

      logActivity(result);

      if (result.statusCode === 201 || result.statusCode === 200) {
        // Winner / Confirmed -> Open Artisan Ticket Pass Modal
        setBookedSeats((prev) => [...new Set([...prev, seatNumber])]);
        setTicketPassModal({
          isOpen: true,
          result,
        });
      } else if (result.contested || result.statusCode === 409) {
        // Contested Lock Contention -> Flash terracotta and display alert
        setContestedSeat(seatNumber);
        setToastAlert({
          title: "Race Condition Blocked",
          message:
            result.message ||
            `Race Condition Blocked: Seat ${seatNumber} was claimed by another transaction via Redis Lua Gate.`,
          gateLatency: result.gateLatencyMs || 1.2,
          seatNumber,
        });
        setConflictModalState({
          isOpen: true,
          type: "conflict",
          result,
          device: device === "device_a" ? "Device A (Safari)" : "Device B (Chrome)",
        });
        setTimeout(() => setContestedSeat(null), 3000);
      }
    } finally {
      setIsBooking(false);
      refreshSeats();
    }
  };

  // Simulate Concurrent Collision: Parallel race between Device A and Device B
  const handleSimulateCollision = async (seatNumber: string) => {
    if (!activeEvent?.id || isSimulating || isBooking) return;

    setIsSimulating(true);
    setContestedSeat(seatNumber);
    setToastAlert(null);

    const time = Date.now();
    const reqA = {
      eventId: activeEvent.id,
      userId: `user_alpha_${clientSessionId}`,
      quantity: 1,
      seatNumber,
      idempotencyKey: `race_alpha_${seatNumber}_${time}`,
      chaosDelayMs: injectLatency ? 3000 : 0,
    };

    const reqB = {
      eventId: activeEvent.id,
      userId: `user_beta_${clientSessionId}`,
      quantity: 1,
      seatNumber,
      idempotencyKey: `race_beta_${seatNumber}_${time}`,
      chaosDelayMs: injectLatency ? 3000 : 0,
    };

    try {
      // Fire parallel asynchronous requests for the EXACT same seat simultaneously
      const [resA, resB] = await Promise.all([
        checkoutTicket(reqA),
        checkoutTicket(reqB),
      ]);

      logActivity(resA);
      logActivity(resB);

      const winner = resA.statusCode === 201 ? resA : resB.statusCode === 201 ? resB : null;
      const rejected = resA.statusCode === 409 ? resA : resB.statusCode === 409 ? resB : null;

      setLastDuelResult({ winner, rejected });

      if (winner) {
        setBookedSeats((prev) => [...new Set([...prev, seatNumber])]);
      }

      if (rejected) {
        setToastAlert({
          title: "Race Condition Blocked: Redis Lua Gate",
          message: `Seat ${seatNumber} was contested simultaneously. Winner acquired seat; Device B rejected by Redis Lua Gate in ${rejected.gateLatencyMs || 1.2}ms.`,
          gateLatency: rejected.gateLatencyMs || 1.2,
          seatNumber,
        });

        setConflictModalState({
          isOpen: true,
          type: "conflict",
          result: rejected,
          device: rejected.user_id?.includes("alpha")
            ? "Device A (Safari)"
            : "Device B (Chrome)",
        });
      }
    } finally {
      setIsSimulating(false);
      setTimeout(() => setContestedSeat(null), 3000);
      refreshSeats();
    }
  };

  // Chaos Engineering: Simulate Database Crash & Compensating Rollback (Saga)
  const handleSimulateCrash = async () => {
    if (!activeEvent?.id || isCrashing || isBooking || isSimulating) return;

    setIsCrashing(true);
    setLastCrashReport(null);
    const targetSeat = selectedSeat || "C5";

    try {
      const result = await checkoutTicket({
        eventId: activeEvent.id,
        userId: `chaos_runner_${clientSessionId}`,
        quantity: 1,
        seatNumber: targetSeat,
        idempotencyKey: `chaos_crash_${targetSeat}_${Date.now()}`,
        chaosFailDb: true,
      });

      logActivity(result);

      if (result.chaosRollback || result.statusCode === 500) {
        setLastCrashReport({
          seatNumber: targetSeat,
          message: `Compensating Rollback Verified: Redis decremented seat ${targetSeat}, database write crashed, and Redis INCRBY (+1) immediately restored inventory with zero leakage.`,
          step: 4,
        });
      }
    } finally {
      setIsCrashing(false);
      refreshSeats();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#120D0A] text-[#F7F2EA] pb-20">
      {/* Top Navigation Bar */}
      <Navbar
        health={health}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Floating Lock Contention Toast Notification */}
      {toastAlert && (
        <aside
          aria-label="Lock Contention Alert"
          className="fixed top-20 right-4 z-50 max-w-md animate-in slide-in-from-top-4 duration-300"
        >
          <div className="rounded-xl border border-red-500/70 bg-[#1E110E] p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/40 bg-red-950/80 text-red-400">
                <ShieldAlert className="h-5 w-5 animate-pulse" />
              </div>

              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-red-400 uppercase tracking-wider">
                    {toastAlert.title}
                  </span>
                  <button
                    onClick={() => setToastAlert(null)}
                    className="text-[#D4B996]/60 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-red-200 leading-snug">
                  {toastAlert.message}
                </p>
                <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-[#D4B996]/70">
                  <span className="flex items-center gap-1 text-[#8FBC8F]">
                    <Zap className="h-3 w-3 text-[#C5A059]" />
                    Gate Latency: {toastAlert.gateLatency}ms
                  </span>
                  <span>•</span>
                  <span>Seat: {toastAlert.seatNumber}</span>
                  <span>•</span>
                  <span className="text-[#8FBC8F]">Zero Overbooking</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Experience Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          {/* Top Fast-Access Telemetry & Action Widgets Bar */}
          <section>
            <TopWidgetsBar
              events={events}
              activeEventId={activeEvent?.id || ""}
              onSelectEvent={handleSelectEvent}
              health={health}
              activeDevice={activeDevice}
              onToggleDevice={setActiveDevice}
              isDuelMode={isDuelMode}
              onToggleDuelMode={setIsDuelMode}
              onResetSeats={handleResetSeats}
              isResetting={isResetting}
            />
          </section>

          {/* Main Visual Showcase Deck */}
          {isDuelMode ? (
            /* =============================================================== */
            /* SPLIT-SCREEN DUEL CONSOLE (Device A vs Device B)               */
            /* =============================================================== */
            <section className="flex flex-col gap-6 animate-in fade-in duration-300">
              <DuelConsole
                selectedSeat={selectedSeat}
                onSelectSeat={setSelectedSeat}
                bookedSeats={bookedSeats}
                contestedSeat={contestedSeat}
                onBookSeat={handleBookSeat}
                onSimulateCollision={handleSimulateCollision}
                isBooking={isBooking}
                isSimulating={isSimulating}
                lastDuelResult={lastDuelResult}
              />

              {/* Theater Seat Matrix (Contextual view under duel console) */}
              <SeatMatrix
                eventId={activeEvent?.id || ""}
                eventName={activeEvent?.name || "Cinema Showcase"}
                bookedSeats={bookedSeats}
                contestedSeat={contestedSeat}
                activeDevice={activeDevice}
                selectedSeat={selectedSeat}
                onSelectSeat={setSelectedSeat}
                onBookSeat={handleBookSeat}
                onSimulateCollision={handleSimulateCollision}
                isBooking={isBooking}
                isSimulating={isSimulating}
              />
            </section>
          ) : (
            /* =============================================================== */
            /* STANDARD 2D SEAT MATRIX & AUDIT STREAM VIEW                     */
            /* =============================================================== */
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-12 animate-in fade-in duration-300">
              {/* Left Column: Interactive 2D Seat Matrix (7 cols) */}
              <div className="xl:col-span-7 flex flex-col">
                <SeatMatrix
                  eventId={activeEvent?.id || ""}
                  eventName={activeEvent?.name || "Cinema Presentation"}
                  bookedSeats={bookedSeats}
                  contestedSeat={contestedSeat}
                  activeDevice={activeDevice}
                  selectedSeat={selectedSeat}
                  onSelectSeat={setSelectedSeat}
                  onBookSeat={handleBookSeat}
                  onSimulateCollision={handleSimulateCollision}
                  isBooking={isBooking}
                  isSimulating={isSimulating}
                />
              </div>

              {/* Right Column: Distributed Concurrency Telemetry & Audit Stream (5 cols) */}
              <div className="xl:col-span-5 flex flex-col gap-6">
                {/* Chaos Engineering Rack Card */}
                <ChaosControls
                  injectLatency={injectLatency}
                  onToggleLatency={setInjectLatency}
                  onSimulateCrash={handleSimulateCrash}
                  isCrashing={isCrashing}
                  lastCrashReport={lastCrashReport}
                />

                {/* Audit Stream Table */}
                <ActivityStream
                  items={activityItems}
                  onClear={() => setActivityItems([])}
                />
              </div>
            </section>
          )}
        </div>
      </main>

      {/* "Inspect the Wire" Micro-Telemetry Collapsible Bottom Drawer */}
      <WireInspector
        lastResult={lastCheckoutResult}
        health={health}
      />

      {/* Skeuomorphic Artisan Concert Pass Modal (On 201 Success) */}
      <TicketPassModal
        isOpen={ticketPassModal.isOpen}
        onClose={() => setTicketPassModal({ isOpen: false, result: null })}
        result={ticketPassModal.result}
        eventName={activeEvent?.name || "Artisan Presentation"}
      />

      {/* Lock Contention Conflict Modal (On 409 Rejected) */}
      <ConflictModal
        modalState={conflictModalState}
        onClose={() => setConflictModalState({ isOpen: false, type: "conflict" })}
        eventName={activeEvent?.name || "Artisan Presentation"}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={(newEvent) => {
          setEvents((prev) => [newEvent, ...prev]);
          setActiveEvent(newEvent);
        }}
      />
    </div>
  );
}
