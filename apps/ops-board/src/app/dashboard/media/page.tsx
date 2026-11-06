import type { Metadata } from 'next';
import { MediaView } from './media-view';

export const metadata: Metadata = { title: '素材库' };
export const dynamic = 'force-dynamic';

export default function MediaPage() {
  return <MediaView />;
}
