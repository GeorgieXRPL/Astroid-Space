import Link from 'next/link';
import Image from 'next/image';
import { HeroScene } from './components/HeroScene';
import { StatsBar } from './components/StatsBar';
import { ContractBanner } from './components/ContractBanner';

export default function HomePage() {
  return (
    <>
      {/* ==================== HERO ==================== */}
      <section className="relative">
        <div className="absolute inset-0 h-[80vh] min-h-[640px]">
          <HeroScene interactive={false} autoRotate />
          <div className="absolute inset-0 bg-gradient-to-b from-space-950/40 via-transparent to-space-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-32 min-h-[80vh] flex flex-col">
          <div className="flex-1 flex flex-col justify-center max-w-2xl">
            <div className="eyebrow mb-4">A charity-first project · est. 2025</div>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6">
              Astroid.{' '}
              <span className="block text-white/60 mt-2">
                Starlike. Drawn by a kid. Helping kids.
              </span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-xl mb-8">
              <em className="not-italic text-white">Astroid</em>, from Greek <em>ἀστήρ</em>{' '}
              (star) + <em>-oid</em> (like). 25% of every pump.fun creator fee
              auto-routes on-chain to a children&apos;s charity wallet — no
              human in the loop. Name a star, write a wish, color in Astroid
              the Space Shiba.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/name-a-star" className="btn-primary">
                Name a star
                <span aria-hidden>→</span>
              </Link>
              <Link href="/charity" className="btn-secondary">
                See the donations
              </Link>
            </div>
          </div>

          <div className="mt-12">
            <StatsBar />
          </div>
        </div>
      </section>

      {/* ==================== MASCOT ==================== */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="eyebrow mb-4">Meet the mascot</div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight mb-6">
              This is Astroid.
              <br />
              <span className="text-white/50">A Space Shiba Inu.</span>
            </h2>
            <div className="space-y-4 text-white/70 text-base leading-relaxed mb-8">
              <p>
                Liv drew Astroid one afternoon. Not as a logo — just as a character she
                wanted to exist. A Shiba Inu in a SpaceX helmet, with very fluffy ears,
                a name patch, and a small mission logo.
              </p>
              <p>
                <span className="text-white">The drawing has been to space.</span>{' '}
                It&apos;s the original blueprint — every illustration, sticker, and pixel
                of Astroid traces back to this single piece of paper.
              </p>
              <p>
                We thought it was perfect. So we built a project around it — and made
                sure that whatever value it created, kids would benefit.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/about" className="btn-secondary">
                Read the full story
                <span aria-hidden>→</span>
              </Link>
              <Link href="/coloring" className="btn-secondary">
                Color Astroid
                <span aria-hidden>↗</span>
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-8 bg-cosmos/10 blur-3xl rounded-full" />
              <div className="kid-art-frame max-w-md mx-auto">
                <Image
                  src="/liv-drawing.jpg"
                  alt="Astroid the Space Shiba Inu, drawn by Liv"
                  width={600}
                  height={780}
                  className="w-full h-auto rounded-sm"
                  priority
                />
              </div>
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="text-xs font-mono text-white/40 tracking-widest uppercase">
                  Original artwork by Liv
                </div>
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cosmos/30 bg-cosmos/5 text-[10px] font-mono uppercase tracking-[0.18em] text-cosmos/90"
                  title="The original drawing has been flown to space"
                >
                  <span aria-hidden className="w-1 h-1 rounded-full bg-cosmos animate-pulse" />
                  <span>Flown in space · Original blueprint</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CONTRACT ==================== */}
      <ContractBanner />

      {/* ==================== THINGS TO DO ==================== */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <div className="eyebrow mb-3">Things to do here</div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Free and kid-safe.{' '}
            <span className="text-white/50">Pick one.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <ActionCard
            tag="01"
            title="Name a star"
            description="Pick one of 200 stars in the Astroid sky. Give it a name. Get a printable certificate. The naming is forever."
            href="/name-a-star"
            cta="Name one"
          />
          <ActionCard
            tag="02"
            title="Write a wish"
            description="A short message — for someone, for the world, for nothing in particular. Light moderation, then it floats on the Wish Wall."
            href="/wishes"
            cta="Add a wish"
          />
          <ActionCard
            tag="03"
            title="Color Astroid"
            description="Print Liv's drawing, color it in, send it back. We feature your version in the gallery."
            href="/coloring"
            cta="Get the page"
          />
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <div className="eyebrow mb-3">How charity works</div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            One source. <span className="text-white/50">One charity wallet.</span>
          </h2>
          <p className="text-white/60 max-w-xl mx-auto mt-5 leading-relaxed">
            No team discretion. No manual forwarding. Just pump.fun&apos;s built-in
            75 / 25 creator-fee split — and you can read the wallet balance in
            real time on the charity page.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <UtilityCard
            tag="On-chain · automatic"
            title="Pump.fun creator fees"
            split="75 / 25"
            description="Every trade on pump.fun pays a creator fee. The split happens at the source — 25% auto-routes on-chain to a Solana wallet provided by ALSAC for St. Jude Children's Research Hospital. Verifiable on every trade."
            href="/charity"
            cta="View the wallet"
          />
          <p className="mt-4 text-center text-xs font-mono text-white/30 tracking-wider uppercase max-w-md mx-auto">
            Astroid is not affiliated with or endorsed by St. Jude or ALSAC.
            See <a href="/charity" className="text-white/50 hover:text-white">/charity</a> for details.
          </p>
        </div>
      </section>

      {/* ==================== FRIENDS ==================== */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="glass-panel p-8 sm:p-12 text-center">
          <div className="eyebrow mb-3">Friends across the sky</div>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            We&apos;re Astroid <span className="text-white/50">— starlike.</span>
            <br />
            We celebrate the others.
          </h2>
          <p className="text-white/60 max-w-xl mx-auto mb-6 leading-relaxed">
            The asteroid plushie, Asteroid Protocol, B612 Foundation, and every project
            pointing kids at the sky — different rocks, same orbit.
          </p>
          <Link href="/friends" className="btn-secondary">
            Visit our friends
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="glass-panel-bright p-10 sm:p-16 text-center">
          <div className="eyebrow mb-3">Become part of the mission</div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Name a star. <span className="text-white/50">It&apos;s free.</span>
          </h2>
          <p className="text-white/60 max-w-xl mx-auto mb-8 leading-relaxed">
            Pick a designation. Give it a name. Add a dedication if you want. You get a
            printable certificate. The star stays named forever.
          </p>
          <Link href="/name-a-star" className="btn-primary text-base px-8 py-3">
            Start naming
            <span aria-hidden>→</span>
          </Link>
          <div className="mt-6 text-xs font-mono text-white/30 tracking-widest uppercase">
            Free · The name is forever
          </div>
        </div>
      </section>
    </>
  );
}

function ActionCard({
  tag,
  title,
  description,
  href,
  cta,
}: {
  tag: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="glass-panel p-6 sm:p-8 group hover:border-cosmos/40 transition-colors block"
    >
      <div className="telemetry-label mb-4">{tag}</div>
      <h3 className="font-display text-xl font-semibold text-white tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-white/60 text-sm leading-relaxed mb-6">{description}</p>
      <div className="inline-flex items-center gap-1.5 text-sm font-medium text-cosmos group-hover:text-white transition-colors">
        {cta} <span aria-hidden>→</span>
      </div>
    </Link>
  );
}

function UtilityCard({
  tag,
  title,
  split,
  description,
  href,
  cta,
}: {
  tag: string;
  title: string;
  split: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="glass-panel p-8 sm:p-10 group hover:border-white/20 transition-colors">
      <div className="flex items-baseline justify-between mb-6">
        <span className="telemetry-label">{tag}</span>
        <span className="font-mono text-2xl text-cosmos tabular">{split}</span>
      </div>
      <h3 className="font-display text-2xl font-semibold text-white tracking-tight mb-3">
        {title}
      </h3>
      <p className="text-white/60 text-sm leading-relaxed mb-6">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-cosmos hover:text-white transition-colors"
      >
        {cta} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
