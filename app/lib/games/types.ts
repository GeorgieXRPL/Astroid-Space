/**
 * @fileoverview Quiz engine types.
 *
 * One unified `Question` shape powers every quiz on /games. The visual
 * treatment (`promptStyle`) controls how the prompt renders without
 * needing a separate component per game type.
 */

/** Where a game lives in the hub. */
export type GameCategory = 'brain' | 'fun';

/** A single answer choice. */
export interface Choice {
  /** Stable identifier within the question (e.g. "a", "b", "c"). */
  id: string;
  /** What the player sees on the button. */
  label: string;
}

/** One question in a pool. */
export interface Question {
  /**
   * Stable, globally-unique-within-the-pool id. Used for rotation
   * tracking across plays. Changing an id resets that question's
   * rotation history; safe to do, just means the question can show
   * up again in the next round.
   */
  id: string;
  /**
   * Optional small label rendered above the prompt. Used for things
   * like the "from" sender on Real-or-Scam. Pure decoration.
   */
  prelude?: string;
  /** The main question content. */
  prompt: string;
  /**
   * How to render the prompt visually:
   *   - 'plain'  → normal paragraph (trivia, multiple choice)
   *   - 'quote'  → in quotation marks, italic-feel (DM-style messages)
   *   - 'mono'   → fixed-width block (URLs, addresses)
   */
  promptStyle?: 'plain' | 'quote' | 'mono';
  /** 2-4 answer choices. Order is preserved as authored. */
  choices: Choice[];
  /** Which choice id is the correct one. */
  correctId: string;
  /** One-or-two-sentence explanation shown after the player answers. */
  explanation: string;
}

/** A complete quiz definition. */
export interface Quiz {
  /** URL slug. Used for /games/[slug] and rotation localStorage key. */
  slug: string;
  /** Display title on the hub card and the game page. */
  title: string;
  /** One-line tagline shown on the hub card. */
  tagline: string;
  /** Brain (educational) or Fun (playful). */
  category: GameCategory;
  /** Display difficulty 1-3 (★, ★★, ★★★). */
  difficulty: 1 | 2 | 3;
  /** Approximate play time in minutes, for the hub badge. */
  estMinutes: number;
  /** Pool of questions to sample from. Should be >= roundSize * 2. */
  pool: Question[];
  /** How many questions per single play-through. */
  roundSize: number;
  /**
   * Longer description shown on the dedicated game page above the
   * play area. Optional - defaults to tagline if absent.
   */
  description?: string;
  /**
   * Optional metadata description override for SEO. Defaults to
   * tagline if absent.
   */
  metaDescription?: string;
}

/** A registry entry's lightweight summary - useful for hub/recommender. */
export interface GameSummary {
  slug: string;
  title: string;
  tagline: string;
  category: GameCategory;
  difficulty: 1 | 2 | 3;
  estMinutes: number;
}
