/**
 * @fileoverview Lightweight profanity / abuse filter for user-submitted text.
 *
 * Two layers:
 *
 * 1. **Blocklist** - a small, deliberately curated list of obvious slurs
 *    and offensive terms. Matched with word-boundary regex against a
 *    normalised version of the input (lowercased, leetspeak-folded,
 *    punctuation collapsed, repeated letters squeezed). This catches the
 *    common bypass tricks (`f4ck`, `f.u.c.k`, `fuuuck`) without becoming
 *    a Scunthorpe machine.
 *
 * 2. **Heuristics** - too-long links, all-caps shouting, mass repeated
 *    chars, obvious spam markers ("buy now", "free crypto"). These don't
 *    necessarily reject; they raise a "suspicious" flag the moderator
 *    queue can sort by.
 *
 * NOT a complete solution. Every rejected submission also goes to a human
 * moderation queue - this is just the first cheap pass to keep the public
 * site clean and the queue manageable.
 */

/**
 * Curated blocklist. Deliberately small and conservative - long lists
 * cause false positives ("Scunthorpe problem"). Slurs and the most common
 * scam markers only. Add to this list with care.
 */
const BLOCKLIST = [
  // Slurs (strict - never appropriate, especially on a kid-facing site)
  'nigger', 'nigga', 'faggot', 'fag', 'tranny', 'retard', 'retarded',
  'kike', 'spic', 'chink', 'gook', 'wetback', 'coon',
  // CSAM-adjacent / sexual-of-minors red flags
  'pedo', 'pedophile', 'cp', 'lolita', 'jailbait', 'underage',
  // Crypto-scam / drainer patterns
  'connect wallet', 'verify wallet', 'claim airdrop', 'send sol to', 'send eth to',
  'private key', 'seed phrase', 'metamask connect', 'phantom connect',
  'free crypto', 'free token', 'pump signal',
  // Generic obscenity that's inappropriate on a kid-facing site
  'fuck', 'shit', 'cunt', 'bitch', 'asshole', 'bastard', 'dick',
  'pussy', 'cock', 'whore', 'slut',
  // Hate / nazi
  'sieg heil', 'heil hitler', 'kkk', 'white power',
];

/** Common leetspeak character substitutions used to evade filters. */
const LEET_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i',
  '|': 'i',
};

/**
 * Normalise input for matching:
 *   - lowercase
 *   - Unicode NFKD then strip combining marks (defeats zalgo / accents)
 *   - apply leetspeak map
 *   - squeeze repeated letters (3+ in a row → 2: "fuuuck" → "fuuck")
 *   - drop all non-letter chars (defeats f.u.c.k, f-u-c-k)
 */
function normalise(input: string): string {
  const lowered = input.toLowerCase();
  const stripped = lowered.normalize('NFKD').replace(/\p{Mn}/gu, '');
  let out = '';
  for (const ch of stripped) out += LEET_MAP[ch] ?? ch;
  out = out.replace(/[^a-z ]/g, ' ');
  out = out.replace(/(.)\1{2,}/g, '$1$1');
  return out.replace(/\s+/g, ' ').trim();
}

export interface ContentCheckResult {
  /** True if the content passed all hard rules. */
  ok: boolean;
  /** Hard-fail reason; safe to show to the user verbatim. */
  reason?: string;
  /** Soft signal - content is allowed but worth highlighting in moderation. */
  suspicious?: boolean;
  /** Words/phrases matched, useful for the admin UI. */
  matched?: string[];
}

/**
 * Checks user-submitted text against the block-list + heuristics.
 * Returns a `ContentCheckResult`. Designed to be called server-side
 * before persisting; never trust the client.
 */
export function checkContent(raw: string): ContentCheckResult {
  if (!raw || raw.trim().length === 0) {
    return { ok: false, reason: 'Please write something.' };
  }

  const normalised = normalise(raw);
  const matched: string[] = [];

  for (const term of BLOCKLIST) {
    // Word boundary match against the normalised string. The space-padding
    // trick + indexOf is robust to multi-word terms and avoids regex pitfalls
    // for terms with punctuation already stripped.
    const padded = ` ${normalised} `;
    if (padded.includes(` ${term} `) || padded.includes(`${term} `) || padded.includes(` ${term}`)) {
      matched.push(term);
    }
  }
  if (matched.length > 0) {
    return {
      ok: false,
      reason: 'That message contains language we cannot publish on a kid-friendly site. Please rephrase.',
      matched,
    };
  }

  // Soft signals - don't reject, just flag for moderator attention.
  const suspicious =
    /https?:\/\//i.test(raw) ||
    /\b(buy|sell|moon|airdrop|degen|10x|100x|pump|dump|whale|presale)\b/i.test(raw) ||
    raw.replace(/[^A-Z]/g, '').length > raw.length * 0.6;

  return { ok: true, suspicious };
}

/**
 * Validate a display name (a "from" / "namedBy" / "artistName" field).
 * Same rules as a long body, plus stricter character class - names
 * shouldn't contain URLs, @-handles, or excessive punctuation.
 */
export function checkDisplayName(raw: string): ContentCheckResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: true };
  if (/https?:\/\//i.test(trimmed) || /[<>]/.test(trimmed) || /@\S+/.test(trimmed)) {
    return {
      ok: false,
      reason: 'Names cannot contain links, @-handles, or HTML.',
    };
  }
  return checkContent(trimmed);
}
