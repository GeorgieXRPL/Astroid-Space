/**
 * @fileoverview Coloring gallery API.
 *  - GET  /api/coloring  → public list of approved colored Astroid drawings
 *  - POST /api/coloring  → submit a colored drawing (queued for moderation)
 *
 * Submitted images go through the full pipeline before they ever reach
 * storage:
 *
 *   1. Honeypot → silently drop bot uploads
 *   2. Per-IP rate limit → 5 / day
 *   3. Body-size guard → reject before parsing
 *   4. Format whitelist (Zod regex)
 *   5. Magic-byte verification → file actually IS the format claimed
 *   6. sharp re-encoding → strips metadata, kills polyglots, downsizes
 *   7. Optional content moderation hook → see IMAGE_MODERATION.md
 *   8. Pending queue cap → 503 if moderators are buried
 *   9. Human approval before public display
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { coloringSubmissionStore, PendingQueueFullError } from '../../lib/storage';
import { clientIp, consume } from '../../lib/rateLimit';
import { isHoneypotTriggered } from '../../lib/honeypot';
import { checkDisplayName } from '../../lib/contentFilter';
import {
  enforceJsonBodyLimit,
  queueFullResponse,
  COLORING_JSON_BODY_LIMIT,
} from '../../lib/requestGuards';
import { verifyImageMagicBytes } from '../../lib/imageBytes';
import { processImageDataUrl, runContentModeration } from '../../lib/imageProcessor';
import { COLORING_UPLOADS_ENABLED } from '../../lib/featureFlags';

/** ~1.4MB string ≈ 1MB binary, leaving headroom for the data URL prefix */
const MAX_IMAGE_LENGTH = 1_400_000;

const submitSchema = z.object({
  artistName: z
    .string()
    .min(1, 'Tell us the artist name (first name is fine).')
    .max(48, 'Name must be 48 characters or fewer.')
    .regex(/^[\p{L}\p{N} '\-_.]+$/u, 'Name contains invalid characters'),
  age: z.number().int().min(0).max(120).optional(),
  imageDataUrl: z
    .string()
    .max(MAX_IMAGE_LENGTH, 'Image is too large — please save under 1MB.')
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/, 'Image must be a PNG, JPEG, or WebP data URL.'),
});

function newSubmissionId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return 'col_' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '24', 10) || 24, 60);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0);

  const items = await coloringSubmissionStore.list({ limit, offset, status: 'approved' });
  return NextResponse.json({ items, limit, offset });
}

export async function POST(req: NextRequest) {
  if (!COLORING_UPLOADS_ENABLED) {
    return NextResponse.json(
      {
        error:
          'Coloring uploads are temporarily disabled while we finish setting up image moderation. Download the printable for now and check back soon.',
      },
      { status: 503, headers: { 'Retry-After': '86400' } }
    );
  }

  const tooBig = enforceJsonBodyLimit(req, COLORING_JSON_BODY_LIMIT);
  if (tooBig) return tooBig;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (isHoneypotTriggered(body)) {
    return NextResponse.json(
      { ok: true, message: 'Thank you! Your colored Astroid is queued.' },
      { status: 201 }
    );
  }

  const limit = consume('coloring', clientIp(req));
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `You've submitted the maximum number of drawings allowed today. Try again in about ${Math.ceil(
          limit.retryAfter / 3600
        )} hour(s).`,
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const nameCheck = checkDisplayName(parsed.data.artistName);
  if (!nameCheck.ok) {
    return NextResponse.json({ error: nameCheck.reason }, { status: 400 });
  }

  // Defence in depth: magic-byte sniff before we touch sharp.
  const magic = verifyImageMagicBytes(parsed.data.imageDataUrl);
  if (!magic.ok) {
    return NextResponse.json({ error: magic.reason }, { status: 400 });
  }

  // Hard image-processing pipeline: decode-bomb check, EXIF strip,
  // re-encode to webp. The output bytes are deterministic and contain
  // no payload other than image data.
  const processed = await processImageDataUrl(parsed.data.imageDataUrl);
  if (!processed.ok) {
    return NextResponse.json({ error: processed.reason }, { status: 400 });
  }

  // Optional content moderation hook (see IMAGE_MODERATION.md). Default
  // is a no-op; humans review every submission anyway via /admin.
  const decision = await runContentModeration(processed);
  if (!decision.allow) {
    return NextResponse.json(
      // Deliberately vague — don't help adversaries calibrate.
      { error: 'Image flagged by automated review. Please try a different drawing.' },
      { status: 400 }
    );
  }

  let submission;
  try {
    submission = await coloringSubmissionStore.add({
      id: newSubmissionId(),
      artistName: parsed.data.artistName.trim(),
      age: parsed.data.age,
      image: {
        bytes: processed.bytes,
        mimeType: processed.mimeType,
        width: processed.width,
        height: processed.height,
      },
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
        "Thank you! Your colored Astroid is queued and will appear in the gallery after a quick check.",
      id: submission.id,
    },
    { status: 201 }
  );
}
