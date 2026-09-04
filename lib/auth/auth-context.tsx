"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import * as authApi from "@/lib/api/auth";
import * as usersApi from "@/lib/api/users";
import { ApiError } from "@/lib/api/errors";
import {
  clearSession,
  readToken,
  readUser,
  writeSession,
  writeUser,
} from "@/lib/auth/session-storage";
import type { ApiUser, LoginPayload, RegisterPayload } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: ApiUser | null;
  token: string | null;
  /** Message shown on the login screen after an expired/ended session. */
  notice: string | null;
  clearNotice: () => void;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: (notice?: string) => void;
  setUser: (user: ApiUser) => void;
  /**
   * Runs an authenticated call with the current token. A 401 answer ends the
   * session immediately so the user is never stuck on a dead screen.
   */
  authRequest: <T>(fn: (token: string) => Promise<T>) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUserState] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Kept in a ref so `authRequest` never closes over a stale token.
  const tokenRef = useRef<string | null>(null);

  const applyToken = useCallback((value: string | null) => {
    tokenRef.current = value;
    setToken(value);
  }, []);

  const logout = useCallback(
    (message?: string) => {
      clearSession();
      applyToken(null);
      setUserState(null);
      setStatus("unauthenticated");
      setNotice(message ?? null);
    },
    [applyToken],
  );

  /**
   * Restores the session from localStorage after hydration and confirms it
   * against `/users/me`. It cannot run during render: the server has no access
   * to localStorage, so the first client render must match the server's
   * "loading" output before the stored token is applied.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function restoreSession() {
      const stored = readToken();
      if (!stored) {
        setStatus("unauthenticated");
        return;
      }

      applyToken(stored);
      setUserState(readUser());

      try {
        const response = await usersApi.getMe(stored, controller.signal);
        setUserState(response.data.user);
        writeUser(response.data.user);
        setStatus("authenticated");
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.isNetworkError) {
          // Backend down: keep the cached session rather than logging out.
          setStatus("authenticated");
          return;
        }
        logout("Your session has expired. Please sign in again.");
      }
    }

    void restoreSession();
    return () => controller.abort();
  }, [applyToken, logout]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { token: newToken } = await authApi.login(payload);
      const me = await usersApi.getMe(newToken);
      writeSession(newToken, me.data.user);
      applyToken(newToken);
      setUserState(me.data.user);
      setNotice(null);
      setStatus("authenticated");
    },
    [applyToken],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload);
    return response.message;
  }, []);

  const setUser = useCallback((next: ApiUser) => {
    setUserState(next);
    writeUser(next);
  }, []);

  const authRequest = useCallback(
    async <T,>(fn: (activeToken: string) => Promise<T>): Promise<T> => {
      const active = tokenRef.current;
      if (!active) {
        logout("Please sign in to continue.");
        throw new ApiError("You are not signed in.", 401);
      }
      try {
        return await fn(active);
      } catch (error) {
        if (error instanceof ApiError && error.isUnauthorized) {
          logout("Your session has expired. Please sign in again.");
        }
        throw error;
      }
    },
    [logout],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      notice,
      clearNotice: () => setNotice(null),
      login,
      register,
      logout,
      setUser,
      authRequest,
    }),
    [status, user, token, notice, login, register, logout, setUser, authRequest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
