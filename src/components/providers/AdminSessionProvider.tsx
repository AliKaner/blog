"use client";

import { useMutation, useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../../../convex/_generated/api";

const STORAGE_KEY = "admin_session";
const EXPIRY_CHECK_INTERVAL_MS = 60_000;

type StoredSession = { token: string; expiresAt: number };

type AdminSessionContextValue = {
  isAdmin: boolean;
  hydrated: boolean;
  token: string | null;
  isLoginOpen: boolean;
  loginError: string | null;
  openLogin: () => void;
  closeLogin: () => void;
  login: (password: string) => Promise<void>;
  logout: () => void;
};

const AdminSessionContext = createContext<AdminSessionContextValue | null>(
  null,
);

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: StoredSession = JSON.parse(raw);
        // localStorage is a browser-only API, so hydrating from it has to
        // happen in an effect rather than during render (SSR-safe).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.expiresAt > Date.now()) setSession(parsed);
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Local wall-clock expiry check — Convex queries only re-run on data
  // changes, not on the passage of time, so this catches expiry between
  // writes.
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      if (session.expiresAt < Date.now()) clearSession();
    }, EXPIRY_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [session, clearSession]);

  const sessionCheck = useQuery(
    api.adminSessions.checkSession,
    hydrated && session ? { token: session.token } : "skip",
  );

  useEffect(() => {
    // Reacting to a server subscription (external system), not deriving
    // state from a prop — a revoked/expired session must force a logout.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session && sessionCheck && !sessionCheck.valid) clearSession();
  }, [sessionCheck, session, clearSession]);

  const loginMutation = useMutation(api.adminSessions.login);
  const logoutMutation = useMutation(api.adminSessions.logout);

  const login = useCallback(
    async (password: string) => {
      setLoginError(null);
      try {
        const result = await loginMutation({ password });
        const next = { token: result.token, expiresAt: result.expiresAt };
        setSession(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setIsLoginOpen(false);
      } catch {
        setLoginError("Wrong password.");
      }
    },
    [loginMutation],
  );

  const logout = useCallback(() => {
    if (session) logoutMutation({ token: session.token });
    clearSession();
  }, [session, logoutMutation, clearSession]);

  return (
    <AdminSessionContext.Provider
      value={{
        isAdmin: hydrated && !!session,
        hydrated,
        token: session?.token ?? null,
        isLoginOpen,
        loginError,
        openLogin: () => {
          setLoginError(null);
          setIsLoginOpen(true);
        },
        closeLogin: () => setIsLoginOpen(false),
        login,
        logout,
      }}
    >
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }
  return ctx;
}
