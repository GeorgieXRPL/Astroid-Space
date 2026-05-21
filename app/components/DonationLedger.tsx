'use client';

import { useEffect, useState } from 'react';
import { solscanAddress, shortAddress } from '../lib/config';

type WalletKind =
  | 'legacy'
  | 'charity-primary'
  | 'charity-secondary'
  | 'community';

type WalletStatus = 'active' | 'frozen' | 'pending';

type DisplayMetric = 'balance' | 'cumulative-inflow';

interface WalletReading {
  kind: WalletKind;
  status: WalletStatus;
  label: string;
  description: string;
  address: string | null;
  splitPercent: number;
  displayMetric: DisplayMetric;
  retiredAt: string | null;
  lamports: number;
  sol: number;
  usdcUnits: number;
  usdc: number;
  inflowLamports: number | null;
  inflowSol: number | null;
  txCount: number | null;
  lastSignature: string | null;
  staleAsOf: string | null;
  donationLamports: number;
  donationSol: number;
}

interface DonationData {
  configured: boolean;
  wallets: WalletReading[];
  totalCharitySol: number;
  totalCharityLamports: number;
  message?: string;
  fetchedAt?: string;
}

export function DonationLedger() {
  const [data, setData] = useState<DonationData | null>(null);

  useEffect(() => {
    const fetchData = () =>
      fetch('/api/donations/totals')
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="glass-panel p-12 text-center text-white/40">
        Loading on-chain balances&hellip;
      </div>
    );
  }

  if (!data.configured) {
    return (
      <div className="glass-panel p-10">
        <div className="eyebrow text-ember mb-2">Setup required</div>
        <h3 className="font-display text-xl text-white mb-2">
          Charity wallet not yet configured
        </h3>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          Set <code className="font-mono text-cosmos">NEXT_PUBLIC_CHARITY_WALLET</code>{' '}
          in your <code className="font-mono text-cosmos">.env.local</code> with
          the donate.gg-controlled intake address (the one that auto-routes
          25% of pump.fun creator fees to St. Jude). Optionally set
          <code className="font-mono text-cosmos"> NEXT_PUBLIC_CHARITY_WALLET_LEGACY</code>{' '}
          to keep the original ALSAC wallet&apos;s historical balance visible.
          Once set, this page shows live, on-chain numbers pulled from the
          public RPC.
        </p>
        <p className="text-white/40 text-xs font-mono">{data.message}</p>
      </div>
    );
  }

  return (
    <>
      {/* ==================== BIG TOTAL ==================== */}
      <div className="glass-panel-bright p-10 text-center mb-8">
        <div className="eyebrow mb-3">
          <span className="live-dot mr-2" />
          Total routed to charity &middot; legacy + current
        </div>
        <div className="font-display text-5xl sm:text-7xl font-bold text-white tracking-tight tabular">
          {data.totalCharitySol.toFixed(4)}{' '}
          <span className="text-cosmos">SOL</span>
        </div>
        <div className="mt-3 text-sm text-white/50 max-w-md mx-auto leading-relaxed">
          Combined across the original ALSAC wallet (frozen, record-only) and
          the active donate.gg-routed St. Jude intake.
        </div>
        {data.fetchedAt && (
          <div className="mt-2 text-xs font-mono text-white/30 tabular">
            Last fetched: {new Date(data.fetchedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* ==================== PER-WALLET BREAKDOWN ==================== */}
      <div className="space-y-4">
        {data.wallets.map((w) => (
          <WalletCard key={`${w.kind}-${w.address ?? 'pending'}`} w={w} />
        ))}
      </div>
    </>
  );
}

function WalletCard({ w }: { w: WalletReading }) {
  const isInflow = w.displayMetric === 'cumulative-inflow';
  const headlineSol = w.address ? w.donationSol : null;
  const liveBalanceSol = w.sol;
  const usdcBalance = w.usdc ?? 0;
  const showUsdcBalance =
    w.address && (usdcBalance > 0 || w.kind === 'charity-secondary');

  return (
    <div className="glass-panel p-6">
      {/* Header row: label + status pill / split % */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-display text-lg text-white">{w.label}</span>
            <StatusPill status={w.status} />
            {w.splitPercent > 0 && (
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/50">
                {w.splitPercent}%
              </span>
            )}
          </div>
          {w.address ? (
            <a
              href={solscanAddress(w.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-cosmos hover:text-white"
            >
              {shortAddress(w.address, 8)} &#8599;
            </a>
          ) : (
            <span className="text-xs font-mono text-white/40">
              address pending
            </span>
          )}
        </div>

        {/* Headline number */}
        <div className="text-right shrink-0">
          <div className="font-display text-2xl text-white tabular">
            {headlineSol === null ? 'Pending' : headlineSol.toFixed(4)}
          </div>
          <div className="text-xs font-mono text-white/40">
            {headlineSol === null ? 'wallet' : 'SOL'}
          </div>
          {showUsdcBalance && (
            <div className="mt-1 text-xs font-mono text-cosmos/80 tabular">
              {usdcBalance.toFixed(6)} USDC
            </div>
          )}
        </div>
      </div>

      {/* Description copy */}
      <p className="text-sm text-white/60 leading-relaxed mb-3">
        {w.description}
      </p>

      {/* Inflow extras: tx count, sweep-aware sub-line, stale-cache notice */}
      {isInflow && w.address && (
        <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-white/5">
          <div className="text-[11px] font-mono text-white/40 tracking-wider">
            {typeof w.txCount === 'number' && w.txCount > 0 ? (
              <>
                across {w.txCount.toLocaleString()} on-chain credit
                {w.txCount === 1 ? '' : 's'}
              </>
            ) : (
              <>no on-chain credits yet</>
            )}
          </div>
          {/* For pass-through wallets, the live balance can be very different
              from the cumulative inflow because donate.gg sweeps funds
              onward. Show it as a sub-line so the difference is legible. */}
          {w.status === 'active' && (
            <div className="text-[11px] font-mono text-white/30 tracking-wider">
              live balance {liveBalanceSol.toFixed(4)} SOL
            </div>
          )}
          {w.staleAsOf && (
            <div className="text-[11px] font-mono text-ember/70 tracking-wider">
              cached &middot; as of{' '}
              {new Date(w.staleAsOf).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: WalletStatus }) {
  const styles: Record<
    WalletStatus,
    { label: string; cls: string; dot: string }
  > = {
    active: {
      label: 'Live',
      cls: 'border-cosmos/40 bg-cosmos/5 text-cosmos',
      dot: 'bg-cosmos animate-pulse',
    },
    frozen: {
      label: 'Frozen \u00b7 record only',
      cls: 'border-white/15 bg-white/5 text-white/60',
      dot: 'bg-white/40',
    },
    pending: {
      label: 'Pending recipient',
      cls: 'border-ember/30 bg-ember/5 text-ember/90',
      dot: 'bg-ember/70',
    },
  };
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${s.cls} text-[10px] font-mono uppercase tracking-[0.16em]`}
    >
      <span aria-hidden className={`w-1 h-1 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
