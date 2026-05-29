import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt     = 'Perfect Cleaners — Premium Car Detailing, Delhi NCR';
export const size    = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          background: '#0E0D0B',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(74,94,68,0.18) 0%, transparent 55%)',
          display: 'flex',
        }} />

        {/* Gold hairline top */}
        <div style={{
          position: 'absolute', top: 0, left: 72, right: 72,
          height: 2, background: '#C9A961',
          display: 'flex',
        }} />

        {/* Wordmark */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 40,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 6,
            background: '#4A5E44',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ color: '#E8EDE3', fontSize: 18, fontWeight: 700 }}>P</div>
          </div>
          <div style={{
            color: '#AAAAAA', fontSize: 12,
            letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            Perfect Cleaners
          </div>
        </div>

        {/* Headline */}
        <div style={{
          color: '#FFFFFF', fontSize: 64,
          fontWeight: 400, letterSpacing: '-0.02em',
          lineHeight: 1.05, marginBottom: 20,
        }}>
          Premium Car Care<br />for Delhi NCR.
        </div>

        {/* Sub */}
        <div style={{
          color: '#666660', fontSize: 20,
          letterSpacing: '0.01em', lineHeight: 1.4,
        }}>
          Certified specialists · Professional-grade products · Book in under 2 minutes
        </div>

        {/* Bottom pill */}
        <div style={{
          position: 'absolute', bottom: 64, right: 72,
          background: '#F0EDE8', borderRadius: 999,
          padding: '12px 28px',
          color: '#0E0D0B', fontSize: 14, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          display: 'flex',
        }}>
          Book Now →
        </div>
      </div>
    ),
    { ...size },
  );
}
