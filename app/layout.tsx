import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { siteConfig } from './lib/config';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: 'Astroid — Starlike. Drawn by a kid. Helping kids.',
  description:
    'Astroid (starlike) is a charity-first project where a kid-drawn Space Shiba Inu helps fund children. Name a star, write a wish, color in Astroid — no wallet required.',
  keywords: [
    'Astroid',
    'starlike',
    'Solana',
    'meme coin',
    'charity',
    'children',
    'space',
    'pump.fun',
    'name a star',
  ],
  authors: [{ name: 'Astroid' }],
  openGraph: {
    title: 'Astroid — Starlike. Drawn by a kid. Helping kids.',
    description:
      'A charity-first project. 25% of pump.fun creator fees auto-route to a children\'s charity. Name a star free, no wallet required.',
    type: 'website',
    images: ['/liv-drawing.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astroid — Starlike. Drawn by a kid. Helping kids.',
    description: 'A charity-first project built around a kid\'s drawing.',
    images: ['/liv-drawing.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
