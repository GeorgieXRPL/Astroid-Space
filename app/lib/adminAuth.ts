/**
 * @fileoverview Admin authentication.
 *
 * One static `ADMIN_TOKEN` env var protects every admin surface. Two ways
 * to authenticate, both equivalent:
 *
 *   1. **Header** (`x-admin-token`) - for `curl` / scripts.
 *   2. **Cookie** (`astroid_admin`) - set by `POST /api/admin/login` after
 *      a successful token submission, used by the `/admin` UI.
 *
 * Comparisons are timing-safe (`crypto.timingSafeEqual`). Failed attempts
 * are rate-limited per IP (see `rateLimit.ts`) to slow brute force.
 *
 * For multi-admin or revocable sessions, swap this for NextAuth or a real
 * session store. The MVP keeps it deliberately tiny.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'astroid_admin';
const COOKIE_MAX_AGE = 12 * 60 * 60; // 12 hours

/** Get the configured admin token, or `null` if unconfigured. */
function adminTokenOrNull(): string | null {
  const t = process.env.ADMIN_TOKEN;
  if (!t || t.length < 16) return null;
  return t;
}

/**
 * Constant-time string equality. Returns false (not throws) if either side
 * is missing or the lengths differ.
 */
function safeEq(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Cookie value: HMAC-SHA256 of a fixed signature over the admin token.
 * Storing the raw token in the cookie would mean any XSS leaks the master
 * key; the HMAC keeps the cookie verifiable but useless for re-issuing.
 */
function cookieSignature(): string | null {
  const t = adminTokenOrNull();
  if (!t) return null;
  return createHmac('sha256', t).update('astroid-admin-session-v1').digest('hex');
}

/** True if the request is authenticated via header OR cookie. */
export function isAuthorizedRequest(req: NextRequest): boolean {
  const expected = adminTokenOrNull();
  if (!expected) return false;

  // Header auth (curl).
  const headerToken = req.headers.get('x-admin-token');
  if (headerToken && safeEq(headerToken, expected)) return true;

  // Cookie auth (browser admin UI). Cookie holds the HMAC, not the raw token.
  const cookieValue = req.cookies.get(ADMIN_COOKIE)?.value;
  const expectedSig = cookieSignature();
  if (cookieValue && expectedSig && safeEq(cookieValue, expectedSig)) return true;

  return false;
}

/**
 * Server-component variant: reads cookies via the next/headers helper, so
 * server pages can check auth before rendering.
 */
export async function isAuthorizedServerComponent(): Promise<boolean> {
  const expectedSig = cookieSignature();
  if (!expectedSig) return false;
  const jar = await cookies();
  const v = jar.get(ADMIN_COOKIE)?.value;
  return safeEq(v, expectedSig);
}

/**
 * Verify a submitted token (typically from /api/admin/login) and, on
 * success, set the session cookie on the response.
 *
 * Returns `true` iff the token matched.
 */
export function login(submittedToken: string, res: NextResponse): boolean {
  const expected = adminTokenOrNull();
  if (!expected) return false;
  if (!safeEq(submittedToken, expected)) return false;

  const sig = cookieSignature();
  if (!sig) return false;

  res.cookies.set(ADMIN_COOKIE, sig, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return true;
}

/** Clear the session cookie. */
export function logout(res: NextResponse): void {
  res.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

/** Always wait at least `ms` before resolving. Used to slow failure paths. */
export async function ensureMinDelay<T>(ms: number, work: Promise<T> | T): Promise<T> {
  const t = Date.now();
  const result = await work;
  const elapsed = Date.now() - t;
  if (elapsed < ms) await new Promise((r) => setTimeout(r, ms - elapsed));
  return result;
}
