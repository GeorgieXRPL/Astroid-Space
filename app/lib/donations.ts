/**
 * @fileoverview Donation tracking helpers (multi-wallet, kind-aware).
 *
 * Reads on-chain data for the configured charity wallets using a public
 * Solana RPC endpoint. No private keys, no custody. Server-side only.
 *
 * Two display metrics:
 *
 *   - `balance`           - the current live balance, in lamports. Right
 *                           for wallets that *accumulate* funds (e.g. a
 *                           frozen legacy wallet, a holding-tank wallet
 *                           waiting for a recipient).
 *
 *   - `cumulative-inflow` - the lifetime sum of credits to the wallet,
 *                           regardless of whether the wallet has since
 *                           been swept. Right for *pass-through* wallets
 *                           like the donate.gg-controlled intake address
 *                           that receives 25% of pump.fun creator fees,
 *                           hops them onward, converts to USDC, and
 *                           forwards to St. Jude. The on-chain inflow
 *                           is the honest "donations to date" number
 *                           because live balance drops to zero after
 *                           every sweep.
 *
 * The cumulative-inflow path is cached in Supabase so we only ask the
 * RPC for *new* signatures since the last checkpoint. See
 * `wallet_inflow_cache` in `supabase/schema.sql`.
 */

import {
  Connection,
  PublicKey,
  type ConfirmedSignatureInfo,
} from '@solana/web3.js';
import { supabase } from './db/supabaseClient';

const ASTROID_TOKEN_MINT = '8NwtzwGm4CV8Hm4fJXR69ac1MxDYuSaN3A9HVyikpump';
const ASTROID_DEFAULT_LEGACY_CHARITY_WALLET =
  '5JYdcUmRXNYxGKNpS3iBSZWJGkP2m7r5nqUqKfBLfsJB';
const ASTROID_DEFAULT_PRIMARY_CHARITY_WALLET =
  '69gzuYrbVxZptyXnjcP2AxXVHKy4fW9wAbKF3U7nvit7';
const ASTROID_DEFAULT_SECONDARY_CHARITY_WALLET =
  '8RjUHoN576v9tuVnyY7y73kASBCAHVwrF9WuJWVfsDN6';

/**
 * Verified cumulative SOL credits for the charity-bound wallets, reconciled
 * against a full on-chain signature scan on 2026-07-01. These are the lifetime
 * totals *received* by each wallet - the honest "donations to date" figure -
 * regardless of funds later swept onward (the legacy and St. Jude intakes have
 * both been largely drained; their live balances are near zero).
 *
 * Used as a floor when a cold historical scan is rate-limited; the Supabase
 * incremental cache takes over and keeps climbing once configured.
 */
const ASTROID_VERIFIED_INFLOWS: Record<
  string,
  { lamports: number; txCount: number; lastSignature: string }
> = {
  [ASTROID_DEFAULT_LEGACY_CHARITY_WALLET]: {
    lamports: 66_937_225_814, // 66.937225814 SOL across 201 fee deposits (since swept onward)
    txCount: 201,
    lastSignature:
      '2pJNFtHpbxWXJcnA2W7WtBuFc2EFRSMz2TkZFnbkXWYG3qSNyUfVhPnDJbawN2XaSk171FyDeoMmJjvHZV9y1vvR',
  },
  [ASTROID_DEFAULT_PRIMARY_CHARITY_WALLET]: {
    lamports: 16_670_625_412, // 16.670625412 SOL across 160 fee-claim deposits
    txCount: 160,
    lastSignature:
      '5L4JmHWunEzQNZ7xSEVqB4JeZmKJX8CAJsRF1GQdjCTzqjthN93mWrd1eJ62ytFN3T1TRw6EsdKYEVDigTs6LNCB',
  },
  [ASTROID_DEFAULT_SECONDARY_CHARITY_WALLET]: {
    lamports: 3_766_412_761, // 3.766412761 SOL across 9 fee-claim deposits
    txCount: 9,
    lastSignature:
      '12DdWMx59o5PAJsogEHJeCva3SsadJBU8mwr2jten6awZV4X9ojjmxxRP5YxCTEWvXeKm2pxbB9RFAqNbYexeaJ',
  },
};
const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDC_DECIMALS = 6;
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const SPL_TOKEN_AMOUNT_OFFSET = 64;
const SPL_TOKEN_AMOUNT_LENGTH = 8;

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type WalletKind =
  | 'legacy'             // frozen pre-switch wallet, balance preserved
  | 'charity-primary'    // active 25% donate.gg-routed charity wallet
  | 'charity-secondary'  // 10% Liv's Stargrace Foundation wallet
  | 'community';         // 65% community/operations wallet (off by default)

