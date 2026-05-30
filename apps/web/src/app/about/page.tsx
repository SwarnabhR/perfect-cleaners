import AboutContent from './AboutContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our story and obsessive attention to detail at Perfect Cleaners, Delhi NCR.',
};

export default function AboutPage() {
  return <AboutContent />;
}
