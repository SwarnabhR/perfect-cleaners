'use client';

import { useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SectionHeader from '@/components/marketing/SectionHeader';
import ServiceFeature from '@/components/marketing/ServiceFeature';
import PremiumSection from '@/components/marketing/PremiumSection';
import CTASection from '@/components/marketing/CTASection';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import { useI18n } from '@/i18n';

type DetailKey = 'interior' | 'exterior' | 'coating';

export default function ServicesContent() {
  const { t } = useI18n();
  const s = t.servicesPage;
  const [openDetail, setOpenDetail] = useState<DetailKey | null>(null);

  // Normalizes exteriorPage/interiorPage (includedTitle) and coatingPage
  // (processTitle) into one shape for the shared detail panel below.
  const DETAIL_VIEWS: Record<DetailKey, { eyebrow: string; headline: string; sub: string; cta: string; sectionTitle: string; items: readonly string[]; href: string }> = {
    interior: { ...t.interiorPage, sectionTitle: t.interiorPage.includedTitle, href: '/services/interior' },
    exterior: { ...t.exteriorPage, sectionTitle: t.exteriorPage.includedTitle, href: '/services/exterior' },
    coating:  { ...t.coatingPage,  sectionTitle: t.coatingPage.processTitle,  href: '/services/coating'  },
  };

  const detail = openDetail ? DETAIL_VIEWS[openDetail] : null;

  function toggle(key: DetailKey) {
    setOpenDetail(prev => (prev === key ? null : key));
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, paddingBottom: 80 }}>
        <SectionHeader badgeText={s.headerBadge} title={s.headerTitle} subtitle={s.headerSub} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ServiceFeature
            num={s.features[0].num} name={s.features[0].name} price={s.features[0].price}
            title={s.features[0].title} body={s.features[0].body}
            onClick={() => toggle('interior')}
          />
          <PremiumSection />
          <ServiceFeature
            num={s.features[1].num} name={s.features[1].name} price={s.features[1].price}
            title={s.features[1].title} body={s.features[1].body}
            onClick={() => toggle('exterior')}
          />
          <ServiceFeature
            num={s.features[2].num} name={s.features[2].name} price={s.features[2].price}
            title={s.features[2].title} body={s.features[2].body}
            onClick={() => toggle('coating')}
          />
        </div>

        {/* Inline detail panel — shared by all three cards, shows whichever
            was last clicked; CTA links through to the matching dedicated
            page (/services/exterior etc.) for full depth. */}
        {detail && (
          <div style={{
            margin: 'var(--pc-space-4) var(--pc-screen-pad-lg) 0',
            background: 'var(--pc-card)',
            border: '1px solid var(--pc-line)',
            borderRadius: 'var(--pc-radius-lg)',
            padding: 'var(--pc-space-8)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--pc-space-6)' }}>
              <Eyebrow>{detail.eyebrow}</Eyebrow>
              <button
                type="button"
                onClick={() => setOpenDetail(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-3)',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}
              >
                Close <Icon name="x" size={12} color="var(--pc-fg-3)" />
              </button>
            </div>
            <h2 style={{
              fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-3xl)', fontWeight: 400,
              color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)', margin: '0 0 12px',
            }}>
              {detail.headline}
            </h2>
            <p style={{
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', color: 'var(--pc-fg-2)',
              lineHeight: 'var(--pc-lh-loose)', maxWidth: 560, margin: '0 0 24px',
            }}>
              {detail.sub}
            </p>
            <Link
              href={detail.href}
              style={{
                display: 'inline-flex', padding: '14px 24px',
                background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                borderRadius: 'var(--pc-radius-pill)', fontFamily: 'var(--pc-sans)',
                fontSize: 13, fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', textDecoration: 'none', marginBottom: 32,
              }}
            >
              {detail.cta}
            </Link>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-3)', letterSpacing: '0.05em', marginBottom: 16 }}>
              {detail.sectionTitle}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {detail.items.map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--pc-sage-hi)', flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 80 }}>
          <CTASection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
