import { NextRequest, NextResponse } from 'next/server';
import { updateLeadFields } from '@/lib/leads';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const SAFE_STR = /^[\s\S]{0,200}$/; // 单字段 200 字上限防注入膨胀（不用 s flag，兼容项目 target）
const SAFE_BRANDS = /^[a-zA-Z0-9 &+\-.]{1,60}$/;

/** 编辑询盘客户信息（详情页「编辑」按钮）。邮箱/来源站/类型不可改。 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const input: Parameters<typeof updateLeadFields>[1] = {};
  for (const key of ['company', 'country', 'phone', 'volume', 'notes'] as const) {
    if (b[key] !== undefined) {
      const v = String(b[key] ?? '');
      if (!SAFE_STR.test(v)) {
        return NextResponse.json({ error: `${key} too long` }, { status: 400 });
      }
      input[key] = v;
    }
  }
  if (b.brands !== undefined) {
    if (!Array.isArray(b.brands) || b.brands.length > 12) {
      return NextResponse.json({ error: 'brands invalid' }, { status: 400 });
    }
    const brands = b.brands
      .map(String)
      .filter((s) => SAFE_BRANDS.test(s))
      .slice(0, 12);
    input.brands = brands;
  }
  if (Object.keys(input).length === 0) {
    return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
  }

  try {
    const result = await updateLeadFields(id, input);
    const changed = Object.keys(input).join('/');
    await recordAudit('lead.fields.update', id, `编辑客户信息: ${changed}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/leads] update fields failed:', error);
    return NextResponse.json({ error: 'failed to update lead fields' }, { status: 502 });
  }
}
