"use client";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api";
import type { User } from "@/types/user";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isPending: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const publicPaths = ["/login", "/signup"];

function isPublicPath(pathname: string) {
  return publicPaths.some((path) => pathname.startsWith(path));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (isPublicPath(window.location.pathname)) {
      setIsLoading(false);
      return;
    }
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const { user: loggedIn } = await authApi.login({ email, password });
        setUser(loggedIn);
        router.replace("/tasks");
      } catch (err) {
        if (err instanceof ApiError && err.code === "PENDING_APPROVAL") {
          router.replace("/pending");
          return;
        }
        throw err;
      }
    },
    [router],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: created } = await authApi.signup({ name, email, password });
      setUser(created);
      router.replace("/pending");
    },
    [router],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAdmin: user?.role === "ADMIN",
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
