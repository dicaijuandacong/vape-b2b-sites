import { signIn } from '@/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/icons';

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: '发起飞书登录失败，请重试',
  OAuthCallback: '飞书登录回调处理失败，请重试',
  OAuthAccountNotLinked: '该飞书账号未关联用户',
  Callback: '登录回调异常，请重试',
  Configuration: '登录服务配置异常，请联系管理员',
  AccessDenied: '访问被拒绝',
  Verification: '验证失败，请重试'
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, error } = await searchParams;

  // 只允许站内相对路径回跳，避免 open redirect
  const redirectTo =
    callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
      ? callbackUrl
      : '/dashboard/overview';

  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? '登录失败，请重试')
    : null;

  return (
    <div className='bg-muted/40 flex min-h-svh flex-col items-center justify-center p-4'>
      <Card className='w-full max-w-sm'>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>运营看板</CardTitle>
          <CardDescription>请使用飞书账号登录后继续访问</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              'use server';
              await signIn('feishu', { redirectTo });
            }}
          >
            <Button type='submit' size='lg' className='w-full'>
              <Icons.login data-icon='inline-start' />
              使用飞书登录
            </Button>
          </form>
          {errorMessage ? (
            <p className='text-destructive mt-4 text-center text-sm'>
              {errorMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
