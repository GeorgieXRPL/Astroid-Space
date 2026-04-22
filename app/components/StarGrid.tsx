'use client';

import { useEffect, useState } from 'react';
import { StarCard } from './StarCard';

interface PublicNamedStar {
  designation: string;
  name: string;
  dedication?: string;
  namedBy?: string;
  namedAt: string;
}

export function StarGrid() {
  const [items, setItems] = useState<PublicNamedStar[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('/api/stars?limit=100')
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <div className="glass-panel p-16 text-center text-white/40">
        Loading the sky…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-panel p-16 text-center">
        <div className="text-6xl mb-4 opacity-50">✦</div>
        <h3 className="font-display text-2xl text-white mb-2">No stars named yet</h3>
        <p className="text-white/50 max-w-md mx-auto">
          The sky is wide open. Be the first to plant a name out here.
        </p>
        <a href="/name-a-star" className="btn-primary mt-6 inline-flex">
          Name the first star
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-baseline justify-between">
        <div className="text-sm text-white/50">
          Showing <span className="text-white font-mono">{items.length}</span> of{' '}
          <span className="text-white font-mono">{total}</span> named stars
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((named) => (
          <StarCard key={named.designation} named={named} />
        ))}
      </div>
    </>
  );
}
