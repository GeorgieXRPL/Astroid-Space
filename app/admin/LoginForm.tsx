'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Login failed.');
        setSubmitting(false);
        return;
      }
      // Re-render the server component now that the cookie is set.
      router.refresh();
    } catch {
      setError('Network error.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass-panel-bright p-8 max-w-md space-y-5">
      <div>
        <label htmlFor="admin-token" className="telemetry-label block mb-3">
          Admin token
        </label>
        <input
          id="admin-token"
          type="password"
          autoComplete="current-password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          minLength={16}
          className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white font-mono outline-none transition-colors"
        />
        <p className="text-xs text-white/40 mt-2">
          The value of the <code className="text-cosmos">ADMIN_TOKEN</code>{' '}
          environment variable. The session lasts 12 hours.
        </p>
      </div>
      {error && (
        <div className="px-4 py-3 rounded-md bg-ember/10 border border-ember/30 text-sm text-ember">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary disabled:opacity-50 w-full justify-center"
      >
        {submitting ? 'Verifying…' : 'Sign in'}
      </button>
    </form>
  );
}
