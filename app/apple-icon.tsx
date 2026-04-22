/**
 * @fileoverview iOS / iPadOS home-screen icon. Next.js App Router
 * auto-discovers this at `app/apple-icon.tsx` and emits a
 * `<link rel="apple-touch-icon">` tag.
 *
 * Apple expects a 180x180 PNG with no transparency (iOS adds the
 * rounded corners and shadow itself).
 */
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background:
            'radial-gradient(circle at 30% 25%, #00d4ff 0%, #0353a4 50%, #001233 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '70%',
            height: '70%',
            borderRadius: '50%',
            background: '#001233',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00d4ff',
            fontSize: 96,
            fontWeight: 800,
            fontFamily: 'system-ui',
            letterSpacing: '-0.05em',
            border: '2px solid rgba(0,212,255,0.4)',
          }}
        >
          A
        </div>
      </div>
    ),
    { ...size }
  );
}
