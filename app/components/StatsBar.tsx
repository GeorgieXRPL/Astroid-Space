'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalStars: number;
  named: number;
  available: number;
  namedPercent: number;
  wishesApproved: number;
  coloringApproved: number;
}

interface DonationTotals {
  configured: boolean;
  totalSol: number;
}

export function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [donations, setDonations] = useState<DonationTotals | null>(null);

  useEffect(() => {
    const loadStats = () =>
      fetch('/api/stats')
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    const loadDonations = () =>
      fetch('/api/donations/totals')
        .then((r) => r.json())
        .then(setDonations)
        .catch(() => {});

    loadStats();
    loadDonations();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden">
      <Stat
        label="Stars Named"
        value={stats ? stats.named.toLocaleString() : '-'}
        sub={stats ? `of ${stats.totalStars.toLocaleString()}` : ''}
      />
      <Stat
        label="Available"
        value={stats ? stats.available.toLocaleString() : '-'}
        sub={stats ? `${stats.namedPercent}% claimed` : ''}
      />
      <Stat
        label="Donated to Charity"
        value={
          donations?.configured
            ? `${donations.totalSol.toFixed(4)} SOL`
            : 'Pending setup'
        }
        sub={donations?.configured ? 'live on-chain' : 'configure wallet'}
        accent={donations?.configured}
      />
      <Stat
        label="Wishes & Drawings"
        value={
          stats
            ? `${stats.wishesApproved + stats.coloringApproved}`
            : '-'
        }
        sub={
          stats
            ? `${stats.wishesApproved} wishes · ${stats.coloringApproved} drawings`
            : ''
        }
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-space-950/60 px-4 py-5 sm:px-6 sm:py-6">
      <div className="telemetry-label">{label}</div>
      <div
        className={`telemetry-value text-2xl sm:text-3xl mt-1 ${
          accent ? 'text-cosmos' : 'text-white'
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-white/40 font-mono mt-1">{sub}</div>}
    </div>
  );
}
