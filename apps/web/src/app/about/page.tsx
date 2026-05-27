import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import CTASection from '@/components/marketing/CTASection';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our story and obsessive attention to detail at Perfect Cleaners, Delhi NCR.',
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) var(--pc-space-20)' }}>

        {/* Hero text */}
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: 'var(--pc-space-20)' }}>
          <Eyebrow>[OUR STORY]</Eyebrow>
          <h1 style={{
            fontFamily: 'var(--pc-serif)',
            fontSize: 'clamp(40px, 6vw, 72px)',
            color: 'var(--pc-fg)',
            margin: '16px 0 32px',
            lineHeight: 1.1,
            letterSpacing: 'var(--pc-track-tight)',
          }}>
            Obsessive Attention<br />to Detail.
          </h1>
          <p style={{
            fontFamily: 'var(--pc-sans)',
            fontSize: 'var(--pc-text-lg)',
            color: 'var(--pc-fg-2)',
            lineHeight: 1.6,
          }}>
            Founded in 2021, Perfect Cleaners set out to fix what was broken in the local car wash industry.
            We traded scratch-inducing automated brushes for meticulous two-bucket hand washes,
            and cheap silicone sprays for professional-grade ceramic coatings.
          </p>
        </div>

        {/* Story grid */}
        <div
          className="pc-about-grid"
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(32px, 5vw, 64px)',
            marginBottom: 'var(--pc-space-20)',
            alignItems: 'center',
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
              The Perfect Cleaners Standard
            </h2>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', color: 'var(--pc-fg-2)', lineHeight: 1.6 }}>
              Every vehicle that enters our centre is treated with the utmost respect. We don't believe in cutting corners or rushing jobs. Our team of certified detailers uses only the finest pH-neutral chemicals, plush microfibre towels, and state-of-the-art equipment.
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-base)', color: 'var(--pc-fg-2)', lineHeight: 1.6 }}>
              Whether you drive a daily commuter or a weekend exotic, you receive the same obsessive level of care.
            </p>
          </div>
        </div>

        {/* Core values */}
        <div style={{ maxWidth: 1000, margin: '0 auto', marginBottom: 'var(--pc-space-20)' }}>
          <h2 style={{
            fontFamily: 'var(--pc-serif)',
            fontSize: 'clamp(28px, 3vw, 40px)',
            color: 'var(--pc-fg)',
            marginBottom: 'var(--pc-space-10)',
            textAlign: 'center',
            letterSpacing: 'var(--pc-track-tight)',
          }}>Our Core Values</h2>
          <div
            className="pc-about-values"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--pc-space-6)' }}
          >
            {[
              {
                eyebrow: '01 / QUALITY FIRST',
                title:   'No Compromises',
                body:    'We use the best products available globally. If a product doesn\'t meet our rigorous testing standards, it doesn\'t touch your car.',
              },
              {
                eyebrow: '02 / TRANSPARENCY',
                title:   'Honest Pricing',
                body:    'No hidden fees or aggressive upsells. You get exactly what you pay for, clearly outlined before we begin work.',
              },
              {
                eyebrow: '03 / EDUCATION',
                title:   'Empowering Owners',
                body:    'We don\'t just clean — we educate you on how to maintain the finish and protect your investment long-term.',
              },
            ].map(({ eyebrow, title, body }) => (
              <Card key={title} style={{ padding: 'var(--pc-space-8)' }}>
                <Eyebrow style={{ marginBottom: 16, display: 'block' }}>{eyebrow}</Eyebrow>
                <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-lg)', color: 'var(--pc-fg)', marginBottom: 12, fontWeight: 500 }}>{title}</h3>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)', lineHeight: 1.6 }}>{body}</p>
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
