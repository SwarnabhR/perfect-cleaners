'use client';

import ServiceFeature from '@/components/marketing/ServiceFeature';
import PremiumSection from '@/components/marketing/PremiumSection';
import { useI18n } from '@/i18n';

// Reads from the same i18n servicesPage.features the /services page uses,
// so home and /services can never drift apart on price/copy again.
export default function HomeServices() {
  const { t } = useI18n();
  const [interior, exterior, coating] = t.servicesPage.features;

  return (
    <>
      <ServiceFeature {...interior} />
      <PremiumSection />
      <div style={{ height: 'var(--pc-space-4)' }} />
      <ServiceFeature {...exterior} />
      <div style={{ height: 'var(--pc-space-4)' }} />
      <ServiceFeature {...coating} />
    </>
  );
}
