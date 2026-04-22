'use client';

import dynamic from 'next/dynamic';
import type { StarSpectrum } from '../lib/stars';

/**
 * Client-only wrapper for the StarOrb 3D scene. Three.js + react-three-fiber
 * must be loaded on the client only; this gives us a small SSR-safe
 * fallback while the scene boots.
 */
const StarOrbScene = dynamic(
  () => import('./scene/StarOrb').then((m) => m.StarOrb),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cosmos border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

interface Props {
  spectrum: StarSpectrum;
  emphasize?: boolean;
}

export function StarOrbPreview({ spectrum, emphasize }: Props) {
  return <StarOrbScene spectrum={spectrum} emphasize={emphasize} />;
}
