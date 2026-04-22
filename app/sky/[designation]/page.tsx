import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getStarByDesignation,
  isValidDesignation,
  STAR_STYLES,
} from '../../lib/stars';
import { namedStarStore } from '../../lib/storage';
import { NamingCelebration } from './NamingCelebration';
import { StarOrbPreview } from '../../components/StarOrbPreview';

interface PageProps {
  params: Promise<{ designation: string }>;
  searchParams: Promise<{ ['just-named']?: string; claim?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { designation } = await params;
  const record = await namedStarStore.get(designation);
  // Only surface the name in social cards once it's approved.
  const named = record?.status === 'approved' ? record : null;
  return {
    title: named
      ? `${named.name} · ${designation} · Astroid`
      : `${designation} · Astroid`,
    description: named
      ? `${designation} is named "${named.name}"${named.dedication ? ` - "${named.dedication}"` : ''}.`
      : `${designation} is currently unnamed in the Astroid sky. Name it free.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function StarDetailPage({ params, searchParams }: PageProps) {
  const { designation } = await params;
  const sp = await searchParams;
  const justNamed = sp['just-named'];
  const providedClaim = sp.claim;

  if (!isValidDesignation(designation)) {
    notFound();
  }

  const star = getStarByDesignation(designation);
  if (!star) {
    notFound();
  }

  const record = await namedStarStore.get(designation);

  // Public approved name (visible to everyone).
  const approvedNamed = record?.status === 'approved' ? record : null;

  // Pending preview - only the namer (with their claim token) sees this.
  const pendingForNamer =
    record?.status === 'pending' && providedClaim && providedClaim === record.claimToken
      ? record
      : null;

  // For UI purposes:
  //  - If there's an approved name → public "named" view.
  //  - Else if the namer holds a valid claim for a pending sub → pending preview.
  //  - Else → public unnamed view (regardless of whether a stranger has it pending).
  const named = approvedNamed ?? pendingForNamer;
  const isApproved = !!approvedNamed;
  const isPendingPreview = !!pendingForNamer;
  const style = STAR_STYLES[star.spectrum];

  return (
    <>
      {justNamed === '1' && named && <NamingCelebration />}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-10">
          <Link
            href="/sky"
            className="text-sm text-white/50 hover:text-white inline-flex items-center gap-1.5"
          >
            <span aria-hidden>←</span> Back to the sky
          </Link>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-10 items-start">
          {/* Left: visual */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl border border-white/10 bg-space-950 overflow-hidden">
              <StarOrbPreview spectrum={star.spectrum} emphasize={isApproved} />
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
                <span className="telemetry-label">{style.label}</span>
                {isApproved ? (
                  <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest bg-cosmos/10 border border-cosmos/30 text-cosmos rounded">
                    ● Named
                  </span>
                ) : isPendingPreview ? (
                  <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest bg-ember/10 border border-ember/30 text-ember rounded">
                    ◌ Pending review
                  </span>
                ) : (
                  <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest bg-white/5 border border-white/10 text-white/60 rounded">
                    ○ Unnamed
                  </span>
                )}
              </div>
            </div>

            {/* Telemetry */}
            <div className="glass-panel p-4 space-y-3">
              <div>
                <div className="telemetry-label">Designation</div>
                <div className="telemetry-value text-cosmos">{star.id}</div>
              </div>
              <div>
                <div className="telemetry-label">Coordinates</div>
                <div className="telemetry-value text-sm text-white/70">
                  X {star.position[0].toFixed(3)}
                  <br />
                  Y {star.position[1].toFixed(3)}
                  <br />
                  Z {star.position[2].toFixed(3)}
                </div>
              </div>
              <div>
                <div className="telemetry-label">Index</div>
                <div className="telemetry-value text-sm text-white/70">
                  #{star.index} of 200
                </div>
              </div>
            </div>
          </div>

          {/* Right: details */}
          <div>
            {named ? (
              <>
                <div className="eyebrow mb-3">
                  {isApproved ? 'Officially named' : 'Pending review'}
                </div>
                <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-3">
                  {named.name}
                </h1>
                {named.dedication && (
                  <p className="text-xl text-ember italic mb-6 leading-relaxed">
                    &ldquo;{named.dedication}&rdquo;
                  </p>
                )}

                {isPendingPreview && (
                  <div className="mb-6 px-4 py-3 rounded-md bg-ember/10 border border-ember/30 text-sm text-ember/90 leading-relaxed">
                    <strong className="block text-ember mb-1">
                      ✓ Submitted - only you can see this preview.
                    </strong>
                    A human is reviewing your name. Once approved (usually
                    within a day) it will appear publicly here and your
                    certificate will become available to download.
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="glass-panel p-4">
                    <div className="telemetry-label">Named by</div>
                    <div className="text-white">{named.namedBy || 'A friend of Astroid'}</div>
                  </div>
                  <div className="glass-panel p-4">
                    <div className="telemetry-label">
                      {isApproved ? 'Named on' : 'Submitted on'}
                    </div>
                    <div className="text-white font-mono text-sm">
                      {new Date(named.namedAt).toLocaleString('en-US', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </div>
                  </div>
                </div>

                {isApproved && (
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`/api/stars/${star.id}/certificate`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      Download certificate
                      <span aria-hidden>↓</span>
                    </a>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="eyebrow mb-3">Unnamed</div>
                <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
                  This star is waiting.
                </h1>
                <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-xl">
                  No one has named {star.id} yet. Give it a name. Add a dedication if
                  you want. Get a free, printable certificate.
                </p>
                <Link
                  href={`/name-a-star?designation=${star.id}`}
                  className="btn-primary"
                >
                  Name {star.id}
                  <span aria-hidden>→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
