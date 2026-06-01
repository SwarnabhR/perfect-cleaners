'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp, type Unsubscribe } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { BookingStatus } from '@pc/firebase';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import StatusPill from '@/components/ui/StatusPill';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingRow {
  id:          string;
  bookingRef:  string;
  status:      BookingStatus;
  serviceName: string;
  scheduledAt: Date;
  total:       number;
  address:     string;
}

// ─── Status label mapping ─────────────────────────────────────────────────────

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending:    'Pending',
  assigned:   'Confirmed',
  enroute:    'En Route',
  inprogress: 'In Progress',
  done:       'Done',
  cancelled:  'Cancelled',
};

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({ b, onCancel }: { b: BookingRow; onCancel: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canCancel = b.status === 'pending' || b.status === 'assigned';

  async function handleCancel() {
    if (!confirming) { setConfirming(true); return; }
    setCancelling(true);
    await onCancel(b.id);
    setCancelling(false);
    setConfirming(false);
  }

  const date = b.scheduledAt.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const time = b.scheduledAt.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={{
      background:   'var(--pc-card)',
      border:       '1px solid var(--pc-line)',
      borderRadius: 'var(--pc-radius-md)',
      padding:      'var(--pc-space-5)',
      display:      'flex',
      flexDirection:'column',
      gap:          'var(--pc-space-3)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            fontFamily: 'var(--pc-mono)',
            fontSize:   10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:      'var(--pc-fg-3)',
            margin:     0,
          }}>
            {b.bookingRef}
          </p>
          <p style={{
            fontFamily: 'var(--pc-sans)',
            fontSize:   15,
            fontWeight: 500,
            color:      'var(--pc-fg)',
            margin:     '4px 0 0',
          }}>
            {b.serviceName}
          </p>
        </div>
        <StatusPill status={STATUS_LABEL[b.status] ?? b.status} />
      </div>

      {/* Meta row */}
      <div style={{
        display:    'flex',
        gap:        'var(--pc-space-6)',
        flexWrap:   'wrap',
        paddingTop: 'var(--pc-space-3)',
        borderTop:  '1px solid var(--pc-line)',
      }}>
        {[
          { label: 'Date',     val: `${date} · ${time}` },
          { label: 'Location', val: b.address || '—'    },
          { label: 'Total',    val: `₹${b.total.toLocaleString('en-IN')}` },
        ].map(({ label, val }) => (
          <div key={label}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pc-fg-4)', margin: 0 }}>
              {label}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', margin: '3px 0 0' }}>
              {val}
            </p>
          </div>
        ))}
      </div>

      {/* Cancel action — only for pending/assigned bookings */}
      {canCancel && (
        <div style={{ paddingTop: 'var(--pc-space-3)', borderTop: '1px solid var(--pc-line)' }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              padding:       '8px 18px',
              borderRadius:   999,
              background:    'transparent',
              border:        `1px solid ${confirming ? 'var(--pc-danger)' : 'currentColor'}`,
              fontFamily:    'var(--pc-sans)',
              fontSize:       12,
              color:          confirming ? 'var(--pc-danger)' : 'var(--pc-fg-3)',
              cursor:         cancelling ? 'not-allowed' : 'pointer',
              opacity:        cancelling ? 0.6 : 1,
              letterSpacing: '0.04em',
            }}
          >
            {cancelling ? 'Cancelling…' : confirming ? 'Tap again to confirm' : 'Cancel booking'}
          </button>
          {confirming && (
            <button
              type="button"
              onClick={() => setConfirming(false)}
              style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)' }}
            >
              Never mind
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ h = 20, w = '100%' }: { h?: number; w?: string | number }) {
  return (
    <div style={{
      height:       h,
      width:        w,
      background:   'var(--pc-card)',
      borderRadius: 'var(--pc-radius-sm)',
      animation:    'pc-pulse 1.6s ease-in-out infinite',
    }} />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { user, loading, signOut } = useCustomerAuth();
  const router = useRouter();

  const [bookings,    setBookings]    = useState<BookingRow[]>([]);
  const [bLoading,    setBLoading]    = useState(true);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [profileName, setProfileName] = useState('');

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/signin?from=/account');
  }, [user, loading, router]);

  // Load profile name for greeting
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'customers', user.uid)).then(snap => {
      if (snap.exists()) setProfileName(snap.data().name ?? '');
    });
  }, [user]);

  // Fetch bookings by phone number — matches bookings from both web + mobile
  useEffect(() => {
    if (!user?.phoneNumber) return;
    setBLoading(true);

    const q = query(
      collection(db, 'bookings'),
      where('customerPhone', '==', user.phoneNumber),
    );

    let unsub: Unsubscribe;
    unsub = onSnapshot(q,
      snap => {
        const rows: BookingRow[] = snap.docs
          .map(d => {
            const data = d.data();
            const scheduledAt = data.scheduledAt?.toDate?.() ?? new Date(data.scheduledAt ?? 0);
            return {
              id:          d.id,
              bookingRef:  data.bookingRef ?? d.id.slice(0, 8).toUpperCase(),
              status:      data.status as BookingStatus,
              serviceName: data.serviceIds?.[0]?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Service',
              scheduledAt,
              total:       data.priceBreakdown?.total ?? 0,
              address:     [data.address?.line1, data.address?.city].filter(Boolean).join(', '),
            };
          })
          .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());

        setBookings(rows);
        setBLoading(false);
      },
      err => {
        console.warn('[AccountPage] Firestore:', err.message);
        setBLoading(false);
      },
    );
    return () => unsub();
  }, [user?.phoneNumber]);

  async function handleCancelBooking(bookingId: string) {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status:    'cancelled',
      updatedAt: serverTimestamp(),
    });
  }

  async function handleSignOut() {
    setSignOutBusy(true);
    await signOut();
    router.replace('/');
  }

  if (loading || !user) return null;

  const displayPhone = user.phoneNumber?.replace('+91', '') ?? '';
  const formattedPhone = displayPhone
    ? `+91 ${displayPhone.slice(0, 5)} ${displayPhone.slice(5)}`
    : '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <main style={{
        flex: 1,
        maxWidth: 800,
        width: '100%',
        margin: '0 auto',
        padding: 'var(--pc-space-12) var(--pc-space-6) var(--pc-space-20)',
      }}>

        {/* Header */}
        <div className="pc-account-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 'var(--pc-space-6)',
          gap: 'var(--pc-space-4)',
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--pc-fg-3)', margin: '0 0 10px',
            }}>
              [ACCOUNT]
            </p>
            <h1 style={{
              fontFamily: 'var(--pc-serif)', fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 400, color: 'var(--pc-fg)',
              letterSpacing: '-0.02em', lineHeight: 1.05, margin: 0,
            }}>
              {profileName ? `Hi, ${profileName.split(' ')[0]}.` : 'Your account.'}
            </h1>
            {formattedPhone && (
              <p style={{
                fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)',
                margin: '8px 0 0',
              }}>
                {formattedPhone}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--pc-space-3)', alignItems: 'center', flexShrink: 0 }}>
            <Link
              href="/book"
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '10px 20px',
                background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                border: 'none', borderRadius: 999,
                fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              Book a service →
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signOutBusy}
              style={{
                padding: '10px 16px',
                background: 'transparent', color: 'var(--pc-fg-3)',
                border: '1px solid currentColor', borderRadius: 999,
                fontFamily: 'var(--pc-sans)', fontSize: 12, letterSpacing: '0.04em',
                cursor: signOutBusy ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {signOutBusy ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 'var(--pc-space-1)',
          borderBottom: '1px solid var(--pc-line)',
          marginBottom: 'var(--pc-space-8)',
        }}>
          {[
            { label: 'Bookings', href: '/account'         },
            { label: 'Profile',  href: '/account/profile' },
            { label: 'Bill',     href: '/account/wallet'  },
          ].map(tab => {
            const active = tab.href === '/account';
            return (
              <a
                key={tab.href}
                href={tab.href}
                style={{
                  padding: 'var(--pc-space-3) var(--pc-space-4)',
                  fontFamily: 'var(--pc-sans)', fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--pc-fg)' : 'var(--pc-fg-3)',
                  textDecoration: 'none',
                  borderBottom: active ? '2px solid var(--pc-fg)' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'color 0.15s ease',
                }}
              >
                {tab.label}
              </a>
            );
          })}
        </div>

        {/* Bookings */}
        {bLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
                borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-5)',
                display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Skeleton h={10} w={80} />
                    <Skeleton h={16} w={160} />
                  </div>
                  <Skeleton h={24} w={90} />
                </div>
                <Skeleton h={1} />
                <div style={{ display: 'flex', gap: 'var(--pc-space-6)' }}>
                  <Skeleton h={32} w={140} />
                  <Skeleton h={32} w={120} />
                  <Skeleton h={32} w={80} />
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--pc-space-20) var(--pc-space-6)',
            background: 'var(--pc-card)',
            border: '1px solid var(--pc-line)',
            borderRadius: 'var(--pc-radius-md)',
          }}>
            <p style={{
              fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--pc-fg-4)', marginBottom: 12,
            }}>
              [NO BOOKINGS YET]
            </p>
            <p style={{
              fontFamily: 'var(--pc-serif)', fontSize: 28, color: 'var(--pc-fg)',
              letterSpacing: '-0.02em', marginBottom: 16,
            }}>
              Your first wash awaits.
            </p>
            <p style={{
              fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-3)',
              lineHeight: 1.6, maxWidth: 360, margin: '0 auto 28px',
            }}>
              Book your first premium wash or detailing session — takes under two minutes.
            </p>
            <Link href="/book" style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '12px 28px',
              background: 'var(--pc-warm)', color: 'var(--pc-ink)',
              borderRadius: 999,
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Book now →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-4)' }}>
            {bookings.map(b => <BookingCard key={b.id} b={b} onCancel={handleCancelBooking} />)}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
