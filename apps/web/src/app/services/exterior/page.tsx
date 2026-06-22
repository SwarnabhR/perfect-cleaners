import type { Metadata } from 'next';
import ExteriorContent from './ExteriorContent';

export const metadata: Metadata = {
  title: 'Exterior Wash',
  description: 'Hand wash and rinse, tyre dressing, and exterior protection for your car in Delhi NCR. Professional foam-mitt technique with pH-neutral shampoo.',
  openGraph: {
    title: 'Exterior Car Wash — Perfect Cleaners, Delhi NCR',
    description: 'Professional hand wash, rinse, tyre dressing, and exterior protection in Delhi NCR.',
    images: [{ url: '/service-exterior-a.png', width: 1200, height: 800, alt: 'Foam-mitt exterior hand wash — Perfect Cleaners' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Exterior Car Wash — Perfect Cleaners, Delhi NCR',
    description: 'Professional exterior hand wash in Delhi NCR.',
  },
};

export default function ExteriorWashPage() {
  return <ExteriorContent />;
}
