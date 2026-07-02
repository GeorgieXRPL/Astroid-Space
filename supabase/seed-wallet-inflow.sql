-- ---------------------------------------------------------------------------
-- Seed verified cumulative inflow for the charity-bound wallets.
--
-- Run this in Supabase Dashboard -> SQL Editor AFTER `schema.sql`.
-- Reconciled against a full on-chain signature scan on 2026-07-01:
--   5JYdcUmRXNYxGKNpS3iBSZWJGkP2m7r5nqUqKfBLfsJB  legacy St. Jude (ALSAC) - swept onward
--   69gzuYrbVxZptyXnjcP2AxXVHKy4fW9wAbKF3U7nvit7  St. Jude via donate.gg  - swept onward
--   8RjUHoN576v9tuVnyY7y73kASBCAHVwrF9WuJWVfsDN6  Liv's Stargrace (10%)
--
-- These are the lifetime totals *received* by each wallet (the honest
-- "donations to date" figure), independent of funds later swept out. The
-- server uses each row as a checkpoint: on every hourly refresh it only asks
-- the Solana RPC for signatures newer than `last_signature`, then adds any
-- new positive credits on top of `lamports`. `peak_lamports` is the
-- high-water mark so the headline never drops after a sweep.
--
-- The migration below (ALTER TABLE) is idempotent, so this file is safe to run
-- on an older database that predates the peak_lamports column.
-- ---------------------------------------------------------------------------

ALTER TABLE public.wallet_inflow_cache
  ADD COLUMN IF NOT EXISTS peak_lamports BIGINT NOT NULL DEFAULT 0;

INSERT INTO public.wallet_inflow_cache (
  address,
  lamports,
  tx_count,
  last_signature,
  peak_lamports,
  updated_at
)
VALUES
  (
    '5JYdcUmRXNYxGKNpS3iBSZWJGkP2m7r5nqUqKfBLfsJB',
    66937225814,
    201,
    '2pJNFtHpbxWXJcnA2W7WtBuFc2EFRSMz2TkZFnbkXWYG3qSNyUfVhPnDJbawN2XaSk171FyDeoMmJjvHZV9y1vvR',
    66937225814,
    now()
  ),
  (
    '69gzuYrbVxZptyXnjcP2AxXVHKy4fW9wAbKF3U7nvit7',
    16670625412,
    160,
    '5L4JmHWunEzQNZ7xSEVqB4JeZmKJX8CAJsRF1GQdjCTzqjthN93mWrd1eJ62ytFN3T1TRw6EsdKYEVDigTs6LNCB',
    16670625412,
    now()
  ),
  (
    '8RjUHoN576v9tuVnyY7y73kASBCAHVwrF9WuJWVfsDN6',
    3766412761,
    9,
    '12DdWMx59o5PAJsogEHJeCva3SsadJBU8mwr2jten6awZV4X9ojjmxxRP5YxCTEWvXeKm2pxbB9RFAqNbYexeaJ',
    3766412761,
    now()
  )
ON CONFLICT (address) DO UPDATE SET
  -- lamports + last_signature must stay a matched pair (the total AS OF that
  -- checkpoint), so set them together. If the live cache had already scanned
  -- past this snapshot, the next refresh re-scans from here and re-adds the
  -- newer credits - no double count.
  lamports = EXCLUDED.lamports,
  tx_count = EXCLUDED.tx_count,
  last_signature = EXCLUDED.last_signature,
  -- Display-only high-water mark: never lower it on re-run.
  peak_lamports = GREATEST(public.wallet_inflow_cache.peak_lamports, EXCLUDED.peak_lamports),
  updated_at = EXCLUDED.updated_at;
