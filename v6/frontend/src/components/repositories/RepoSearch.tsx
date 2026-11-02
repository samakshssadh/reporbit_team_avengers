import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Star, Globe2, Sparkles, CornerDownLeft, X, Clock } from "lucide-react";
import { Repository } from "../../types";

// Command-palette search:
//  • instant fuzzy filter of the repos already in your constellation (as you type)
//  • live search across GitHub (debounced, cancelable, cached server-side)
//  • keyboard: "/" to focus, ↑ ↓ to move, Enter to open, Esc to close
interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  local: Repository[];
  onOpen: (repo: Repository) => void;
}

function fuzzyScore(q: string, text: string): number {
  const t = text.toLowerCase();
  if (t.includes(q)) return 100 - t.indexOf(q);
  let ti = 0, hits = 0;
  for (const ch of q) { const k = t.indexOf(ch, ti); if (k === -1) return 0; hits += k === ti ? 2 : 1; ti = k + 1; }
  return hits;
}

function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="bg-tangerine-500/30 text-inherit rounded px-0.5">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

const RECENT_KEY = "reporbit_recent_searches";

export const RepoSearch: React.FC<Props> = ({ query, onQueryChange, local, onOpen }) => {
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; } });
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const q = query.trim();

  // "/" focuses search; click outside closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) { e.preventDefault(); inputRef.current?.focus(); setOpen(true); }
    };
    const onClick = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey); document.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, []);

  // Live GitHub search (debounced 280 ms, previous request cancelled).
  useEffect(() => {
    setErr(null);
    if (q.length < 2) { setRemote([]); setLoading(false); return; }
    const ctl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/search/repositories?q=${encodeURIComponent(q)}`, { credentials: "include", signal: ctl.signal });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error?.message || "Search failed");
        setRemote(j.items || []);
      } catch (e: any) {
        if (e.name !== "AbortError") setErr(e.message || "Search failed");
      } finally { if (!ctl.signal.aborted) setLoading(false); }
    }, 280);
    return () => { ctl.abort(); window.clearTimeout(t); };
  }, [q]);

  const localHits = useMemo(() => {
    if (!q) return [];
    const ql = q.toLowerCase();
    return local.map((r) => ({ r, s: Math.max(fuzzyScore(ql, r.fullName) * 2, fuzzyScore(ql, r.description || ""), ...r.topics.map((t) => fuzzyScore(ql, t)), ...r.languages.map((l) => fuzzyScore(ql, l))) }))
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 5).map((x) => x.r);
  }, [q, local]);
  const remoteHits = useMemo(() => remote.filter((r) => !localHits.some((l) => l.id === r.id)).slice(0, 8), [remote, localHits]);
  const rows = [...localHits.map((r) => ({ r, where: "local" as const })), ...remoteHits.map((r) => ({ r, where: "github" as const }))];
  useEffect(() => { setActive(0); }, [q, remote.length]);

  const choose = (r: Repository) => {
    const next = [q, ...recent.filter((x) => x.toLowerCase() !== q.toLowerCase())].filter(Boolean).slice(0, 6);
    setRecent(next); try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setOpen(false); inputRef.current?.blur(); onOpen(r);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(rows.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" && rows[active]) { e.preventDefault(); choose(rows[active].r); }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  return (
    <div ref={boxRef} className="relative flex-1 min-w-[220px]">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { onQueryChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search your constellation or all of GitHub…"
        aria-label="Search repositories"
        className="w-full pl-10 pr-20 py-2.5 text-sm rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-tangerine-400/60 focus:ring-4 focus:ring-tangerine-500/15 transition"
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {loading && <Loader2 className="w-4 h-4 animate-spin text-tangerine-300" />}
        {query ? (
          <button onClick={() => { onQueryChange(""); inputRef.current?.focus(); }} className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10" aria-label="Clear search"><X className="w-3.5 h-3.5" /></button>
        ) : <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-md border border-white/15 text-white/45 font-mono">/</kbd>}
      </div>

      <AnimatePresence>
        {open && (q.length > 0 || recent.length > 0) && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute z-40 left-0 right-0 mt-2 glass-strong rounded-2xl p-2 max-h-[60vh] overflow-y-auto" role="listbox">
            {!q && recent.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-white/40 font-mono">Recent</p>
                {recent.map((r) => <button key={r} onClick={() => onQueryChange(r)} className="w-full text-left px-3 py-2 rounded-xl text-sm text-white/75 hover:bg-white/[0.06] flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-white/40" />{r}</button>)}
              </div>
            )}
            {q && localHits.length > 0 && <p className="px-3 pt-1.5 pb-1 text-[10px] uppercase tracking-widest text-white/40 font-mono flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-tangerine-300" />In your constellation</p>}
            {rows.map(({ r, where }, i) => (
              <React.Fragment key={`${where}-${r.id}`}>
                {where === "github" && i === localHits.length && <p className="px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-widest text-white/40 font-mono flex items-center gap-1.5"><Globe2 className="w-3 h-3 text-tangerine-300" />All of GitHub</p>}
                <button role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => choose(r)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition ${i === active ? "liquid-lens" : "hover:bg-white/[0.05]"}`}>
                  <span className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-tangerine-300 to-rose-500 text-[#1b1d27] text-[11px] font-bold flex items-center justify-center">{r.owner.slice(0, 2).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-white truncate"><span className="text-white/50"><Highlight text={r.owner} q={q} />/</span><Highlight text={r.name} q={q} /></span>
                    <span className="block text-xs text-white/50 truncate">{r.description || "No description"}</span>
                  </span>
                  <span className="hidden sm:flex items-center gap-2 shrink-0 text-[11px] text-white/50">
                    {r.primaryLanguage && r.primaryLanguage !== "Unknown" && <span className="px-2 py-0.5 rounded-full bg-white/[0.06]">{r.primaryLanguage}</span>}
                    {!r.starsUnknown && <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />{r.stars >= 1000 ? `${(r.stars / 1000).toFixed(1)}k` : r.stars}</span>}
                    <span className="font-mono text-tangerine-300">{r.matchScore}%</span>
                  </span>
                  {i === active && <CornerDownLeft className="w-3.5 h-3.5 text-white/40 shrink-0" />}
                </button>
              </React.Fragment>
            ))}
            {q.length >= 2 && !loading && !rows.length && !err && <p className="px-3 py-6 text-center text-sm text-white/50">No repositories found for “{q}”. Try a language, topic or project name.</p>}
            {q.length === 1 && <p className="px-3 py-3 text-xs text-white/40">Keep typing to search all of GitHub…</p>}
            {loading && !remote.length && q.length >= 2 && Array.from({ length: 3 }).map((_, i) => <div key={i} className="mx-2 my-1.5 h-12 rounded-xl shimmer" />)}
            {err && <p className="px-3 py-3 text-xs text-rose-300">{err}</p>}
            {q && <p className="px-3 pt-2 pb-1 text-[10px] text-white/35 flex gap-3"><span>↑↓ navigate</span><span>↵ open</span><span>esc close</span></p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
