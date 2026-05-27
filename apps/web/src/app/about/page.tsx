import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import CTASection from '@/components/marketing/CTASection';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Perfect Cleaners',
  description: 'Learn about our story and obsessive attention to detail at Perfect Cleaners.',
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, padding: '80px 56px 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow>[OUR STORY]</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 72, color: 'var(--pc-fg)', margin: '16px 0 32px', lineHeight: 1.1 }}>
            Obsessive Attention to Detail.
          </h1>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 20, color: 'var(--pc-fg-2)', lineHeight: 1.6, marginBottom: 80 }}>
            Founded in 2026, Perfect Cleaners set out to disrupt the local car wash industry. 
            We traded scratch-inducing automated brushes for meticulous two-bucket hand washes, 
            and cheap silicone sprays for professional-grade ceramic coatings.
          </p>
        </div>

        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginBottom: 120 }}>
          <div style={{ position: 'relative', height: 400, background: 'var(--pc-card)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
            <Image src="/about-story.png" alt="Detailer at work" fill style={{ objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 40, color: 'var(--pc-fg)', marginBottom: 24 }}>The Perfect Cleaners Standard</h2>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg-2)', lineHeight: 1.6, marginBottom: 24 }}>
              Every vehicle that enters our centre is treated with the utmost respect. We don't believe in cutting corners or rushing jobs. Our team of certified detailers uses only the finest pH-neutral chemicals, plush microfiber towels, and state-of-the-art equipment.
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, color: 'var(--pc-fg-2)', lineHeight: 1.6 }}>
              Whether you drive a daily commuter or a weekend exotic, you receive the same obsessive level of care.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1000, margin: '0 auto', marginBottom: 120 }}>
          <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 40, color: 'var(--pc-fg)', marginBottom: 40, textAlign: 'center' }}>Our Core Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <Card style={{ padding: 32 }}>
              <Eyebrow style={{ marginBottom: 16, display: 'block' }}>01 / QUALITY FIRST</Eyebrow>
              <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 20, color: 'var(--pc-fg)', marginBottom: 12 }}>No Compromises</h3>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>We use the best products available globally. If a product doesn't meet our rigorous testing standards, it doesn't touch your car.</p>
            </Card>
            <Card style={{ padding: 32 }}>
              <Eyebrow style={{ marginBottom: 16, display: 'block' }}>02 / TRANSPARENCY</Eyebrow>
              <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 20, color: 'var(--pc-fg)', marginBottom: 12 }}>Honest Pricing</h3>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>No hidden fees or aggressive upsells. You get exactly what you pay for, clearly outlined before we begin work.</p>
            </Card>
            <Card style={{ padding: 32 }}>
              <Eyebrow style={{ marginBottom: 16, display: 'block' }}>03 / EDUCATION</Eyebrow>
              <h3 style={{ fontFamily: 'var(--pc-sans)', fontSize: 20, color: 'var(--pc-fg)', marginBottom: 12 }}>Empowering Owners</h3>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', lineHeight: 1.5 }}>We don't just clean; we educate you on how to maintain the finish and protect your investment long-term.</p>
            </Card>
          </div>
        </div>
        
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