export type WalletStatus =
  | 'active'             // currently receiving funds
  | 'frozen'             // receives nothing, balance preserved as record
  | 'pending';           // address known but recipient not yet confirmed

export type DisplayMetric = 'balance' | 'cumulative-inflow';

export interface CharityWallet {
  /** Discriminator used by the UI to group / style cards. */
  kind: WalletKind;
  /** Lifecycle status used to drive the "Live" / "Frozen" / "Pending" pill. */
  status: WalletStatus;
  /** Short human label, e.g. "St. Jude (via donate.gg)". */
  label: string;
  /** Long-form copy used as the body of the wallet card. */
  description: string;
  /** Solana address. Null if reserved but not yet known. */
  address: string | null;
  /** 25 | 10 | 65 | 0 (legacy). Used in the wallet card and split copy. */
  splitPercent: number;
  /**
   * Which number to surface as that wallet's "donation total".
   * See file header for why this matters.
   */
  displayMetric: DisplayMetric;
  /** ISO date the wallet stopped accepting new fees, if applicable. */
  retiredAt?: string;
}

export interface WalletReading {
  kind: WalletKind;
  status: WalletStatus;
  label: string;
  description: string;
  address: string | null;
  splitPercent: number;
  displayMetric: DisplayMetric;
  retiredAt?: string;

  /** Current on-chain balance in lamports (0 if address is null/unfetchable). */
  lamports: number;
  /** Same value, in SOL. */
  sol: number;
  /** Current USDC token balance, in base units (0 if none/unfetchable). */
  usdcUnits: number;
  /** Same value, in USDC. */
  usdc: number;

  /**
   * Persisted high-water mark, in lamports - the largest donation total ever
   * observed for this wallet. Set for every charity-bound wallet (i.e. not the
   * community/operations wallet) so the headline can't visibly reset after a
   * sweep/drain. Folded into `donationLamports()`.
   */
  peakLamports?: number;

  // Only set when displayMetric === 'cumulative-inflow':
  /** Lifetime credits to this wallet, in lamports. */
  inflowLamports?: number;
  /** Same, in SOL. */
  inflowSol?: number;
  /** Number of distinct credit transactions counted into the total. */
  txCount?: number;
  /** Most recent signature observed when the cache was last refreshed. */
  lastSignature?: string | null;
  /** ISO timestamp; only set when the data was served stale (RPC failure). */
  staleAsOf?: string;
}

// ----------------------------------------------------------------------------
// RPC helpers
// ----------------------------------------------------------------------------

/**
 * Public mainnet RPC. Kept only as a last-resort fallback - it aggressively
 * rate-limits (HTTP 429) and is not viable for the historical signature scan.
 */
const PUBLIC_RPC_FALLBACK = 'https://api.mainnet-beta.solana.com';

/**
 * Ordered list of RPC endpoints to try, best first.
 *
 *   NEXT_PUBLIC_SOLANA_RPC_URL - primary endpoint (existing var).
 *   SOLANA_RPC_URLS            - optional comma-separated fallbacks. Server-only
 *                                (no NEXT_PUBLIC prefix) so a keyed Helius /
 *                                QuickNode / Alchemy URL never ships to the
 *                                browser.
 *
 * The public RPC is always appended last so the site still functions with no
 * configuration, just without reliable historical scans.
 */
function getRpcEndpoints(): string[] {
  const endpoints: string[] = [];

  const primary = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  if (primary) endpoints.push(primary);

  const fallbacks = process.env.SOLANA_RPC_URLS?.trim();
  if (fallbacks) {
    for (const url of fallbacks.split(',')) {
      const trimmed = url.trim();
      if (trimmed) endpoints.push(trimmed);
    }
  }

  endpoints.push(PUBLIC_RPC_FALLBACK);

  // De-dupe while preserving order.
  return [...new Set(endpoints)];
}

