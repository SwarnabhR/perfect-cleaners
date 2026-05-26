import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

const SOCIAL_ICONS = ['camera', 'phone', 'shield', 'star'] as const;

export default function Footer() {
  return (
    <footer style={{
      padding: '80px 56px 40px',
      display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 40,
      borderTop: '1px solid var(--pc-line)', marginTop: 80,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-pc-monogram.svg" width={28} height={32} alt="Perfect Cleaners mark" />
          <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, color: '#fff', letterSpacing: '0.08em' }}>
            perfect<span style={{ color: 'var(--pc-fg-3)' }}>.cleaners</span>
          </span>
        </div>
        <Eyebrow>EMAIL →</Eyebrow>
        <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: '#fff' }}>hello@perfectcleaners.in</div>
        <Eyebrow>SOCIAL MEDIA</Eyebrow>
        <div style={{ display: 'flex', gap: 8 }}>
          {SOCIAL_ICONS.map(icon => (
            <div key={icon} style={{
              width: 36, height: 36, borderRadius: 999,
              background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={icon} size={14} color="var(--pc-fg-2)" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <Eyebrow>QUICK LINK</Eyebrow>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['Service', 'Exterior Wash', 'Interior Wash', 'Painting & Coating'].map(l => (
            <div key={l} style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{l}</div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div>
        <Eyebrow>OFFICIAL</Eyebrow>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['Ghaziabad, Delhi NCR', '+91 98765 43210', '09:00 – 21:00 IST'].map(l => (
            <div key={l} style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{l}</div>
          ))}
        </div>
      </div>

      {/* Booking */}
      <div>
        <Eyebrow>BOOKING</Eyebrow>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['See Schedule', 'Our Holiday', 'Special Promo'].map(l => (
            <div key={l} style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{l}</div>
          ))}
        </div>
      </div>
    </footer>
  );
}
