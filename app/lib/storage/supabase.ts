/**
 * @fileoverview Supabase storage backend.
 *
 * Mirrors the in-memory backend exactly - same store shapes, same
 * capacity caps, same TTL eviction. Differences:
 *
 *  - Persistent across deploys / cold starts.
 *  - Coloring images go to Supabase Storage (the `coloring` bucket)
 *    rather than living as inline data URLs in the database.
 *  - Rejection log is a real table you can query in the dashboard.
 *  - Pending sweep is opportunistic (runs before each insert) - for
 *    high traffic, schedule it as a Supabase cron job too.
 */

import type { NamedStar } from '../stars';
import { COLORING_BUCKET, supabase } from '../db/supabaseClient';
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

// ----------------------------------------------------------------------------
// Row mappers (DB columns are snake_case; our types are camelCase)
// ----------------------------------------------------------------------------

function rowToStar(row: any): NamedStar {
  return {
    designation: row.designation,
    name: row.name,
    dedication: row.dedication ?? undefined,
    namedBy: row.named_by ?? undefined,
    namedAt: row.named_at,
    claimToken: row.claim_token,
    status: row.status,
    suspicious: row.suspicious ?? false,
  };
}
function starToRow(s: NamedStar) {
  return {
    designation: s.designation,
    name: s.name,
    dedication: s.dedication ?? null,
    named_by: s.namedBy ?? null,
    named_at: s.namedAt,
    claim_token: s.claimToken,
    status: s.status,
    suspicious: !!s.suspicious,
  };
}

function rowToWish(row: any): Wish {
  return {
    id: row.id,
    text: row.text,
    from: row.from_name ?? undefined,
    createdAt: row.created_at,
    status: row.status,
  };
}
function wishToRow(w: Wish) {
  return {
    id: w.id,
    text: w.text,
    from_name: w.from ?? null,
    created_at: w.createdAt,
    status: w.status,
  };
}

function rowToColoring(row: any): ColoringSubmission {
  return {
    id: row.id,
    artistName: row.artist_name,
    age: row.age ?? undefined,
    imageDataUrl: row.image_url,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    createdAt: row.created_at,
    status: row.status,
  };
}

function rowToNomination(row: any): CharityNomination {
  return {
    id: row.id,
    charityName: row.charity_name,
    country: row.country ?? undefined,
    charityUrl: row.charity_url ?? undefined,
    reason: row.reason ?? undefined,
    nominatedBy: row.nominated_by ?? undefined,
    createdAt: row.created_at,
    status: row.status,
  };
}
function nominationToRow(n: CharityNomination) {
  return {
    id: n.id,
    charity_name: n.charityName,
    country: n.country ?? null,
    charity_url: n.charityUrl ?? null,
    reason: n.reason ?? null,
    nominated_by: n.nominatedBy ?? null,
    created_at: n.createdAt,
    status: n.status,
  };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

async function logRejection(kind: RejectionLogEntry['kind'], summary: string): Promise<void> {
  // Best-effort. A failed log shouldn't block the rejection itself.
  try {
    await supabase().from('rejection_log').insert({ kind, summary });
  } catch {
    // swallow
  }
}

/**
 * Sweep stale pending records of a given table. Runs opportunistically
 * before each insert. For higher traffic, schedule as a Supabase cron
 * job (Database → Cron Jobs) calling the same SQL.
 */
async function sweepStalePending(
  table: 'stars' | 'wishes' | 'coloring_submissions' | 'charity_nominations',
  tsColumn: 'named_at' | 'created_at'
): Promise<void> {
  const cutoff = new Date(Date.now() - PENDING_TTL_MS).toISOString();
  await supabase()
    .from(table)
    .delete()
    .eq('status', 'pending')
    .lt(tsColumn, cutoff);
}

async function countPending(
  table: 'stars' | 'wishes' | 'coloring_submissions' | 'charity_nominations'
): Promise<number> {
  const { count, error } = await supabase()
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) throw error;
  return count ?? 0;
}

async function countByStatus(
  table: 'stars' | 'wishes' | 'coloring_submissions' | 'charity_nominations'
): Promise<Record<ModerationStatus, number>> {
  const counts: Record<ModerationStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const status of Object.keys(counts) as ModerationStatus[]) {
    const { count, error } = await supabase()
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    if (error) throw error;
    counts[status] = count ?? 0;
  }
  return counts;
}

// ----------------------------------------------------------------------------
// Stars
// ----------------------------------------------------------------------------

