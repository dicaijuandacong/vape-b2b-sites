import { auth } from '@/auth';
import { isAdminUser } from '@/lib/rbac';
import { NextResponse } from 'next/server';

const PROTECTED_PREFIX = '/dashboard';
const LOGIN_PATH = '/login';
const DEFAULT_AFTER_LOGIN = '/dashboard/overview';
// API routes that serve sensitive ops data — require auth too.
const PROTECTED_API = [
  '/api/leads',
  '/api/products',
  '/api/media',
  '/api/sites',
  '/api/orders',
  '/api/prospects',
  '/api/cache',
  '/api/notifications'
];
// 仅管理员可见的页面 —— operator 访问会被重定向回总览并弹出「无权限」提示。
const ADMIN_ONLY_PAGES = ['/dashboard/sites', '/dashboard/audit'];
// Local dev / self-hosted bypass: SKIP_AUTH=1 disables the login gate.
// 安全守卫：只在非生产环境生效。本地 dev server（next dev）的 NODE_ENV 恒为
// 'development'，Vercel 部署恒为 'production'。若不加这层守卫，SKIP_AUTH=1
// 一旦被误带上生产（比如照抄 .env.local），整个运营后台将完全公开 ——
// 等于自杀开关。本地免登用法不受影响。
const SKIP_AUTH =
  process.env.NODE_ENV !== 'production' &&
  (process.env.SKIP_AUTH === '1' || process.env.SKIP_AUTH === 'true');

export const proxy = auth((req) => {
  if (SKIP_AUTH) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // 已登录用户访问登录页 → 直接进入看板
  if (pathname.startsWith(LOGIN_PATH) && isLoggedIn) {
    return NextResponse.redirect(new URL(DEFAULT_AFTER_LOGIN, req.nextUrl));
  }

  // 未登录用户访问 /dashboard/* → 重定向到登录页，并带上回跳地址
  if (pathname.startsWith(PROTECTED_PREFIX) && !isLoggedIn) {
    const loginUrl = new URL(LOGIN_PATH, req.nextUrl);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // 未登录访问受保护 API → 401（飞书 OAuth 端点 /api/auth/* 保持公开）
  if (PROTECTED_API.some((p) => pathname.startsWith(p)) && !isLoggedIn) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // 已登录但非管理员访问管理员专属页面 → 重定向到总览 + 无权限提示
  if (
    isLoggedIn &&
    ADMIN_ONLY_PAGES.some((p) => pathname.startsWith(p)) &&
    !isAdminUser(req.auth?.user)
  ) {
    const url = new URL(DEFAULT_AFTER_LOGIN, req.nextUrl);
    url.searchParams.set('denied', '1');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};
