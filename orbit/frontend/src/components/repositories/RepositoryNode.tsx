import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Repository } from "../../types";
import { Star, Flame, Sparkles } from "lucide-react";

interface NodeData {
  repository: Repository;
  onSelect: (repo: Repository) => void;
  isSelected: boolean;
}

export const RepositoryNode = memo((props: any) => {
  const { repository, onSelect, isSelected } = props.data as NodeData;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 border-emerald-500/40 bg-emerald-950/60";
    if (score >= 80) return "text-indigo-400 border-indigo-500/40 bg-indigo-950/60";
    return "text-amber-400 border-amber-500/40 bg-amber-950/60";
  };

  const getGroupGlow = (group: string) => {
    switch (group) {
      case "ai":
        return "from-purple-500/30 to-violet-600/10 border-purple-500/50 shadow-purple-500/20";
      case "frontend":
        return "from-blue-500/30 to-cyan-600/10 border-blue-500/50 shadow-blue-500/20";
      case "backend":
        return "from-emerald-500/30 to-teal-600/10 border-emerald-500/50 shadow-emerald-500/20";
      default:
        return "from-indigo-500/30 to-violet-600/10 border-indigo-500/50 shadow-indigo-500/20";
    }
  };

  return (
    <div
      onClick={() => onSelect(repository)}
      className="group relative cursor-pointer select-none focus:outline-none"
      tabIndex={0}
      role="button"
      aria-label={`Repository ${repository.fullName}, match score ${repository.matchScore} percent`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(repository);
        }
      }}
    >
      {/* Invisible Handles for connections */}
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" />
      <Handle type="target" position={Position.Left} className="opacity-0 pointer-events-none" />
      <Handle type="source" position={Position.Right} className="opacity-0 pointer-events-none" />

      {/* Orbiting Ring on hover or selection */}
      <div
        className={`absolute -inset-2.5 rounded-2xl transition-all duration-300 pointer-events-none ${
          isSelected
            ? "border-2 border-indigo-400/80 bg-indigo-500/10 shadow-lg shadow-indigo-500/30 scale-105"
            : "border border-transparent group-hover:border-white/20 group-hover:bg-white/5"
        }`}
      />

      {/* Main Node Card */}
      <div
        className={`relative px-3.5 py-2.5 rounded-xl bg-space-900/90 backdrop-blur-md border transition-all duration-200 shadow-xl ${
          isSelected
            ? "border-indigo-400 ring-2 ring-indigo-400/30"
            : "border-slate-800 hover:border-slate-600"
        }`}
      >
        <div className="flex items-center space-x-2.5">
          {/* Glowing Star Orb */}
          <div className="relative flex items-center justify-center">
            <span
              className={`absolute w-3.5 h-3.5 rounded-full blur-[3px] bg-gradient-to-r ${getGroupGlow(
                repository.constellation.group
              )} animate-pulse-subtle`}
            />
            <span className="relative w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
          </div>

          {/* Repo Info */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                {repository.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                / {repository.owner}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[10px] text-slate-400 font-mono">
                {repository.primaryLanguage}
              </span>
              <span className="text-[9px] text-slate-600">•</span>
              <span className="text-[10px] text-slate-400">
                ⭐ {(repository.stars / 1000).toFixed(1)}k
              </span>
            </div>
          </div>

          {/* Match Score Badge */}
          <div
            className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getScoreColor(
              repository.matchScore
            )}`}
          >
            {repository.matchScore}%
          </div>
        </div>
      </div>

      {/* Quick Hover Tooltip Preview */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-2.5 rounded-lg bg-space-950/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-[11px] text-slate-300 pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 z-50">
        <div className="font-semibold text-white mb-1 flex items-center justify-between">
          <span>{repository.fullName}</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-900/60 text-indigo-300 font-mono">
            {repository.difficulty}
          </span>
        </div>
        <p className="line-clamp-2 text-slate-400 text-[10px] leading-snug mb-1.5">
          {repository.description}
        </p>
        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-800">
          <span>Review: {repository.maintainerMetrics.medianReviewTime}</span>
          <span className="text-indigo-400 font-medium">Click to inspect →</span>
        </div>
      </div>
    </div>
  );
});

RepositoryNode.displayName = "RepositoryNode";
