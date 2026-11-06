import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getTenantAccessToken, readFeishuConfig } from './feishu-base';
import { sanitizeFilename, type MediaAsset } from './media-types';
import { assertLocalFsWritable } from './ephemeral-fs';

/**
 * Media storage abstraction. Two backends, selected by env (no code change):
 *  - local:  write bytes to ops/public/uploads + metadata JSON (works offline/dev)
 *  - feishu: upload bytes via drive upload_all, metadata in a Bitable `media` table
 *
 * Selection: FEISHU media env (FEISHU_MEDIA_FOLDER_TOKEN) + feishu creds present
 * → feishu; otherwise local.
 */

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const META_FILE = path.join(UPLOAD_DIR, '_meta.json');

// Vercel 临时文件系统守卫见 ./ephemeral-fs：local backend 的写操作
// （上传 / 删除 / 元数据写）在 Vercel 上必须拒绝，否则接口返回成功
// 但数据随部署蒸发 —— 假成功比报错更糟。读操作保留。

function feishuConfigured(): boolean {
  const e = process.env;
  return !!(
    (e.FEISHU_APP_ID && e.FEISHU_APP_SECRET && e.FEISHU_MEDIA_FOLDER_TOKEN) // target drive folder for assets
  );
}

// ---------- local backend ----------

async function readMeta(): Promise<MediaAsset[]> {
  try {
    const raw = await fs.readFile(META_FILE, 'utf8');
    return JSON.parse(raw) as MediaAsset[];
  } catch {
    return [];
  }
}

async function writeMeta(items: MediaAsset[]): Promise<void> {
  assertLocalFsWritable(); // 元数据写同样拒绝：Vercel 上 _meta.json 随部署蒸发
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(META_FILE, JSON.stringify(items, null, 2), 'utf8');
}

async function localSave(name: string, mime: string, buf: Buffer): Promise<MediaAsset> {
  assertLocalFsWritable();
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const id = crypto.randomBytes(8).toString('hex');
  const safe = sanitizeFilename(name);
  const file = `${id}-${safe}`;
  await fs.writeFile(path.join(UPLOAD_DIR, file), buf);
  const asset: MediaAsset = {
    id,
    name: safe,
    mime,
    size: buf.length,
    source: 'local',
    url: `/api/media/${id}`,
    createdAt: new Date().toISOString()
  };
  const meta = await readMeta();
  meta.unshift(asset);
  await writeMeta(meta);
  return asset;
}

async function localList(): Promise<MediaAsset[]> {
  return (await readMeta()).filter((a) => a.source === 'local');
}

async function localDelete(id: string): Promise<boolean> {
  assertLocalFsWritable();
  const meta = await readMeta();
  const idx = meta.findIndex((a) => a.id === id && a.source === 'local');
  if (idx === -1) return false;
  meta.splice(idx, 1);
  await writeMeta(meta);
  // File on disk is `${id}-<name>`; find and remove it.
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const file = files.find((f) => f.startsWith(`${id}-`));
    if (file) await fs.unlink(path.join(UPLOAD_DIR, file)).catch(() => undefined);
  } catch {
    /* dir missing — nothing to delete */
  }
  return true;
}

// ---------- feishu backend ----------

