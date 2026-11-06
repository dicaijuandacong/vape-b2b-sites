import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { readAudit } from '@/lib/audit';
import { getSessionRole } from '@/lib/rbac';

export const metadata: Metadata = { title: '审计日志' };
export const dynamic = 'force-dynamic';

const ACTION_LABELS: Record<string, string> = {
  'lead.status.update': '询盘状态变更',
  'product.create': '新建商品',
  'product.update': '编辑商品',
  'product.delete': '删除商品',
  'media.delete': '删除素材',
  'deploy.trigger': '触发重建'
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-CN', { hour12: false });
}

export default async function AuditPage() {
  // proxy.ts 已拦截非管理员；这里再做一层服务端兜底
  const role = await getSessionRole();
  if (role !== 'admin') {
    redirect('/dashboard/overview?denied=1');
  }

  // 优先读 Bitable「审计日志」表（新→旧，最多 200 条），失败回退本地文件
  const entries = await readAudit(200);

  return (
    <PageContainer pageTitle='审计日志' pageDescription='所有变更操作记录（新 → 旧），仅管理员可见'>
      {entries.length === 0 ? (
        <p className='py-10 text-center text-sm text-muted-foreground'>
          暂无审计记录。进行状态变更 / 商品编辑 / 素材删除 / 重建后会出现在这里。
        </p>
      ) : (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-44'>时间</TableHead>
                <TableHead className='w-28'>操作人</TableHead>
                <TableHead className='w-24'>角色</TableHead>
                <TableHead className='w-32'>动作</TableHead>
                <TableHead>对象</TableHead>
                <TableHead>详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e, i) => (
                <TableRow key={`${e.at}-${i}`}>
                  <TableCell className='font-mono text-xs'>{formatTime(e.at)}</TableCell>
                  <TableCell>{e.actorName}</TableCell>
                  <TableCell>
                    <Badge variant={e.actorRole === 'admin' ? 'default' : 'outline'}>
                      {e.actorRole === 'admin' ? '管理员' : '运营'}
                    </Badge>
                  </TableCell>
                  <TableCell>{ACTION_LABELS[e.action] ?? e.action}</TableCell>
                  <TableCell className='max-w-48 truncate font-mono text-xs' title={e.target}>
                    {e.target}
                  </TableCell>
                  <TableCell
                    className='max-w-64 truncate text-xs text-muted-foreground'
                    title={e.detail}
                  >
                    {e.detail ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
}
