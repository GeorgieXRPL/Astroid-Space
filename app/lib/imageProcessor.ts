/**
 * @fileoverview Image processing pipeline for /coloring uploads.
 *
 * What can go wrong with a user-uploaded image, and how we defend:
 *
 *   1. POLYGLOT FILES - a file that's a valid PNG AND a valid HTML
 *      document, depending on which parser reads it. Some browsers
 *      MIME-sniff the body and execute the HTML. Defense: re-encode
 *      the image through sharp. The output bytes are deterministic
 *      and contain only image data.
 *
 *   2. EXIF / IPTC / XMP METADATA - phone uploads commonly contain GPS
 *      coordinates of the kid's bedroom. Defense: sharp's pipeline
 *      strips all metadata by default unless we explicitly opt back in.
 *
 *   3. EMBEDDED COLOR PROFILES with malformed ICC blobs that crash
 *      legacy decoders. Defense: re-encode strips ICC unless we ask.
 *
 *   4. DECOMPRESSION BOMBS - a 1KB PNG that decodes to 50000x50000
 *      pixels and OOMs the server. Defense: sharp returns a metadata
 *      object with width/height BEFORE doing pixel work; we reject
 *      anything over the dimensional limit.
 *
 *   5. SVG-AS-PNG - file mislabeled as PNG but is actually SVG with
 *      <script>. Already blocked by magic-byte check, but sharp would
 *      also fail to decode it as PNG.
 *
 *   6. ADULT / VIOLENT / EXTREMIST IMAGERY - sharp can't help here.
 *      That's a content moderation problem and needs a model. We
 *      expose a hook (`runContentModeration`) that callers can plug
 *      a service into. Default impl is a no-op (rely on human review).
 *      See IMAGE_MODERATION.md for the wiring.
 */

import sharp from 'sharp';

/** Final dimensions we serve at. Anything larger is downscaled. */
const MAX_OUTPUT_DIMENSION = 1600;
/** Anything larger than this in either axis is rejected outright. */
const MAX_INPUT_DIMENSION = 8000;
/** Webp at this quality is visually indistinguishable from the source. */
const WEBP_QUALITY = 82;

export type ProcessedImage = {
  /** Re-encoded image as raw bytes, ready to upload to storage. */
  bytes: Buffer;
  /** Final mime type - always image/webp post-processing. */
  mimeType: 'image/webp';
  /** Output dimensions. */
  width: number;
  height: number;
  /** Original dimensions, for debugging / auditing. */
  originalWidth: number;
  originalHeight: number;
};

export type ProcessingError = {
  ok: false;
  reason: string;
};

export type ProcessingResult = ({ ok: true } & ProcessedImage) | ProcessingError;

/**
 * Decode the data URL, validate dimensions, strip metadata, re-encode
 * to WebP. Returns either the cleaned bytes or a user-friendly error.
 *
 * Only handles PNG / JPEG / WebP. Magic-byte verification should run
 * before this; we trust the caller has done that.
 */
export async function processImageDataUrl(dataUrl: string): Promise<ProcessingResult> {
  const match = /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return { ok: false, reason: 'Unsupported image format.' };
  }
  const base64 = match[2];

  let inputBytes: Buffer;
  try {
    inputBytes = Buffer.from(base64, 'base64');
  } catch {
    return { ok: false, reason: 'Could not decode the image.' };
  }
  if (inputBytes.length === 0) {
    return { ok: false, reason: 'The image is empty.' };
  }

  // sharp() is lazy - calling .metadata() doesn't decode pixel data.
  // We use it to inspect dimensions BEFORE committing to a decode that
  // could OOM us on a decompression bomb.
  let pipeline: sharp.Sharp;
  let meta: sharp.Metadata;
  try {
    pipeline = sharp(inputBytes, { failOn: 'error' });
    meta = await pipeline.metadata();
  } catch (err) {
    return { ok: false, reason: 'The image could not be read. Try saving as PNG and re-upload.' };
  }

  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) {
    return { ok: false, reason: 'The image has no readable dimensions.' };
  }
  if (w > MAX_INPUT_DIMENSION || h > MAX_INPUT_DIMENSION) {
    return {
      ok: false,
      reason: `Image is too big (${w}x${h}). Please save it under ${MAX_INPUT_DIMENSION}px on each side.`,
    };
  }

  // Reject animated images. We don't render animation in the gallery
  // and animated PNGs can hide all kinds of weirdness.
  if (meta.pages && meta.pages > 1) {
    return { ok: false, reason: 'Animated images are not supported. Please upload a still PNG or JPEG.' };
  }

  let outBytes: Buffer;
  let outMeta: sharp.Metadata;
  try {
    outBytes = await pipeline
      // Strip all metadata. EXIF GPS coords are the big one for kids.
      // sharp strips by default but being explicit documents intent.
      .rotate() // applies EXIF orientation, then drops the tag
      .resize({
        width: MAX_OUTPUT_DIMENSION,
        height: MAX_OUTPUT_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();
    outMeta = await sharp(outBytes).metadata();
  } catch {
    return { ok: false, reason: 'The image could not be processed. Try a different file.' };
  }

  return {
    ok: true,
    bytes: outBytes,
    mimeType: 'image/webp',
    width: outMeta.width ?? 0,
    height: outMeta.height ?? 0,
    originalWidth: w,
    originalHeight: h,
  };
}

// ============================================================================
// Content moderation hook
// ============================================================================

export type ModerationDecision =
  | { allow: true }
  | { allow: false; reason: string; categories?: string[] };

/**
 * Plug a real moderation service in here when you're ready.
 *
 * Recommended providers (cheapest → most thorough):
 *
 *   - Cloudflare Workers AI (`@cf/unum/uform-gen2-qwen-500m` for
 *     captioning + a text classifier on the caption). Cheap, ships
 *     with the Cloudflare account.
 *
 *   - AWS Rekognition `DetectModerationLabels` - $1 per 1000 images,
 *     reliable, returns hierarchical labels (Explicit Nudity > etc.).
 *
 *   - Sightengine / Hive - purpose-built for this, tunable thresholds,
 *     ~$0.001 per image. Hive has a kids-content mode.
 *
 * The default implementation here returns `{ allow: true }` - meaning
 * no automated check, all submissions still go through human review
 * (which is enforced by the `pending` status in the storage layer).
 */
export async function runContentModeration(
  _processed: ProcessedImage
): Promise<ModerationDecision> {
  // Wire a real provider here:
  //
  //   const result = await fetch('https://api.sightengine.com/1.0/check.json', {
  //     method: 'POST',
  //     body: form,
  //   });
  //   const data = await result.json();
  //   if (data.nudity.raw > 0.5 || data.weapon > 0.5) {
  //     return { allow: false, reason: '...', categories: [...] };
  //   }
  return { allow: true };
}
