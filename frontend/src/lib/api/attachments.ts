import { ApiError } from "@/lib/api";
import type { ApiErrorBody } from "@/types/user";
import type {
  AttachmentListResponse,
  TaskAttachment,
} from "@/types/attachment";

export const attachmentsApi = {
  list: (taskId: string) =>
    fetchJson<AttachmentListResponse>(`/api/tasks/${taskId}/attachments`),

  upload: async (taskId: string, file: File): Promise<{ attachment: TaskAttachment }> => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`/api/tasks/${taskId}/attachments`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    if (res.ok) return (await res.json()) as { attachment: TaskAttachment };

    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(
      res.status,
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.message ?? res.statusText,
      body.error?.details,
    );
  },

  delete: async (taskId: string, attachmentId: string): Promise<void> => {
    const res = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) return;

    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(
      res.status,
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.message ?? res.statusText,
      body.error?.details,
    );
  },
};

/** Internal — lightweight JSON fetcher used for the list endpoint. */
async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (res.ok) return (await res.json()) as T;
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
  throw new ApiError(
    res.status,
    body.error?.code ?? "REQUEST_FAILED",
    body.error?.message ?? res.statusText,
    body.error?.details,
  );
}
