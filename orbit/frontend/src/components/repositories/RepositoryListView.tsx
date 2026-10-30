import React from "react";
import { Repository } from "../../types";
import { Star, GitFork, AlertCircle, Clock, ExternalLink, Sparkles, Map } from "lucide-react";
import { formatNumber, formatRelativeTime } from "../../lib/utils";

interface RepositoryListViewProps {
  repositories: Repository[];
  onSelectRepo: (repo: Repository) => void;
  onExplainWithAI: (repo: Repository) => void;
  onProceedWithRoadmap: (repo: Repository) => void;
}

export const RepositoryListView: React.FC<RepositoryListViewProps> = ({
  repositories,
  onSelectRepo,
  onExplainWithAI,
  onProceedWithRoadmap,
}) => {
  if (repositories.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-neutral-50/50 dark:bg-space-900/50">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">No repositories matched</h3>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your tech stack skills or difficulty filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="feed" aria-label="Recommended Repositories List">
      {repositories.map((repo) => {
        const scoreColor =
          repo.matchScore >= 90
            ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800"
            : repo.matchScore >= 80
            ? "text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800"
            : "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800";

        return (
          <div
            key={repo.id}
            className="p-5 rounded-2xl bg-white dark:bg-space-900 border border-border hover:border-indigo-300/60 dark:hover:border-indigo-700/60 transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Left Info */}
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onSelectRepo(repo)}
                  className="text-base font-semibold text-neutral-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left focus:outline-none focus:underline"
                >
                  {repo.fullName}
                </button>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${scoreColor}`}>
                  {repo.matchScore}% Match
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-border">
                  {repo.difficulty}
                </span>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 max-w-3xl">
                {repo.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-1">
                <div className="flex items-center space-x-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{formatNumber(repo.stars)}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <GitFork className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{formatNumber(repo.forks)}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Avg Review: {repo.maintainerMetrics.medianReviewTime}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                  <span>{repo.goodFirstIssuesCount} Good First Issues</span>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-border">
              <button
                onClick={() => onExplainWithAI(repo)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors"
                title="Explain architecture and contribution guide with Orbit AI"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain</span>
              </button>
              <button
                onClick={() => onProceedWithRoadmap(repo)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-border transition-colors"
              >
                <Map className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Roadmap</span>
              </button>
              <button
                onClick={() => onSelectRepo(repo)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                Details
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
