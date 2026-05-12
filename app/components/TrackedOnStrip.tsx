import Image from 'next/image';
import { siteConfig } from '../lib/config';

/**
 * Compact horizontal strip of public-tracker badges (CoinGecko, BlockSpot).
 *
 * Used on the home page just under the contract banner ("here's the address,
 * and here's where you can verify and chart it independently"), and in the
 * footer above the legal disclaimer.
 *
 * Logos are vendor brand assets, kept in their as-shipped colours - the white
 * wordmark variants we ship work cleanly on Astroid's dark background. Each
 * badge links to that tracker's $ASTROID coin page if configured, otherwise
 * to the tracker's home page so the strip never has dead clicks.
 *
 * Variants:
 *
 *   - `panel`   - boxed inside a glass-panel, used on the home page so the
 *                 strip reads as its own row alongside the contract banner.
 *   - `inline`  - no surrounding panel, used inside the footer where it
 *                 sits flush above the legal disclaimer.
 */
type Variant = 'panel' | 'inline';

const TRACKERS = [
  {
    key: 'coingecko' as const,
    name: 'CoinGecko',
    href: siteConfig.listings.coingecko,
    src: '/listings/coingecko.png',
    width: 2000,
    height: 438,
    /** Display height in px on screen. Width auto-scales by aspect ratio. */
    displayHeightClass: 'h-7 sm:h-8',
  },
  {
    key: 'blockspot' as const,
    name: 'BlockSpot',
    href: siteConfig.listings.blockspot,
    src: '/listings/blockspot.png',
    width: 500,
    height: 150,
    displayHeightClass: 'h-7 sm:h-8',
  },
];

export function TrackedOnStrip({ variant = 'panel' }: { variant?: Variant }) {
  const inner = (
    <div className="flex flex-col items-center gap-3 sm:gap-4">
      <div className="telemetry-label">Tracked on</div>
      <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
        {TRACKERS.map((t) => (
          <li key={t.key}>
            <a
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View Astroid on ${t.name} (opens in a new tab)`}
              className="inline-flex items-center opacity-70 hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-cosmos/50 focus:ring-offset-2 focus:ring-offset-space-950 rounded"
            >
              <Image
                src={t.src}
                alt={`${t.name} logo`}
                width={t.width}
                height={t.height}
                className={`${t.displayHeightClass} w-auto`}
                unoptimized
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  if (variant === 'inline') {
    return <div className="py-4">{inner}</div>;
  }

  return (
    <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-2 pb-4">
      <div className="glass-panel p-5 sm:p-6">{inner}</div>
    </section>
  );
}
