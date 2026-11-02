// Session-based auth against the Reporbit backend (HttpOnly cookie + CSRF header).
const BASE = ((import.meta as any).env?.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

let csrfToken: string | null = null;
export const setCsrf = (t: string | null) => { csrfToken = t; };

export interface ApiError { code: string; message: string; retryable?: boolean; details?: { field: string; message: string }[]; }

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (csrfToken && init.method && init.method !== "GET") headers["X-CSRF-Token"] = csrfToken;
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });
  } catch {
    throw { code: "NETWORK", message: "Can't reach the Reporbit server. Check your connection and try again." } as ApiError;
  }
  if (res.status === 204) return null as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw (body?.error || { code: `HTTP_${res.status}`, message: `Request failed (${res.status})` }) as ApiError;
  if (body?.csrfToken) csrfToken = body.csrfToken;
  return body as T;
}

export interface SessionUser { id: string; email: string; displayName: string; handle: string; githubLogin: string | null; avatarUrl: string | null; }
export interface ServerProfile {
  skills: string[]; interests: string[]; experience: "beginner" | "intermediate" | "advanced";
  headline: string | null; bio: string | null; profession: string | null; experienceMonths: number | null;
  priorContributions: number; onboarded: boolean;
}

export const authApi = {
  session: () => api<{ authenticated: boolean; user: SessionUser | null; csrfToken: string | null }>("/auth/session"),
  register: (email: string, password: string, displayName: string) =>
    api<{ user: SessionUser; csrfToken: string }>("/auth/register", { method: "POST", body: JSON.stringify({ email, password, displayName }) }),
  login: (email: string, password: string) =>
    api<{ user: SessionUser; csrfToken: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => api<null>("/auth/logout", { method: "POST", body: "{}" }),
  me: () => api<{ user: SessionUser; profile: ServerProfile | null; suggestedSkills: string[] }>("/me"),
  saveProfile: (patch: Partial<ServerProfile> & Record<string, unknown>) =>
    api<{ profile: ServerProfile }>("/me/profile", { method: "PUT", body: JSON.stringify(patch) }),
};

export function friendlyError(e: any): string {
  if (!e) return "Something went wrong.";
  if (e.details?.length) {
    const d = e.details[0];
    const label: Record<string, string> = { email: "Email", password: "Password", displayName: "Name" };
    return `${label[d.field] || d.field} ${d.message}`;
  }
  return e.message || "Something went wrong.";
}
