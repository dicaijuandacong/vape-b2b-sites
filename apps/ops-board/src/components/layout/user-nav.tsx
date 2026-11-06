'use client';

import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTransition } from 'react';

interface UserNavUser {
  name?: string | null;
  image?: string | null;
}

interface UserNavProps {
  user: UserNavUser | null | undefined;
  onSignOut: () => Promise<void>;
}

export function UserNav({ user, onSignOut }: UserNavProps) {
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const name = user.name ?? '用户';
  const fallback = name.trim().charAt(0).toUpperCase() || '用';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className='hover:bg-muted flex items-center gap-2 rounded-full p-1 pr-2 outline-none'>
        <Avatar className='h-8 w-8'>
          {user.image ? <AvatarImage src={user.image} alt={name} /> : null}
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <span className='hidden max-w-24 truncate text-sm font-medium md:inline'>
          {name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-40'>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='truncate'>{name}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isPending}
          onClick={() => startTransition(() => onSignOut())}
        >
          <Icons.logout className='mr-2 h-4 w-4' />
          {isPending ? '正在退出…' : '退出登录'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
