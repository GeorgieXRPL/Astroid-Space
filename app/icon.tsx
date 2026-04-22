/**
 * @fileoverview Browser favicon. Next.js App Router auto-discovers this
 * at `app/icon.tsx` and emits the correct `<link rel="icon">` tag.
 *
 * Renders the same gradient + "A" mark used in the site nav so the
 * browser tab matches the wordmark.
 */
import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background:
            'radial-gradient(circle at 30% 30%, #00d4ff 0%, #0353a4 55%, #001233 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
        }}
      >
        <div
          style={{
            width: '78%',
            height: '78%',
            borderRadius: '50%',
            background: '#001233',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00d4ff',
            fontSize: 18,
            fontWeight: 800,
            fontFamily: 'system-ui',
            letterSpacing: '-0.05em',
          }}
        >
          A
        </div>
      </div>
    ),
    { ...size }
  );
}
