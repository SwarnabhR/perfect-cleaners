'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Customer, Booking } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

type LiveCustomer = Customer & { id: string };
type LiveBooking  = Booking  & { id: string };

const TIER_COLORS: Record<string, string> = {
  Platinum: 'var(--pc-fg)',
  Gold:     'var(--pc-gold)',
  Silver:   'var(--pc-fg-3)',
  Bronze:   'var(--pc-warning)',
};

function tier(spent: number): string {
  if (spent >= 60_000) return 'Platinum';
  if (spent >= 30_000) return 'Gold';
  if (spent >= 10_000) return 'Silver';
  return 'Bronze';
}

function formatJoined(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<LiveCustomer[]>([]);
  const [bookings,  setBookings]  = useState<LiveBooking[]>([]);
  const [search,    setSearch]    = useState('');
  const [tierFilter,setTierFilter]= useState('All');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'customers'), orderBy('createdAt', 'desc'), limit(200)),
      snap => { setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveCustomer))); setLoading(false); },
      err  => { console.warn('[Customers]', err.message); setLoading(false); },
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'bookings'), limit(500)),
      snap => setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveBooking))),
    );
  }, []);

  // Per-customer stats derived from bookings
  const statsMap = bookings.reduce<Record<string, { jobs: number; spent: number }>>((acc, b) => {
    const cid = b.customerId;
    if (!cid) return acc;
    if (!acc[cid]) acc[cid] = { jobs: 0, spent: 0 };
    acc[cid].jobs += 1;
    if (b.paymentStatus === 'paid') acc[cid].spent += b.priceBreakdown?.total ?? 0;
    return acc;
  }, {});

  const enriched = customers
    .filter(c => c.role !== 'worker')
    .map(c => {
      const stats = statsMap[c.id] ?? { jobs: 0, spent: 0 };
      return { ...c, ...stats, customerTier: tier(stats.spent) };
    });

  const filtered = enriched.filter(c => {
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    const matchTier = tierFilter === 'All' || c.customerTier === tierFilter;
    return matchSearch && matchTier;
  });

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeIds = new Set(
    bookings
      .filter(b => {
        const ts = b.createdAt as any;
        const t = ts?.toDate ? ts.toDate().getTime() : new Date(ts).getTime();
        return t > thirtyDaysAgo;
      })
      .map(b => b.customerId),
  );

  const totalOutstanding = customers.reduce((s, c) => s + (((c as any).outstandingBalance as number) ?? 0), 0);

  const kpis = [
    { label: 'Total Customers', value: loading ? '—' : enriched.length.toLocaleString(), icon: 'users' },
    { label: 'Active (30d)',    value: loading ? '—' : activeIds.size.toLocaleString(), icon: 'user-check' },
    { label: 'Outstanding',     value: loading ? '—' : totalOutstanding > 0 ? `₹${totalOutstanding.toLocaleString('en-IN')}` : '₹0', icon: 'indian-rupee' },
    { label: 'Avg Lifetime',    value: loading ? '—' : enriched.length
        ? `₹${Math.round(enriched.reduce((s, c) => s + c.spent, 0) / enriched.length).toLocaleString('en-IN')}`
        : '₹0', icon: 'trending-up' },
  ];

  return (
    <div className="admin-page-root">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>CRM</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Customers</h1>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid-4">
        {kpis.map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color="var(--pc-sage)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{value}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + tier filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={14} color="var(--pc-fg-4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, boxSizing: 'border-box',
              background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 999,
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', outline: 'none',
            }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['All', 'Platinum', 'Gold', 'Silver', 'Bronze'].map(t => (
            <button type="button" key={t} onClick={() => setTierFilter(t)} style={{
              padding: '7px 14px', borderRadius: 999, border: '1px solid',
              borderColor: tierFilter === t ? 'var(--pc-sage)' : 'var(--pc-line)',
              background:  tierFilter === t ? 'var(--pc-sage)' : 'transparent',
              color:       tierFilter === t ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>No customers found.</div>
        ) : (
          <div className="table-scroll-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                {['Customer', 'Phone', 'Vehicles', 'Jobs', 'Total Spent', 'Outstanding', 'Tier', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  <td style={{ padding: '13px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 600, color: '#fff' }}>
                          {c.name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 1px', fontWeight: 500 }}>{c.name || '—'}</p>
                        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-4)', margin: 0 }}>{c.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                    {c.phone || '—'}
                  </td>
                  <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                    {c.vehicles?.length
                      ? c.vehicles.map(v => `${v.make} ${v.model}`).join(', ')
                      : <span style={{ color: 'var(--pc-fg-4)' }}>None</span>}
                  </td>
                  <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{c.jobs}</td>
                  <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600 }}>
                    {c.spent > 0 ? `₹${c.spent.toLocaleString('en-IN')}` : '₹0'}
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    {(c as any).outstandingBalance > 0 ? (
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                        color: 'var(--pc-danger)', background: 'color-mix(in srgb, var(--pc-danger) 10%, transparent)',
                        padding: '2px 8px', borderRadius: 4 }}>
                        ₹{((c as any).outstandingBalance as number).toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: TIER_COLORS[c.customerTier], flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: TIER_COLORS[c.customerTier] }}>{c.customerTier}</span>
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                    {formatJoined((c as any).createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>
    </div>
  );
}
