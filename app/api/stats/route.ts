/**
 * @fileoverview GET /api/stats
 * Aggregate site stats — stars in field, total named, etc.
 */

import { NextResponse } from 'next/server';
import {
  namedStarStore,
  wishStore,
  coloringSubmissionStore,
  charityNominationStore,
} from '../../lib/storage';
import { TOTAL_STARS } from '../../lib/stars';

export async function GET() {
  const [named, wishCounts, coloringCounts, nominationCounts] = await Promise.all([
    namedStarStore.count(),
    wishStore.countByStatus(),
    coloringSubmissionStore.countByStatus(),
    charityNominationStore.countByStatus(),
  ]);

  return NextResponse.json({
    totalStars: TOTAL_STARS,
    named,
    available: TOTAL_STARS - named,
    namedPercent: Math.round((named / TOTAL_STARS) * 1000) / 10,
    wishesApproved: wishCounts.approved,
    coloringApproved: coloringCounts.approved,
    nominationsApproved: nominationCounts.approved,
  });
}
