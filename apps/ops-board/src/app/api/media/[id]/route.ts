import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { feishuFetch, feishuConfigured } from "@/lib/media-store";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Serve an asset image by id — local file or feishu download (auth'd, streamed). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  if (!id || id.includes("..") || id.includes("/")) {
    return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  }

  if (feishuConfigured()) {
    const got = await feishuFetch(id);
    if (!got) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    return new Response(new Uint8Array(got.buf), {
      headers: { "Content-Type": got.mime, "Cache-Control": "private, max-age=3600" },
    });
  }

  // local: id-<name> under public/uploads
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const file = files.find((f) => f.startsWith(`${id}-`));
    if (!file) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    const buf = await fs.readFile(path.join(UPLOAD_DIR, file));
    const ext = path.extname(file).toLowerCase();
    const mime =
      ext === ".png" ? "image/png" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      ext === ".webp" ? "image/webp" :
      ext === ".gif" ? "image/gif" :
      ext === ".svg" ? "image/svg+xml" : "application/octet-stream";
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": mime, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }
}
