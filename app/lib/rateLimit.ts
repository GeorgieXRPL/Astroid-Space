/**
 * @fileoverview In-memory per-IP sliding-window rate limiter.
 *
 * MVP: process-local Map keyed by `${bucket}:${ip}`. Suitable for a single
 * Node process (e.g. one Vercel region). On serverless, each cold start
 * resets the table - for production, swap this module for Upstash Redis
 * or Vercel KV behind the same `consume()` signature.
 *
 * Why a sliding window: bursty bots and slow trickles both look like abuse,
 * and a fixed-window counter has the well-known boundary doubling problem.
 *
 * IMPORTANT: this is defence in depth, not a full bot defence. Pair with a
 * honeypot field (in lib/honeypot.ts) and consider Cloudflare Turnstile or
 * Cloudflare Bot Fight Mode in front of the site at production scale.
 */

import { NextRequest } from 'next/server';

interface Bucket {
  /** Max events allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** How many seconds the caller should wait before retrying. */
  retryAfter: number;
  /** How many requests remain in the current window. */
  remaining: number;
}

/**
 * Pre-defined rate-limit buckets. Names are documentation; pick whichever
 * suits the route. Tightness reflects user-facing risk (star names appear
 * publicly, so it's the strictest).
 */
export const RATE_LIMITS = {
  /** POST /api/stars/name - public surface, scarce 200-star pool. */
  starName: { limit: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3 / day
  /** POST /api/wishes - moderated, but flooding the queue is bad UX. */
  wish: { limit: 8, windowMs: 60 * 60 * 1000 }, // 8 / hour
  /** POST /api/coloring - 1 MB per upload, expensive. */
  coloring: { limit: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 / day
  /** POST /api/charity-nominations - moderated. */
  nomination: { limit: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 / day
  /** POST /api/admin/login - brute-force defence. */
  adminLogin: { limit: 8, windowMs: 60 * 60 * 1000 }, // 8 / hour
} as const satisfies Record<string, Bucket>;

export type RateLimitName = keyof typeof RATE_LIMITS;

declare global {
  // eslint-disable-next-line no-var
  var __astroidRateLimit: Map<string, number[]> | undefined;
}

const store: Map<string, number[]> =
  globalThis.__astroidRateLimit ??
  (globalThis.__astroidRateLimit = new Map<string, number[]>());

/**
 * Consume one event for the (bucket, ip) pair. Returns whether the caller
 * is allowed and how long to wait if not.
 */
export function consume(bucketName: RateLimitName, ip: string): RateLimitResult {
  const bucket = RATE_LIMITS[bucketName];
  const key = `${bucketName}:${ip}`;
  const now = Date.now();
  const cutoff = now - bucket.windowMs;

  const events = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (events.length >= bucket.limit) {
    // Suggest waiting until the oldest event in the window expires.
    const earliest = events[0];
    const retryAfter = Math.max(1, Math.ceil((earliest + bucket.windowMs - now) / 1000));
    store.set(key, events);
    return { ok: false, retryAfter, remaining: 0 };
  }

  events.push(now);
  store.set(key, events);
  return {
    ok: true,
    retryAfter: 0,
    remaining: bucket.limit - events.length,
  };
}

/**
 * Best-effort client IP.
 *
 * IP-based rate limiting is only as trustworthy as the IP source. Headers
 * can be set by any client; we only honour them when we know we're behind
 * a trusted reverse proxy (Vercel, Cloudflare, etc.). The opt-in is the
 * `TRUSTED_PROXY` env var (set it to `1` once your prod environment is
 * confirmed to overwrite these headers at the edge).
 *
 * Priority order (most-trusted first):
 *   1. `cf-connecting-ip`   (Cloudflare - only set by their edge)
 *   2. `true-client-ip`     (Akamai / Cloudflare Enterprise)
 *   3. `x-real-ip`          (most reverse proxies)
 *   4. `x-forwarded-for`    (de-facto standard; first hop is the client)
 *
 * IPv6 zone IDs and brackets are stripped so the same address always maps
 * to the same rate-limit bucket.
 *
 * If `TRUSTED_PROXY` is unset (e.g. local dev, naked Node), we IGNORE the
 * forwarded headers and fall back to a single shared bucket. That makes
 * rate-limiting weaker on misconfigured deploys but stops attackers from
 * trivially spoofing themselves into infinite buckets.
 */
export function clientIp(req: NextRequest): string {
  const trusted = process.env.TRUSTED_PROXY === '1' || process.env.VERCEL === '1';

  if (trusted) {
    const candidates = [
      req.headers.get('cf-connecting-ip'),
      req.headers.get('true-client-ip'),
      req.headers.get('x-real-ip'),
      // x-forwarded-for: first hop = original client. Subsequent hops are proxies.
      req.headers.get('x-forwarded-for')?.split(',')[0],
    ];
    for (const raw of candidates) {
      const ip = normaliseIp(raw);
      if (ip) return ip;
    }
  }

  // Untrusted environment: a single shared bucket is safer than per-spoofed-IP buckets.
  return 'untrusted-proxy-shared';
}

function normaliseIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = raw.trim();
  if (!ip) return null;
  // Strip IPv6 brackets and zone IDs: "[::1%eth0]" -> "::1"
  ip = ip.replace(/^\[|\]$/g, '');
  const zone = ip.indexOf('%');
  if (zone !== -1) ip = ip.slice(0, zone);
  // Reject obviously malformed values that could expand the keyspace.
  if (ip.length > 64 || /[^0-9a-fA-F:.]/.test(ip)) return null;
  return ip;
}