let cachedConnections: Connection[] | null = null;

/** All configured connections, in preference order. Memoised per process. */
function getConnections(): Connection[] {
  if (!cachedConnections) {
    cachedConnections = getRpcEndpoints().map(
      (url) => new Connection(url, 'confirmed')
    );
  }
  return cachedConnections;
}

/**
 * Run an RPC call against each configured endpoint in turn, returning the
 * first success. Only throws if *every* endpoint fails. This is what keeps a
 * rate-limited primary RPC from blanking the live ledger or stalling the
 * historical inflow scan.
 */
async function withRpcFailover<T>(
  fn: (connection: Connection) => Promise<T>
): Promise<T> {
  const connections = getConnections();
  let lastError: unknown = new Error('No Solana RPC endpoints configured');

  for (const connection of connections) {
    try {
      return await fn(connection);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('All Solana RPC endpoints failed');
}

function usdcAssociatedTokenAddress(owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      new PublicKey(TOKEN_PROGRAM_ID).toBuffer(),
      new PublicKey(USDC_MINT).toBuffer(),
    ],
    new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
  )[0];
}

function readSplTokenUnits(data: Buffer): number {
  if (data.length < SPL_TOKEN_AMOUNT_OFFSET + SPL_TOKEN_AMOUNT_LENGTH) return 0;
  return Number(data.readBigUInt64LE(SPL_TOKEN_AMOUNT_OFFSET));
}

async function fetchWalletAccountBalances(
  connection: Connection,
  addresses: string[]
): Promise<Map<string, { lamports: number; usdcUnits: number }>> {
  const result = new Map<string, { lamports: number; usdcUnits: number }>();
  const pubkeys = addresses.map((address) => new PublicKey(address));
  const usdcAtas = pubkeys.map(usdcAssociatedTokenAddress);

  const accounts = await connection.getMultipleAccountsInfo([...pubkeys, ...usdcAtas]);
  pubkeys.forEach((pubkey, index) => {
    const address = pubkey.toBase58();
    const walletAccount = accounts[index];
    const usdcAccount = accounts[index + pubkeys.length];
    const usdcUnits = usdcAccount ? readSplTokenUnits(usdcAccount.data) : 0;
    result.set(address, {
      lamports: walletAccount?.lamports ?? 0,
      usdcUnits,
    });
  });

  return result;
}

/** Quick base58 sanity check before we hand the string to PublicKey. */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/** Resolve an env var into a trimmed, validated address (or null). */
function readWalletEnv(name: string): string | null {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  if (!isValidSolanaAddress(raw)) {
    console.warn(`[donations] ${name} is not a valid Solana address; ignoring.`);
    return null;
  }
  return raw;
}

// ----------------------------------------------------------------------------
// Wallet registry
// ----------------------------------------------------------------------------

/**
 * Returns the configured wallet list, in display order.
 *
 * Wallets whose address isn't set still appear in the list as a "pending"
 * card so the routing structure is visible even before every address is
 * filled in. Filtering for "wallets we actually have an address for" is
 * the caller's job.
 */
