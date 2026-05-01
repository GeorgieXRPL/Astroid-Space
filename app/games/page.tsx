import Link from 'next/link';
import { QuizCard } from '../components/games/QuizCard';
import { getGameSummaries } from '../lib/games/registry';

export const metadata = {
  title: 'Games',
  description:
    'Short quiz-style mini-games for kids and grown-ups. Spot scams, learn how blockchains work, test your knowledge of the Astroid story. No wallet, no buy buttons - all free.',
};

export default function GamesPage() {
  const games = getGameSummaries();
  const brainGames = games.filter((g) => g.category === 'brain');
  const funGames = games.filter((g) => g.category === 'fun');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* ==================== HEADER ==================== */}
      <div className="text-center mb-12 sm:mb-16">
        <div className="eyebrow mb-3">
          Mini-games · for kids and grown-ups
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
          Quick games. <span className="text-white/50">Real lessons.</span>
        </h1>
        <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
          Bite-sized quizzes you can play together. Brain games drill the
          things from <Link href="/learn" className="text-cosmos hover:text-white">Space School</Link>{' '}
          into muscle memory. Fun games are pure lore. None of them touch a
          wallet, ask for money, or save anything off your device.
        </p>
      </div>

      {/* ==================== BRAIN GAMES ==================== */}
      {brainGames.length > 0 && (
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-5 gap-3 flex-wrap">
            <div>
              <div className="eyebrow text-cosmos mb-1">Brain Games</div>
              <h2 className="font-display text-2xl text-white tracking-tight">
                Learn by spotting patterns.
              </h2>
            </div>
            <span className="text-xs font-mono text-white/40">
              {brainGames.length} game{brainGames.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {brainGames.map((g) => (
              <QuizCard key={g.slug} game={g} />
            ))}
          </div>
        </section>
      )}

      {/* ==================== FUN GAMES ==================== */}
      {funGames.length > 0 && (
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-5 gap-3 flex-wrap">
            <div>
              <div className="eyebrow text-ember mb-1">Just for Fun</div>
              <h2 className="font-display text-2xl text-white tracking-tight">
                Lore, trivia, warmth.
              </h2>
            </div>
            <span className="text-xs font-mono text-white/40">
              {funGames.length} game{funGames.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {funGames.map((g) => (
              <QuizCard key={g.slug} game={g} />
            ))}
          </div>
        </section>
      )}

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="glass-panel p-6 sm:p-8 mb-12">
        <div className="eyebrow mb-3">How the games work</div>
        <ul className="grid sm:grid-cols-3 gap-4 text-sm">
          <li>
            <div className="telemetry-label mb-2">Round of 5</div>
            <div className="text-white/70 leading-relaxed">
              Each play picks 5 fresh questions from a pool of 12 - so
              re-playing keeps it interesting.
            </div>
          </li>
          <li>
            <div className="telemetry-label mb-2">No accounts</div>
            <div className="text-white/70 leading-relaxed">
              Nothing to sign up for. Your progress lives on this device
              and isn&apos;t sent anywhere, ever.
            </div>
          </li>
          <li>
            <div className="telemetry-label mb-2">No leaderboards</div>
            <div className="text-white/70 leading-relaxed">
              Single-player on purpose. The point is to learn, not to
              compete with strangers.
            </div>
          </li>
        </ul>
      </section>

      {/* ==================== CTA ==================== */}
      <div className="text-center pt-4">
        <h2 className="font-display text-2xl sm:text-3xl text-white tracking-tight mb-4">
          New here?
        </h2>
        <p className="text-white/60 mb-8 max-w-md mx-auto">
          Read the lessons first, then come back and drill the patterns.
          Or jump straight in - the games explain as you play.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/learn" className="btn-primary">
            Read Space School first
            <span aria-hidden>→</span>
          </Link>
          <Link href="/name-a-star" className="btn-secondary">
            Name a star (always free)
          </Link>
        </div>
      </div>
    </div>
  );
}
