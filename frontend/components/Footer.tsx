"use client";

import React from "react";
import { ArrowUp } from "lucide-react";

interface FooterProps {
  onLaunchArena: () => void;
  onLaunchDuel: () => void;
}

const WORDMARK_BLOCKS = [
  { ch: "F", height: "h-[82%]" },
  { ch: "L", height: "h-[68%]" },
  { ch: "A", height: "h-[94%]" },
  { ch: "S", height: "h-[76%]" },
  { ch: "H", height: "h-[100%]" },
  { ch: "S", height: "h-[72%]" },
  { ch: "A", height: "h-[90%]" },
  { ch: "L", height: "h-[64%]" },
  { ch: "E", height: "h-[86%]" },
];

export function Footer({ onLaunchArena, onLaunchDuel }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-16 bg-[#111111] text-white">
      {/* Return of the Ticket Perforation Stripe Motif */}
      <div aria-hidden="true" className="ticket-stripe h-2.5 bg-[#f5f4f2]">
        {Array.from({ length: 48 }).map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 ${
              i % 2 === 0 ? "bg-[#111111]" : "bg-[#f5f4f2]"
            }`}
          />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-14 pb-20 sm:px-6 lg:px-8">
        {/* The Mark, Built Large: Block-Constructed Wordmark */}
        <div
          aria-label="Flash-Sale Engine"
          className="flex h-32 sm:h-48 lg:h-60 w-full items-end gap-1 sm:gap-1.5"
        >
          {WORDMARK_BLOCKS.map((item, idx) => (
            <div
              key={`${item.ch}-${idx}`}
              className={`${item.height} flex flex-1 items-end justify-center rounded-t-md bg-[#f5f4f2] pb-2 sm:pb-4 text-[#0a0a0a]`}
            >
              <span className="font-display text-3xl sm:text-6xl lg:text-8xl font-extrabold leading-none tracking-tighter">
                {item.ch}
              </span>
            </div>
          ))}
        </div>

        {/* Footer Links & Technical Metadata */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-8 text-sm">
          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="font-bold text-white">Interactive Arena</span>
            <button
              type="button"
              onClick={onLaunchArena}
              className="text-left text-[#a1a1a1] hover:text-white transition-colors cursor-pointer"
            >
              60-Seat Auditorium Matrix
            </button>
            <button
              type="button"
              onClick={onLaunchDuel}
              className="text-left text-[#a1a1a1] hover:text-white transition-colors cursor-pointer"
            >
              Split-Screen Concurrency Duel
            </button>
          </div>

          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="font-bold text-white">Architecture</span>
            <a
              href="#architecture"
              className="text-[#a1a1a1] hover:text-white transition-colors"
            >
              Redis Lua Gate &amp; Saga Rollback
            </a>
            <a
              href="#benchmarks"
              className="text-[#a1a1a1] hover:text-white transition-colors"
            >
              Little&rsquo;s Law &amp; k6 Benchmarks
            </a>
          </div>

          <div className="md:col-span-6 md:text-right flex flex-col md:items-end justify-between gap-4">
            <p className="font-serif text-base text-[#a1a1a1] max-w-[38ch]">
              Node.js 20, Express, Redis 7 Lua, PostgreSQL 16, Next.js 16,
              Docker Alpine, and AWS ECS Fargate Terraform.
            </p>
          </div>
        </div>

        {/* Bottom Row: Copyright + Notched Back-to-Top Action */}
        <div className="mt-12 pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[13px] text-[#a1a1a1]">
          <span>
            Distributed Flash Sale Engine · Guaranteed 0.00% Overbooking
          </span>

          <button
            type="button"
            onClick={scrollToTop}
            className="relative inline-flex items-center gap-2 self-start sm:self-auto rounded-md bg-[#ffffff] px-5 py-2.5 text-[13px] font-bold text-[#0a0a0a] hover:bg-[#edebe7] transition-colors cursor-pointer"
          >
            <span
              aria-hidden="true"
              className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#111111]"
            />
            <span
              aria-hidden="true"
              className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#111111]"
            />
            <span>Back to top</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
