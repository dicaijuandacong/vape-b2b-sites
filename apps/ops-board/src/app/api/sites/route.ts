import { NextResponse } from 'next/server';
import { getSitesStatus } from '@/lib/sites-status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const sites = await getSitesStatus();
    return NextResponse.json({ ok: true, sites });
  } catch (e) {
    console.error('[sites] status failed:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: 'status failed' }, { status: 500 });
  }
}
