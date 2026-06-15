"use client";

import { authApi } from "@/lib/api/auth";
import type { User } from "@/types/user";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  isPending: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const authPaths = ["/login", "/signup"];

function isAuthPath(pathname: string) {
  return authPaths.some((path) => pathname.startsWith(path));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshGen = useRef(0);

  const refresh = useCallback(async () => {
    const gen = ++refreshGen.current;
    try {
      const { user: me } = await authApi.me();
      if (gen !== refreshGen.current) return;
      setUser(me);
    } catch {
      if (gen !== refreshGen.current) return;
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthPath(window.location.pathname)) {
      setIsLoading(false);
      return;
    }
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedIn } = await authApi.login({ email, password });
    refreshGen.current += 1;
    setUser(loggedIn);
    window.location.assign(loggedIn.status === "PENDING" ? "/pending" : "/tasks");
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: created } = await authApi.signup({ name, email, password });
      refreshGen.current += 1;
      setUser(created);
      window.location.assign("/pending");
    },
    [],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    refreshGen.current += 1;
    setUser(null);
    window.location.assign("/login");
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAdmin: user?.role === "ADMIN",
      isApproved: user?.status === "APPROVED",
      isPending: user?.status === "PENDING",
      login,
      signup,
      logout,
      refresh,
    }),
    [user, isLoading, login, signup, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