export function getCharityWallets(): CharityWallet[] {
  const isAstroidMint =
    process.env.NEXT_PUBLIC_TOKEN_MINT?.trim() === ASTROID_TOKEN_MINT;
  const astroidDefaults = isAstroidMint
    ? {
        primary: ASTROID_DEFAULT_PRIMARY_CHARITY_WALLET,
        secondary: ASTROID_DEFAULT_SECONDARY_CHARITY_WALLET,
      }
    : null;

  const legacy = readWalletEnv('NEXT_PUBLIC_CHARITY_WALLET_LEGACY');
  const primary =
    readWalletEnv('NEXT_PUBLIC_CHARITY_WALLET') ?? astroidDefaults?.primary ?? null;
  const secondary =
    readWalletEnv('NEXT_PUBLIC_CHARITY_WALLET_SECONDARY') ??
    astroidDefaults?.secondary ??
    null;
  const community = readWalletEnv('NEXT_PUBLIC_COMMUNITY_WALLET');

  const wallets: CharityWallet[] = [];

  // Legacy ALSAC-provided wallet. No new fees route here (retired after the
  // donate.gg switch), but it is NOT a static accumulator: the funds it
  // received were forwarded on to charity, so its live balance is near zero.
  // Display metric is therefore `cumulative-inflow` - the lifetime sum of
  // credits it ever received - which is the honest record of donations from
  // that earlier era. Showing the residual balance would drastically
  // under-report what actually flowed through it.
  //
  // Optional - only shown if the env var is set. Many deployments will
  // never have a legacy wallet at all.
  if (legacy) {
    wallets.push({
      kind: 'legacy',
      status: 'frozen',
      label: 'St. Jude (legacy ALSAC wallet)',
      description:
        'The original wallet that received 25% of pump.fun creator fees before the switch to donate.gg. No new fees route here now, and the funds it received were forwarded on to charity - so its live balance is near zero. The number shown is the lifetime total routed through it, preserved on-chain as a permanent record of donations from that earlier era.',
      address: legacy,
      splitPercent: 0,
      displayMetric: 'cumulative-inflow',
    });
  }

  // Active primary - donate.gg intake routed to St. Jude.
  // Always present as a card; "pending recipient" if address is unset.
  wallets.push({
    kind: 'charity-primary',
    status: primary ? 'active' : 'pending',
    label: 'St. Jude (via donate.gg)',
    description:
      "Receives 25% of pump.fun creator fees at fee-claim time. Routed by donate.gg, an arms-length service for crypto donations to verified 501(c)(3) charities, on to St. Jude Children's Research Hospital (EIN 62-0646012). The project never custody-holds the funds.",
    address: primary,
    splitPercent: 25,
    displayMetric: 'cumulative-inflow',
  });

  // Liv's Stargrace Foundation (10%).
  //
  // Display metric is `cumulative-inflow`, not `balance`: this is a
  // pass-through wallet - The Giving Block sweeps the SOL onward and converts
  // it for the foundation, so the live balance drops toward zero after each
  // sweep. The honest "donated to date" number is the lifetime sum of credits
  // to the wallet, which survives every sweep. (Same treatment as the St. Jude
  // intake above.)
  wallets.push({
    kind: 'charity-secondary',
    status: secondary ? 'active' : 'pending',
    label: 'Liv\u2019s Stargrace Foundation (10%)',
    description:
      "Receives 10% of pump.fun creator fees at fee-claim time. Routed to Liv's Stargrace Foundation (EIN 42-2375208), a 501(c)(3) honoring Liv Perrotto's legacy - supporting families facing pediatric cancer, inspiring children through space exploration, and providing opportunities for Christian education. Donations are delivered via The Giving Block.",
    address: secondary,
    splitPercent: 10,
    displayMetric: 'cumulative-inflow',
  });

  // Community / operations wallet - kept off the public ledger by default.
  // Only surfaced if explicitly opted in via the env var, so it doesn't
  // clutter `/charity`.
  if (community) {
    wallets.push({
      kind: 'community',
      status: 'active',
      label: 'Community & operations (65%)',
      description:
        'Funds project operations and community-voted activities. Shown here for transparency. This is operational, not charitable - included so the full 100% is visible end-to-end.',
      address: community,
      splitPercent: 65,
      displayMetric: 'balance',
    });
  }

  return wallets;
}

// ----------------------------------------------------------------------------
// Cumulative inflow tracker
// ----------------------------------------------------------------------------

/** How long a cached inflow reading is considered fresh. */
const INFLOW_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const INFLOW_RPC_BATCH_SIZE = 8;
const INFLOW_RPC_BATCH_DELAY_MS = 350;
const INFLOW_RPC_BATCH_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAstroidDeployment(): boolean {
  return process.env.NEXT_PUBLIC_TOKEN_MINT?.trim() === ASTROID_TOKEN_MINT;
}

/** Verified on-chain deposit floor for a known Astroid charity wallet. */
function getVerifiedInflowFloor(address: string): InflowReading | null {
  if (!isAstroidDeployment()) return null;
  const verified = ASTROID_VERIFIED_INFLOWS[address];
  if (!verified) return null;
  return {
    lamports: verified.lamports,
    txCount: verified.txCount,
    lastSignature: verified.lastSignature,
  };
}

