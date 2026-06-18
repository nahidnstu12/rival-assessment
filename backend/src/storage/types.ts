import type { Storage as StorageDriver } from "@prisma/client";

export type UploadInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  taskId: string;
};

export type UploadResult = {
  url: string;
  publicId?: string;
  size: number;
  storage: StorageDriver;
};

export interface StorageAdapter {
  driver: StorageDriver;
  upload(input: UploadInput): Promise<UploadResult>;
  delete(publicIdOrUrl: string): Promise<void>;
}
