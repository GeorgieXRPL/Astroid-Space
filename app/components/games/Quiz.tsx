'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Quiz, Question, GameSummary } from '../../lib/games/types';
import {
  pickRound,
  recordPlay,
  pickNextGame,
  resetRotation,
} from '../../lib/games/rotation';

/**
 * Generic quiz engine.
 *
 * Renders a single round of `quiz.roundSize` questions in a vertical
 * stack. Each card answers independently and shows an inline
 * explanation. When every card has been answered, an end-of-round
 * summary appears with three exits:
 *   1. Play again with new questions   - advances rotation
 *   2. Try [recommended next game] →   - cross-game suggestion
 *   3. Back to the games hub
 *
 * Rotation lives in localStorage (see ../../lib/games/rotation.ts).
 * If storage is unavailable, every play just shuffles fresh - the
 * game still works, it just won't remember progress between sessions.
 *
 * The component is a self-contained client island; the page that
 * embeds it can be a server component and pass the static `quiz`
 * config + the recommender's `registry` summary list. We never call
 * registry-loading code from the browser bundle.
 */

interface QuizProps {
  quiz: Quiz;
  /** Other games the recommender can suggest. Pass an empty array to disable. */
  registry: GameSummary[];
  /** When true, hides the "Back to the games hub" button - useful when
   *  the quiz is embedded on a page like /learn that isn't the hub. */
  hideHubLink?: boolean;
}

/** Per-card answer state. Null = unanswered. */
type AnswerMap = Record<string, string | null>;

