'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';

// ─── Razorpay loader ──────────────────────────────────────────────────────────

function loadRazorpay(): Promise<any> {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve((window as any).Razorpay);
      return;
    }
    const script = document.createElement('script');
    script.src   = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve((window as any).Razorpay);
    document.body.appendChild(script);
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TxEntry {
  id:     string;
  label:  string;
  amount: number;
  type:   'charge' | 'payment';
  date:   string;
  ts:     number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding:        'var(--pc-space-3) var(--pc-space-4)',
  fontFamily:     'var(--pc-sans)',
  fontSize:       13,
  fontWeight:     active ? 600 : 400,
  color:          active ? 'var(--pc-fg)' : 'var(--pc-fg-3)',
  textDecoration: 'none',
  borderBottom:   active ? '2px solid var(--pc-fg)' : '2px solid transparent',
  marginBottom:   -1,
  transition:     'color 0.15s ease',
});

const monoLabel: React.CSSProperties = {
  fontFamily:    'var(--pc-mono)',
  fontSize:       9.5,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color:         'var(--pc-fg-4)',
  margin:         0,
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const { user, loading } = useCustomerAuth();
  const router = useRouter();

  const [outstanding, setOutstanding] = useState<number | null>(null);
  const [entries,     setEntries]     = useState<TxEntry[]>([]);
  const [txLoading,   setTxLoading]   = useState(true);
  const [paying,      setPaying]      = useState(false);
  const [payError,    setPayError]    = useState<string | null>(null);
  const [payDone,     setPayDone]     = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/signin?from=/account/wallet');
  }, [user, loading, router]);

  // Live outstanding balance
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, 'customers', user.uid),
      snap => setOutstanding(snap.exists() ? (snap.data()?.outstandingBalance ?? 0) : 0),
      err  => console.warn('[Wallet] balance:', err.message),
    );
    return unsub;
  }, [user]);

  // Transaction history
  useEffect(() => {
    if (!user) return;
    setTxLoading(true);
    const q    = query(
      collection(db, 'customers', user.uid, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const unsub = onSnapshot(
      q,
      snap => {
        const rows: TxEntry[] = snap.docs.map(d => {
          const data = d.data();
          const at   = data.createdAt?.toDate?.() ?? new Date();
          return {
            id:     d.id,
            label:  data.label ?? 'Wash',
            amount: data.amount ?? 0,
            type:   data.type === 'payment' ? 'payment' : 'charge',
            date:   at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            ts:     at.getTime(),
          };
        });
        setEntries(rows);
        setTxLoading(false);
      },
      err => {
        console.warn('[Wallet] transactions:', err.message);
        setTxLoading(false);
      },
    );
    return unsub;
  }, [user]);

  const handlePayNow = useCallback(async () => {
    if (!user || (outstanding ?? 0) <= 0) return;
    setPayError(null);
    setPaying(true);
    try {
      // 1. Create Razorpay order
      const orderRes = await fetch('/api/payment/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          amount:  outstanding,
          receipt: `settle_${user.uid}_${Date.now()}`,
        }),
      });
      const { orderId, keyId, error: orderErr } = await orderRes.json();
      if (orderErr || !orderId) throw new Error(orderErr ?? 'Could not create order.');

      // 2. Load and open Razorpay checkout
      const RazorpayCheckout = await loadRazorpay();
      const rzp = new RazorpayCheckout({
        key:         keyId,
        amount:      Math.round((outstanding ?? 0) * 100),
        currency:    'INR',
        order_id:    orderId,
        name:        'Perfect Cleaners',
        description: 'Settle outstanding balance',
        prefill:     { contact: user.phoneNumber ?? '' },
        theme:       { color: '#4A5E44' },
        modal:       { ondismiss: () => setPaying(false) },
        handler: async (response: any) => {
          // 3. Verify and record the payment
          const verifyRes = await fetch('/api/payment/settle-balance', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              customerId:          user.uid,
              amount:              outstanding,
            }),
          });
          const { ok, error: verifyErr } = await verifyRes.json();
          if (!ok) throw new Error(verifyErr ?? 'Payment verification failed.');
          setPayDone(true);
          setPaying(false);
        },
      });
      rzp.open();
    } catch (err: any) {
      setPayError(err.message ?? 'Payment failed.');
      setPaying(false);
    }
  }, [user, outstanding]);

  if (loading || !user) return null;

  const isPaid = (outstanding ?? 0) <= 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <main style={{
        flex:      1,
        maxWidth:  800,
        width:     '100%',
        margin:    '0 auto',
        padding:   'var(--pc-space-12) var(--pc-space-6) var(--pc-space-20)',
      }}>

        {/* Header */}
        <div style={{ marginBottom: 'var(--pc-space-6)' }}>
          <p style={{
            fontFamily:    'var(--pc-mono)',
            fontSize:       10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         'var(--pc-fg-3)',
            margin:        '0 0 10px',
          }}>
            [ACCOUNT]
          </p>
          <h1 style={{
            fontFamily:    'var(--pc-serif)',
            fontSize:      'clamp(28px, 5vw, 44px)',
            fontWeight:     400,
            color:         'var(--pc-fg)',
            letterSpacing: '-0.02em',
            lineHeight:     1.05,
            margin:         0,
          }}>
            Your bill.
          </h1>
        </div>

        {/* Tab bar */}
        <div style={{
          display:       'flex',
          gap:           'var(--pc-space-1)',
          borderBottom:  '1px solid var(--pc-line)',
          marginBottom:  'var(--pc-space-8)',
        }}>
          {[
            { label: 'Bookings', href: '/account'         },
            { label: 'Profile',  href: '/account/profile' },
            { label: 'Bill',     href: '/account/wallet'  },
          ].map(tab => (
            <a key={tab.href} href={tab.href} style={tabStyle(tab.href === '/account/wallet')}>
              {tab.label}
            </a>
          ))}
        </div>

        {/* Outstanding balance card */}
        <div style={{
          background:   isPaid ? 'var(--pc-sage)' : 'var(--pc-card)',
          border:       isPaid ? 'none' : '1px solid var(--pc-line-strong)',
          borderRadius: 'var(--pc-radius-lg)',
          padding:      32,
          marginBottom: 'var(--pc-space-6)',
          overflow:     'hidden',
        }}>
          <p style={{
            fontFamily:    'var(--pc-mono)',
            fontSize:       10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:          isPaid ? 'rgba(255,255,255,0.7)' : 'var(--pc-fg-3)',
            margin:         0,
          }}>
            [OUTSTANDING BALANCE]
          </p>

          <p style={{
            fontFamily:    'var(--pc-serif)',
            fontSize:      'clamp(44px, 8vw, 64px)',
            fontWeight:     400,
            color:          isPaid ? '#fff' : 'var(--pc-fg)',
            letterSpacing: '-0.03em',
            lineHeight:     1.1,
            margin:        '8px 0 0',
          }}>
            {outstanding === null ? '—' : `₹${outstanding.toLocaleString('en-IN')}`}
          </p>

          <p style={{
            fontFamily: 'var(--pc-sans)',
            fontSize:    13,
            color:       isPaid ? 'rgba(255,255,255,0.7)' : 'var(--pc-fg-3)',
            margin:     '8px 0 24px',
          }}>
            {isPaid
              ? 'All paid up — nothing outstanding.'
              : 'Added after each wash. Pay anytime — your car keeps getting cleaned.'}
          </p>

          {payDone && (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: '#fff', opacity: 0.9, margin: '0 0 16px' }}>
              Payment received — balance updated.
            </p>
          )}
          {payError && (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', margin: '0 0 16px' }}>
              {payError}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handlePayNow}
              disabled={isPaid || paying}
              style={{
                display:       'inline-flex',
                alignItems:    'center',
                padding:       '10px 24px',
                background:    isPaid ? 'rgba(255,255,255,0.15)' : 'var(--pc-warm)',
                color:         isPaid ? '#fff' : 'var(--pc-ink)',
                borderRadius:   999,
                fontFamily:    'var(--pc-sans)',
                fontSize:       13,
                fontWeight:     600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border:        'none',
                cursor:        isPaid || paying ? 'not-allowed' : 'pointer',
                opacity:       isPaid || paying ? 0.5 : 1,
              }}
            >
              {paying ? 'Opening checkout…' : isPaid ? 'All clear ✓' : 'Pay now →'}
            </button>

            <button
              type="button"
              onClick={() => alert(
                'Each wash at your society adds a fixed amount to your outstanding balance. ' +
                'Pay whenever you like — there is no due date. ' +
                'Your car will continue to be cleaned regardless.'
              )}
              style={{
                padding:       '10px 20px',
                background:    'transparent',
                color:          isPaid ? 'rgba(255,255,255,0.8)' : 'var(--pc-fg-3)',
                border:        `1px solid ${isPaid ? 'rgba(255,255,255,0.3)' : 'var(--pc-line-strong)'}`,
                borderRadius:   999,
                fontFamily:    'var(--pc-sans)',
                fontSize:       13,
                cursor:        'pointer',
                letterSpacing: '0.04em',
              }}
            >
              How it works
            </button>
          </div>
        </div>

        {/* Transaction history */}
        <div>
          <p style={{
            fontFamily:    'var(--pc-mono)',
            fontSize:       10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         'var(--pc-fg-3)',
            margin:        '0 0 14px',
          }}>
            Activity
          </p>

          {txLoading ? (
            <div style={{
              background:   'var(--pc-card)',
              border:       '1px solid var(--pc-line)',
              borderRadius: 'var(--pc-radius-md)',
              padding:      'var(--pc-space-8)',
              display:      'flex',
              flexDirection:'column',
              gap:           12,
            }}>
              {[140, 180, 110].map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 13, width: w, background: 'var(--pc-card-hi)', borderRadius: 4, animation: 'pc-pulse 1.6s ease-in-out infinite' }} />
                    <div style={{ height: 10, width: 80, background: 'var(--pc-card-hi)', borderRadius: 4, animation: 'pc-pulse 1.6s ease-in-out infinite' }} />
                  </div>
                  <div style={{ height: 16, width: 60, background: 'var(--pc-card-hi)', borderRadius: 4, animation: 'pc-pulse 1.6s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div style={{
              background:   'var(--pc-card)',
              border:       '1px solid var(--pc-line)',
              borderRadius: 'var(--pc-radius-md)',
              padding:      'var(--pc-space-12) var(--pc-space-6)',
              textAlign:    'center',
            }}>
              <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-4)', marginBottom: 8 }}>
                [NO TRANSACTIONS YET]
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-3)' }}>
                Wash charges will appear here after your first society clean.
              </p>
            </div>
          ) : (
            <div style={{
              background:   'var(--pc-card)',
              border:       '1px solid var(--pc-line)',
              borderRadius: 'var(--pc-radius-md)',
              overflow:     'hidden',
            }}>
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{
                    display:       'flex',
                    justifyContent:'space-between',
                    alignItems:    'center',
                    padding:       '14px 20px',
                    borderBottom:   i < entries.length - 1 ? '1px solid var(--pc-line)' : 'none',
                    gap:            16,
                  }}
                >
                  {/* Icon + label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                      width:        32,
                      height:       32,
                      borderRadius: '50%',
                      background:   entry.type === 'payment' ? 'var(--pc-success)' : 'var(--pc-sage)',
                      display:     'flex',
                      alignItems:  'center',
                      justifyContent: 'center',
                      flexShrink:   0,
                      fontSize:     14,
                    }}>
                      {entry.type === 'payment' ? '↓' : '✓'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, color: 'var(--pc-fg)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.label}
                      </p>
                      <p style={{ ...monoLabel, marginTop: 3 }}>
                        {entry.date}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <p style={{
                    fontFamily:  'var(--pc-serif)',
                    fontSize:     18,
                    color:        entry.type === 'payment' ? 'var(--pc-success)' : 'var(--pc-fg)',
                    margin:       0,
                    whiteSpace:  'nowrap',
                    flexShrink:   0,
                  }}>
                    {entry.type === 'payment' ? '−' : '+'}₹{entry.amount.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
