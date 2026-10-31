import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Repository } from "../../types";

interface NodeData {
  repository: Repository;
  onSelect: (repo: Repository) => void;
  isSelected: boolean;
}

// Each repository is a glowing star: size and brightness follow the match score, colour follows its domain.
const GROUP_COLOR: Record<string, [string, string]> = {
  frontend: ["#ffb15c", "#fe8500"],
  backend: ["#fe8500", "#ff5a3c"],
  ai: ["#ff7aa0", "#ff3b66"],
  systems: ["#ffe1b8", "#ffa53d"],
};

export const RepositoryNode = memo((props: any) => {
  const { repository, onSelect, isSelected } = props.data as NodeData;
  const score = repository.matchScore ?? 50;
  const size = Math.round(14 + (Math.max(0, Math.min(100, score)) / 100) * 16); // 14–30px, smaller & tidy
  const [c1, c2] = GROUP_COLOR[repository.constellation?.group] || GROUP_COLOR.backend;
  const glow = 0.35 + (score / 100) * 0.5;

  return (
    <div
      onClick={() => onSelect(repository)}
      className="group relative cursor-pointer select-none focus:outline-none flex flex-col items-center"
      tabIndex={0}
      role="button"
      aria-label={`${repository.fullName}, match score ${score} percent`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(repository); }
      }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !pointer-events-none" />
      <Handle type="target" position={Position.Left} className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Right} className="!opacity-0 !pointer-events-none" />

      {/* Star */}
      <div className="relative" style={{ width: size, height: size }}>
        <span className="absolute -inset-3 rounded-full blur-xl transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `radial-gradient(circle, ${c2} 0%, transparent 70%)`, opacity: isSelected ? 1 : glow }} />
        {isSelected && <span className="absolute -inset-2 rounded-full border border-tangerine-300/70 animate-pulse" />}
        <span className="absolute inset-0 rounded-full transition-transform duration-300 group-hover:scale-110"
          style={{ background: `radial-gradient(circle at 35% 30%, #fff 0%, ${c1} 38%, ${c2} 75%)`, boxShadow: `0 0 ${size / 2}px ${size / 8}px ${c2}66, inset 0 1px 2px rgba(255,255,255,0.8)` }} />
      </div>

      {/* Name under the star (fixed width so labels never collide) */}
      <span className="mt-1.5 w-[120px] text-center truncate text-[11px] font-medium text-white/80 group-hover:text-white">{repository.name}</span>
      <span className="text-[10px] font-mono text-tangerine-300/90">{score}%{repository.platform && repository.platform !== "github" && <span className={`ml-1 px-1 rounded ${repository.platform === "gitlab" ? "bg-rose-500/20 text-rose-200" : "bg-sky-500/20 text-sky-200"}`}>{repository.platform === "gitlab" ? "GitLab" : "Bitbucket"}</span>}</span>

      {/* Hover preview (same info as before) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 p-3 rounded-2xl glass-strong text-[11px] text-white/75 pointer-events-none opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus:opacity-100 transition-all duration-200 z-50">
        <div className="font-semibold text-white mb-1 flex items-center justify-between gap-2">
          <span className="truncate">{repository.fullName}</span>
          <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-tangerine-500/20 text-tangerine-200 font-mono">{repository.difficulty}</span>
        </div>
        <p className="line-clamp-2 text-white/60 text-[10.5px] leading-snug mb-2">{repository.description}</p>
        <div className="grid grid-cols-3 gap-1 text-[10px] mb-2">
          <span className="rounded-lg bg-white/5 px-1.5 py-1 text-center">{repository.primaryLanguage}</span>
          <span className="rounded-lg bg-white/5 px-1.5 py-1 text-center">{repository.starsUnknown ? (repository.platform === "bitbucket" ? "Bitbucket" : "—") : `⭐ ${repository.stars >= 1000 ? `${(repository.stars / 1000).toFixed(1)}k` : repository.stars}`}</span>
          <span className="rounded-lg bg-tangerine-500/15 text-tangerine-200 px-1.5 py-1 text-center font-mono">{score}% match</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/50 pt-1.5 border-t border-white/10">
          <span>Review: {repository.maintainerMetrics.medianReviewTime}</span>
          <span className="text-tangerine-300 font-medium">Click to inspect →</span>
        </div>
      </div>
    </div>
  );
});

RepositoryNode.displayName = "RepositoryNode";
