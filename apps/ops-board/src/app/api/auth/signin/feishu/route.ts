import { NextResponse } from 'next/server';
import { handlers, signIn } from '@/auth';

/**
 * 飞书登录的 GET 兼容入口。
 *
 * Auth.js v5 的 signin action 按 HTTP 方法分发（@auth/core/lib/index.js）：
 * - POST /api/auth/signin/:provider → actions.signIn → 构建授权 URL 并 302（正常路径）
 * - GET  /api/auth/signin/:provider → renderPage.signin(providerId)，
 *   而 providerId 非空时直接抛 UnknownAction("Unsupported action")
 *   （@auth/core/lib/pages/index.js），最终被包装成 302 → error=Configuration
 *
 * 即 GET 走「渲染登录页」分支，永远不会发起 OAuth。浏览器地址栏/书签/
 * <a href> 直接访问该 URL 必然报 Configuration。
 *
 * 这里用静态路由接管该路径（Next.js 静态段优先于 [...nextauth] 动态段）：
 * GET 内部调用服务端 signIn('feishu', { redirect: false })——它以
 * skipCSRFCheck + raw 模式调 Auth()，生成授权 URL 并把 state cookie
 * 写入响应 cookie jar——然后手动 302 到飞书授权页。
 * POST 仍透传给 Auth.js 原生处理器，行为不变。
 */
export const { POST } = handlers;

const DEFAULT_AFTER_LOGIN = '/dashboard/overview';

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get('callbackUrl');
  // 与登录页一致：只允许站内相对路径回跳，避免 open redirect
  const redirectTo =
    callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
      ? callbackUrl
      : DEFAULT_AFTER_LOGIN;

  try {
    const authorizeUrl = await signIn('feishu', { redirect: false, redirectTo });
    return NextResponse.redirect(authorizeUrl, 302);
  } catch (error) {
    console.error('[feishu-signin] 构建飞书授权 URL 失败', error);
    return NextResponse.redirect(new URL('/login?error=Configuration', origin), 302);
  }
}
