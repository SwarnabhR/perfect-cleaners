import FaqContent from './FaqContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Common questions about our services, process, and bookings.',
};

export default function FAQPage() {
  return <FaqContent />;
}
