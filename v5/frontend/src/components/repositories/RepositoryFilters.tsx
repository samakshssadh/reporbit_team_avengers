import React from "react";
import { Search, Sparkles, LayoutGrid, Network, Filter } from "lucide-react";

interface RepositoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (diff: string) => void;
  viewMode: "constellation" | "list";
  onViewModeChange: (mode: "constellation" | "list") => void;
  availableLanguages: string[];
  searchSlot?: React.ReactNode;
}

export const RepositoryFilters: React.FC<RepositoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  selectedDifficulty,
  onDifficultyChange,
  viewMode,
  onViewModeChange,
  availableLanguages,
  searchSlot,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-white/70 dark:bg-space-900/70 backdrop-blur-md rounded-2xl border border-border shadow-sm">
      {/* Search: instant + live GitHub */}
      {searchSlot}

      {/* Selects & Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Language Filter */}
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-neutral-100/80 dark:bg-neutral-800/80 border border-border rounded-xl text-neutral-700 dark:text-neutral-300 outline-none focus:ring-1 focus:ring-indigo-500"
          aria-label="Filter by Language"
        >
          <option value="All">All Languages</option>
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        {/* Difficulty Filter */}
        <select
          value={selectedDifficulty}
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-neutral-100/80 dark:bg-neutral-800/80 border border-border rounded-xl text-neutral-700 dark:text-neutral-300 outline-none focus:ring-1 focus:ring-indigo-500"
          aria-label="Filter by Difficulty"
        >
          <option value="All">All Difficulties</option>
          <option value="Beginner-Friendly">Beginner-Friendly</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Challenging">Challenging</option>
        </select>

        {/* View Switcher: Constellation vs List */}
        <div className="flex items-center rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5 border border-border">
          <button
            type="button"
            onClick={() => onViewModeChange("constellation")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "constellation"
                ? "bg-white dark:bg-space-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                : "text-muted-foreground hover:text-neutral-900 dark:hover:text-white"
            }`}
            title="Interactive Constellation View"
          >
            <Network className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Constellation</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "list"
                ? "bg-white dark:bg-space-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                : "text-muted-foreground hover:text-neutral-900 dark:hover:text-white"
            }`}
            title="Accessible List View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">List View</span>
          </button>
        </div>
      </div>
    </div>
  );
};