async function feishuUpload(name: string, mime: string, buf: Buffer): Promise<MediaAsset> {
  const token = await getTenantAccessToken();
  const folder = process.env.FEISHU_MEDIA_FOLDER_TOKEN!;
  const form = new FormData();
  form.append('file_name', sanitizeFilename(name));
  form.append('parent_type', 'explorer');
  form.append('parent_node', folder);
  form.append('size', String(buf.length));
  form.append('file', new Blob([new Uint8Array(buf)], { type: mime }), sanitizeFilename(name));

  const res = await fetch('https://open.feishu.cn/open-apis/drive/v1/files/upload_all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const data = (await res.json()) as { code: number; msg?: string; data?: { file_token?: string } };
  if (!res.ok || data.code !== 0 || !data.data?.file_token) {
    throw new Error(`feishu upload failed: ${data.msg ?? res.status}`);
  }
  const fileToken = data.data.file_token;
  // Record metadata in the Bitable `media` table if configured; else local meta JSON.
  await recordFeishuMeta({
    id: fileToken,
    name: sanitizeFilename(name),
    mime,
    size: buf.length,
    source: 'feishu',
    fileToken,
    url: `/api/media/${fileToken}`,
    createdAt: new Date().toISOString()
  });
  return {
    id: fileToken,
    name: sanitizeFilename(name),
    mime,
    size: buf.length,
    source: 'feishu',
    fileToken,
    url: `/api/media/${fileToken}`,
    createdAt: new Date().toISOString()
  };
}

async function recordFeishuMeta(asset: MediaAsset): Promise<void> {
  // Persist metadata. Prefer the Bitable `media` table (FEISHU_MEDIA_TABLE_ID);
  // fall back to local meta JSON so feishu uploads are still listed.
  const tableId = process.env.FEISHU_MEDIA_TABLE_ID;
  if (tableId && process.env.FEISHU_BITABLE_APP_TOKEN) {
    try {
      const token = await getTenantAccessToken();
      const cfg = readFeishuConfig();
      await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${cfg.bitableAppToken}/tables/${tableId}/records`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify({
            fields: {
              名称: asset.name,
              file_token: asset.fileToken,
              mime: asset.mime,
              大小: asset.size,
              创建时间: Date.parse(asset.createdAt)
            }
          })
        }
      );
      return;
    } catch (e) {
      console.error(
        '[media] feishu meta write failed, using local meta:',
        e instanceof Error ? e.message : e
      );
    }
  }
  // 元数据回退到本地 _meta.json。Vercel 上 writeMeta 会抛 EphemeralFsWriteError：
  // 字节已传进飞书但元数据无法持久化 → 素材在列表里不可见，必须让调用方知道失败。
  const meta = await readMeta();
  meta.unshift(asset);
  await writeMeta(meta);
}

async function feishuList(): Promise<MediaAsset[]> {
  const tableId = process.env.FEISHU_MEDIA_TABLE_ID;
  if (tableId && process.env.FEISHU_BITABLE_APP_TOKEN) {
    try {
      const token = await getTenantAccessToken();
      const cfg = readFeishuConfig();
      const res = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${cfg.bitableAppToken}/tables/${tableId}/records?page_size=500`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = (await res.json()) as {
        code: number;
        data?: { items?: Array<{ record_id?: string; fields?: Record<string, unknown> }> };
      };
      if (data.code === 0) {
        return (data.data?.items ?? []).map((it) => {
          const f = it.fields ?? {};
          const ft = typeof f['file_token'] === 'string' ? f['file_token'] : '';
          const ct = f['创建时间'];
          return {
            id: ft || (it.record_id ?? ''),
            name: typeof f['名称'] === 'string' ? f['名称'] : 'image',
            mime: typeof f['mime'] === 'string' ? f['mime'] : 'image/jpeg',
            size: typeof f['大小'] === 'number' ? f['大小'] : 0,
            source: 'feishu',
            fileToken: ft,
            url: `/api/media/${ft}`,
            createdAt:
              typeof ct === 'number' ? new Date(ct).toISOString() : new Date().toISOString()
          } satisfies MediaAsset;
        });
      }
    } catch (e) {
      console.error(
        '[media] feishu list failed, using local meta:',
        e instanceof Error ? e.message : e
      );
    }
  }
  return (await readMeta()).filter((a) => a.source === 'feishu');
}

async function feishuDelete(id: string): Promise<boolean> {
  const token = await getTenantAccessToken();
  const res = await fetch(`https://open.feishu.cn/open-apis/drive/v1/files/${id}?type=file`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  // Best-effort: also drop from local meta if present.
  // Vercel 上跳过：本地 _meta.json 是临时/只读的，清理无意义且写操作已被拒绝。
  if (!process.env.VERCEL) {
    const meta = await readMeta();
    const idx = meta.findIndex((a) => a.id === id);
    if (idx !== -1) {
      meta.splice(idx, 1);
      await writeMeta(meta);
    }
  }
  return res.ok;
}

/** Stream feishu file bytes (for /api/media/[id]). */
export async function feishuFetch(
  fileToken: string
): Promise<{ buf: Buffer; mime: string } | null> {
  try {
    const token = await getTenantAccessToken();
    const res = await fetch(
      `https://open.feishu.cn/open-apis/drive/v1/files/${fileToken}/download`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const mime = res.headers.get('content-type') ?? 'application/octet-stream';
    const buf = Buffer.from(await res.arrayBuffer());
    return { buf, mime };
  } catch {
    return null;
  }
}

// ---------- public API (auto-select backend) ----------

export function mediaBackend(): 'local' | 'feishu' {
  return feishuConfigured() ? 'feishu' : 'local';
}

export async function saveMedia(name: string, mime: string, buf: Buffer): Promise<MediaAsset> {
  return feishuConfigured() ? feishuUpload(name, mime, buf) : localSave(name, mime, buf);
}

export async function listMedia(): Promise<MediaAsset[]> {
  return feishuConfigured() ? feishuList() : localList();
}

export async function deleteMedia(id: string): Promise<boolean> {
  return feishuConfigured() ? feishuDelete(id) : localDelete(id);
}

export { feishuConfigured };
