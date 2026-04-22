/**
 * @fileoverview Donation tracking helpers.
 *
 * Reads on-chain balance for the configured charity wallet(s) using public
 * Solana RPC. No private keys, no custody. Server-side only.
 */

import { Connection, PublicKey } from '@solana/web3.js';

export interface CharityWallet {
  /** Display label */
  label: string;
  /** Source of funds */
  source: 'pumpfun-creator-25' | 'community';
  /** Solana address */
  address: string;
}

/** Read-only network helpers */
function getConnection(): Connection {
  const url =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  return new Connection(url, 'confirmed');
}

/**
 * Returns the configured charity wallets, in display order.
 * Filters out empty/unset values so the UI gracefully degrades.
 */
export function getCharityWallets(): CharityWallet[] {
  const wallets: CharityWallet[] = [];

  const charity = process.env.NEXT_PUBLIC_CHARITY_WALLET;
  if (charity) {
    wallets.push({
      label: '25% pump.fun creator fees',
      source: 'pumpfun-creator-25',
      address: charity,
    });
  }

  return wallets;
}

export interface WalletBalance {
  address: string;
  label: string;
  source: CharityWallet['source'];
  /** Lamports (1 SOL = 1e9 lamports) */
  lamports: number;
  /** SOL */
  sol: number;
  /** USD estimate, optional */
  usd?: number;
}

/**
 * Fetch SOL balance for a list of wallets.
 * Returns degraded results on failure rather than throwing.
 */
export async function fetchBalances(wallets: CharityWallet[]): Promise<WalletBalance[]> {
  const connection = getConnection();

  const results = await Promise.allSettled(
    wallets.map(async (wallet) => {
      const lamports = await connection.getBalance(new PublicKey(wallet.address));
      return {
        ...wallet,
        lamports,
        sol: lamports / 1e9,
      };
    })
  );

  return results
    .map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.warn(`[donations] Failed to fetch ${wallets[i].address}:`, r.reason);
      return {
        ...wallets[i],
        lamports: 0,
        sol: 0,
      };
    })
    .map(({ label, source, address, lamports, sol }) => ({
      label,
      source,
      address,
      lamports,
      sol,
    }));
}

/** Validate a Solana address string (cheap base58 check) */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}
