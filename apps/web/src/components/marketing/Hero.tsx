import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import CarImage from '@/components/ui/CarImage';
import Image from 'next/image';

export default function Hero() {
  return (
    <div style={{ padding: 'var(--pc-space-10) var(--pc-screen-pad-lg) 0', display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 32, alignItems: 'stretch' }}>
      {/* Left: headline + CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 22 }}>
        <div style={{
          fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-hero)', lineHeight: 1.04,
          color: '#fff', letterSpacing: '-0.02em',
        }}>
          Bringing Your Car&apos;s<br />Shine Back to Life
        </div>
        <div style={{ fontFamily: 'var(--pc-sans)', 'var(--pc-text-base)', color: 'var(--pc-fg-2)', lineHeight: 1.5, maxWidth: 440 }}>
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
            <Image src="/hero-professional-detailer.png" alt="Professional detailer" fill style={{ objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(14,13,11,0.80) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 12, left: 12, fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: '#fff', fontWeight: 500 }}>
              Professional<br />Detailers
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
            <Image src="/hero-booking-app.png" alt="Book anywhere, anytime" fill style={{ objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(14,13,11,0.80) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 12, left: 12, fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: '#fff', fontWeight: 500 }}>
              Booking<br />anywhere, anytime
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <Card style={{ padding: 12, minHeight: 70, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Eyebrow>[01]</Eyebrow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: '#fff', maxWidth: 110 }}>
                Mobile Service<br />Available
              </div>
              <Icon name="phone" size={14} color="var(--pc-fg-3)" />
            </div>
          </Card>
          <Card style={{ padding: 12, minHeight: 70, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Eyebrow>[02]</Eyebrow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: '#fff', maxWidth: 130 }}>
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
