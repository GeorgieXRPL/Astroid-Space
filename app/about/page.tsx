import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'About · Astroid',
  description:
    'The story behind Astroid the Space Shiba Inu — a character drawn by Liv, turned into a charity-first project for kids. Astroid means starlike.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center mb-16">
        <div className="eyebrow mb-3">The story</div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
          A drawing became a mission.
        </h1>
        <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
          Astroid started as a piece of paper, a pencil, and a kid with very specific
          ideas about how a Shiba Inu should look in a SpaceX helmet.
        </p>
      </div>

      {/* Liv's drawing */}
      <div className="relative max-w-2xl mx-auto mb-20">
        <div className="absolute -inset-12 bg-gradient-to-br from-cosmos/10 via-ember/5 to-transparent blur-3xl" />
        <div className="kid-art-frame relative">
          <Image
            src="/liv-drawing.jpg"
            alt="Astroid the Space Shiba Inu, original drawing by Liv"
            width={1000}
            height={1300}
            className="w-full h-auto rounded-sm"
            priority
          />
        </div>
        <div className="text-center mt-5">
          <div className="font-display text-lg text-white">Astroid the Space Shiba Inu</div>
          <div className="text-xs font-mono text-white/40 tracking-widest uppercase mt-1">
            Original artwork · Liv · 2025
          </div>
        </div>
      </div>

      {/* Story */}
      <div className="prose prose-invert max-w-2xl mx-auto space-y-6 text-white/75 leading-relaxed">
        <Section title="What you&apos;re looking at">
          <p>
            Liv drew this Shiba Inu in a SpaceX helmet. She labeled it carefully:
            &ldquo;fur in ears must be very fluffy,&rdquo; &ldquo;I want a visor on the
            helmet,&rdquo; a name patch reading <em>Astroid</em>, and a small mission
            logo patch on the chest. She signed it at the bottom.
          </p>
          <p>
            That&apos;s the whole brand brief. Everything else — the website, the sky
            of stars, the typography, the tone of voice — flows from those notes.
          </p>
        </Section>

        <Section title="What &lsquo;Astroid&rsquo; actually means">
          <p>
            <em className="not-italic text-white">Astroid</em> isn&apos;t a typo of{' '}
            <em>asteroid</em>. It&apos;s the actual word{' '}
            <em>astroid</em>, from Greek <em>ἀστήρ</em> (star) +{' '}
            <em>-οειδής</em> (-like). It means <strong className="text-white">starlike</strong>.
          </p>
          <p>
            That&apos;s why this site is built around a sky of stars instead of a
            belt of rocks. We&apos;re not the asteroid plushie, we&apos;re not Asteroid
            Protocol, we&apos;re not any of the asteroid memecoins. We share the sky
            with them — and we point our friends at them on the{' '}
            <Link href="/friends" className="text-cosmos hover:text-white">
              Friends page
            </Link>
            .
          </p>
        </Section>

        <Section title="Why it&apos;s a project">
          <p>
            Meme coins typically have no real utility. We wanted to change the default.
            What if the trading activity that naturally happens around a meme coin were
            wired, at the source, to do real-world good?
          </p>
          <p>So we wired one simple utility lane into the project:</p>
          <ul className="list-disc list-inside space-y-2 marker:text-cosmos">
            <li>
              <strong className="text-white">25% of pump.fun creator fees</strong>{' '}
              auto-route on-chain to a Solana wallet provided by ALSAC for{' '}
              <strong className="text-white">St. Jude Children&apos;s Research Hospital</strong>.
              We never touch the funds. The split happens at the protocol level,
              automatically, on every trade.
            </li>
            <li>
              We&apos;re also <strong className="text-white">reaching out to other
              children&apos;s charities</strong> — nominated by the community — to
              request permission to route on-chain donations to them. Once a
              charity confirms in writing, they&apos;re added to a recurring
              on-chain split from the 75% project wallet. The 25% to St. Jude
              is not affected by additional charities being added.
            </li>
          </ul>
          <p>
            Verify the live wallet balance, see the recipient details, or
            nominate a charity on the{' '}
            <Link href="/charity" className="text-cosmos hover:text-white">
              Charity page
            </Link>
            .
          </p>
          <p className="text-xs text-white/40">
            Astroid is not affiliated with, endorsed by, or partnered with
            St. Jude or ALSAC. We do not solicit donations on their behalf.
          </p>
        </Section>

        <Section title="Why &lsquo;Name a Star&rsquo; (and a Wish Wall, and coloring)">
          <p>
            We needed kid-friendly things for the site to <em>do</em> — things that
            weren&apos;t a chart or a buy button. So:
          </p>
          <ul className="list-disc list-inside space-y-2 marker:text-cosmos">
            <li>
              A procedurally generated sky of <strong className="text-white">200 stars</strong>,
              each with a stable designation, each free to name.
            </li>
            <li>
              A <strong className="text-white">Wish Wall</strong> for one-sentence wishes
              — for someone, for the world, for nothing in particular.
            </li>
            <li>
              A <strong className="text-white">coloring page</strong>: print Liv&apos;s
              drawing, color it however you want, send it back, we feature you.
            </li>
          </ul>
          <p>
            All free. Sign your name or leave it blank — your
            call. The naming, the wish, and the coloring all stay forever — the
            project is the artifact people leave behind.
          </p>
        </Section>

        <Section title="What we don&apos;t do">
          <ul className="list-disc list-inside space-y-2 marker:text-cosmos">
            <li>We don&apos;t custody donations. Funds move at the source.</li>
            <li>
              We don&apos;t require a wallet. Naming a star, writing a wish, and
              submitting a drawing all work without one.
            </li>
            <li>
              We don&apos;t collect personal data. Names you submit are shown publicly;
              that&apos;s the only data we keep.
            </li>
            <li>
              We don&apos;t auto-publish wishes or drawings. A human reviews them so
              the site stays kind for kids.
            </li>
          </ul>
        </Section>

        <Section title="Who Liv is">
          <p>
            Liv is a kid. She likes Shiba Inus and SpaceX. She wanted Astroid to exist,
            so we made it. Her drawing is her own work. Everything you see here is in
            service of her character.
          </p>
        </Section>
      </div>

      <div className="text-center mt-20 pt-12 border-t border-white/5">
        <h2 className="font-display text-3xl text-white mb-4 tracking-tight">
          Ready to join?
        </h2>
        <p className="text-white/60 mb-8 max-w-md mx-auto">
          Name a star. It&apos;s free. It takes one minute. You get a certificate.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/name-a-star" className="btn-primary">
            Name a star
            <span aria-hidden>→</span>
          </Link>
          <Link href="/charity" className="btn-secondary">
            See the charity wallet
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="font-display text-2xl text-white tracking-tight mb-3"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className="space-y-3">{children}</div>
    </div>
  );
}
