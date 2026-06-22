import ServicesContent from './ServicesContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Premium exterior wash, interior detailing, and ceramic coating services in Delhi NCR. Certified specialists and professional-grade products.',
  openGraph: {
    title: 'Car Detailing Services — Perfect Cleaners, Delhi NCR',
    description: 'Exterior wash, interior detailing, and ceramic coating by certified specialists in Delhi NCR.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Perfect Cleaners — Premium Car Detailing Services' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Car Detailing Services — Perfect Cleaners, Delhi NCR',
    description: 'Exterior wash, interior detailing, and ceramic coating by certified specialists.',
  },
};

export default function ServicesPage() {
  return <ServicesContent />;
}
