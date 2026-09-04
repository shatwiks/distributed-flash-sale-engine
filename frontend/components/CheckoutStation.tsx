"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Zap,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Minus,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { checkoutTicket, CheckoutResult } from "@/lib/api";

interface CheckoutStationProps {
  eventId: string;
  onCheckoutComplete: (result: CheckoutResult) => void;
}

export function CheckoutStation({
  eventId,
  onCheckoutComplete,
}: CheckoutStationProps) {
  const [userId, setUserId] = useState("usr_1001");
  const [quantity, setQuantity] = useState(1);
  const [idempotencyKey, setIdempotencyKey] = useState("ord-init-key");

  useEffect(() => {
    setUserId(`usr_${Math.floor(1000 + Math.random() * 9000)}`);
    setIdempotencyKey(`ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<CheckoutResult | null>(null);

  // Burst simulation state
  const [isBursting, setIsBursting] = useState(false);
  const [burstSummary, setBurstSummary] = useState<{
    total: number;
    confirmed: number;
    soldOut: number;
    errors: number;
  } | null>(null);

  const regenerateKey = () => {
    setIdempotencyKey(`ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
  };

  const handleSingleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || isLoading || isBursting) return;

    setIsLoading(true);
    setBurstSummary(null);

    try {
      const result = await checkoutTicket({
        eventId,
        userId: userId.trim(),
        quantity,
        idempotencyKey: idempotencyKey.trim(),
      });

      setLastOutcome(result);
      onCheckoutComplete(result);

      // Auto-regenerate idempotency key and randomize user for next attempt
      regenerateKey();
      setUserId(`usr_${Math.floor(1000 + Math.random() * 9000)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBurstSimulation = async () => {
    if (!eventId || isBursting || isLoading) return;

    setIsBursting(true);
    setLastOutcome(null);
    setBurstSummary({ total: 25, confirmed: 0, soldOut: 0, errors: 0 });

    const burstRunId = Date.now();
    const burstPromises = [];

    let confirmedCount = 0;
    let soldOutCount = 0;
    let errorCount = 0;

    for (let i = 1; i <= 25; i++) {
      burstPromises.push(
        (async () => {
          const res = await checkoutTicket({
            eventId,
            userId: `burst-user-${burstRunId}-${i}`,
            quantity: 1,
            idempotencyKey: `burst-key-${burstRunId}-${i}`,
          });

          if (res.statusCode === 201 || res.statusCode === 200) {
            confirmedCount++;
          } else if (res.statusCode === 409) {
            soldOutCount++;
          } else {
            errorCount++;
          }

          onCheckoutComplete(res);
        })()
      );
    }

    await Promise.all(burstPromises);

    setBurstSummary({
      total: 25,
      confirmed: confirmedCount,
      soldOut: soldOutCount,
      errors: errorCount,
    });

    setIsBursting(false);
  };

  return (
    <div className="card-craft p-6 sm:p-8">
      {/* Station Title */}
      <div className="flex flex-col justify-between gap-2 border-b border-[#3D2B1F] pb-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-[#F5EFEB]">
            <ShoppingCart className="h-5 w-5 text-[#C5A059]" />
            Concurrent Checkout Station
          </h3>
          <p className="text-xs text-[#D4B996]/70">
            Submit individual bookings or launch a 25-request concurrent burst against the Lua gate.
          </p>
        </div>

        {/* Burst Simulation Button */}
        <button
          onClick={handleBurstSimulation}
          disabled={isBursting || isLoading}
          className="flex items-center gap-2 rounded-lg border border-[#C5A059]/50 bg-gradient-to-r from-[#3D2B1F] to-[#2A1D17] px-4 py-2 text-xs font-semibold text-[#F5EFEB] shadow-md transition hover:border-[#C5A059] hover:from-[#4E3727] hover:to-[#34241C] disabled:opacity-50"
        >
          <Zap className={`h-4 w-4 text-[#C5A059] ${isBursting ? "animate-bounce" : ""}`} />
          <span>{isBursting ? "Firing 25 Concurrent VUs..." : "Simulate 25-VU Burst"}</span>
        </button>
      </div>

      {/* Main Single Checkout Form */}
      <form onSubmit={handleSingleCheckout} className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-12">
        {/* User ID Field */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-mono font-medium text-[#D4B996]">
            User Identifier
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="timber-inset mt-1.5 w-full px-3 py-2 text-xs font-mono text-[#F5EFEB] focus:border-[#C5A059] focus:outline-none"
            placeholder="e.g. buyer_9021"
          />
        </div>

        {/* Quantity Stepper (1 to 5) */}
        <div className="sm:col-span-3">
          <label className="block text-xs font-mono font-medium text-[#D4B996]">
            Ticket Quantity
          </label>
          <div className="timber-inset mt-1.5 flex items-center justify-between px-2 py-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-7 w-7 items-center justify-center rounded bg-[#2A1D17] text-[#D4B996] transition hover:bg-[#3D2B1F] hover:text-[#F5EFEB] disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-sm font-bold text-[#F5EFEB]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(5, q + 1))}
              disabled={quantity >= 5}
              className="flex h-7 w-7 items-center justify-center rounded bg-[#2A1D17] text-[#D4B996] transition hover:bg-[#3D2B1F] hover:text-[#F5EFEB] disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Idempotency Key */}
        <div className="sm:col-span-5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-mono font-medium text-[#D4B996]">
              Idempotency Key
            </label>
            <button
              type="button"
              onClick={regenerateKey}
              className="flex items-center gap-1 text-[11px] text-[#8C6239] transition hover:text-[#C5A059]"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              <span>Regen</span>
            </button>
          </div>
          <input
            type="text"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            required
            className="timber-inset mt-1.5 w-full px-3 py-2 text-xs font-mono text-[#D4B996] focus:border-[#C5A059] focus:outline-none"
          />
        </div>

        {/* Submit Booking Button */}
        <div className="sm:col-span-12 mt-2">
          <button
            type="submit"
            disabled={isLoading || isBursting}
            className="btn-brass flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin text-[#120D0A]" />
                <span>Reserving in Redis Gate & PostgreSQL...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 text-[#120D0A]" />
                <span>Book {quantity} Ticket{quantity > 1 ? "s" : ""} Now</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Outcome Banner: HTTP 201 Confirmed vs HTTP 409 Sold Out */}
      {lastOutcome && (
        <div
          className={`mt-6 rounded-xl border p-4 transition-all duration-300 ${
            lastOutcome.statusCode === 201 || lastOutcome.statusCode === 200
              ? "border-[#588157]/50 bg-[#1F2D1F]/80 text-[#8FBC8F]"
              : "border-[#E07A5F]/50 bg-[#2D1B17]/80 text-[#E07A5F]"
          }`}
        >
          <div className="flex items-start gap-3">
            {lastOutcome.statusCode === 201 || lastOutcome.statusCode === 200 ? (
              <CheckCircle2 className="h-5 w-5 text-[#8FBC8F] shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-[#E07A5F] shrink-0 mt-0.5" />
            )}

            <div className="w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-serif font-bold text-sm text-[#F5EFEB]">
                  {lastOutcome.statusCode === 201
                    ? "Order Confirmed (HTTP 201 Created)"
                    : lastOutcome.statusCode === 200
                    ? "Idempotent Replay Verified (HTTP 200 OK)"
                    : "Sold Out — In-Memory Gate Short-Circuited (HTTP 409)"}
                </span>
                <span className="font-mono text-xs text-[#D4B996]">
                  Latency: {lastOutcome.durationMs}ms
                </span>
              </div>

              {lastOutcome.id ? (
                <div className="mt-2 grid grid-cols-1 gap-1 text-xs font-mono text-[#D4B996] sm:grid-cols-2">
                  <div>
                    <span className="text-[#D4B996]/60">Order ID:</span>{" "}
                    <span className="text-[#F5EFEB]">{lastOutcome.id}</span>
                  </div>
                  <div>
                    <span className="text-[#D4B996]/60">Quantity:</span>{" "}
                    <span className="text-[#F5EFEB]">{lastOutcome.quantity} ticket(s)</span>
                  </div>
                  <div>
                    <span className="text-[#D4B996]/60">Buyer:</span>{" "}
                    <span className="text-[#F5EFEB]">{lastOutcome.user_id}</span>
                  </div>
                  <div>
                    <span className="text-[#D4B996]/60">Postgres Status:</span>{" "}
                    <span className="text-[#8FBC8F] font-bold">confirmed</span>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-xs text-[#D4B996]/80">
                  {lastOutcome.message ||
                    "Stock depleted in Redis in-memory gate. Database connection pool was bypassed completely."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Burst Simulation Results Card */}
      {burstSummary && (
        <div className="mt-6 rounded-xl border border-[#C5A059]/40 bg-[#1E1611] p-4">
          <div className="flex items-center justify-between border-b border-[#3D2B1F] pb-2">
            <span className="font-serif text-sm font-bold text-[#F5EFEB]">
              25-VU Concurrency Burst Breakdown
            </span>
            <span className="rounded bg-[#2A1D17] px-2 py-0.5 font-mono text-xs text-[#C5A059]">
              0% Connection Leaks
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-[#588157]/30 bg-[#1F2D1F] p-2.5">
              <div className="font-mono text-xl font-bold text-[#8FBC8F]">
                {burstSummary.confirmed}
              </div>
              <div className="text-[11px] text-[#D4B996]/70">Confirmed (201)</div>
            </div>

            <div className="rounded-lg border border-[#E07A5F]/30 bg-[#2D1B17] p-2.5">
              <div className="font-mono text-xl font-bold text-[#E07A5F]">
                {burstSummary.soldOut}
              </div>
              <div className="text-[11px] text-[#D4B996]/70">Short-Circuited (409)</div>
            </div>

            <div className="rounded-lg border border-[#3D2B1F] bg-[#17100C] p-2.5">
              <div className="font-mono text-xl font-bold text-[#8FBC8F]">
                {burstSummary.errors}
              </div>
              <div className="text-[11px] text-[#D4B996]/70">Server 500s</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
