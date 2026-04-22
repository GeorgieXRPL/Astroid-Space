/**
 * @fileoverview Charity nomination moderation (admin-only).
 *
 * POST /api/charity-nominations/moderate
 *   Headers: x-admin-token: <ADMIN_TOKEN env var>
 *   Body:    { id: string, status: 'approved' | 'rejected' }
 *
 * GET /api/charity-nominations/moderate
 *   Headers: x-admin-token
 *   Returns { pending: CharityNomination[], counts: {pending,approved,rejected} }
 *
 * Same CLI-friendly pattern as wishes/coloring moderation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { charityNominationStore } from '../../../lib/storage';
import { ensureMinDelay, isAuthorizedRequest } from '../../../lib/adminAuth';
import { validationErrorResponse } from '../../../lib/requestGuards';

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(['approved', 'rejected']),
});

export async function GET(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return ensureMinDelay(
      400,
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
  }

  const [pending, counts] = await Promise.all([
    charityNominationStore.list({ status: 'pending', limit: 200 }),
    charityNominationStore.countByStatus(),
  ]);

  return NextResponse.json({ pending, counts });
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedRequest(req)) {
    return ensureMinDelay(
      400,
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const updated = await charityNominationStore.setStatus(parsed.data.id, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, nomination: updated });
}
