// ============================================================
// RBAC — 角色系统（admin / operator）与管理员昵称脱敏
// ============================================================
// 角色来源：环境变量（逗号分隔，trim 后匹配）
//   ADMIN_OPEN_IDS  —— 主名单，匹配 session 的 open_id（user.id）或邮箱
//   ADMIN_EMAILS    —— 兜底名单，仅当 ADMIN_OPEN_IDS 未配置时生效
// 两个都没配 → 所有人都是 operator（fail soft，看板照常可用）。
//
// 注意：本文件**不能** import fs/audit —— proxy.ts（middleware/edge）
// 也会引用它，edge 运行时打包 fs 会直接挂掉。写日志走 `@/lib/audit`。
// ============================================================

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export type Role = 'admin' | 'operator';

/** 管理员（站长）在界面上统一显示的脱敏昵称。 */
export const ADMIN_DISPLAY_NAME = 'Admin';

/** 做角色判断所需的最小 user 形状（session.user 兼容）。 */
export interface RoleUser {
  id?: string | null;
  email?: string | null;
  name?: string | null;
}

function parseEnvList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 判断用户是否为管理员。未登录 / 未配置名单时一律返回 false。 */
export function isAdminUser(user: RoleUser | null | undefined): boolean {
  if (!user) return false;

  const adminIds = parseEnvList(process.env.ADMIN_OPEN_IDS);
  if (adminIds.length > 0) {
    const id = user.id?.trim();
    const email = user.email?.trim().toLowerCase();
    if (id && adminIds.includes(id)) return true;
    if (email && adminIds.some((entry) => entry.toLowerCase() === email)) return true;
    return false;
  }

  // 兜底：ADMIN_OPEN_IDS 为空时允许用 ADMIN_EMAILS 匹配邮箱
  const adminEmails = parseEnvList(process.env.ADMIN_EMAILS).map((s) => s.toLowerCase());
  const email = user.email?.trim().toLowerCase();
  if (adminEmails.length > 0 && email) {
    return adminEmails.includes(email);
  }
  return false;
}

export function roleForUser(user: RoleUser | null | undefined): Role {
  return isAdminUser(user) ? 'admin' : 'operator';
}

/**
 * 显示名脱敏：管理员一律显示为「Admin」，其他人显示真实飞书名。
 * 用于 header / user-nav / 审计日志等所有对外展示处。
 */
export function displayNameFor(user: RoleUser | null | undefined): string {
  if (isAdminUser(user)) return ADMIN_DISPLAY_NAME;
  return user?.name?.trim() || '用户';
}

/** 服务端读取当前 session 角色。 */
export async function getSessionRole(): Promise<Role> {
  const session = await auth();
  return roleForUser(session?.user);
}

/**
 * API 路由守卫：非管理员返回 403 NextResponse，管理员返回 null。
 * 用法：
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });
  }
  if (!isAdminUser(session.user)) {
    return NextResponse.json({ ok: false, error: '无权限：仅管理员可执行此操作' }, { status: 403 });
  }
  return null;
}
