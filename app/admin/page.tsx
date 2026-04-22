/**
 * @fileoverview /admin
 *
 * Server component. If the visitor isn't authenticated, renders the token
 * entry form. If they are, renders the moderation Dashboard.
 *
 * Authentication: a session cookie set by POST /api/admin/login. The cookie
 * holds an HMAC of the admin token (not the token itself), so an XSS leak
 * doesn't expose the master credential.
 */

import { isAuthorizedServerComponent } from '../lib/adminAuth';
import { Dashboard } from './Dashboard';
import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'Moderation · Astroid',
  description: 'Internal moderation queue.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const authed = await isAuthorizedServerComponent();

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <div className="eyebrow mb-2">Internal</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Moderation
        </h1>
        <p className="text-white/60 mt-2 max-w-2xl">
          Review and approve everything visitors submit before it appears on
          the public site. Names, wishes, coloring submissions, charity
          nominations.
        </p>
      </div>

      {authed ? <Dashboard /> : <LoginForm />}
    </div>
  );
}