const sbStarStore: NamedStarStore = {
  async has(designation) {
    const { data, error } = await supabase()
      .from('stars')
      .select('designation')
      .eq('designation', designation)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },
  async get(designation) {
    const { data, error } = await supabase()
      .from('stars')
      .select('*')
      .eq('designation', designation)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToStar(data) : undefined;
  },
  async name(record) {
    await sweepStalePending('stars', 'named_at');
    const exists = await this.has(record.designation);
    if (exists) return null;
    if (record.status === 'pending' && (await countPending('stars')) >= PENDING_CAPS.stars) {
      throw new PendingQueueFullError('star');
    }
    const { error } = await supabase().from('stars').insert(starToRow(record));
    if (error) {
      // Unique violation = race lost to another concurrent insert.
      if ((error as any).code === '23505') return null;
      throw error;
    }
    return record;
  },
  async setStatus(designation, status) {
    if (status === 'rejected') {
      const { data, error } = await supabase()
        .from('stars')
        .delete()
        .eq('designation', designation)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const star = rowToStar(data);
      await logRejection(
        'star',
        `${star.designation} → "${star.name}"${star.namedBy ? ` by ${star.namedBy}` : ''}`
      );
      return { ...star, status };
    }
    const { data, error } = await supabase()
      .from('stars')
      .update({ status })
      .eq('designation', designation)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? rowToStar(data) : null;
  },
  async count() {
    const { count, error } = await supabase()
      .from('stars')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    if (error) throw error;
    return count ?? 0;
  },
  async list(options: ListStarsOptions = {}) {
    const { limit = 50, offset = 0, order = 'recent', status = 'approved' } = options;
    const { data, error } = await supabase()
      .from('stars')
      .select('*')
      .eq('status', status)
      .order('named_at', { ascending: order !== 'recent' })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data ?? []).map(rowToStar);
  },
  async all() {
    // Used by /sky to compute the highlight set. There's a hard upper
    // bound on stars (200 designations exist) so this is bounded.
    const { data, error } = await supabase().from('stars').select('*');
    if (error) throw error;
    return (data ?? []).map(rowToStar);
  },
  async countByStatus() {
    return countByStatus('stars');
  },
};

// ----------------------------------------------------------------------------
// Wishes
// ----------------------------------------------------------------------------

const sbWishStore: WishStore = {
  async add(wish) {
    await sweepStalePending('wishes', 'created_at');
    if (wish.status === 'pending' && (await countPending('wishes')) >= PENDING_CAPS.wishes) {
      throw new PendingQueueFullError('wish');
    }
    const { error } = await supabase().from('wishes').insert(wishToRow(wish));
    if (error) throw error;
    return wish;
  },
  async get(id) {
    const { data, error } = await supabase().from('wishes').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToWish(data) : undefined;
  },
  async setStatus(id, status) {
    if (status === 'rejected') {
      const { data, error } = await supabase()
        .from('wishes')
        .delete()
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const wish = rowToWish(data);
      await logRejection('wish', `"${wish.text.slice(0, 60)}"${wish.from ? ` - ${wish.from}` : ''}`);
      return { ...wish, status };
    }
    const { data, error } = await supabase()
      .from('wishes')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? rowToWish(data) : null;
  },
  async list(options: ListWishesOptions = {}) {
    const { limit = 100, offset = 0, status = 'approved' } = options;
    const { data, error } = await supabase()
      .from('wishes')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data ?? []).map(rowToWish);
  },
  async countByStatus() {
    return countByStatus('wishes');
  },
};

// ----------------------------------------------------------------------------
// Coloring submissions
// ----------------------------------------------------------------------------

