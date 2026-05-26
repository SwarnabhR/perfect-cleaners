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
    title: 'Specialist of Interior Detailing',
    body: "We proudly offer a comprehensive refresh and protect your vehicle's interior, ensuring a truly luxurious feel that enhances your driving experience.",
  },
  {
    num: '02', name: 'Exterior Wash', price: '₹200 — ₹500',
    title: 'Gentle Exterior Wash Service',
    body: "Bring back your car's shine with our gentle yet thorough exterior wash.",
  },
  {
    num: '03', name: 'Paint Protection', price: '₹4,000 — ₹50,000',
    title: 'Paint Protection & Coating',
    body: 'Protect your paint with advanced coatings that deliver lasting shine and defence.',
  },
] as const;

export default function MarketingHome() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SectionHeader />
        <ServiceFeature {...SERVICES[0]} />
        <PremiumSection />
        <div style={{ height: 16 }} />
        <ServiceFeature {...SERVICES[1]} />
        <div style={{ height: 16 }} />
        <ServiceFeature {...SERVICES[2]} />
        <USP />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
