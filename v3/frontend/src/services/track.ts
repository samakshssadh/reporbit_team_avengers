// Fire-and-forget activity logging for the profile page (time on site, repos, topics).
import { api } from "./auth";

type Kind = "viewed" | "roadmap" | "chat" | "contributed";
const platformOf = (id: string) => (id.startsWith("gl__") ? "gitlab" : id.startsWith("bb__") ? "bitbucket" : "github");

export const track = {
  repo(repo: { id: string; fullName?: string; owner?: string; name?: string }, kind: Kind) {
    const repoName = repo.fullName || `${repo.owner}/${repo.name}`;
    api("/me/interactions", { method: "POST", body: JSON.stringify({ repoId: repo.id, repoName, platform: platformOf(repo.id), kind }) }).catch(() => {});
  },
  unContribute(repoId: string) {
    return api("/me/interactions", { method: "DELETE", body: JSON.stringify({ repoId, kind: "contributed" }) });
  },
  topic(topic: string) {
    if (topic.trim()) api("/me/topics", { method: "POST", body: JSON.stringify({ topic: topic.trim().slice(0, 60) }) }).catch(() => {});
  },
};

// Counts active minutes while the tab is visible and the user is interacting.
export function startHeartbeat(): () => void {
  let lastInput = Date.now();
  const bump = () => { lastInput = Date.now(); };
  const evs = ["mousemove", "keydown", "scroll", "click", "touchstart"];
  evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
  const id = window.setInterval(() => {
    const active = document.visibilityState === "visible" && Date.now() - lastInput < 5 * 60e3;
    if (active) api("/me/activity", { method: "POST", body: JSON.stringify({ seconds: 60 }) }).catch(() => {});
  }, 60e3);
  return () => { window.clearInterval(id); evs.forEach((e) => window.removeEventListener(e, bump)); };
}
