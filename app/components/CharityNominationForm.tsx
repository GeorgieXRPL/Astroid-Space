'use client';

import { useState } from 'react';
import { HONEYPOT_FIELD } from '../lib/honeypot';

export function CharityNominationForm() {
  const [charityName, setCharityName] = useState('');
  const [country, setCountry] = useState('');
  const [charityUrl, setCharityUrl] = useState('');
  const [reason, setReason] = useState('');
  const [nominatedBy, setNominatedBy] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setThanks(null);

    const trimmed = charityName.trim();
    if (trimmed.length < 2) {
      setError('Please enter a charity name.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/charity-nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charityName: trimmed,
          country: country.trim() || undefined,
          charityUrl: charityUrl.trim() || undefined,
          reason: reason.trim() || undefined,
          nominatedBy: nominatedBy.trim() || undefined,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data?.error ?? 'We could not record that nomination. Please try again.'
        );
        setSubmitting(false);
        return;
      }
      setThanks(data.message ?? 'Thank you. Your nomination is queued.');
      setCharityName('');
      setCountry('');
      setCharityUrl('');
      setReason('');
      setNominatedBy('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass-panel p-6 sm:p-8 space-y-5">
      {/* Honeypot - see lib/honeypot.ts */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden">
        <label htmlFor={`${HONEYPOT_FIELD}-nom`}>Website (leave empty)</label>
        <input
          id={`${HONEYPOT_FIELD}-nom`}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="nom-name" className="telemetry-label block mb-2">
          Charity name
        </label>
        <input
          id="nom-name"
          type="text"
          value={charityName}
          onChange={(e) => setCharityName(e.target.value)}
          placeholder="e.g. Heart Kids New Zealand"
          maxLength={120}
          required
          className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nom-country" className="telemetry-label block mb-2">
            Country <span className="text-white/30">(optional)</span>
          </label>
          <input
            id="nom-country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="New Zealand"
            maxLength={64}
            className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors"
          />
        </div>
        <div>
          <label htmlFor="nom-url" className="telemetry-label block mb-2">
            Website <span className="text-white/30">(optional)</span>
          </label>
          <input
            id="nom-url"
            type="url"
            value={charityUrl}
            onChange={(e) => setCharityUrl(e.target.value)}
            placeholder="https://..."
            maxLength={300}
            className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor="nom-reason" className="telemetry-label block mb-2">
          Why this charity? <span className="text-white/30">(optional)</span>
        </label>
        <textarea
          id="nom-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="A sentence or two about the work they do for kids."
          maxLength={280}
          rows={3}
          className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors resize-none"
        />
        <div className="mt-1.5 text-right text-xs text-white/40 font-mono tabular">
          {reason.length} / 280
        </div>
      </div>

      <div>
        <label htmlFor="nom-by" className="telemetry-label block mb-2">
          Your name <span className="text-white/30">(optional)</span>
        </label>
        <input
          id="nom-by"
          type="text"
          value={nominatedBy}
          onChange={(e) => setNominatedBy(e.target.value)}
          placeholder="A first name, a handle, or leave blank."
          maxLength={48}
          className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors"
        />
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
        <div className="text-xs text-white/40 font-mono leading-relaxed max-w-md">
          Reviewed by a human. Confirmed charities are considered as the
          recipient of the 10% future-charity wallet - only after recipient
          consent is obtained in writing.
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary disabled:opacity-50 shrink-0"
        >
          {submitting ? 'Sending…' : 'Nominate'}
        </button>
      </div>
    </form>
  );
}
