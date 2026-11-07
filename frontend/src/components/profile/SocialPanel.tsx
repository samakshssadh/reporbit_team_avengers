import React, { useCallback, useEffect, useState } from "react";
import { Users, Trophy, Search, UserPlus, UserCheck, Clock, Lock, Globe, Check, X as XIcon, Star } from "lucide-react";
import { authApi, friendlyError } from "../../services/auth";
import { social, Overview, Leaderboard, FollowedRepo, Person } from "../../services/social";

const Avatar: React.FC<{ p: Person }> = ({ p }) => (
  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-tangerine-400 to-rose-500 flex items-center justify-center text-xs font-semibold text-white shrink-0">
    {(p.displayName || p.handle)[0].toUpperCase()}
  </span>
);

export const SocialPanel: React.FC = () => {
  const [ov, setOv] = useState<Overview | null>(null);
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [period, setPeriod] = useState<"week" | "all">("week");
  const [repos, setRepos] = useState<FollowedRepo[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof social.search>>["items"]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    social.overview().then(setOv).catch((e) => setError(friendlyError(e)));
    social.repos().then((r) => setRepos(r.items)).catch(() => {});
  }, []);
  useEffect(load, [load]);
  useEffect(() => { social.leaderboard(period).then(setBoard).catch(() => {}); }, [period, ov?.counts.following]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => social.search(q.trim()).then((r) => setResults(r.items)).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [q]);

  const act = async (fn: () => Promise<unknown>) => {
    setError(null);
    try { await fn(); load(); if (q.trim().length >= 2) social.search(q.trim()).then((r) => setResults(r.items)).catch(() => {}); }
    catch (e) { setError(friendlyError(e)); }
  };
  const setPrivacy = (isPublic: boolean) => act(async () => { await authApi.saveProfile({ isPublic }); });

  if (!ov) return <section className="glass rounded-3xl p-6 text-sm text-white/50">{error || "Loading your network…"}</section>;

  return (
    <section className="glass rounded-3xl p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4 text-tangerine-300" />Friends &amp; leaderboard</h2>
        <div className="flex items-center gap-4 text-sm text-white/70">
          <span><b className="text-white">{ov.counts.followers}</b> followers</span>
          <span><b className="text-white">{ov.counts.following}</b> following</span>
          <button onClick={() => setPrivacy(!ov.isPublic)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs"
            title={ov.isPublic ? "Anyone can follow you. Click to make your profile private." : "People must request to follow you. Click to make your profile public."}>
            {ov.isPublic ? <><Globe className="w-3.5 h-3.5" /> Public profile</> : <><Lock className="w-3.5 h-3.5" /> Private profile</>}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}

      {ov.requests.length > 0 && (
        <div className="rounded-2xl bg-tangerine-500/10 border border-tangerine-300/20 p-4 space-y-2">
          <p className="text-xs uppercase tracking-widest text-tangerine-100/80 font-mono">Follow requests</p>
          {ov.requests.map((r) => (
            <div key={r.handle} className="flex items-center gap-3">
              <Avatar p={r} /><span className="text-sm text-white flex-1">{r.displayName} <span className="text-white/40">@{r.handle}</span></span>
              <button onClick={() => act(() => social.respond(r.handle, true))} className="p-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300" aria-label="Accept"><Check className="w-4 h-4" /></button>
              <button onClick={() => act(() => social.respond(r.handle, false))} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60" aria-label="Decline"><XIcon className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-tangerine-300" />Leaderboard</h3>
            <div className="flex rounded-full bg-white/5 border border-white/10 p-0.5 text-xs">
              {(["week", "all"] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-full ${period === p ? "bg-tangerine-500/30 text-white" : "text-white/55"}`}>{p === "week" ? "This week" : "All time"}</button>
              ))}
            </div>
          </div>
          <ol className="space-y-1.5">
            {board?.board.map((e) => (
              <li key={e.handle} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${e.isMe ? "liquid-lens" : "bg-white/[0.04]"}`}>
                <span className="w-5 text-center text-sm font-semibold text-white/60">{e.rank}</span>
                <Avatar p={e} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-white truncate">{e.displayName}{e.isMe && " (you)"}</span>
                  <span className="block text-[11px] text-white/45">{e.repos} repos · {e.reviews} PR reviews · {e.contributions} contributions · {e.activeDays} active days</span>
                </span>
                <span className="text-sm font-semibold text-gradient">{e.points} pts</span>
              </li>
            ))}
          </ol>
          {board && board.board.length === 1 && <p className="mt-3 text-xs text-white/45">Follow friends to compete with them.</p>}
          {board && <p className="mt-3 text-[11px] text-white/35">Points: {board.scoring.repoExplored}/repo explored · {board.scoring.dummyPR}/Dummy PR · {board.scoring.contribution}/contribution · {board.scoring.activeDay}/active day</p>}
        </div>

        {/* Find & follow */}
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Find people</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or handle…" className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-tangerine-400/60" />
          </div>
          <ul className="mt-2 space-y-1.5">
            {results.map((p) => (
              <li key={p.handle} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
                <Avatar p={p} />
                <span className="flex-1 text-sm text-white truncate">{p.displayName} <span className="text-white/40">@{p.handle}</span>{!p.isPublic && <Lock className="inline w-3 h-3 ml-1 text-white/40" />}</span>
                {p.followStatus === "accepted" ? <button onClick={() => act(() => social.unfollow(p.handle))} className="text-xs flex items-center gap-1 text-emerald-300"><UserCheck className="w-3.5 h-3.5" />Following</button>
                  : p.followStatus === "pending" ? <button onClick={() => act(() => social.unfollow(p.handle))} className="text-xs flex items-center gap-1 text-white/50" title="Cancel request"><Clock className="w-3.5 h-3.5" />Requested</button>
                  : <button onClick={() => act(() => social.follow(p.handle))} className="btn-tangerine text-xs px-3 py-1 rounded-full flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" />{p.isPublic ? "Follow" : "Request"}</button>}
              </li>
            ))}
            {q.trim().length >= 2 && results.length === 0 && <li className="text-xs text-white/40 px-1">No one found.</li>}
          </ul>

          {ov.following.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-white mt-5 mb-2">Following</h3>
              <div className="flex flex-wrap gap-2">
                {ov.following.map((p) => (
                  <span key={p.handle} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">
                    <Avatar p={p} />{p.displayName}{p.status === "pending" && <em className="text-white/40">(requested)</em>}
                    <button onClick={() => act(() => social.unfollow(p.handle))} className="text-white/40 hover:text-white" aria-label={`Unfollow ${p.displayName}`}><XIcon className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Followed repositories */}
      <div>
        <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2"><Star className="w-4 h-4 text-tangerine-300" />Repositories you follow</h3>
        {repos.length === 0 ? <p className="text-xs text-white/45">Open any repository and press Follow to track it here.</p> : (
          <div className="flex flex-wrap gap-2">
            {repos.map((r) => (
              <span key={r.repoId} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">
                {r.repoName}<span className="text-white/35">· {r.followers} following</span>
                <button onClick={() => act(() => social.unfollowRepo(r.repoId))} className="text-white/40 hover:text-white" aria-label={`Unfollow ${r.repoName}`}><XIcon className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
