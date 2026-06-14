"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

function parseFilters(paramsString: string, defaultSort: string) {
  const params = new URLSearchParams(paramsString);
  return {
    status: params.get("status") ?? "all",
    search: params.get("search") ?? "",
    sort: params.get("sort") ?? defaultSort,
    order: (params.get("order") ?? (defaultSort === "manual" ? "asc" : "desc")) as "asc" | "desc",
    page: Number(params.get("page") ?? 1),
  };
}

export function useTaskFilters(defaultSort = "manual") {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const paramsString = searchParams.toString();

  const filters = useMemo(
    () => parseFilters(paramsString, defaultSort),
    [paramsString, defaultSort],
  );

  const replaceSearchParams = useCallback(
    (build: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(paramsString);
      build(next);
      const qs = next.toString();
      if (qs === paramsString) return;
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [paramsString, pathname, router],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      replaceSearchParams((next) => {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
        if (key !== "page") next.set("page", "1");
      });
    },
    [replaceSearchParams],
  );

  const clearFilters = useCallback(() => {
    if (!paramsString) return;
    router.replace(pathname);
  }, [paramsString, pathname, router]);

  const setSort = useCallback(
    (sort: string, order?: string) => {
      replaceSearchParams((next) => {
        next.set("sort", sort);
        if (order) next.set("order", order);
        else next.delete("order");
        next.set("page", "1");
      });
    },
    [replaceSearchParams],
  );

  return { ...filters, setParam, setSort, clearFilters };
}
