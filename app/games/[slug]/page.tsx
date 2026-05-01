import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Quiz } from '../../components/games/Quiz';
import {
  getQuiz,
  getAllSlugs,
  getGameSummaries,
} from '../../lib/games/registry';

/**
 * Generic runner page for any quiz in the registry.
 *
 * Statically pre-rendered for every slug at build time. The Quiz
 * itself is a client component and handles its own state, but every
 * page (and its metadata) is server-rendered for SEO and fast first
 * paint.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { slug } = await params;
  const quiz = getQuiz(slug);
  if (!quiz) return { title: 'Game not found' };
  return {
    title: quiz.title,
    description: quiz.metaDescription ?? quiz.tagline,
  };
}

export default async function GameSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const quiz = getQuiz(slug);
  if (!quiz) notFound();

  // Pass the lightweight registry summary so the engine's recommender
  // works without re-importing the entire pool data on the client.
  const registry = getGameSummaries();
  const isBrain = quiz.category === 'brain';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* ==================== BREADCRUMB ==================== */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 text-xs font-mono uppercase tracking-widest text-white/40"
      >
        <Link href="/games" className="hover:text-white">
          Games
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <span className="text-white/70">{quiz.title}</span>
      </nav>

      {/* ==================== HEADER ==================== */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded border ${
              isBrain
                ? 'border-cosmos/40 text-cosmos'
                : 'border-ember/40 text-ember'
            }`}
          >
            {isBrain ? 'Brain Game' : 'Just for Fun'}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            {'★'.repeat(quiz.difficulty)}
            <span className="text-white/15">
              {'★'.repeat(3 - quiz.difficulty)}
            </span>
            <span className="ml-2">~{quiz.estMinutes} min</span>
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight mb-3">
          {quiz.title}
        </h1>
        <p className="text-white/65 leading-relaxed max-w-xl">
          {quiz.tagline}
        </p>
      </header>

      {/* ==================== THE GAME ==================== */}
      <Quiz quiz={quiz} registry={registry} />

      {/* ==================== FOOTER LINKS ==================== */}
      <div className="mt-16 pt-8 border-t border-white/5 text-center">
        <Link
          href="/games"
          className="text-sm font-mono uppercase tracking-widest text-white/45 hover:text-white"
        >
          ← All games
        </Link>
        <span className="text-white/20 mx-3">·</span>
        <Link
          href="/learn"
          className="text-sm font-mono uppercase tracking-widest text-white/45 hover:text-white"
        >
          Space School
        </Link>
      </div>
    </div>
  );
}
