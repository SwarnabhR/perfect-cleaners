import Nav from '@/components/marketing/Nav';
import Hero from '@/components/marketing/Hero';
import SectionHeader from '@/components/marketing/SectionHeader';
import HomeServices from '@/components/marketing/HomeServices';
import SocietiesSection from '@/components/marketing/SocietiesSection';
import USP from '@/components/marketing/USP';
import CTASection from '@/components/marketing/CTASection';
import Footer from '@/components/marketing/Footer';

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
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '06:00', closes: '16:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '06:00', closes: '16:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '06:00', closes: '16:00' },
      ],
      priceRange: '₹₹',
      currenciesAccepted: 'INR',
      paymentAccepted: 'Cash, UPI, Credit Card',
      areaServed: { '@type': 'AdministrativeArea', name: 'Delhi NCR' },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Car Detailing Services',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Interior Detailing', description: 'Deep-clean carpets, conditioned leather, and a fresh cabin.' }, price: '1500', priceCurrency: 'INR' },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Exterior Wash', description: 'Pressure pre-rinse, foam cannon, and hand-mitt panel finish.' }, price: '800', priceCurrency: 'INR' },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ceramic Coating', description: 'Long-lasting hydrophobic protection and mirror-gloss finish.' }, price: '15000', priceCurrency: 'INR' },
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
        <HomeServices />
        <SocietiesSection />
        <USP />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
