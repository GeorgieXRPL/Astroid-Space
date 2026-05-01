/**
 * @fileoverview Public sitemap.
 *
 * Lists every reader-facing route. The /admin surface is intentionally
 * absent - see app/robots.ts.
 *
 * Star detail pages (`/sky/[designation]`) are intentionally NOT enumerated
 * here: there are 200 procedurally-generated stars and exposing them all in
 * the sitemap would (a) flood crawlers with thin pages and (b) make
 * unnamed stars feel like they "belong" to a page they don't really need
 * indexed. Crawlers will still discover them via /sky.
 */

import type { MetadataRoute } from 'next';
import { siteConfig } from './lib/config';
import { getAllSlugs } from './lib/games/registry';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = siteConfig.url;
  const routes: Array<{ path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }> = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/name-a-star', priority: 0.9, changeFrequency: 'daily' },
    { path: '/sky', priority: 0.9, changeFrequency: 'daily' },
    { path: '/wishes', priority: 0.7, changeFrequency: 'daily' },
    { path: '/coloring', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/charity', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/games', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/friends', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
    // Per-game pages enumerated from the registry so adding a new game
    // automatically updates the sitemap with no extra wiring.
    ...getAllSlugs().map((slug) => ({
      path: `/games/${slug}`,
      priority: 0.6,
      changeFrequency: 'monthly' as const,
    })),
  ];

  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
