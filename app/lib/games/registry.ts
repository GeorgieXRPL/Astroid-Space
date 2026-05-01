/**
 * @fileoverview The single source of truth for all games on /games.
 *
 * Adding a new game = drop a quiz file in ./quizzes/ and add it to
 * QUIZZES below. Hub, runner page, sitemap, and recommender all read
 * from here.
 */

import type { Quiz, GameSummary } from './types';
import { REAL_OR_SCAM_QUIZ } from './quizzes/real-or-scam';
import { SPOT_THE_FAKE_URL_QUIZ } from './quizzes/spot-the-fake-url';
import { ASTROID_LORE_QUIZ } from './quizzes/astroid-lore';

/** Display order on the hub. Brain games first by convention. */
export const QUIZZES: Quiz[] = [
  REAL_OR_SCAM_QUIZ,
  SPOT_THE_FAKE_URL_QUIZ,
  ASTROID_LORE_QUIZ,
];

/** Lookup by slug. Used by /games/[slug]. */
export function getQuiz(slug: string): Quiz | null {
  return QUIZZES.find((q) => q.slug === slug) ?? null;
}

/** Lightweight summary projection for UI surfaces that don't need pools. */
export function getGameSummaries(): GameSummary[] {
  return QUIZZES.map((q) => ({
    slug: q.slug,
    title: q.title,
    tagline: q.tagline,
    category: q.category,
    difficulty: q.difficulty,
    estMinutes: q.estMinutes,
  }));
}

/** All slugs - used for sitemap and static params. */
export function getAllSlugs(): string[] {
  return QUIZZES.map((q) => q.slug);
}
