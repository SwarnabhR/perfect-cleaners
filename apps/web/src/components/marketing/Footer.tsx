import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';

const SOCIAL_ICONS = ['camera', 'phone', 'shield', 'star'] as const;

export default function Footer() {
  return (
    <footer
      className="pc-footer-grid"
      style={{
        padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) var(--pc-space-10)',
        display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 40,
        borderTop: '1px solid var(--pc-line)', marginTop: 'var(--pc-space-20)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-pc-monogram.svg" width={28} height={32} alt="Perfect Cleaners mark" />
          <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-sm)', color: '#fff', letterSpacing: '0.08em' }}>
            perfect<span style={{ color: 'var(--pc-fg-3)' }}>.cleaners</span>
          </span>
        </div>
        <Eyebrow>EMAIL →</Eyebrow>
        <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xl)', color: '#fff' }}>hello@perfectcleaners.in</div>
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
        <div style={{ marginTop: 'var(--pc-space-4)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['Service', 'Exterior Wash', 'Interior Wash', 'Painting & Coating'].map(l => (
            <div key={l} style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)' }}>{l}</div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div>
        <Eyebrow>OFFICIAL</Eyebrow>
        <div style={{ marginTop: 'var(--pc-space-4)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['Ghaziabad, Delhi NCR', '+91 98765 43210', '09:00 – 21:00 IST'].map(l => (
            <div key={l} style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)' }}>{l}</div>
          ))}
        </div>
      </div>

      {/* Booking */}
      <div>
        <Eyebrow>BOOKING</Eyebrow>
        <div style={{ marginTop: 'var(--pc-space-4)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['See Schedule', 'Our Holiday', 'Special Promo'].map(l => (
            <div key={l} style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)' }}>{l}</div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pc-footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 480px) {
          .pc-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
