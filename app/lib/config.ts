/**
 * @fileoverview Public site configuration. Reads from environment with
 * sensible fallbacks so the site renders even before env is filled in.
 */

export const siteConfig = {
  name: 'Astroid',
  tagline: 'The Space Shiba Inu',
  description:
    'A charity-first meme coin built around a kid\'s drawing. 25% of pump.fun creator fees auto-route to a children\'s charity.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://astroid.space',

  // Mascot creator credit
  mascotCreator: 'Liv',

  // Token / on-chain
  tokenMint: process.env.NEXT_PUBLIC_TOKEN_MINT ?? '',
  pumpfunUrl: process.env.NEXT_PUBLIC_PUMPFUN_URL ?? '',
  network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'mainnet-beta') as
    | 'mainnet-beta'
    | 'devnet',

  // Wallets
  projectWallet: process.env.NEXT_PUBLIC_PROJECT_WALLET ?? '',
  charityWallet: process.env.NEXT_PUBLIC_CHARITY_WALLET ?? '',

  // Charity partner
  charityName: process.env.NEXT_PUBLIC_CHARITY_NAME ?? 'Our charity partner',
  charityUrl: process.env.NEXT_PUBLIC_CHARITY_URL ?? '',

  // Social
  social: {
    twitter: 'https://x.com/',
    telegram: 'https://t.me/',
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
