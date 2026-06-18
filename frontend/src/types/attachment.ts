export type StorageDriver = "LOCAL" | "CLOUDINARY";

export type TaskAttachment = {
  id: string;
  taskId: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  storage: StorageDriver;
  createdAt: string;
};

export type AttachmentListResponse = {
  data: TaskAttachment[];
};

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_TASK = 10;
export const ALLOWED_ATTACHMENT_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
] as const;
