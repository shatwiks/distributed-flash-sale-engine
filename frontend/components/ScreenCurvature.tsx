"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export function ScreenCurvature() {
  return (
    <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center justify-center pt-2 pb-8 select-none">
      {/* Curved Laser Screen SVG */}
      <div className="relative w-full px-8">
        <svg
          viewBox="0 0 800 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M 50 20 Q 400 52 750 20"
            stroke="#262626"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Screen Title Pill */}
      <div className="relative -mt-3 flex items-center gap-2 rounded-full bg-[#111111] px-4 py-1 text-xs font-semibold text-white">
        <Sparkles className="h-3 w-3 text-[#d4d2ce]" />
        <span>70mm IMAX Laser Screen, Acoustic Focal Point</span>
      </div>
    </div>
  );
}
