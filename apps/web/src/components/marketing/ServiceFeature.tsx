import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

function DetailTile({ tone = 'a', style }: { tone?: 'a' | 'b' | 'c'; style?: React.CSSProperties }) {
  const tones = {
    a: 'linear-gradient(135deg,#2a2725 0%,#0e0d0b 100%)',
    b: 'linear-gradient(135deg,#1a1816 0%,#0a0908 100%)',
    c: 'linear-gradient(135deg,#3a3835 0%,#1a1816 100%)',
  };
  return (
    <div style={{
      flex: 1, borderRadius: 8,
      background: tones[tone],
      border: '1px solid var(--pc-line)',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(60% 60% at 50% 30%, rgba(255,255,255,0.1) 0%, transparent 70%)',
      }} />
    </div>
  );
}

interface ServiceFeatureProps {
  num: string;
  name: string;
  price: string;
  title: string;
  body: string;
}

export default function ServiceFeature({ num, name, price, title, body }: ServiceFeatureProps) {
  return (
    <div style={{
      margin: '0 56px',
      background: 'var(--pc-card)',
      border: '1px solid var(--pc-line)',
      borderRadius: 20, padding: 28,
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow>[SERVICE] [{num}] / {name.toUpperCase()}</Eyebrow>
        <Icon name="arrow-up-right" size={16} color="var(--pc-fg-2)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <DetailTile tone="b" style={{ height: 140 }} />
            <DetailTile tone="c" style={{ height: 140 }} />
          </div>
        </div>
        <DetailTile tone="a" style={{ height: 280 }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px 0', gap: 24 }}>
          <div>
            <Eyebrow>FROM</Eyebrow>
            <div style={{
              fontFamily: 'var(--pc-serif)', fontSize: 38, color: '#fff',
              letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.05,
            }}>
              {price}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {title}
            </div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', lineHeight: 1.55 }}>
              {body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
