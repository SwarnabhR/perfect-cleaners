'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Booking, BookingStatus } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

type LiveBooking = Booking & { id: string };

type MaybeTs = { toDate?(): Date } | Date | string | number | null | undefined;
function toDate(ts: MaybeTs): Date | null {
  if (!ts) return null;
  return (ts as { toDate?(): Date }).toDate
    ? (ts as { toDate(): Date }).toDate()
    : new Date(ts as string | number | Date);
}
function fmtDate(ts: MaybeTs): string {
  const d = toDate(ts);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', assigned: 'Assigned', enroute: 'En Route',
  arrived: 'Arrived', inprogress: 'In Progress', done: 'Done', cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:    { bg: 'color-mix(in srgb, var(--pc-warning) 12%, transparent)',  color: 'var(--pc-warning)' },
  assigned:   { bg: 'color-mix(in srgb, var(--pc-info) 12%, transparent)',     color: 'var(--pc-info)'    },
  enroute:    { bg: 'color-mix(in srgb, var(--pc-warning) 12%, transparent)',  color: 'var(--pc-warning)' },
  arrived:    { bg: 'color-mix(in srgb, var(--pc-info) 12%, transparent)',     color: 'var(--pc-info)'    },
  inprogress: { bg: 'color-mix(in srgb, var(--pc-sage) 12%, transparent)',     color: 'var(--pc-sage)'    },
  done:       { bg: 'color-mix(in srgb, var(--pc-sage) 20%, transparent)',     color: 'var(--pc-success)' },
  cancelled:  { bg: 'color-mix(in srgb, var(--pc-danger) 12%, transparent)',   color: 'var(--pc-danger)'  },
};

function StatusChip({ status }: { status: string }) {
  const s = STATUS_COLOR[status] ?? { bg: 'var(--pc-card-hi)', color: 'var(--pc-fg-3)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      borderRadius: 6, background: s.bg,
      fontFamily: 'var(--pc-mono)', fontSize: 10, fontWeight: 600,
      color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const ALL_STATUSES: BookingStatus[] = ['pending', 'assigned', 'enroute', 'arrived', 'inprogress', 'done', 'cancelled'];

export default function BookingsPage() {
  const [bookings,    setBookings]    = useState<LiveBooking[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  const [search,       setSearch]       = useState('');
  const [cancelling,   setCancelling]   = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'bookings'), orderBy('scheduledAt', 'desc'), limit(300)),
      snap => { setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveBooking))); setLoading(false); },
      err  => { console.warn('[Bookings]', err.message); setLoading(false); },
    );
  }, []);

  async function handleCancel(id: string) {
    if (cancelling) return;
    setCancelling(id);
    try {
      await updateDoc(doc(db, 'bookings', id), {
        status:    'cancelled' as BookingStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err: unknown) {
      console.error('[Bookings] cancel failed:', err instanceof Error ? err.message : err);
    } finally { setCancelling(null); }
  }

  const todayMs = new Date().setHours(0, 0, 0, 0);
  const kpis = [
    { label: 'All Bookings',   value: bookings.length,                                                         icon: 'calendar',       color: 'var(--pc-info)'    },
    { label: 'Active',         value: bookings.filter(b => ['assigned','enroute','arrived','inprogress'].includes(b.status)).length, icon: 'activity', color: 'var(--pc-warning)' },
    { label: 'Completed Today',value: bookings.filter(b => b.status === 'done' && (toDate(b.scheduledAt)?.getTime() ?? 0) >= todayMs).length, icon: 'check-circle', color: 'var(--pc-sage)' },
    { label: 'Revenue Today',  value: '₹' + bookings.filter(b => b.status === 'done' && (toDate(b.scheduledAt)?.getTime() ?? 0) >= todayMs).reduce((s, b) => s + (b.priceBreakdown?.total ?? 0), 0).toLocaleString('en-IN'), icon: 'indian-rupee', color: 'var(--pc-gold)' },
  ];

  const filtered = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.bookingRef ?? '').toLowerCase().includes(q) ||
      (b.customerName ?? '').toLowerCase().includes(q) ||
      (b.vehicle?.make ?? '').toLowerCase().includes(q) ||
      (b.vehicle?.registration ?? '').toLowerCase().includes(q)
    );
  });

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11,
    color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  };
  const tdStyle: React.CSSProperties = {
    padding: '13px 16px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)',
  };

  return (
    <div className="admin-page-root">
      {/* Header */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>OPERATIONS</Eyebrow>
        <h1 className="admin-page-title">Bookings</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '4px 0 0' }}>
          Live booking pipeline — last 300 bookings, newest first
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid-4">
        {kpis.map(({ label, value, icon, color }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color={color} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
                {loading ? '—' : value}
              </p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + Status Filter */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Icon name="search" size={14} color="var(--pc-fg-4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ref, customer, service…"
            className="admin-search-input"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              boxSizing: 'border-box', background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
              borderRadius: 999, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', outline: 'none',
            }}
          />
        </div>

        <div className="filter-chips">
          {(['all', ...ALL_STATUSES] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s as BookingStatus | 'all')}
              style={{
                padding: '6px 13px', borderRadius: 999, border: '1px solid',
                borderColor: filterStatus === s ? 'var(--pc-sage)' : 'var(--pc-line)',
                background:  filterStatus === s ? 'var(--pc-sage)' : 'transparent',
                color:       filterStatus === s ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                fontFamily:  'var(--pc-sans)', fontSize: 12, cursor: 'pointer',
              }}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 8px' }}>No bookings found</p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
              {search || filterStatus !== 'all' ? 'Try adjusting your filters.' : 'Bookings will appear here when customers start booking.'}
            </p>
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Ref', 'Customer', 'Vehicle', 'Worker', 'Status', 'Scheduled', 'Amount', 'Action'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, idx) => (
                  <tr
                    key={b.id}
                    className="pc-table-row"
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--pc-line)' : 'none' }}
                  >
                    <td style={{ ...tdStyle, fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>
                      {b.bookingRef ?? b.id.slice(0, 8)}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--pc-fg)' }}>
                      {b.customerName ?? '—'}
                    </td>
                    <td style={tdStyle}>
                      {b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : '—'}
                    </td>
                    <td style={tdStyle}>{b.workerName ?? <span style={{ color: 'var(--pc-fg-4)' }}>Unassigned</span>}</td>
                    <td style={{ ...tdStyle, padding: '10px 16px' }}>
                      <StatusChip status={b.status} />
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtDate(b.scheduledAt)}</td>
                    <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--pc-fg)' }}>
                      {b.priceBreakdown?.total != null ? `₹${b.priceBreakdown.total.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      {(b.status === 'pending' || b.status === 'assigned') && (
                        <button
                          type="button"
                          onClick={() => handleCancel(b.id)}
                          disabled={cancelling === b.id}
                          style={{
                            padding: '4px 10px', borderRadius: 6,
                            background: 'transparent', border: '1px solid var(--pc-danger)',
                            fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-danger)',
                            cursor: cancelling === b.id ? 'not-allowed' : 'pointer',
                            opacity: cancelling === b.id ? 0.5 : 1,
                          }}
                        >
                          {cancelling === b.id ? '…' : 'Cancel'}
                        </button>
                      )}
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
