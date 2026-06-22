import Nav from '@/components/marketing/Nav';
import Hero from '@/components/marketing/Hero';
import SectionHeader from '@/components/marketing/SectionHeader';
import ServiceFeature from '@/components/marketing/ServiceFeature';
import PremiumSection from '@/components/marketing/PremiumSection';
import SocietiesSection from '@/components/marketing/SocietiesSection';
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://perfectcleaners.co.in/#organization',
      name: 'Perfect Cleaners',
      url: 'https://perfectcleaners.co.in',
      logo: {
        '@type': 'ImageObject',
        url: 'https://perfectcleaners.co.in/logo-wordmark.svg',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-98765-43210',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
      sameAs: [],
    },
    {
      '@type': 'LocalBusiness',
      '@id': 'https://perfectcleaners.co.in/#business',
      name: 'Perfect Cleaners',
      description: 'Premium car detailing, ceramic coatings, and society cleaning programmes in Delhi NCR.',
      url: 'https://perfectcleaners.co.in',
      telephone: '+91-98765-43210',
      email: 'hello@perfectcleaners.in',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'B-204 Industrial Area, Kavi Nagar',
        addressLocality: 'Ghaziabad',
        addressRegion: 'Uttar Pradesh',
        postalCode: '201002',
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 28.6692,
        longitude: 77.4538,
      },
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '21:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '08:00', closes: '22:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '10:00', closes: '19:00' },
      ],
      priceRange: '₹₹',
      currenciesAccepted: 'INR',
      paymentAccepted: 'Cash, UPI, Credit Card',
      areaServed: { '@type': 'AdministrativeArea', name: 'Delhi NCR' },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Car Detailing Services',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Interior Detailing', description: 'Deep-clean carpets, conditioned leather, and a fresh cabin.' }, price: '500', priceCurrency: 'INR' },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Exterior Wash', description: 'Pressure pre-rinse, foam cannon, and hand-mitt panel finish.' }, price: '200', priceCurrency: 'INR' },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ceramic Coating', description: 'Long-lasting hydrophobic protection and mirror-gloss finish.' }, price: '4000', priceCurrency: 'INR' },
        ],
      },
    },
  ],
};

export default function MarketingHome() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
        <SocietiesSection />
        <USP />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
