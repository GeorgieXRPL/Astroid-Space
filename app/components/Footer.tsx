import Link from 'next/link';
import { siteConfig } from '../lib/config';

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-space-950/80 backdrop-blur-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cosmos via-space-500 to-space-900 ring-1 ring-cosmos/40" />
              <span className="font-display text-base font-semibold text-white">Astroid</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cosmos/70">
                starlike
              </span>
            </div>
            <p className="text-sm text-white/50 max-w-md leading-relaxed">
              A charity-first project built around a kid&apos;s drawing. Every transaction
              helps fund real-world impact for children. No wallet required.
            </p>
          </div>

          <div>
            <div className="telemetry-label mb-3">Things to do</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/name-a-star" className="text-white/60 hover:text-white">
                  Name a star
                </Link>
              </li>
              <li>
                <Link href="/sky" className="text-white/60 hover:text-white">
                  Browse the sky
                </Link>
              </li>
              <li>
                <Link href="/wishes" className="text-white/60 hover:text-white">
                  Wish wall
                </Link>
              </li>
              <li>
                <Link href="/coloring" className="text-white/60 hover:text-white">
                  Color Astroid
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="telemetry-label mb-3">Mission</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-white/60 hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/charity" className="text-white/60 hover:text-white">
                  Charity wallet
                </Link>
              </li>
              <li>
                <Link href="/friends" className="text-white/60 hover:text-white">
                  Friends across the sky
                </Link>
              </li>
              <li>
                <a
                  href={siteConfig.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white"
                >
                  X (Twitter)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/40">
          <div>
            <span className="font-mono">© {new Date().getFullYear()} Astroid.</span>{' '}
            <span>Mascot drawn by Liv. All rights reserved.</span>
          </div>
          <div className="font-mono tracking-wider uppercase">
            Not financial advice · Naming a star is free
          </div>
        </div>
        <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-white/30 leading-relaxed max-w-3xl">
          Astroid is not affiliated with, endorsed by, or partnered with St. Jude
          Children&apos;s Research Hospital, ALSAC, or any other charity listed on this
          site. The recipient wallet on the{' '}
          <Link href="/charity" className="text-white/50 hover:text-white">
            Charity page
          </Link>{' '}
          was provided by ALSAC for on-chain donations. We do not solicit donations
          on behalf of any charity. No portion of the token&apos;s price or any user
          action constitutes a charitable contribution by the user.
        </div>
      </div>
    </footer>
  );
}
