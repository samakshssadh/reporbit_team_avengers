import { useCallback, useEffect, useState } from "react";
import { api } from "./auth";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";

// Server-backed Learn progress. Finishing every stage of a subject adds it to the tech stack as "learned".
export function useLearnProgress(subject: string | null, totalStages: number) {
  const { refresh } = useAuth();
  const { showToast } = useApp();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [learnedSkills, setLearnedSkills] = useState<string[]>([]);

  const load = useCallback(() => {
    api<{ subjects: Record<string, string[]>; learnedSkills: string[] }>("/me/learn/progress").then((r) => {
      setLearnedSkills(r.learnedSkills || []);
      if (!subject) return;
      const key = Object.keys(r.subjects).find((k) => k.toLowerCase() === subject.toLowerCase());
      setDone(new Set(key ? r.subjects[key] : []));
    }).catch(() => {});
  }, [subject]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (stageId: string) => {
    if (!subject || !totalStages) return;
    const isDone = !done.has(stageId);
    setDone((prev) => { const n = new Set(prev); if (isDone) n.add(stageId); else n.delete(stageId); return n; });
    try {
      const r = await api<{ subject: string; completed: boolean; addedToStack: boolean; upgraded: boolean }>("/me/learn/progress", { method: "POST", body: JSON.stringify({ subject, stageId, done: isDone, totalStages }) });
      if (r.completed && (r.addedToStack || r.upgraded)) {
        showToast(`🎉 You completed ${r.subject}! It's now in your tech stack as learned.`);
        setLearnedSkills((l) => [...new Set([...l, r.subject])]);
        refresh();
      }
    } catch {
      showToast("Couldn't save your progress — check your connection.", "error");
      load();
    }
  };

  const isLearned = !!subject && learnedSkills.some((s) => s.toLowerCase() === subject.toLowerCase());
  return { done, toggle, isLearned, completedCount: done.size };
}
