import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Repository, RoadmapStep } from "../../types";
import { apiService } from "../../services/api";
import { ConstellationCanvas } from "./ConstellationCanvas";
import { RepositoryListView } from "./RepositoryListView";
import { RepositoryFilters } from "./RepositoryFilters";
import { RepositoryDetailModal } from "./RepositoryDetailModal";
import { ContributionRoadmapModal } from "./ContributionRoadmapModal";
import { Compass, Sparkles, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { RepoSearch } from "./RepoSearch";
import { OrbitLoader } from "../common/OrbitLoader";

export const RepositoriesPage: React.FC = () => {
  const {
    profile,
    selectedRepo,
    setSelectedRepo,
    isRoadmapOpen,
    setIsRoadmapOpen,
    openChatWithRepo,
    openRoadmapForRepo,
    createChatSession,
    setActiveTab,
    isMockMode,
  } = useApp();

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [viewMode, setViewMode] = useState<"constellation" | "list">("constellation");

  // Fetch repositories
  const fetchRepos = (force = false) => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();

    apiService
      .getRepositories(profile, controller.signal, force)
      .then((res) => {
        setRepositories(res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError("Failed to fetch repository recommendations.");
          setLoading(false);
        }
      });

    return () => controller.abort();
  };

  useEffect(() => {
    const cleanup = fetchRepos();
    return cleanup;
  }, [profile, isMockMode]);

  // Extract unique languages for filter dropdown
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    repositories.forEach((r) => {
      r.languages.forEach((l) => langs.add(l));
    });
    return Array.from(langs).sort();
  }, [repositories]);

  // Open a search result: constellation repos open instantly; GitHub results load full details first.
  const openFromSearch = async (repo: Repository) => {
    if (!(repo as any).partial) { setSelectedRepo(repo); return; }
    setSelectedRepo(repo); // show what we have immediately
    try {
      const r = await fetch(`/api/repositories/${repo.id}/details`, { credentials: "include" });
      const j = await r.json();
      if (r.ok && j.repository) setSelectedRepo(j.repository);
    } catch { /* keep partial */ }
  };

  // Filtered repositories (search lives in the palette; the sky stays complete)
  const filteredRepositories = useMemo(() => {
    return repositories.filter((repo) => {

      // Language
      if (selectedLanguage !== "All") {
        if (!repo.languages.includes(selectedLanguage)) return false;
      }

      // Difficulty
      if (selectedDifficulty !== "All") {
        if (repo.difficulty !== selectedDifficulty) return false;
      }

      return true;
    });
  }, [repositories, selectedLanguage, selectedDifficulty]);

  const { askOrbit } = useApp();
  const handleAskAIAboutStep = (repo: Repository, step: RoadmapStep) => {
    askOrbit(`Explain step ${step.stepNumber} of my roadmap for ${repo.fullName} — "${step.title}" — in simple terms for my level, and tell me exactly what to do first.`, { id: repo.id, name: repo.name, owner: repo.owner });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Personalized Recommendations
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {profile.skills.join(", ") || "All Stacks"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Repository Constellation
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Explore open-source projects clustered by stack and topic. Tap any star to inspect maintainer review cadence, matched skills, or generate a step-by-step contribution roadmap.
          </p>
        </div>

        <button
          onClick={() => fetchRepos(true)}
          className="self-start md:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-white dark:bg-space-900 border border-border hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
          title="Refresh recommendations"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar (raised above the constellation so the search dropdown is never hidden) */}
      <div className="relative z-30">
      <RepositoryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        availableLanguages={availableLanguages}
        searchSlot={<RepoSearch query={searchQuery} onQueryChange={setSearchQuery} local={repositories} onOpen={openFromSearch} />}
      />
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="w-full h-[560px] flex items-center justify-center">
          <OrbitLoader size={88} label="Mapping your constellation…" sub="Finding open-source projects that match your stack" />
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-300">{error}</h3>
          <button
            onClick={() => fetchRepos(true)}
            className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : viewMode === "constellation" ? (
        <ConstellationCanvas
          repositories={filteredRepositories}
          selectedRepo={selectedRepo}
          onSelectRepo={setSelectedRepo}
        />
      ) : (
        <RepositoryListView
          repositories={filteredRepositories}
          onSelectRepo={setSelectedRepo}
          onExplainWithAI={openChatWithRepo}
          onProceedWithRoadmap={openRoadmapForRepo}
        />
      )}

      {/* Repository Detail Modal */}
      <RepositoryDetailModal
        repository={isRoadmapOpen ? null : selectedRepo}
        onClose={() => setSelectedRepo(null)}
        onExplainWithAI={(repo) => {
          setSelectedRepo(null);
          openChatWithRepo(repo);
        }}
        onProceedWithRoadmap={(repo) => {
          setSelectedRepo(null);
          openRoadmapForRepo(repo);
        }}
      />

      {/* Contribution Roadmap Modal */}
      <ContributionRoadmapModal
        repository={selectedRepo}
        isOpen={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
        onAskAIAboutStep={handleAskAIAboutStep}
      />
    </div>
  );
};
