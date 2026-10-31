import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { LearnGit } from "./LearnGit";
import { LearnLanguages } from "./LearnLanguages";
import { GitBranch, Code2, ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import { GitCurriculumTopic, LearningStage } from "../../types";

type LearnPathChoice = "overview" | "git" | "languages";

export const LearnPage: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<LearnPathChoice>("overview");
  const { createChatSession, setActiveTab } = useApp();

  const handleAskAIFromGit = (topic: GitCurriculumTopic) => {
    createChatSession();
    setActiveTab("chat");
  };

  const handleAskAIFromLanguage = (subject: string, stage?: LearningStage) => {
    createChatSession();
    setActiveTab("chat");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb / Navigation */}
      {currentPath !== "overview" && (
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentPath("overview")}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-space-900 border border-border hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Learn Overview</span>
          </button>
          <span className="text-muted-foreground">•</span>
          <span className="text-xs font-semibold text-neutral-900 dark:text-white">
            {currentPath === "git" ? "Learn Git" : "Learn Languages"}
          </span>
        </div>
      )}

      {/* Path 1: Overview with the Two Prominent Choices */}
      {currentPath === "overview" && (
        <div className="space-y-8 py-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Contribution Academy
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Two Learning Paths. One Destination.
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Equip yourself with the collaborative workflows and language mastery needed to land your first merged pull requests in top open-source projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-2">
            {/* Card 1: Learn Git */}
            <div
              onClick={() => setCurrentPath("git")}
              className="p-8 rounded-3xl bg-white dark:bg-space-900 border border-border hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group shadow-sm hover:shadow-xl flex flex-col justify-between space-y-6"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setCurrentPath("git");
              }}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                  <GitBranch className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Learn Git
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                    Master the open-source collaboration lifecycle: branching conventions, atomic commits, interactive rebasing, conflict resolution, and perfect pull requests.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/80 text-xs text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                <span>6 Core Stages • Hands-on Commands</span>
                <span>Start Path →</span>
              </div>
            </div>

            {/* Card 2: Learn Languages */}
            <div
              onClick={() => setCurrentPath("languages")}
              className="p-8 rounded-3xl bg-white dark:bg-space-900 border border-border hover:border-violet-400 dark:hover:border-violet-600 transition-all cursor-pointer group shadow-sm hover:shadow-xl flex flex-col justify-between space-y-6"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setCurrentPath("languages");
              }}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    Learn Languages
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                    Deepen your skills in Python, TypeScript, Go, Rust, or modern web frameworks. Complete with curated YouTube lessons and authoritative documentation.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/80 text-xs text-violet-600 dark:text-violet-400 font-semibold group-hover:translate-x-1 transition-transform">
                <span>Interactive Roadmaps • Safe Resources</span>
                <span>Explore Stacks →</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Path 2: Git Curriculum */}
      {currentPath === "git" && <LearnGit onAskAI={handleAskAIFromGit} />}

      {/* Path 3: Languages Curriculum */}
      {currentPath === "languages" && <LearnLanguages onAskAI={handleAskAIFromLanguage} />}
    </div>
  );
};