/** Prefer the higher of a live scan and the verified Solscan floor. */
function mergeInflowWithFloor(
  scanned: InflowReading,
  floor: InflowReading | null
): InflowReading {
  if (!floor) return scanned;

  const lamports = Math.max(scanned.lamports, floor.lamports);
  const txCount = Math.max(scanned.txCount, floor.txCount);
  const usedFloor = scanned.lamports < floor.lamports;

  return {
    lamports,
    txCount,
    lastSignature: scanned.lastSignature ?? floor.lastSignature,
    staleAsOf: usedFloor ? new Date().toISOString() : scanned.staleAsOf,
  };
}

interface CacheRow {
  address: string;
  lamports: number;
  tx_count: number;
  last_signature: string | null;
  updated_at: string;
}

/** Returns the supabase client only if Supabase env vars are configured. */
function trySupabase(): ReturnType<typeof supabase> | null {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    return supabase();
  } catch {
    return null;
  }
}

async function readCacheRow(address: string): Promise<CacheRow | null> {
  const sb = trySupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('wallet_inflow_cache')
    .select('address, lamports, tx_count, last_signature, updated_at')
    .eq('address', address)
    .maybeSingle();

  if (error) {
    console.warn(`[donations] cache read failed for ${address}:`, error.message);
    return null;
  }
  return (data as CacheRow | null) ?? null;
}

async function writeCacheRow(row: CacheRow): Promise<void> {
  const sb = trySupabase();
  if (!sb) return;

  const { error } = await sb.from('wallet_inflow_cache').upsert(
    {
      address: row.address,
      lamports: row.lamports,
      tx_count: row.tx_count,
      last_signature: row.last_signature,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'address' }
  );
  if (error) {
    console.warn(`[donations] cache write failed for ${row.address}:`, error.message);
  }
}

/**
 * Persisted high-water mark.
 *
 * Records the largest donation total ever observed for a wallet so the
 * headline never drops after a pass-through wallet is swept/drained, even if
 * a later inflow scan is incomplete or the RPC is unavailable. The candidate
 * is the max of the cumulative-inflow scan, the verified floor, and the
 * current live balance - every one of which is a valid *lower bound* of true
 * lifetime inflow (you can't hold more than was ever credited), so this only
 * guards against visible resets and never overcounts.
 *
 * Persistence lives in `wallet_inflow_cache.peak_lamports`. Without Supabase
 * there's no cross-request memory to fall back on, so we return the candidate
 * unchanged. Fully defensive: any error (e.g. the column hasn't been migrated
 * yet) degrades silently to prior behaviour.
 */
async function applyPeakFloor(
  address: string,
  candidateLamports: number
): Promise<number> {
  const sb = trySupabase();
  if (!sb) return candidateLamports;

  try {
    const { data, error } = await sb
      .from('wallet_inflow_cache')
      .select('peak_lamports')
      .eq('address', address)
      .maybeSingle();
    if (error) return candidateLamports;

    if (data) {
      const storedPeak = Number(
        (data as { peak_lamports?: number | null }).peak_lamports ?? 0
      );
      if (candidateLamports > storedPeak) {
        // Bump the mark. Deliberately a plain UPDATE so we don't touch the
        // cumulative columns or `updated_at` (which gates the inflow scan).
        await sb
          .from('wallet_inflow_cache')
          .update({ peak_lamports: candidateLamports })
          .eq('address', address);
        return candidateLamports;
      }
      return Math.max(storedPeak, candidateLamports);
    }

    // No row yet (the inflow scan hasn't created one - e.g. it failed on a
    // cold start). Create a peak-only placeholder with a stale `updated_at`
    // so the cumulative scan still runs on the next pass; a fresh timestamp
    // here would masquerade as a real checkpoint and stall scanning.
    await sb.from('wallet_inflow_cache').insert({
      address,
      lamports: 0,
      tx_count: 0,
      last_signature: null,
      peak_lamports: candidateLamports,
      updated_at: new Date(0).toISOString(),
    });
    return candidateLamports;
  } catch {
    return candidateLamports;
  }
}

