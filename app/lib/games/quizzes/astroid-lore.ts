/**
 * @fileoverview Astroid Lore - 12-question pool.
 *
 * Brand-and-mission trivia. Most questions teach something about the
 * project (the word "astroid", who drew the mascot, how the charity
 * routing works, what ALSAC is) or quietly reinforce a safety idea
 * (DYOR, the contract address rule, "naming a star is free"). A few
 * are pure light-hearted lore.
 *
 * Authoring rules:
 *   - Multiple choice, 3-4 options each.
 *   - The correct answer is never option (a) every time - vary it,
 *     or kids learn to just tap (a). Ditto for (b).
 *   - Wrong answers should be plausibly close, not joke-obvious -
 *     a kid should have to actually think.
 *   - Every explanation should leave them knowing one more concrete
 *     thing about the project, even if they got it right.
 */

import type { Quiz } from '../types';

export const ASTROID_LORE_QUIZ: Quiz = {
  slug: 'astroid-lore',
  title: 'Astroid Lore',
  tagline:
    'How well do you know the project a kid started in honor of a mascot her friends loved?',
  description:
    "Five questions. Some about the story behind Astroid, some about how the mission actually works, and one or two just for fun. The answers explain a bit more than they need to - that's the point.",
  category: 'fun',
  difficulty: 1,
  estMinutes: 2,
  roundSize: 5,
  pool: [
    {
      id: 'lore-meaning',
      prompt: 'What does the word "astroid" actually mean?',
      choices: [
        { id: 'a', label: 'A typo of "asteroid"' },
        { id: 'b', label: 'Starlike' },
        { id: 'c', label: 'A small fast spaceship' },
        { id: 'd', label: 'Shiny, in old English' },
      ],
      correctId: 'b',
      explanation:
        'It is the real word "astroid" - from the Greek for "star" and "-like". It means starlike. That is why this whole site is built around a sky of stars instead of a belt of rocks.',
    },
    {
      id: 'lore-who-drew',
      prompt: 'Who drew the original Astroid mascot?',
      choices: [
        { id: 'a', label: 'A kid named Liv' },
        { id: 'b', label: 'A famous illustrator' },
        { id: 'c', label: 'An AI image generator' },
        { id: 'd', label: 'A team of designers' },
      ],
      correctId: 'a',
      explanation:
        'A kid named Liv drew it on paper, in pencil, with very specific instructions about how the helmet and the visor should look. The whole site flows from that drawing.',
    },
    {
      id: 'lore-animal',
      prompt: 'What kind of animal is Astroid?',
      choices: [
        { id: 'a', label: 'A space cat' },
        { id: 'b', label: 'A shiba inu' },
        { id: 'c', label: 'A husky' },
        { id: 'd', label: 'A small bear' },
      ],
      correctId: 'b',
      explanation:
        'Astroid is a Shiba Inu in a SpaceX helmet. The fluffy ears and the visor are part of the original brief Liv wrote on the drawing.',
    },
    {
      id: 'lore-blockchain',
      prompt: 'Which blockchain does $ASTROID live on?',
      choices: [
        { id: 'a', label: 'Bitcoin' },
        { id: 'b', label: 'Ethereum' },
        { id: 'c', label: 'Solana' },
        { id: 'd', label: 'BNB Chain' },
      ],
      correctId: 'c',
      explanation:
        '$ASTROID is a token that lives on Solana. Solana was chosen because trades are fast and cheap, which keeps the auto-routing to the charity wallet practical.',
    },
    {
      id: 'lore-charity',
      prompt:
        'Which charity does 25% of pump.fun creator fees auto-route to?',
      choices: [
        { id: 'a', label: 'UNICEF' },
        { id: 'b', label: "St. Jude Children's Research Hospital" },
        { id: 'c', label: 'Red Cross' },
        { id: 'd', label: 'Doctors Without Borders' },
      ],
      correctId: 'b',
      explanation:
        "St. Jude was Liv's chosen charity. The 25% routes through donate.gg - a service that delivers crypto donations to verified charities - on to St. Jude. The Astroid project never custody-holds the funds.",
    },
    {
      id: 'lore-alsac',
      prompt: 'What is ALSAC?',
      choices: [
        { id: 'a', label: 'A type of crypto wallet' },
        { id: 'b', label: 'The fundraising organisation for St. Jude' },
        {
          id: 'c',
          label: 'An old name for $ASTROID before the rebrand',
        },
        { id: 'd', label: 'A regulator that approves charity coins' },
      ],
      correctId: 'b',
      explanation:
        "ALSAC stands for the American Lebanese Syrian Associated Charities. They handle fundraising and awareness for St. Jude Children's Research Hospital. Astroid is not partnered with or endorsed by ALSAC - donations are routed by donate.gg, a third-party service, on to St. Jude.",
    },
    {
      id: 'lore-routing',
      prompt: 'When does the 25% donation actually move?',
      choices: [
        { id: 'a', label: 'Once a year, in December' },
        { id: 'b', label: 'When the team manually sends it' },
        {
          id: 'c',
          label:
            'Automatically at fee-claim time, via donate.gg, on to St. Jude',
        },
        { id: 'd', label: 'When fees pile up to 100 SOL' },
      ],
      correctId: 'c',
      explanation:
        "When pump.fun creator fees are claimed, 25% routes through donate.gg - an arms-length service for crypto donations to verified charities - on to St. Jude. The Astroid project never custody-holds the funds. You can verify it on the charity page.",
    },
    {
      id: 'lore-free',
      prompt: 'Which of these costs money on astroid.space?',
      choices: [
        { id: 'a', label: 'Naming a star' },
        { id: 'b', label: 'Writing a wish' },
        { id: 'c', label: 'Sending in a coloring' },
        { id: 'd', label: 'None of these - they are all free' },
      ],
      correctId: 'd',
      explanation:
        'None of them cost anything. None require a wallet. That is on purpose - the kid stuff stays free and friendly, separate from anything to do with the token.',
    },
    {
      id: 'lore-dyor',
      prompt: 'What does DYOR stand for?',
      choices: [
        { id: 'a', label: "Don't You Own Robux" },
        { id: 'b', label: 'Do Your Own Research' },
        { id: 'c', label: 'Decide Your Own Risk' },
        { id: 'd', label: "Don't Yield Or Retreat" },
      ],
      correctId: 'b',
      explanation:
        "Do Your Own Research. It means: do not take a stranger's word for it - look it up yourself. The skill works for crypto, news, deals, anything. The three checks (URL spelling, contract address, would-a-grown-up-be-fine) are the kid version.",
    },
    {
      id: 'lore-partnership',
      prompt: 'Is Astroid partnered with St. Jude or ALSAC?',
      choices: [
        { id: 'a', label: 'Yes, sponsored partner' },
        { id: 'b', label: 'Yes, official endorsement' },
        {
          id: 'c',
          label:
            'No - donations are routed through donate.gg, a third-party service',
        },
        { id: 'd', label: 'Yes, but only the team knows about it' },
      ],
      correctId: 'c',
      explanation:
        'Astroid is NOT partnered with, sponsored by, or endorsed by St. Jude, ALSAC, or donate.gg. donate.gg is an arms-length service that delivers crypto donations to verified 501(c)(3) charities; the inclusion of St. Jude as the named beneficiary reflects donate.gg delivering funds to that charity, not a relationship with Astroid.',
    },
    {
      id: 'lore-split',
      prompt: 'How are pump.fun creator fees split for Astroid?',
      choices: [
        { id: 'a', label: '50% St. Jude / 50% project' },
        {
          id: 'b',
          label:
            '25% St. Jude (via donate.gg) / 10% future charity / 65% community + ops',
        },
        { id: 'c', label: '100% to St. Jude on every trade' },
        { id: 'd', label: '25% to charity / 75% to the team' },
      ],
      correctId: 'b',
      explanation:
        'The split is 25% / 10% / 65%. The 25% routes through donate.gg to St. Jude. The 10% sits in a separate wallet held for a future, community-nominated children\u2019s charity. The 65% funds project operations and community-voted activities.',
    },
    {
      id: 'lore-true-name',
      prompt: "What is a coin's true name on the blockchain?",
      choices: [
        { id: 'a', label: 'Its picture' },
        { id: 'b', label: 'Its ticker symbol (like $ASTROID)' },
        {
          id: 'c',
          label: 'Its contract address (a long string of letters and numbers)',
        },
        { id: 'd', label: 'Its description on pump.fun' },
      ],
      correctId: 'c',
      explanation:
        'The contract address is the only true identifier of a coin. Pictures, names, and tickers can be copied by anyone. Always verify the contract address from the project\'s real website.',
    },
    {
      id: 'lore-memecoin-risk',
      prompt: 'What is the most honest thing to say about $ASTROID?',
      choices: [
        { id: 'a', label: 'It is guaranteed to go up because it has a charity' },
        {
          id: 'b',
          label:
            'It is a memecoin - high-risk, very volatile, could go to zero',
        },
        { id: 'c', label: 'It is a regulated investment' },
        { id: 'd', label: 'It is the same as a stock' },
      ],
      correctId: 'b',
      explanation:
        '$ASTROID is a memecoin. Memecoins are high-risk, very volatile, and many go to zero. The charity routing is real and on-chain - but that does not change the risk of the coin itself. Naming a star is always free; that part needs no wallet.',
    },
  ],
};