export function Quiz({ quiz, registry, hideHubLink = false }: QuizProps) {
  // `roundKey` bumps each "Play again" - it forces useMemo to recompute
  // a new round and clears the answer map. We keep it instead of moving
  // round selection into a setState because we want the round set
  // exactly once per "play", not on every re-render.
  const [roundKey, setRoundKey] = useState(0);

  // We're a client component but Next.js still SSRs us once for the
  // initial HTML. `pickRound` reads localStorage and uses Math.random()
  // - both produce different results on the server vs the client - so
  // running it during SSR/first-paint causes a hydration mismatch
  // (server picks one shuffle, client picks another, React explodes).
  //
  // Fix: render a stable skeleton until we've mounted on the client,
  // THEN pick the round. The first render on both sides shows the
  // same skeleton; the real questions appear on the client immediately
  // after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Pick the round on mount and on every Play Again. Wrapped in useMemo
  // so React 18+ strict-mode double-render doesn't burn through the pool
  // twice on first paint. Note: pickRound DOES mutate localStorage as a
  // side effect, so calling it once per play (per roundKey) is correct.
  // Returns [] until mounted so the SSR pass doesn't touch random/storage.
  const round = useMemo<Question[]>(
    () =>
      mounted ? pickRound(quiz.slug, quiz.pool, quiz.roundSize) : [],
    // We deliberately re-run when mount flips, when roundKey changes
    // (Play again), and when the quiz identity changes (route swap
    // reuses the component instance via Next route caching).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mounted, roundKey, quiz.slug]
  );

  const [answers, setAnswers] = useState<AnswerMap>({});

  // Reset answer state whenever the round itself changes.
  useEffect(() => {
    setAnswers({});
  }, [round]);

  // Compute round-completion state.
  const answered = round.filter((q) => answers[q.id] != null).length;
  const total = round.length;
  const score = round.reduce((acc, q) => {
    const ans = answers[q.id];
    if (ans == null) return acc;
    return ans === q.correctId ? acc + 1 : acc;
  }, 0);
  const finished = total > 0 && answered === total;

  // Record play once we hit "finished" - and only once per round.
  // (useEffect runs after render, useMemo deps would also fire it on
  // strict-mode double-mount, so we use a ref-equivalent via roundKey.)
  useEffect(() => {
    if (!finished) return;
    recordPlay(quiz.slug);
  }, [finished, quiz.slug, roundKey]);

  // Compute the recommended next game once the round finishes.
  const nextGame = useMemo<GameSummary | null>(() => {
    if (!finished) return null;
    return pickNextGame(quiz.slug, registry);
  }, [finished, quiz.slug, registry]);

  const setAnswer = (questionId: string, choiceId: string) => {
    setAnswers((prev) => {
      // Lock answers - first tap wins. Prevents accidental double-tap
      // from flipping the result, and stops kids from gaming the score
      // by re-tapping.
      if (prev[questionId] != null) return prev;
      return { ...prev, [questionId]: choiceId };
    });
  };

  const playAgain = () => {
    setRoundKey((k) => k + 1);
  };

  const startOver = () => {
    resetRotation(quiz.slug);
    setRoundKey((k) => k + 1);
  };

  // Pre-mount skeleton: matches the SSR output so hydration is silent.
  // Approximates the height of the real round so there's minimal CLS
  // when the questions appear.
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-baseline justify-between flex-wrap gap-3">
          <div>
            <div className="eyebrow mb-1">Round of {quiz.roundSize}</div>
            <h2 className="font-display text-2xl text-white tracking-tight">
              {quiz.title}
            </h2>
          </div>
        </div>
        <div className="glass-panel p-6 text-center">
          <div className="eyebrow mb-2">Loading…</div>
          <p className="text-sm text-white/55">
            Picking {quiz.roundSize} fresh questions from a pool of{' '}
            {quiz.pool.length}.
          </p>
        </div>
      </div>
    );
  }

  if (round.length === 0) {
    // Defensive: empty pool. Should never happen in production.
    return (
      <div className="glass-panel p-6 text-white/70">
        This quiz has no questions yet. Check back soon.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ==================== HEADER ==================== */}
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="eyebrow mb-1">
            Round of {total}{' '}
            <span className="text-white/40">
              · pulled fresh from a pool of {quiz.pool.length}
            </span>
          </div>
          <h2 className="font-display text-2xl text-white tracking-tight">
            {quiz.title}
          </h2>
          {quiz.description && (
            <p className="text-sm text-white/60 mt-1 max-w-xl">
              {quiz.description}
            </p>
          )}
        </div>
        <div className="text-right tabular" aria-live="polite">
          <div className="telemetry-label">Progress</div>
          <div className="font-display text-2xl text-cosmos">
            {answered} / {total}
          </div>
        </div>
      </div>

      {/* ==================== QUESTION CARDS ==================== */}
      <ol className="space-y-4 list-none pl-0">
        {round.map((q, i) => (
          <li key={q.id}>
            <QuestionCard
              question={q}
              index={i + 1}
              total={total}
              chosenId={answers[q.id] ?? null}
              onChoose={(choiceId) => setAnswer(q.id, choiceId)}
            />
          </li>
        ))}
      </ol>

      {/* ==================== END SUMMARY ==================== */}
      {finished && (
        <div className="glass-panel-bright p-6 sm:p-8 text-center">
          <div className="eyebrow mb-2">All done</div>
          <div className="font-display text-3xl sm:text-4xl text-white tabular mb-2">
            {score} <span className="text-white/40">/ {total}</span>
          </div>
          <p className="text-white/70 leading-relaxed max-w-md mx-auto mb-6">
            {summaryMessage(score, total)}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={playAgain}
              className="btn-primary text-sm"
            >
              Play again with new questions
              <span aria-hidden>→</span>
            </button>
            {nextGame && (
              <Link
                href={`/games/${nextGame.slug}`}
                className="btn-secondary text-sm"
              >
                Try {nextGame.title} next
                <span aria-hidden>→</span>
              </Link>
            )}
            {!hideHubLink && (
              <Link
                href="/games"
                className="btn-secondary text-sm"
              >
                Back to the games hub
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={startOver}
            className="mt-6 text-[11px] font-mono uppercase tracking-widest text-white/35 hover:text-white/70 transition-colors"
            title="Reshuffle the question pool from scratch on this device"
          >
            Reset progress on this device
          </button>
        </div>
      )}

      {/* ==================== STORAGE NOTE ==================== */}
      <p className="text-[11px] font-mono text-white/30 leading-relaxed text-center">
        Your progress and best round stay on this device only - never sent
        anywhere.
      </p>
    </div>
  );
}

/* ============================================================
   Individual question card
   ============================================================ */

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  chosenId: string | null;
  onChoose: (choiceId: string) => void;
}

