import Nav from '@/components/marketing/Nav';
import Hero from '@/components/marketing/Hero';
import SectionHeader from '@/components/marketing/SectionHeader';
import ServiceFeature from '@/components/marketing/ServiceFeature';
import PremiumSection from '@/components/marketing/PremiumSection';
import USP from '@/components/marketing/USP';
import CTASection from '@/components/marketing/CTASection';
import Footer from '@/components/marketing/Footer';

const SERVICES = [
  {
    num: '01', name: 'Interior Detailing', price: '₹500 — ₹1,000',
    title: 'Interior Detailing, Done Properly',
    body: 'Deep-cleaned carpets, conditioned leather, and a cabin that smells as good as it looks. Every surface is worked by hand — nothing gets a quick wipe and a pass.',
  },
  {
    num: '02', name: 'Exterior Wash', price: '₹200 — ₹500',
    title: 'Exterior Wash, No Shortcuts',
    body: "A pressure pre-rinse, pH-neutral foam cannon, and hand-mitt finish panel by panel. We don't run your car through a machine — because your paint notices the difference.",
  },
  {
    num: '03', name: 'Paint Protection', price: '₹4,000 — ₹50,000',
    title: 'Paint Protection & Ceramic Coating',
    body: 'From paint sealant to full 9H ceramic coating — we protect your paint from UV, water spots, and contamination. Protection that actually compounds your car\'s long-term value.',
  },
] as const;

export default function MarketingHome() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SectionHeader
          title="Every service your car will ever need."
          badgeText="1,500+ Cars Detailed"
        />
        <ServiceFeature {...SERVICES[0]} />
        <PremiumSection />
        <div style={{ height: 'var(--pc-space-4)' }} />
        <ServiceFeature {...SERVICES[1]} />
        <div style={{ height: 'var(--pc-space-4)' }} />
        <ServiceFeature {...SERVICES[2]} />
        <USP />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
