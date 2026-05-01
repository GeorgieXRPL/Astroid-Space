/**
 * @fileoverview Real or Scam? - 12-card pool.
 *
 * Each card is a short, platform-neutral message of the kind kids and
 * grown-ups encounter online. The player decides if it's a normal/safe
 * thing to read, or a scam pattern.
 *
 * Authoring rules:
 *   - No clickable links, QR codes, contract addresses, or wallet
 *     prompts in the body. The page teaches pattern recognition,
 *     not bait-by-example.
 *   - No platform name-drops (Telegram/Discord/Robux/V-Bucks/etc.).
 *     Pick generic "from" labels so the lesson stays evergreen.
 *   - Keep the prose readable for a 9-12 year-old reading aloud.
 *   - Roughly 7 scams to 5 safes - scams are the lesson, but a quiz
 *     full of scams turns into a yes-button reflex test.
 *
 * Stable ids matter: changing one resets that question's rotation
 * history (it will appear again next round). Adding new questions is
 * always safe.
 */

import type { Quiz } from '../types';

export const REAL_OR_SCAM_QUIZ: Quiz = {
  slug: 'real-or-scam',
  title: 'Real or Scam?',
  tagline:
    'Three messages, three taps. Spot the trick before it tricks you.',
  description:
    'Five short messages. For each, decide whether it is something safe to read or a scam pattern - then read why. Pure pattern recognition. Nothing in this game asks you to click anything outside it.',
  category: 'brain',
  difficulty: 1,
  estMinutes: 2,
  roundSize: 5,
  pool: [
    {
      id: 'ros-seed-support',
      prelude: 'A stranger - direct message',
      prompt:
        'Hi! I work for crypto support. We noticed unusual activity on your wallet. To keep your funds safe, please paste your 12-word seed phrase here and our team will secure it for you.',
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: 'Looks safe' },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'scam',
      explanation:
        'No real support team will ever ask for a seed phrase. The seed phrase IS the wallet - whoever has it owns everything inside. Real support fixes problems without your seed. Always.',
    },
    {
      id: 'ros-grownup-in-person',
      prelude: 'A grown-up you live with - in person',
      prompt:
        'Before you click anything in that message, show me first. We will read it together and check the website address out loud.',
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: 'Looks safe' },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'safe',
      explanation:
        'Exactly right. A trusted adult, in person, slowing things down. Scams work by rushing you. Reading things out loud together breaks the spell.',
    },
    {
      id: 'ros-airdrop-popup',
      prelude: 'A pop-up - on a website',
      prompt:
        'CONGRATULATIONS! You have been selected for a 5 SOL airdrop. Connect your wallet within 10 minutes to claim, or you lose your spot forever.',
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: 'Looks safe' },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'scam',
      explanation:
        'Three red flags at once: a stranger giving you free money, a countdown to make you panic, and a "connect your wallet" prompt. Real giveaways do not work like this. None of them.',
    },
    {
      id: 'ros-friend-hacked',
      prelude: "A friend's account - sudden message",
      prompt:
        "Bro you have to see this, I just got 100 SOL from this drop, here's the link, hurry it ends today!!",
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: 'Looks safe' },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'scam',
      explanation:
        'When a friend\'s account suddenly sends a "you have to see this" link with urgency, the friend\'s account has usually been hacked. Message them on a different channel, or in person, and ask if they really sent it. Almost always: no.',
    },
    {
      id: 'ros-handle-spoof',
      prelude: 'An account that looks official',
      prompt:
        'Hi this is the real Astroid team @Astr0id_Sol. We saw your post and want to send you a thank-you reward. Click the link in our bio to verify your wallet.',
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: 'Looks safe' },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'scam',
      explanation:
        'Look very carefully: the handle is "Astr0id" with a zero, not the letter O. Scammers copy the profile picture and bio of real accounts and change one character. "Verify your wallet" through a stranger\'s link is always how a wallet gets drained.',
    },
    {
      id: 'ros-doubling',
      prelude: 'A stranger - in a public chat',
      prompt:
        'Send me 1 SOL and I will send you 2 SOL back. Astroid Whale Verification Program, only first 50 people qualify.',
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: 'Looks safe' },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'scam',
      explanation:
        'Nobody on the internet is going to give you free money for sending them money first. This is one of the oldest scams there is - older than crypto. The blockchain just makes it easier for the scammer because there is no refund button.',
    },
    {
      id: 'ros-explorer-class',
      prelude: 'In class - with a teacher',
      prompt:
        "Today we are going to look up Astroid's charity wallet on a public block explorer. We won't connect any wallet or spend anything - we are just reading the public record.",
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: 'Looks safe' },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'safe',
      explanation:
        'Public block explorers (like Solscan) let anyone read transactions without an account, a wallet, or any spending. They are one of the safest hands-on ways to see how a blockchain works.',
    },
    {
      id: 'ros-wallet-warning',
      prelude: 'A wallet app - while signing',
      prompt:
        'Warning: this transaction grants the requesting site permission to spend ALL tokens in your wallet. Do you want to continue?',
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: "Safe - that's the wallet warning you" },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'safe',
      explanation:
        "The wallet itself isn't a scam - it's doing its job by warning you. The site asking for that permission almost always IS a scam. Stop, read the warning out loud with a grown-up, and almost always the right answer is to cancel.",
    },
    {
      id: 'ros-email-lock',
      prelude: 'An email - from "wallet support"',
      prompt:
        'Your wallet will be locked in 24 hours unless you confirm your account. Click the secure link below to keep your funds.',
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: 'Looks safe' },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'scam',
      explanation:
        'Crypto wallets do not have customer accounts to lock. There is no support team that emails you. This is a phishing email - the "secure link" leads to a fake page designed to steal your seed phrase.',
    },
    {
      id: 'ros-footer-address',
      prelude: 'On the project\'s real website',
      prompt:
        "The contract address for $ASTROID is shown in the footer of every page on astroid.space, with a Solscan link so anyone can verify it on the blockchain.",
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: 'Looks safe' },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'safe',
      explanation:
        "Real projects publish their contract address openly so people can verify it. If a project hides its address, or only shares it in DMs, that's the suspicious sign - not the other way around.",
    },
    {
      id: 'ros-pump-rush',
      prelude: 'A stranger - in a group chat',
      prompt:
        "GET IN NOW. New coin launching in 10 minutes. 100x guaranteed. DM me for the contract address before everyone finds out.",
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: 'Looks safe' },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'scam',
      explanation:
        'Three classic patterns: a guarantee that returns are huge (impossible), urgency to prevent thinking, and a "DM me secretly" hook. Anyone who guarantees a return on a coin is either lying or about to disappear with your money.',
    },
    {
      id: 'ros-read-aloud',
      prelude: 'A grown-up at home',
      prompt:
        "Let's read the website address out loud, slowly, before we click. astroid dot space - one s, no extra letters. Looks right.",
      promptStyle: 'quote',
      choices: [
        { id: 'safe', label: 'Looks safe' },
        { id: 'scam', label: "That's a scam" },
      ],
      correctId: 'safe',
      explanation:
        'Reading the address out loud, character by character, catches almost every fake-website scam. Most phishing sites change one letter or add an extra word - it slips past the eyes but not the ears.',
    },
  ],
};
