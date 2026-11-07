// Client for the social endpoints: follow people / repositories, requests, leaderboard.
import { api } from "./auth";

export interface Person { handle: string; displayName: string; avatarUrl: string | null; isPublic: boolean; }
export interface Overview {
  isPublic: boolean;
  counts: { followers: number; following: number; requests: number };
  following: (Person & { status: "pending" | "accepted" })[];
  followers: Person[];
  requests: (Person & { requestedAt: string })[];
}
export interface BoardEntry extends Person { rank: number; isMe: boolean; points: number; repos: number; reviews: number; contributions: number; activeDays: number; }
export interface Leaderboard { period: "week" | "all"; scoring: { repoExplored: number; dummyPR: number; contribution: number; activeDay: number }; board: BoardEntry[]; }
export interface FollowedRepo { repoId: string; repoName: string; platform: string; followedAt: string; followers: number; }

const body = (o: unknown) => JSON.stringify(o);

export const social = {
  overview: () => api<Overview>("/social/overview"),
  search: (q: string) => api<{ items: (Person & { followStatus: "pending" | "accepted" | null })[] }>(`/social/search?q=${encodeURIComponent(q)}`),
  follow: (handle: string) => api<{ handle: string; status: "pending" | "accepted" }>("/social/follow", { method: "POST", body: body({ handle }) }),
  unfollow: (handle: string) => api<null>("/social/follow", { method: "DELETE", body: body({ handle }) }),
  respond: (handle: string, accept: boolean) => api<null>("/social/requests", { method: "POST", body: body({ handle, accept }) }),
  leaderboard: (period: "week" | "all") => api<Leaderboard>(`/social/leaderboard?period=${period}`),
  repos: () => api<{ items: FollowedRepo[] }>("/social/repos"),
  followRepo: (repoId: string, repoName: string, platform: string) => api<null>("/social/repos", { method: "POST", body: body({ repoId, repoName, platform }) }),
  unfollowRepo: (repoId: string) => api<null>("/social/repos", { method: "DELETE", body: body({ repoId }) }),
};
