/**
 * @fileoverview Defensive guards used by every public POST route.
 *
 *  - `enforceJsonBodyLimit` rejects requests whose Content-Length is larger
 *    than the route's allowance, BEFORE we call `req.json()` and allocate
 *    the body. Keeps a slow-loris-style memory bomb cheap to drop.
 *
 *  - `queueFullResponse` turns a `PendingQueueFullError` into a 503 with
 *    a Retry-After hint, so a moderator-side backlog doesn't masquerade
 *    as a 500 to the user.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import { PendingQueueFullError } from './storage';

/** Generous defaults - individual routes can pass a smaller cap. */
export const DEFAULT_JSON_BODY_LIMIT = 16 * 1024; // 16 KB for plain JSON
export const COLORING_JSON_BODY_LIMIT = 1_700_000; // ~1.7 MB to fit base64 image + envelope

/**
 * Returns a NextResponse if the body is too large; otherwise null.
 * Use as: `const tooBig = enforceJsonBodyLimit(req, LIMIT); if (tooBig) return tooBig;`
 *
 * If Content-Length is missing (chunked / streaming), we let the request
 * through - Next will still validate the parsed shape downstream, and
 * non-Vercel platforms typically enforce their own ingress caps.
 */
export function enforceJsonBodyLimit(req: NextRequest, limit: number): NextResponse | null {
  const raw = req.headers.get('content-length');
  if (!raw) return null;
  const len = Number.parseInt(raw, 10);
  if (!Number.isFinite(len) || len < 0) {
    return NextResponse.json({ error: 'Invalid Content-Length header.' }, { status: 400 });
  }
  if (len > limit) {
    return NextResponse.json(
      { error: 'Request body too large.' },
      { status: 413, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  return null;
}

/**
 * Map a PendingQueueFullError to a polite 503. The hint of 1h is
 * deliberately vague - moderators usually clear the queue faster.
 */
export function queueFullResponse(err: PendingQueueFullError): NextResponse {
  return NextResponse.json(
    {
      error:
        "Our review queue is full right now. Please try again in a little while - we're getting through it as fast as we can.",
    },
    { status: 503, headers: { 'Retry-After': '3600' } }
  );
}

/**
 * Turn a Zod parse failure into a 400 the user can actually understand.
 *
 * The previous pattern returned `{ error: 'Validation failed' }`, which
 * left users staring at a useless message after typing "Liv's Star" with
 * a curly apostrophe. We now surface the first issue verbatim alongside
 * the field path so the UI can render something like:
 *
 *   "Name must be 48 characters or fewer (name)"
 *
 * The full `issues` array stays in the body for clients that want to
 * highlight individual fields; the top-level `error` is the human line.
 */
export function validationErrorResponse(err: ZodError): NextResponse {
  const first = err.issues[0];
  const field = first?.path && first.path.length > 0 ? first.path.join('.') : null;
  const base = first?.message ?? 'Some of the values you entered are not valid.';
  const error = field ? `${base} (${field})` : base;
  return NextResponse.json({ error, issues: err.issues }, { status: 400 });
}
