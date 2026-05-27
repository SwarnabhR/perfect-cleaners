import Image from 'next/image';

const ITEMS = [
  'Full Vacuuming (carpet, seats, trunk)',
  'Deep cleaning of upholstery or leather',
  'Leather conditioning (if applicable)',
  'Dashboard, console, and trim cleaning & shine',
  'Interior glass and mirror cleaning',
  'Odor elimination spray',
];

// Alternate between the two interior photos for visual variety
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
    <div style={{
      margin: '32px 56px 0',
      background: 'var(--pc-sage)', borderRadius: 24, padding: '32px 32px 28px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 20, lineHeight: 1.4, color: '#fff', maxWidth: 600, fontWeight: 400 }}>
          we offer a range of premium services designed to protect and enhance your vehicle&apos;s appearance.
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button style={{
            background: '#fff', color: 'var(--pc-ink)', border: 'none', borderRadius: 999,
            padding: '11px 22px', fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 500,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>Book Now</button>
          <button style={{
            background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999,
            padding: '11px 22px', fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 500,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>Contact Us</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {ITEMS.map((s, i) => (
          <div key={i} style={{
            background: 'var(--pc-sage-lo)', borderRadius: 14, padding: 16,
            minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            overflow: 'hidden', position: 'relative',
          }}>
            <Image
              src={TILE_IMAGES[i]}
              alt=""
              aria-hidden="true"
              fill
              style={{
                objectFit: 'cover', opacity: 0.15, mixBlendMode: 'luminosity',
              }}
            />
            <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', position: 'relative' }}>
              [{String(i + 1).padStart(2, '0')}]
            </div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff', lineHeight: 1.3, position: 'relative' }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