/** Page back through signatures until we hit `until` or run out. */
async function fetchNewSignatures(
  connection: Connection,
  pubkey: PublicKey,
  until: string | null
): Promise<ConfirmedSignatureInfo[]> {
  // Hard cap: never fetch more than 5000 new signatures in a single refresh
  // pass. Everything else waits for the next hourly cycle. This is the
  // safety net against an empty cache + a wallet with a huge backlog.
  const HARD_CAP = 5000;
  const PAGE = 1000;
  const all: ConfirmedSignatureInfo[] = [];
  let before: string | undefined = undefined;

  while (all.length < HARD_CAP) {
    const opts: { limit: number; before?: string; until?: string } = {
      limit: PAGE,
    };
    if (before) opts.before = before;
    if (until) opts.until = until;

    const page = await connection.getSignaturesForAddress(pubkey, opts);
    if (page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE) break;
    before = page[page.length - 1].signature;
  }
  return all;
}

function creditLamportsFromTx(
  tx: NonNullable<Awaited<ReturnType<Connection['getTransaction']>>>,
  target: string
): number {
  const meta = tx.meta;
  if (!meta) return 0;

  let credited = 0;

  const staticKeys = tx.transaction.message
    .getAccountKeys({ accountKeysFromLookups: meta.loadedAddresses })
    .keySegments()
    .flat();
  const idx = staticKeys.findIndex((k) => k.toBase58() === target);
  if (idx >= 0) {
    const pre = meta.preBalances[idx];
    const post = meta.postBalances[idx];
    if (typeof pre === 'number' && typeof post === 'number') {
      const delta = post - pre;
      if (delta > 0) credited += delta;
    }
  }

  // Count wrapped-SOL deposits too (donate.gg sweeps often move WSOL onward).
  for (const postBalance of meta.postTokenBalances ?? []) {
    if (postBalance.mint !== WSOL_MINT || postBalance.owner !== target) continue;
    const preBalance = meta.preTokenBalances?.find(
      (row) => row.accountIndex === postBalance.accountIndex
    );
    const preAmount = BigInt(preBalance?.uiTokenAmount?.amount ?? '0');
    const postAmount = BigInt(postBalance.uiTokenAmount?.amount ?? '0');
    const delta = postAmount - preAmount;
    if (delta > 0n) credited += Number(delta);
  }

  return credited;
}

/**
 * Sum positive lamport deltas for `address` across the given transactions.
 * Fetches in modest batches; failures are skipped (best-effort).
 */
async function fetchTransactionsWithRetry(
  signatures: string[]
): Promise<(Awaited<ReturnType<Connection['getTransaction']>> | null)[]> {
  for (let attempt = 0; attempt < INFLOW_RPC_BATCH_RETRIES; attempt++) {
    try {
      return await withRpcFailover((connection) =>
        connection.getTransactions(signatures, {
          maxSupportedTransactionVersion: 0,
        })
      );
    } catch (err) {
      if (attempt === INFLOW_RPC_BATCH_RETRIES - 1) {
        console.warn(
          '[donations] batched getTransactions failed on all endpoints:',
          err
        );
      } else {
        await sleep(500 * (attempt + 1));
      }
    }
  }

  const settled = await Promise.allSettled(
    signatures.map((signature) =>
      withRpcFailover((connection) =>
        connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        })
      )
    )
  );
  return settled.map((r) => (r.status === 'fulfilled' ? r.value : null));
}

async function sumInflowFromSignatures(
  pubkey: PublicKey,
  signatures: ConfirmedSignatureInfo[]
): Promise<{ lamports: number; counted: number }> {
  let lamports = 0;
  let counted = 0;
  const target = pubkey.toBase58();

  for (let i = 0; i < signatures.length; i += INFLOW_RPC_BATCH_SIZE) {
    const chunk = signatures.slice(i, i + INFLOW_RPC_BATCH_SIZE);
    const sigs = chunk.map((s) => s.signature);
    const txs = await fetchTransactionsWithRetry(sigs);

    for (const tx of txs) {
      if (!tx) continue;
      const credited = creditLamportsFromTx(tx, target);
      if (credited > 0) {
        lamports += credited;
        counted += 1;
      }
    }

    if (i + INFLOW_RPC_BATCH_SIZE < signatures.length) {
      await sleep(INFLOW_RPC_BATCH_DELAY_MS);
    }
  }

  return { lamports, counted };
}

type InflowReading = {
  lamports: number;
  txCount: number;
  lastSignature: string | null;
  staleAsOf?: string;
};

