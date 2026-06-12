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
const ASTROID_DEFAULT_PRIMARY_CHARITY_WALLET =
  '69gzuYrbVxZptyXnjcP2AxXVHKy4fW9wAbKF3U7nvit7';
const ASTROID_DEFAULT_SECONDARY_CHARITY_WALLET =
  '3Zrt93Zvt5fLoRifjk3zC9n6boo53tKUdEs2DwC58E8C';
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
  | 'charity-secondary'  // 10% future-charity holding tank
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

function getConnection(): Connection {
  const url =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    'https://api.mainnet-beta.solana.com';
  return new Connection(url, 'confirmed');
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

  // Legacy ALSAC-provided wallet, frozen as a permanent record.
  // Optional - only shown if the env var is set. Many deployments will
  // never have a legacy wallet at all.
  //
  // Display metric is `balance` (not cumulative inflow): the wallet is
  // frozen with no outflows, so the live balance IS the historical
  // donation total - and it's a single cheap RPC call, instead of
  // paging hundreds of historical signatures (which times out on
  // Vercel's serverless function budget against the public RPC).
  if (legacy) {
    wallets.push({
      kind: 'legacy',
      status: 'frozen',
      label: 'St. Jude (legacy ALSAC wallet)',
      description:
        'The original wallet that received 25% of pump.fun creator fees before the switch to donate.gg. Frozen on-chain - no new fees route here, no sweeps out. The balance shown is the historical donation total, preserved on-chain as a permanent record.',
      address: legacy,
      splitPercent: 0,
      displayMetric: 'balance',
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

  // Future-charity holding tank.
  wallets.push({
    kind: 'charity-secondary',
    status: secondary ? 'pending' : 'pending',
    label: 'Liv\u2019s Stargrace Foundation (10%)',
    description:
      "Receives 10% of pump.fun creator fees at fee-claim time. Routed to Liv's Stargrace Foundation (EIN 42-2375208), a 501(c)(3) honoring Liv Perrotto's legacy - supporting families facing pediatric cancer, inspiring children through space exploration, and providing opportunities for Christian education. Donations are delivered via The Giving Block.",
    address: secondary,
    splitPercent: 10,
    displayMetric: 'balance',
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

/**
 * Sum positive lamport deltas for `address` across the given transactions.
 * Each tx is fetched individually; failures are skipped (best-effort).
 */
async function sumInflowFromSignatures(
  connection: Connection,
  pubkey: PublicKey,
  signatures: ConfirmedSignatureInfo[]
): Promise<{ lamports: number; counted: number }> {
  let lamports = 0;
  let counted = 0;
  const target = pubkey.toBase58();

  // Process in modest concurrency to be polite to the public RPC.
  const CONCURRENCY = 4;
  for (let i = 0; i < signatures.length; i += CONCURRENCY) {
    const chunk = signatures.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      chunk.map((s) =>
        connection.getTransaction(s.signature, {
          maxSupportedTransactionVersion: 0,
        })
      )
    );
    for (const r of settled) {
      if (r.status !== 'fulfilled' || !r.value) continue;
      const tx = r.value;
      const meta = tx.meta;
      if (!meta) continue;

      // Resolve account keys, including any from address-table lookups.
      const staticKeys = tx.transaction.message
        .getAccountKeys({ accountKeysFromLookups: meta.loadedAddresses })
        .keySegments()
        .flat();
      const idx = staticKeys.findIndex((k) => k.toBase58() === target);
      if (idx < 0) continue;

      const pre = meta.preBalances[idx];
      const post = meta.postBalances[idx];
      if (typeof pre !== 'number' || typeof post !== 'number') continue;
      const delta = post - pre;
      if (delta > 0) {
        lamports += delta;
        counted += 1;
      }
    }
  }

  return { lamports, counted };
}

/**
 * Cumulative on-chain inflow for an address.
 *
 * Reads the supabase cache, fetches only signatures newer than the cached
 * checkpoint, sums positive lamport deltas for our address, writes the new
 * total back. On RPC failure, returns the cached value with `staleAsOf`
 * set so the UI can surface the stale state.
 */
export async function fetchCumulativeInflow(
  address: string
): Promise<{
  lamports: number;
  txCount: number;
  lastSignature: string | null;
  staleAsOf?: string;
}> {
  const cached = await readCacheRow(address);
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
    const connection = getConnection();
    const pubkey = new PublicKey(address);
    const newSigs = await fetchNewSignatures(
      connection,
      pubkey,
      cached?.last_signature ?? null
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
      connection,
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
      return {
        lamports: cached.lamports,
        txCount: cached.tx_count,
        lastSignature: cached.last_signature,
        staleAsOf: cached.updated_at,
      };
    }
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
  const connection = getConnection();
  const knownAddresses = wallets
    .map((w) => w.address)
    .filter((address): address is string => !!address);
  let accountBalances = new Map<string, { lamports: number; usdcUnits: number }>();

  try {
    accountBalances = await fetchWalletAccountBalances(connection, knownAddresses);
  } catch (err) {
    console.warn('[donations] batched balance fetch failed:', err);
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
        if (trySupabase()) {
          const inflow = await fetchCumulativeInflow(w.address);
          reading.inflowLamports = inflow.lamports;
          reading.inflowSol = inflow.lamports / 1e9;
          reading.txCount = inflow.txCount;
          reading.lastSignature = inflow.lastSignature;
          if (inflow.staleAsOf) reading.staleAsOf = inflow.staleAsOf;
        } else {
          // Without the cache table, a cold cumulative scan can time out on
          // public RPC. Use the current balance as the honest lower bound.
          reading.inflowLamports = lamports;
          reading.inflowSol = lamports / 1e9;
          reading.txCount = 0;
          reading.lastSignature = null;
        }

        // Fallback: if the inflow cache lags behind a recent fee claim, show
        // the live balance as a floor rather than reporting a stale lower
        // cumulative total. The on-chain balance can never exceed historical
        // inflow for a recipient-only wallet, so this is a safe lower bound.
        if ((reading.inflowLamports ?? 0) < lamports) {
          reading.inflowLamports = lamports;
          reading.inflowSol = lamports / 1e9;
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
  if (r.displayMetric === 'cumulative-inflow') {
    return Math.max(r.inflowLamports ?? 0, r.lamports);
  }
  return r.lamports;
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
