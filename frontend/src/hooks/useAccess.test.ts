import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAccess } from "./useAccess";
import type { User } from "@/types/user";

const mockUseAuth = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function user(overrides: Partial<User> = {}): User {
  return {
    id: "1",
    name: "Test",
    email: "test@rival.io",
    role: "USER",
    status: "APPROVED",
    ...overrides,
  };
}

describe("useAccess", () => {
  it("blocks task and admin APIs for pending users", () => {
    mockUseAuth.mockReturnValue({
      user: user({ status: "PENDING" }),
      isLoading: false,
      isApproved: false,
      isPending: true,
    });

    const { result } = renderHook(() => useAccess());
    expect(result.current.canFetchTasks).toBe(false);
    expect(result.current.canFetchAdmin).toBe(false);
  });

  it("allows tasks but not admin for approved members", () => {
    mockUseAuth.mockReturnValue({
      user: user({ role: "USER", status: "APPROVED" }),
      isLoading: false,
      isApproved: true,
      isPending: false,
    });

    const { result } = renderHook(() => useAccess());
    expect(result.current.canFetchTasks).toBe(true);
    expect(result.current.canFetchAdmin).toBe(false);
  });

  it("allows admin APIs for approved admins", () => {
    mockUseAuth.mockReturnValue({
      user: user({ role: "ADMIN", status: "APPROVED" }),
      isLoading: false,
      isApproved: true,
      isPending: false,
    });

    const { result } = renderHook(() => useAccess());
    expect(result.current.canFetchTasks).toBe(true);
    expect(result.current.canFetchAdmin).toBe(true);
  });
});
