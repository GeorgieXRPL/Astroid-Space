/**
 * @fileoverview Charity nominations API.
 *
 *  - GET  /api/charity-nominations  → public list of approved nominations
 *  - POST /api/charity-nominations  → submit a nomination (queued for review)
 *
 * IMPORTANT: a nomination is *not* a routing decision. We will only
 * actually route on-chain donations to a nominated charity after writing
 * to them and obtaining recipient consent (per ALSAC's pattern with
 * St. Jude). The public list exists so the community can see which
 * charities have been suggested and which we're still working on.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { charityNominationStore, PendingQueueFullError } from '../../lib/storage';
import { clientIp, consume } from '../../lib/rateLimit';
import { isHoneypotTriggered } from '../../lib/honeypot';
import { checkContent, checkDisplayName } from '../../lib/contentFilter';
import {
  enforceJsonBodyLimit,
  queueFullResponse,
  validationErrorResponse,
  DEFAULT_JSON_BODY_LIMIT,
} from '../../lib/requestGuards';

const nominationSchema = z.object({
  charityName: z
    .string()
    .min(2, 'Charity name needs at least 2 characters.')
    .max(120, 'Charity name must be 120 characters or fewer.'),
  country: z
    .string()
    .max(64, 'Country must be 64 characters or fewer.')
    .optional(),
  charityUrl: z
    .string()
    .url('Charity URL must be a valid http(s) link.')
    .max(300)
    // Belt-and-braces: Zod's `.url()` accepts javascript: / data: / vbscript:
    // schemes which would execute when rendered as `<a href>`. Restrict
    // to safe http(s) schemes here so the only thing flowing to the DOM
    // is a navigable URL.
    .refine(
      (s) => {
        try {
          const u = new URL(s);
          return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Charity URL must start with http:// or https://.' }
    )
    .optional(),
  reason: z
    .string()
    .max(280, 'Reason is limited to 280 characters.')
    .optional(),
  nominatedBy: z
    .string()
    .max(48, 'Your name must be 48 characters or fewer.')
    .optional(),
});

function newNominationId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return (
    'nom_' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '60', 10) || 60, 200);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0);

  const items = await charityNominationStore.list({ limit, offset, status: 'approved' });

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
      { ok: true, message: "Thank you. We'll review your nomination shortly." },
      { status: 201 }
    );
  }

  const limit = consume('nomination', clientIp(req));
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `You've submitted the maximum number of nominations allowed today. Try again in about ${Math.ceil(
          limit.retryAfter / 3600
        )} hour(s).`,
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const parsed = nominationSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  // Content filter charity name + reason + nominator name.
  const nameCheck = checkContent(parsed.data.charityName);
  if (!nameCheck.ok) {
    return NextResponse.json({ error: nameCheck.reason }, { status: 400 });
  }
  if (parsed.data.reason) {
    const reasonCheck = checkContent(parsed.data.reason);
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.reason }, { status: 400 });
    }
  }
  if (parsed.data.nominatedBy) {
    const byCheck = checkDisplayName(parsed.data.nominatedBy);
    if (!byCheck.ok) {
      return NextResponse.json({ error: byCheck.reason }, { status: 400 });
    }
  }

  let nomination;
  try {
    nomination = await charityNominationStore.add({
      id: newNominationId(),
      charityName: parsed.data.charityName.trim(),
      country: parsed.data.country?.trim() || undefined,
      charityUrl: parsed.data.charityUrl?.trim() || undefined,
      reason: parsed.data.reason?.trim() || undefined,
      nominatedBy: parsed.data.nominatedBy?.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'pending',
    });
  } catch (err) {
    if (err instanceof PendingQueueFullError) return queueFullResponse(err);
    throw err;
  }

  return NextResponse.json(
    {
      ok: true,
      message:
        "Thank you. We'll review your nomination and reach out to the charity for written consent before they're added to the on-chain split from the 75% project wallet.",
      nominationId: nomination.id,
    },
    { status: 201 }
  );
}
