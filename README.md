# Astroid

> A community star-naming experience built around a kid's drawing of "Astroid the Space Shiba Inu," with a charity-first donation flow.

Live at **[astroid.space](https://astroid.space)**.

## What this is

Astroid is the official site for the $ASTROID Solana token. The whole point is to turn community activity into real-world impact for kids:

- **Name a star** — anyone can name one of the visible stars in the sky for free, write a short message, and download a printable certificate.
- **Color the Astroid** — print Liv's drawing, color it, and (once the moderation pipeline is live) submit your version for the gallery.
- **Wish wall** — leave a short, public wish in the sky.
- **Charity transparency** — 25% of pump.fun creator fees auto-route on-chain to a wallet provided by ALSAC for St. Jude Children's Research Hospital. The wallet balance is fetched live from the Solana RPC and shown on `/charity` with a Solscan link, so anyone can verify in real time.

## The mascot

The mascot, "Astroid the Space Shiba Inu," was drawn by Liv. The original drawing lives at `public/liv-drawing.jpg` and is featured on the About page. Annotations on the drawing call for: a plastic SpaceX helmet, very fluffy ears, a name patch, and a small mission logo patch. The site's visual language tries to honor that — SpaceX-clean structure with kid-warm soul.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** strict mode
- **Tailwind CSS 4** for styling
- **react-three-fiber** + **drei** + **@react-three/postprocessing** for the 3D starfield and individual star previews
- **@solana/web3.js** for read-only charity-wallet balance lookups
- **sharp** for server-side image processing (EXIF strip, decompression-bomb protection, WebP re-encode)
- **Zod** for input validation
- **Supabase** (Postgres + Storage) for persistent backend in production; in-memory `Map`s for local dev

## Getting started

```bash
npm install
cp .env.example .env.local
# fill in your values (see comments in .env.example), then:
npm run dev
```

Open http://localhost:3000

In dev mode, `STORAGE_BACKEND` defaults to `memory` so you don't need a Supabase project to develop locally. Data is wiped on every server restart.

## Pages

- `/` — Home: 3D starfield + mission + Astroid mascot
- `/name-a-star` — Pick a star, name it, get a free certificate
- `/sky` — Browse all approved named stars
- `/sky/[designation]` — Public detail page for one star (with 3D close-up)
- `/wishes` — Wish wall
- `/coloring` — Print + color (uploads behind a feature flag)
- `/charity` — Live on-chain donation transparency
- `/friends` — Friends across the sky (community / sister projects)
- `/about` — The story behind Astroid (featuring Liv's original drawing)
- `/admin` — Moderation queue (no nav link, `noindex`)

## What this is NOT

- Not a donation platform — donations happen via the token's existing on-chain fee mechanics
- Does not custody funds
- Does not collect personal data on kids
- Does not embed a swap, mixer, or bridge

## Moderation & anti-abuse

Every public submission — star names, wishes, coloring uploads, charity nominations — is queued for human review and never appears on the site until approved.

| Layer | What it does |
| --- | --- |
| **Honeypot field** (`website`) | Hidden input on every form. Bots fill it; humans don't. Server silently discards. |
| **Per-IP rate limit** | Sliding window per route: 3 names/day, 8 wishes/hour, 5 coloring/day, 5 nominations/day, 8 admin login attempts/hour. |
| **Profanity / blocklist** | Curated list with leetspeak + zalgo normalisation. Hard-rejects slurs and crypto-drainer patterns; soft-flags spam markers (`pump`, `moon`, links). |
| **Pending-by-default** | Submissions sit in `pending` and a slot is held — moderator approves or rejects via `/admin`. Reject frees the slot; pending records auto-expire after 48h. |
| **Pending-queue caps** | Per-store cap. When full, the API returns 503 with `Retry-After`. |
| **Image pipeline** | Magic-byte verification → format whitelist (PNG/JPEG/WebP) → `sharp` decode + EXIF strip + decompression-bomb protection → re-encode to WebP at deterministic quality. |
| **Timing-safe admin auth** | `crypto.timingSafeEqual` with a fixed 400 ms minimum response time on failure. |
| **Admin session cookie** | HttpOnly, Secure (in prod), SameSite=Strict, 12 h TTL. Cookie holds an HMAC of the admin token, not the token itself. |
| **HTTP security headers** | HSTS (preload), CSP, X-Frame-Options=DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP — applied in `proxy.ts`. |
| **`safeHref` URL guard** | Rejects `javascript:` / `data:` / `vbscript:` schemes at both the API and render layers for any user-supplied URL. |

### Running moderation

The admin UI lives at **`/admin`** (no nav link, `noindex` in metadata).

1. Generate a token. On Windows PowerShell:
   ```powershell
   -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
   ```
   On macOS/Linux: `openssl rand -hex 32`
2. Set `ADMIN_TOKEN` in Vercel env vars (must be ≥ 16 chars).
3. Set `ADMIN_COOKIE_SECRET` to a *different* 32+ char string the same way.
4. Visit `/admin`, paste the token, sign in. Session lasts 12 hours.

CLI alternative — every moderation route also accepts `x-admin-token`:

```bash
curl -H "x-admin-token: $ADMIN_TOKEN" https://astroid.space/api/stars/moderate
curl -X POST -H "x-admin-token: $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"designation":"STAR-00042","status":"approved"}' \
  https://astroid.space/api/stars/moderate
```

## Persistent storage

Two backends, switched via `STORAGE_BACKEND`:

- `memory` (default in dev) — process-local `Map`s. Data wiped on restart. Fine for development, **catastrophic in production** (every cold start would erase user content).
- `supabase` (production) — Postgres tables + Storage bucket for coloring images. Schema lives in `supabase/schema.sql`. The server-side client uses the secret/`service_role` key and bypasses RLS; RLS is enabled with no policies so direct database access from the publishable/anon key reads zero rows.

## Known limitations

- **Rate limiter is per-process.** If you scale to multiple regions, replace the in-memory window in `app/lib/rateLimit.ts` with Upstash Redis behind the same `consume()` signature.
- **Image moderation is human-only.** The `runContentModeration()` hook in `app/lib/imageProcessor.ts` is a no-op stub. Wire it up to Cloudflare Workers AI / AWS Rekognition / Sightengine / Hive before re-enabling coloring uploads (`NEXT_PUBLIC_COLORING_UPLOADS_ENABLED=1`). See [`IMAGE_MODERATION.md`](IMAGE_MODERATION.md).
- **No CAPTCHA.** We'd rather not put one in front of kids. If abuse forces it, Cloudflare Turnstile is the least-bad option.
- **No automated email when the moderation queue grows.** Open `/admin` regularly. A Discord/email webhook is a future enhancement.

## Security

- Vulnerability reports: see [`SECURITY.md`](SECURITY.md) and [`/.well-known/security.txt`](public/.well-known/security.txt) — `security@astroid.space`.
- Operator deployment guide: [`TODO_FOR_LIV.md`](TODO_FOR_LIV.md).
- Threat model + mitigations table: [`SECURITY.md`](SECURITY.md).

## License

All rights reserved. Liv's drawing is her own work.
