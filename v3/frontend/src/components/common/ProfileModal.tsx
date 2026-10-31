import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { X, Check, Sparkles, Layers, Award } from "lucide-react";
import { ExperienceLevel } from "../../types";

const ALL_SKILLS = [
  "TypeScript",
  "JavaScript",
  "React",
  "Python",
  "Go",
  "Rust",
  "Node.js",
  "AI/ML",
  "PostgreSQL",
  "Docker",
  "C++",
  "PyTorch"
];

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: "Beginner", label: "Beginner", desc: "First time open-source contributor or junior developer" },
  { id: "Intermediate", label: "Intermediate", desc: "Comfortable with Git workflows, seeking active codebases" },
  { id: "Advanced", label: "Advanced", desc: "Experienced systems, architecture, or core maintainer" }
];

export const ProfileModal: React.FC = () => {
  const { isProfileModalOpen, setIsProfileModalOpen, profile, updateProfile } = useApp();

  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile.experienceLevel);
  const [preferredDifficulty, setPreferredDifficulty] = useState(profile.preferredDifficulty);

  // Sync internal state when opened
  useEffect(() => {
    if (isProfileModalOpen) {
      setSkills(profile.skills);
      setExperienceLevel(profile.experienceLevel);
      setPreferredDifficulty(profile.preferredDifficulty);
    }
  }, [isProfileModalOpen, profile]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isProfileModalOpen) {
        setIsProfileModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProfileModalOpen, setIsProfileModalOpen]);

  if (!isProfileModalOpen) return null;

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleSave = () => {
    updateProfile({
      skills,
      experienceLevel,
      preferredDifficulty,
    });
    setIsProfileModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-space-900 rounded-2xl shadow-2xl border border-border overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-base font-semibold text-neutral-900 dark:text-white">
                Developer Profile & Preferences
              </h2>
              <p className="text-xs text-muted-foreground">
                Matches repositories and tailors Orbit AI roadmaps to your stack
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Tech Stack */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              Your Tech Stack & Languages
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((skill) => {
                const isSelected = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-700"
                    }`}
                  >
                    <span>{skill}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              Experience Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {EXPERIENCE_LEVELS.map((level) => {
                const isSelected = experienceLevel === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setExperienceLevel(level.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-white ring-1 ring-indigo-600/20"
                        : "border-border hover:border-neutral-300 dark:hover:border-neutral-700 bg-transparent text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{level.label}</span>
                      {isSelected && <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{level.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Difficulty */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              Target Repository Difficulty
            </label>
            <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 border border-border">
              {(["All", "Beginner-Friendly", "Intermediate", "Challenging"] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setPreferredDifficulty(diff)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    preferredDifficulty === diff
                      ? "bg-white dark:bg-space-900 text-neutral-900 dark:text-white shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Changes apply instantly to Constellation recommendations
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
