/**
 * @fileoverview Robots policy.
 *
 * The whole site is welcome in search engines except for the moderation
 * surface and the API. Hiding /admin from robots is hygiene, not security
 * - the cookie-protected backend is what actually keeps it private. The
 * proxy also sets X-Robots-Tag: noindex on those paths as belt-and-braces.
 */

import type { MetadataRoute } from 'next';
import { siteConfig } from './lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/admin', '/api/admin/'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
