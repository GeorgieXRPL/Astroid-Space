/**
 * @fileoverview In-memory storage backend.
 *
 * Process-local Maps with HMR-safe global stashing. Useful for local
 * development and any deploy small enough that a restart wiping data
 * is acceptable. NOT suitable for production - use the Supabase
 * backend (`STORAGE_BACKEND=supabase`) for that.
 */

import type { NamedStar } from '../stars';
import {
  ColoringStore,
  ColoringSubmission,
  ColoringSubmissionInput,
  CharityNomination,
  CharityNominationStore,
  ListColoringOptions,
  ListNominationsOptions,
  ListStarsOptions,
  ListWishesOptions,
  ModerationStatus,
  NamedStarStore,
  PENDING_CAPS,
  PENDING_TTL_MS,
  PendingQueueFullError,
  RejectionLogEntry,
  StorageBundle,
  Wish,
  WishStore,
} from './types';

declare global {
  // eslint-disable-next-line no-var
  var __astroidMemStores:
    | {
        stars: Map<string, NamedStar>;
        wishes: Map<string, Wish>;
        coloring: Map<string, ColoringSubmission>;
        nominations: Map<string, CharityNomination>;
        rejectionLog: RejectionLogEntry[];
      }
    | undefined;
}

const MAX_REJECTION_LOG = 200;

const stores =
  globalThis.__astroidMemStores ??
  (globalThis.__astroidMemStores = {
    stars: new Map<string, NamedStar>(),
    wishes: new Map<string, Wish>(),
    coloring: new Map<string, ColoringSubmission>(),
    nominations: new Map<string, CharityNomination>(),
    rejectionLog: [],
  });

const starsStore = stores.stars;
const wishesStore = stores.wishes;
const coloringStore = stores.coloring;
const nominationsStore = stores.nominations;
const rejectionLog = stores.rejectionLog;

function logRejection(kind: RejectionLogEntry['kind'], summary: string): void {
  rejectionLog.push({ kind, summary, at: new Date().toISOString() });
  while (rejectionLog.length > MAX_REJECTION_LOG) rejectionLog.shift();
}

function sweepStalePending<T extends { status: ModerationStatus; createdAt?: string; namedAt?: string }>(
  store: Map<string, T>
): void {
  const cutoff = Date.now() - PENDING_TTL_MS;
  for (const [key, value] of store) {
    if (value.status !== 'pending') continue;
    const tsRaw = value.createdAt ?? value.namedAt;
    if (!tsRaw) continue;
    const ts = Date.parse(tsRaw);
    if (Number.isFinite(ts) && ts < cutoff) {
      store.delete(key);
    }
  }
}

function countPending<T extends { status: ModerationStatus }>(store: Map<string, T>): number {
  let n = 0;
  for (const v of store.values()) if (v.status === 'pending') n++;
  return n;
}

// ============================================================================
// Stars
// ============================================================================

const memStarStore: NamedStarStore = {
  async has(designation) {
    return starsStore.has(designation);
  },
  async get(designation) {
    return starsStore.get(designation);
  },
  async name(record) {
    sweepStalePending(starsStore);
    if (starsStore.has(record.designation)) return null;
    if (record.status === 'pending' && countPending(starsStore) >= PENDING_CAPS.stars) {
      throw new PendingQueueFullError('star');
    }
    starsStore.set(record.designation, record);
    return record;
  },
  async setStatus(designation, status) {
    const s = starsStore.get(designation);
    if (!s) return null;
    if (status === 'rejected') {
      starsStore.delete(designation);
      logRejection('star', `${designation} → "${s.name}"${s.namedBy ? ` by ${s.namedBy}` : ''}`);
      return { ...s, status };
    }
    const updated: NamedStar = { ...s, status };
    starsStore.set(designation, updated);
    return updated;
  },
  async count() {
    let n = 0;
    for (const s of starsStore.values()) if (s.status === 'approved') n++;
    return n;
  },
  async list(options: ListStarsOptions = {}) {
    const { limit = 50, offset = 0, order = 'recent', status = 'approved' } = options;
    const all = Array.from(starsStore.values())
      .filter((s) => s.status === status)
      .sort((a, b) => {
        const cmp = a.namedAt.localeCompare(b.namedAt);
        return order === 'recent' ? -cmp : cmp;
      });
    return all.slice(offset, offset + limit);
  },
  async all() {
    return Array.from(starsStore.values());
  },
  async countByStatus() {
    const counts: Record<ModerationStatus, number> = { pending: 0, approved: 0, rejected: 0 };
    for (const s of starsStore.values()) counts[s.status]++;
    return counts;
  },
};

// ============================================================================
// Wishes
// ============================================================================

