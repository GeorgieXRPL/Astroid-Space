import Link from 'next/link';
import { FRIENDS, FRIEND_CATEGORY_LABELS, type FriendCategory } from '../lib/friends';

export const metadata = {
  title: 'Friends Across the Sky',
  description:
    'We\'re Astroid (starlike). We celebrate Liv\'s original artwork of Astroid and every other project pointing kids at the stars. Different journeys, same sky.',
};

export default function FriendsPage() {
  // Group by category, preserving order
  const grouped = FRIENDS.reduce<Record<FriendCategory, typeof FRIENDS>>(
    (acc, f) => {
      (acc[f.category] ??= []).push(f);
      return acc;
    },
    {} as Record<FriendCategory, typeof FRIENDS>
  );

  const orderedCategories: FriendCategory[] = [
    'space-science',
    'kids-charity',
    'memecoin-good',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center mb-16">
        <div className="eyebrow mb-3">Friends across the sky</div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
          We&apos;re Astroid <span className="text-white/50">- starlike.</span>
        </h1>
        <p className="text-white/60 max-w-2xl mx-auto leading-relaxed text-lg">
          We celebrate Liv&apos;s original artwork of Astroid, and every other
          project - large or small - pointing kids at the stars. Different
          journeys, same sky.
        </p>
      </div>

      {/* Manifesto callout */}
      <div className="glass-panel-bright p-8 mb-16">
        <div className="eyebrow mb-3">A note on names</div>
        <p className="text-white/80 leading-relaxed mb-4">
          The word <em className="not-italic text-white">Astroid</em> comes from Greek{' '}
          <em>ἀστήρ</em> (star) + <em>-οειδής</em> (-like). It means{' '}
          <strong className="text-white">starlike</strong>. We chose it because Liv&apos;s
          drawing of a Space Shiba Inu felt like a star: small, distant, and somehow
          carrying everything you point at it.
        </p>
        <p className="text-white/80 leading-relaxed">
          We are the Astroid community - and we came first. We share the sky with
          the asteroid plushie, Asteroid Protocol, and the other asteroid projects
          out there. Different rocks, same orbit - we send them love.
        </p>
      </div>

      {/* Federation grid */}
      {orderedCategories.map((category) => {
        const friends = grouped[category];
        if (!friends || friends.length === 0) return null;
        return (
          <section key={category} className="mb-12">
            <div className="section-divider mb-6">
              {FRIEND_CATEGORY_LABELS[category]}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {friends.map((friend) => {
                const cardKey = friend.url ?? friend.name;
                const inner = (
                  <div className="flex items-start gap-4">
                    <div
                      className={`text-3xl shrink-0 leading-none ${
                        friend.url ? 'text-cosmos' : 'text-white/30'
                      }`}
                    >
                      {friend.marker}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <h3
                          className={`font-display text-lg ${
                            friend.url
                              ? 'text-white group-hover:text-cosmos transition-colors'
                              : 'text-white/70'
                          }`}
                        >
                          {friend.name}
                        </h3>
                        {friend.status && (
                          <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase whitespace-nowrap">
                            {friend.status}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm leading-relaxed mb-3 ${
                          friend.url ? 'text-white/60' : 'text-white/45'
                        }`}
                      >
                        {friend.blurb}
                      </p>
                      {friend.url ? (
                        <span className="text-xs font-mono text-cosmos/70 group-hover:text-cosmos transition-colors">
                          Visit ↗
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-white/30 tracking-widest uppercase">
                          Placeholder
                        </span>
                      )}
                    </div>
                  </div>
                );

                if (friend.url) {
                  return (
                    <a
                      key={cardKey}
                      href={friend.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-panel p-6 group hover:border-cosmos/40 transition-colors block"
                    >
                      {inner}
                    </a>
                  );
                }
                return (
                  <div
                    key={cardKey}
                    className="glass-panel p-6 border-dashed border-white/10"
                  >
                    {inner}
                  </div>
                );
              })}
              {category === 'kids-charity' && (
                <Link
                  href="/charity#nominate"
                  className="glass-panel p-6 border-dashed border-white/10 flex items-start gap-4 hover:border-cosmos/40 transition-colors group"
                >
                  <div className="text-3xl text-white/30 group-hover:text-cosmos transition-colors shrink-0 leading-none">
                    {'\u2026'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg text-white/60 group-hover:text-white transition-colors mb-1">
                      More coming soon
                    </h3>
                    <p className="text-sm text-white/40 leading-relaxed mb-3">
                      We&apos;re reaching out to more children&apos;s charities -
                      nominated by the community - for permission to receive
                      on-chain donations. Suggest one and we&apos;ll do the
                      outreach.
                    </p>
                    <span className="text-xs font-mono text-cosmos/70 group-hover:text-cosmos transition-colors">
                      Nominate one ↗
                    </span>
                  </div>
                </Link>
              )}
            </div>
          </section>
        );
      })}

      {/* Submit your project */}
      <div className="glass-panel p-8 mt-16 text-center">
        <div className="eyebrow mb-3">Want to be on this page?</div>
        <h2 className="font-display text-2xl text-white tracking-tight mb-3">
          Send us a hello.
        </h2>
        <p className="text-white/60 max-w-md mx-auto mb-6 text-sm leading-relaxed">
          We add space-adjacent projects, children&apos;s charities, and memecoins
          actually doing good. Reach out on X or open a PR on the repo.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/about" className="btn-secondary">
            Read our story
          </Link>
        </div>
      </div>
    </div>
  );
}
