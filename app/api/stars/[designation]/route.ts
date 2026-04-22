/**
 * @fileoverview GET /api/stars/[designation]
 *
 * Returns star metadata + the public name record (if approved). The
 * claim token is never echoed.
 *
 * Optional `?claim=<token>` lets a namer view their own pending submission
 * - the rest of the world sees the star as unnamed until approval.
 */

import { NextRequest, NextResponse } from 'next/server';
import { namedStarStore } from '../../../lib/storage';
import { getStarByDesignation, isValidDesignation } from '../../../lib/stars';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ designation: string }> }
) {
  const { designation } = await params;
  const { searchParams } = new URL(req.url);
  const providedClaim = searchParams.get('claim');

  if (!isValidDesignation(designation)) {
    return NextResponse.json({ error: 'Invalid designation' }, { status: 400 });
  }

  const star = getStarByDesignation(designation);
  if (!star) {
    return NextResponse.json({ error: 'Star not found' }, { status: 404 });
  }

  const record = await namedStarStore.get(designation);
  if (!record) {
    return NextResponse.json({ star, named: null });
  }

  // Approved → public.
  if (record.status === 'approved') {
    const { claimToken: _ct, suspicious: _s, status: _st, ...publicFields } = record;
    return NextResponse.json({ star, named: publicFields });
  }

  // Pending → only the namer (with their claim token) sees the preview.
  if (record.status === 'pending' && providedClaim && providedClaim === record.claimToken) {
    const { claimToken: _ct, suspicious: _s, ...rest } = record;
    return NextResponse.json({ star, named: null, pendingForNamer: rest });
  }

  // Otherwise the star is publicly unnamed.
  return NextResponse.json({ star, named: null });
}
