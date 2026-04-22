import { WishWall } from '../components/WishWall';

export const metadata = {
  title: 'Wish Wall · Astroid',
  description:
    'A short message — for someone, for the world, for nothing in particular. Light moderation, then your wish floats on the Astroid Wish Wall.',
};

export default function WishesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center mb-12">
        <div className="eyebrow mb-3">The Wish Wall</div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
          Make a wish.
        </h1>
        <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
          One sentence. For someone, for the world, for nothing in particular. Wishes
          are reviewed before they appear so the wall stays kind. No wallet, no
          account, no email needed.
        </p>
      </div>

      <WishWall />

      <div className="mt-10 text-center text-xs font-mono text-white/30 tracking-widest uppercase">
        Light moderation · No personal data stored · Wishes are public when approved
      </div>
    </div>
  );
}
