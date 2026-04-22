'use client';

import { useEffect, useState } from 'react';

/**
 * Brief, gentle "you did it" overlay shown when arriving with ?just-named=1.
 * Auto-dismisses after a few seconds.
 */
export function NamingCelebration() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-20 z-40 flex justify-center pointer-events-none">
      <div className="glass-panel-bright px-6 py-3 flex items-center gap-3 shadow-2xl">
        <span className="text-cosmos text-xl">✦</span>
        <div>
          <div className="text-sm font-display font-semibold text-white">Star named</div>
          <div className="text-xs text-white/50 font-mono">
            Your star is now part of the sky
          </div>
        </div>
      </div>
    </div>
  );
}
