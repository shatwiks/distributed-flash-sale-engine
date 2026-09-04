"use client";

import React, { useState } from "react";
import { X, Sparkles, PlusCircle } from "lucide-react";
import { createEvent, EventData } from "@/lib/api";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventData) => void;
}

export function CreateEventModal({
  isOpen,
  onClose,
  onEventCreated,
}: CreateEventModalProps) {
  const [name, setName] = useState("Vienna Philharmonic Summer Night 2026");
  const [totalTickets, setTotalTickets] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const newEvent = await createEvent(name.trim(), totalTickets);
      onEventCreated(newEvent);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card-craft w-full max-w-md p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#D4B996]/60 hover:text-[#F5EFEB] transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="font-serif text-xl font-bold text-[#F5EFEB] flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-[#C5A059]" />
          Create Flash-Sale Event
        </h3>
        <p className="mt-1 text-xs text-[#D4B996]/70">
          Initializes an event in PostgreSQL and automatically pre-warms the Redis in-memory gate.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-[#E07A5F]/40 bg-[#2D1B17] p-2.5 text-xs text-[#E07A5F]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-[#D4B996]">
              Event Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="timber-inset mt-1.5 w-full px-3 py-2 text-xs font-mono text-[#F5EFEB] focus:border-[#C5A059] focus:outline-none"
              placeholder="e.g. World Tour Flash Sale"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-[#D4B996]">
              Total Ticket Inventory
            </label>
            <input
              type="number"
              min="1"
              max="100000"
              value={totalTickets}
              onChange={(e) => setTotalTickets(parseInt(e.target.value, 10) || 1)}
              required
              className="timber-inset mt-1.5 w-full px-3 py-2 text-xs font-mono text-[#F5EFEB] focus:border-[#C5A059] focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              {[20, 50, 100, 500].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setTotalTickets(preset)}
                  className="rounded border border-[#3D2B1F] bg-[#1E1611] px-2.5 py-1 text-[11px] font-mono text-[#D4B996] hover:border-[#6B4D36] hover:text-[#F5EFEB]"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#3D2B1F] bg-[#1E1611] px-4 py-2 text-xs font-medium text-[#D4B996] hover:bg-[#2A1D17]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-brass flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-[#120D0A]" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Launch Event</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
