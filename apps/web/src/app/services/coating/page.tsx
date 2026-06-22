import type { Metadata } from 'next';
import CoatingContent from './CoatingContent';

export const metadata: Metadata = {
  title: 'Ceramic Coating',
  description: 'Professional ceramic coating application in Delhi NCR — long-lasting hydrophobic protection, mirror-gloss finish, and scratch resistance for your vehicle.',
  openGraph: {
    title: 'Ceramic Coating — Perfect Cleaners, Delhi NCR',
    description: 'Long-lasting hydrophobic protection, mirror-gloss finish, and scratch resistance applied by certified specialists.',
    images: [{ url: '/service-coating-a.png', width: 1200, height: 800, alt: 'Ceramic coating applicator pad — Perfect Cleaners' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ceramic Coating — Perfect Cleaners, Delhi NCR',
    description: 'Professional ceramic coating in Delhi NCR.',
  },
};

export default function CeramicCoatingPage() {
  return <CoatingContent />;
}
