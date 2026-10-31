import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitPullRequest, Loader2, Bug, AlertTriangle, Lightbulb, Paintbrush, CheckCircle2, MessageSquare, XCircle, Copy, Check, Sparkles, FileCode2, RotateCcw, ShieldAlert, UploadCloud, FileArchive, X, ClipboardPaste, FolderTree, ChevronDown } from "lucide-react";
import { api, friendlyError } from "../../services/auth";
import { useApp } from "../../context/AppContext";

type Severity = "bug" | "issue" | "suggestion" | "style";
interface ReviewComment { line: number; endLine: number; severity: Severity; category: string; title: string; explanation: string; fix: string; suggestion: string | null; }
interface PrFeedback { title: string; description: string; scope: string; suggestedTitle: string | null }
interface FileReview { path: string; language: string; lineCount: number; code: string; verdict: Verdict; summary: string; strengths: string[]; comments: ReviewComment[]; counts: Record<string, number>; droppedComments: number; failedParts: number; partial: { reviewedLines: number } | null; }
type Verdict = "approve" | "comment" | "request_changes";
interface Review {
  mode?: "project"; verdict: Verdict; summary: string; strengths: string[]; prFeedback: PrFeedback;
  comments?: ReviewComment[]; counts: Record<string, number>; fixedCode?: string | null; droppedComments?: number;
  files?: FileReview[]; notReviewed?: { path: string; reason: string }[]; ignoredCount?: number; failedChunks?: number; archive?: { name: string; sourceFiles: number };
  language: string; lineCount: number; title: string; model: { provider: string; id: string; latencyMs: number };
}

const MAX_LINES = 3000;
const MAX_ZIP_MB = 8;
const CODE_EXT = ".py,.js,.mjs,.cjs,.jsx,.ts,.tsx,.java,.go,.rs,.c,.h,.cpp,.cc,.hpp,.cs,.rb,.php,.kt,.swift,.dart,.sql,.sh,.html,.css,.scss,.vue,.svelte,.lua,.r,.scala";

const SEV = {
  bug: { icon: Bug, label: "Bug", cls: "text-rose-300 bg-rose-500/15 border-rose-400/30", bar: "bg-rose-400" },
  issue: { icon: AlertTriangle, label: "Issue", cls: "text-tangerine-200 bg-tangerine-500/15 border-tangerine-400/30", bar: "bg-tangerine-400" },
  suggestion: { icon: Lightbulb, label: "Suggestion", cls: "text-amber-200 bg-amber-400/10 border-amber-300/25", bar: "bg-amber-300" },
  style: { icon: Paintbrush, label: "Style", cls: "text-sky-200 bg-sky-400/10 border-sky-300/25", bar: "bg-sky-300" },
} as const;

const VERDICT = {
  approve: { icon: CheckCircle2, label: "Approved", cls: "from-emerald-500/25 to-emerald-500/5 border-emerald-400/30 text-emerald-200", dot: "bg-emerald-400" },
  comment: { icon: MessageSquare, label: "Commented", cls: "from-tangerine-500/25 to-tangerine-500/5 border-tangerine-400/30 text-tangerine-100", dot: "bg-tangerine-400" },
  request_changes: { icon: XCircle, label: "Changes requested", cls: "from-rose-500/25 to-rose-500/5 border-rose-400/30 text-rose-200", dot: "bg-rose-400" },
} as const;

const SAMPLE = `def average(numbers):
    total = 0
    for n in numbers:
        total += n
    return total / len(numbers)

API_KEY = "sk-live-1234567890"

def get_user(db, user_id):
    query = "SELECT * FROM users WHERE id = " + user_id
    return db.execute(query)
`;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf); let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

const LoadingSteps: React.FC<{ zip: boolean }> = ({ zip }) => {
  const steps = zip
    ? ["Unpacking your zip safely (nothing is executed)", "Picking the most important source files", "Gemma is reviewing files in parallel", "Merging the review into one PR"]
    : ["Reading your PR description", "Scanning the code line by line", "Checking bugs, security & edge cases", "Writing review comments"];
  return (
    <div className="glass rounded-3xl p-8 flex flex-col items-center text-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-tangerine-500/30 blur-xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-full liquid-lens flex items-center justify-center"><Sparkles className="w-7 h-7 text-tangerine-100 animate-pulse" /></div>
      </div>
      <p className="mt-5 text-white font-medium">Gemma is reviewing your pull request…</p>
      {zip && <p className="text-xs text-white/45 mt-1">Bigger projects can take up to a minute.</p>}
      <ul className="mt-4 space-y-2 text-sm text-white/55">
        {steps.map((s, i) => <motion.li key={s} animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }}>{s}</motion.li>)}
      </ul>
    </div>
  );
};

