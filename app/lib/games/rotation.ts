/**
 * @fileoverview Walk-pool rotation: every question is shown once
 * before any repeat, then the pool reshuffles.
 *
 * Rotation state lives in localStorage under a per-quiz key so each
 * device has its own progress. Nothing is ever sent off-device.
 *
 * Storage shape:
 *   astroid:games:{slug}:rotation = {
 *     shuffled: ["q-3", "q-7", "q-1", ...],
 *     cursor: 5,            // next index to take from
 *     poolHash: "abc123"    // detects content changes; reshuffles when stale
 *   }
 *
 *   astroid:games:recent-plays = [
 *     { slug: "real-or-scam", at: 1719450000000 },
 *     ...
 *   ]                       // capped at the last 10 plays
 *
 * If localStorage is unavailable (private browsing, SSR, certain
 * embedded WebViews), every helper degrades to a sensible default
 * rather than throwing - the worst case is a fresh shuffle every
 * play, which is still better than fixed questions.
 */

import type { Question, GameSummary } from './types';

interface RotationState {
  shuffled: string[];
  cursor: number;
  poolHash: string;
}

interface RecentPlay {
  slug: string;
  at: number;
}

const ROTATION_KEY = (slug: string) => `astroid:games:${slug}:rotation`;
const RECENT_PLAYS_KEY = 'astroid:games:recent-plays';
const RECENT_PLAYS_MAX = 10;
/** Plays within this window are treated as "just played" for the recommender. */
const RECENT_PLAY_WINDOW_MS = 10 * 60 * 1000;

/* ============================================================
   Storage helpers (SSR / private-browsing safe)
   ============================================================ */

function safeRead<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // QuotaExceededError, JSON parse failure, or storage disabled.
    return null;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silent: storage may be disabled or full. Game still works,
    // just without cross-session rotation memory.
  }
}

/* ============================================================
   Pool integrity hash
   ============================================================
   We need to detect when the quiz pool has changed (e.g. we shipped
   new questions) so we can reshuffle instead of walking through a
   stale ordering that may reference deleted ids. A cheap stable hash
   over the joined ids is enough - we don't need crypto here. */

