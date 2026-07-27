import { Metadata } from 'next';
import ForSocietiesContent from './ForSocietiesContent';

export const metadata: Metadata = {
  title: 'Society Cleaning Programme',
  description: 'Bring scheduled, crew-based car washing to your housing society. Free to list — residents pay per wash, the RWA is never invoiced.',
  openGraph: {
    title: 'Society Cleaning Programme — Perfect Cleaners',
    description: 'Scheduled, crew-based car washing for residential societies in Delhi NCR. Free to list — residents pay per wash.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Perfect Cleaners — Society Cleaning Programme' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Society Cleaning Programme — Perfect Cleaners',
    description: 'Scheduled, crew-based car washing for residential societies in Delhi NCR.',
  },
};

export default function ForSocietiesPage() {
  return <ForSocietiesContent />;
}
