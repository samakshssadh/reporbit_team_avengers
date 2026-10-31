import React, { useState, useEffect, useRef } from "react";
import { LearningPath, LearningStage } from "../../types";
import { apiService } from "../../services/api";
import { VideoResourceCard, WebResourceCard } from "./ResourceCard";
import {
  Search,
  BookOpen,
  Sparkles,
  ChevronRight,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

const POPULAR_SHORTCUTS = ["Python", "TypeScript", "Go", "Rust", "JavaScript"];

interface LearnLanguagesProps {
  onAskAI: (subject: string, stage?: LearningStage) => void;
}

export const LearnLanguages: React.FC<LearnLanguagesProps> = ({ onAskAI }) => {
  const [query, setQuery] = useState("Python");
  const [activeSubject, setActiveSubject] = useState("Python");
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // Request cancellation / stale response protection
  const activeControllerRef = useRef<AbortController | null>(null);

  const fetchSubject = (subjectToFetch: string) => {
    if (!subjectToFetch.trim()) return;

    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setActiveSubject(subjectToFetch);

    apiService
      .getLanguageRoadmap(subjectToFetch, controller.signal)
      .then((res) => {
        setLearningPath(res.data);
        if (res.data?.stages && res.data.stages.length > 0) {
          setSelectedStageId(res.data.stages[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(`Unable to load curriculum for "${subjectToFetch}". Please try again.`);
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    fetchSubject("Python");
    return () => {
      if (activeControllerRef.current) activeControllerRef.current.abort();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      fetchSubject(query.trim());
    }
  };

  const handleShortcutClick = (lang: string) => {
    setQuery(lang);
    fetchSubject(lang);
  };

  const selectedStage =
    learningPath?.stages.find((s) => s.id === selectedStageId) ||
    learningPath?.stages[0] ||
    null;

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="p-6 bg-white dark:bg-space-900 rounded-3xl border border-border shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
            Explore Language & Technology Roadmaps
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Curated stages, video lectures, and official documentation for open-source mastery
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to learn? (e.g. Python, TypeScript, Go, Rust...)"
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-border focus:border-indigo-500 rounded-2xl outline-none transition-colors text-neutral-900 dark:text-neutral-100"
              aria-label="What would you like to learn?"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all shrink-0"
          >
            Explore
          </button>
        </form>

        {/* Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">Quick shortcuts:</span>
          {POPULAR_SHORTCUTS.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleShortcutClick(lang)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                activeSubject.toLowerCase() === lang.toLowerCase()
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold"
                  : "bg-neutral-100/70 dark:bg-neutral-800/60 border-border text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-700"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Assembling roadmap for {activeSubject}...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-8 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-300">{error}</h3>
          <button
            onClick={() => fetchSubject(activeSubject)}
            className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Roadmap Content */}
      {!loading && !error && learningPath && (
        <div className="space-y-6">
          {/* Path Header */}
          <div className="p-5 rounded-2xl bg-white dark:bg-space-900 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
                {learningPath.level}
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {learningPath.title}
              </h2>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                {learningPath.tagline}
              </p>
            </div>

            <button
              onClick={() => onAskAI(learningPath.subject)}
              className="self-start md:self-auto flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200/60 dark:border-indigo-800/60 transition-all shrink-0"
              title="Ask Orbit AI about this technology"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Discuss with Orbit AI</span>
            </button>
          </div>

          {/* Staged Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Stages List */}
            <div className="lg:col-span-5 space-y-3">
              {learningPath.stages.map((stage) => {
                const isSelected = stage.id === selectedStage?.id;

                return (
                  <div
                    key={stage.id}
                    onClick={() => setSelectedStageId(stage.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400/80 shadow-sm"
                        : "bg-white dark:bg-space-900 border-border hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedStageId(stage.id);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        Stage {stage.stageNumber}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{stage.estimatedHours}</span>
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-neutral-900 dark:text-white mb-1">
                      {stage.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                      {stage.summary}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Right Stage Detail Panel */}
            {selectedStage && (
              <div className="lg:col-span-7 bg-white dark:bg-space-900 rounded-3xl border border-border p-6 shadow-sm space-y-6">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Stage {selectedStage.stageNumber} Focus
                    </span>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight mt-0.5">
                      {selectedStage.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => onAskAI(learningPath.subject, selectedStage)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 transition-colors shrink-0"
                    title="Ask Orbit AI to explain this stage"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain Stage</span>
                  </button>
                </div>

                {/* Core Concepts */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Core Architectural Concepts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStage.concepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-border"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Takeaways */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-border space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">
                    Key Takeaways & Best Practices
                  </h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {selectedStage.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Video Resources */}
                {selectedStage.videos && selectedStage.videos.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Curated Video Lectures & Walkthroughs
                    </h4>
                    <div className="space-y-2">
                      {selectedStage.videos.map((vid) => (
                        <VideoResourceCard key={vid.id} video={vid} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Website & Documentation Resources */}
                {selectedStage.websites && selectedStage.websites.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Documentation & Interactive Resources
                    </h4>
                    <div className="space-y-2">
                      {selectedStage.websites.map((web, idx) => (
                        <WebResourceCard key={idx} resource={web} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
