import { promises as fs } from "fs";
import path from "path";

export type InboxChannel = "newsletter" | "wholesale";

const INBOX_DIR = path.join(process.cwd(), "data", "inbox");

async function ensureInboxDir(): Promise<void> {
  await fs.mkdir(INBOX_DIR, { recursive: true });
}

function inboxFilePath(channel: InboxChannel): string {
  return path.join(INBOX_DIR, `${channel}.jsonl`);
}

export async function appendInbox(
  channel: InboxChannel,
  payload: Record<string, unknown>,
): Promise<void> {
  await ensureInboxDir();
  const record = {
    ts: new Date().toISOString(),
    ip: typeof payload.ip === "string" ? payload.ip : null,
    ua: typeof payload.ua === "string" ? payload.ua : null,
    ...payload,
  };
  const line = JSON.stringify(record) + "\n";
  await fs.appendFile(inboxFilePath(channel), line, "utf8");
}

/**
 * Read existing JSONL records (best-effort). Returns [] if file is missing.
 * Used by route handlers for naive rate-limiting.
 */
export async function readInbox(
  channel: InboxChannel,
): Promise<Array<Record<string, unknown>>> {
  const file = inboxFilePath(channel);
  try {
    const raw = await fs.readFile(file, "utf8");
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    const out: Array<Record<string, unknown>> = [];
    for (const line of lines) {
      try {
        out.push(JSON.parse(line) as Record<string, unknown>);
      } catch {
        // Skip malformed lines silently
      }
    }
    return out;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "ENOENT"
    ) {
      return [];
    }
    throw err;
  }
}
