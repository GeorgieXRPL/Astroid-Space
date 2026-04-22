# Security Policy

Astroid is a kid-facing site. We take submissions from anyone on the
internet and show them to other kids and families. Security and
moderation are the same problem here, so this document covers both.

## Reporting a vulnerability

Please do not file a public GitHub issue for security problems.

- **Email**: security@astroid.space
- **Acknowledgement**: within 72 hours.
- **Fix target**: critical issues within 7 days, others within 30.
- **Disclosure**: we'll coordinate a public write-up with you (with credit, if you want it) after the fix ships.

We don't run a bounty program, but we do reply, fix quickly, and credit
researchers publicly with their permission. The same contact is in
[/.well-known/security.txt](public/.well-known/security.txt).

## Threat model summary

| Threat | Mitigation |
| --- | --- |
| Bots flooding the wish wall / star naming | Honeypot field, per-IP rate limits, content filter, queue caps |
| Profanity / slurs / scam links targeting kids | `app/lib/contentFilter.ts` blocklist + heuristics; every submission is `pending` until a human approves |
| Image-based abuse via /coloring | Magic-byte verification, 1MB cap, format whitelist (PNG/JPEG/WebP), human approval |
| XSS via charity URL or text fields | Strict React rendering + `safeHref()` sanitiser refuses non-http(s) schemes |
| Admin token brute force | Timing-safe compare, per-IP login rate limit (8/hour), HMAC-signed HttpOnly SameSite=Strict cookie |
| Admin session theft | HttpOnly + Secure + SameSite=Strict cookies; CSP+COOP block cross-origin reads |
| Pending-queue DoS | Auto-expire pending records after 48h, per-store global cap, polite 503 when full |
| IP spoofing of rate limits | `clientIp()` honours forwarded headers ONLY when `TRUSTED_PROXY=1` (or `VERCEL=1`); otherwise rate limits to a shared bucket |
| Click-to-execute links in moderated content | `safeHref()` at the API layer AND at every render site |
| Browser MIME sniffing of uploaded data URLs | `X-Content-Type-Options: nosniff` + magic-byte check + format whitelist |
| Iframing / clickjacking | `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` |
| Mixed content / downgrade | HSTS with preload, CSP `upgrade-insecure-requests` in prod |
| Cross-origin data leaks | COOP `same-origin`, CORP `same-origin`, strict Referrer-Policy |

## Known limitations (we accept these)

- **In-memory storage**: every record (named stars, wishes, etc.) lives
  in a process-local `Map`. A restart wipes them. This is intentional
  for the MVP; before real launch we'll persist to a real datastore.
- **CSP `'unsafe-inline'`**: required by Next.js's runtime bootstrap and
  by some Tailwind utilities. We compensate with strict everywhere
  else (no `'unsafe-eval'` in prod, no third-party origins, COOP/CORP).
  Long-term fix is to switch to a nonce-based CSP.
- **Honeypot bypass**: a sufficiently sophisticated bot reads the DOM
  and skips the hidden field. The honeypot trips the easy 80%; the rate
  limit + content filter + human moderation catch the rest.
- **No CAPTCHA**: we'd rather not put one in front of kids. If abuse
  patterns force the issue we'll add Cloudflare Turnstile (least-bad
  option, no "find the bus" puzzles).

## Operator checklist (deployment)

See [README.md](README.md#deployment-checklist) for the full
pre-launch list. Highlights:

- Set `ADMIN_TOKEN` to a 32+ char random string. Never reuse.
- Set `ADMIN_COOKIE_SECRET` to a different 32+ char random string.
- Set `NEXT_PUBLIC_SITE_URL` to your real public URL.
- Set `TRUSTED_PROXY=1` only when you're confident the platform
  overwrites client-controlled IP headers at the edge (Vercel/Cloudflare
  do; naked Node behind nginx does only if you've configured nginx).
- Submit https://astroid.space to the [HSTS preload list](https://hstspreload.org)
  once you've held the header steady for a week.
- Add CAA DNS records pinning the CAs you'll issue from.
