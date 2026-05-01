'use client';

import { Quiz } from '../games/Quiz';
import { REAL_OR_SCAM_QUIZ } from '../../lib/games/quizzes/real-or-scam';
import { getGameSummaries } from '../../lib/games/registry';

/**
 * Inline embed of the Real-or-Scam quiz on the /learn page.
 *
 * Kept as a thin wrapper around the shared <Quiz /> engine so the
 * lesson page and the dedicated /games/real-or-scam page render
 * exactly the same game from a single source. We hide the "Back to
 * the games hub" link here since the user is on /learn, not the hub.
 */
export function RealOrScam() {
  // The game summaries are static, derived once at module init time
  // from the registry. Calling getGameSummaries() at render time
  // would also be fine - it's a pure projection - but pulling it once
  // keeps the component re-render cheap.
  const registry = getGameSummaries();

  return (
    <Quiz quiz={REAL_OR_SCAM_QUIZ} registry={registry} hideHubLink={false} />
  );
}
