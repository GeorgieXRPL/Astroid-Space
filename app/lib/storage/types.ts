/**
 * @fileoverview Shared types + constants for the storage layer.
 *
 * The public storage.ts module exports four "store" interfaces. Both
 * the in-memory and Supabase backends implement them so callers don't
 * care which one is active.
 */

import type { NamedStar } from '../stars';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Wish {
  id: string;
  text: string;
  /** Optional display name; falls back to "A friend of Astroid" client-side */
  from?: string;
  createdAt: string;
  status: ModerationStatus;
}

export interface ColoringSubmission {
  id: string;
  artistName: string;
  age?: number;
  /**
   * Either a `data:image/webp;base64,...` URL (memory backend) or an
   * `https://...supabase.co/storage/...` URL (supabase backend).
   * Both paint cleanly in `<img src>`.
   */
  imageDataUrl: string;
  width?: number;
  height?: number;
  createdAt: string;
  status: ModerationStatus;
}

export interface CharityNomination {
  id: string;
  charityName: string;
  country?: string;
  charityUrl?: string;
  reason?: string;
  nominatedBy?: string;
  createdAt: string;
  status: ModerationStatus;
}

/** Shape the route handler hands to coloringSubmissionStore.add(). */
export interface ColoringSubmissionInput {
  id: string;
  artistName: string;
  age?: number;
  /** Re-encoded image bytes from `processImageDataUrl()`. */
  image: {
    bytes: Buffer;
    mimeType: 'image/webp';
    width: number;
    height: number;
  };
  createdAt: string;
  status: ModerationStatus;
}

// ============================================================================
// Capacity / TTL constants (used by both backends)
// ============================================================================

export const PENDING_CAPS = {
  stars: 60,
  wishes: 200,
  coloring: 100,
  nominations: 60,
} as const;

export const PENDING_TTL_MS = 48 * 60 * 60 * 1000;

export class PendingQueueFullError extends Error {
  constructor(public kind: 'star' | 'wish' | 'coloring' | 'nomination') {
    super(`Pending ${kind} queue is full. Try again later.`);
    this.name = 'PendingQueueFullError';
  }
}

// ============================================================================
// Per-store options
// ============================================================================

export interface ListStarsOptions {
  limit?: number;
  offset?: number;
  order?: 'recent' | 'oldest';
  status?: ModerationStatus;
}

export interface ListWishesOptions {
  limit?: number;
  offset?: number;
  status?: ModerationStatus;
}

export interface ListColoringOptions {
  limit?: number;
  offset?: number;
  status?: ModerationStatus;
}

export interface ListNominationsOptions {
  limit?: number;
  offset?: number;
  status?: ModerationStatus;
}

// ============================================================================
// Store contracts
// ============================================================================

export interface NamedStarStore {
  has(designation: string): Promise<boolean>;
  get(designation: string): Promise<NamedStar | undefined>;
  name(record: NamedStar): Promise<NamedStar | null>;
  setStatus(designation: string, status: ModerationStatus): Promise<NamedStar | null>;
  count(): Promise<number>;
  list(options?: ListStarsOptions): Promise<NamedStar[]>;
  all(): Promise<NamedStar[]>;
  countByStatus(): Promise<Record<ModerationStatus, number>>;
}

export interface WishStore {
  add(wish: Wish): Promise<Wish>;
  get(id: string): Promise<Wish | undefined>;
  setStatus(id: string, status: ModerationStatus): Promise<Wish | null>;
  list(options?: ListWishesOptions): Promise<Wish[]>;
  countByStatus(): Promise<Record<ModerationStatus, number>>;
}

export interface ColoringStore {
  add(input: ColoringSubmissionInput): Promise<ColoringSubmission>;
  get(id: string): Promise<ColoringSubmission | undefined>;
  setStatus(id: string, status: ModerationStatus): Promise<ColoringSubmission | null>;
  list(options?: ListColoringOptions): Promise<ColoringSubmission[]>;
  countByStatus(): Promise<Record<ModerationStatus, number>>;
}

export interface CharityNominationStore {
  add(nomination: CharityNomination): Promise<CharityNomination>;
  get(id: string): Promise<CharityNomination | undefined>;
  setStatus(id: string, status: ModerationStatus): Promise<CharityNomination | null>;
  list(options?: ListNominationsOptions): Promise<CharityNomination[]>;
  countByStatus(): Promise<Record<ModerationStatus, number>>;
}

export interface RejectionLogEntry {
  kind: 'star' | 'wish' | 'coloring' | 'nomination';
  summary: string;
  at: string;
}

export interface StorageBundle {
  stars: NamedStarStore;
  wishes: WishStore;
  coloring: ColoringStore;
  nominations: CharityNominationStore;
  listRecentRejections(limit?: number): Promise<RejectionLogEntry[]>;
}
