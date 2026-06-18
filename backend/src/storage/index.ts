import { CloudinaryAdapter } from "./cloudinaryAdapter.js";
import { LocalAdapter, LOCAL_UPLOAD_ROOT } from "./localAdapter.js";
import type { StorageAdapter } from "./types.js";

/**
 * Single source of truth for the active storage backend.
 * Driver picked once at boot from STORAGE_DRIVER env var.
 * Routes call storage.upload()/delete() — they never branch on driver.
 */
function createStorage(): StorageAdapter {
  const driver = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
  if (driver === "cloudinary") return new CloudinaryAdapter();
  return new LocalAdapter();
}

export const storage: StorageAdapter = createStorage();
export { LOCAL_UPLOAD_ROOT };
export type { StorageAdapter, UploadInput, UploadResult } from "./types.js";
