/**
 * @fileoverview Render-time href sanitiser.
 *
 * Even though the API rejects non-http(s) URLs, defence in depth: any
 * component rendering a user-controlled URL into `<a href>` should pipe
 * the value through `safeHref()` so a future code path that bypasses
 * the API (a seed file, a manual import) can't introduce a click-to-
 * execute javascript: link.
 *
 * Returns `null` for unsafe URLs — callers should render the value as
 * plain text or omit the link in that case.
 */
export function safeHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  return url.toString();
}
