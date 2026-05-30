'use client';

import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SectionHeader from '@/components/marketing/SectionHeader';
import CTASection from '@/components/marketing/CTASection';
import FaqAccordion from '@/components/marketing/FaqAccordion';
import { useI18n } from '@/i18n';

export default function FaqContent() {
  const { t } = useI18n();
  const f = t.faqPage;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <SectionHeader badgeText={f.eyebrow} title={f.headline} subtitle={f.sub} />
        <FaqAccordion />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
