import AboutContent from './AboutContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our story and obsessive attention to detail at Perfect Cleaners, Delhi NCR.',
  openGraph: {
    title: 'About Perfect Cleaners — Delhi NCR',
    description: 'Learn about our story and obsessive attention to detail at Perfect Cleaners, Delhi NCR.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Perfect Cleaners — Premium Car Detailing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Perfect Cleaners — Delhi NCR',
    description: 'Learn about our story and obsessive attention to detail at Perfect Cleaners, Delhi NCR.',
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
