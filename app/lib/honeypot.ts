/**
 * @fileoverview Honeypot field convention.
 *
 * We add a hidden `website` input to every public form. Real humans never
 * see or fill it; many naive bots auto-fill anything that looks like a
 * name/email/website field. If the field arrives non-empty, the request
 * is rejected silently - we still return 201 so the bot doesn't learn it
 * was caught.
 *
 * `website` is the field name because it's a classic spam target across
 * comment systems and survey forms. Don't rename it without good reason.
 */

export const HONEYPOT_FIELD = 'website';

/**
 * Returns true if the bot honeypot triggered. Call with the raw POST body
 * before validating with Zod (so we don't leak schema errors that hint
 * "ah, that field shouldn't be there").
 */
export function isHoneypotTriggered(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  if (typeof value !== 'string') return false;
  return value.trim().length > 0;
}
