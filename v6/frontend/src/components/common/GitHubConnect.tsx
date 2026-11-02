import React, { useEffect, useState } from "react";
import { Github, Loader2, RefreshCw, ShieldCheck, Unlink, CheckCircle2 } from "lucide-react";
import { api, friendlyError } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";

interface Status { connected: boolean; login: string | null; verified: boolean; syncedAt: string | null; contributions: number; mergedPRs: number; oauthAvailable: boolean }

// Connect GitHub so contributions are read from the real account (never self-reported).
// Uses GitHub sign-in (OAuth) when the server has it configured; otherwise links by public username.
export const GitHubConnect: React.FC<{ compact?: boolean; onChange?: () => void }> = ({ compact, onChange }) => {
  const { refresh } = useAuth();
  const [st, setSt] = useState<Status | null>(null);
  const [login, setLogin] = useState("");
  const [busy, setBusy] = useState<"connect" | "sync" | "disconnect" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => api<Status>("/github/status").then(setSt).catch(() => setSt(null));
  useEffect(() => { load(); }, []);

  const connectUsername = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setMsg(null); setBusy("connect");
    try {
      const r = await api<{ login: string; fetched: number }>("/github/connect", { method: "POST", body: JSON.stringify({ login: login.trim().replace(/^@/, "") }) });
      setMsg(`Connected @${r.login} — found ${r.fetched} public pull requests & issues.`);
      await load(); await refresh(); onChange?.();
    } catch (e2) { setErr(friendlyError(e2)); } finally { setBusy(null); }
  };
  const sync = async () => {
    setErr(null); setBusy("sync");
    try { const r = await api<{ fetched: number; inserted: number }>("/github/sync", { method: "POST", body: "{}" }); setMsg(`Synced — ${r.inserted} new, ${r.fetched} total.`); await load(); onChange?.(); }
    catch (e2) { setErr(friendlyError(e2)); } finally { setBusy(null); }
  };
  const disconnect = async () => {
    if (!window.confirm("Disconnect GitHub? Imported GitHub contributions will be removed from Reporbit (nothing changes on GitHub).")) return;
    setBusy("disconnect");
    try { await api("/github", { method: "DELETE" }); setMsg(null); await load(); await refresh(); onChange?.(); } finally { setBusy(null); }
  };

  if (!st) return <div className={`glass rounded-3xl ${compact ? "p-5" : "p-6"} h-28 shimmer`} />;

  return (
    <div className={`glass rounded-3xl ${compact ? "p-5" : "p-6"}`}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl liquid-lens flex items-center justify-center shrink-0"><Github className="w-5 h-5 text-white" /></div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white">{st.connected ? <>GitHub connected <span className="text-tangerine-300">@{st.login}</span></> : "Connect your GitHub"}</h3>
          {st.connected ? (
            <p className="mt-1 text-sm text-white/60 flex flex-wrap items-center gap-x-3 gap-y-1">
              {st.verified ? <span className="flex items-center gap-1 text-emerald-300"><ShieldCheck className="w-3.5 h-3.5" />Verified with GitHub sign-in</span> : <span className="text-white/50">Linked by username</span>}
              <span>{st.contributions} contributions · {st.mergedPRs} merged PRs</span>
              {st.syncedAt && <span className="text-white/40">synced {new Date(st.syncedAt).toLocaleString()}</span>}
            </p>
          ) : (
            <p className="mt-1 text-sm text-white/60">We read your public pull requests and issues straight from GitHub — no need to type in what you've contributed.</p>
          )}
        </div>
      </div>

      {!st.connected && (
        <div className="mt-4 space-y-3">
          {st.oauthAvailable && (
            <a href="/api/auth/github/start" className="btn-tangerine w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm"><Github className="w-4 h-4" /> Continue with GitHub</a>
          )}
          <form onSubmit={connectUsername} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">@</span>
              <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder={st.oauthAvailable ? "or enter your GitHub username" : "your GitHub username"} maxLength={40}
                className="w-full pl-8 pr-3 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/35 focus:outline-none focus:border-tangerine-400/60" aria-label="GitHub username" />
            </div>
            <button type="submit" disabled={!login.trim() || busy === "connect"} className={`${st.oauthAvailable ? "glass" : "btn-tangerine"} px-5 py-3 rounded-2xl text-sm flex items-center gap-2`}>
              {busy === "connect" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />} Connect
            </button>
          </form>
        </div>
      )}

      {st.connected && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={sync} disabled={!!busy} className="glass px-4 py-2 rounded-2xl text-xs text-white flex items-center gap-1.5">{busy === "sync" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Sync now</button>
          <button onClick={disconnect} disabled={!!busy} className="px-4 py-2 rounded-2xl text-xs text-white/55 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-1.5"><Unlink className="w-3.5 h-3.5" /> Disconnect</button>
        </div>
      )}
      {msg && <p className="mt-3 text-xs text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />{msg}</p>}
      {err && <p className="mt-3 text-xs text-rose-300" role="alert">{err}</p>}
    </div>
  );
};
