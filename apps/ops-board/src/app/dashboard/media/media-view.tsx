'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MediaAsset } from '@/lib/media-types';

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaView() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [backend, setBackend] = useState<string>('local');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/media/list');
      const data = await res.json();
      if (data.ok) {
        setAssets(data.assets);
        setBackend(data.backend);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(files: FileList | File[]) {
    setError('');
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', f);
        const res = await fetch('/api/media', { method: 'POST', body: fd });
        const data = await res.json();
        if (!data.ok) setError(data.error ?? '上传失败');
      }
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('删除这张素材？')) return;
    try {
      const res = await fetch(`/api/media/list?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      // 删除被拒（如 Vercel 上 503）时必须让运营看到原因，而不是静默无事发生
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? '删除失败，请稍后重试');
        return; // 失败：保留列表现状，不刷新
      }
      await load();
    } catch {
      toast.error('网络异常，删除未执行');
    }
  }

  function copyLink(asset: MediaAsset) {
    const abs = `${window.location.origin}${asset.url}`;
    navigator.clipboard.writeText(abs).catch(() => undefined);
    setCopied(asset.id);
    setTimeout(() => setCopied(''), 1500);
  }

  return (
    <PageContainer
      pageTitle='素材库'
      pageDescription='营销 / 跟进用产品图 · 上传、预览、复制链接、发给客户'
    >
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Badge variant='outline'>
            存储: {backend === 'feishu' ? '飞书素材库' : '本地（配 env 切飞书）'}
          </Badge>
          <span className='text-sm text-muted-foreground'>{assets.length} 张</span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors ${dragOver ? 'border-primary bg-accent/40' : 'border-muted-foreground/25'}`}
        >
          <p className='text-sm font-medium'>拖拽图片到这里，或</p>
          <div className='mt-3 flex items-center gap-2'>
            <Input
              ref={fileRef}
              type='file'
              accept='image/*'
              multiple
              className='hidden'
              onChange={(e) => {
                if (e.target.files?.length) void upload(e.target.files);
                e.target.value = '';
              }}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? '上传中…' : '选择图片'}
            </Button>
          </div>
          <p className='mt-2 text-xs text-muted-foreground'>
            PNG / JPG / WebP / GIF / SVG / AVIF · ≤ 20MB
          </p>
          {error && <p className='mt-2 text-sm text-destructive'>{error}</p>}
        </div>

        {loading ? (
          <p className='py-10 text-center text-sm text-muted-foreground'>加载中…</p>
        ) : assets.length === 0 ? (
          <p className='py-10 text-center text-sm text-muted-foreground'>
            还没有素材，先上传一张试试。
          </p>
        ) : (
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
            {assets.map((a) => (
              <Card key={a.id} className='overflow-hidden'>
                <div className='relative aspect-square bg-muted'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={a.name}
                    className='h-full w-full object-cover'
                    loading='lazy'
                  />
                </div>
                <CardContent className='space-y-2 p-3'>
                  <div className='truncate text-xs font-medium' title={a.name}>
                    {a.name}
                  </div>
                  <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                    <span>{fmtSize(a.size)}</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className='flex gap-1.5'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-7 flex-1 text-[11px]'
                      onClick={() => copyLink(a)}
                    >
                      {copied === a.id ? '已复制 ✓' : '复制链接'}
                    </Button>
                    <a
                      href={a.url}
                      download={a.name}
                      className='inline-flex h-7 items-center rounded-md border px-2 text-[11px] hover:bg-accent'
                    >
                      下载
                    </a>
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-7 text-[11px] text-destructive'
                      onClick={() => void remove(a.id)}
                    >
                      删
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
