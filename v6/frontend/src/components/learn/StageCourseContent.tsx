import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Lightbulb, Hammer, Target, ListChecks, XCircle, BookMarked } from "lucide-react";
import { LearningStage } from "../../types";
import { PYTHON_BUILTINS } from "../../data/pythonCourse";

// Renders the richer course content of a stage (description, modules, project, quiz).
// Used by the Python course. Passing the quiz (2 of 3) is what marks the stage complete.

interface Props {
  stage: LearningStage;
  done: boolean;
  onPassed: () => void;
}

const code = (text: string) =>
  text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`")
      ? <code key={i} className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono text-tangerine-300">{part.slice(1, -1)}</code>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );

export const StageCourseContent: React.FC<Props> = ({ stage, done, onPassed }) => {
  const [open, setOpen] = useState<string | null>(stage.modules?.[0]?.id ?? null);
  const [showSheet, setShowSheet] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  useEffect(() => { setOpen(stage.modules?.[0]?.id ?? null); setAnswers({}); setChecked(false); setShowSheet(false); }, [stage.id]);

  const quiz = stage.quiz || [];
  const score = quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
  const needed = Math.ceil(quiz.length * 2 / 3);
  const passed = checked && score >= needed;

  const check = () => {
    setChecked(true);
    if (score >= needed && !done) onPassed();
  };

  return (
    <div className="space-y-6">
      {/* What this stage teaches */}
      {stage.description && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><BookMarked className="w-3.5 h-3.5" /> What this stage teaches</h4>
          <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">{stage.description}</p>
          {stage.youCanNow && (
            <p className="text-xs rounded-xl px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex gap-2">
              <Target className="w-4 h-4 shrink-0" /><span><strong>By the end you can</strong> {stage.youCanNow}</span>
            </p>
          )}
        </div>
      )}

      {/* Modules */}
      {stage.modules && stage.modules.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Modules ({stage.modules.length})</h4>
          <div className="space-y-2">
            {stage.modules.map((m) => {
              const isOpen = open === m.id;
              return (
                <div key={m.id} className="rounded-2xl border border-border overflow-hidden">
                  <button type="button" onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen}
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-white hover:bg-white/5">
                    <span>{m.title}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3">
                          <ul className="space-y-1.5 text-xs text-muted-foreground">
                            {m.topics.map((t, i) => (
                              <li key={i} className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-tangerine-400 shrink-0 mt-0.5" /><span className="leading-relaxed">{code(t)}</span></li>
                            ))}
                          </ul>
                          {m.id === "py-1-8" && (
                            <button type="button" onClick={() => setShowSheet((v) => !v)} className="text-xs font-semibold text-tangerine-300 underline underline-offset-2">
                              {showSheet ? "Hide" : "Show"} the built-in functions cheat sheet
                            </button>
                          )}
                          {m.tryIt && (
                            <p className="text-xs rounded-xl px-3 py-2 bg-tangerine-500/10 border border-tangerine-500/30 text-neutral-800 dark:text-neutral-200 flex gap-2">
                              <Lightbulb className="w-4 h-4 text-tangerine-400 shrink-0" /><span><strong>Try it:</strong> {code(m.tryIt)}</span>
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Built-in functions cheat sheet (Stage 1) */}
      {showSheet && stage.id === "pyc-s1" && (
        <div className="rounded-2xl border border-border p-4 space-y-3" aria-label="Built-in functions cheat sheet">
          <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Built-in functions cheat sheet</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {PYTHON_BUILTINS.map((g) => (
              <div key={g.group} className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.group}</p>
                {g.items.map((it) => (
                  <div key={it.name} className="text-xs">
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white">{it.name}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">{it.example}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project */}
      {stage.project && (
        <div className="rounded-2xl border border-border p-4 space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Hammer className="w-3.5 h-3.5" /> Stage project</h4>
          <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">{code(stage.project)}</p>
        </div>
      )}

      {/* Quiz */}
      {quiz.length > 0 && (
        <div id={`quiz-${stage.id}`} className="rounded-2xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stage check: {quiz.length} questions</h4>
            {done && <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Stage complete</span>}
          </div>
          {!done && <p className="text-xs text-muted-foreground">Get at least {needed} of {quiz.length} right to complete this stage.</p>}
          {quiz.map((q, i) => (
            <fieldset key={i} className="space-y-1.5">
              <legend className="text-sm font-medium text-neutral-900 dark:text-white mb-1">{i + 1}. {code(q.q)}</legend>
              {q.options.map((opt, j) => {
                const chosen = answers[i] === j;
                const right = checked && j === q.answer;
                const wrong = checked && chosen && j !== q.answer;
                return (
                  <label key={j} className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 border cursor-pointer transition ${right ? "border-emerald-500/60 bg-emerald-500/10" : wrong ? "border-rose-500/60 bg-rose-500/10" : chosen ? "border-tangerine-400/60 bg-tangerine-500/10" : "border-border hover:border-tangerine-400/40"}`}>
                    <input type="radio" name={`${stage.id}-q${i}`} checked={chosen} onChange={() => { setAnswers((a) => ({ ...a, [i]: j })); setChecked(false); }} className="accent-orange-500" />
                    <span className="text-neutral-800 dark:text-neutral-200">{code(opt)}</span>
                  </label>
                );
              })}
              {checked && <p className={`text-[11px] ${answers[i] === q.answer ? "text-emerald-400" : "text-rose-400"}`}>{answers[i] === q.answer ? "Correct. " : "Not quite. "}{code(q.why)}</p>}
            </fieldset>
          ))}
          <div className="flex items-center gap-3">
            <button type="button" onClick={check} disabled={Object.keys(answers).length < quiz.length}
              className="btn-tangerine px-4 py-2 rounded-xl text-xs disabled:opacity-40 disabled:cursor-not-allowed">Check answers</button>
            {checked && (
              <span className={`text-xs font-semibold flex items-center gap-1 ${passed ? "text-emerald-400" : "text-rose-400"}`}>
                {passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {score}/{quiz.length}: {passed ? "passed, stage complete!" : "review the modules and try again"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
