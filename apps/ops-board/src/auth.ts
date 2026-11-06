import NextAuth, { customFetch } from 'next-auth';
import type { OAuthConfig } from 'next-auth/providers';
import type { TokenSet } from '@auth/core/types';

/**
 * 飞书 (Lark) OAuth 登录。
 *
 * 飞书的 code → token 交换与标准 OAuth2 不同：
 * - 需要先换取 app_access_token（app_id + app_secret）
 * - token 请求需要 `Authorization: Bearer <app_access_token>` 头 + JSON body
 * - 响应包在 `{ code, msg, data }` 信封里
 *
 * 因此通过 Auth.js 的 `customFetch` 钩子拦截 token 请求，
 * 重写为飞书要求的格式，并把 `data` 解包成标准 OAuth token 响应。
 * userinfo 则通过 `userinfo.request` 自行获取并解包。
 */

const FEISHU_AUTHORIZE_URL = 'https://accounts.feishu.cn/open-apis/authen/v1/authorize';
const FEISHU_TOKEN_URL = 'https://open.feishu.cn/open-apis/authen/v1/oidc/access_token';
const FEISHU_APP_ACCESS_TOKEN_URL =
  'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal';
const FEISHU_USER_INFO_URL = 'https://open.feishu.cn/open-apis/authen/v1/user_info';

const appId = process.env.FEISHU_APP_ID;
const appSecret = process.env.FEISHU_APP_SECRET;

interface FeishuEnvelope {
  code: number;
  msg?: string;
}

interface FeishuAppAccessTokenResponse extends FeishuEnvelope {
  app_access_token?: string;
}

interface FeishuTokenData {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  scope?: string;
}

interface FeishuUserInfo {
  open_id: string;
  union_id?: string;
  name?: string;
  en_name?: string;
  avatar_url?: string;
  avatar_big?: string;
  email?: string;
}

async function fetchFeishuAppAccessToken(): Promise<string> {
  const res = await fetch(FEISHU_APP_ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });
  const json = (await res.json()) as FeishuAppAccessTokenResponse;
  if (json.code !== 0 || !json.app_access_token) {
    throw new Error(`Feishu app_access_token failed: ${json.code} ${json.msg ?? ''}`);
  }
  return json.app_access_token;
}

function tokenErrorResponse(description: string): Response {
  return new Response(
    JSON.stringify({
      error: 'feishu_token_error',
      error_description: description
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

async function feishuFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  if (!url.includes('/open-apis/authen/v1/oidc/access_token')) {
    return fetch(input, init);
  }

  try {
    // oauth4webapi 以 URLSearchParams 作为 body 发出 code 交换请求
    const params = new URLSearchParams(String(init?.body ?? ''));
    const code = params.get('code');
    if (!code) {
      return tokenErrorResponse('Missing authorization code');
    }

    const appAccessToken = await fetchFeishuAppAccessToken();
    const res = await fetch(FEISHU_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${appAccessToken}`
      },
      body: JSON.stringify({ grant_type: 'authorization_code', code })
    });
    const json = (await res.json()) as FeishuEnvelope & {
      data?: FeishuTokenData;
    };
    if (json.code !== 0 || !json.data?.access_token) {
      return tokenErrorResponse(`${json.code} ${json.msg ?? ''}`.trim());
    }
    // 解包 data → 标准 OAuth token 响应，交给 oauth4webapi 处理
    return new Response(JSON.stringify(json.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return tokenErrorResponse(
      error instanceof Error ? error.message : 'Unknown Feishu token error'
    );
  }
}

const feishuProvider: OAuthConfig<FeishuUserInfo> = {
  id: 'feishu',
  name: '飞书',
  type: 'oauth',
  clientId: appId,
  clientSecret: appSecret,
  // 飞书不支持 PKCE，仅使用 state 校验
  checks: ['state'],
  authorization: {
    url: FEISHU_AUTHORIZE_URL,
    // 飞书 OAuth 用 contact scope（不是 OIDC 的 openid profile email）；
    // 传空串会让 Auth.js 构建授权 URL 失败（UnknownAction）。
    params: { scope: 'contact:user.base:readonly' }
  },
  token: {
    url: FEISHU_TOKEN_URL
  },
  userinfo: {
    url: FEISHU_USER_INFO_URL,
    async request({ tokens }: { tokens: TokenSet }): Promise<FeishuUserInfo> {
      const res = await fetch(FEISHU_USER_INFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const json = (await res.json()) as FeishuEnvelope & {
        data?: FeishuUserInfo;
      };
      if (json.code !== 0 || !json.data?.open_id) {
        throw new Error(`Feishu user_info failed: ${json.code} ${json.msg ?? ''}`);
      }
      return json.data;
    }
  },
  profile(profile) {
    return {
      id: profile.open_id,
      name: profile.name ?? profile.en_name ?? profile.open_id,
      // 邮箱用于 ADMIN_EMAILS 兜底匹配；飞书未授权 email scope 时为 null（fail soft）
      email: profile.email ?? null,
      image: profile.avatar_url ?? profile.avatar_big ?? null
    };
  },
  [customFetch]: feishuFetch
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [feishuProvider],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = String(token.id);
      }
      return session;
    }
  }
});
