import { Suspense } from 'react';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import BookingFlow from '@/components/booking/BookingFlow';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Service',
  description: 'Schedule your premium car wash and detailing service online.',
};

function BookingFallback() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--pc-space-32) var(--pc-space-10)',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--pc-space-4)',
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: '2px solid var(--pc-line)',
          borderTopColor: 'var(--pc-sage-hi)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{
          fontFamily: 'var(--pc-mono)',
          fontSize: 10,
          color: 'var(--pc-fg-4)',
          letterSpacing: 'var(--pc-track-mono)',
        }}>
          LOADING
        </span>
      </div>
    </div>
  );
}

export default function BookPage() {
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/*
          useSearchParams() inside BookingFlow requires a Suspense boundary for
          Next.js static prerendering. The fallback is shown for the brief moment
          before the client hydrates and reads the URL search params.
        */}
        <Suspense fallback={<BookingFallback />}>
          <BookingFlow />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