const memWishStore: WishStore = {
  async add(wish) {
    sweepStalePending(wishesStore);
    if (wish.status === 'pending' && countPending(wishesStore) >= PENDING_CAPS.wishes) {
      throw new PendingQueueFullError('wish');
    }
    wishesStore.set(wish.id, wish);
    return wish;
  },
  async get(id) {
    return wishesStore.get(id);
  },
  async setStatus(id, status) {
    const w = wishesStore.get(id);
    if (!w) return null;
    if (status === 'rejected') {
      wishesStore.delete(id);
      logRejection('wish', `"${w.text.slice(0, 60)}"${w.from ? ` - ${w.from}` : ''}`);
      return { ...w, status };
    }
    const updated: Wish = { ...w, status };
    wishesStore.set(id, updated);
    return updated;
  },
  async list(options: ListWishesOptions = {}) {
    const { limit = 100, offset = 0, status = 'approved' } = options;
    const all = Array.from(wishesStore.values())
      .filter((w) => w.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all.slice(offset, offset + limit);
  },
  async countByStatus() {
    const counts: Record<ModerationStatus, number> = { pending: 0, approved: 0, rejected: 0 };
    for (const w of wishesStore.values()) counts[w.status]++;
    return counts;
  },
};

// ============================================================================
// Coloring submissions
// ============================================================================

const memColoringStore: ColoringStore = {
  async add(input: ColoringSubmissionInput) {
    sweepStalePending(coloringStore);
    if (input.status === 'pending' && countPending(coloringStore) >= PENDING_CAPS.coloring) {
      throw new PendingQueueFullError('coloring');
    }
    // Memory backend serves images as inline data URLs. Fine for dev,
    // bad idea for prod (use the Supabase backend there).
    const dataUrl = `data:${input.image.mimeType};base64,${input.image.bytes.toString('base64')}`;
    const submission: ColoringSubmission = {
      id: input.id,
      artistName: input.artistName,
      age: input.age,
      imageDataUrl: dataUrl,
      width: input.image.width,
      height: input.image.height,
      createdAt: input.createdAt,
      status: input.status,
    };
    coloringStore.set(submission.id, submission);
    return submission;
  },
  async get(id) {
    return coloringStore.get(id);
  },
  async setStatus(id, status) {
    const s = coloringStore.get(id);
    if (!s) return null;
    if (status === 'rejected') {
      coloringStore.delete(id);
      logRejection('coloring', `${s.id} - ${s.artistName}`);
      return { ...s, status };
    }
    const updated: ColoringSubmission = { ...s, status };
    coloringStore.set(id, updated);
    return updated;
  },
  async list(options: ListColoringOptions = {}) {
    const { limit = 60, offset = 0, status = 'approved' } = options;
    const all = Array.from(coloringStore.values())
      .filter((s) => s.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all.slice(offset, offset + limit);
  },
  async countByStatus() {
    const counts: Record<ModerationStatus, number> = { pending: 0, approved: 0, rejected: 0 };
    for (const s of coloringStore.values()) counts[s.status]++;
    return counts;
  },
};

// ============================================================================
// Charity nominations
// ============================================================================

const memNominationStore: CharityNominationStore = {
  async add(nomination) {
    sweepStalePending(nominationsStore);
    if (nomination.status === 'pending' && countPending(nominationsStore) >= PENDING_CAPS.nominations) {
      throw new PendingQueueFullError('nomination');
    }
    nominationsStore.set(nomination.id, nomination);
    return nomination;
  },
  async get(id) {
    return nominationsStore.get(id);
  },
  async setStatus(id, status) {
    const n = nominationsStore.get(id);
    if (!n) return null;
    if (status === 'rejected') {
      nominationsStore.delete(id);
      logRejection('nomination', `${n.charityName}${n.nominatedBy ? ` - ${n.nominatedBy}` : ''}`);
      return { ...n, status };
    }
    const updated: CharityNomination = { ...n, status };
    nominationsStore.set(id, updated);
    return updated;
  },
  async list(options: ListNominationsOptions = {}) {
    const { limit = 60, offset = 0, status = 'approved' } = options;
    const all = Array.from(nominationsStore.values())
      .filter((n) => n.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all.slice(offset, offset + limit);
  },
  async countByStatus() {
    const counts: Record<ModerationStatus, number> = { pending: 0, approved: 0, rejected: 0 };
    for (const n of nominationsStore.values()) counts[n.status]++;
    return counts;
  },
};

export const memoryBundle: StorageBundle = {
  stars: memStarStore,
  wishes: memWishStore,
  coloring: memColoringStore,
  nominations: memNominationStore,
  async listRecentRejections(limit = 50) {
    return rejectionLog.slice(-limit).reverse();
  },
};
