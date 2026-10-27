"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Sparkles, PlusCircle, Loader2 } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="card-light w-full max-w-md p-6 sm:p-8 relative"
      >
        {/* Close Button */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="absolute right-4 top-4 text-[#616160] hover:text-[#0a0a0a] transition-colors p-1 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </motion.button>

        <h3 className="text-xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-[#0a0a0a]" />
          <span>Create Flash-Sale Event</span>
        </h3>
        <p className="mt-1 text-xs text-[#616160]">
          Initializes an event in PostgreSQL and automatically pre-warms the Redis in-memory gate.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-[#fff1f2] border border-[#fecdd3] p-3 text-xs text-[#9f1239]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-[#0a0a0a] font-bold mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vienna Philharmonic 2026"
              className="w-full rounded-xl bg-[#f5f4f2] border border-[#e5e3df] px-3.5 py-2.5 text-[#0a0a0a] placeholder-[#a1a1a1] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#0a0a0a] font-bold mb-1">
              Total Ticket Inventory (Quota)
            </label>
            <input
              type="number"
              required
              min={1}
              max={1000}
              value={totalTickets}
              onChange={(e) => setTotalTickets(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-xl bg-[#f5f4f2] border border-[#e5e3df] px-3.5 py-2.5 text-[#0a0a0a] placeholder-[#a1a1a1] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a] transition-colors"
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 pt-3">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full px-4 py-2 text-[#616160] hover:text-[#0a0a0a] transition-colors font-medium cursor-pointer"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.95 }}
              disabled={isSubmitting || !name.trim()}
              className="btn-black flex items-center gap-1.5 px-5 py-2.5 font-semibold disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Provisioning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-white" />
                  <span>Create &amp; Pre-Warm</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
