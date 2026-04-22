# Image moderation — what we do, and how to add more

This document explains every layer of defense for user-uploaded
images on `/coloring`, from cheap-and-already-on to expensive-and-optional.

## What's running today

Every coloring upload passes through this pipeline before it touches
storage:

1. **Honeypot field check** — silently drop bot uploads.
2. **Per-IP rate limit** — 5 uploads per IP per day.
3. **Body-size guard** — request rejected at 1.7MB Content-Length
   before we allocate the body.
4. **Format whitelist** — Zod regex restricts to PNG / JPEG / WebP
   data URLs.
5. **Magic-byte verification** — first bytes must match the declared
   format (`app/lib/imageBytes.ts`). Closes the "PNG label, malicious
   payload" trick.
6. **sharp re-encoding** — `app/lib/imageProcessor.ts`:
   - Reads dimensions WITHOUT decoding pixels (catches decompression
     bombs cheaply).
   - Rejects animated images.
   - Strips EXIF / IPTC / XMP metadata (GPS coords from phone uploads
     no longer leak).
   - Applies EXIF orientation then drops the tag.
   - Resizes to a max of 1600px on the longest side.
   - Re-encodes as WebP at quality 82.
   - Output is deterministic, structurally valid, and free of any
     hidden payload that might have been concatenated to the original.
7. **Pending-queue cap** — global cap of 100 pending submissions; any
   more get a polite 503.
8. **Human moderation** — every submission is `status: 'pending'`
   until a human approves it in `/admin`. Nothing displays publicly
   without approval.

That covers structural attacks and metadata leakage. **It does NOT
catch adult / violent / extremist imagery** — for that you need a
content classifier model. We added a hook for one, see below.

## Adding an automated content classifier

`app/lib/imageProcessor.ts` exports a `runContentModeration()` function
that's currently a no-op. To plug in a real provider, edit that
function. The route handler will already call it; you just need to
return `{ allow: false, reason, categories }` when you want to block.

### Option 1: Cloudflare Workers AI (cheapest, free tier)

If you're already on Cloudflare for DNS + email, you can call their
inference API from your Vercel function. Their `@cf/unum/uform-gen2-qwen-500m`
model captions any image; you then text-classify the caption.

**Cost**: 10000 free Neurons/day, then $0.011 per 1000 Neurons. For
this use case, basically free.

```ts
// In runContentModeration():
const captionRes = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/unum/uform-gen2-qwen-500m`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: Array.from(processed.bytes),
      prompt: 'Describe this image in one sentence.',
      max_tokens: 60,
    }),
  }
);
const { result } = await captionRes.json();
const caption = (result.description ?? '').toLowerCase();
const banned = ['nude', 'naked', 'weapon', 'gun', 'knife', 'blood', 'gore', 'swastika'];
const hit = banned.find((w) => caption.includes(w));
if (hit) {
  return { allow: false, reason: 'Image flagged by automated review.', categories: [hit] };
}
```

### Option 2: AWS Rekognition (industry standard)

**Cost**: First 5000 images/month free for 12 months, then $1 per 1000.

`DetectModerationLabels` returns hierarchical labels with confidence
scores. Wire it in by adding `@aws-sdk/client-rekognition`:

```ts
import { RekognitionClient, DetectModerationLabelsCommand } from '@aws-sdk/client-rekognition';

const client = new RekognitionClient({ region: 'us-east-1' });
const out = await client.send(
  new DetectModerationLabelsCommand({
    Image: { Bytes: processed.bytes },
    MinConfidence: 70,
  })
);
const flagged = (out.ModerationLabels ?? []).filter(
  (l) => l.Confidence != null && l.Confidence > 80
);
if (flagged.length > 0) {
  return {
    allow: false,
    reason: 'Image flagged by automated review.',
    categories: flagged.map((l) => l.Name ?? '').filter(Boolean),
  };
}
```

### Option 3: Sightengine (purpose-built, kid-content mode)

**Cost**: $0.001 per image, free 2000/month trial.

Has a `nudity-2.0` model that's specifically tuned to catch even
cartoon nudity, plus violence/weapon/drug models. Best signal-to-noise
for a kids' site IMO, just costs money.

```ts
const form = new FormData();
form.append('media', new Blob([processed.bytes], { type: 'image/webp' }), 'image.webp');
form.append('models', 'nudity-2.0,weapon,offensive,gore');
form.append('api_user', process.env.SIGHTENGINE_USER!);
form.append('api_secret', process.env.SIGHTENGINE_SECRET!);

const res = await fetch('https://api.sightengine.com/1.0/check.json', {
  method: 'POST',
  body: form,
});
const data = await res.json();

if (
  data.nudity.sexual_activity > 0.5 ||
  data.nudity.sexual_display > 0.5 ||
  data.weapon > 0.5 ||
  data.gore.prob > 0.5
) {
  return {
    allow: false,
    reason: 'Image flagged by automated review.',
    categories: Object.entries(data)
      .filter(([_, v]: any) => typeof v === 'number' && v > 0.5)
      .map(([k]) => k),
  };
}
```

### Option 4: Hive AI (most thorough, most expensive)

Same shape as Sightengine, ~$1 per 1000, has the strongest CSAM /
violence detection on the market. Used by Reddit, Bluesky, Discord.
Worth it if traffic ever justifies the spend.

## Tuning advice

- **Start strict.** A false reject just shows "queued for review" to
  the user — they don't know it was auto-rejected. A false approve
  shows kids something they shouldn't see. Bias toward strict.
- **Log every auto-rejection.** Add an entry to `rejection_log` with
  the categories returned by the classifier. Helps you tune thresholds.
- **Human still reviews approved.** The classifier should auto-REJECT
  obvious bad stuff but never auto-APPROVE. Humans always finalise.
- **Don't tell the user why.** "Image flagged by automated review.
  Please try a different drawing." Telling them the exact category
  helps adversaries calibrate.

## What about CSAM specifically?

If you ever see CSAM (child sexual abuse material) in the queue:

1. **Do not download it.** Do not screenshot it. Reject it from the
   admin UI immediately.
2. **Report to NCMEC** (National Center for Missing & Exploited
   Children) at https://report.cybertip.org or +1-800-843-5678.
3. **Report to the IWF** (UK / Europe) at https://report.iwf.org.uk.
4. **Preserve the IP / timestamp** from your Vercel + Supabase logs.
5. **Email security@astroid.space** so it's logged for your own
   records.

This is not optional in most jurisdictions.

If volume warrants, integrate **Microsoft PhotoDNA** (free for
qualifying child-safety projects) or **Thorn Safer** to hash-match
against known CSAM corpora before any image touches storage.
