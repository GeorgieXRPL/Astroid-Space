/**
 * @fileoverview Public storage facade.
 *
 * Picks a backend at module load based on `STORAGE_BACKEND`:
 *
 *   STORAGE_BACKEND=memory   → in-process Maps (dev default, no setup)
 *   STORAGE_BACKEND=supabase → Supabase Postgres + Storage (production)
 *
 * If unset, defaults to `memory`. The Supabase backend additionally
 * requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
 *
 * Every store method is async. Callers must `await`.
 */

import { memoryBundle } from './storage/memory';
import type { StorageBundle } from './storage/types';

export {
  PENDING_CAPS,
  PENDING_TTL_MS,
  PendingQueueFullError,
} from './storage/types';
export type {
  ModerationStatus,
  Wish,
  ColoringSubmission,
  ColoringSubmissionInput,
  CharityNomination,
  ListStarsOptions,
  ListWishesOptions,
  ListColoringOptions,
  ListNominationsOptions,
  RejectionLogEntry,
} from './storage/types';

function pickBundle(): StorageBundle {
  const choice = (process.env.STORAGE_BACKEND ?? 'memory').toLowerCase();
  if (choice === 'supabase') {
    // Lazy-require so a misconfigured env doesn't break the memory path.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { supabaseBundle } = require('./storage/supabase') as typeof import('./storage/supabase');
    return supabaseBundle;
  }
  if (choice !== 'memory') {
    console.warn(
      `[storage] Unknown STORAGE_BACKEND="${choice}", falling back to "memory". Use "memory" or "supabase".`
    );
  }
  return memoryBundle;
}

const bundle = pickBundle();

export const namedStarStore = bundle.stars;
export const wishStore = bundle.wishes;
export const coloringSubmissionStore = bundle.coloring;
export const charityNominationStore = bundle.nominations;
export const listRecentRejections = bundle.listRecentRejections;
