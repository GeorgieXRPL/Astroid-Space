'use client';

import { useEffect, useState } from 'react';
import { HONEYPOT_FIELD } from '../lib/honeypot';

interface Wish {
  id: string;
  text: string;
  from?: string;
  createdAt: string;
}

export function WishWall() {
  const [wishes, setWishes] = useState<Wish[] | null>(null);

  const [text, setText] = useState('');
  const [from, setFrom] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/wishes?limit=60')
      .then((r) => r.json())
      .then((data) => setWishes(data.items ?? []))
      .catch(() => setWishes([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setThanks(null);

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setError('Your wish needs a few more words.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          from: from.trim() || undefined,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'We could not record that wish. Please try again.');
        setSubmitting(false);
        return;
      }
      setThanks(data.message ?? 'Thank you. Your wish is queued.');
      setText('');
      setFrom('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Submit form */}
      <form onSubmit={submit} className="glass-panel-bright p-6 sm:p-10 mb-10 space-y-6">
        {/* Honeypot — see lib/honeypot.ts */}
        <div aria-hidden="true" className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden">
          <label htmlFor={`${HONEYPOT_FIELD}-wish`}>Website (leave empty)</label>
          <input
            id={`${HONEYPOT_FIELD}-wish`}
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="wish-text" className="telemetry-label block mb-3">
            Your wish
          </label>
          <textarea
            id="wish-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A wish for someone you love. A wish for the world. A wish for an ordinary good day."
            maxLength={180}
            rows={3}
            className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white text-base placeholder:text-white/30 outline-none transition-colors resize-none"
            required
          />
          <div className="mt-1.5 text-right text-xs text-white/40 font-mono tabular">
            {text.length} / 180
          </div>
        </div>

        <div>
          <label htmlFor="wish-from" className="telemetry-label block mb-3">
            From <span className="text-white/30">(optional)</span>
          </label>
          <input
            id="wish-from"
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="A first name, a handle, or leave blank."
            maxLength={48}
            className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors"
          />
          <div className="mt-1.5 text-xs text-white/40">
            A first name, a handle, or leave blank if you&apos;d rather not
            sign your name.
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-md bg-ember/10 border border-ember/30 text-sm text-ember">
            {error}
          </div>
        )}
        {thanks && (
          <div className="px-4 py-3 rounded-md bg-cosmos/10 border border-cosmos/30 text-sm text-cosmos">
            ✓ {thanks}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
          <div className="text-xs text-white/40 font-mono">
            Reviewed by a human before it appears.
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Add my wish'}
          </button>
        </div>
      </form>

      {/* The wall */}
      <div className="section-divider mb-6">The wall</div>
      {wishes === null ? (
        <div className="glass-panel p-12 text-center text-white/40">
          Loading the wall…
        </div>
      ) : wishes.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <div className="text-4xl mb-3 opacity-50">✦</div>
          <p className="text-white/60 max-w-md mx-auto">
            No wishes have been approved yet. Be the first.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishes.map((w) => (
            <WishCard key={w.id} wish={w} />
          ))}
        </div>
      )}
    </>
  );
}

function WishCard({ wish }: { wish: Wish }) {
  const date = new Date(wish.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return (
    <div className="glass-panel p-5 flex flex-col gap-3 hover:border-cosmos/30 transition-colors">
      <div className="text-cosmos text-lg leading-none">✦</div>
      <p className="text-white/85 leading-relaxed">{wish.text}</p>
      <div className="text-xs text-white/40 font-mono mt-auto pt-2 border-t border-white/5">
        — {wish.from || 'A friend of Astroid'} · {date}
      </div>
    </div>
  );
}
