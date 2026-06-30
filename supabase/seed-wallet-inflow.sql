-- ---------------------------------------------------------------------------
-- Seed verified cumulative inflow for pass-through charity wallets.
--
-- Run this in Supabase Dashboard → SQL Editor AFTER `schema.sql`.
-- Reconciled against Solscan on 2026-06-12 for:
--   69gzuYrbVxZptyXnjcP2AxXVHKy4fW9wAbKF3U7nvit7 (St. Jude via donate.gg)
--
-- The server uses this row as a checkpoint. On each hourly refresh it only
-- asks the Solana RPC for signatures newer than `last_signature`, then adds
-- any new positive credits on top of `lamports`.
-- ---------------------------------------------------------------------------

INSERT INTO public.wallet_inflow_cache (
  address,
  lamports,
  tx_count,
  last_signature,
  peak_lamports,
  updated_at
)
VALUES (
  '69gzuYrbVxZptyXnjcP2AxXVHKy4fW9wAbKF3U7nvit7',
  10979729221,
  97,
  '5kjbZ4btUE1gssL7pYnjf3tPhy55cSDV14VvwtaM2T8ZSmxZKnHe9o2yruXM2pkioToczbJUYPKkr8zhNUPM1hAd',
  10979729221,
  now()
)
ON CONFLICT (address) DO UPDATE SET
  lamports = EXCLUDED.lamports,
  tx_count = EXCLUDED.tx_count,
  last_signature = EXCLUDED.last_signature,
  -- Never lower the high-water mark on re-run.
  peak_lamports = GREATEST(public.wallet_inflow_cache.peak_lamports, EXCLUDED.peak_lamports),
  updated_at = EXCLUDED.updated_at;
