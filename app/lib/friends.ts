/**
 * @fileoverview Friends Across the Sky — communities we respect.
 *
 * We're "Astroid" (starlike). We celebrate Liv's original artwork of
 * Astroid and every other project — large or small — pointing kids at
 * the stars. Different journeys, same sky.
 *
 * This is a curated, hand-edited list — not a partnership program.
 * Submissions: open a PR.
 */

export type FriendCategory = 'space-science' | 'kids-charity' | 'memecoin-good';

export interface Friend {
  /** Display name */
  name: string;
  /** Shown beneath the name as a category tag */
  category: FriendCategory;
  /** One-line, respectful description (kept under ~140 chars) */
  blurb: string;
  /** Outbound link. Omit when the entry is a placeholder/not yet live. */
  url?: string;
  /** Optional emoji-as-marker since we deliberately ship no third-party logos */
  marker: string;
  /** Coordinates in the friends sky (purely visual) */
  position: [number, number];
  /**
   * Optional badge shown on the card. Use for entries that aren't yet
   * a clickable destination (e.g. "Not currently live").
   */
  status?: string;
}

export const FRIEND_CATEGORY_LABELS: Record<FriendCategory, string> = {
  'space-science': 'Space science',
  'kids-charity': 'Children\u2019s charity',
  'memecoin-good': 'Memecoins doing good',
};

export const FRIENDS: Friend[] = [
  {
    name: 'B612 Foundation',
    category: 'space-science',
    blurb:
      'Real-world planetary defense. They actually look for asteroids that might hit Earth.',
    url: 'https://b612foundation.org',
    marker: '\u2625',
    position: [-1.0, -0.8],
  },
  {
    name: 'NASA Eyes on Asteroids',
    category: 'space-science',
    blurb:
      'Live 3D map of every known near-Earth object. The science cousin to our little sky.',
    url: 'https://eyes.nasa.gov/apps/asteroids',
    marker: '\u2609',
    position: [1.5, -0.5],
  },
  {
    name: 'St. Jude Children\u2019s Research Hospital',
    category: 'kids-charity',
    blurb:
      'No family ever pays. Funded by people like you. The standard for childhood-illness charity.',
    url: 'https://www.stjude.org',
    marker: '\u2665',
    position: [0.2, 1.4],
  },
  {
    name: 'Make-A-Wish',
    category: 'kids-charity',
    blurb:
      'Grants wishes to kids with critical illnesses. Their wishes inspired our Wish Wall.',
    url: 'https://wish.org',
    marker: '\u272e',
    position: [-1.6, -0.1],
  },
  {
    name: 'Heart Kids New Zealand',
    category: 'kids-charity',
    blurb:
      'Supports Kiwi tamariki born with childhood heart defects and their wh\u0101nau. One in every 100 babies in Aotearoa is born with a heart condition.',
    url: 'https://www.heartkids.org.nz',
    marker: '\u2661',
    position: [-0.4, 1.2],
  },
  {
    name: 'Rebecca Perrotto\u2019s Charity for Liv',
    category: 'kids-charity',
    blurb:
      'A dedicated charity initiative honoring Liv. We\u2019re holding a place for it on the sky while it gets organized.',
    marker: '\u2728',
    position: [1.4, 0.6],
    status: 'Not currently live',
  },
  {
    name: 'Pump.fun',
    category: 'memecoin-good',
    blurb:
      'The launchpad we used. Their on-chain creator-fee split is what makes our 25% charity routing automatic.',
    url: 'https://pump.fun',
    marker: '\u25c6',
    position: [0.6, -1.3],
  },
];
