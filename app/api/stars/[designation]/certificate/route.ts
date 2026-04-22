/**
 * @fileoverview GET /api/stars/[designation]/certificate
 * Returns a Naming Certificate as an SVG.
 *
 * SVG (rather than PDF) because it ships zero deps, prints well at any
 * size, and the user's browser can save-as-image or print-to-pdf
 * directly. Keeps the dependency tree light.
 */

import { NextRequest, NextResponse } from 'next/server';
import { namedStarStore } from '../../../../lib/storage';
import { getStarByDesignation, isValidDesignation, STAR_STYLES } from '../../../../lib/stars';

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case "'":
        return '&apos;';
      default:
        return c;
    }
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ designation: string }> }
) {
  const { designation } = await params;

  if (!isValidDesignation(designation)) {
    return NextResponse.json({ error: 'Invalid designation' }, { status: 400 });
  }
  const star = getStarByDesignation(designation);
  if (!star) {
    return NextResponse.json({ error: 'Star not found' }, { status: 404 });
  }
  const named = await namedStarStore.get(designation);
  if (!named || named.status !== 'approved') {
    // Pending submissions don't get a certificate. Once approved by a
    // moderator, the certificate URL becomes available.
    return NextResponse.json({ error: 'Star has not been named' }, { status: 404 });
  }

  const namedDate = new Date(named.namedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const style = STAR_STYLES[star.spectrum];

  // SVG certificate. 1240x1754 (A4 portrait at ~150dpi).
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1240 1754" width="1240" height="1754">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000814"/>
      <stop offset="0.5" stop-color="#001233"/>
      <stop offset="1" stop-color="#000814"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${style.color}" stop-opacity="0.7"/>
      <stop offset="0.4" stop-color="${style.emissive}" stop-opacity="0.4"/>
      <stop offset="1" stop-color="${style.emissive}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="core" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.5" stop-color="${style.color}"/>
      <stop offset="1" stop-color="${style.emissive}"/>
    </radialGradient>
    <linearGradient id="cyan" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#00d4ff"/>
      <stop offset="1" stop-color="#0353a4"/>
    </linearGradient>
  </defs>

  <rect width="1240" height="1754" fill="url(#bg)"/>

  <!-- Decorative stars -->
  ${Array.from({ length: 120 })
    .map((_, i) => {
      const x = ((i * 137.5) % 1240).toFixed(0);
      const y = ((i * 73.3 + 50) % 1754).toFixed(0);
      const r = (((i * 13) % 3) + 0.4).toFixed(1);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${(0.18 + ((i * 7) % 7) / 14).toFixed(2)}"/>`;
    })
    .join('\n  ')}

  <!-- Border frame -->
  <rect x="60" y="60" width="1120" height="1634" fill="none" stroke="#00d4ff" stroke-opacity="0.25" stroke-width="2"/>
  <rect x="80" y="80" width="1080" height="1594" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>

  <!-- Header -->
  <text x="620" y="200" text-anchor="middle" fill="#00d4ff" font-family="monospace" font-size="20" letter-spacing="6">
    ASTROID · OFFICIAL STAR-NAMING CERTIFICATE
  </text>

  <!-- Decorative star -->
  <circle cx="620" cy="450" r="200" fill="url(#halo)"/>
  <circle cx="620" cy="450" r="60" fill="url(#core)"/>
  <text x="620" y="600" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="14" letter-spacing="3" opacity="0.7">
    ${escapeXml(style.label.toUpperCase())} · ${escapeXml(star.id)}
  </text>

  <!-- Main statement -->
  <text x="620" y="780" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="28" opacity="0.7">
    This is to certify that the star
  </text>
  <text x="620" y="870" text-anchor="middle" fill="#00d4ff" font-family="monospace" font-size="36" letter-spacing="6">
    ${escapeXml(star.id)}
  </text>
  <text x="620" y="940" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="28" opacity="0.7">
    is named
  </text>
  <text x="620" y="1030" text-anchor="middle" fill="#ffffff" font-family="serif" font-size="68" font-weight="bold">
    ${escapeXml(named.name)}
  </text>

  ${
    named.dedication
      ? `<text x="620" y="1130" text-anchor="middle" fill="#ff7a45" font-family="serif" font-style="italic" font-size="28">
    "${escapeXml(named.dedication)}"
  </text>`
      : ''
  }

  ${
    named.namedBy
      ? `<text x="620" y="1190" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="20" opacity="0.6">
    Named by ${escapeXml(named.namedBy)}
  </text>`
      : ''
  }

  <!-- Coordinates -->
  <g transform="translate(620, 1300)">
    <text text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="11" letter-spacing="3" opacity="0.5">
      CELESTIAL COORDINATES
    </text>
    <text y="28" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="16" opacity="0.8">
      X ${star.position[0].toFixed(3)} · Y ${star.position[1].toFixed(3)} · Z ${star.position[2].toFixed(3)}
    </text>
  </g>

  <!-- Footer -->
  <line x1="200" y1="1480" x2="1040" y2="1480" stroke="#ffffff" stroke-opacity="0.1"/>

  <text x="200" y="1530" fill="#00d4ff" font-family="monospace" font-size="11" letter-spacing="2" opacity="0.6">
    NAMED ON
  </text>
  <text x="200" y="1560" fill="#ffffff" font-family="monospace" font-size="18">
    ${escapeXml(namedDate)}
  </text>

  <text x="1040" y="1530" text-anchor="end" fill="#00d4ff" font-family="monospace" font-size="11" letter-spacing="2" opacity="0.6">
    CERTIFICATE ID
  </text>
  <text x="1040" y="1560" text-anchor="end" fill="#ffffff" font-family="monospace" font-size="18">
    ${escapeXml(star.id)}
  </text>

  <text x="620" y="1640" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="12" opacity="0.4">
    Astroid · starlike · Mascot drawn by Liv
  </text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Content-Disposition': `inline; filename="${star.id}-certificate.svg"`,
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
