'use client';

import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SectionHeader from '@/components/marketing/SectionHeader';
import CTASection from '@/components/marketing/CTASection';
import MembershipCards from './MembershipCards';
import { useI18n } from '@/i18n';

export default function MembershipContent() {
  const { t } = useI18n();
  const m = t.membership;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <SectionHeader badgeText={m.eyebrow} title={m.headline} subtitle={m.sub} />
        <MembershipCards />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
