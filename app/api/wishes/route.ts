/**
 * @fileoverview Wish Wall API.
 *  - GET  /api/wishes        → public list of approved wishes
 *  - POST /api/wishes        → submit a wish (queued for moderation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { wishStore, PendingQueueFullError } from '../../lib/storage';
import { clientIp, consume } from '../../lib/rateLimit';
import { isHoneypotTriggered } from '../../lib/honeypot';
import { checkContent, checkDisplayName } from '../../lib/contentFilter';
import {
  enforceJsonBodyLimit,
  queueFullResponse,
  validationErrorResponse,
  DEFAULT_JSON_BODY_LIMIT,
} from '../../lib/requestGuards';

/** See app/api/stars/name/route.ts for the rationale on these patterns. */
const UNSAFE_NAME_CHARS = /[<>\u0000-\u001F\u007F]/;
const UNSAFE_PROSE_CHARS = /[<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const wishSchema = z.object({
  text: z
    .string()
    .min(2, 'Your wish needs a few more words.')
    .max(180, 'Wishes are limited to 180 characters.')
    .refine(
      (s) => !UNSAFE_PROSE_CHARS.test(s),
      'Wish cannot contain < > or unusual control characters.'
    ),
  from: z
    .string()
    .max(48, 'Name must be 48 characters or fewer.')
    .refine(
      (s) => s.length === 0 || !UNSAFE_NAME_CHARS.test(s),
      'Your name cannot contain < > or line breaks.'
    )
    .optional(),
});

function newWishId(): string {
  // 12 hex chars = 48 bits - plenty for collision avoidance at MVP scale
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return 'wish_' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '60', 10) || 60, 200);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0);

  const items = await wishStore.list({ limit, offset, status: 'approved' });

  return NextResponse.json({ items, limit, offset });
}

export async function POST(req: NextRequest) {
  const tooBig = enforceJsonBodyLimit(req, DEFAULT_JSON_BODY_LIMIT);
  if (tooBig) return tooBig;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (isHoneypotTriggered(body)) {
    return NextResponse.json(
      { ok: true, message: "Thank you. Your wish is queued and will appear after a quick check." },
      { status: 201 }
    );
  }

  const limit = consume('wish', clientIp(req));
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `You've sent the maximum number of wishes for now. Try again in about ${Math.ceil(
          limit.retryAfter / 60
        )} minute(s).`,
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const parsed = wishSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const textCheck = checkContent(parsed.data.text);
  if (!textCheck.ok) {
    return NextResponse.json({ error: textCheck.reason }, { status: 400 });
  }
  let fromCheck = { ok: true, suspicious: false } as ReturnType<typeof checkDisplayName>;
  if (parsed.data.from) {
    fromCheck = checkDisplayName(parsed.data.from);
    if (!fromCheck.ok) {
      return NextResponse.json({ error: fromCheck.reason }, { status: 400 });
    }
  }

  try {
    await wishStore.add({
      id: newWishId(),
      text: parsed.data.text.trim(),
      from: parsed.data.from?.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'pending',
    });
  } catch (err) {
    if (err instanceof PendingQueueFullError) return queueFullResponse(err);
    throw err;
  }

  // Don't echo the id - we don't want clients enumerating pending wishes.
  return NextResponse.json(
    {
      ok: true,
      message: "Thank you. Your wish is queued and will appear after a quick check.",
    },
    { status: 201 }
  );
}
