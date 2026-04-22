/**
 * @fileoverview Image data URL → magic-byte verification.
 *
 * The Zod schema only checks the data URL has the right *prefix*. An
 * attacker can claim `data:image/png;base64,...` and stuff in arbitrary
 * payload bytes — the browser will then sniff the body and may render
 * something other than a PNG. We close that gap by decoding the first
 * dozen bytes and verifying they match the magic bytes for the type
 * the user claimed.
 *
 * We don't pull in `sharp` for this — it pulls native deps and we want
 * the audit surface tiny. Magic-byte sniffing is sufficient for the
 * "block obvious mismatches" use case.
 */

const MAGIC = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpeg: [0xff, 0xd8, 0xff],
  webp_riff: [0x52, 0x49, 0x46, 0x46], // "RIFF" at byte 0
  webp_label: [0x57, 0x45, 0x42, 0x50], // "WEBP" at byte 8
} as const;

export interface ImageVerification {
  ok: boolean;
  reason?: string;
}

/**
 * Verifies the data URL's body starts with the magic bytes for the type
 * declared in the URL's mime label. Returns `{ ok: true }` on a match.
 * Conservative: we only accept the three formats we ever serve.
 */
export function verifyImageMagicBytes(dataUrl: string): ImageVerification {
  const match = /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/.exec(dataUrl);
  if (!match) return { ok: false, reason: 'Image data URL is not in a supported format.' };

  const declared = match[1] === 'jpg' ? 'jpeg' : (match[1] as 'png' | 'jpeg' | 'webp');
  const base64 = match[2];

  // We only need the first ~16 bytes; decoding the whole payload would
  // double the memory footprint for nothing.
  const head = base64.slice(0, 32);
  let bytes: Uint8Array;
  try {
    const buf = Buffer.from(head, 'base64');
    bytes = new Uint8Array(buf);
  } catch {
    return { ok: false, reason: 'Image base64 payload could not be decoded.' };
  }
  if (bytes.length < 12) {
    return { ok: false, reason: 'Image payload is too short to be valid.' };
  }

  const startsWith = (sig: readonly number[], at = 0): boolean =>
    sig.every((b, i) => bytes[at + i] === b);

  switch (declared) {
    case 'png':
      if (!startsWith(MAGIC.png)) return { ok: false, reason: 'Image declared PNG but bytes do not match.' };
      break;
    case 'jpeg':
      if (!startsWith(MAGIC.jpeg)) return { ok: false, reason: 'Image declared JPEG but bytes do not match.' };
      break;
    case 'webp':
      // RIFF????WEBP — bytes 0..3 = RIFF, 4..7 = file size, 8..11 = WEBP
      if (!startsWith(MAGIC.webp_riff, 0) || !startsWith(MAGIC.webp_label, 8)) {
        return { ok: false, reason: 'Image declared WebP but bytes do not match.' };
      }
      break;
  }

  return { ok: true };
}
