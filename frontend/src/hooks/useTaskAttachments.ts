"use client";

import { useToast } from "@/context/ToastContext";
import { attachmentsApi } from "@/lib/api/attachments";
import type { AttachmentListResponse, TaskAttachment } from "@/types/attachment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTaskAttachments(taskId: string | undefined) {
  return useQuery<AttachmentListResponse>({
    queryKey: ["task", taskId, "attachments"],
    queryFn: () => attachmentsApi.list(taskId!),
    enabled: !!taskId,
  });
}

export function useAttachmentMutations(taskId: string) {
  const qc = useQueryClient();
  const toast = useToast();

  const upload = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(taskId, file),
    onSuccess: ({ attachment }) => {
      qc.setQueryData<AttachmentListResponse>(
        ["task", taskId, "attachments"],
        (old) => (old ? { data: [attachment, ...old.data] } : { data: [attachment] }),
      );
      qc.invalidateQueries({ queryKey: ["task", taskId, "activity"] });
      toast.show("File uploaded");
    },
    onError: (err: Error) => {
      toast.show(err.message || "Upload failed");
    },
  });

  const remove = useMutation({
    mutationFn: (attachment: TaskAttachment) =>
      attachmentsApi.delete(taskId, attachment.id),
    onMutate: async (attachment) => {
      const key = ["task", taskId, "attachments"];
      const prev = qc.getQueryData<AttachmentListResponse>(key);
      qc.setQueryData<AttachmentListResponse>(key, (old) =>
        old ? { data: old.data.filter((a) => a.id !== attachment.id) } : { data: [] },
      );
      return { prev };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", taskId, "activity"] });
      toast.show("Attachment removed");
    },
    onError: (err: Error, _att, ctx) => {
      if (ctx?.prev) qc.setQueryData(["task", taskId, "attachments"], ctx.prev);
      toast.show(err.message || "Delete failed");
    },
  });

  return { upload, remove };
}