function QuestionCard({
  question,
  index,
  total,
  chosenId,
  onChoose,
}: QuestionCardProps) {
  const answered = chosenId != null;
  const correct = answered && chosenId === question.correctId;

  return (
    <article
      className={`glass-panel p-5 sm:p-6 transition-colors ${
        answered ? (correct ? 'border-cosmos/40' : 'border-ember/40') : ''
      }`}
    >
      {/* Q-number + optional prelude */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[10px] text-cosmos tracking-widest">
          Q{index}/{total}
        </span>
        {question.prelude && (
          <span className="telemetry-label">{question.prelude}</span>
        )}
      </div>

      {/* Prompt */}
      <Prompt
        text={question.prompt}
        style={question.promptStyle ?? 'plain'}
      />

      {/* Choices */}
      <div className="mt-5 grid gap-2 sm:grid-cols-1">
        {question.choices.map((c) => {
          const isChosen = chosenId === c.id;
          const isCorrect = c.id === question.correctId;
          const showCorrect = answered && isCorrect;
          const showWrong = answered && isChosen && !isCorrect;
          const isMonoChoice = question.promptStyle === 'mono';

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChoose(c.id)}
              disabled={answered}
              aria-pressed={isChosen}
              className={[
                'text-left px-4 py-3 rounded-lg border transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-cosmos/60',
                isMonoChoice ? 'font-mono text-sm break-all' : 'text-sm',
                answered
                  ? showCorrect
                    ? 'border-cosmos/50 bg-cosmos/10 text-white'
                    : showWrong
                      ? 'border-ember/50 bg-ember/10 text-white'
                      : 'border-white/10 bg-transparent text-white/45'
                  : 'border-white/15 text-white/85 hover:border-cosmos/40 hover:bg-white/[0.03] cursor-pointer',
              ].join(' ')}
            >
              <span className="flex items-center justify-between gap-3">
                <span>{c.label}</span>
                {showCorrect && (
                  <span aria-hidden className="text-cosmos text-base">
                    ✓
                  </span>
                )}
                {showWrong && (
                  <span aria-hidden className="text-ember text-base">
                    ×
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div
          className={`mt-4 rounded-lg p-4 border text-sm leading-relaxed ${
            correct
              ? 'border-cosmos/30 bg-cosmos/5 text-white/85'
              : 'border-ember/30 bg-ember/5 text-white/85'
          }`}
          role="status"
        >
          <div
            className={`eyebrow mb-2 ${
              correct ? 'text-cosmos' : 'text-ember'
            }`}
          >
            {correct ? 'Nice catch' : 'Tricky one'}
          </div>
          {question.explanation}
        </div>
      )}
    </article>
  );
}

/* ============================================================
   Prompt rendering - three visual styles
   ============================================================ */

function Prompt({
  text,
  style,
}: {
  text: string;
  style: 'plain' | 'quote' | 'mono';
}) {
  if (style === 'quote') {
    return (
      <p className="text-white/85 leading-relaxed text-sm sm:text-base">
        &ldquo;{text}&rdquo;
      </p>
    );
  }
  if (style === 'mono') {
    return (
      <p className="font-mono text-sm sm:text-base text-white/90 break-all">
        {text}
      </p>
    );
  }
  return (
    <p className="text-white/85 leading-relaxed text-sm sm:text-base">
      {text}
    </p>
  );
}

/* ============================================================
   End-of-round message
   ============================================================ */

function summaryMessage(score: number, total: number): string {
  const ratio = score / total;
  if (ratio === 1) {
    return 'Perfect round. The patterns get easier to spot the more times you see them - and you spotted every one.';
  }
  if (ratio >= 0.6) {
    return "Solid round. Read the explanations on the ones you missed - that's the real learning. Then try a fresh round.";
  }
  return "Tricky round. The patterns repeat, so the explanations above are doing the heavy lifting. Read them with a grown-up if you can - it gets easier fast.";
}
