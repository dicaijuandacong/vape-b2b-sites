import type { Metadata } from 'next';
import { SitesView } from '@/features/sites/components/sites-view';

export const metadata: Metadata = { title: '站点管理' };
export const dynamic = 'force-dynamic';

export default function SitesPage() {
  return <SitesView />;
}
