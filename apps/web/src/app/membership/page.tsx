import MembershipContent from './MembershipContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works — Perfect Cleaners',
  description: 'Register your vehicle once. Your car gets cleaned every week at your society — no booking needed. Pay per wash, whenever you like.',
};

export default function MembershipPage() {
  return <MembershipContent />;
}
