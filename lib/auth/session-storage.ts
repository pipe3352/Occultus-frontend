import type { ApiUser } from "@/lib/types";

const TOKEN_KEY = "secureshare.token";
const USER_KEY = "secureshare.user";

/**
 * The backend also sets an httpOnly `token` cookie on login, but that cookie is
 * unusable from a different origin (localhost:3000 -> localhost:8000), so the
 * session lives in localStorage and travels in the Authorization header.
 */
export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function readUser(): ApiUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
}

export function writeSession(token: string, user: ApiUser | null): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage can be unavailable (private mode); the in-memory session still works.
  }
}

export function writeUser(user: ApiUser): void {
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}
