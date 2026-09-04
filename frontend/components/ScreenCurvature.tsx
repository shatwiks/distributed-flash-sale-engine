"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export function ScreenCurvature() {
  return (
    <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center justify-center pt-2 pb-8 select-none">
      {/* Ambient Projection Light Cone */}
      <div
        className="pointer-events-none absolute -top-4 h-24 w-3/4 rounded-full opacity-20 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at center, #C5A059 0%, #D4B996 40%, transparent 70%)",
        }}
      />

      {/* Curved Cinema Screen SVG */}
      <div className="relative w-full px-8">
        <svg
          viewBox="0 0 800 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full screen-glow"
        >
          <defs>
            {/* Screen Line Gradient */}
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4E3727" stopOpacity="0.1" />
              <stop offset="20%" stopColor="#C5A059" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F5EFEB" stopOpacity="1" />
              <stop offset="80%" stopColor="#C5A059" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4E3727" stopOpacity="0.1" />
            </linearGradient>

            {/* Downward Light Glow Gradient */}
            <radialGradient id="lightRay" cx="50%" cy="0%" r="70%">
              <stop offset="0%" stopColor="#C5A059" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#8C6239" stopOpacity="0.08" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Diffused Light Field */}
          <path
            d="M 50 15 Q 400 45 750 15 L 770 60 L 30 60 Z"
            fill="url(#lightRay)"
          />

          {/* Primary Curved Screen Arch */}
          <path
            d="M 50 20 Q 400 52 750 20"
            stroke="url(#screenGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Subtle Outer Timber Joinery Trace */}
          <path
            d="M 60 25 Q 400 55 740 25"
            stroke="#4E3727"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Screen Title Pill */}
      <div className="relative -mt-3 flex items-center gap-2 rounded-full border border-[#4E3727] bg-[#1E1611]/90 px-4 py-1 text-[11px] font-semibold tracking-widest text-[#D4B996] uppercase shadow-md backdrop-blur-sm">
        <Sparkles className="h-3 w-3 text-[#C5A059] animate-pulse" />
        <span>Screen / Stage 70mm Acoustic</span>
      </div>
    </div>
  );
}
