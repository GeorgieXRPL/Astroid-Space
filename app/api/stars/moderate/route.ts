/**
 * @fileoverview Star naming moderation (admin-only).
 *
 *   GET  /api/stars/moderate
 *     Headers: x-admin-token  (or astroid_admin cookie)
 *     → { pending: NamedStar[], counts }
 *
 *   POST /api/stars/moderate
 *     Headers: x-admin-token  (or astroid_admin cookie)
 *     Body:    { designation: string, status: 'approved' | 'rejected' }
 *
 * Rejecting a name frees the star slot - see `namedStarStore.setStatus`.
 *
 * Mirrors the wishes/coloring/charity-nominations moderation contract.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { namedStarStore } from '../../../lib/storage';
import { isValidDesignation } from '../../../lib/stars';
import { ensureMinDelay, isAuthorizedRequest } from '../../../lib/adminAuth';
import { validationErrorResponse } from '../../../lib/requestGuards';

const schema = z.object({
  designation: z.string().refine(isValidDesignation, 'Invalid designation'),
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
    namedStarStore.list({ status: 'pending', limit: 200 }),
    namedStarStore.countByStatus(),
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

  const updated = await namedStarStore.setStatus(parsed.data.designation, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ error: 'Star naming not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, namedStar: updated });
}
