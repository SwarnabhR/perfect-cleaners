import type { Metadata } from 'next';
import InteriorContent from './InteriorContent';

export const metadata: Metadata = {
  title: 'Interior Detailing',
  description: 'Deep-clean your cabin with our professional interior detailing service in Delhi NCR — vacuuming, leather conditioning, dashboard treatment, and odour elimination.',
  openGraph: {
    title: 'Interior Detailing — Perfect Cleaners, Delhi NCR',
    description: 'Professional interior detailing: vacuuming, leather conditioning, dashboard treatment, and odour elimination.',
    images: [{ url: '/service-interior-a.png', width: 1200, height: 800, alt: 'Professional interior detailing — leather seat microfiber clean' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interior Detailing — Perfect Cleaners, Delhi NCR',
    description: 'Professional interior detailing in Delhi NCR.',
  },
};

export default function InteriorDetailingPage() {
  return <InteriorContent />;
}
