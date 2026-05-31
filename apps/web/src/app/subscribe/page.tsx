import { Suspense } from 'react';
import type { Metadata } from 'next';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import SubscribeFlow from './SubscribeFlow';

export const metadata: Metadata = {
  title: 'Subscribe — Perfect Cleaners',
  description: 'Set up your recurring car care subscription.',
};

export default function SubscribePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <Suspense>
          <SubscribeFlow />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
