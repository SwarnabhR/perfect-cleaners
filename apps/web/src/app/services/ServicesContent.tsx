'use client';

import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SectionHeader from '@/components/marketing/SectionHeader';
import ServiceFeature from '@/components/marketing/ServiceFeature';
import PremiumSection from '@/components/marketing/PremiumSection';
import CTASection from '@/components/marketing/CTASection';
import { useI18n } from '@/i18n';

export default function ServicesContent() {
  const { t } = useI18n();
  const s = t.servicesPage;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1, paddingBottom: 80 }}>
        <SectionHeader badgeText={s.headerBadge} title={s.headerTitle} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ServiceFeature
            num={s.features[0].num} name={s.features[0].name} price={s.features[0].price}
            title={s.features[0].title} body={s.features[0].body}
          />
          <PremiumSection />
          <ServiceFeature
            num={s.features[1].num} name={s.features[1].name} price={s.features[1].price}
            title={s.features[1].title} body={s.features[1].body}
          />
          <ServiceFeature
            num={s.features[2].num} name={s.features[2].name} price={s.features[2].price}
            title={s.features[2].title} body={s.features[2].body}
          />
        </div>
        <div style={{ marginTop: 80 }}>
          <CTASection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
