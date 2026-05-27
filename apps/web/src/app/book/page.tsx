import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import BookingFlow from '@/components/booking/BookingFlow';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Service | Perfect Cleaners',
  description: 'Schedule your premium car wash and detailing service online.',
};

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
      <main style={{ flex: 1 }}>
        <BookingFlow />
      </main>
      <Footer />
    </div>
  );
}
