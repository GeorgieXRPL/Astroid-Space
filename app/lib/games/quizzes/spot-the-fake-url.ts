/**
 * @fileoverview Spot the Fake URL - 12-pair pool.
 *
 * Each question shows two URLs. The player picks the real one. The
 * explanation names the trick used by the fake (homoglyph, extra
 * letter, hyphen swap, fake subdomain, protocol downgrade, TLD
 * confusion, etc.) so the kid builds a vocabulary for what to look
 * for next time.
 *
 * Authoring rules:
 *   - The "real" answer should be a site we genuinely point at on
 *     this site (astroid.space, solscan.io, stjude.org, pump.fun)
 *     so the lesson reinforces the addresses they actually need to
 *     recognise.
 *   - The fake should never resolve to a real malicious site - we
 *     deliberately use plausibly-fake examples that are unlikely to
 *     be live, and we never link to either choice.
 *   - Mix the trick types so the kid gets exposure to multiple
 *     attack patterns, not just letter swaps.
 *
 * The choices are rendered as monospace cards. The "correct" choice
 * id is always the real URL, but their order is preserved as authored
 * (we don't shuffle within a question - that would be confusing for
 * kids re-playing).
 */

import type { Quiz } from '../types';

export const SPOT_THE_FAKE_URL_QUIZ: Quiz = {
  slug: 'spot-the-fake-url',
  title: 'Spot the Fake URL',
  tagline:
    'Two web addresses. One is real. One is one letter away from a wallet drainer.',
  description:
    'Five rounds. Each shows two web addresses side by side - one real, one a fake designed to trick the eyes. Pick the real one. The explanation names the exact trick used.',
  category: 'brain',
  difficulty: 2,
  estMinutes: 3,
  roundSize: 5,
  pool: [
    {
      id: 'url-astroid-letter-swap',
      prompt: 'Which is the real Astroid website?',
      choices: [
        { id: 'a', label: 'astrold.space' },
        { id: 'b', label: 'astroid.space' },
      ],
      correctId: 'b',
      explanation:
        'Letter swap: "astrold" (l-d) instead of "astroid" (i-d). One missing letter, completely different site. Read the address out loud - the ear catches what the eye misses.',
    },
    {
      id: 'url-astroid-extra-letter',
      prompt: 'Which is the real Astroid website?',
      choices: [
        { id: 'a', label: 'astroid.space' },
        { id: 'b', label: 'astroidd.space' },
      ],
      correctId: 'a',
      explanation:
        'Doubled letter: an extra "d" at the end. A favourite trick because the extra character barely registers when you skim. Always read each character of an address before clicking.',
    },
    {
      id: 'url-astroid-tld',
      prompt: 'Which is the real Astroid website?',
      choices: [
        { id: 'a', label: 'astroid.com' },
        { id: 'b', label: 'astroid.space' },
      ],
      correctId: 'b',
      explanation:
        'TLD swap: same name, different ending. .com is more familiar than .space, so people assume .com is right. Always check the full address, including the part after the dot.',
    },
    {
      id: 'url-astroid-hyphen',
      prompt: 'Which is the real Astroid website?',
      choices: [
        { id: 'a', label: 'astroid-space.com' },
        { id: 'b', label: 'astroid.space' },
      ],
      correctId: 'b',
      explanation:
        'Hyphen impersonation: "astroid-space.com" looks like Astroid Space, but it is a totally different domain. Real domains do not need a hyphen-and-com to spell themselves out.',
    },
    {
      id: 'url-astroid-subdomain',
      prompt: 'Which is the real Astroid website?',
      choices: [
        { id: 'a', label: 'astroid.space.officialsite.com' },
        { id: 'b', label: 'astroid.space' },
      ],
      correctId: 'b',
      explanation:
        'Subdomain trick: anyone can put "astroid.space" inside a longer address they own. The real domain is the LAST two parts before the slash - here, "officialsite.com" - which is not us.',
    },
    {
      id: 'url-solscan-zero',
      prompt: 'Which is the real Solana block explorer?',
      choices: [
        { id: 'a', label: 's0lscan.io' },
        { id: 'b', label: 'solscan.io' },
      ],
      correctId: 'b',
      explanation:
        'Zero-for-O swap: "s0lscan" uses a zero instead of the letter O. In some fonts they are almost identical. Solscan is the real explorer used to verify the charity wallet.',
    },
    {
      id: 'url-solscan-extra',
      prompt: 'Which is the real Solana block explorer?',
      choices: [
        { id: 'a', label: 'solscan.io' },
        { id: 'b', label: 'solskan.io' },
      ],
      correctId: 'a',
      explanation:
        'K-for-C swap: "solskan" sounds the same when said quickly but is not the right letter. Crypto explorers are common phishing targets because that is where people verify addresses.',
    },
    {
      id: 'url-stjude',
      prompt: "Which is St. Jude's real website?",
      choices: [
        { id: 'a', label: 'stjude.org' },
        { id: 'b', label: 'st-jude.org' },
      ],
      correctId: 'a',
      explanation:
        'Hyphen swap: "st-jude.org" is a completely separate domain that anyone can register. Charities are common phishing targets - always check the address before donating directly.',
    },
    {
      id: 'url-pumpfun',
      prompt: "Which is pump.fun's real website?",
      choices: [
        { id: 'a', label: 'pump-fun.com' },
        { id: 'b', label: 'pump.fun' },
      ],
      correctId: 'b',
      explanation:
        '.fun is the real top-level domain. The fake replaces the dot with a hyphen and tacks on .com. If you only remember the name and not the address, this is exactly how the trick works.',
    },
    {
      id: 'url-protocol',
      prompt: 'Which is safer to type into your browser bar?',
      choices: [
        { id: 'a', label: 'http://astroid.space' },
        { id: 'b', label: 'https://astroid.space' },
      ],
      correctId: 'b',
      explanation:
        'The "s" in https means the connection is encrypted - nobody between your computer and the website can read what you send. Plain http is much riskier. Modern browsers usually warn you about http sites; pay attention when they do.',
    },
    {
      id: 'url-charity-fake-tld',
      prompt: "Which is the real Astroid charity page?",
      choices: [
        { id: 'a', label: 'astroid.space.io/charity' },
        { id: 'b', label: 'astroid.space/charity' },
      ],
      correctId: 'b',
      explanation:
        'TLD trick: "astroid.space.io" is a different site that owns the .io ending. The real Astroid site ends with .space and the path /charity comes right after - no extra .io between them.',
    },
    {
      id: 'url-homoglyph',
      prompt: 'Which is the real Astroid website?',
      choices: [
        { id: 'a', label: 'astroid.space' },
        { id: 'b', label: 'astrоid.space' },
      ],
      correctId: 'a',
      explanation:
        'Homoglyph attack: the second URL uses a Cyrillic "о" instead of the Latin "o". They look identical in most fonts - this is one of the hardest fakes to spot by eye. Browsers usually flag these as "suspicious internationalised domain"; trust that warning.',
    },
  ],
};
