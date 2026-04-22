import Link from 'next/link';
import { getStarByDesignation, STAR_STYLES } from '../lib/stars';

interface PublicNamedStar {
  designation: string;
  name: string;
  dedication?: string;
  namedBy?: string;
  namedAt: string;
}

interface StarCardProps {
  named: PublicNamedStar;
}

export function StarCard({ named }: StarCardProps) {
  const star = getStarByDesignation(named.designation);
  const style = star ? STAR_STYLES[star.spectrum] : null;

  const namedDate = new Date(named.namedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/sky/${named.designation}`}
      className="group glass-panel p-5 hover:border-cosmos/40 transition-colors block"
    >
      <div className="flex items-start gap-4">
        {/* Star visual: glowing dot */}
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full border border-white/10"
            style={{
              background: style
                ? `radial-gradient(circle at 50% 50%, #ffffff 0%, ${style.color} 35%, ${style.emissive} 100%)`
                : '#ffffff',
              boxShadow: `0 0 16px ${style?.color ?? '#ffffff'}80, 0 0 24px ${style?.emissive ?? '#00d4ff'}40`,
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] text-cosmos tracking-widest uppercase">
            {named.designation}
          </div>
          <div className="font-display text-lg text-white truncate group-hover:text-cosmos transition-colors">
            {named.name}
          </div>
          {named.dedication && (
            <div className="text-xs text-ember italic mt-1 truncate">
              &ldquo;{named.dedication}&rdquo;
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-white/40 font-mono">
            <span>{named.namedBy || 'A friend of Astroid'}</span>
            <span>·</span>
            <span>{namedDate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