function hashPool(pool: Question[]): string {
  const joined = pool.map((q) => q.id).join('|');
  let h = 0;
  for (let i = 0; i < joined.length; i++) {
    h = (h * 31 + joined.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

/* ============================================================
   Fisher-Yates shuffle (in-place clone)
   ============================================================ */

function shuffle<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ============================================================
   Public API
   ============================================================ */

/**
 * Pick the next round of questions for a quiz, using walk-pool rotation.
 * Side effect: advances the rotation cursor in localStorage so the next
 * call returns a different round.
 *
 * Guarantees:
 *   - Within one full pass over the pool, no question repeats.
 *   - When the cursor would overflow the pool, the remainder of the
 *     round is filled from a freshly-shuffled pool. (Edge case: if
 *     `roundSize > pool.length`, returned length === pool.length.)
 *   - If pool content changed since the last play (detected via
 *     poolHash), a new shuffle starts immediately.
 */
export function pickRound(
  slug: string,
  pool: Question[],
  roundSize: number
): Question[] {
  if (pool.length === 0) return [];
  const cap = Math.min(roundSize, pool.length);
  const wantedHash = hashPool(pool);

  const stored = safeRead<RotationState>(ROTATION_KEY(slug));
  const storedInvalid =
    !stored ||
    stored.poolHash !== wantedHash ||
    !Array.isArray(stored.shuffled) ||
    stored.shuffled.length !== pool.length ||
    stored.cursor < 0;

  // Resolve to a definitely-non-null state. Using a fresh const so TS
  // narrows correctly inside the loop below; the conditional reassign
  // pattern fights the narrower.
  const state: RotationState = storedInvalid
    ? {
        shuffled: shuffle(pool.map((q) => q.id)),
        cursor: 0,
        poolHash: wantedHash,
      }
    : (stored as RotationState);

  // Take up to `cap` ids starting at the cursor; reshuffle and continue
  // if we run out mid-round. We track picked ids in a Set and skip
  // duplicates so the round can never contain the same question twice
  // (which would crash React's key reconciliation).
  //
  // Why duplicates can arise without this guard: when the cursor reaches
  // the end of `shuffled` partway through a round, we reshuffle the whole
  // pool. The fresh shuffle includes every id - including the ones we
  // already picked in this round's earlier iterations.
  //
  // The skip-on-duplicate strategy is safe because `cap <= pool.length`
  // is enforced earlier, so the fresh shuffle ALWAYS contains at least
  // one not-yet-picked id. The loop is bounded by O(pool.length) extra
  // iterations in the worst case.
  const pickedIds: string[] = [];
  const pickedSet = new Set<string>();
  let cursor = state.cursor;
  let shuffled = state.shuffled;
  let safety = pool.length * 4; // hard cap, defensive

  while (pickedIds.length < cap && safety > 0) {
    safety -= 1;
    if (cursor >= shuffled.length) {
      shuffled = shuffle(pool.map((q) => q.id));
      cursor = 0;
    }
    const candidate = shuffled[cursor];
    cursor += 1;
    if (pickedSet.has(candidate)) {
      continue; // already in this round - skip and walk on
    }
    pickedIds.push(candidate);
    pickedSet.add(candidate);
  }

  safeWrite<RotationState>(ROTATION_KEY(slug), {
    shuffled,
    cursor,
    poolHash: wantedHash,
  });

  // Resolve ids back to question objects, preserving order.
  // Defensive: if an id can't be resolved (pool drift mid-session),
  // skip it - never crash a kid's game over a content edit.
  const byId = new Map(pool.map((q) => [q.id, q]));
  return pickedIds
    .map((id) => byId.get(id))
    .filter((q): q is Question => q !== undefined);
}

/**
 * Reset a single quiz's rotation state. Safe to call when storage is
 * unavailable - it's a no-op in that case.
 */
export function resetRotation(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ROTATION_KEY(slug));
  } catch {
    // ignore
  }
}

/**
 * Record that the user finished a play of `slug`. Used by the
 * cross-game recommender to avoid suggesting whatever they just
 * played.
 */
export function recordPlay(slug: string): void {
  const now = Date.now();
  const existing = safeRead<RecentPlay[]>(RECENT_PLAYS_KEY) ?? [];
  const next = [{ slug, at: now }, ...existing].slice(0, RECENT_PLAYS_MAX);
  safeWrite<RecentPlay[]>(RECENT_PLAYS_KEY, next);
}

/**
 * Pick a different game to suggest at the end of a quiz.
 *
 * Strategy:
 *   1. Exclude the game that just finished.
 *   2. Exclude any game played in the last RECENT_PLAY_WINDOW_MS.
 *   3. Prefer games in the same category as the current one.
 *   4. Fall back to any non-excluded game.
 *
 * Returns null if there's nothing reasonable to suggest (e.g. a
 * single-game registry).
 */
export function pickNextGame(
  currentSlug: string,
  registry: readonly GameSummary[]
): GameSummary | null {
  const current = registry.find((g) => g.slug === currentSlug) ?? null;
  const recent = safeRead<RecentPlay[]>(RECENT_PLAYS_KEY) ?? [];
  const cutoff = Date.now() - RECENT_PLAY_WINDOW_MS;
  const recentlyPlayed = new Set(
    recent.filter((p) => p.at >= cutoff).map((p) => p.slug)
  );

  const eligible = registry.filter(
    (g) => g.slug !== currentSlug && !recentlyPlayed.has(g.slug)
  );

  if (eligible.length === 0) {
    // Last resort: anything but current. Better to bounce back to
    // a recently-played game than offer nothing.
    const anyOther = registry.filter((g) => g.slug !== currentSlug);
    if (anyOther.length === 0) return null;
    return anyOther[Math.floor(Math.random() * anyOther.length)];
  }

  const sameCategory = current
    ? eligible.filter((g) => g.category === current.category)
    : [];
  const pool = sameCategory.length > 0 ? sameCategory : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}
