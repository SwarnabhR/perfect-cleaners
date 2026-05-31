'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { BookingStatus } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

interface LiveBooking {
  id: string; customerId: string; customerName?: string;
  workerId?: string; workerName?: string;
  serviceIds: string[]; status: BookingStatus; paymentStatus: string;
  scheduledAt: any; priceBreakdown: { total: number };
  address: { line1: string; city: string };
}
interface LiveWorker { id: string; name: string; isOnline: boolean; rating: number; }

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending', assigned: 'Assigned', enroute: 'En Route',
  inprogress: 'In Progress', done: 'Done', cancelled: 'Cancelled',
};
const FILTERS = ['All', 'Pending', 'Assigned', 'En Route', 'In Progress', 'Done'];

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function serviceLabel(ids: string[]): string {
  return ids.map(id => id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ') || '—';
}

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const [bookings,   setBookings]   = useState<LiveBooking[]>([]);
  const [workers,    setWorkers]    = useState<LiveWorker[]>([]);
  const [filter,     setFilter]     = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [assigning,  setAssigning]  = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') ?? '');
  }, [searchParams]);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q,
      snap => { setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveBooking))); setLoading(false); },
      err  => { console.warn('[Bookings]', err.message); setLoading(false); },
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'workers'),
      snap => setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveWorker))),
    );
  }, []);

  async function assignWorker(bookingId: string, worker: LiveWorker) {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { workerId: worker.id, workerName: worker.name, status: 'assigned' as BookingStatus, updatedAt: serverTimestamp() });
      setAssigning(null);
    } catch (err: any) { console.error('[Bookings] assign failed:', err.message); }
  }

  const filtered = bookings
    .filter(b => filter === 'All' || STATUS_LABELS[b.status] === filter)
    .filter(b => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (b.customerName ?? '').toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.workerName ?? '').toLowerCase().includes(q)
      );
    });
  const counts = {
    pending: bookings.filter(b => b.status === 'pending').length,
    active:  bookings.filter(b => ['assigned','enroute','inprogress'].includes(b.status)).length,
    done:    bookings.filter(b => b.status === 'done').length,
    total:   bookings.length,
  };

  return (
    <div className="admin-page-root">

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>SCHEDULE</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Bookings</h1>
        </div>
        {searchTerm && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 999 }}>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>"{searchTerm}"</span>
            <button type="button" onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-4)', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}
      </div>

      <div className="kpi-grid-4">
        {[
          { label: 'Total',   value: counts.total,   icon: 'calendar'    },
          { label: 'Pending', value: counts.pending,  icon: 'clock'       },
          { label: 'Active',  value: counts.active,   icon: 'activity'    },
          { label: 'Done',    value: counts.done,     icon: 'check-circle' },
        ].map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color="var(--pc-sage)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{loading ? '—' : value}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button type="button" key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 999, border: '1px solid',
            borderColor: filter === f ? 'var(--pc-sage)' : 'var(--pc-line)',
            background:  filter === f ? 'var(--pc-sage)' : 'transparent',
            color:       filter === f ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
            fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
            minHeight: 36,
          }}>{f}</button>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>No bookings found.</div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Booking ID', 'Customer', 'Service', 'Date & Time', 'Worker', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', whiteSpace: 'nowrap' }}>#{b.id.slice(0, 8).toUpperCase()}</td>
                    <td style={{ padding: '13px 18px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, fontWeight: 600, color: 'var(--pc-fg-2)' }}>{(b.customerName ?? b.customerId)?.[0]?.toUpperCase() ?? '?'}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>{b.customerName ?? b.customerId.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', whiteSpace: 'nowrap' }}>{serviceLabel(b.serviceIds)}</td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', whiteSpace: 'nowrap' }}>{formatDate(b.scheduledAt)}</td>
                    <td style={{ padding: '13px 18px', whiteSpace: 'nowrap', position: 'relative' }}>
                      {b.workerName ? (
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{b.workerName}</span>
                      ) : (
                        <button type="button" onClick={() => setAssigning(assigning === b.id ? null : b.id)} style={{ padding: '5px 12px', borderRadius: 999, border: '1px solid var(--pc-warning)', background: 'transparent', color: 'var(--pc-warning)', fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Assign worker</button>
                      )}
                      {assigning === b.id && (
                        <div style={{ position: 'absolute', zIndex: 50, marginTop: 8, background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 10, padding: 8, minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', padding: '4px 8px', margin: 0 }}>SELECT WORKER</p>
                          {workers.length === 0 ? (
                            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', padding: '4px 8px', margin: 0 }}>No workers found</p>
                          ) : workers.map(w => (
                            <button key={w.id} type="button" onClick={() => assignWorker(b.id, w)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                              <div style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 10, fontWeight: 600, color: '#fff' }}>{w.name[0]}</span>
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', margin: 0, fontWeight: 500 }}>{w.name}</p>
                                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{w.isOnline ? '● Online' : 'Offline'} · ★ {w.rating?.toFixed(1) ?? '—'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{b.priceBreakdown?.total?.toLocaleString('en-IN') ?? '—'}</td>
                    <td style={{ padding: '13px 18px' }}><StatusPill status={STATUS_LABELS[b.status] ?? b.status} /></td>
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
