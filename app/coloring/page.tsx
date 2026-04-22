import { ColoringStudio } from '../components/ColoringStudio';

export const metadata = {
  title: 'Color Astroid · Astroid',
  description:
    'Print Liv\'s drawing of Astroid the Space Shiba Inu, color it in, and send it back to be featured in the gallery.',
};

export default function ColoringPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center mb-12">
        <div className="eyebrow mb-3">Color the Space Shiba</div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
          Color Astroid.
        </h1>
        <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
          Print the original drawing and color it in, or make your own Astroid
          from scratch - then submit your version. We feature approved drawings
          in the gallery below.
        </p>
      </div>

      <ColoringStudio />

      <div className="mt-10 text-center text-xs font-mono text-white/30 tracking-widest uppercase">
        Human moderation · Only the artist&apos;s first name is shown · Max 1MB image
      </div>
    </div>
  );
}
