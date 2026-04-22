/**
 * @fileoverview Wish moderation endpoint (admin-only).
 *
 * POST /api/wishes/moderate
 *   Headers: x-admin-token: <ADMIN_TOKEN env var>
 *   Body:    { id: string, status: 'approved' | 'rejected' }
 *
 * MVP keeps moderation deliberately CLI-friendly. There is no admin UI yet;
 * approve a wish from a terminal:
 *
 *   curl -X POST http://localhost:3001/api/wishes/moderate \
 *     -H "x-admin-token: $ADMIN_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{"id":"wish_abc123","status":"approved"}'
 *
 * GET /api/wishes/moderate
 *   Headers: x-admin-token
 *   Returns { pending: Wish[], counts: {pending,approved,rejected} }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { wishStore } from '../../../lib/storage';
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
    wishStore.list({ status: 'pending', limit: 200 }),
    wishStore.countByStatus(),
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

  const updated = await wishStore.setStatus(parsed.data.id, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ error: 'Wish not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, wish: updated });
}
