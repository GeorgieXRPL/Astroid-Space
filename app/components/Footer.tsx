import Link from 'next/link';
import { siteConfig } from '../lib/config';
import { TokenAddress } from './TokenAddress';
import { TrackedOnStrip } from './TrackedOnStrip';

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
              helps fund real-world impact for children.
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
              <li>
                <Link href="/games" className="text-white/60 hover:text-white">
                  Mini-games
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
                <Link href="/learn" className="text-white/60 hover:text-white">
                  Space School
                </Link>
              </li>
              <li>
                <Link href="/friends" className="text-white/60 hover:text-white">
                  Friends across the sky
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="text-white/60 hover:text-white">
                  Community guidelines
                </Link>
              </li>
              <li>
                <a
                  href={siteConfig.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white inline-flex items-center gap-1.5"
                >
                  <span>X (Twitter)</span>
                  <span aria-hidden className="text-white/30 text-[10px]">↗</span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.social.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white inline-flex items-center gap-1.5"
                >
                  <span>Telegram</span>
                  <span aria-hidden className="text-white/30 text-[10px]">↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ==================== CONTACT STRIP ==================== */}
        <div className="pt-6 mt-2 border-t border-white/5">
          <div className="telemetry-label mb-3">Get in touch</div>
          <div className="grid sm:grid-cols-3 gap-3 sm:gap-6">
            <a
              href={`mailto:${siteConfig.emails.hello}`}
              className="group block"
            >
              <div className="font-mono text-xs text-white/75 group-hover:text-white break-all">
                {siteConfig.emails.hello}
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                General, press &amp; partnerships
              </div>
            </a>
            <a
              href={`mailto:${siteConfig.emails.support}`}
              className="group block"
            >
              <div className="font-mono text-xs text-white/75 group-hover:text-white break-all">
                {siteConfig.emails.support}
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                Star naming &amp; coloring help
              </div>
            </a>
            <a
              href={`mailto:${siteConfig.emails.security}`}
              className="group block"
            >
              <div className="font-mono text-xs text-white/75 group-hover:text-white break-all">
                {siteConfig.emails.security}
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                Vulnerability reports &amp; abuse
              </div>
            </a>
          </div>
        </div>

        <TokenAddress />

        <div className="pt-6 mt-6 border-t border-white/5">
          <TrackedOnStrip variant="inline" />
        </div>

        <div className="pt-6 mt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/40">
          <div>
            <span className="font-mono">© {new Date().getFullYear()} Astroid.</span>{' '}
            <span>Mascot drawn by Liv. All rights reserved.</span>
          </div>
          <div className="font-mono tracking-wider uppercase">
            Not financial advice · Naming a star is free
          </div>
        </div>

        <div className="pt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-white/30 tracking-wider">
          <span className="opacity-60">Powered by</span>
          <span className="text-cosmos/70">Saltaire Protocol</span>
          <span className="opacity-50 italic">(coming soon)</span>
        </div>
        <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-white/30 leading-relaxed max-w-3xl space-y-2">
          <p>
            Astroid is not affiliated with, endorsed by, or partnered with St. Jude
            Children&apos;s Research Hospital, ALSAC, donate.gg, or any other
            organisation listed on this site. 25% of pump.fun creator fees auto-route
            at fee-claim time through donate.gg - an arms-length service for crypto
            donations to verified 501(c)(3) charities - on to St. Jude. See the{' '}
            <Link href="/charity" className="text-white/50 hover:text-white">
              Charity page
            </Link>{' '}
            for the live wallets, the legacy wallet kept visible as a permanent
            record, and the rest of the fee split. We do not solicit donations on
            behalf of any charity. No portion of the token&apos;s price or any user
            action constitutes a charitable contribution by the user.
          </p>
          <p>
            Anyone claiming Astroid is partnered with, sponsored by, or endorsed by
            St. Jude, ALSAC, or donate.gg is mistaken. Please see our{' '}
            <Link href="/guidelines" className="text-white/50 hover:text-white">
              community guidelines
            </Link>{' '}
            and report misleading claims to{' '}
            <a
              href={`mailto:${siteConfig.emails.security}?subject=Misleading%20partnership%20claim`}
              className="text-white/50 hover:text-white"
            >
              {siteConfig.emails.security}
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
