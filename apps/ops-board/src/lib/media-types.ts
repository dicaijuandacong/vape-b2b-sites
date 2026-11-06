/** A marketing-asset image managed in the ops media library. */
export interface MediaAsset {
  id: string;
  /** Original filename (sanitized). */
  name: string;
  mime: string;
  size: number; // bytes
  /** Where the bytes live. */
  source: "local" | "feishu";
  /** Feishu file_token when source === "feishu". */
  fileToken?: string;
  /** Public-ish serving path handled by /api/media/[id]. */
  url: string;
  createdAt: string; // ISO
}

export const MAX_MEDIA_BYTES = 20 * 1024 * 1024; // Feishu upload_all hard limit
export const ALLOWED_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

export function isAllowedImage(mime: string): boolean {
  return ALLOWED_IMAGE_MIME.has(mime.toLowerCase());
}

/** Strip path separators / control chars from an uploaded filename. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "image";
  const cleaned = base
    .split("")
    .map((ch) => (/[<>:"|?*]/.test(ch) || ch < " " ? "_" : ch))
    .join("");
  return cleaned.slice(0, 120) || "image";
}
