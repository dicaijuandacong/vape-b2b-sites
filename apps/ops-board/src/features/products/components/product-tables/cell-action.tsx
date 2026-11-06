'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { deleteProductMutation } from '../../api/mutations';
import type { Product } from '../../api/types';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CellActionProps {
  data: Product;
}

export function CellAction({ data }: CellActionProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...deleteProductMutation,
    onSuccess: () => {
      toast.success('已下架');
      setOpen(false);
    },
    onError: () => {
      toast.error('下架失败');
    }
  });

  async function onImageChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('productId', data.id);
      const res = await fetch('/api/products/upload-image', { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? 'upload failed');
      toast.success('图片已更新');
      // Refresh product list so the new photo_url shows.
      await queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input ref={fileRef} type='file' accept='image/*' className='hidden' onChange={onImageChosen} />
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant='ghost' className='h-8 w-8 p-0' />}>
          <span className='sr-only'>Open menu</span>
          <Icons.ellipsis className='h-4 w-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>操作</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/product/${data.id}`)}>
              <Icons.edit className='mr-2 h-4 w-4' /> 编辑
            </DropdownMenuItem>
            <DropdownMenuItem disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Icons.upload className='mr-2 h-4 w-4' /> {uploading ? '上传中…' : '换图片'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <Icons.trash className='mr-2 h-4 w-4' /> {data.active ? '下架' : '删除'}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

