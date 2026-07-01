'use client';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { CustomerSocietyRecord } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

type LiveRecord = CustomerSocietyRecord & { id: string };

const ENROLLMENT_STATUS_LABEL: Record<string, string> = {
  pending:  'Pending',
  active:   'Active',
  paused:   'Paused',
  inactive: 'Cancelled',
};

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)',
  fontSize: 9.5,
  color: 'var(--pc-fg-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 4px',
};

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; text: string }> = {
    not_verified: { bg: 'color-mix(in srgb, var(--pc-warning) 12%, transparent)', color: 'var(--pc-warning)', text: 'Not Verified' },
    verified: { bg: 'color-mix(in srgb, var(--pc-info) 12%, transparent)', color: 'var(--pc-info)', text: 'Verified' },
    pending_payment: { bg: 'color-mix(in srgb, var(--pc-warning) 12%, transparent)', color: 'var(--pc-warning)', text: 'Pending' },
    paid: { bg: 'color-mix(in srgb, var(--pc-sage) 12%, transparent)', color: 'var(--pc-sage)', text: 'Paid' },
  };

  const style = styles[status] || styles.verified;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 6,
        background: style.bg,
        fontFamily: 'var(--pc-mono)',
        fontSize: 10,
        fontWeight: 600,
        color: style.color,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      <Icon
        name={
          status === 'paid' ? 'check-circle' : status === 'verified' ? 'clock' : status === 'pending_payment' ? 'alert-circle' : 'x-circle'
        }
        size={12}
        color={style.color}
      />
      {style.text}
    </span>
  );
}

