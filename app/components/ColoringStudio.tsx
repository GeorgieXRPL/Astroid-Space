'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { HONEYPOT_FIELD } from '../lib/honeypot';

interface Submission {
  id: string;
  artistName: string;
  age?: number;
  imageDataUrl: string;
  createdAt: string;
}

const MAX_BYTES = 1_000_000; // 1 MB

export function ColoringStudio() {
  const [gallery, setGallery] = useState<Submission[] | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [artistName, setArtistName] = useState('');
  const [age, setAge] = useState<string>('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/coloring?limit=24')
      .then((r) => r.json())
      .then((data) => setGallery(data.items ?? []))
      .catch(() => setGallery([]));
  }, []);

  const onPickFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError('That image is over 1MB. Try a smaller one.');
      return;
    }
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      setError('Please pick a PNG, JPEG, or WebP image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.onerror = () => setError('Could not read that file.');
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setThanks(null);
    if (!preview) {
      setError('Pick a photo of your colored Astroid first.');
      return;
    }
    if (!artistName.trim()) {
      setError('Tell us the artist\u2019s first name.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/coloring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: artistName.trim(),
          age: age ? Number(age) : undefined,
          imageDataUrl: preview,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'We could not save that submission. Please try again.');
        setSubmitting(false);
        return;
      }
      setThanks(data.message ?? 'Thank you. Your drawing is queued.');
      setPreview(null);
      setArtistName('');
      setAge('');
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Print + Submit */}
      <div className="grid lg:grid-cols-2 gap-6 mb-12">
        {/* Print */}
        <div className="glass-panel p-6 sm:p-8">
          <div className="eyebrow mb-3">Step 1 · Print</div>
          <h2 className="font-display text-2xl text-white mb-3">
            Get the coloring page
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-5">
            Open the original drawing at full size, then print it on regular paper.
            Crayons, markers, paint — anything goes.
          </p>
          <div className="kid-art-frame max-w-xs mx-auto mb-5">
            <Image
              src="/liv-drawing.jpg"
              alt="Astroid the Space Shiba Inu, drawn by Liv — the coloring template"
              width={400}
              height={520}
              className="w-full h-auto rounded-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="/liv-drawing.jpg"
              target="_blank"
              rel="noopener noreferrer"
              download="astroid-coloring-page.jpg"
              className="btn-primary"
            >
              Download the page
              <span aria-hidden>↓</span>
            </a>
            <a
              href="/liv-drawing.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Open big
              <span aria-hidden>↗</span>
            </a>
          </div>
        </div>

        {/* Submit */}
        <form onSubmit={submit} className="glass-panel-bright p-6 sm:p-8 space-y-5">
          {/* Honeypot — see lib/honeypot.ts */}
          <div aria-hidden="true" className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden">
            <label htmlFor={`${HONEYPOT_FIELD}-coloring`}>Website (leave empty)</label>
            <input
              id={`${HONEYPOT_FIELD}-coloring`}
              name={HONEYPOT_FIELD}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
          <div className="eyebrow">Step 2 · Send it back</div>
          <h2 className="font-display text-2xl text-white">Submit your version</h2>

          <div>
            <label htmlFor="art-file" className="telemetry-label block mb-3">
              Photo of your colored Astroid
            </label>
            <input
              ref={fileRef}
              id="art-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => onPickFile(e.target.files?.[0])}
              className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-cosmos/40 file:bg-cosmos/10 file:text-cosmos file:cursor-pointer file:text-xs file:font-mono file:uppercase file:tracking-widest hover:file:bg-cosmos/20"
            />
            {preview && (
              <div className="mt-4 relative aspect-square w-40 mx-auto rounded-md overflow-hidden border border-white/10">
                {/* Preview a data URL — next/image refuses data URLs, use img */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Your drawing preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="artist-name" className="telemetry-label block mb-3">
              Artist first name
            </label>
            <input
              id="artist-name"
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="e.g. Liv"
              maxLength={48}
              className="w-full bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="artist-age" className="telemetry-label block mb-3">
              Age <span className="text-white/30">(optional)</span>
            </label>
            <input
              id="artist-age"
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="—"
              className="w-32 bg-space-950 border border-white/10 focus:border-cosmos rounded-md px-4 py-3 text-white placeholder:text-white/30 outline-none transition-colors font-mono"
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

          <div className="flex justify-end pt-3 border-t border-white/5">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Submit my drawing'}
            </button>
          </div>
        </form>
      </div>

      {/* Gallery */}
      <div className="section-divider mb-6">The gallery</div>
      {gallery === null ? (
        <div className="glass-panel p-12 text-center text-white/40">
          Loading the gallery…
        </div>
      ) : gallery.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <div className="text-4xl mb-3 opacity-50">✦</div>
          <p className="text-white/60 max-w-md mx-auto">
            No drawings have been approved yet. Be the first to color in Astroid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((g) => (
            <GalleryCard key={g.id} submission={g} />
          ))}
        </div>
      )}
    </>
  );
}

function GalleryCard({ submission }: { submission: Submission }) {
  return (
    <div className="glass-panel p-3 hover:border-cosmos/40 transition-colors">
      <div className="aspect-square rounded-md overflow-hidden bg-space-950 mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={submission.imageDataUrl}
          alt={`Colored Astroid by ${submission.artistName}`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="px-1">
        <div className="text-sm text-white truncate">{submission.artistName}</div>
        <div className="text-xs font-mono text-white/40">
          {submission.age ? `age ${submission.age}` : 'artist'}
        </div>
      </div>
    </div>
  );
}
