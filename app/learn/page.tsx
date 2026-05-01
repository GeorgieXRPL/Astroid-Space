import Link from 'next/link';
import { RealOrScam } from '../components/learn/RealOrScam';
import { siteConfig } from '../lib/config';

export const metadata = {
  title: 'Space School',
  description:
    'A short, classroom-friendly guide to blockchain, wallets, and Doing Your Own Research - written to be read aloud by a grown-up and a kid together. Six lessons, plain language, no buy buttons.',
};

export default function LearnPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* ==================== HEADER ==================== */}
      <div className="text-center mb-12">
        <div className="eyebrow mb-3">
          Space School · designed to read together
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
          Blockchain, <span className="text-white/50">in plain English.</span>
        </h1>
        <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
          Six short lessons. No jargon, no buy buttons, no hype. Built for a
          grown-up and a child to read aloud, one lesson at a time, with a
          discussion prompt at the end of each.
        </p>
      </div>

      {/* ==================== HOW TO USE ==================== */}
      <section className="glass-panel-bright p-6 sm:p-8 mb-12">
        <div className="eyebrow mb-3">For the grown-up reading first</div>
        <h2 className="font-display text-2xl text-white tracking-tight mb-3">
          A 20-minute mini-curriculum.
        </h2>
        <p className="text-white/75 leading-relaxed mb-4">
          Blockchain is starting to appear in school curricula in New Zealand
          and elsewhere - alongside coding, online safety, and digital
          citizenship. This page is a starting point you can use at the
          kitchen table, in a classroom, or as homework reading.
        </p>
        <ul className="grid sm:grid-cols-3 gap-3 text-sm">
          <li className="rounded-lg border border-white/10 p-4">
            <div className="telemetry-label mb-1.5">01 · Read aloud</div>
            <div className="text-white/70 leading-relaxed">
              One lesson per sitting. Take turns reading paragraphs.
            </div>
          </li>
          <li className="rounded-lg border border-white/10 p-4">
            <div className="telemetry-label mb-1.5">02 · Pause &amp; ask</div>
            <div className="text-white/70 leading-relaxed">
              Use the &ldquo;Try this together&rdquo; prompt at the end of
              each lesson.
            </div>
          </li>
          <li className="rounded-lg border border-white/10 p-4">
            <div className="telemetry-label mb-1.5">03 · No clicking alone</div>
            <div className="text-white/70 leading-relaxed">
              Anything involving a real wallet stays an adult-supervised
              activity.
            </div>
          </li>
        </ul>
      </section>

      {/* ==================== LESSONS ==================== */}
      <section className="space-y-6 mb-16">
        <div className="section-divider">Six lessons</div>

        <Lesson
          n="01"
          title="What is a blockchain?"
          analogy="A shared notebook the whole class can read."
          tryThis="Imagine your class kept one shared notebook on the teacher's desk. Every entry is signed by the writer, and once written it can never be erased - only added to. If a student tried to sneak back and change page 3, the rest of the class would notice. That is, almost exactly, what a blockchain does. What jobs would that notebook be useful for?"
        >
          <p>
            A blockchain is a list of records - usually transactions - kept
            on thousands of computers around the world at the same time.
            Each new record is added to the end and stamped with a code
            that depends on every record before it.
          </p>
          <p>
            Because so many people hold a copy at once, you cannot quietly
            edit an old record without everyone&apos;s copy disagreeing.
            That&apos;s the trick that makes blockchains hard to fake. It
            replaces &ldquo;trust the bank, the company, or the website&rdquo;
            with &ldquo;trust the math.&rdquo;
          </p>
        </Lesson>

        <Lesson
          n="02"
          title="What is a coin or token?"
          analogy="A row in the shared notebook with your name on it."
        tryThis="Name three digital things people already 'own' without holding them in their hands - a high score, an in-game skin, a username. How is a token similar? How is it different?"
        >
          <p>
            A crypto coin or token is just an entry on the blockchain that
            says &ldquo;this much of this thing belongs to that wallet.&rdquo;
            That&apos;s the whole idea. The famous names you see online -
            Bitcoin, Ethereum, Solana - are different blockchains.
            $ASTROID is a token that lives on top of one of them (Solana).
          </p>
          <p>
            The name and the picture you see are just a sticker. The real
            identifier is a long string of letters and numbers called a{' '}
            <strong className="text-white">contract address</strong>. We come
            back to that in lesson 5 - it matters more than the sticker.
          </p>
        </Lesson>

        <Lesson
          n="03"
          title="What is a wallet?"
          analogy="A keychain only you have a copy of."
          tryThis="If your house key gets copied without you knowing, the door doesn't change - but who can open it does. Why is the same true for a crypto wallet? What's a sensible place to keep a key? A bad place?"
        >
          <p>
            A crypto wallet doesn&apos;t hold your coins like a real wallet
            holds dollars. Your coins live on the blockchain. The wallet
            holds the{' '}
            <strong className="text-white">key</strong>{' '}
            that proves the entries on the blockchain belong to you.
          </p>
          <p>
            Lose the key and the coins are still on the blockchain - you
            just can&apos;t move them anymore. Hand the key to someone else
            and, from the blockchain&apos;s point of view, the coins now
            belong to them. The blockchain doesn&apos;t care whether the
            key was given, copied, stolen, or tricked out of you. It only
            looks at who has the key right now.
          </p>
        </Lesson>

        <Lesson
          n="04"
          title="The 12 magic words"
          analogy="A backup of the key, written in human-readable form."
          tryThis="Write a fake 12-word phrase together (any random words). Now imagine you posted it as a screenshot. Within minutes, anyone in the world could rebuild that wallet on their own device. Where, in your home, would the safest place to write the real one be?"
        >
          <p>
            When a new wallet is created, the app shows 12 (sometimes 24)
            random words. These are called a{' '}
            <strong className="text-white">seed phrase</strong>. They are
            not a password - they are the wallet itself, written in a form
            humans can copy by hand. Anyone who sees them can recreate the
            wallet on their own phone, instantly, anywhere in the world.
          </p>
          <p className="text-white">The single most important rule in crypto:</p>
          <ul className="list-disc list-inside space-y-1 marker:text-ember text-white/85">
            <li>
              Never type a seed phrase into a website. For any reason. Ever.
            </li>
            <li>
              Never send it in a chat, email, screenshot, or photo.
            </li>
            <li>
              No real support team, real app, or real wallet ever asks for
              it. If something asks, it is a scam. There is no exception.
            </li>
          </ul>
          <p>
            Treat the seed phrase the same way an adult would treat the
            backup keys to a safe: written on paper, stored somewhere
            private, never photographed.
          </p>
        </Lesson>

        <Lesson
          n="05"
          title="Knowing what's real"
          analogy="A coin's true name is its contract address."
        tryThis="Open a search engine and look up a popular phone or sneaker. Find a real product page and a knockoff one. What gives the fake away? Now apply the same instinct to a coin you've heard of."
        >
          <p>
            Anyone in the world can create a new coin in about thirty
            seconds. People who want to trick others do this constantly:
            they make a fake coin with the same picture and name as a
            popular one, and put it in front of you hoping you won&apos;t
            check.
          </p>
          <p>
            The way to tell them apart is to find the{' '}
            <strong className="text-white">contract address</strong>{' '}
            on the project&apos;s real website (for us, it&apos;s in the
            footer of every page) and compare it character-by-character to
            the one you&apos;re looking at. If even one letter is different,
            it is a different coin. The picture is irrelevant. The name is
            irrelevant. Only the address is real.
          </p>
          <p>
            The same idea applies to websites. Read the address bar out
            loud, slowly. <span className="font-mono text-ember">astrold.space</span>{' '}
            and <span className="font-mono text-cosmos">astroid.space</span>{' '}
            look almost identical - but one of them isn&apos;t us.
          </p>
        </Lesson>

        <Lesson
          n="06"
          title="DYOR - a digital literacy skill"
          analogy="Three checks before you click anything."
          tryThis="Pick any link from a recent message or email - even a normal one. Run the three checks together. Did anything stand out? The point isn't to find a scam every time. It's to make the checks automatic."
        >
          <p>
            DYOR stands for{' '}
            <strong className="text-white">Do Your Own Research</strong>.
            You&apos;ll see it everywhere in crypto. It really just means:
            don&apos;t take a stranger&apos;s word for it; look it up
            yourself. The same skill works for any link, any news headline,
            any &ldquo;limited-time offer.&rdquo;
          </p>
          <p>For a kid (or a careful grown-up), the three checks are:</p>
          <ol className="space-y-3 pl-1">
            <li className="flex gap-3">
              <span className="font-mono text-cosmos shrink-0 w-6">①</span>
              <span>
                <strong className="text-white">Is the web address spelled right?</strong>{' '}
                Read it out loud, character by character. Most fakes are
                caught here.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-cosmos shrink-0 w-6">②</span>
              <span>
                <strong className="text-white">Does the contract address match?</strong>{' '}
                Find the real one on the project&apos;s real website.
                Compare the first four and last four characters. If they
                don&apos;t match exactly, walk away.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-cosmos shrink-0 w-6">③</span>
              <span>
                <strong className="text-white">Would a grown-up be fine with this?</strong>{' '}
                If the honest answer involves hiding it, lying about your
                age, or doing it before they get home - the answer is no.
                That&apos;s a friendship-with-yourself question. Be honest.
              </span>
            </li>
          </ol>
        </Lesson>
      </section>

      {/* ==================== INTERACTIVE: REAL OR SCAM ==================== */}
      <section className="mb-16">
        <div className="section-divider mb-6">Practice</div>
        <div className="glass-panel-bright p-6 sm:p-8">
          <RealOrScam />
        </div>
      </section>

      {/* ==================== GLOSSARY ==================== */}
      <section className="mb-16">
        <div className="section-divider mb-6">Tiny glossary</div>
        <div className="glass-panel p-6 sm:p-8">
          <p className="text-sm text-white/55 mb-5 leading-relaxed">
            Words you&apos;ll see online, in one sentence each. None of these
            are advice - they&apos;re translations.
          </p>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
            <Term
              word="Blockchain"
              meaning="A shared list of records, kept on many computers at once, that anyone can read and nobody can secretly edit."
            />
            <Term
              word="Wallet"
              meaning="An app that holds the key proving certain blockchain entries belong to you. Not where the coins live."
            />
            <Term
              word="Seed phrase"
              meaning="The 12 (or 24) words that ARE your wallet. Anyone with them owns everything inside. Never share."
            />
            <Term
              word="Contract address"
              meaning="The true, unique identifier of a coin or app on a blockchain. Always check it - the picture and name can be faked."
            />
            <Term
              word="Gas"
              meaning="The small fee you pay the network to record a transaction. Like postage."
            />
            <Term
              word="Mint"
              meaning="To create a new coin or NFT. Costs gas. Doesn't mean it's worth anything."
            />
            <Term
              word="Airdrop"
              meaning="When a project sends free tokens to wallets. Real ones happen. Most 'airdrop' messages from strangers are scams."
            />
            <Term
              word="Memecoin"
              meaning="A coin built around a joke or character. Often very high risk. Often go to zero. Treat as entertainment, never savings."
            />
            <Term
              word="Rug / rug-pull"
              meaning="When the makers of a coin take the money and disappear. Common. Assume it can happen until proven otherwise."
            />
            <Term
              word="FOMO"
              meaning="Fear Of Missing Out. The feeling scams use to make you act fast. Spotting it in yourself is a real skill."
            />
          </dl>
        </div>
      </section>

      {/* ==================== TAKEAWAYS ==================== */}
      <section className="mb-16 glass-panel p-6 sm:p-8 border-cosmos/15">
        <div className="eyebrow mb-3">If you remember nothing else</div>
        <ul className="space-y-3 text-white/80 leading-relaxed">
          <li className="flex gap-3">
            <span className="text-cosmos font-mono pt-0.5 shrink-0">★</span>
            <span>
              The blockchain is a shared notebook. Trust the math, not the
              messenger.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-cosmos font-mono pt-0.5 shrink-0">★</span>
            <span>
              The seed phrase is the wallet. It goes in nothing online.
              Ever.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-cosmos font-mono pt-0.5 shrink-0">★</span>
            <span>
              The contract address is a coin&apos;s true name. Always check it.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-cosmos font-mono pt-0.5 shrink-0">★</span>
            <span>
              The three DYOR checks beat almost every trick: spell the URL,
              match the address, ask a grown-up.
            </span>
          </li>
        </ul>
      </section>

      {/* ==================== ABOUT ASTROID HONEST ==================== */}
      <section className="mb-16 glass-panel-bright p-6 sm:p-8">
        <div className="eyebrow mb-3">And honestly, about Astroid itself</div>
        <p className="text-white/75 leading-relaxed mb-3">
          Astroid was built in honor of Liv. 25% of trading fees auto-route
          on-chain to a wallet for St. Jude - you can verify it on the{' '}
          <Link href="/charity" className="text-cosmos hover:text-white">
            charity page
          </Link>
          . That part is real and verifiable.
        </p>
        <p className="text-white/75 leading-relaxed mb-3">
          $ASTROID itself is still a memecoin. High-risk, very volatile, and
          could go to zero like any memecoin. Naming a star is{' '}
          <strong className="text-white">free</strong>. Writing a wish is
          free. Coloring is free. None of those need a wallet, ever. Buying
          $ASTROID is a separate decision adults make with money they can
          afford to lose.
        </p>
        <p className="text-white/60 leading-relaxed text-sm">
          Apply the three DYOR checks above to <em>us</em>, too. That&apos;s
          the whole point - the rules don&apos;t change just because you
          like the mascot.
        </p>
      </section>

      {/* ==================== FOR GROWN-UPS & TEACHERS ==================== */}
      <section className="mb-16 glass-panel p-6 sm:p-8">
        <div className="eyebrow mb-3">For grown-ups and teachers</div>
        <p className="text-white/70 leading-relaxed text-sm mb-4">
          Notes, in case it&apos;s useful when extending these lessons:
        </p>
        <ul className="list-disc list-inside space-y-2 marker:text-cosmos text-white/70 text-sm leading-relaxed">
          <li>
            <strong className="text-white">Curriculum fit.</strong>{' '}
            Lessons 1-2 sit naturally alongside primary-level &ldquo;how
            the internet works&rdquo; topics. Lesson 6 (DYOR) is a
            transferable digital-literacy skill that long predates crypto.
          </li>
          <li>
            <strong className="text-white">Hands-on, safely.</strong>{' '}
            If a class wants to see a real blockchain, public block
            explorers (e.g. Solscan, Etherscan) let you read live
            transactions without a wallet, an account, or any spending.
            Look up the wallet on our{' '}
            <Link href="/charity" className="text-cosmos hover:text-white">
              charity page
            </Link>{' '}
            for a worked example.
          </li>
          <li>
            <strong className="text-white">Self-custody, later.</strong>{' '}
            Setting up a real wallet should be an adult-led activity. If
            you do, a fresh device or browser profile keeps it isolated;
            the seed phrase belongs on paper, stored somewhere fireproof,
            never photographed.
          </li>
          <li>
            <strong className="text-white">Age limits matter.</strong>{' '}
            Most crypto exchanges require users to be 18+. This page is
            education, not an invitation to trade.
          </li>
          <li>
            <strong className="text-white">Not advice.</strong>{' '}
            Anything here is educational, not financial, legal, or tax
            advice.
          </li>
        </ul>
      </section>

      {/* ==================== CTA ==================== */}
      <div className="text-center pt-4">
        <h2 className="font-display text-2xl sm:text-3xl text-white tracking-tight mb-4">
          That&apos;s Space School.
        </h2>
        <p className="text-white/60 mb-8 max-w-md mx-auto">
          The free stuff is waiting. Name a star, write a wish, color
          Astroid - none of it touches a wallet.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/name-a-star" className="btn-primary">
            Name a star
            <span aria-hidden>→</span>
          </Link>
          <Link href="/charity" className="btn-secondary">
            See the live charity wallet
          </Link>
        </div>
        <div className="mt-10 text-xs font-mono text-white/35 tracking-widest uppercase">
          Questions, feedback, or want this as a printable handout? Write to{' '}
          <a
            href={`mailto:${siteConfig.emails.hello}`}
            className="text-white/50 hover:text-white"
          >
            {siteConfig.emails.hello}
          </a>
        </div>
      </div>
    </div>
  );
}

function Lesson({
  n,
  title,
  analogy,
  tryThis,
  children,
}: {
  n: string;
  title: string;
  analogy: string;
  tryThis: string;
  children: React.ReactNode;
}) {
  return (
    <article className="glass-panel p-6 sm:p-8">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-xs text-cosmos">{n}</span>
        <h3 className="font-display text-xl sm:text-2xl text-white tracking-tight">
          {title}
        </h3>
      </div>
      <p className="text-cosmos/80 italic font-display text-sm sm:text-base mb-4">
        {analogy}
      </p>
      <div className="space-y-3 text-white/75 leading-relaxed text-[15px]">
        {children}
      </div>
      <div className="mt-6 pt-5 border-t border-white/5">
        <div className="telemetry-label mb-2">Try this together</div>
        <p className="text-sm text-white/65 leading-relaxed">{tryThis}</p>
      </div>
    </article>
  );
}

function Term({ word, meaning }: { word: string; meaning: string }) {
  return (
    <div>
      <dt className="font-display text-white text-base mb-1">{word}</dt>
      <dd className="text-sm text-white/60 leading-relaxed">{meaning}</dd>
    </div>
  );
}
