'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

interface Notification {
  id: string;
  type: 'approval' | 'car_cleaned' | 'weekly_reminder' | 'payment_reminder';
  recipientPhone: string;
  recipientName: string;
  data: Record<string, any>;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  sentAt: Date;
}

function NotificationTypeIcon({ type }: { type: string }) {
  const iconMap: Record<string, { name: string; color: string }> = {
    approval: { name: 'check-circle', color: 'var(--pc-sage)' },
    car_cleaned: { name: 'sparkles', color: 'var(--pc-info)' },
    weekly_reminder: { name: 'bell', color: 'var(--pc-warning)' },
    payment_reminder: { name: 'credit-card', color: 'var(--pc-danger)' },
  };
  const config = iconMap[type] || { name: 'message-square', color: 'var(--pc-fg-3)' };
  return <Icon name={config.name as any} size={16} color={config.color} />;
}

function NotificationMessage({ type, data }: { type: string; data: Record<string, any> }) {
  switch (type) {
    case 'approval':
      return `Approved: ${data.societyName} · ${data.tower} · Starting ${data.startDate}`;
    case 'car_cleaned':
      return `Car cleaned: ${data.carPlate} at ${data.societyName}`;
    case 'weekly_reminder':
      return `Reminder: ${data.schedule} at ${data.societyName}`;
    case 'payment_reminder':
      return `Payment due: ₹${data.amount} for ${data.societyName}`;
    default:
      return 'Notification sent';
  }
}

function StatusBadge({ status }: { status: string }) {
  const isSuccess = status === 'sent';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 6,
        background: isSuccess ? 'color-mix(in srgb, var(--pc-sage) 12%, transparent)' : 'color-mix(in srgb, var(--pc-danger) 12%, transparent)',
        fontFamily: 'var(--pc-mono)',
        fontSize: 10,
        fontWeight: 600,
        color: isSuccess ? 'var(--pc-sage)' : 'var(--pc-danger)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      <Icon name={isSuccess ? 'check-circle' : 'alert-circle'} size={12} color={isSuccess ? 'var(--pc-sage)' : 'var(--pc-danger)'} />
      {isSuccess ? 'Sent' : 'Failed'}
    </span>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'notifications'), orderBy('sentAt', 'desc')),
      snap => {
        setNotifications(
          snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              type: data.type,
              recipientPhone: data.recipientPhone,
              recipientName: data.recipientName,
              data: data.data,
              status: data.status,
              messageId: data.messageId,
              error: data.error,
              sentAt: data.sentAt?.toDate ? data.sentAt.toDate() : new Date(data.sentAt),
            } as Notification;
          })
        );
        setLoading(false);
      },
      err => {
        console.warn('[Notifications]', err.message);
        setLoading(false);
      }
    );
  }, []);

  const filtered = notifications.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return n.recipientPhone.includes(q) || n.recipientName.toLowerCase().includes(q);
  });

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
    today: notifications.filter(n => {
      const today = new Date();
      const notifDate = new Date(n.sentAt);
      return notifDate.toDateString() === today.toDateString();
    }).length,
  };

  return (
    <div className="admin-page-root">
      {/* Header */}
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>COMMUNICATION</Eyebrow>
        <h1 className="admin-page-title">Notification History</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-3)', margin: '8px 0 0' }}>
          Track all SMS and in-app notifications sent to customers
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
            <Icon name="mail" size={18} color="var(--pc-info)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.total}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              TOTAL SENT
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
              {loading ? '—' : stats.sent}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              SUCCESSFUL
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
            <Icon name="alert-circle" size={18} color="var(--pc-danger)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.failed}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              FAILED
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
            <Icon name="calendar" size={18} color="var(--pc-warning)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.today}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              TODAY
            </p>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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
            placeholder="Search by phone or name…"
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

        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'approval', 'car_cleaned', 'weekly_reminder', 'payment_reminder'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                border: '1px solid',
                borderColor: filterType === type ? 'var(--pc-sage)' : 'var(--pc-line)',
                background: filterType === type ? 'var(--pc-sage)' : 'transparent',
                color: filterType === type ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                fontFamily: 'var(--pc-sans)',
                fontSize: 12,
                cursor: 'pointer',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {type === 'all' ? 'All' : type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 8px' }}>
              No notifications found
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
              Notifications will appear here as they're sent.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filtered.map((notif, idx) => (
              <div
                key={notif.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--pc-line)' : 'none',
                }}
              >
                {/* Icon */}
                <div style={{ flexShrink: 0 }}>
                  <NotificationTypeIcon type={notif.type} />
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
                    <NotificationMessage type={notif.type} data={notif.data} />
                  </p>
                  <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', margin: 0, letterSpacing: '0.04em' }}>
                    {notif.recipientName} · {notif.recipientPhone}
                  </p>
                </div>

                {/* Status */}
                <div style={{ flexShrink: 0 }}>
                  <StatusBadge status={notif.status} />
                </div>

                {/* Time */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)', margin: '0 0 2px' }}>
                    {new Date(notif.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', margin: 0 }}>
                    {new Date(notif.sentAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
