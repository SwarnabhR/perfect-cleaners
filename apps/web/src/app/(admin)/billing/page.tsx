'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, limit, onSnapshot,
  doc, getDoc, updateDoc, addDoc, serverTimestamp,
  Timestamp, where,
} from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentLog {
  id:           string;
  bookingRef?:  string;
  customerId:   string;
  customerName: string;
  customerPhone?:string;
  amount:       number;
  type:         'online_booking' | 'manual_dues';
  paidAt:       Timestamp | Date | string | null;
}

interface CustomerRow {
  id:                 string;
  name:               string;
  phone:              string;
  outstandingBalance: number;
  societyName?:       string;
  unitNumber?:        string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

type MaybeTs = { toDate?(): Date } | Date | string | number | null | undefined;
function tsToDate(ts: MaybeTs): Date {
  return (ts as { toDate?(): Date }).toDate
    ? (ts as { toDate(): Date }).toDate()
    : new Date(ts as string | number | Date);
}
function fmtDate(ts: MaybeTs) {
  if (!ts) return '—';
  return tsToDate(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(ts: MaybeTs) {
  if (!ts) return '';
  return tsToDate(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)',
  letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [logs,          setLogs]          = useState<PaymentLog[]>([]);
  const [customers,     setCustomers]     = useState<CustomerRow[]>([]);
  const [totalIncome,   setTotalIncome]   = useState(0);
  const [todayIncome,   setTodayIncome]   = useState(0);
  const [marking,       setMarking]       = useState<string | null>(null);
  const [filter,        setFilter]        = useState<'all' | 'pending'>('all');

  // Live payment logs — most recent 200
  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'paymentLogs'), orderBy('paidAt', 'desc'), limit(200)),
      snap => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentLog));
        setLogs(rows);

        // Today's income computed from logs
        const start = todayStart().toMillis();
        const todayTotal = rows.reduce((sum, l) => {
          const ms = (l.paidAt as Timestamp | null)?.toMillis?.() ?? 0;
          return ms >= start ? sum + (l.amount ?? 0) : sum;
        }, 0);
        setTodayIncome(todayTotal);
      },
    );
  }, []);

  // Live total income from stats doc
  useEffect(() => {
    return onSnapshot(doc(db, 'stats', 'income'), snap => {
      setTotalIncome(snap.exists() ? (snap.data()?.totalIncome ?? 0) : 0);
    });
  }, []);

  // Live customers with outstanding balance — only fetch customers who actually owe money
  useEffect(() => {
    return onSnapshot(
      query(
        collection(db, 'customers'),
        where('outstandingBalance', '>', 0),
        orderBy('outstandingBalance', 'desc'),
        limit(300),
      ),
      snap => {
        setCustomers(snap.docs.map(d => {
          const data = d.data();
          return {
            id:                 d.id,
            name:               data.name ?? '—',
            phone:              data.phone ?? '',
            outstandingBalance: data.outstandingBalance ?? 0,
            societyName:        data.societyName,
            unitNumber:         data.unitNumber,
          };
        }));
      },
    );
  }, []);

  async function markPaid(customer: CustomerRow) {
    if (marking) return;
    setMarking(customer.id);
    try {
      const amount = customer.outstandingBalance;

      // Write payment log
      await addDoc(collection(db, 'paymentLogs'), {
        customerId:   customer.id,
        customerName: customer.name,
        customerPhone:customer.phone,
        amount,
        type:    'manual_dues',
        paidAt:  serverTimestamp(),
      });

      // Increment stats
      const statsRef = doc(db, 'stats', 'income');
      const snap = await getDoc(statsRef);
      if (snap.exists()) {
        await updateDoc(statsRef, { totalIncome: (snap.data().totalIncome ?? 0) + amount });
      } else {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(statsRef, { totalIncome: amount });
      }

      // Clear the customer's outstanding balance
      await updateDoc(doc(db, 'customers', customer.id), { outstandingBalance: 0 });
    } finally {
      setMarking(null);
    }
  }

  const pendingTotal = customers.reduce((s, c) => s + (c.outstandingBalance ?? 0), 0);

  const displayed = filter === 'pending'
    ? customers.filter(c => (c.outstandingBalance ?? 0) > 0)
    : customers;

  const FILTER_OPTS: { key: typeof filter; label: string }[] = [
    { key: 'all',     label: 'All pending' },
    { key: 'pending', label: 'Pending dues' },
  ];

  return (
    <div className="admin-page-root">

      {/* Header */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>FINANCE</Eyebrow>
        <h1 className="admin-page-title">Billing</h1>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid-3">
        {[
          { label: "Today's Collected", value: fmt(todayIncome),  icon: 'sun',          color: 'var(--pc-success)' },
          { label: 'Total Collected',   value: fmt(totalIncome),  icon: 'indian-rupee', color: 'var(--pc-sage)'    },
          { label: 'Total Pending Dues',value: fmt(pendingTotal), icon: 'alert-circle', color: 'var(--pc-warning)' },
        ].map(({ label, value, icon, color }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color={color} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px', lineHeight: 1 }}>{value}</p>
              <p style={{ ...monoLabel }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Customer dues table */}
      <div>
        <div className="admin-page-header" style={{ marginBottom: 12 }}>
          <Eyebrow>CUSTOMER DUES</Eyebrow>
          <div className="filter-chips">
            {FILTER_OPTS.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '6px 14px', borderRadius: 999, border: '1px solid',
                  borderColor: filter === f.key ? 'var(--pc-sage)' : 'var(--pc-line)',
                  background:  filter === f.key ? 'var(--pc-sage)' : 'transparent',
                  color:       filter === f.key ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Customer', 'Society / Unit', 'Outstanding', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '48px 16px', textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                      No outstanding dues.
                    </td>
                  </tr>
                ) : displayed.map(c => {
                  const isMarking = marking === c.id;
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>

                      {/* Name + phone */}
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 2px', fontWeight: 500 }}>{c.name}</p>
                        {c.phone && <p style={{ ...monoLabel, letterSpacing: '0.04em' }}>{c.phone}</p>}
                      </td>

                      {/* Society / unit */}
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', margin: 0 }}>
                          {c.societyName ?? '—'}
                        </p>
                        {c.unitNumber && <p style={{ ...monoLabel }}>{c.unitNumber}</p>}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600,
                          color: 'var(--pc-warning)',
                        }}>
                          {fmt(c.outstandingBalance)}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '8px 16px' }}>
                        <button
                            type="button"
                            disabled={isMarking}
                            onClick={() => markPaid(c)}
                            style={{
                              padding: '6px 14px', borderRadius: 999,
                              background: isMarking ? 'var(--pc-card-hi)' : 'var(--pc-sage)',
                              border: 'none',
                              color: isMarking ? 'var(--pc-fg-3)' : 'var(--pc-sage-ink)',
                              fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 600,
                              cursor: isMarking ? 'not-allowed' : 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isMarking ? 'Saving…' : 'Mark Paid'}
                          </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Recent payment log */}
      {logs.length > 0 && (
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 12 }}>PAYMENT HISTORY</Eyebrow>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-scroll-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                    {['Date', 'Customer', 'Type', 'Amount'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 50).map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                      <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', margin: 0 }}>{fmtDate(log.paidAt)}</p>
                        <p style={{ ...monoLabel }}>{fmtTime(log.paidAt)}</p>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', margin: '0 0 2px', fontWeight: 500 }}>{log.customerName || '—'}</p>
                        {log.customerPhone && <p style={{ ...monoLabel, letterSpacing: '0.04em' }}>{log.customerPhone}</p>}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 999,
                          background: log.type === 'online_booking'
                            ? 'color-mix(in srgb, var(--pc-info) 12%, transparent)'
                            : 'color-mix(in srgb, var(--pc-sage) 12%, transparent)',
                          fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.05em',
                          color: log.type === 'online_booking' ? 'var(--pc-info)' : 'var(--pc-sage-hi)',
                        }}>
                          <Icon name={log.type === 'online_booking' ? 'credit-card' : 'check'} size={10} color="currentColor" />
                          {log.type === 'online_booking' ? 'Online' : 'Manual'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-success)', whiteSpace: 'nowrap' }}>
                        +{fmt(log.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
