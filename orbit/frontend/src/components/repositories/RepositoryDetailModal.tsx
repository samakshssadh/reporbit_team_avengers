import React, { useEffect } from "react";
import { Repository } from "../../types";
import {
  X,
  ExternalLink,
  Sparkles,
  Map,
  Star,
  GitFork,
  Clock,
  Calendar,
  CheckCircle2,
  Terminal,
  HelpCircle,
  FileCode2,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { formatNumber, formatRelativeTime, isSafeUrl } from "../../lib/utils";

interface RepositoryDetailModalProps {
  repository: Repository | null;
  onClose: () => void;
  onExplainWithAI: (repo: Repository) => void;
  onProceedWithRoadmap: (repo: Repository) => void;
}

export const RepositoryDetailModal: React.FC<RepositoryDetailModalProps> = ({
  repository,
  onClose,
  onExplainWithAI,
  onProceedWithRoadmap,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && repository) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [repository, onClose]);

  if (!repository) return null;

  const scoreColor =
    repository.matchScore >= 90
      ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800"
      : repository.matchScore >= 80
      ? "text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800"
      : "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-space-900 rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="repo-detail-title"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-border bg-neutral-50/50 dark:bg-neutral-900/40 flex items-start justify-between">
          <div className="space-y-1 pr-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {repository.owner}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${scoreColor}`}>
                {repository.matchScore}% Match
              </span>
            </div>
            <h2 id="repo-detail-title" className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {repository.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
          {/* Description */}
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {repository.description}
          </p>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-border/80">
              <div className="text-[11px] text-muted-foreground flex items-center space-x-1 mb-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Stars</span>
              </div>
              <div className="text-sm font-semibold font-mono text-neutral-900 dark:text-white">
                {formatNumber(repository.stars)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-border/80">
              <div className="text-[11px] text-muted-foreground flex items-center space-x-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Review Speed</span>
              </div>
              <div className="text-sm font-semibold font-mono text-neutral-900 dark:text-white">
                {repository.maintainerMetrics.medianReviewTime}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-border/80">
              <div className="text-[11px] text-muted-foreground flex items-center space-x-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Cadence</span>
              </div>
              <div className="text-sm font-semibold font-mono text-neutral-900 dark:text-white">
                {repository.maintainerMetrics.cadence}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-border/80">
              <div className="text-[11px] text-muted-foreground flex items-center space-x-1 mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Difficulty</span>
              </div>
              <div className="text-sm font-semibold font-mono text-neutral-900 dark:text-white truncate">
                {repository.difficulty}
              </div>
            </div>
          </div>

          {/* Match Score Breakdown */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Match Score Breakdown ({repository.matchScore}/100)</span>
              </span>
            </div>
            <p className="text-xs text-indigo-950 dark:text-indigo-300 leading-normal">
              {repository.scoreBreakdown.explanation}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono text-muted-foreground">
              <div className="bg-white/80 dark:bg-space-900/80 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                <span>Stack: </span>
                <strong className="text-indigo-600 dark:text-indigo-400">{repository.scoreBreakdown.techStackOverlap}/40</strong>
              </div>
              <div className="bg-white/80 dark:bg-space-900/80 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                <span>Difficulty: </span>
                <strong className="text-indigo-600 dark:text-indigo-400">{repository.scoreBreakdown.difficultyFit}/25</strong>
              </div>
              <div className="bg-white/80 dark:bg-space-900/80 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                <span>Activity: </span>
                <strong className="text-indigo-600 dark:text-indigo-400">{repository.scoreBreakdown.activityAndResponsiveness}/20</strong>
              </div>
              <div className="bg-white/80 dark:bg-space-900/80 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                <span>Docs: </span>
                <strong className="text-indigo-600 dark:text-indigo-400">{repository.scoreBreakdown.documentationQuality}/15</strong>
              </div>
            </div>
          </div>

          {/* Languages & Matched Skills */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Languages & Matched Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {repository.languages.map((lang) => {
                const isMatched = repository.matchedSkills.includes(lang);
                return (
                  <span
                    key={lang}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 ${
                      isMatched
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-border"
                    }`}
                  >
                    <span>{lang}</span>
                    {isMatched && <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Setup Command */}
          {repository.setupCommand && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Quick Setup Command</span>
              </h3>
              <div className="p-3 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-xs overflow-x-auto flex items-center justify-between">
                <code>{repository.setupCommand}</code>
                <span className="text-[10px] text-neutral-400 uppercase font-sans">verified</span>
              </div>
            </div>
          )}

          {/* Good First Issues Sample */}
          {repository.sampleIssues && repository.sampleIssues.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Open Good First Issues ({repository.goodFirstIssuesCount} Available)
                </h3>
              </div>
              <div className="space-y-2">
                {repository.sampleIssues.map((issue) => (
                  <a
                    key={issue.id}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-border hover:border-indigo-300 dark:hover:border-indigo-700 bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-all flex items-center justify-between text-xs group"
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-muted-foreground">#{issue.number}</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {issue.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {issue.labels.map((l) => (
                          <span
                            key={l}
                            className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-neutral-200/60 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer: 3 required actions */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900/60 border-t border-border flex flex-wrap items-center justify-between gap-3">
          {/* Action 3: View on GitHub */}
          {isSafeUrl(repository.url) && (
            <a
              href={repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors border border-border"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              <span>View on GitHub</span>
            </a>
          )}

          <div className="flex items-center space-x-2.5">
            {/* Action 1: Explain with Orbit AI */}
            <button
              type="button"
              onClick={() => onExplainWithAI(repository)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explain with Orbit AI</span>
            </button>

            {/* Action 2: Proceed with roadmap */}
            <button
              type="button"
              onClick={() => onProceedWithRoadmap(repository)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Proceed with Roadmap</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
