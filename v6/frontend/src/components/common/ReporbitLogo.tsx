import React from "react";

export const ReporbitLogo: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className="flex items-center gap-2.5">
    <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-tangerine-300 via-tangerine-500 to-rose-500 shadow-[0_0_24px_-2px_rgba(254,133,0,0.7)] flex items-center justify-center">
      <svg className="w-5 h-5 text-[#1b1d27]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-25 12 12)" />
      </svg>
    </div>
    {!compact && <span className="font-semibold text-lg tracking-tight text-white">Rep<span className="text-tangerine-400">orbit</span></span>}
  </div>
);
