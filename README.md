# Astroid

> A charity-first asteroid adoption experience, anchored by Astroid the Space Shiba Inu — a character drawn by Liv.

## What this is

Astroid is the official site for the $ASTROID meme coin. The whole point is to turn trading activity into real-world impact for kids:

- **75/25 pump.fun creator fee split** → 25% routed directly to a children's charity wallet, on-chain, with no team discretion
- **ChangeNOW affiliate fees** → 100% of swap fees routed to the same charity wallet
- **Adopt an Asteroid** → free experience where anyone can name an asteroid (for a kid, in memory of someone, just for fun) and get a printable certificate

## The mascot

The mascot, "Astroid the Space Shiba Inu," was drawn by Liv. The original drawing lives at `public/liv-drawing.jpg` and is featured on the About page. Annotations on the drawing call for: a plastic SpaceX helmet, very fluffy ears, a name patch, and a small mission logo patch.

The site's visual language tries to honor that: SpaceX-clean structure with kid-warm soul.

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**, strict mode
- **Tailwind CSS 4**
- **react-three-fiber** + **drei** for the asteroid field
- **Framer Motion** for UI motion
- **Privy** + **@solana/web3.js** for optional wallet connection
- In-memory storage for the MVP (Redis-ready for production)

## Getting started

```bash
npm install
cp .env.example .env.local
# fill in your values, then:
npm run dev
```

Open http://localhost:3000

## Pages

- `/` — Home: hero asteroid field + mission + Astroid mascot
- `/adopt` — Name an asteroid, get a free certificate
- `/asteroids` — Browse adopted asteroids
- `/asteroids/[designation]` — Public detail page for one asteroid
- `/charity` — Live donation transparency log
- `/about` — The story behind Astroid (featuring Liv's original drawing)

## What this is NOT

- It is not a donation platform (donations happen via your token's existing fee mechanics)
- It does not custody funds
- It does not collect personal data on kids
- It does not embed a swap, mixer, or bridge

## Moderation & anti-abuse

Every public submission — star names, wishes, coloring uploads, charity nominations — is queued for human review and never appears on the site until approved.

| Layer | What it does |
| --- | --- |
| **Honeypot field** (`website`) | Hidden input on every form. Bots fill it; humans don't. Server silently discards. |
| **Per-IP rate limit** | In-memory sliding window: 3 names/day, 8 wishes/hour, 5 coloring/day, 5 nominations/day, 8 admin login attempts/hour. |
| **Profanity / blocklist** | Curated list with leetspeak + zalgo normalisation. Hard-rejects slurs and crypto-drainer patterns; soft-flags spam markers (`pump`, `moon`, links). |
| **Pending-by-default** | Names sit in `pending` and the slot is held — moderator approves or rejects. Reject frees the slot. |
| **Timing-safe admin auth** | `crypto.timingSafeEqual` with a fixed 400 ms minimum response time on failure. |
| **Admin session cookie** | HttpOnly, Secure (in prod), SameSite=Strict, 12 h TTL. Cookie holds an HMAC of the admin token, not the token itself. |
| **Security headers** | HSTS (preload), X-Frame-Options=DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP — applied in `middleware.ts`. |

### Running moderation

The admin UI lives at **`/admin`** (no nav link, `noindex` in metadata).

1. Generate a token: `openssl rand -hex 32`
2. Set `ADMIN_TOKEN` in `.env.local` (must be ≥ 16 chars).
3. Visit `/admin`, paste the token, sign in. Session lasts 12 hours.

CLI alternative — every moderation route also accepts `x-admin-token`:

```bash
curl -H "x-admin-token: $ADMIN_TOKEN" https://astroid.space/api/stars/moderate
curl -X POST -H "x-admin-token: $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"designation":"STAR-00042","status":"approved"}' \
  https://astroid.space/api/stars/moderate
```

### Limitations of the MVP

- Storage is in-memory: all state (names, wishes, rate-limit counters) is lost on server restart / cold start. Swap `app/lib/storage.ts` for Postgres + Prisma or Vercel KV before going live with real traffic.
- Rate limiter is per-process. If you scale to multiple regions, replace with Upstash Redis behind the same `consume()` signature in `app/lib/rateLimit.ts`.
- For determined botnets, layer Cloudflare Turnstile or Bot Fight Mode in front of the site.

## License

All rights reserved. Liv's drawing is her own work.
