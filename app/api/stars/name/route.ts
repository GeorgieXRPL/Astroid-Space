/**
 * @fileoverview POST /api/stars/name
 *
 * Submits a name for a star. The submission is queued for human moderation
 * (status: 'pending'). It claims the slot - no one else can claim the same
 * designation while it's pending. If a moderator rejects the submission,
 * the slot becomes available again.
 *
 * Returns a `claimToken` the client should store in localStorage so the
 * namer can re-find their (pending or approved) star later.
 *
 * Anti-abuse layers, in order:
 *
 *   1. Honeypot (`website` field) - silently drop bot traffic
 *   2. Per-IP rate limit (3 / day) - limit damage from a single source
 *   3. Zod schema - length + character class
 *   4. Profanity / blocklist - kid-facing site, kept clean before queueing
 *   5. Pending status - public site never shows un-reviewed names
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { namedStarStore, PendingQueueFullError } from '../../../lib/storage';
import {
  generateClaimToken,
  getStarByDesignation,
  isValidDesignation,
} from '../../../lib/stars';
import { clientIp, consume } from '../../../lib/rateLimit';
import { isHoneypotTriggered } from '../../../lib/honeypot';
import { checkContent, checkDisplayName } from '../../../lib/contentFilter';
import {
  enforceJsonBodyLimit,
  queueFullResponse,
  DEFAULT_JSON_BODY_LIMIT,
} from '../../../lib/requestGuards';

const nameSchema = z.object({
  designation: z.string().refine(isValidDesignation, 'Invalid designation'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(48, 'Name must be 48 characters or fewer')
    .regex(/^[\p{L}\p{N} '\-_.]+$/u, 'Name contains invalid characters'),
  dedication: z.string().max(140).optional(),
  namedBy: z.string().max(48).optional(),
});

export async function POST(req: NextRequest) {
  const tooBig = enforceJsonBodyLimit(req, DEFAULT_JSON_BODY_LIMIT);
  if (tooBig) return tooBig;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Honeypot - silently accept and discard so the bot doesn't learn it was
  // caught. Returning 201 is intentional.
  if (isHoneypotTriggered(body)) {
    return NextResponse.json(
      { ok: true, message: 'Submitted. Your name is queued for review.' },
      { status: 201 }
    );
  }

  const ip = clientIp(req);
  const limit = consume('starName', ip);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `You've named the maximum number of stars allowed today. Try again in about ${Math.ceil(
          limit.retryAfter / 3600
        )} hour(s).`,
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const parsed = nameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { designation, name, dedication, namedBy } = parsed.data;

  // Content filter on every user-supplied string.
  const nameCheck = checkContent(name);
  if (!nameCheck.ok) {
    return NextResponse.json({ error: nameCheck.reason }, { status: 400 });
  }
  let dedicationCheck = { ok: true, suspicious: false } as ReturnType<typeof checkContent>;
  if (dedication) {
    dedicationCheck = checkContent(dedication);
    if (!dedicationCheck.ok) {
      return NextResponse.json({ error: dedicationCheck.reason }, { status: 400 });
    }
  }
  let byCheck = { ok: true, suspicious: false } as ReturnType<typeof checkDisplayName>;
  if (namedBy) {
    byCheck = checkDisplayName(namedBy);
    if (!byCheck.ok) {
      return NextResponse.json({ error: byCheck.reason }, { status: 400 });
    }
  }

  if (!getStarByDesignation(designation)) {
    return NextResponse.json({ error: 'Star not found in field' }, { status: 404 });
  }

  if (await namedStarStore.has(designation)) {
    return NextResponse.json(
      { error: 'This star has already been claimed.' },
      { status: 409 }
    );
  }

  const claimToken = generateClaimToken();
  let named;
  try {
    named = await namedStarStore.name({
      designation,
      name,
      dedication,
      namedBy,
      namedAt: new Date().toISOString(),
      claimToken,
      status: 'pending',
      suspicious:
        !!nameCheck.suspicious || !!dedicationCheck.suspicious || !!byCheck.suspicious,
    });
  } catch (err) {
    if (err instanceof PendingQueueFullError) return queueFullResponse(err);
    throw err;
  }

  if (!named) {
    return NextResponse.json({ error: 'Naming failed' }, { status: 500 });
  }

  return NextResponse.json(
    {
      namedStar: named,
      message:
        'Your name is queued for review. It will appear on the sky and on your certificate as soon as a human approves it (usually within a day).',
    },
    { status: 201 }
  );
}
