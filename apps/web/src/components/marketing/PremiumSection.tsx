import Link from 'next/link';
import Image from 'next/image';

const ITEMS = [
  'Full Vacuuming (carpet, seats, trunk)',
  'Deep cleaning of upholstery or leather',
  'Leather conditioning (if applicable)',
  'Dashboard, console, and trim cleaning & shine',
  'Interior glass and mirror cleaning',
  'Odor elimination spray',
];

const TILE_IMAGES = [
  '/service-interior-a.png',
  '/service-interior-b.png',
  '/service-interior-a.png',
  '/service-interior-b.png',
  '/service-interior-a.png',
  '/service-interior-b.png',
];

export default function PremiumSection() {
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
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--pc-space-6)',
          marginBottom: 'var(--pc-space-8)',
        }}
      >
        <div style={{
          fontFamily: 'var(--pc-sans)',
          fontSize: 'var(--pc-text-xl)',
          lineHeight: 'var(--pc-lh-snug)',
          color: 'var(--pc-fg)',
          maxWidth: 600,
          fontWeight: 400,
        }}>
          we offer a range of premium services designed to protect and enhance your vehicle&apos;s appearance.
        </div>
        <div style={{ display: 'flex', gap: 'var(--pc-space-2)', flexShrink: 0, flexWrap: 'wrap' }}>
          <Link
            href="/book"
            style={{
              background: 'var(--pc-warm)',
              color: 'var(--pc-ink)',
              border: 'none',
              borderRadius: 'var(--pc-radius-pill)',
              padding: 'var(--pc-space-3) var(--pc-space-6)',
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-xs)',
              fontWeight: 500,
              letterSpacing: 'var(--pc-track-wide)',
              textTransform: 'uppercase',
              display: 'inline-block',
              transition: 'background var(--pc-dur-fast) var(--pc-ease)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--pc-warm-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--pc-warm)')}
          >
            Book Now
          </Link>
          <Link
            href="/contact"
            style={{
              background: 'transparent',
              color: 'var(--pc-fg)',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 'var(--pc-radius-pill)',
              padding: 'var(--pc-space-3) var(--pc-space-6)',
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-xs)',
              fontWeight: 500,
              letterSpacing: 'var(--pc-track-wide)',
              textTransform: 'uppercase',
              display: 'inline-block',
              transition: 'background var(--pc-dur-fast) var(--pc-ease), border-color var(--pc-dur-fast) var(--pc-ease)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
            }}
          >
            Contact Us
          </Link>
        </div>
      </div>

      <div
        className="pc-premium-tiles"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--pc-space-2)' }}
      >
        {ITEMS.map((s, i) => (
          <div key={i} style={{
            background: 'var(--pc-sage-lo)',
            borderRadius: 'var(--pc-radius-md)',
            padding: 'var(--pc-space-4)',
            minHeight: 140,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            overflow: 'hidden', position: 'relative',
          }}>
            <Image
              src={TILE_IMAGES[i]}
              alt=""
              aria-hidden="true"
              fill
              style={{ objectFit: 'cover', opacity: 0.15, mixBlendMode: 'luminosity' }}
            />
            <div style={{
              fontFamily: 'var(--pc-mono)',
              fontSize: 'var(--pc-text-xs)',
              color: 'var(--pc-fg-4)',
              letterSpacing: 'var(--pc-track-mono)',
              position: 'relative',
            }}>
              [{String(i + 1).padStart(2, '0')}]
            </div>
            <div style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-sm)',
              color: 'var(--pc-fg)',
              lineHeight: 'var(--pc-lh-snug)',
              position: 'relative',
            }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
