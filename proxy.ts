/**
 * @fileoverview Global security headers (Next.js Proxy / Edge Middleware).
 *
 * Applied to every response (HTML, API, static). The defaults below are
 * the conservative-but-realistic set used by most Next.js apps in
 * production. Tighten them as you remove third-party scripts.
 *
 * If you add Cloudflare Turnstile, Sentry, or analytics later, you'll need
 * to extend `script-src` / `connect-src` / `frame-src` accordingly.
 *
 * Note: Next 16 renamed the `middleware` file convention to `proxy`.
 * Same API, same matcher config — just a different filename.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';

/**
 * CSP. Notes:
 *  - 'unsafe-inline' on script/style is required by Next's runtime
 *    bootstrap and Tailwind. Replace with hashes/nonces when you have a
 *    nonce-aware Next setup.
 *  - 'unsafe-eval' is needed in dev for React Refresh; we drop it in
 *    production to harden against XSS-via-eval.
 *  - data: + blob: in img-src is required for the procedural canvas
 *    textures used by the StarMap and the data-URL coloring previews.
 */
function csp(): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': isProd
      ? ["'self'", "'unsafe-inline'"]
      : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'connect-src': ["'self'", 'https://api.mainnet-beta.solana.com'],
    'frame-ancestors': ["'none'"],
    'frame-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
  };
  if (isProd) directives['upgrade-insecure-requests'] = [];
  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(' ')}` : k))
    .join('; ');
}

export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  // HSTS — tells browsers to only ever load us over HTTPS, including all
  // subdomains. The `preload` directive lets us submit to the HSTS preload
  // list once we've held this header steady (https://hstspreload.org).
  // Only emit in production; localhost over http would otherwise break.
  if (isProd) {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()'
  );
  res.headers.set('X-DNS-Prefetch-Control', 'off');
  res.headers.set('Content-Security-Policy', csp());

  // Cross-origin isolation. Same-origin defaults make it impossible for
  // another origin to read our pages or pop us via window.opener tricks.
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // Belt-and-braces: the admin surface and admin API never get indexed,
  // even if a friendly crawler ignores robots.txt. Also tell shared
  // caches not to retain admin responses.
  if (path === '/admin' || path.startsWith('/admin/') || path.startsWith('/api/admin')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  }

  return res;
}

/**
 * Apply to everything except next.js internals and static assets.
 * The static-asset exclusion keeps the CSP off /_next/* (which would
 * otherwise block its own bundles in some browsers).
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|liv-drawing.jpg|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)',
  ],
};
