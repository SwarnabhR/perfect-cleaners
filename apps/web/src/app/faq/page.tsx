import FaqContent from './FaqContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers to common questions about Perfect Cleaners services, pricing, scheduling, and the society cleaning programme.',
  openGraph: {
    title: 'FAQ — Perfect Cleaners, Delhi NCR',
    description: 'Common questions about our services, process, and bookings.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Perfect Cleaners — FAQ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ — Perfect Cleaners, Delhi NCR',
    description: 'Common questions about our services, process, and bookings.',
  },
};

export default function FAQPage() {
  return <FaqContent />;
}
