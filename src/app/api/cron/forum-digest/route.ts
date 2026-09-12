import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

import { processDueForumDigests } from '@/lib/help/forum-digest';

export const dynamic = 'force-dynamic';

function bearerMatches(header: string | null, secret: string) {
  const expected = `Bearer ${secret}`;
  const provided = header ?? '';
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: 'cron secret missing' }, { status: 503 });
  }
  if (!bearerMatches(request.headers.get('authorization'), secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result = await processDueForumDigests();
  if (result.skipped) {
    console.info('forum digest skipped, already running');
  }
  return NextResponse.json(result);
}
