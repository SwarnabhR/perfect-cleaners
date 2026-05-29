import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import PlansSection from '@/components/plans/PlansSection';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plans',
  description:
    'Weekly, monthly, or annual subscriptions for premium car care. Choose your cadence — cancel or change anytime.',
};

export default function PlansPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--pc-ink)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Nav />
      <main style={{ flex: 1 }}>
        <PlansSection />
      </main>
      <Footer />
    </div>
  );
}
