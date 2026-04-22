'use client';

/**
 * Admin moderation dashboard.
 *
 * Loads pending items for all four content types in parallel, lets the
 * moderator approve / reject each. Mutations re-fetch the affected queue
 * (rather than the whole dashboard) so the UI stays responsive.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { safeHref } from '../lib/safeHref';

type ModStatus = 'approved' | 'rejected';

interface PendingNamedStar {
  designation: string;
  name: string;
  dedication?: string;
  namedBy?: string;
  namedAt: string;
  suspicious?: boolean;
}
interface PendingWish {
  id: string;
  text: string;
  from?: string;
  createdAt: string;
}
interface PendingColoring {
  id: string;
  artistName: string;
  age?: number;
  imageDataUrl: string;
  createdAt: string;
}
interface PendingNomination {
  id: string;
  charityName: string;
  country?: string;
  charityUrl?: string;
  reason?: string;
  nominatedBy?: string;
  createdAt: string;
}
interface Counts {
  pending: number;
  approved: number;
  rejected: number;
}

interface Queue<T> {
  pending: T[] | null;
  counts: Counts | null;
  loading: boolean;
}

const emptyQueue = <T,>(): Queue<T> => ({ pending: null, counts: null, loading: false });

export function Dashboard() {
  const router = useRouter();
  const [stars, setStars] = useState<Queue<PendingNamedStar>>(emptyQueue());
  const [wishes, setWishes] = useState<Queue<PendingWish>>(emptyQueue());
  const [coloring, setColoring] = useState<Queue<PendingColoring>>(emptyQueue());
  const [nominations, setNominations] = useState<Queue<PendingNomination>>(emptyQueue());

  const fetchQueue = useCallback(async <T,>(
    url: string,
    setter: (q: Queue<T>) => void,
    extract: (data: { pending: T[]; counts: Counts }) => { pending: T[]; counts: Counts }
  ) => {
    setter({ pending: null, counts: null, loading: true });
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (res.status === 401) {
        // Cookie expired - bounce back to the login form.
        router.refresh();
        return;
      }
      const data = await res.json();
      const { pending, counts } = extract(data);
      setter({ pending, counts, loading: false });
    } catch {
      setter({ pending: [], counts: { pending: 0, approved: 0, rejected: 0 }, loading: false });
    }
  }, [router]);

  const refreshAll = useCallback(() => {
    fetchQueue<PendingNamedStar>('/api/stars/moderate', setStars, (d) => d);
    fetchQueue<PendingWish>('/api/wishes/moderate', setWishes, (d) => d);
    fetchQueue<PendingColoring>('/api/coloring/moderate', setColoring, (d) => d);
    fetchQueue<PendingNomination>('/api/charity-nominations/moderate', setNominations, (d) => d);
  }, [fetchQueue]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const moderate = async (
    url: string,
    body: object,
    refresh: () => void
  ) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.error ?? `Action failed (${res.status})`);
      return;
    }
    refresh();
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button onClick={refreshAll} className="btn-secondary text-xs">
          ⟲ Refresh all
        </button>
        <button onClick={logout} className="btn-secondary text-xs">
          Sign out
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Star names */}
        <QueuePanel
          title="Star names"
          counts={stars.counts}
          loading={stars.loading}
          empty="No pending star names."
          items={stars.pending}
          renderItem={(s) => (
            <div key={s.designation} className="glass-panel p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-display text-xl text-white">{s.name}</div>
                <code className="text-xs text-cosmos font-mono">{s.designation}</code>
              </div>
              {s.dedication && (
                <p className="text-sm text-ember italic leading-relaxed">
                  &ldquo;{s.dedication}&rdquo;
                </p>
              )}
              <div className="text-xs text-white/40 font-mono">
                - {s.namedBy || 'anonymous'} · {fmtDate(s.namedAt)}
                {s.suspicious && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-ember/10 border border-ember/30 text-ember normal-case">
                    flagged
                  </span>
                )}
              </div>
              <ApproveReject
                onApprove={() =>
                  moderate('/api/stars/moderate',
                    { designation: s.designation, status: 'approved' as ModStatus },
                    () => fetchQueue<PendingNamedStar>('/api/stars/moderate', setStars, (d) => d))
                }
                onReject={() =>
                  moderate('/api/stars/moderate',
                    { designation: s.designation, status: 'rejected' as ModStatus },
                    () => fetchQueue<PendingNamedStar>('/api/stars/moderate', setStars, (d) => d))
                }
              />
            </div>
          )}
        />

        {/* Wishes */}
        <QueuePanel
          title="Wishes"
          counts={wishes.counts}
          loading={wishes.loading}
          empty="No pending wishes."
          items={wishes.pending}
          renderItem={(w) => (
            <div key={w.id} className="glass-panel p-4 space-y-3">
              <p className="text-white/90 leading-relaxed">{w.text}</p>
              <div className="text-xs text-white/40 font-mono">
                - {w.from || 'anonymous'} · {fmtDate(w.createdAt)}
              </div>
              <ApproveReject
                onApprove={() =>
                  moderate('/api/wishes/moderate', { id: w.id, status: 'approved' as ModStatus },
                    () => fetchQueue<PendingWish>('/api/wishes/moderate', setWishes, (d) => d))
                }
                onReject={() =>
                  moderate('/api/wishes/moderate', { id: w.id, status: 'rejected' as ModStatus },
                    () => fetchQueue<PendingWish>('/api/wishes/moderate', setWishes, (d) => d))
                }
              />
            </div>
          )}
        />

        {/* Coloring submissions */}
        <QueuePanel
          title="Coloring submissions"
          counts={coloring.counts}
          loading={coloring.loading}
          empty="No pending drawings."
          items={coloring.pending}
          renderItem={(c) => (
            <div key={c.id} className="glass-panel p-4 space-y-3">
              <div className="aspect-square w-48 rounded-md overflow-hidden bg-space-950 border border-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imageDataUrl}
                  alt={`Drawing by ${c.artistName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-sm text-white">
                {c.artistName}
                {c.age != null && (
                  <span className="text-white/40 font-mono ml-2">age {c.age}</span>
                )}
              </div>
              <div className="text-xs text-white/40 font-mono">
                {fmtDate(c.createdAt)}
              </div>
              <ApproveReject
                onApprove={() =>
                  moderate('/api/coloring/moderate', { id: c.id, status: 'approved' as ModStatus },
                    () => fetchQueue<PendingColoring>('/api/coloring/moderate', setColoring, (d) => d))
                }
                onReject={() =>
                  moderate('/api/coloring/moderate', { id: c.id, status: 'rejected' as ModStatus },
                    () => fetchQueue<PendingColoring>('/api/coloring/moderate', setColoring, (d) => d))
                }
              />
            </div>
          )}
        />

        {/* Charity nominations */}
        <QueuePanel
          title="Charity nominations"
          counts={nominations.counts}
          loading={nominations.loading}
          empty="No pending nominations."
          items={nominations.pending}
          renderItem={(n) => (
            <div key={n.id} className="glass-panel p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="font-display text-lg text-white">{n.charityName}</div>
                {n.country && (
                  <span className="text-xs font-mono text-white/40">{n.country}</span>
                )}
              </div>
              {(() => {
                const url = safeHref(n.charityUrl);
                if (!url) {
                  return n.charityUrl ? (
                    <div className="text-xs text-rose-400 truncate" title="Unsafe URL - refusing to render as a link.">
                      ⚠ unsafe URL: {n.charityUrl}
                    </div>
                  ) : null;
                }
                return (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                    className="text-xs text-cosmos hover:text-white truncate block"
                  >
                    {url}
                  </a>
                );
              })()}
              {n.reason && (
                <p className="text-sm text-white/80 leading-relaxed">{n.reason}</p>
              )}
              <div className="text-xs text-white/40 font-mono">
                - {n.nominatedBy || 'anonymous'} · {fmtDate(n.createdAt)}
              </div>
              <ApproveReject
                onApprove={() =>
                  moderate('/api/charity-nominations/moderate',
                    { id: n.id, status: 'approved' as ModStatus },
                    () => fetchQueue<PendingNomination>('/api/charity-nominations/moderate', setNominations, (d) => d))
                }
                onReject={() =>
                  moderate('/api/charity-nominations/moderate',
                    { id: n.id, status: 'rejected' as ModStatus },
                    () => fetchQueue<PendingNomination>('/api/charity-nominations/moderate', setNominations, (d) => d))
                }
              />
            </div>
          )}
        />
      </div>
    </>
  );
}

interface QueuePanelProps<T> {
  title: string;
  counts: Counts | null;
  loading: boolean;
  items: T[] | null;
  empty: string;
  renderItem: (item: T) => React.ReactNode;
}

function QueuePanel<T>({ title, counts, loading, items, empty, renderItem }: QueuePanelProps<T>) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl text-white">{title}</h2>
        {counts && (
          <div className="text-xs font-mono text-white/40">
            <span className="text-ember">{counts.pending} pending</span>
            <span className="mx-2">·</span>
            <span className="text-cosmos">{counts.approved} approved</span>
            <span className="mx-2">·</span>
            <span className="text-white/40">{counts.rejected} rejected</span>
          </div>
        )}
      </div>
      {loading || items === null ? (
        <div className="glass-panel p-6 text-sm text-white/40">Loading…</div>
      ) : items.length === 0 ? (
        <div className="glass-panel p-6 text-sm text-white/40">{empty}</div>
      ) : (
        <div className="space-y-3">{items.map(renderItem)}</div>
      )}
    </section>
  );
}

function ApproveReject({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <div className="flex gap-2 pt-2 border-t border-white/5">
      <button onClick={onApprove} className="btn-primary text-xs">
        ✓ Approve
      </button>
      <button onClick={onReject} className="btn-secondary text-xs">
        ✕ Reject
      </button>
    </div>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
