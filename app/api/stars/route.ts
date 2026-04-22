/**
 * @fileoverview GET /api/stars
 * Lists publicly-approved named stars (paginated, recent first by default).
 * Strips the claim token before returning — that's a per-namer secret.
 */

import { NextRequest, NextResponse } from 'next/server';
import { namedStarStore } from '../../lib/storage';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 200);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0);
  const order = searchParams.get('order') === 'oldest' ? 'oldest' : 'recent';

  // Public list — approved only.
  const list = await namedStarStore.list({ limit, offset, order, status: 'approved' });
  const items = list.map((s) => {
    const { claimToken: _claimToken, suspicious: _suspicious, status: _status, ...publicFields } = s;
    return publicFields;
  });
  const total = await namedStarStore.count();

  return NextResponse.json({
    items,
    total,
    limit,
    offset,
  });
}
