/**
 * @fileoverview Centralised feature flags. Read on both client and server
 * via NEXT_PUBLIC_ env vars so a single value drives both sides without
 * a separate /api/features endpoint.
 *
 * Toggling a flag requires a Vercel redeploy because NEXT_PUBLIC_ values
 * are inlined at build time. That's a deliberate trade-off for this
 * project - flags are flipped rarely and we'd rather avoid the runtime
 * roundtrip.
 */

/**
 * Coloring submissions accept user-uploaded images. We keep this off by
 * default until automated image moderation (Cloudflare Workers AI / AWS
 * Rekognition / Sightengine / Hive - see IMAGE_MODERATION.md) is wired
 * up. Manual-review-only is workable for low traffic but does not scale,
 * and exposes moderators to whatever bad actors send.
 *
 * When this is false:
 *   - The /coloring page replaces the upload form with a "coming soon"
 *     panel and a CTA to download the printable.
 *   - POST /api/coloring returns 503 with a Retry-After hint.
 *   - GET  /api/coloring still serves the approved gallery.
 *
 * To enable in Vercel: set NEXT_PUBLIC_COLORING_UPLOADS_ENABLED=1, then
 * redeploy.
 */
export const COLORING_UPLOADS_ENABLED =
  process.env.NEXT_PUBLIC_COLORING_UPLOADS_ENABLED === '1';