/** Seed the Supabase checkpoint from a verified Solscan floor. */
async function seedCacheFromFloor(
  address: string,
  floor: InflowReading
): Promise<void> {
  await writeCacheRow({
    address,
    lamports: floor.lamports,
    tx_count: floor.txCount,
    last_signature: floor.lastSignature,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Cumulative on-chain inflow for an address.
 *
 * Reads the supabase cache, fetches only signatures newer than the cached
 * checkpoint, sums positive lamport deltas for our address, writes the new
 * total back. On RPC failure, returns the cached value with `staleAsOf`
 * set so the UI can surface the stale state.
 */
export async function fetchCumulativeInflow(address: string): Promise<InflowReading> {
  const floor = getVerifiedInflowFloor(address);

  // Without Supabase, never block on a cold full-history RPC scan (that can
  // take minutes and exceeds serverless timeouts). Serve the verified floor.
  if (!trySupabase()) {
    if (floor) return floor;
    return { lamports: 0, txCount: 0, lastSignature: null };
  }

  const cached = await readCacheRow(address);

  // Bootstrap the incremental cache from the verified floor so refreshes only
  // scan signatures newer than the checkpoint, not the full history.
  if (!cached && floor) {
    await seedCacheFromFloor(address, floor);
    return floor;
  }
  const now = Date.now();
  const lastUpdate = cached ? Date.parse(cached.updated_at) : 0;
  const isFresh = cached && now - lastUpdate < INFLOW_CACHE_TTL_MS;

  // Cache is fresh - serve as-is, no RPC.
  if (cached && isFresh) {
    return {
      lamports: cached.lamports,
      txCount: cached.tx_count,
      lastSignature: cached.last_signature,
    };
  }

  // Need a refresh. Pull new signatures and add to the running total.
  try {
    const pubkey = new PublicKey(address);
    const newSigs = await withRpcFailover((connection) =>
      fetchNewSignatures(connection, pubkey, cached?.last_signature ?? null)
    );

    if (newSigs.length === 0) {
      // No new activity. Just touch the cache so we don't re-poll for an hour.
      const fresh: CacheRow = {
        address,
        lamports: cached?.lamports ?? 0,
        tx_count: cached?.tx_count ?? 0,
        last_signature: cached?.last_signature ?? null,
        updated_at: new Date().toISOString(),
      };
      await writeCacheRow(fresh);
      return {
        lamports: fresh.lamports,
        txCount: fresh.tx_count,
        lastSignature: fresh.last_signature,
      };
    }

    const { lamports: addedLamports, counted } = await sumInflowFromSignatures(
      pubkey,
      newSigs
    );

    const merged: CacheRow = {
      address,
      lamports: (cached?.lamports ?? 0) + addedLamports,
      tx_count: (cached?.tx_count ?? 0) + counted,
      last_signature: newSigs[0].signature, // most recent (page is newest-first)
      updated_at: new Date().toISOString(),
    };
    await writeCacheRow(merged);
    return {
      lamports: merged.lamports,
      txCount: merged.tx_count,
      lastSignature: merged.last_signature,
    };
  } catch (err) {
    console.warn(`[donations] inflow refresh failed for ${address}:`, err);
    if (cached) {
      return mergeInflowWithFloor(
        {
          lamports: cached.lamports,
          txCount: cached.tx_count,
          lastSignature: cached.last_signature,
          staleAsOf: cached.updated_at,
        },
        floor
      );
    }
    if (floor) return floor;
    return { lamports: 0, txCount: 0, lastSignature: null };
  }
}

// ----------------------------------------------------------------------------
// Reading multiple wallets at once
// ----------------------------------------------------------------------------

/** Empty zeroed reading for a wallet whose address isn't set. */
function emptyReading(w: CharityWallet): WalletReading {
  return {
    kind: w.kind,
    status: w.status,
    label: w.label,
    description: w.description,
    address: w.address,
    splitPercent: w.splitPercent,
    displayMetric: w.displayMetric,
    retiredAt: w.retiredAt,
    lamports: 0,
    sol: 0,
    usdcUnits: 0,
    usdc: 0,
    ...(w.displayMetric === 'cumulative-inflow'
      ? { inflowLamports: 0, inflowSol: 0, txCount: 0, lastSignature: null }
      : {}),
  };
}

/**
 * Build the full reading list for the UI: live balance for every known
 * address, plus cumulative inflow for wallets that need it.
 */
export async function fetchBalances(
  wallets: CharityWallet[]
): Promise<WalletReading[]> {
  const knownAddresses = wallets
    .map((w) => w.address)
    .filter((address): address is string => !!address);
  let accountBalances = new Map<string, { lamports: number; usdcUnits: number }>();

  try {
    accountBalances = await withRpcFailover((connection) =>
      fetchWalletAccountBalances(connection, knownAddresses)
    );
  } catch (err) {
    console.warn(
      '[donations] batched balance fetch failed on all RPC endpoints:',
      err
    );
    throw err;
  }

  return Promise.all(
    wallets.map(async (w): Promise<WalletReading> => {
      if (!w.address) return emptyReading(w);

      // Live balance, every wallet, every time.
      const balances = accountBalances.get(w.address) ?? {
        lamports: 0,
        usdcUnits: 0,
      };
      const lamports = balances.lamports;
      const usdcUnits = balances.usdcUnits;

      const reading: WalletReading = {
        kind: w.kind,
        status: w.status,
        label: w.label,
        description: w.description,
        address: w.address,
        splitPercent: w.splitPercent,
        displayMetric: w.displayMetric,
        retiredAt: w.retiredAt,
        lamports,
        sol: lamports / 1e9,
        usdcUnits,
        usdc: usdcUnits / 10 ** USDC_DECIMALS,
      };

      // Cumulative inflow on top, only where we actually use it.
      if (w.displayMetric === 'cumulative-inflow') {
        const inflow = mergeInflowWithFloor(
          await fetchCumulativeInflow(w.address),
          getVerifiedInflowFloor(w.address)
        );
        reading.inflowLamports = inflow.lamports;
        reading.inflowSol = inflow.lamports / 1e9;
        reading.txCount = inflow.txCount;
        reading.lastSignature = inflow.lastSignature;
        if (inflow.staleAsOf) reading.staleAsOf = inflow.staleAsOf;
      }

      // High-water mark, for every charity-bound wallet (not community/ops,
      // which legitimately spends down and should show live holdings).
      //
      // The candidate is the max of every trustworthy lower bound we have:
      // the scanned/cached cumulative inflow (when applicable), the verified
      // Solscan floor, and the live balance (a wallet can't hold more than
      // was ever credited). Persisting the peak means the headline never
      // resets after a sweep/drain, even if a later scan is incomplete or
      // the RPC is down. Degrades to the candidate when Supabase isn't set.
      if (w.kind !== 'community') {
        const verifiedFloor = getVerifiedInflowFloor(w.address)?.lamports ?? 0;
        const candidate = Math.max(
          reading.inflowLamports ?? 0,
          lamports,
          verifiedFloor
        );
        const peak = await applyPeakFloor(w.address, candidate);
        reading.peakLamports = peak;

        // Keep the cumulative-inflow headline in lock-step with the peak so
        // the per-wallet inflow copy and the donation total agree.
        if (w.displayMetric === 'cumulative-inflow') {
          reading.inflowLamports = peak;
          reading.inflowSol = peak / 1e9;
        }
      }

      return reading;
    })
  );
}

// ----------------------------------------------------------------------------
// Aggregation helpers used by the API and StatsBar
// ----------------------------------------------------------------------------

/** Lamports to display as "the donation total" for one wallet. */
export function donationLamports(r: WalletReading): number {
  const base =
    r.displayMetric === 'cumulative-inflow'
      ? Math.max(r.inflowLamports ?? 0, r.lamports)
      : r.lamports;
  // The persisted high-water mark guards charity-bound wallets against a
  // visible reset after a sweep/drain. It's never set for community/ops.
  return Math.max(base, r.peakLamports ?? 0);
}

/**
 * Total lamports routed to charity-bound wallets across the legacy + active
 * + secondary holding tank. The community wallet is excluded.
 */
export function totalCharityLamports(readings: WalletReading[]): number {
  return readings
    .filter((r) => r.kind !== 'community')
    .reduce((sum, r) => sum + donationLamports(r), 0);
}
