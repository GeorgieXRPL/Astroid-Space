'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/name-a-star', label: 'Name a star' },
  { href: '/sky', label: 'The Sky' },
  { href: '/wishes', label: 'Wishes' },
  { href: '/coloring', label: 'Color' },
  { href: '/charity', label: 'Charity' },
  { href: '/friends', label: 'Friends' },
  { href: '/about', label: 'About' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-space-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-cosmos via-space-500 to-space-900 ring-1 ring-cosmos/40 group-hover:ring-cosmos transition-all">
              <div className="absolute inset-0.5 rounded-full bg-space-900 flex items-center justify-center text-[10px] font-mono font-bold text-cosmos">
                A
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-semibold tracking-tight text-white">
                  Astroid
                </span>
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.18em] text-ember/90 border border-ember/40 rounded px-1.5 py-[1px] leading-none"
                  title="Beta — site is still being worked on"
                >
                  beta
                </span>
              </div>
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-cosmos/70 mt-0.5">
                For Liv · starlike
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    active
                      ? 'text-white bg-white/5'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/name-a-star" className="btn-primary text-xs px-4 py-1.5 hidden sm:inline-flex">
              Name a star
            </Link>
          </div>
        </div>

        {/* Mobile / tablet nav */}
        <nav className="lg:hidden flex items-center gap-1 -mt-1 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-xs whitespace-nowrap rounded-md transition-colors ${
                  active
                    ? 'text-white bg-white/5'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