// Code listing with review comments pinned under the lines they refer to.
const CodeWithComments: React.FC<{ code: string; comments: ReviewComment[] }> = ({ code, comments }) => {
  const byLine = useMemo(() => { const m = new Map<number, ReviewComment[]>(); comments.forEach((c) => m.set(c.endLine, [...(m.get(c.endLine) || []), c])); return m; }, [comments]);
  const flagged = useMemo(() => { const s = new Map<number, Severity>(); comments.forEach((c) => { for (let l = c.line; l <= c.endLine; l++) if (!s.has(l)) s.set(l, c.severity); }); return s; }, [comments]);
  return (
    <div className="font-mono text-[13px] leading-6 overflow-x-auto max-h-[70vh] overflow-y-auto">
      {code.split("\n").map((ln, i) => {
        const n = i + 1, sev = flagged.get(n);
        return (
          <React.Fragment key={n}>
            <div className={`flex ${sev ? "bg-white/[0.04]" : ""}`}>
              <span className={`w-1 shrink-0 ${sev ? SEV[sev].bar : ""}`} />
              <span className="w-14 shrink-0 text-right pr-3 text-white/25 select-none">{n}</span>
              <span className="pr-4 text-white/85 whitespace-pre">{ln || " "}</span>
            </div>
            {(byLine.get(n) || []).map((c, k) => { const S = SEV[c.severity]; return (
              <div key={k} className="mx-4 my-2 font-sans rounded-2xl glass-strong p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${S.cls}`}><S.icon className="w-3 h-3" />{S.label}</span>
                  <span className="text-[11px] text-white/40 font-mono">line {c.line}{c.endLine !== c.line ? `–${c.endLine}` : ""} · {c.category}</span>
                </div>
                <p className="mt-2 text-white font-medium text-sm">{c.title}</p>
                {c.explanation && <p className="mt-1 text-sm text-white/70 leading-relaxed">{c.explanation}</p>}
                {c.fix && <p className="mt-2 text-sm text-tangerine-100/90"><strong className="text-tangerine-200">How to fix:</strong> {c.fix}</p>}
                {c.suggestion && <pre className="mt-3 p-3 rounded-xl bg-black/30 border border-emerald-400/15 text-emerald-100/90 text-[12px] overflow-x-auto whitespace-pre">{c.suggestion}</pre>}
              </div>
            ); })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const CountPills: React.FC<{ counts: Record<string, number>; small?: boolean }> = ({ counts, small }) => (
  <div className="flex gap-1.5 flex-wrap">
    {(Object.keys(SEV) as Severity[]).map((k) => { const S = SEV[k]; return (
      <span key={k} className={`flex items-center gap-1 ${small ? "px-1.5 py-0.5 text-[10px]" : "px-3 py-1.5 text-xs"} rounded-full border ${S.cls}`}><S.icon className={small ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />{counts[k] || 0}{small ? "" : ` ${S.label}`}</span>
    ); })}
  </div>
);

export const DummyPRPage: React.FC = () => {
  const { setActiveTab, createChatSession } = useApp() as any;
  const [source, setSource] = useState<"paste" | "upload">("paste");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filename, setFilename] = useState("");
  const [code, setCode] = useState("");
  const [zip, setZip] = useState<{ name: string; size: number; base64: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [submittedCode, setSubmittedCode] = useState("");
  const [showFixed, setShowFixed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeFile, setActiveFile] = useState(0);
  const [showSkipped, setShowSkipped] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const lines = code ? code.split("\n").length : 0;
  const tooLong = lines > MAX_LINES;
  const usingZip = source === "upload" && !!zip;
  const canSubmit = !busy && title.trim().length >= 3 && (usingZip || (!!code.trim() && !tooLong));

  const handleFile = async (f: File) => {
    setError(null);
    if (/\.zip$/i.test(f.name)) {
      if (f.size > MAX_ZIP_MB * 1024 * 1024) { setError(`That zip is ${(f.size / 1048576).toFixed(1)} MB — the limit is ${MAX_ZIP_MB} MB. Remove node_modules, build folders and images, then zip again.`); return; }
      const base64 = toBase64(await f.arrayBuffer());
      setZip({ name: f.name, size: f.size, base64 });
      if (!title) setTitle(`Review ${f.name.replace(/\.zip$/i, "")}`);
    } else {
      if (f.size > 400 * 1024) { setError("That file is too large (max 400 KB). Zip your project instead."); return; }
      const text = await f.text();
      if (text.includes("\u0000")) { setError("That looks like a binary file. Upload source code or a .zip."); return; }
      setSource("paste"); setCode(text); setFilename(f.name); setZip(null);
      if (!title) setTitle(`Update ${f.name}`);
    }
  };

  const submit = async () => {
    setError(null); setReview(null); setBusy(true); setShowFixed(false); setActiveFile(0); setShowSkipped(false);
    try {
      const r = usingZip
        ? await api<Review>("/review/zip", { method: "POST", body: JSON.stringify({ title: title.trim(), description: description.trim() || null, filename: zip!.name, zipBase64: zip!.base64 }) })
        : await api<Review>("/review", { method: "POST", body: JSON.stringify({ title: title.trim(), description: description.trim() || null, code, filename: filename.trim() || null }) });
      setSubmittedCode(code);
      setReview(r);
    } catch (e: any) {
      setError(e?.code === "MODEL_UNAVAILABLE" || e?.code === "UPSTREAM_TIMEOUT"
        ? `Gemma isn't reachable right now (${e.code}). No review was generated — please try again in a moment.`
        : friendlyError(e));
    } finally { setBusy(false); }
  };

  const copyFixed = async () => {
    if (!review?.fixedCode) return;
    try { await navigator.clipboard.writeText(review.fixedCode); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  const field = "w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-tangerine-400/60 focus:ring-4 focus:ring-tangerine-500/10";
  const isProject = review?.mode === "project" && review.files?.length;
  const file = isProject ? review!.files![Math.min(activeFile, review!.files!.length - 1)] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-tangerine-300">Practice before you ship</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Dummy <span className="text-gradient">Pull Request</span></h1>
          <p className="mt-2 text-white/60 max-w-2xl">Paste code or upload a whole project as a <strong className="text-white/80">.zip</strong>. Google Gemma reviews it like a maintainer — bugs, security, edge cases and style — and shows exactly how to fix each one. Your code is never executed.</p>
        </div>
        {!review && !busy && (
          <button onClick={() => { setSource("paste"); setZip(null); setTitle("Add average and user lookup helpers"); setDescription("Adds an average() helper and a get_user() DB lookup."); setFilename("helpers.py"); setCode(SAMPLE); }}
            className="glass px-4 py-2.5 rounded-2xl text-sm text-white/80 hover:text-white self-start md:self-auto">Load a sample PR</button>
        )}
      </div>

      {!review && (
        <div className="mt-8 grid lg:grid-cols-[1fr,1.4fr] gap-6">
          <div className="glass-strong rounded-3xl p-6 space-y-4 h-fit">
            <div className="flex items-center gap-2 text-white"><GitPullRequest className="w-5 h-5 text-tangerine-300" /><span className="font-medium">Open a pull request</span></div>
            <label className="block"><span className="text-xs text-white/50">Title</span>
              <input className={field + " mt-1"} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="fix: handle empty input in average()" maxLength={200} /></label>
            <label className="block"><span className="text-xs text-white/50">Description — what does this change and why?</span>
              <textarea className={field + " mt-1 min-h-[120px] resize-y"} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain the problem, your fix, and how you tested it." maxLength={4000} /></label>
            {source === "paste" && (
              <label className="block"><span className="text-xs text-white/50">File name (optional, helps detect the language)</span>
                <input className={field + " mt-1 font-mono text-sm"} value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="src/utils.py" maxLength={120} /></label>
            )}
            {error && <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-400/20 rounded-2xl px-4 py-3" role="alert">{error}</div>}
            <button onClick={submit} disabled={!canSubmit} className="btn-tangerine w-full py-3.5 rounded-2xl flex items-center justify-center gap-2">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Reviewing…</> : <><GitPullRequest className="w-4 h-4" /> Open Dummy PR</>}
            </button>
            {title.trim().length > 0 && title.trim().length < 3 && <p className="text-xs text-white/40">Title needs at least 3 characters.</p>}
          </div>

          <div className="glass rounded-3xl overflow-hidden flex flex-col min-h-[540px]">
            {/* Paste / Upload switch */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex p-0.5 rounded-full bg-white/5 border border-white/10 text-xs">
                {([["paste", "Paste code", ClipboardPaste], ["upload", "Upload file / .zip", UploadCloud]] as const).map(([id, label, Icon]) => (
                  <button key={id} onClick={() => setSource(id)} className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 ${source === id ? "liquid-lens text-white" : "text-white/55 hover:text-white"}`}><Icon className="w-3.5 h-3.5" />{label}</button>
                ))}
              </div>
              {source === "paste" && <span className={`text-xs ${tooLong ? "text-rose-300" : "text-white/45"}`}>{lines} / {MAX_LINES} lines{lines > 350 ? " · reviewed in parts" : ""}</span>}
            </div>

            {busy ? <div className="flex-1 flex items-center justify-center p-6"><LoadingSteps zip={usingZip} /></div> : source === "paste" ? (
              <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} placeholder="Paste your code file here…"
                className="flex-1 w-full p-5 bg-transparent font-mono text-[13px] leading-6 text-white/90 placeholder:text-white/25 focus:outline-none resize-none" aria-label="Code" />
            ) : (
              <div className="flex-1 p-6 flex flex-col">
                <input ref={fileInput} type="file" accept={`.zip,${CODE_EXT}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
                {zip ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-3xl liquid-lens flex items-center justify-center"><FileArchive className="w-9 h-9 text-tangerine-100" /></div>
                    <p className="mt-4 text-white font-medium">{zip.name}</p>
                    <p className="text-sm text-white/50">{(zip.size / 1024).toFixed(0)} KB · ready for review</p>
                    <button onClick={() => setZip(null)} className="mt-4 text-xs text-white/55 hover:text-white flex items-center gap-1"><X className="w-3.5 h-3.5" /> Remove</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInput.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                    className={`flex-1 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center p-8 transition ${dragOver ? "border-tangerine-400 bg-tangerine-500/10" : "border-white/15 hover:border-tangerine-400/50 hover:bg-white/[0.03]"}`}>
                    <UploadCloud className="w-12 h-12 text-tangerine-300" />
                    <p className="mt-4 text-white font-medium">Drop your project <span className="text-gradient">.zip</span> or a code file here</p>
                    <p className="mt-1 text-sm text-white/50">or click to browse · zip up to {MAX_ZIP_MB} MB</p>
                    <p className="mt-4 text-xs text-white/35 max-w-sm">node_modules, build folders, lock files, images and .env files are ignored automatically. Gemma reviews the most important source files first.</p>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {review && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
            {(() => { const V = VERDICT[review.verdict]; return (
              <div className={`rounded-3xl border bg-gradient-to-br ${V.cls} p-6 flex flex-col md:flex-row md:items-center gap-5`}>
                <V.icon className="w-10 h-10 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest opacity-80 font-mono">{V.label}{review.archive ? ` · ${review.archive.name}` : ""}</p>
                  <h2 className="text-2xl font-semibold text-white mt-1">{review.title}</h2>
                  <p className="mt-2 text-white/80 leading-relaxed">{review.summary}</p>
                </div>
                <CountPills counts={review.counts} />
              </div>
            ); })()}

            <div className={`grid gap-6 ${isProject ? "lg:grid-cols-[260px,1fr,300px]" : "lg:grid-cols-[1.6fr,1fr]"}`}>
              {/* File list (projects) */}
              {isProject && (
                <div className="glass rounded-3xl p-3 h-fit lg:sticky lg:top-24">
                  <p className="px-2 py-1.5 text-xs text-white/50 flex items-center gap-1.5"><FolderTree className="w-3.5 h-3.5 text-tangerine-300" />{review.files!.length} file(s) reviewed</p>
                  <ul className="mt-1 space-y-1 max-h-[60vh] overflow-y-auto">
                    {review.files!.map((f, i) => (
                      <li key={f.path}>
                        <button onClick={() => setActiveFile(i)} className={`w-full text-left px-3 py-2 rounded-2xl ${i === activeFile ? "liquid-lens" : "hover:bg-white/5"}`}>
                          <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full shrink-0 ${VERDICT[f.verdict].dot}`} /><span className="text-xs text-white truncate font-mono">{f.path.split("/").pop()}</span></div>
                          <p className="text-[10px] text-white/35 truncate pl-4">{f.path}</p>
                          <div className="pl-4 mt-1"><CountPills counts={f.counts} small /></div>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {!!(review.notReviewed?.length || review.ignoredCount) && (
                    <div className="mt-2 border-t border-white/10 pt-2">
                      <button onClick={() => setShowSkipped(!showSkipped)} className="w-full px-2 py-1.5 text-[11px] text-white/50 hover:text-white flex items-center justify-between">
                        <span>{review.notReviewed?.length || 0} skipped · {review.ignoredCount || 0} ignored</span><ChevronDown className={`w-3.5 h-3.5 transition ${showSkipped ? "rotate-180" : ""}`} />
                      </button>
                      {showSkipped && <ul className="px-2 space-y-1 max-h-48 overflow-y-auto">{review.notReviewed!.map((x) => <li key={x.path} className="text-[10px] text-white/45"><span className="font-mono text-white/60">{x.path}</span> — {x.reason}</li>)}</ul>}
                    </div>
                  )}
                </div>
              )}

              {/* Code */}
              <div className="glass rounded-3xl overflow-hidden min-w-0">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 text-xs text-white/55">
                  <span className="flex items-center gap-2 min-w-0"><FileCode2 className="w-4 h-4 text-tangerine-300 shrink-0" /><span className="truncate">{isProject ? `${file!.path} · ${file!.language} · ${file!.lineCount} lines` : `${filename || "code"} · ${review.language} · ${review.lineCount} lines`}</span></span>
                  {!isProject && review.fixedCode && (
                    <div className="flex p-0.5 rounded-full bg-white/5 border border-white/10">
                      {["Review", "Fixed version"].map((t, i) => <button key={t} onClick={() => setShowFixed(i === 1)} className={`px-3 py-1 rounded-full ${showFixed === (i === 1) ? "liquid-lens text-white" : "text-white/55"}`}>{t}</button>)}
                    </div>
                  )}
                </div>
                {isProject && file!.summary && <p className="px-5 py-3 text-sm text-white/70 border-b border-white/10">{file!.summary}{file!.partial ? ` (first ${file!.partial.reviewedLines} lines reviewed)` : ""}{file!.failedParts ? ` · ${file!.failedParts} part(s) couldn't be reviewed` : ""}</p>}
                {!isProject && showFixed && review.fixedCode ? (
                  <div className="relative">
                    <button onClick={copyFixed} className="absolute top-3 right-3 glass px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? "Copied" : "Copy"}</button>
                    <pre className="p-5 font-mono text-[13px] leading-6 text-emerald-100/90 overflow-x-auto whitespace-pre">{review.fixedCode}</pre>
                  </div>
                ) : (
                  <CodeWithComments code={isProject ? file!.code : submittedCode} comments={isProject ? file!.comments : review.comments || []} />
                )}
              </div>

              {/* Side panel */}
              <div className="space-y-4">
                <div className="glass rounded-3xl p-5">
                  <h3 className="font-medium text-white flex items-center gap-2"><GitPullRequest className="w-4 h-4 text-tangerine-300" /> Feedback on your PR</h3>
                  <dl className="mt-3 space-y-3 text-sm">
                    {review.prFeedback?.title && <div><dt className="text-white/45 text-xs">Title</dt><dd className="text-white/80">{review.prFeedback.title}</dd></div>}
                    {review.prFeedback?.description && <div><dt className="text-white/45 text-xs">Description</dt><dd className="text-white/80">{review.prFeedback.description}</dd></div>}
                    {review.prFeedback?.scope && <div><dt className="text-white/45 text-xs">Scope</dt><dd className="text-white/80">{review.prFeedback.scope}</dd></div>}
                    {review.prFeedback?.suggestedTitle && <div className="rounded-xl liquid-lens p-3"><dt className="text-tangerine-100/80 text-xs">Suggested title</dt><dd className="text-white font-mono text-xs mt-1">{review.prFeedback.suggestedTitle}</dd></div>}
                  </dl>
                </div>
                {review.strengths?.length > 0 && (
                  <div className="glass rounded-3xl p-5">
                    <h3 className="font-medium text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300" /> What you did well</h3>
                    <ul className="mt-3 space-y-1.5 text-sm text-white/75 list-disc pl-5">{review.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                <div className="glass rounded-3xl p-5 text-xs text-white/50 space-y-1">
                  <p className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-tangerine-300" /> Reviewed by <strong className="text-white/80">Google Gemma · {review.model.id}</strong> in {(review.model.latencyMs / 1000).toFixed(1)}s</p>
                  <p className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Code was read, never executed.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setReview(null); setShowFixed(false); }} className="flex-1 glass px-4 py-3 rounded-2xl text-sm flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /> Revise</button>
                  <button onClick={() => { createChatSession?.(); setActiveTab("chat"); }} className="flex-1 btn-tangerine px-4 py-3 rounded-2xl text-sm flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> Ask Orbit AI</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
