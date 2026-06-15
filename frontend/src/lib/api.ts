import type { ApiErrorBody } from "@/types/user";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const AUTH_PATHS = ["/login", "/signup"];

function onAuthPage() {
  if (typeof window === "undefined") return false;
  return AUTH_PATHS.some((p) => window.location.pathname.startsWith(p));
}

function redirectTo(target: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith(target)) return;
  window.location.href = target;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
  const code = body.error?.code ?? "REQUEST_FAILED";
  const message = body.error?.message ?? res.statusText;

  // Safety net when a gated query slipped through or session/status changed mid-flight.
  if (!onAuthPage()) {
    if (res.status === 401) {
      redirectTo("/login");
    } else if (res.status === 403) {
      if (code === "PENDING_APPROVAL") redirectTo("/pending");
      if (code === "ACCOUNT_REJECTED") redirectTo("/login");
    }
  }

  throw new ApiError(res.status, code, message, body.error?.details);
}
