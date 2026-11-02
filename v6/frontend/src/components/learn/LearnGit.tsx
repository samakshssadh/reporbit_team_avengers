import React, { useState, useEffect } from "react";
import { GitCurriculumTopic } from "../../types";
import { apiService } from "../../services/api";
import { useLearnProgress } from "../../services/learnProgress";
import { VideoResourceCard } from "./ResourceCard";
import {
  GitBranch,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  BookOpen,
  RotateCcw,
  HelpCircle,
} from "lucide-react";

interface LearnGitProps {
  onAskAI: (topic: GitCurriculumTopic) => void;
}

export const LearnGit: React.FC<LearnGitProps> = ({ onAskAI }) => {
  const [topics, setTopics] = useState<GitCurriculumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("git-init-clone");
  const [completedTopicIds, setCompletedTopicIds] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("orbit_git_progress");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {};
  });
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiService
      .getGitCurriculum(controller.signal)
      .then((res) => {
        setTopics(res.data);
        if (res.data.length > 0 && !selectedTopicId) {
          setSelectedTopicId(res.data[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const progress = useLearnProgress("Git", topics.length);
  useEffect(() => { // server progress wins (synced across devices)
    if (progress.done.size) setCompletedTopicIds((prev) => { const n = { ...prev }; progress.done.forEach((id) => { n[id] = true; }); return n; });
  }, [progress.done]);

  const toggleTopicCompleted = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    progress.toggle(id);
    setCompletedTopicIds((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem("orbit_git_progress", JSON.stringify(updated));
      return updated;
    });
  };

  const resetProgress = () => {
    setCompletedTopicIds({});
    localStorage.removeItem("orbit_git_progress");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(text);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];
  const completedCount = Object.values(completedTopicIds).filter(Boolean).length;
  const progressPercent = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Loading Git curriculum and exercises...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-space-900 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Git Mastery for Open Source</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Step-by-step curriculum covering branching, rebasing, and submitting clean PRs
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground font-mono">Progress:</span>
            <span className="font-semibold font-mono text-indigo-600 dark:text-indigo-400">
              {progressPercent}% ({completedCount}/{topics.length})
            </span>
          </div>

          {completedCount > 0 && (
            <button
              onClick={resetProgress}
              className="text-xs text-muted-foreground hover:text-neutral-900 dark:hover:text-white hover:underline flex items-center space-x-1"
              title="Reset progress saved on this device"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Left topics list, Right active topic detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Topics Navigation */}
        <div className="lg:col-span-5 space-y-2">
          {topics.map((topic, index) => {
            const isSelected = topic.id === selectedTopic?.id;
            const isCompleted = !!completedTopicIds[topic.id];

            return (
              <div
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3 text-left ${
                  isSelected
                    ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400/80 shadow-sm"
                    : "bg-white dark:bg-space-900 border-border hover:border-slate-300 dark:hover:border-slate-700"
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedTopicId(topic.id);
                }}
              >
                <button
                  type="button"
                  onClick={(e) => toggleTopicCompleted(topic.id, e)}
                  className="mt-0.5 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  aria-label={`Mark ${topic.title} as ${isCompleted ? "incomplete" : "complete"}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                  )}
                </button>

                <div className="space-y-1 min-w-0 flex-1">
                  <h3
                    className={`text-xs font-semibold leading-tight ${
                      isCompleted ? "line-through text-muted-foreground" : "text-neutral-900 dark:text-white"
                    }`}
                  >
                    {topic.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {topic.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Active Topic Detail */}
        {selectedTopic && (
          <div className="lg:col-span-7 bg-white dark:bg-space-900 rounded-2xl border border-border p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Topic Guide
                </span>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight mt-0.5">
                  {selectedTopic.title}
                </h3>
              </div>

              <button
                onClick={() => onAskAI(selectedTopic)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 transition-colors"
                title="Ask Orbit AI to explain this topic"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask Orbit AI</span>
              </button>
            </div>

            {/* Scenario Box */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-border text-xs">
              <span className="font-semibold text-neutral-900 dark:text-white block mb-1">
                Real-World Scenario:
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {selectedTopic.realWorldScenario}
              </p>
            </div>

            {/* Command Snippet */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Terminal Commands
              </span>
              <div className="relative group">
                <div className="p-3 rounded-xl bg-neutral-950 text-neutral-100 font-mono text-xs overflow-x-auto pr-10">
                  <pre>{selectedTopic.commandSnippet}</pre>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedTopic.commandSnippet)}
                  className="absolute right-2 top-2 p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                  title="Copy command"
                >
                  {copiedSnippet === selectedTopic.commandSnippet ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Key Steps */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                Execution Steps
              </span>
              <ul className="space-y-1.5">
                {selectedTopic.steps.map((step, idx) => (
                  <li key={idx} className="text-xs text-neutral-700 dark:text-neutral-300 flex items-start space-x-2">
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Gotcha Warning */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-0.5">Common Gotcha:</strong>
                <p className="leading-relaxed">{selectedTopic.commonGotcha}</p>
              </div>
            </div>

            {/* Resources (Video & Official Docs) */}
            <div className="pt-2 border-t border-border space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Recommended Resources
              </span>
              {selectedTopic.videoResource && (
                <VideoResourceCard video={selectedTopic.videoResource} />
              )}
              {selectedTopic.docUrl && (
                <a
                  href={selectedTopic.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Official Git Book Chapter →</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
