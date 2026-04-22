import Link from 'next/link';
import { siteConfig } from '../lib/config';

export const metadata = {
  title: 'Community Guidelines',
  description:
    'How to talk about Astroid online without misrepresenting our charity flow or implying a partnership with St. Jude. Help us protect what we built for Liv.',
};

export default function GuidelinesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* ==================== HEADER ==================== */}
      <div className="text-center mb-12">
        <div className="eyebrow mb-3">For our community</div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
          Help us protect{' '}
          <span className="text-white/50">what we built for Liv.</span>
        </h1>
        <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
          Astroid was made FOR Liv, in honor of her strength. St. Jude was her
          chosen charity. ALSAC kindly provided a wallet for our 25% on-chain
          donation flow. That&apos;s the relationship - and it&apos;s a
          relationship we want to keep for years.
        </p>
      </div>

      {/* ==================== THE TRUTH ==================== */}
      <section className="glass-panel-bright p-6 sm:p-8 mb-8">
        <div className="eyebrow mb-3">The truth, in one paragraph</div>
        <p className="text-white/80 leading-relaxed">
          Astroid is <strong className="text-white">not</strong>{' '}
          partnered with, sponsored by, endorsed by, or affiliated with St. Jude
          Children&apos;s Research Hospital or ALSAC. ALSAC provided a public
          Solana wallet that receives our automated 25% pump.fun creator-fee
          donations. That is the entire scope of our interaction. Anyone who
          tells you otherwise - including screenshots of social-media likes
          framed as &ldquo;proof&rdquo; - is mistaken.
        </p>
      </section>

      {/* ==================== DO ==================== */}
      <section className="glass-panel p-6 sm:p-8 mb-6">
        <div className="flex items-baseline gap-3 mb-5">
          <span className="font-mono text-2xl text-cosmos">DO</span>
          <span className="telemetry-label">when posting about Astroid</span>
        </div>
        <ul className="space-y-3 text-white/75 leading-relaxed">
          <li className="flex gap-3">
            <span className="text-cosmos font-mono text-sm pt-0.5">+</span>
            <span>
              Tag <a href="https://x.com/Astroid_Sol" target="_blank" rel="noopener noreferrer" className="text-cosmos hover:text-white">@Astroid_Sol</a> and link to{' '}
              <Link href="/" className="text-cosmos hover:text-white">astroid.space</Link>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-cosmos font-mono text-sm pt-0.5">+</span>
            <span>
              Share the contract address and the live{' '}
              <Link href="/charity" className="text-cosmos hover:text-white">on-chain charity wallet</Link>{' '}
              so people can verify donations themselves
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-cosmos font-mono text-sm pt-0.5">+</span>
            <span>
              Tell Liv&apos;s story honestly: a kid drew the mascot, the
              community took her drawing and built this in honor of her
              strength, St. Jude was her chosen charity
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-cosmos font-mono text-sm pt-0.5">+</span>
            <span>
              Reply to misleading posts with this page so others see the
              boundary clearly
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-cosmos font-mono text-sm pt-0.5">+</span>
            <span>
              Donate directly to{' '}
              <a href="https://www.stjude.org" target="_blank" rel="noopener noreferrer" className="text-cosmos hover:text-white">stjude.org</a>{' '}
              if that&apos;s on your heart - that route is always open and
              entirely separate from the token
            </span>
          </li>
        </ul>
      </section>

      {/* ==================== DO NOT ==================== */}
      <section className="glass-panel p-6 sm:p-8 mb-6 border-ember/20">
        <div className="flex items-baseline gap-3 mb-5">
          <span className="font-mono text-2xl text-ember">DO NOT</span>
          <span className="telemetry-label">we&apos;re asking nicely</span>
        </div>
        <ul className="space-y-3 text-white/75 leading-relaxed">
          <li className="flex gap-3">
            <span className="text-ember font-mono text-sm pt-0.5">×</span>
            <span>
              Tag <strong className="text-white">@StJude</strong>{' '}
              on price, pump, moonshot, or trading posts. They are a
              children&apos;s hospital, not a degen ticker.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-ember font-mono text-sm pt-0.5">×</span>
            <span>
              Screenshot St. Jude or ALSAC staff likes, follows, or replies
              and frame them as &ldquo;proof of partnership.&rdquo; A like is
              not an endorsement. Ever.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-ember font-mono text-sm pt-0.5">×</span>
            <span>
              Claim Astroid is &ldquo;backed by,&rdquo; &ldquo;partnered with,&rdquo;{' '}
              &ldquo;sponsored by,&rdquo; or &ldquo;working with&rdquo; St. Jude.
              We are not. The wallet is the whole relationship.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-ember font-mono text-sm pt-0.5">×</span>
            <span>
              Use St. Jude&apos;s logo, branding, or imagery in Astroid
              materials. They have strict third-party fundraiser rules and we
              respect them.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-ember font-mono text-sm pt-0.5">×</span>
            <span>
              Tell anyone that buying $ASTROID is &ldquo;donating to St.
              Jude.&rdquo; A portion of trading fees auto-routes to a wallet
              ALSAC provided. That is structurally different from a
              charitable donation by the buyer.
            </span>
          </li>
        </ul>
      </section>

      {/* ==================== WHY ==================== */}
      <section className="glass-panel p-6 sm:p-8 mb-6">
        <div className="eyebrow mb-3">Why this matters</div>
        <div className="space-y-3 text-white/70 leading-relaxed text-sm">
          <p>
            ALSAC monitors how their name is used online. If our community
            consistently misrepresents the relationship - even with the best
            of intentions - they have every right to revoke the donation
            wallet. We&apos;ve seen other crypto projects lose charity
            relationships exactly this way.
          </p>
          <p>
            We&apos;d rather have a small, honest stream of donations going to
            St. Jude for years than a viral moment that ends the wallet next
            week. So would Liv.
          </p>
        </div>
      </section>

      {/* ==================== REPORT ==================== */}
      <section className="glass-panel-bright p-6 sm:p-8">
        <div className="eyebrow mb-3">See something off?</div>
        <p className="text-white/75 leading-relaxed mb-4">
          If you spot a post claiming Astroid is partnered with, endorsed by,
          or sponsored by St. Jude or ALSAC, please:
        </p>
        <ol className="space-y-2 text-white/70 leading-relaxed text-sm font-mono pl-2">
          <li>
            <span className="text-cosmos mr-2">01</span>
            Reply with a link to this page so others see the truth
          </li>
          <li>
            <span className="text-cosmos mr-2">02</span>
            Send the post to{' '}
            <a
              href={`mailto:${siteConfig.emails.security}?subject=Misleading%20partnership%20claim`}
              className="text-cosmos hover:text-white"
            >
              {siteConfig.emails.security}
            </a>{' '}
            so we can address it directly
          </li>
        </ol>
      </section>

      {/* ==================== FOOTER NOTE ==================== */}
      <div className="mt-10 text-center text-xs font-mono text-white/30 tracking-widest uppercase">
        Last updated {new Date().toISOString().slice(0, 10)} ·{' '}
        <a
          href={`mailto:${siteConfig.emails.security}`}
          className="hover:text-white"
        >
          {siteConfig.emails.security}
        </a>
      </div>
    </div>
  );
}
