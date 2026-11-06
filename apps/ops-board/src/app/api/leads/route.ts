import { NextResponse } from 'next/server';
import { getLeads } from '@/lib/leads';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getLeads();
  return NextResponse.json(result);
}
