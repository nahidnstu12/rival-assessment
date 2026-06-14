import type { ApiErrorBody } from "@/types/user";

export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
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

  if (res.status === 401 && typeof window !== "undefined") {
    const path = window.location.pathname;
    const isPublic = ["/login", "/signup"].some((p) => path.startsWith(p));
    if (!isPublic) {
      window.location.href = "/login";
    }
    throw new ApiError("UNAUTHORIZED", "Not authenticated");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.message ?? res.statusText,
      body.error?.details,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
