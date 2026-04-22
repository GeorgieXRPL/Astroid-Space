'use client';

import { useState } from 'react';
import { siteConfig, solscanAddress } from '../lib/config';

/**
 * Prominent on-page contract-address banner. Used on the home page so the CA
 * is the first thing visible after the hero, with a one-tap copy button and
 * outbound links to Solscan + pump.fun.
 *
 * Renders nothing if `NEXT_PUBLIC_TOKEN_MINT` is unset, so the section is
 * cleanly hidden until the env var is populated in production.
 *
 * Visually tuned to read as "this is the official address" — heavy mono
 * weight, generous spacing, no decorative noise. Copy feedback is inline so
 * the user never doubts the click landed.
 */
export function ContractBanner() {
  const [copied, setCopied] = useState(false);
  const mint = siteConfig.tokenMint;

  if (!mint) return null;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard write rejected (e.g. insecure context, blocked permission).
      // Users can still long-press / select-all manually.
    }
  };

  return (
    <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-2">
      <div className="glass-panel-bright p-5 sm:p-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-cosmos animate-pulse" />
          <span className="telemetry-label">Official contract · Solana mainnet</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-center">
          {/* Address — huge, selectable, copyable */}
          <button
            type="button"
            onClick={onCopy}
            title="Click to copy"
            aria-label={`Copy contract address ${mint} to clipboard`}
            className="group text-left font-mono text-sm sm:text-base lg:text-lg text-white break-all leading-relaxed hover:text-cosmos transition-colors cursor-copy select-all"
          >
            {mint}
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest rounded border border-cosmos/40 text-cosmos hover:bg-cosmos/15 hover:border-cosmos transition-colors min-w-[88px] text-center"
            >
              {copied ? '✓ Copied' : 'Copy CA'}
            </button>
            <a
              href={solscanAddress(mint)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest rounded border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-colors"
            >
              Solscan ↗
            </a>
            {siteConfig.pumpfunUrl && (
              <a
                href={siteConfig.pumpfunUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-mono uppercase tracking-widest rounded border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-colors"
              >
                pump.fun ↗
              </a>
            )}
          </div>
        </div>

        <p className="mt-4 text-[11px] text-white/45 leading-relaxed">
          <span className="font-mono uppercase tracking-widest text-ember/80 text-[10px] mr-1">
            Verify before trading
          </span>
          Scammers create fake tokens with similar names — always confirm the
          address on Solscan matches the one shown above. Meme coins are highly
          volatile and can go to zero. Not financial advice.
        </p>
      </div>
    </section>
  );
}
