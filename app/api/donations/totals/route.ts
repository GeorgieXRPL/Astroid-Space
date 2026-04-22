/**
 * @fileoverview GET /api/donations/totals
 * Returns the live SOL balance of each configured charity wallet.
 *
 * Cached for 30s to avoid hammering the public RPC.
 */

import { NextResponse } from 'next/server';
import { getCharityWallets, fetchBalances } from '../../../lib/donations';

export const revalidate = 30; // seconds

export async function GET() {
  const wallets = getCharityWallets();

  if (wallets.length === 0) {
    return NextResponse.json({
      configured: false,
      wallets: [],
      totalSol: 0,
      message:
        'No charity wallets configured. Set NEXT_PUBLIC_CHARITY_WALLET in .env.local.',
    });
  }

  const balances = await fetchBalances(wallets);
  const totalSol = balances.reduce((sum, b) => sum + b.sol, 0);

  return NextResponse.json({
    configured: true,
    wallets: balances,
    totalSol,
    fetchedAt: new Date().toISOString(),
  });
}