const sbColoringStore: ColoringStore = {
  async add(input: ColoringSubmissionInput) {
    await sweepStalePending('coloring_submissions', 'created_at');
    if (
      input.status === 'pending' &&
      (await countPending('coloring_submissions')) >= PENDING_CAPS.coloring
    ) {
      throw new PendingQueueFullError('coloring');
    }
    // Upload the processed image to the `coloring` bucket. Path includes
    // the id so we can clean it up on rejection. Webp only post-processing.
    const path = `pending/${input.id}.webp`;
    const upload = await supabase()
      .storage.from(COLORING_BUCKET)
      .upload(path, input.image.bytes, {
        contentType: input.image.mimeType,
        cacheControl: '3600',
        upsert: false,
      });
    if (upload.error) throw upload.error;

    const { data: publicUrlData } = supabase().storage.from(COLORING_BUCKET).getPublicUrl(path);
    const imageUrl = publicUrlData.publicUrl;

    const { error } = await supabase().from('coloring_submissions').insert({
      id: input.id,
      artist_name: input.artistName,
      age: input.age ?? null,
      image_url: imageUrl,
      width: input.image.width,
      height: input.image.height,
      storage_path: path,
      created_at: input.createdAt,
      status: input.status,
    });
    if (error) {
      // Insert failed - clean up the upload so we don't orphan it.
      await supabase().storage.from(COLORING_BUCKET).remove([path]).catch(() => {});
      throw error;
    }

    return {
      id: input.id,
      artistName: input.artistName,
      age: input.age,
      imageDataUrl: imageUrl,
      width: input.image.width,
      height: input.image.height,
      createdAt: input.createdAt,
      status: input.status,
    };
  },
  async get(id) {
    const { data, error } = await supabase()
      .from('coloring_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToColoring(data) : undefined;
  },
  async setStatus(id, status) {
    if (status === 'rejected') {
      const { data, error } = await supabase()
        .from('coloring_submissions')
        .delete()
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const submission = rowToColoring(data);
      // Best-effort image cleanup - if the storage delete fails, we
      // still log the rejection. The orphaned file can be swept later.
      if (data.storage_path) {
        await supabase()
          .storage.from(COLORING_BUCKET)
          .remove([data.storage_path])
          .catch(() => {});
      }
      await logRejection('coloring', `${submission.id} - ${submission.artistName}`);
      return { ...submission, status };
    }

    // Approved: move the file from `pending/` to `approved/` so the
    // bucket browser stays organised and retention policies can target
    // either prefix independently.
    const { data: existing } = await supabase()
      .from('coloring_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!existing) return null;

    let imageUrl = existing.image_url;
    let storagePath = existing.storage_path;
    if (status === 'approved' && existing.storage_path?.startsWith('pending/')) {
      const newPath = existing.storage_path.replace(/^pending\//, 'approved/');
      const move = await supabase().storage.from(COLORING_BUCKET).move(existing.storage_path, newPath);
      if (!move.error) {
        storagePath = newPath;
        imageUrl = supabase().storage.from(COLORING_BUCKET).getPublicUrl(newPath).data.publicUrl;
      }
    }

    const { data, error } = await supabase()
      .from('coloring_submissions')
      .update({ status, image_url: imageUrl, storage_path: storagePath })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? rowToColoring(data) : null;
  },
  async list(options: ListColoringOptions = {}) {
    const { limit = 60, offset = 0, status = 'approved' } = options;
    const { data, error } = await supabase()
      .from('coloring_submissions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data ?? []).map(rowToColoring);
  },
  async countByStatus() {
    return countByStatus('coloring_submissions');
  },
};

// ----------------------------------------------------------------------------
// Charity nominations
// ----------------------------------------------------------------------------

const sbNominationStore: CharityNominationStore = {
  async add(nomination) {
    await sweepStalePending('charity_nominations', 'created_at');
    if (
      nomination.status === 'pending' &&
      (await countPending('charity_nominations')) >= PENDING_CAPS.nominations
    ) {
      throw new PendingQueueFullError('nomination');
    }
    const { error } = await supabase().from('charity_nominations').insert(nominationToRow(nomination));
    if (error) throw error;
    return nomination;
  },
  async get(id) {
    const { data, error } = await supabase()
      .from('charity_nominations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToNomination(data) : undefined;
  },
  async setStatus(id, status) {
    if (status === 'rejected') {
      const { data, error } = await supabase()
        .from('charity_nominations')
        .delete()
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const nom = rowToNomination(data);
      await logRejection('nomination', `${nom.charityName}${nom.nominatedBy ? ` - ${nom.nominatedBy}` : ''}`);
      return { ...nom, status };
    }
    const { data, error } = await supabase()
      .from('charity_nominations')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? rowToNomination(data) : null;
  },
  async list(options: ListNominationsOptions = {}) {
    const { limit = 60, offset = 0, status = 'approved' } = options;
    const { data, error } = await supabase()
      .from('charity_nominations')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data ?? []).map(rowToNomination);
  },
  async countByStatus() {
    return countByStatus('charity_nominations');
  },
};

export const supabaseBundle: StorageBundle = {
  stars: sbStarStore,
  wishes: sbWishStore,
  coloring: sbColoringStore,
  nominations: sbNominationStore,
  async listRecentRejections(limit = 50) {
    const { data, error } = await supabase()
      .from('rejection_log')
      .select('kind, summary, rejected_at')
      .order('rejected_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      kind: row.kind,
      summary: row.summary,
      at: row.rejected_at,
    }));
  },
};
