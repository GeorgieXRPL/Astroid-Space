import Link from 'next/link';
import type { GameSummary } from '../../lib/games/types';

/**
 * Hub-grid card representing one game.
 *
 * Shows title, tagline, category badge, difficulty stars, and an
 * approximate play time so a teacher or parent can pick a 2-minute
 * warm-up vs a 3-minute round at a glance.
 *
 * Server-renderable on purpose - no client state, no localStorage.
 * The hub stays fully cacheable.
 */
export function QuizCard({ game }: { game: GameSummary }) {
  const isBrain = game.category === 'brain';
  return (
    <Link
      href={`/games/${game.slug}`}
      className="glass-panel p-6 sm:p-7 group transition-colors hover:border-cosmos/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cosmos/60 block"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
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
          {'★'.repeat(game.difficulty)}
          <span className="text-white/15">
            {'★'.repeat(3 - game.difficulty)}
          </span>
          <span className="ml-2">~{game.estMinutes} min</span>
        </span>
      </div>

      <h3 className="font-display text-xl sm:text-2xl text-white tracking-tight mb-2 group-hover:text-cosmos transition-colors">
        {game.title}
      </h3>
      <p className="text-sm text-white/65 leading-relaxed">{game.tagline}</p>

      <div className="mt-5 text-[11px] font-mono uppercase tracking-widest text-cosmos/70 group-hover:text-cosmos transition-colors">
        Play →
      </div>
    </Link>
  );
}
