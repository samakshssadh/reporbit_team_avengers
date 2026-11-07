import React from "react";

// Signature loading animation: a glowing core with two orbiting moons.
export const OrbitLoader: React.FC<{ size?: number; label?: string; sub?: string }> = ({ size = 64, label, sub }) => (
  <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
    <div className="orbit-loader" style={{ ["--s" as any]: `${size}px` }}>
      <span className="ring" /><span className="ring r2" /><span className="core" />
    </div>
    {label && <p className="mt-5 text-sm font-medium text-white">{label}</p>}
    {sub && <p className="mt-1 text-xs text-white/50">{sub}</p>}
  </div>
);

export const TypingDots: React.FC = () => (
  <span className="inline-flex items-center gap-1.5" aria-label="Orbit AI is typing"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span>
);
