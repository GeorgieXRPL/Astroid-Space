'use client';

import { useState } from 'react';
import { siteConfig, solscanAddress, shortAddress } from '../lib/config';

/**
 * Footer block showing the $ASTROID token contract address with a one-tap
 * copy button, Solscan link, and (when configured) pump.fun link, plus a
 * plain-English meme-coin risk disclaimer.
 *
 * Renders nothing if `NEXT_PUBLIC_TOKEN_MINT` is unset, so the slot stays
 * clean before the env var is populated in production.
 */
export function TokenAddress() {
  const [copied, setCopied] = useState(false);
  const mint = siteConfig.tokenMint;

  if (!mint) return null;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Some browsers / contexts (e.g. iframes without permission) reject
      // the write. Fail quietly - users can still long-press the address.
    }
  };

  return (
    <div className="pt-6 mt-6 border-t border-white/5">
      <div className="grid lg:grid-cols-[auto_1fr] gap-x-10 gap-y-5 items-start">
        {/* Address + actions */}
        <div className="space-y-2.5 min-w-0">
          <div className="telemetry-label">$ASTROID · Token contract (Solana)</div>
          <div className="font-mono text-[11px] sm:text-xs text-white/70 break-all leading-relaxed">
            {mint}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onCopy}
              className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded border border-cosmos/30 text-cosmos hover:bg-cosmos/10 transition-colors"
              aria-label="Copy contract address to clipboard"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <a
              href={solscanAddress(mint)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-colors"
            >
              Solscan ↗
            </a>
            {siteConfig.pumpfunUrl && (
              <a
                href={siteConfig.pumpfunUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-colors"
              >
                pump.fun ↗
              </a>
            )}
            <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded border border-white/10 text-white/35">
              {shortAddress(mint, 6)}
            </span>
          </div>
        </div>

        {/* Meme-coin risk disclaimer */}
        <div className="text-[11px] text-white/45 leading-relaxed lg:max-w-xl lg:ml-auto">
          <span className="font-mono uppercase tracking-widest text-ember/80 text-[10px] mr-1.5">
            High risk
          </span>
          $ASTROID is a community-launched meme coin on Solana. Meme coins are
          highly volatile, illiquid, often go to zero, and can be subject to
          coordinated price manipulation. Nothing on this site is financial,
          legal, or tax advice. Verify the contract address above on Solscan
          before any transaction - scammers create fake tokens with similar
          names. Only spend what you are fully prepared to lose. Astroid the
          project does not solicit purchases of the token, does not promise
          returns, and does not guarantee any future trading activity, charity
          inflow, or token utility. Do your own research.
        </div>
      </div>
    </div>
  );
}
