'use client';

import { useState } from 'react';

/**
 * Three-card guess game for the /learn page.
 *
 * Each card is a short, platform-neutral message of the kind kids and
 * their parents see online every day. The player decides whether it's
 * REAL (something a normal person or a real project might say) or a SCAM
 * (something a stranger trying to drain a wallet would say).
 *
 * The "scam" cards are paraphrased composites of the three most common
 * crypto scam patterns - support impersonation, fake giveaways, and
 * "verify your wallet" phishing - written without naming any specific
 * platform so the lesson stays evergreen regardless of which app is
 * popular this year. We deliberately include NO clickable links, QR
 * codes, or contract addresses in the examples; this is for teaching
 * pattern recognition, not bait. The "real" card is intentionally
 * boring: real safety advice rarely arrives in a flashy message at all.
 */

interface Card {
  /** What the message looks like - rendered in a chat-bubble style. */
  body: string;
  /** Where it pretends to come from - a "screen name" line. */
  from: string;
  /** True if the message is a scam, false if it's normal/safe. */
  isScam: boolean;
  /** One-sentence explanation shown after the player guesses. */
  why: string;
}

const CARDS: Card[] = [
  {
    from: 'A stranger · direct message',
    body:
      'Hi! I work for crypto support. We noticed unusual activity on your wallet. To keep your funds safe, please paste your 12-word seed phrase here and our team will secure it for you.',
    isScam: true,
    why:
      'No real support team will ever ask for a seed phrase. The seed phrase IS the wallet - whoever has it owns everything inside. Real support fixes problems without your seed, ever.',
  },
  {
    from: 'A grown-up you live with · in person',
    body:
      'Before you click anything in that message, show me first. We will read it together and check the website address out loud.',
    isScam: false,
    why:
      'Exactly right. A trusted adult, in person, slowing things down. Scams work by rushing you. Reading things out loud together breaks the spell.',
  },
  {
    from: 'A pop-up · on a website',
    body:
      'CONGRATULATIONS! You have been selected for a 5 SOL airdrop. Connect your wallet within 10 minutes to claim, or you lose your spot forever.',
    isScam: true,
    why:
      'Three red flags at once: a stranger giving you free money, a countdown to make you panic, and a "connect your wallet" prompt. Real giveaways do not work like this. None of them.',
  },
];

type Verdict = 'scam' | 'safe' | null;

export function RealOrScam() {
  const [answers, setAnswers] = useState<Verdict[]>(CARDS.map(() => null));

  const score = answers.reduce<number>((acc, ans, i) => {
    if (ans === null) return acc;
    const correct = ans === 'scam' ? CARDS[i].isScam : !CARDS[i].isScam;
    return acc + (correct ? 1 : 0);
  }, 0);
  const answered = answers.filter((a) => a !== null).length;

  const setAnswer = (i: number, v: Verdict) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="eyebrow mb-1">Mini-game · 30 seconds</div>
          <h3 className="font-display text-2xl text-white tracking-tight">
            Real or Scam?
          </h3>
          <p className="text-sm text-white/60 mt-1 max-w-md">
            Three messages. Tap whether each one is something safe to read,
            or a trick. We&apos;ll tell you why after each guess.
          </p>
        </div>
        {answered > 0 && (
          <div
            className="text-right tabular"
            aria-live="polite"
          >
            <div className="telemetry-label">Score</div>
            <div className="font-display text-2xl text-cosmos">
              {score} / {answered}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {CARDS.map((card, i) => {
          const ans = answers[i];
          const correct = ans === 'scam' ? card.isScam : !card.isScam;
          const revealed = ans !== null;

          return (
            <div
              key={i}
              className={`glass-panel p-5 sm:p-6 transition-colors ${
                revealed
                  ? correct
                    ? 'border-cosmos/40'
                    : 'border-ember/40'
                  : ''
              }`}
            >
              <div className="telemetry-label mb-2">{card.from}</div>
              <p className="text-white/85 leading-relaxed text-sm sm:text-base mb-4">
                &ldquo;{card.body}&rdquo;
              </p>

              {!revealed && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAnswer(i, 'safe')}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Looks safe
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswer(i, 'scam')}
                    className="btn-secondary text-xs px-4 py-2 border-ember/30 text-ember hover:border-ember/60"
                  >
                    That&apos;s a scam
                  </button>
                </div>
              )}

              {revealed && (
                <div
                  className={`rounded-lg p-4 border ${
                    correct
                      ? 'border-cosmos/30 bg-cosmos/5'
                      : 'border-ember/30 bg-ember/5'
                  }`}
                  role="status"
                >
                  <div
                    className={`eyebrow mb-2 ${
                      correct ? 'text-cosmos' : 'text-ember'
                    }`}
                  >
                    {correct ? 'Nice catch' : 'Tricky one'} ·{' '}
                    {card.isScam ? 'This was a scam' : 'This was safe'}
                  </div>
                  <p className="text-sm text-white/75 leading-relaxed">
                    {card.why}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {answered === CARDS.length && (
        <div className="glass-panel-bright p-5 sm:p-6 text-center">
          <div className="eyebrow mb-2">All done</div>
          <p className="text-white/80 leading-relaxed">
            {score === CARDS.length
              ? 'Perfect. You spotted every trick. Real scams are rarely fancier than these - if a message feels rushed, secret, or too good, it is almost always one of these patterns.'
              : 'You got some, you missed some - that is exactly how learning works. Re-read the explanations above with a grown-up. The patterns repeat: rushing you, asking for secrets, promising free money.'}
          </p>
          <button
            type="button"
            onClick={() => setAnswers(CARDS.map(() => null))}
            className="btn-secondary text-xs px-4 py-2 mt-4"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
