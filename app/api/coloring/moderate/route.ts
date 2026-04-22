/**
 * @fileoverview Coloring submission moderation (admin-only).
 *
 *   POST /api/coloring/moderate
 *     Headers: x-admin-token
 *     Body:    { id: string, status: 'approved' | 'rejected' }
 *
 *   GET  /api/coloring/moderate
 *     Headers: x-admin-token
 *     → { pending: ColoringSubmission[], counts }
 *
 * See /api/wishes/moderate for the same conventions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { coloringSubmissionStore } from '../../../lib/storage';
import { ensureMinDelay, isAuthorizedRequest } from '../../../lib/adminAuth';

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
    coloringSubmissionStore.list({ status: 'pending', limit: 100 }),
    coloringSubmissionStore.countByStatus(),
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
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const updated = await coloringSubmissionStore.setStatus(parsed.data.id, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, submission: updated });
}
