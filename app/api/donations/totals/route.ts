/**
 * @fileoverview GET /api/donations/totals
 *
 * Returns the multi-wallet readings used by `/charity` and the home-page
 * StatsBar. For wallets whose `displayMetric === 'cumulative-inflow'`
 * the response includes lifetime inflow numbers in addition to the live
 * balance. See `app/lib/donations.ts` for the shape.
 *
 * Cached at the Next.js layer for 30s. The expensive (cumulative-inflow)
 * path also has its own hourly cache in Supabase, so the per-request
 * cost stays close to one `getBalance` call per wallet plus a single
 * cache row read.
 */

import { NextResponse } from 'next/server';
import {
  getCharityWallets,
  fetchBalances,
  totalCharityLamports,
  donationLamports,
} from '../../../lib/donations';

export const revalidate = 30; // seconds

export async function GET() {
  const wallets = getCharityWallets();

  // The "primary" charity wallet is always present in the registry as a
  // pending-or-active card. "Configured" here means we have at least one
  // *known* address to actually fetch.
  const hasAnyAddress = wallets.some((w) => !!w.address);
  if (!hasAnyAddress) {
    return NextResponse.json({
      configured: false,
      wallets: [],
      totalCharitySol: 0,
      totalCharityLamports: 0,
      message:
        'No charity wallets configured. Set NEXT_PUBLIC_CHARITY_WALLET in .env.local to the donate.gg-controlled intake address.',
    });
  }

  const readings = await fetchBalances(wallets);
  const totalLamports = totalCharityLamports(readings);

  return NextResponse.json({
    configured: true,
    wallets: readings.map((r) => ({
      kind: r.kind,
      status: r.status,
      label: r.label,
      description: r.description,
      address: r.address,
      splitPercent: r.splitPercent,
      displayMetric: r.displayMetric,
      retiredAt: r.retiredAt ?? null,
      lamports: r.lamports,
      sol: r.sol,
      usdcUnits: r.usdcUnits,
      usdc: r.usdc,
      // Inflow fields are sent unconditionally as `null` when not used,
      // so the client can branch on the presence of a number cleanly.
      inflowLamports: r.inflowLamports ?? null,
      inflowSol: r.inflowSol ?? null,
      txCount: r.txCount ?? null,
      lastSignature: r.lastSignature ?? null,
      staleAsOf: r.staleAsOf ?? null,
      // Convenience: the number the UI should headline for this card.
      donationLamports: donationLamports(r),
      donationSol: donationLamports(r) / 1e9,
    })),
    /** Sum across all charity-bound wallets (legacy + primary + secondary). */
    totalCharitySol: totalLamports / 1e9,
    totalCharityLamports: totalLamports,
    fetchedAt: new Date().toISOString(),
  });
}
