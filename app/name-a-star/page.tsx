import { Suspense } from 'react';
import { NamingForm } from '../components/NamingForm';

interface NameAStarPageProps {
  searchParams: Promise<{ designation?: string }>;
}

export const metadata = {
  title: 'Name a Star',
  description:
    'Pick a star, give it a name, get a free certificate. No account, no payment. The naming is forever.',
};

export default async function NameAStarPage({ searchParams }: NameAStarPageProps) {
  const { designation } = await searchParams;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center mb-12">
        <div className="eyebrow mb-3">Naming</div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
          Name a star.
        </h1>
        <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
          Pick one of 200 stars in the Astroid sky. Give it a name. Get a free,
          printable certificate. The naming is recorded forever and shown on the
          star&apos;s public page.
        </p>
      </div>

      <Suspense fallback={<div className="glass-panel p-12 text-center text-white/40">Loading…</div>}>
        <NamingForm initialDesignation={designation} />
      </Suspense>

      <div className="mt-8 text-center text-xs font-mono text-white/30 tracking-widest uppercase">
        Free · No payment · No account
      </div>
    </div>
  );
}
