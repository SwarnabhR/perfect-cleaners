import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import CarImage from '@/components/ui/CarImage';

export default function USP() {
  return (
    <div style={{ padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) 0', display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 40, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Eyebrow>[KEY USP LIST]</Eyebrow>
        <div style={{
          fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-3xl)', lineHeight: 1.05,
          color: '#fff', letterSpacing: '-0.02em',
        }}>
          Your Car Deserves More than an Ordinary Wash
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <PrimaryButton style={{ padding: '12px 22px' }}>Book Now</PrimaryButton>
          <GhostButton style={{ padding: '11px 22px' }}>Contact Us</GhostButton>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 12 }}>
        <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 26, minHeight: 220 }}>
          <Icon name="sparkles" size={20} color="var(--pc-fg)" />
          <div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: '#fff', fontWeight: 500, lineHeight: 1.3 }}>
              Premium Products<br />& Technology
            </div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-2)', lineHeight: 1.5, marginTop: 8 }}>
              Highly skilled team dedicated to meticulous detailing with industry-leading products.
            </div>
          </div>
        </Card>
        <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 26, minHeight: 220 }}>
          <Icon name="shield" size={20} color="var(--pc-fg)" />
          <div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: '#fff', fontWeight: 500, lineHeight: 1.3 }}>
              Safe Paint-Friendly<br />Process
            </div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)'.5, color: 'var(--pc-fg-2)', lineHeight: 1.5, marginTop: 8 }}>
              Our techniques protect your paintwork from swirl marks, scratches, and harsh chemicals.
            </div>
          </div>
        </Card>
        <CarImage tone="dark" style={{ minHeight: 220 }} />
      </div>
    </div>
  );
}
