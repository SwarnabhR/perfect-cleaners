'use client';

import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import USP from '@/components/marketing/USP';
import CTASection from '@/components/marketing/CTASection';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';
import { useI18n } from '@/i18n';

export default function ExteriorWashPage() {
  const { t } = useI18n();
  const p = t.exteriorPage;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <div style={{ padding: '40px var(--pc-screen-pad-lg) 0', display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 32, alignItems: 'stretch' }} className="pc-sf-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 22 }}>
            <Eyebrow>{p.eyebrow}</Eyebrow>
            <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.04, color: 'var(--pc-fg)', letterSpacing: '-0.02em' }}>
              {p.headline}
            </div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-2)', lineHeight: 1.5, maxWidth: 440 }}>
              {p.sub}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/for-societies" style={{
                background: 'var(--pc-warm)', color: 'var(--pc-ink)', borderRadius: 999, padding: '14px 26px',
                fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, textDecoration: 'none',
              }}>
                {p.cta}
              </Link>
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--pc-line)', minHeight: 320 }} className="pc-sf-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/service-exterior-a.png" alt="Exterior Wash" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        <USP />

        <section style={{ padding: '80px var(--pc-screen-pad-lg) 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }} className="pc-sf-grid">
            <div>
              <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 40, color: 'var(--pc-fg)', marginBottom: 24 }}>{p.includedTitle}</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {p.items.map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ padding: 4, background: 'var(--pc-sage-lo)', borderRadius: '50%', color: 'var(--pc-sage)', flexShrink: 0 }}>
                      <Icon name="check" size={14} />
                    </div>
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, color: 'var(--pc-fg-2)', lineHeight: 1.4 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Card style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Eyebrow>{p.pricingTitle}</Eyebrow>
                {p.tiers.map((tier, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < p.tiers.length - 1 ? '1px solid var(--pc-line)' : 'none', paddingBottom: i < p.tiers.length - 1 ? 16 : 0 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg)', fontWeight: 500 }}>{tier.name}</div>
                      <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', marginTop: 4 }}>{tier.time}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 16, color: 'var(--pc-fg)' }}>{tier.price}</div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </section>

        <div style={{ marginTop: 80, marginBottom: 80 }}>
          <CTASection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
