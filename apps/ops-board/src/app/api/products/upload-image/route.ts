import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { isAllowedImage, MAX_MEDIA_BYTES, sanitizeFilename } from '@/lib/media-types';
import { EPHEMERAL_FS_ERROR } from '@/lib/ephemeral-fs';

export const runtime = 'nodejs';

/**
 * Upload a product image for a SKU. Writes to this app's
 * `public/generated/product-<id>.<ext>` — which is exactly what catalog.ts'
 * resolvePhoto() serves. (Syncing that image into the 3 site repos is a
 * separate step; see sites/scripts/sync-product-images.sh.)
 */
export async function POST(request: Request): Promise<Response> {
  // Vercel 的 serverless 文件系统是临时的：写 public/generated/ 会随下次部署
  // 蒸发。拒绝假成功 —— 503 + 中文说明，让运营去本地跑或配置持久化存储。
  // 放在最前面：连 multipart body 都不必解析。
  if (process.env.VERCEL) {
    return NextResponse.json({ ok: false, error: EPHEMERAL_FS_ERROR }, { status: 503 });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Expected multipart/form-data' }, { status: 400 });
  }
  const file = form.get('file');
  const productId = form.get('productId');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'file required' }, { status: 400 });
  }
  if (typeof productId !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(productId)) {
    return NextResponse.json({ ok: false, error: 'invalid productId' }, { status: 400 });
  }
  if (!isAllowedImage(file.type)) {
    return NextResponse.json(
      { ok: false, error: `unsupported type ${file.type}` },
      { status: 415 }
    );
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return NextResponse.json({ ok: false, error: 'exceeds 20MB' }, { status: 413 });
  }
  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1] || 'png';
  const fname = `product-${productId}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'generated');
  await fs.mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, sanitizeFilename(fname)), buf);
  return NextResponse.json({ ok: true, productId, photo_url: `/generated/${fname}` });
}
