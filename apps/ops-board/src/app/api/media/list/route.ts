import { NextResponse } from 'next/server';
import { listMedia, deleteMedia, mediaBackend } from '@/lib/media-store';
import { isEphemeralFsWriteError } from '@/lib/ephemeral-fs';
import { recordAudit } from '@/lib/audit';
import { requireAdmin } from '@/lib/rbac';

export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  try {
    const assets = await listMedia();
    return NextResponse.json({ ok: true, backend: mediaBackend(), assets });
  } catch (e) {
    console.error('[media] list failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: '读取素材列表失败，请稍后重试' }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  // 删除素材属于危险操作，仅管理员
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: '缺少 id 参数' }, { status: 400 });
  try {
    const ok = await deleteMedia(id);
    if (ok) await recordAudit('media.delete', id);
    return NextResponse.json({ ok });
  } catch (e) {
    // local backend 在 Vercel 上拒绝写入（临时文件系统）→ 503 + 中文说明
    if (isEphemeralFsWriteError(e)) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 503 });
    }
    console.error('[media] delete failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: '删除失败，请稍后重试' }, { status: 500 });
  }
}