export default function CustomerEnrollmentsPage() {
  const [records, setRecords] = useState<LiveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'customerSocietyRecords')),
      snap => {
        setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveRecord)));
        setLoading(false);
      },
      err => {
        console.warn('[CustomerEnrollments]', err.message);
        setLoading(false);
      }
    );
  }, []);

  async function handleMarkAsPaid(id: string) {
    try {
      await setDoc(
        doc(db, 'customerSocietyRecords', id),
        {
          paymentStatus: 'paid',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setMarkingPaidId(null);
    } catch (err: unknown) {
      console.error('[CustomerEnrollments] mark paid failed:', err instanceof Error ? err.message : err);
    }
  }

  async function handleToggleStatus(record: LiveRecord) {
    const nextStatus = record.status === 'active' ? 'paused' : 'active';
    try {
      await setDoc(
        doc(db, 'customerSocietyRecords', record.id),
        {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err: unknown) {
      console.error('[CustomerEnrollments] toggle status failed:', err instanceof Error ? err.message : err);
    }
  }

  const filtered = records.filter(r => {
    if (filterStatus !== 'all' && r.paymentStatus !== filterStatus) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.societyName.toLowerCase().includes(q) ||
      r.tower.toLowerCase().includes(q) ||
      r.customerId.toLowerCase().includes(q) ||
      (r.customerName ?? '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: records.length,
    verified: records.filter(r => r.paymentStatus === 'verified').length,
    pending: records.filter(r => r.paymentStatus === 'pending_payment').length,
    paid: records.filter(r => r.paymentStatus === 'paid').length,
  };

  return (
    <div className="admin-page-root">
      {/* Header */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>CUSTOMERS</Eyebrow>
        <h1 className="admin-page-title">Active Enrollments</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-3)', margin: '8px 0 0' }}>
          View all enrolled customers, track payment status, and manage monthly billing
        </p>
      </div>

      {/* Stats */}
      <div className="kpi-grid-4">
        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--pc-card-hi)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="users" size={18} color="var(--pc-info)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.total}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              TOTAL ENROLLED
            </p>
          </div>
        </Card>

        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--pc-card-hi)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="check-circle" size={18} color="var(--pc-sage)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.paid}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              PAID
            </p>
          </div>
        </Card>

        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--pc-card-hi)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="clock" size={18} color="var(--pc-info)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.verified}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              VERIFIED
            </p>
          </div>
        </Card>

        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--pc-card-hi)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="alert-circle" size={18} color="var(--pc-warning)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.pending}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              PENDING PAYMENT
            </p>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="enrollment-search-row" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
          <Icon
            name="search"
            size={14}
            color="var(--pc-fg-4)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by society, tower, or customer ID…"
            style={{
              width: '100%',
              paddingLeft: 36,
              paddingRight: 12,
              paddingTop: 9,
              paddingBottom: 9,
              boxSizing: 'border-box',
              background: 'var(--pc-card)',
              border: '1px solid var(--pc-line)',
              borderRadius: 999,
              fontFamily: 'var(--pc-sans)',
              fontSize: 13,
              color: 'var(--pc-fg)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'verified', 'pending_payment', 'paid'].map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                border: '1px solid',
                borderColor: filterStatus === status ? 'var(--pc-sage)' : 'var(--pc-line)',
                background: filterStatus === status ? 'var(--pc-sage)' : 'transparent',
                color: filterStatus === status ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                fontFamily: 'var(--pc-sans)',
                fontSize: 13,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 8px' }}>
              No enrollments found
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
              Customers will appear here once they're approved.
            </p>
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Customer', 'Society', 'Tower', 'Car', 'Status', 'Payment', 'Next Billing', 'Action'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '13px 18px',
                        textAlign: 'left',
                        fontFamily: 'var(--pc-sans)',
                        fontSize: 11,
                        color: 'var(--pc-fg-3)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, idx) => (
                  <tr key={record.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--pc-line)' : 'none' }}>
                    <td style={{ padding: '13px 18px' }}>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, color: 'var(--pc-fg)', margin: 0 }}>
                        {record.customerName ?? '—'}
                      </p>
                      <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', margin: '2px 0 0' }}>
                        {record.customerId.slice(0, 8)}
                      </p>
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {record.societyName}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {record.tower}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-2)' }}>
                      {record.cars[0]?.plate || '—'}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <StatusPill status={ENROLLMENT_STATUS_LABEL[record.status] ?? record.status} />
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <PaymentStatusBadge status={record.paymentStatus} />
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {(typeof (record.nextBillingDate as unknown as { toDate?: unknown }).toDate === 'function'
        ? (record.nextBillingDate as unknown as { toDate: () => Date }).toDate()
        : new Date(record.nextBillingDate as string | number | Date)
      ).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {record.status === 'pending' && (
                          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-4)' }}>
                            See Pending Approvals
                          </span>
                        )}
                        {record.paymentStatus === 'pending_payment' && (
                          <button
                            type="button"
                            onClick={() => setMarkingPaidId(record.id)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: 'var(--pc-sage)',
                              border: 'none',
                              fontFamily: 'var(--pc-sans)',
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--pc-sage-ink)',
                              cursor: 'pointer',
                            }}
                          >
                            Mark Paid
                          </button>
                        )}
                        {record.paymentStatus === 'paid' && (
                          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-sage)', fontWeight: 600 }}>
                            ✓ Paid
                          </span>
                        )}
                        {(record.status === 'active' || record.status === 'paused') && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(record)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: 'transparent',
                              border: `1px solid ${record.status === 'active' ? 'var(--pc-warning)' : 'var(--pc-sage-hi)'}`,
                              fontFamily: 'var(--pc-sans)',
                              fontSize: 11,
                              fontWeight: 600,
                              color: record.status === 'active' ? 'var(--pc-warning)' : 'var(--pc-sage-hi)',
                              cursor: 'pointer',
                            }}
                          >
                            {record.status === 'active' ? 'Pause' : 'Resume'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmation Modal */}
      {markingPaidId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setMarkingPaidId(null)}
        >
          <div
            style={{
              background: 'var(--pc-card)',
              borderRadius: 16,
              border: '1px solid var(--pc-line)',
              padding: 'clamp(16px,5vw,28px)',
              width: '100%',
              maxWidth: 360,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, fontWeight: 400, color: 'var(--pc-fg)', margin: '0 0 12px' }}>
              Mark Payment Received
            </h2>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Record payment for this customer's monthly enrollment?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => markingPaidId && handleMarkAsPaid(markingPaidId)}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 999,
                  background: 'var(--pc-sage)',
                  border: 'none',
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--pc-sage-ink)',
                  cursor: 'pointer',
                }}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setMarkingPaidId(null)}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 999,
                  background: 'transparent',
                  border: '1px solid currentColor',
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 13,
                  color: 'var(--pc-fg-3)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
