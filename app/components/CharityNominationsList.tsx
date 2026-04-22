'use client';

import { useEffect, useState } from 'react';
import { safeHref } from '../lib/safeHref';

interface Nomination {
  id: string;
  charityName: string;
  country?: string;
  charityUrl?: string;
  reason?: string;
  nominatedBy?: string;
  createdAt: string;
}

export function CharityNominationsList() {
  const [items, setItems] = useState<Nomination[] | null>(null);

  useEffect(() => {
    fetch('/api/charity-nominations?limit=60')
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <div className="glass-panel p-8 text-center text-white/40 text-sm">
        Loading nominations…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-panel p-8 text-center">
        <div className="text-3xl mb-2 opacity-40">✦</div>
        <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
          No community nominations approved yet. If there&apos;s a children&apos;s
          charity you love, suggest them above. We&apos;ll review and reach out
          for written consent before any wallet is wired up - confirmed
          charities are added to a recurring on-chain split from the 75%
          project wallet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((n) => (
        <NominationCard key={n.id} nom={n} />
      ))}
    </div>
  );
}

function NominationCard({ nom }: { nom: Nomination }) {
  const date = new Date(nom.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const safeUrl = safeHref(nom.charityUrl);
  const Title = safeUrl ? (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      className="font-display text-lg text-white hover:text-cosmos transition-colors"
    >
      {nom.charityName}
      <span className="ml-1 text-cosmos/70">↗</span>
    </a>
  ) : (
    <div className="font-display text-lg text-white">{nom.charityName}</div>
  );

  return (
    <div className="glass-panel p-5 flex flex-col gap-2 hover:border-cosmos/30 transition-colors">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 flex-1">{Title}</div>
        <span className="font-mono text-[10px] text-white/30 tracking-widest uppercase shrink-0">
          Nominated
        </span>
      </div>
      {nom.country && (
        <div className="text-xs font-mono text-white/40">{nom.country}</div>
      )}
      {nom.reason && (
        <p className="text-sm text-white/70 leading-relaxed mt-1">{nom.reason}</p>
      )}
      <div className="text-xs text-white/40 font-mono mt-auto pt-2 border-t border-white/5">
        - {nom.nominatedBy || 'A friend of Astroid'} · {date}
      </div>
    </div>
  );
}
