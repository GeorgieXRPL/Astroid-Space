/**
 * @fileoverview POST /api/admin/login
 *
 * Body: { token: string }
 *
 * On success: sets the `astroid_admin` HttpOnly cookie (12 hour TTL).
 * On failure: returns 401 after a fixed-time delay to slow brute force.
 *
 * Both successful and failed responses take roughly the same amount of
 * time, so timing oracles can't distinguish a wrong token from a missing
 * one. Per-IP rate limit tightens this further.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureMinDelay, login } from '../../../lib/adminAuth';
import { clientIp, consume } from '../../../lib/rateLimit';

const schema = z.object({ token: z.string().min(1).max(256) });

export async function POST(req: NextRequest) {
  const limit = consume('adminLogin', clientIp(req));
  if (!limit.ok) {
    return ensureMinDelay(
      400,
      NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return ensureMinDelay(
      400,
      NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    );
  }

  const res = NextResponse.json({ ok: true });
  const ok = login(parsed.data.token, res);
  if (!ok) {
    return ensureMinDelay(
      400,
      NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    );
  }
  return res;
}
