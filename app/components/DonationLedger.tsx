'use client';

import { useEffect, useState } from 'react';
import { siteConfig, solscanAddress, shortAddress } from '../lib/config';

interface WalletBalance {
  address: string;
  label: string;
  source: string;
  lamports: number;
  sol: number;
}

interface DonationData {
  configured: boolean;
  wallets: WalletBalance[];
  totalSol: number;
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
        Loading on-chain balances…
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
          Set <code className="font-mono text-cosmos">NEXT_PUBLIC_CHARITY_WALLET</code> in
          your <code className="font-mono text-cosmos">.env.local</code> with the public
          Solana address that will receive 25% of pump.fun creator fees. Once set, this
          page will show live, on-chain balances pulled from the public RPC.
        </p>
        <p className="text-white/40 text-xs font-mono">{data.message}</p>
      </div>
    );
  }

  return (
    <>
      {/* Big total */}
      <div className="glass-panel-bright p-10 text-center mb-8">
        <div className="eyebrow mb-3">
          <span className="live-dot mr-2" />
          Live on-chain · refreshes every 30s
        </div>
        <div className="font-display text-5xl sm:text-7xl font-bold text-white tracking-tight tabular">
          {data.totalSol.toFixed(4)} <span className="text-cosmos">SOL</span>
        </div>
        <div className="mt-3 text-sm text-white/50">
          Combined balance across all charity-bound wallets, fetched directly from the
          Solana network.
        </div>
        {data.fetchedAt && (
          <div className="mt-2 text-xs font-mono text-white/30 tabular">
            Last fetched: {new Date(data.fetchedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Per-wallet breakdown */}
      <div className="space-y-3">
        {data.wallets.map((w) => (
          <div key={w.address} className="glass-panel p-5">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <div className="font-display text-lg text-white">{w.label}</div>
                <a
                  href={solscanAddress(w.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-cosmos hover:text-white"
                >
                  {shortAddress(w.address, 8)} ↗
                </a>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl text-white tabular">
                  {w.sol.toFixed(4)}
                </div>
                <div className="text-xs font-mono text-white/40">SOL</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charity recipient */}
      {siteConfig.charityName && siteConfig.charityName !== 'Our charity partner' && (
        <div className="mt-8 glass-panel p-6">
          <div className="eyebrow mb-3">Recipient</div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-display text-xl text-white">{siteConfig.charityName}</div>
              {siteConfig.charityUrl && (
                <a
                  href={siteConfig.charityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cosmos hover:text-white"
                >
                  {siteConfig.charityUrl} ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
