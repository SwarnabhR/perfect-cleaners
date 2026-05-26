import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import CarImage from '@/components/ui/CarImage';

export default function Hero() {
  return (
    <div style={{ padding: '40px 56px 0', display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 32, alignItems: 'stretch' }}>
      {/* Left: headline + CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 22 }}>
        <div style={{
          fontFamily: 'var(--pc-serif)', fontSize: 64, lineHeight: 1.04,
          color: '#fff', letterSpacing: '-0.02em',
        }}>
          Bringing Your Car&apos;s<br />Shine Back to Life
        </div>
        <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-2)', lineHeight: 1.5, maxWidth: 440 }}>
          Professional detailing, advanced technology, and showroom-quality results — at your home, office, or our centre in Ghaziabad.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <PrimaryButton style={{ padding: '14px 26px' }}>Book Now</PrimaryButton>
          <GhostButton style={{ padding: '13px 24px' }}>Contact Us</GhostButton>
        </div>
      </div>

      {/* Right: image tiles + info cards */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, height: 250 }}>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 80% at 50% 30%, #2a2725 0%, #0e0d0b 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(14,13,11,0.7) 100%)' }} />
            <svg viewBox="0 0 200 250" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <ellipse cx="100" cy="100" rx="80" ry="40" fill="rgba(255,255,255,0.06)" />
              <circle cx="60"  cy="100" r="14" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
              <circle cx="60"  cy="100" r="10" fill="none" stroke="rgba(255,255,255,0.4)"  strokeWidth="0.4" />
              <circle cx="140" cy="100" r="14" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
              <circle cx="140" cy="100" r="10" fill="none" stroke="rgba(255,255,255,0.4)"  strokeWidth="0.4" />
              <rect x="40" y="140" width="120" height="40" rx="6" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.1)" />
            </svg>
            <div style={{ position: 'absolute', bottom: 12, left: 12, fontFamily: 'var(--pc-sans)', fontSize: 12, color: '#fff', fontWeight: 500 }}>
              Professional<br />Detailers
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 80% at 50% 40%, #3a3835 0%, #1a1816 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(14,13,11,0.7) 100%)' }} />
            <svg viewBox="0 0 200 250" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <rect x="70" y="60" width="60" height="120" rx="10" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
              <rect x="76" y="68" width="48" height="100" rx="3" fill="rgba(255,255,255,0.06)" />
              <circle cx="100" cy="50" r="22" fill="rgba(255,255,255,0.08)" />
            </svg>
            <div style={{ position: 'absolute', bottom: 12, left: 12, fontFamily: 'var(--pc-sans)', fontSize: 12, color: '#fff', fontWeight: 500 }}>
              Booking<br />anywhere, anytime
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <Card style={{ padding: 12, minHeight: 70, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Eyebrow>[01]</Eyebrow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: '#fff', maxWidth: 110 }}>
                Mobile Service<br />Available
              </div>
              <Icon name="phone" size={14} color="var(--pc-fg-3)" />
            </div>
          </Card>
          <Card style={{ padding: 12, minHeight: 70, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Eyebrow>[02]</Eyebrow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: '#fff', maxWidth: 130 }}>
                Trusted by 1,500+<br />Car Owners
              </div>
              <Icon name="users" size={14} color="var(--pc-fg-3)" />
            </div>
          </Card>
        </div>
      </div>

      {/* Wide car bento beneath */}
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 0.8fr 1.6fr', gap: 10, marginTop: 18 }}>
        <CarImage tone="light" label="ATTENTION TO DETAIL" style={{ minHeight: 220 }} />
        <CarImage tone="dark"  style={{ minHeight: 220 }} />
        <CarImage tone="sage"  style={{ minHeight: 220 }} />
      </div>
    </div>
  );
}
