import React from 'react';
import { auth, signOut } from '@/auth';
import { displayNameFor } from '@/lib/rbac';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { ThemeSelector } from '../themes/theme-selector';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import { UserNav } from './user-nav';
import { NotificationBell } from './notification-bell';

async function signOutAction() {
  'use server';
  await signOut({ redirectTo: '/login' });
}

export default async function Header() {
  const session = await auth();
  // 管理员展示名脱敏为「Admin」，其他人显示真实飞书名
  const user = session?.user
    ? { name: displayNameFor(session.user), image: session.user.image ?? null }
    : session?.user;

  return (
    <header className='bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 backdrop-blur-md md:h-14'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4 data-vertical:self-center' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <ThemeModeToggle />
        <div className='hidden sm:block'>
          <ThemeSelector />
        </div>
        <NotificationBell />
        <UserNav user={user} onSignOut={signOutAction} />
      </div>
    </header>
  );
}
