'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStarField, type Star, STAR_STYLES } from '../lib/stars';
import { rememberMyStar } from '../lib/myStars';
import { HONEYPOT_FIELD } from '../lib/honeypot';

interface NamingFormProps {
  /** Pre-selected designation if user came from a detail page */
  initialDesignation?: string;
}

export function NamingForm({ initialDesignation }: NamingFormProps) {
  const router = useRouter();
  const allStars = getStarField();

  const [namedSet, setNamedSet] = useState<Set<string>>(new Set());
  const [loadingNamed, setLoadingNamed] = useState(true);

  const [designation, setDesignation] = useState(initialDesignation ?? '');
  const [name, setName] = useState('');
  const [dedication, setDedication] = useState('');
  const [namedBy, setNamedBy] = useState('');
  // Honeypot - humans don't see this field. Bots fill anything that looks
  // like an input. Server rejects when this is non-empty.
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * We only auto-pick a random star once when the page loads without a
   * `?designation=` in the URL. If we ran that logic on every subsequent
   * effect run, `pickRandom` would change whenever `/api/stars` finished
   * loading (new `namedSet` → new callback identity) while `designation`
   * was briefly empty — and the STAR-xxxxx field would snap back,
   * feeling like “I can’t type my star name / code”.
   */
  const autoPickOnceEligible = useRef(!initialDesignation);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stars?limit=200')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setNamedSet(new Set(data.items.map((s: { designation: string }) => s.designation)));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingNamed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pickRandom = useCallback(() => {
    const available = allStars.filter((s) => !namedSet.has(s.id));
    if (available.length === 0) return;
    const random = available[Math.floor(Math.random() * available.length)];
    setDesignation(random.id);
  }, [allStars, namedSet]);

  useEffect(() => {
    if (loadingNamed) return;
    if (designation) return;
    if (!autoPickOnceEligible.current) return;
    pickRandom();
    autoPickOnceEligible.current = false;
  }, [designation, loadingNamed, pickRandom]);

  const selected: Star | undefined = allStars.find((s) => s.id === designation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!designation) {
      setError('Pick a star first.');
      return;
    }
    if (!name.trim()) {
      setError('Give your star a name.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/stars/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designation,
          name: name.trim(),
          dedication: dedication.trim() || undefined,
          namedBy: namedBy.trim() || undefined,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Naming failed. Please try again.');
        setSubmitting(false);
        return;
      }

      if (data?.namedStar) {
        rememberMyStar({
          designation: data.namedStar.designation,
          name: data.namedStar.name,
          claimToken: data.namedStar.claimToken,
          namedAt: data.namedStar.namedAt,
        });
      }

      setSuccess(designation);
      // Pass the claim token so the detail page can show the namer their
      // pending submission preview before the moderator approves.
      const claimParam = data?.namedStar?.claimToken
        ? `&claim=${encodeURIComponent(data.namedStar.claimToken)}`
        : '';
      setTimeout(() => {
        router.push(`/sky/${designation}?just-named=1${claimParam}`);
      }, 1100);
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  const styling = selected ? STAR_STYLES[selected.spectrum] : null;

  return (
    <form onSubmit={handleSubmit} className="glass-panel-bright p-6 sm:p-10 space-y-8">
      {/*
        Honeypot: visually and assistively hidden, but still a real input
        so naive bots fill it. Don't rename without updating HONEYPOT_FIELD.
      */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Website (leave empty)</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* Step 1: pick a star */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <label htmlFor="designation" className="telemetry-label">
            01 · Star
          </label>
          <button
            type="button"
            onClick={pickRandom}
            disabled={loadingNamed}
            className="text-xs font-mono text-cosmos hover:text-white transition-colors disabled:opacity-40"
          >
            ⟲ Pick random
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="designation"
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value.toUpperCase())}
            placeholder="STAR-00042"
            pattern="STAR-\d{5}"
            className="flex-1 bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white font-mono placeholder:text-white/30 outline-none transition-colors"
            required
          />
          <Link
            href="/sky"
            className="text-xs font-mono text-white/50 hover:text-white self-center sm:self-auto sm:px-4 sm:py-3"
          >
            Browse the sky →
          </Link>
        </div>

        {selected && styling && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/50 font-mono">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                background: styling.color,
                boxShadow: `0 0 8px ${styling.color}, 0 0 12px ${styling.emissive}80`,
              }}
            />
            <span>{styling.label}</span>
            <span>·</span>
            <span>
              X {selected.position[0].toFixed(2)} · Y {selected.position[1].toFixed(2)} · Z{' '}
              {selected.position[2].toFixed(2)}
            </span>
            {namedSet.has(selected.id) && (
              <>
                <span>·</span>
                <span className="text-ember">Already named</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Step 2: name */}
      <div>
        <label htmlFor="name" className="telemetry-label block mb-3">
          02 · Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. For Liv, Stella, Goldie's Star"
          maxLength={48}
          className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white text-lg placeholder:text-white/30 outline-none transition-colors"
          required
        />
        <div className="mt-1.5 flex justify-between text-xs text-white/40">
          <span>This is the name that will appear on the certificate.</span>
          <span className="font-mono tabular">{name.length} / 48</span>
        </div>
      </div>

      {/* Step 3: dedication (optional) */}
      <div>
        <label htmlFor="dedication" className="telemetry-label block mb-3">
          03 · Dedication <span className="text-white/30">(optional)</span>
        </label>
        <textarea
          id="dedication"
          value={dedication}
          onChange={(e) => setDedication(e.target.value)}
          placeholder="A short message - for someone special, in someone's memory, or just because."
          maxLength={140}
          rows={3}
          className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors resize-none"
        />
        <div className="mt-1.5 text-right text-xs text-white/40 font-mono tabular">
          {dedication.length} / 140
        </div>
      </div>

      {/* Step 4: who named it (optional) */}
      <div>
        <label htmlFor="namedBy" className="telemetry-label block mb-3">
          04 · Your name <span className="text-white/30">(optional)</span>
        </label>
        <input
          id="namedBy"
          type="text"
          value={namedBy}
          onChange={(e) => setNamedBy(e.target.value)}
          placeholder="A first name, a handle, or leave blank."
          maxLength={48}
          className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors"
        />
        <div className="mt-1.5 text-xs text-white/40">
          Shown publicly on the star&apos;s page. Leave blank if you&apos;d
          rather not sign your name.
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="px-4 py-3 rounded-md bg-ember/10 border border-ember/30 text-sm text-ember">
          {error}
        </div>
      )}

      {success && (
        <div className="px-4 py-3 rounded-md bg-cosmos/10 border border-cosmos/30 text-sm text-cosmos">
          ✓ Named. Generating your certificate…
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
        <div className="text-xs text-white/40 font-mono">
          Free · No account · Sign your name or leave it blank
        </div>
        <button
          type="submit"
          disabled={submitting || !!success}
          className="btn-primary disabled:opacity-50"
        >
          {submitting ? 'Naming…' : success ? 'Named ✓' : 'Name this star'}
        </button>
      </div>
    </form>
  );
}
