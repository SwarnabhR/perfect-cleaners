'use client';

import Image from 'next/image';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import CTASection from '@/components/marketing/CTASection';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import { useI18n } from '@/i18n';

export default function AboutContent() {
  const { t } = useI18n();
  const a = t.about;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main className="pc-about-main" style={{ flex: 1, padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) var(--pc-space-20)' }}>

        {/* Hero */}
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: 'var(--pc-space-20)' }}>
          <Eyebrow>{a.eyebrow}</Eyebrow>
          <h1 style={{
            fontFamily: 'var(--pc-serif)', fontSize: 'clamp(40px, 6vw, 72px)',
            color: 'var(--pc-fg)', margin: '16px 0 32px',
            lineHeight: 1.1, letterSpacing: 'var(--pc-track-tight)',
          }}>
            {a.headline1}<br />{a.headline2}
          </h1>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-lg)', color: 'var(--pc-fg-2)', lineHeight: 1.6 }}>
            {a.body1}
          </p>
        </div>

        {/* Story grid */}
        <div
          className="pc-about-grid"
          style={{
            maxWidth: 1000, margin: '0 auto',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(32px, 5vw, 64px)',
            marginBottom: 'var(--pc-space-20)', alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', height: 400, background: 'var(--pc-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
            <Image
              src="/about-story.png"
              alt="Detailer at work in our Ghaziabad centre"
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--pc-space-5)' }}>
            <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(28px, 3vw, 40px)', color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)' }}>
              {a.standardTitle}
            </h2>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', color: 'var(--pc-fg-2)', lineHeight: 1.6 }}>{a.body2}</p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', color: 'var(--pc-fg-2)', lineHeight: 1.6 }}>{a.body3}</p>
          </div>
        </div>

        {/* Core values */}
        <div style={{ maxWidth: 1000, margin: '0 auto', marginBottom: 'var(--pc-space-20)' }}>
          <h2 style={{
            fontFamily: 'var(--pc-serif)', fontSize: 'clamp(28px, 3vw, 40px)',
            color: 'var(--pc-fg)', marginBottom: 'var(--pc-space-10)',
            textAlign: 'center', letterSpacing: 'var(--pc-track-tight)',
          }}>
            {a.valuesTitle}
          </h2>
          <div className="pc-about-values" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--pc-space-6)' }}>
            {a.values.map(v => (
              <Card key={v.title} style={{ padding: 'var(--pc-space-8)' }}>
                <Eyebrow style={{ marginBottom: 16, display: 'block' }}>{v.eyebrow}</Eyebrow>
                <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-lg)', color: 'var(--pc-fg)', marginBottom: 12, fontWeight: 500 }}>{v.title}</h3>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)', lineHeight: 1.6 }}>{v.body}</p>
              </Card>
            ))}
          </div>
        </div>

        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
