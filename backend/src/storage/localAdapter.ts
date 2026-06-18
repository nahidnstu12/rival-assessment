import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { StorageAdapter, UploadInput, UploadResult } from "./types.js";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
/**
 * Public URL prefix. Frontend talks to the backend via the `/api/*` proxy,
 * so attachments must be reachable at `/api/uploads/...`. Express still serves
 * the bytes at `/uploads` — the `/api` segment is added back by the proxy.
 */
const PUBLIC_PREFIX = "/api/uploads";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "text/plain": "txt",
};

export class LocalAdapter implements StorageAdapter {
  driver = "LOCAL" as const;

  async upload(input: UploadInput): Promise<UploadResult> {
    const dir = path.join(UPLOAD_ROOT, input.taskId);
    await fs.mkdir(dir, { recursive: true });

    const ext = EXT_BY_MIME[input.mimeType] ?? path.extname(input.filename).slice(1) ?? "bin";
    const id = randomUUID();
    const rel = path.posix.join(input.taskId, `${id}.${ext}`);
    const abs = path.join(UPLOAD_ROOT, rel);

    await fs.writeFile(abs, input.buffer);

    return {
      url: `${PUBLIC_PREFIX}/${rel}`,
      publicId: rel,
      size: input.buffer.length,
      storage: "LOCAL",
    };
  }

  async delete(publicIdOrUrl: string): Promise<void> {
    // Accept either the stored publicId (relative path) or the public URL.
    const rel = publicIdOrUrl.startsWith(`${PUBLIC_PREFIX}/`)
      ? publicIdOrUrl.slice(`${PUBLIC_PREFIX}/`.length)
      : publicIdOrUrl;

    const abs = path.join(UPLOAD_ROOT, rel);

    // Path-traversal guard: refuse anything outside UPLOAD_ROOT.
    if (!abs.startsWith(`${UPLOAD_ROOT}${path.sep}`) && abs !== UPLOAD_ROOT) {
      throw new Error("Invalid storage path");
    }

    try {
      await fs.unlink(abs);
    } catch (err: unknown) {
      // Ignore "already gone" — delete is idempotent at the adapter layer.
      if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
    }
  }
}

export const LOCAL_UPLOAD_ROOT = UPLOAD_ROOT;
