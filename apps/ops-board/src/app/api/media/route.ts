import { NextResponse } from 'next/server';
import { saveMedia } from '@/lib/media-store';
import { isEphemeralFsWriteError } from '@/lib/ephemeral-fs';
import { isAllowedImage, MAX_MEDIA_BYTES } from '@/lib/media-types';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: '请求格式错误：需要 multipart/form-data' },
      { status: 400 }
    );
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: '缺少 file 字段' }, { status: 400 });
  }
  if (!isAllowedImage(file.type)) {
    return NextResponse.json(
      { ok: false, error: `不支持的图片类型：${file.type}` },
      { status: 415 }
    );
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return NextResponse.json({ ok: false, error: '图片超过 20MB 大小限制' }, { status: 413 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const asset = await saveMedia(file.name, file.type, buf);
    return NextResponse.json({ ok: true, asset });
  } catch (e) {
    // local backend 在 Vercel 上拒绝写入（临时文件系统）→ 503 + 中文说明，
    // 让运营知道图片没存上，而不是假成功。
    if (isEphemeralFsWriteError(e)) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 503 });
    }
    console.error('[media] save failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: '上传失败，请稍后重试' }, { status: 500 });
  }
}
