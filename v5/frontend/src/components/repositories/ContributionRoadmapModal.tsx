import React, { useState, useEffect } from "react";
import { OrbitLoader } from "../common/OrbitLoader";
import { Repository, ContributionRoadmap, RoadmapStep } from "../../types";
import { apiService } from "../../services/api";
import {
  X,
  Map,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Sparkles,
  Terminal,
  FileCode,
  Lightbulb,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface ContributionRoadmapModalProps {
  repository: Repository | null;
  isOpen: boolean;
  onClose: () => void;
  onAskAIAboutStep: (repo: Repository, step: RoadmapStep) => void;
}

export const ContributionRoadmapModal: React.FC<ContributionRoadmapModalProps> = ({
  repository,
  isOpen,
  onClose,
  onAskAIAboutStep,
}) => {
  const [roadmap, setRoadmap] = useState<ContributionRoadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && repository) {
      setLoading(true);
      const controller = new AbortController();
      apiService
        .getContributionRoadmap(repository.id, controller.signal)
        .then((res) => {
          setRoadmap(res.data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });

      return () => controller.abort();
    }
  }, [isOpen, repository]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !repository) return null;

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const totalSteps = roadmap?.steps.length || 0;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-white dark:bg-space-900 rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-neutral-50/50 dark:bg-neutral-900/40 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Contribution Roadmap
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {repository.fullName}
              </span>
            </div>
            <h2 id="roadmap-modal-title" className="text-xl font-bold text-neutral-900 dark:text-white">
              First Pull Request Guide
            </h2>
            <div className="flex items-center space-x-3 text-xs text-muted-foreground pt-1">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Estimated: {roadmap?.estimatedTimeToFirstPR || "3 - 5 hours"}</span>
              </span>
              <span>•</span>
              <span>Progress: {progressPercent}% ({completedCount}/{totalSteps} steps completed)</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close roadmap dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5">
          <div
            className="bg-indigo-600 h-1.5 transition-all duration-300 rounded-r"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Roadmap Body */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-14 flex justify-center">
              <OrbitLoader size={80} label={`Orbit AI is reading ${repository.name}'s docs…`} sub="Writing a roadmap personalised to your stack" />
            </div>
          ) : roadmap ? (
            <div className="space-y-6">
              {/* Orbit AI: personalised intro */}
              {(roadmap as any).intro ? (
                <div className="rounded-2xl liquid-lens p-5">
                  <p className="text-[11px] uppercase tracking-widest font-mono text-tangerine-100/90 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Orbit AI · made for you</p>
                  <p className="mt-2 text-sm text-white leading-relaxed">{(roadmap as any).intro}</p>
                  <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
                    {(roadmap as any).youKnow?.length > 0 && <div><p className="text-white/60 mb-1.5">You can reuse</p><div className="flex flex-wrap gap-1.5">{(roadmap as any).youKnow.map((k: string) => <span key={k} className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-100">{k}</span>)}</div></div>}
                    {(roadmap as any).youWillLearn?.length > 0 && <div><p className="text-white/60 mb-1.5">You'll learn</p><div className="flex flex-wrap gap-1.5">{(roadmap as any).youWillLearn.map((k: string) => <span key={k} className="px-2 py-0.5 rounded-full bg-tangerine-500/25 border border-tangerine-300/30 text-white">{k}</span>)}</div></div>}
                  </div>
                </div>
              ) : (roadmap as any).generatedBy === "rules" && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs text-white/60">Orbit AI is offline, so these are standard steps based on the repository's documents. Try again later for a roadmap personalised to you.</div>
              )}
              {/* Prerequisites Card */}
              {roadmap.prerequisites && roadmap.prerequisites.length > 0 && (
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-border text-xs">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block mb-1">
                    Prerequisites:
                  </span>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    {roadmap.prerequisites.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps timeline */}
              <div className="space-y-5">
                {roadmap.steps.map((step) => {
                  const isDone = !!completedSteps[step.stepNumber];

                  return (
                    <div
                      key={step.stepNumber}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDone
                          ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
                          : "bg-white dark:bg-space-900 border-border hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <button
                            type="button"
                            onClick={() => toggleStep(step.stepNumber)}
                            className="mt-0.5 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                            aria-label={`Mark step ${step.stepNumber} as ${isDone ? "incomplete" : "complete"}`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                            ) : (
                              <Circle className="w-5 h-5 text-neutral-400" />
                            )}
                          </button>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold border border-indigo-200/50 dark:border-indigo-800/40">
                                {step.category}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                Step {step.stepNumber} of {roadmap.steps.length}
                              </span>
                            </div>

                            <h3
                              className={`text-sm font-semibold ${
                                isDone
                                  ? "line-through text-muted-foreground"
                                  : "text-neutral-900 dark:text-white"
                              }`}
                            >
                              {step.title}
                            </h3>

                            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed pt-1">
                              {step.summary}
                            </p>
                          </div>
                        </div>

                        {/* Orbit AI help action for step */}
                        <button
                          type="button"
                          onClick={() => onAskAIAboutStep(repository, step)}
                          className="shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200/60 transition-colors"
                          title="Ask Orbit AI to explain or assist with this step"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span className="hidden sm:inline">Explain this step</span>
                        </button>
                      </div>

                      {/* Step Details & Commands */}
                      <div className="mt-3.5 pl-8 space-y-3">
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="leading-normal">
                              {detail}
                            </li>
                          ))}
                        </ul>

                        {/* Command block if provided */}
                        {step.commandToRun && (
                          <div className="relative group">
                            <div className="p-2.5 rounded-xl bg-neutral-950 text-neutral-100 font-mono text-[11px] overflow-x-auto pr-10 flex items-center">
                              <code>{step.commandToRun}</code>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyCommand(step.commandToRun!)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                              title="Copy command"
                            >
                              {copiedCommand === step.commandToRun ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* Orbit AI note personalised to the student */}
                        {(step as any).forYou && (
                          <div className="p-2.5 rounded-xl liquid-lens text-[12px] text-white flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-tangerine-100 shrink-0 mt-0.5" />
                            <span><strong>For you:</strong> {(step as any).forYou}</span>
                          </div>
                        )}

                        {/* Pro-Tip Box */}
                        {step.proTip && (
                          <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start space-x-2">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Pro-tip:</strong> {step.proTip}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Unable to load roadmap at this moment.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900/60 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Progress is saved locally on your device
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
