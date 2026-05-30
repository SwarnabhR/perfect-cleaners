import ServicesContent from './ServicesContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Premium car wash, interior detailing, and ceramic coating services.',
};

export default function ServicesPage() {
  return <ServicesContent />;
}
