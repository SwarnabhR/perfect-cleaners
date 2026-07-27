'use client';

import Image from 'next/image';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { useI18n } from '@/i18n';

export default function ForSocietiesContent() {
  const { t } = useI18n();
  const p = t.societiesPage;

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 72 }}>

        {/* ── Hero ── */}
        <section style={{
          padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) var(--pc-space-16)',
          maxWidth: 'var(--pc-maxw-content)',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--pc-space-12)',
          alignItems: 'center',
        }} className="pc-about-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
            <Eyebrow>{p.heroEyebrow}</Eyebrow>
            <h1 style={{
              fontFamily: 'var(--pc-serif)',
              fontSize: 'var(--pc-text-3xl)',
              lineHeight: 'var(--pc-lh-tight)',
              letterSpacing: 'var(--pc-track-tight)',
              color: 'var(--pc-fg)',
              margin: 0,
            }}>
              {p.heroHeadline[0]}<br />{p.heroHeadline[1]}<br />{p.heroHeadline[2]}
            </h1>
            <p style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-base)',
              color: 'var(--pc-fg-2)',
              lineHeight: 'var(--pc-lh-loose)',
              maxWidth: 420,
              margin: 0,
            }}>
              {p.heroSub}
            </p>
            <div style={{ display: 'flex', gap: 'var(--pc-space-2)', flexWrap: 'wrap' }}>
              <Button href="/contact">{p.heroPrimaryCta}</Button>
              <Button href="/contact" variant="ghost">{p.heroSecondaryCta}</Button>
            </div>
          </div>

          {/* Right photo */}
          <div style={{
            position: 'relative', height: 380,
            borderRadius: 'var(--pc-radius-xl)', overflow: 'hidden',
            border: '1px solid var(--pc-line)',
          }}>
            <Image
              src="/hero-professional-detailer.png"
              alt="Perfect Cleaners crew washing cars in a residential society"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section style={{
          borderTop: '1px solid var(--pc-line)',
          borderBottom: '1px solid var(--pc-line)',
        }}>
          <div
            className="pc-for-societies-stats"
            style={{
              maxWidth: 'var(--pc-maxw-content)',
              margin: '0 auto',
              padding: 'var(--pc-space-8) var(--pc-screen-pad-lg)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
            }}
          >
            {p.stats.map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: 'var(--pc-space-4) var(--pc-space-5)',
                  borderRight: i < p.stats.length - 1 ? '1px solid var(--pc-line)' : 'none',
                }}
              >
                <p style={{
                  fontFamily: 'var(--pc-serif)',
                  fontSize: 'var(--pc-text-2xl)',
                  color: 'var(--pc-fg)',
                  letterSpacing: 'var(--pc-track-tight)',
                  lineHeight: 1,
                  margin: '0 0 var(--pc-space-1)',
                }}>{s.num}</p>
                <p style={{
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-xs)',
                  color: 'var(--pc-fg-3)',
                  margin: 0,
                  letterSpacing: 'var(--pc-track-wide)',
                  textTransform: 'uppercase',
                }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{
          maxWidth: 'var(--pc-maxw-content)',
          margin: '0 auto',
          padding: 'var(--pc-space-20) var(--pc-screen-pad-lg)',
        }}>
          <Eyebrow style={{ marginBottom: 'var(--pc-space-6)' }}>{p.howItWorksLabel}</Eyebrow>
          <div
            className="pc-for-societies-steps"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 'var(--pc-space-6)',
            }}
          >
            {p.steps.map(s => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
                <span style={{
                  fontFamily: 'var(--pc-mono)',
                  fontSize: 'var(--pc-text-xs)',
                  color: 'var(--pc-sage-hi)',
                  letterSpacing: 'var(--pc-track-mono)',
                }}>{s.num}</span>
                <h3 style={{
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-base)',
                  fontWeight: 600,
                  color: 'var(--pc-fg)',
                  margin: 0,
                  lineHeight: 'var(--pc-lh-snug)',
                }}>{s.title}</h3>
                <p style={{
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-sm)',
                  color: 'var(--pc-fg-2)',
                  lineHeight: 'var(--pc-lh-body)',
                  margin: 0,
                }}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Benefits grid ── */}
        <section style={{
          background: 'var(--pc-card)',
          borderTop: '1px solid var(--pc-line)',
          borderBottom: '1px solid var(--pc-line)',
        }}>
          <div
            className="pc-for-societies-benefits"
            style={{
              maxWidth: 'var(--pc-maxw-content)',
              margin: '0 auto',
              padding: 'var(--pc-space-20) var(--pc-screen-pad-lg)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 'var(--pc-space-8) var(--pc-space-10)',
            }}
          >
            {p.benefits.map(b => (
              <div key={b.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-2)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={b.icon} size={16} color="var(--pc-sage-ink)" />
                </div>
                <h3 style={{
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-base)',
                  fontWeight: 600,
                  color: 'var(--pc-fg)',
                  margin: 0,
                }}>{b.title}</h3>
                <p style={{
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-sm)',
                  color: 'var(--pc-fg-2)',
                  lineHeight: 'var(--pc-lh-body)',
                  margin: 0,
                }}>{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section style={{
          maxWidth: 'var(--pc-maxw-content)',
          margin: '0 auto',
          padding: 'var(--pc-space-20) var(--pc-screen-pad-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--pc-space-5)',
        }}>
          <Eyebrow>{p.bottomEyebrow}</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--pc-serif)',
            fontSize: 'var(--pc-text-2xl)',
            lineHeight: 'var(--pc-lh-tight)',
            letterSpacing: 'var(--pc-track-tight)',
            color: 'var(--pc-fg)',
            margin: 0,
            maxWidth: 480,
          }}>
            {p.bottomHeadline}
          </h2>
          <div style={{ display: 'flex', gap: 'var(--pc-space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button href="/contact">{p.heroPrimaryCta}</Button>
            <Button href="/contact" variant="ghost">{p.heroSecondaryCta}</Button>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
