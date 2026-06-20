'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/i18n';

const IMGS = [
  { src: '/service-exterior-a.png', alt: 'Foam cannon exterior wash' },
  { src: '/service-exterior-b.png', alt: 'Water beading on waxed paint' },
  { src: '/service-interior-a.png', alt: 'Interior cleaning' },
  { src: '/service-interior-b.png', alt: 'Interior detailing — dashboard and trim' },
  { src: '/service-coating-a.png',  alt: 'Ceramic coating application' },
  { src: '/service-coating-b.png',  alt: 'Mirror-gloss reflection on coated paint' },
];

export default function PremiumSection() {
  const { t } = useI18n();
  const p = t.premium;

  return (
    <div
      className="pc-premium-root"
      style={{
        margin: 'var(--pc-space-8) var(--pc-screen-pad-lg) 0',
        background: 'var(--pc-sage)',
        borderRadius: 'var(--pc-radius-xl)',
        padding: 'var(--pc-space-8) var(--pc-space-8) var(--pc-space-6)',
      }}
    >
      <div
        className="pc-premium-header"
        style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 'var(--pc-space-6)', marginBottom: 'var(--pc-space-8)',
        }}
      >
        <div style={{
          fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-2xl)',
          lineHeight: 'var(--pc-lh-tight)', color: 'var(--pc-sage-ink)',
          maxWidth: 520, letterSpacing: 'var(--pc-track-tight)',
        }}>
          {p.headline1}<br />{p.headline2}
        </div>
        <div style={{ display: 'flex', gap: 'var(--pc-space-2)', flexShrink: 0, flexWrap: 'wrap' }}>
          <Link
            href="/for-societies"
            className="pc-hero-cta-primary"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: 'var(--pc-space-3) var(--pc-space-6)',
              background: 'var(--pc-warm)', color: 'var(--pc-ink)',
              border: 'none', borderRadius: 'var(--pc-radius-pill)',
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
              fontWeight: 600, letterSpacing: 'var(--pc-track-wide)',
              textTransform: 'uppercase', textDecoration: 'none',
              transition: 'background var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            {p.bookNow}
          </Link>
          <Link
            href="/services"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: 'var(--pc-space-3) var(--pc-space-6)',
              background: 'transparent', color: 'var(--pc-sage-ink)',
              border: '1px solid rgba(232,237,227,0.30)', borderRadius: 'var(--pc-radius-pill)',
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
              fontWeight: 500, letterSpacing: 'var(--pc-track-wide)',
              textTransform: 'uppercase', textDecoration: 'none',
              transition: 'background var(--pc-dur-fast) var(--pc-ease), border-color var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            {p.allServices}
          </Link>
        </div>
      </div>

      <div
        className="pc-premium-tiles"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--pc-space-2)' }}
      >
        {p.tiles.map((tile, i) => (
          <div key={i} style={{
            borderRadius: 'var(--pc-radius-md)', minHeight: 160,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            overflow: 'hidden', position: 'relative',
          }}>
            <Image
              src={IMGS[i].src}
              alt={IMGS[i].alt}
              fill
              sizes="(max-width: 480px) 100vw, (max-width: 768px) calc(50vw - 24px), calc(33vw - 16px)"
              style={{ objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(14,13,11,0.15) 0%, rgba(14,13,11,0.78) 100%)',
            }} />
            <div style={{
              position: 'relative', padding: 'var(--pc-space-4) var(--pc-space-4) 0',
              fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)',
              color: 'rgba(255,255,255,0.5)', letterSpacing: 'var(--pc-track-mono)',
            }}>
              [{String(i + 1).padStart(2, '0')}] {tile.label}
            </div>
            <div style={{
              position: 'relative', padding: '0 var(--pc-space-4) var(--pc-space-4)',
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
              fontWeight: 500, color: 'rgba(255,255,255,0.92)', lineHeight: 'var(--pc-lh-snug)',
            }}>
              {tile.title.split('\n').map((line, j, arr) => (
                <span key={j}>{line}{j < arr.length - 1 ? <br /> : null}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
