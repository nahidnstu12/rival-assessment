import type { StorageAdapter, UploadInput, UploadResult } from "./types.js";

/**
 * Cloudinary adapter — backend signs and uploads (proxy mode).
 *
 * Production-grade alternative: serve a signed upload URL to the frontend,
 * let the browser upload direct to Cloudinary. Saves Render memory at scale.
 * Kept proxy mode here for assessment simplicity — same interface either way.
 *
 * Required env:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Required package: `cloudinary` (added at install time, see phase 07 doc).
 */
export class CloudinaryAdapter implements StorageAdapter {
  driver = "CLOUDINARY" as const;

  private async getClient() {
    // Dynamic import so the package is only required when this driver is selected.
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
      api_key: requireEnv("CLOUDINARY_API_KEY"),
      api_secret: requireEnv("CLOUDINARY_API_SECRET"),
      secure: true,
    });
    return cloudinary;
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const cloudinary = await this.getClient();

    const resourceType = input.mimeType.startsWith("image/") ? "image" : "raw";
    const folder = `taskflow/${input.taskId}`;

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      bytes: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (err, res) => {
          if (err || !res) return reject(err ?? new Error("Cloudinary upload failed"));
          resolve(res as never);
        },
      );
      stream.end(input.buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
      storage: "CLOUDINARY",
    };
  }

  async delete(publicId: string): Promise<void> {
    const cloudinary = await this.getClient();
    // `raw` for non-image; calling both is safe (one will be a no-op).
    await Promise.allSettled([
      cloudinary.uploader.destroy(publicId, { resource_type: "image" }),
      cloudinary.uploader.destroy(publicId, { resource_type: "raw" }),
    ]);
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}
