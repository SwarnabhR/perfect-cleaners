import MembershipContent from './MembershipContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Membership',
  description: 'Join our exclusive maintenance club for regular, discounted details.',
};

export default function MembershipPage() {
  return <MembershipContent />;
}
