'use client';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { useI18n } from '@/i18n';

const ICONS = ['sparkles', 'shield', 'map-pin'] as const;

export default function USP() {
  const { t } = useI18n();
  const u = t.usp;

  return (
    <div
      className="pc-usp-root"
      style={{
        padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) 0',
        display: 'grid',
        gridTemplateColumns: '0.9fr 1.1fr',
        gap: 'var(--pc-space-10)',
        alignItems: 'center',
      }}
    >
      {/* Left: text + CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
        <Eyebrow>{u.eyebrow}</Eyebrow>
        <div style={{
          fontFamily: 'var(--pc-serif)',
          fontSize: 'var(--pc-text-3xl)',
          lineHeight: 'var(--pc-lh-tight)',
          color: 'var(--pc-fg)',
          letterSpacing: 'var(--pc-track-tight)',
        }}>
          {u.headline.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
          ))}
        </div>
        <p style={{
          fontFamily: 'var(--pc-sans)',
          fontSize: 'var(--pc-text-base)',
          color: 'var(--pc-fg-2)',
          lineHeight: 'var(--pc-lh-loose)',
          maxWidth: 380,
          margin: 0,
        }}>
          {u.body}
        </p>
        <div style={{ display: 'flex', gap: 'var(--pc-space-2)', marginTop: 'var(--pc-space-1)', flexWrap: 'wrap' }}>
          <Button href="/for-societies" size="md">{u.bookNow}</Button>
          <Button href="/services" variant="ghost" size="md">{u.viewServices}</Button>
        </div>
      </div>

      {/* Right: 3-card grid */}
      <div
        className="pc-usp-cards"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--pc-space-3)' }}
      >
        {u.cards.map((card, i) => (
          <Card
            key={i}
            style={{ padding: 'var(--pc-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-8)', minHeight: 220 }}
          >
            <Icon name={ICONS[i]} size={20} color="var(--pc-fg)" strokeWidth={1.4} />
            <div>
              <div style={{
                fontFamily: 'var(--pc-sans)',
                fontSize: 'var(--pc-text-sm)',
                color: 'var(--pc-fg)',
                lineHeight: 'var(--pc-lh-snug)',
              }}>
                {card.heading.split('\n').map((line, j, arr) => (
                  <span key={j}>{line}{j < arr.length - 1 ? <br /> : null}</span>
                ))}
              </div>
              <div style={{
                fontFamily: 'var(--pc-sans)',
                fontSize: 'var(--pc-text-xs)',
                color: 'var(--pc-fg-2)',
                lineHeight: 'var(--pc-lh-loose)',
                marginTop: 'var(--pc-space-2)',
              }}>
                {card.body}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
