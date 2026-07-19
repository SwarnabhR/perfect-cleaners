'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

type NotificationType = 'approval' | 'car_cleaned' | 'weekly_reminder' | 'payment_reminder' | 'cleaning_missed';
type DeliveryStatus = 'sent' | 'failed';

interface LiveNotification {
  id: string;
  type: NotificationType;
  recipientPhone: string;
  recipientName: string;
  message?: string;
  status: DeliveryStatus;
  messageId?: string;
  error?: string;
  sentAt: { toDate?(): Date } | Date | string | number | null | undefined;
}

const TYPE_META: Record<NotificationType, { label: string; icon: string }> = {
  approval:          { label: 'Approval',         icon: 'check-circle'  },
  car_cleaned:       { label: 'Car Cleaned',       icon: 'sparkles'      },
  weekly_reminder:   { label: 'Weekly Reminder',   icon: 'calendar'      },
  payment_reminder:  { label: 'Payment Reminder',  icon: 'indian-rupee'  },
  cleaning_missed:   { label: 'Cleaning Missed',   icon: 'alert-circle'  },
};

type MaybeTs = { toDate?(): Date } | Date | string | number | null | undefined;
function toDate(ts: MaybeTs): Date | null {
  if (!ts) return null;
  return (ts as { toDate?(): Date }).toDate
    ? (ts as { toDate(): Date }).toDate()
    : new Date(ts as string | number | Date);
}
function fmtDateTime(ts: MaybeTs): string {
  const d = toDate(ts);
  if (!d) return '—';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [loading,        setLoading]       = useState(true);
  const [search,         setSearch]        = useState('');
  const [typeFilter,     setTypeFilter]    = useState<NotificationType | 'All'>('All');
  const [statusFilter,   setStatusFilter]  = useState<DeliveryStatus | 'All'>('All');

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'notifications'), orderBy('sentAt', 'desc'), limit(200)),
      snap => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveNotification)));
        setLoading(false);
      },
      err => { console.warn('[Notifications]', err.message); setLoading(false); },
    );
  }, []);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const sentToday = notifications.filter(n => {
    const d = toDate(n.sentAt);
    return d ? d >= todayStart : false;
  }).length;
  const totalSent   = notifications.filter(n => n.status === 'sent').length;
  const totalFailed = notifications.filter(n => n.status === 'failed').length;

  const kpis = [
    { label: 'Sent (last 200)', value: loading ? '—' : String(totalSent),           icon: 'mail',           color: 'var(--pc-sage)'    },
    { label: 'Failed',          value: loading ? '—' : String(totalFailed),         icon: 'alert-circle',  color: 'var(--pc-danger)'  },
    { label: 'Sent Today',      value: loading ? '—' : String(sentToday),           icon: 'sun',            color: 'var(--pc-success)' },
    { label: 'Total Loaded',    value: loading ? '—' : String(notifications.length), icon: 'bell',          color: 'var(--pc-info)'    },
  ];

  const filtered = notifications.filter(n => {
    const matchSearch = !search ||
      n.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
      n.recipientPhone?.includes(search);
    const matchType   = typeFilter   === 'All' || n.type   === typeFilter;
    const matchStatus = statusFilter === 'All' || n.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const TYPE_OPTIONS: (NotificationType | 'All')[] = ['All', 'approval', 'car_cleaned', 'weekly_reminder', 'payment_reminder', 'cleaning_missed'];

  return (
    <div className="admin-page-root">

      {/* Header */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>COMMS</Eyebrow>
        <h1 className="admin-page-title">Notifications</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-3)', margin: '8px 0 0' }}>
          History of every SMS sent to residents — approvals, reminders, and cleaning updates.
        </p>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid-4">
        {kpis.map(({ label, value, icon, color }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color={color} />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{value}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Row 1: search + status */}
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
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['All', 'sent', 'failed'] as const).map(s => (
              <button type="button" key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '7px 14px', borderRadius: 999, border: '1px solid',
                borderColor: statusFilter === s ? 'var(--pc-sage)' : 'var(--pc-line)',
                background:  statusFilter === s ? 'var(--pc-sage)' : 'transparent',
                color:       statusFilter === s ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Row 2: type filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 4, flexShrink: 0 }}>Type</span>
          {TYPE_OPTIONS.map(t => (
            <button type="button" key={t} onClick={() => setTypeFilter(t)} style={{
              padding: '5px 12px', borderRadius: 999, border: '1px solid',
              borderColor: typeFilter === t ? 'var(--pc-sage)' : 'var(--pc-line)',
              background:  typeFilter === t ? 'var(--pc-sage)' : 'transparent',
              color:       typeFilter === t ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
              fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer',
            }}>{t === 'All' ? 'All' : TYPE_META[t].label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>No notifications found.</div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Recipient', 'Type', 'Message', 'Status', 'Sent'].map(h => (
                    <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(n => {
                  const meta = TYPE_META[n.type];
                  return (
                    <tr key={n.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                      <td style={{ padding: '13px 18px' }}>
                        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 1px', fontWeight: 500 }}>{n.recipientName || '—'}</p>
                        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-4)', margin: 0, letterSpacing: '0.04em' }}>{n.recipientPhone}</p>
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                          {meta && <Icon name={meta.icon} size={13} color="var(--pc-fg-3)" />}
                          {meta?.label ?? n.type}
                        </span>
                      </td>
                      <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', maxWidth: 320 }}>
                        {n.message
                          ? <span title={n.message} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</span>
                          : <span style={{ color: 'var(--pc-fg-4)' }}>—</span>}
                        {n.status === 'failed' && n.error && (
                          <p title={n.error} style={{ fontFamily: 'var(--pc-mono)', fontSize: 10.5, color: 'var(--pc-danger)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.error}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <StatusPill status={n.status === 'sent' ? 'Sent' : 'Failed'} />
                      </td>
                      <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', whiteSpace: 'nowrap' }}>
                        {fmtDateTime(n.sentAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
