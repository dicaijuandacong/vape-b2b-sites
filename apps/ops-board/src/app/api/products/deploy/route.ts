// ============================================================
// Route Handler — 触发站点重建 / 部署（仅管理员）
// ============================================================
// 前端站点管理页（/dashboard/sites）的「🚀 重建」按钮调用本端点。
// 通过 Vercel Deploy Hook 触发重建：在环境变量 `VERCEL_DEPLOY_HOOKS`
// 里配置逗号分隔的 hook URL 列表；未配置时返回 501（fail soft，
// 不会阻断看板其他功能）。所有成功/失败的触发都会写审计日志。
// ============================================================

import { NextResponse } from 'next/server';
import { recordAudit } from '@/lib/audit';
import { requireAdmin } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function deployHooks(): string[] {
  return (process.env.VERCEL_DEPLOY_HOOKS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(): Promise<Response> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const hooks = deployHooks();
  if (hooks.length === 0) {
    await recordAudit('deploy.trigger', 'none', '失败：未配置 VERCEL_DEPLOY_HOOKS');
    return NextResponse.json(
      { ok: false, error: '未配置 VERCEL_DEPLOY_HOOKS，无法触发重建' },
      { status: 501 }
    );
  }

  const results = await Promise.all(
    hooks.map(async (url) => {
      try {
        const res = await fetch(url, { method: 'POST' });
        return { url, ok: res.ok, status: res.status };
      } catch (e) {
        return { url, ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
      }
    })
  );

  const okCount = results.filter((r) => r.ok).length;
  await recordAudit(
    'deploy.trigger',
    `${okCount}/${results.length} hooks`,
    results.map((r) => `${r.url} → ${r.ok ? r.status : `失败 ${r.status}`}`).join('; ')
  );

  return NextResponse.json(
    { ok: okCount === results.length, results },
    { status: okCount > 0 ? 200 : 502 }
  );
}
