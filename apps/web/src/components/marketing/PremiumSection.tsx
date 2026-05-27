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
    <div style={{
      margin: 'var(--pc-space-8) var(--pc-screen-pad-lg) 0',
      background: 'var(--pc-sage)', borderRadius: 24, padding: 'var(--pc-space-8) var(--pc-space-8) var(--pc-space-6)',
    }}>
      <div
        className="pc-premium-header"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 'var(--pc-space-8)' }}
      >
        <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xl)', lineHeight: 1.4, color: '#fff', maxWidth: 600, fontWeight: 400 }}>
          we offer a range of premium services designed to protect and enhance your vehicle&apos;s appearance.
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button style={{
            background: '#fff', color: 'var(--pc-ink)', border: 'none', borderRadius: 999,
            padding: 'var(--pc-space-3) var(--pc-space-6)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', fontWeight: 500,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>Book Now</button>
          <button style={{
            background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999,
            padding: 'var(--pc-space-3) var(--pc-space-6)', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', fontWeight: 500,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>Contact Us</button>
        </div>
      </div>

      <div
        className="pc-premium-tiles"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}
      >
        {ITEMS.map((s, i) => (
          <div key={i} style={{
            background: 'var(--pc-sage-lo)', borderRadius: 14, padding: 'var(--pc-space-4)',
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
            <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', position: 'relative' }}>
              [{String(i + 1).padStart(2, '0')}]
            </div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: '#fff', lineHeight: 1.3, position: 'relative' }}>{s}</div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pc-premium-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .pc-premium-tiles {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .pc-premium-tiles {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
