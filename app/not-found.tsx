import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-32 text-center">
      <div className="eyebrow mb-4">404 · Lost in space</div>
      <h1 className="font-display text-5xl sm:text-7xl font-bold text-white tracking-tight mb-6">
        That star isn&apos;t in our sky.
      </h1>
      <p className="text-white/60 mb-10">
        It might have drifted out of the field, or the designation isn&apos;t valid.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
        <Link href="/sky" className="btn-secondary">
          Browse the sky
        </Link>
      </div>
    </div>
  );
}
