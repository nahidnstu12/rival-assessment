"use client";

import { useAuth } from "@/context/AuthContext";
import type { AppEvent } from "@/types/event";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Subscribes the tab to the server's SSE stream once the user is signed in.
 * Server sends only IDs — we invalidate TanStack Query keys, never merge payloads.
 * Server is source of truth; refetch is correct, race-condition-free.
 *
 * EventSource auto-reconnects on network blips, so we don't need our own retry loop.
 */
export function useEventStream() {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;

    const es = new EventSource("/api/events", { withCredentials: true });

    function handle(event: MessageEvent<string>) {
      let data: AppEvent;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (data.type) {
        case "task.created":
        case "task.updated":
        case "task.deleted":
          qc.invalidateQueries({ queryKey: ["tasks"] });
          break;

        case "task.activity.added":
          qc.invalidateQueries({ queryKey: ["task", data.taskId, "activity"] });
          break;

        case "attachment.added":
        case "attachment.removed":
          qc.invalidateQueries({ queryKey: ["task", data.taskId, "attachments"] });
          qc.invalidateQueries({ queryKey: ["task", data.taskId, "activity"] });
          break;

        case "user.approved":
        case "user.rejected":
          // If the affected user is me, refresh my profile so the pending
          // gate flips. AuthContext owns its own state (not TanStack), so
          // we call refresh() directly. Admin list IS a query — invalidate it.
          if (user && data.userId === user.id) {
            void refresh();
          }
          qc.invalidateQueries({ queryKey: ["admin", "users"] });
          break;
      }
    }

    // Listen on all event types we care about. EventSource fires named events
    // via addEventListener, not via the generic "message" handler.
    const types: AppEvent["type"][] = [
      "task.created",
      "task.updated",
      "task.deleted",
      "task.activity.added",
      "attachment.added",
      "attachment.removed",
      "user.approved",
      "user.rejected",
    ];
    types.forEach((t) => es.addEventListener(t, handle as EventListener));

    return () => {
      types.forEach((t) => es.removeEventListener(t, handle as EventListener));
      es.close();
    };
  }, [user, qc, refresh]);
}
