'use client';

import dynamic from 'next/dynamic';

/**
 * Dynamically loaded star map wrapper.
 * Three.js + react-three-fiber must be client-side only.
 */
export const HeroScene = dynamic(
  () => import('./scene/StarMap').then((m) => m.StarMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-space-950">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cosmos border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-xs font-mono text-cosmos/70 tracking-widest uppercase">
            Mapping the sky
          </div>
        </div>
      </div>
    ),
  }
);
