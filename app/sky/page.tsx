import Link from 'next/link';
import { StarGrid } from '../components/StarGrid';
import { HeroScene } from '../components/HeroScene';
import { namedStarStore } from '../lib/storage';

export const metadata = {
  title: 'The Sky · Astroid',
  description:
    'Every named star in the Astroid sky. Names, dedications, and live status - names are forever.',
};

export const dynamic = 'force-dynamic';

export default async function SkyPage() {
  // Highlight only approved names in the live scene - pending submissions
  // shouldn't tint the sky until a moderator approves them.
  const approved = await namedStarStore.list({ status: 'approved', limit: 1000 });
  const namedSet = new Set(approved.map((n) => n.designation));

  return (
    <>
      {/* Live scene up top */}
      <section className="relative">
        <div className="h-[50vh] min-h-[420px] w-full">
          <HeroScene
            namedDesignations={namedSet}
            interactive={true}
            autoRotate={false}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-space-950" />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 -mt-12 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <div className="eyebrow mb-2">The Astroid Sky</div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
              Browse named stars
            </h1>
          </div>
          <Link href="/name-a-star" className="btn-primary">
            Name yours
            <span aria-hidden>→</span>
          </Link>
        </div>

        <StarGrid />
      </section>
    </>
  );
}
