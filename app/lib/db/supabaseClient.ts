/**
 * @fileoverview Supabase client singleton (server-side, secret key).
 *
 * We only ever talk to Supabase from server code. The secret key
 * (newer naming for what Supabase used to call "service_role") bypasses
 * RLS, which is exactly what we want - every read/write goes through
 * validated route handlers, and we'd rather not have a public RLS
 * surface to maintain.
 *
 * Either format works: the legacy JWT (`eyJhbGc...`) and the newer
 * `sb_secret_...` strings both authenticate as the same role.
 *
 * This module throws on import if `SUPABASE_URL` and
 * `SUPABASE_SERVICE_ROLE_KEY` aren't set. That's fine - `pickBundle()`
 * in `app/lib/storage.ts` only loads this module when the user has
 * opted into the Supabase backend via `STORAGE_BACKEND=supabase`.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'STORAGE_BACKEND=supabase is set but SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY are missing.'
    );
  }
  cached = createClient(url, key, {
    auth: {
      // Server-side only - no auto session, no persistence needed.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}

/** Bucket name used for coloring submission images. */
export const COLORING_BUCKET = 'coloring';
