/**
 * @fileoverview Public site configuration. Reads from environment with
 * sensible fallbacks so the site renders even before env is filled in.
 */

const DEFAULT_SITE_URL = 'https://astroid.space';

/**
 * Normalise the configured site URL so a missing scheme (e.g. `astroid.space`
 * pasted into an env var by mistake) doesn't crash `new URL(...)` at build
 * time. We prefer https, fall back to the default if the value is unusable.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return DEFAULT_SITE_URL;
    return u.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteConfig = {
  name: 'Astroid',
  tagline: 'The Space Shiba Inu',
  description:
    'A charity-first meme coin built around a kid\'s drawing. 25% of pump.fun creator fees auto-route to a children\'s charity.',
  url: resolveSiteUrl(),

  // Mascot creator credit
  mascotCreator: 'Liv',

  // Token / on-chain
  tokenMint: process.env.NEXT_PUBLIC_TOKEN_MINT ?? '',
  pumpfunUrl: process.env.NEXT_PUBLIC_PUMPFUN_URL ?? '',
  network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'mainnet-beta') as
    | 'mainnet-beta'
    | 'devnet',

  // Public token-tracker listings. Defaults point at the live $ASTROID coin
  // pages on each tracker. Env vars are still honoured so URLs can be
  // rotated (e.g. if a tracker reslugs the coin) without a code change.
  listings: {
    coingecko:
      process.env.NEXT_PUBLIC_COINGECKO_URL ??
      'https://www.coingecko.com/en/coins/thespaceshibainu',
    blockspot:
      process.env.NEXT_PUBLIC_BLOCKSPOT_URL ??
      'https://blockspot.io/coin/thespaceshibainu/',
  },

  // Wallets
  projectWallet: process.env.NEXT_PUBLIC_PROJECT_WALLET ?? '',
  charityWallet: process.env.NEXT_PUBLIC_CHARITY_WALLET ?? '',

  // Charity partner
  charityName: process.env.NEXT_PUBLIC_CHARITY_NAME ?? 'Our charity partner',
  charityUrl: process.env.NEXT_PUBLIC_CHARITY_URL ?? '',

  // Social. Defaults are the live handles; env vars let you rotate without
  // a code change (e.g. if a handle is ever rebranded or temporarily locked).
  social: {
    twitter:
      process.env.NEXT_PUBLIC_TWITTER_URL ?? 'https://x.com/Astroid_Sol',
    telegram:
      process.env.NEXT_PUBLIC_TELEGRAM_URL ?? 'https://t.me/astroidcto',
  },

  // Inbound email addresses. Each is a Cloudflare Email Routing forwarder.
  // Centralised so a typo in a mailto link can never silently send mail
  // into the void; bind everything off `siteConfig.emails.*`.
  emails: {
    hello: 'hello@astroid.space',
    support: 'support@astroid.space',
    security: 'security@astroid.space',
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** Solscan link for an address */
export function solscanAddress(address: string): string {
  const cluster = siteConfig.network === 'devnet' ? '?cluster=devnet' : '';
  return `https://solscan.io/account/${address}${cluster}`;
}

/** Solscan link for a transaction signature */
export function solscanTx(sig: string): string {
  const cluster = siteConfig.network === 'devnet' ? '?cluster=devnet' : '';
  return `https://solscan.io/tx/${sig}${cluster}`;
}

/** Format a wallet address for display: `Abcd...XyZ9` */
export function shortAddress(address: string, chars = 4): string {
  if (!address || address.length <= chars * 2 + 1) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
