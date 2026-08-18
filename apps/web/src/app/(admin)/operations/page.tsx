'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, collectionGroup, onSnapshot, orderBy, query, updateDoc, doc, limit, where } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import { CRON_TASKS } from '@/lib/cron-tasks';

// One queue for everything an owner must actually act on. Each source below
// answers "what is broken or waiting", never "what happened" — routine
// activity belongs on Cleaning Logs and Notifications, not here.
type Severity = 'critical' | 'high' | 'medium' | 'low';

type Item = {
  id: string;
  kind: string;
  severity: Severity;
  title: string;
  detail: string;
  /** Firestore path — present only for items that can be resolved in place. */
  ref?: string;
  /** Admin route that lets the owner act on this item. */
  href?: string;
};

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: 'var(--pc-danger)',
  high:     'var(--pc-warning)',
  medium:   'var(--pc-info)',
  low:      'var(--pc-fg-3)',
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  const maybe = v as { toDate?: () => Date };
  return typeof maybe.toDate === 'function' ? maybe.toDate() : new Date(v as string | number | Date);
}

function formatDay(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function OperationsPage() {
  // Each source owns its own slice of state so one listener re-firing never
  // clobbers another's results (the previous single-array approach did).
  const [sessionItems, setSessionItems]   = useState<Item[]>([]);
  const [cronItems, setCronItems]         = useState<Item[]>([]);
  const [issueItems, setIssueItems]       = useState<Item[]>([]);
  const [notifItems, setNotifItems]       = useState<Item[]>([]);
  const [paymentItems, setPaymentItems]   = useState<Item[]>([]);
  const [supportItems, setSupportItems]   = useState<Item[]>([]);
  const [resolved, setResolved]           = useState<Set<string>>(new Set());

  // ── Sessions: missed, and upcoming ones with nobody assigned ──────────────
  useEffect(() => onSnapshot(
    query(collection(db, 'cleaningSessions'), where('status', 'in', ['scheduled', 'missed'])),
    snap => {
      const today = startOfToday();
      const cutoff = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
      const next: Item[] = [];
      // Unassigned sessions are grouped by tower: one tower with no roster
      // produces a session every cleaning day for the whole generated
      // horizon, and listing each one separately would bury every other
      // item in the queue. The fix is per-tower, so the row is too.
      const unassigned = new Map<string, { place: string; count: number; earliest: Date }>();

      for (const d of snap.docs) {
        const s = d.data();
        const when = toDate(s.scheduledDate);
        if (!when) continue;
        const place = `${s.societyName ?? ''}${s.tower ? ` · ${s.tower}` : ''}`;

        if (s.status === 'missed') {
          // Only recent misses — a months-old miss is history, not a task.
          if (when < cutoff) continue;
          const reason = String(s.missedReason ?? '').replace(/_/g, ' ') || 'unknown reason';
          next.push({
            id: d.id, kind: 'Missed session', severity: 'high',
            title: place || 'Cleaning session',
            detail: `${formatDay(when)} — ${reason}`,
            href: '/cleaning-schedule',
          });
          continue;
        }

        // Scheduled with no worker: nobody can see or do this work.
        const workerIds = (s.workerIds as string[] | undefined) ?? [];
        if (workerIds.length === 0 && when >= today) {
          const key = `${s.societyId ?? ''}::${s.tower ?? ''}`;
          const g = unassigned.get(key);
          if (!g) unassigned.set(key, { place: place || 'Cleaning session', count: 1, earliest: when });
          else {
            g.count++;
            if (when < g.earliest) g.earliest = when;
          }
        }
      }

      for (const [key, g] of unassigned) {
        next.push({
          id: key, kind: 'No worker assigned', severity: 'high',
          title: g.place,
          detail: `${g.count} upcoming ${g.count === 1 ? 'session has' : 'sessions have'} no worker — from ${formatDay(g.earliest)}. Set this tower's roster.`,
          href: '/societies-mgmt',
        });
      }
      setSessionItems(next);
    },
    err => console.warn('[Operations] sessions:', err.message),
  ), []);

  // ── Automation health ─────────────────────────────────────────────────────
  useEffect(() => onSnapshot(collection(db, 'cronHealth'),
    snap => {
      const byId = new Map(snap.docs.map(d => [d.id, d.data() as { lastRunStatus?: string; lastRunDetail?: string; lastRunAt?: unknown }]));
      setCronItems(CRON_TASKS.filter(t => byId.get(t)?.lastRunStatus !== 'success').map(t => {
        const h = byId.get(t);
        // "Never ran" and "ran and failed" need different fixes — the first
        // means the job isn't registered with the external scheduler, the
        // second means the endpoint itself is erroring. Don't conflate them.
        const neverRan = !h?.lastRunAt;
        return {
          id: t, kind: neverRan ? 'Never run' : 'Automation failing', severity: 'critical' as Severity,
          title: t.replace(/-/g, ' '),
          detail: neverRan
            ? 'No run ever recorded — check this job is registered with the external scheduler.'
            : (h?.lastRunDetail ?? 'Last run did not succeed'),
          href: '/system-health',
        };
      }));
    },
    err => console.warn('[Operations] cronHealth:', err.message),
  ), []);

  // ── Worker-reported job issues ────────────────────────────────────────────
  useEffect(() => onSnapshot(
    query(collection(db, 'workerIssues'), orderBy('createdAt', 'desc'), limit(100)),
    snap => setIssueItems(snap.docs
      .filter(d => d.data().status !== 'resolved')
      .map(d => ({
        id: d.id, kind: 'Worker issue', severity: 'medium' as Severity,
        title: String(d.data().reason ?? 'Job issue'),
        detail: `Session ${d.data().sessionId ?? '—'}`,
        ref: `workerIssues/${d.id}`,
      }))),
    err => console.warn('[Operations] workerIssues:', err.message),
  ), []);

  // ── Failed SMS sends ──────────────────────────────────────────────────────
  useEffect(() => onSnapshot(
    query(collection(db, 'notifications'), where('status', '==', 'failed'), limit(50)),
    snap => setNotifItems(snap.docs.map(d => {
      const n = d.data();
      return {
        id: d.id, kind: 'Failed notification', severity: 'medium' as Severity,
        title: `${String(n.type ?? 'SMS').replace(/_/g, ' ')} → ${n.recipientName ?? n.recipientPhone ?? 'customer'}`,
        detail: String(n.error ?? 'Delivery failed'),
        href: '/notifications',
      };
    })),
    err => console.warn('[Operations] notifications:', err.message),
  ), []);

  // ── Money owed ────────────────────────────────────────────────────────────
  useEffect(() => onSnapshot(
    query(collection(db, 'customerSocietyRecords'), where('paymentStatus', '==', 'pending_payment')),
    snap => setPaymentItems(snap.docs.map(d => {
      const r = d.data();
      const amount = (r.pendingAmount ?? r.monthlyFee ?? 0) as number;
      return {
        id: d.id, kind: 'Payment due', severity: 'low' as Severity,
        title: String(r.customerName ?? 'Customer'),
        detail: `₹${amount.toLocaleString('en-IN')} — ${r.societyName ?? ''}${r.tower ? ` · ${r.tower}` : ''}`,
        href: '/billing',
      };
    })),
    err => console.warn('[Operations] payments:', err.message),
  ), []);

  // ── Customer support threads ──────────────────────────────────────────────
  useEffect(() => onSnapshot(
    query(collectionGroup(db, 'messages'), orderBy('createdAt', 'desc'), limit(100)),
    snap => setSupportItems(snap.docs
      .filter(d => d.ref.path.startsWith('support/') && d.data().status !== 'resolved' && d.data().from === 'customer')
      .map(d => ({
        id: d.id, kind: 'Customer support', severity: 'low' as Severity,
        title: 'Customer message',
        detail: String(d.data().text ?? ''),
        ref: d.ref.path,
      }))),
    err => console.warn('[Operations] support:', err.message),
  ), []);

  const items = useMemo(() => {
    const all = [...cronItems, ...sessionItems, ...issueItems, ...notifItems, ...paymentItems, ...supportItems];
    return all
      .filter(i => !resolved.has(`${i.kind}-${i.id}`))
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [cronItems, sessionItems, issueItems, notifItems, paymentItems, supportItems, resolved]);

  async function resolveItem(item: Item) {
    if (!item.ref) return;
    // Hide immediately — the listener confirms a beat later.
    setResolved(prev => new Set(prev).add(`${item.kind}-${item.id}`));
    try {
      await updateDoc(doc(db, item.ref), { status: 'resolved' });
    } catch (err) {
      console.warn('[Operations] resolve failed:', err);
      setResolved(prev => {
        const next = new Set(prev);
        next.delete(`${item.kind}-${item.id}`);
        return next;
      });
    }
  }

  const counts = useMemo(() => {
    const c: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    items.forEach(i => { c[i.severity]++; });
    return c;
  }, [items]);

  return (
    <div className="admin-page-root">
      <div>
        <Eyebrow style={{ display: 'block', marginBottom: 4 }}>WORK QUEUE</Eyebrow>
        <h1 className="admin-page-title">Needs attention</h1>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '4px 0 0' }}>
          Everything waiting on a person, in one list. Routine work runs automatically and never appears here.
        </p>
      </div>

      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['critical', 'high', 'medium', 'low'] as const).filter(s => counts[s] > 0).map(s => (
            <span key={s} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 999,
              border: `1px solid color-mix(in srgb, ${SEVERITY_COLOR[s]} 35%, transparent)`,
              background: `color-mix(in srgb, ${SEVERITY_COLOR[s]} 10%, transparent)`,
              fontFamily: 'var(--pc-sans)', fontSize: 12, color: SEVERITY_COLOR[s],
            }}>
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor' }} />
              {counts[s]} {s}
            </span>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <Icon name="check-circle" size={26} color="var(--pc-sage)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 4px', fontWeight: 500 }}>
            Nothing needs attention
          </p>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
            Sessions, billing, and notifications are all running on their own.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <Card key={`${item.kind}-${item.id}`} style={{
              padding: 16, display: 'flex', gap: 16, alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap',
              borderLeft: `3px solid ${SEVERITY_COLOR[item.severity]}`,
            }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{
                  fontFamily: 'var(--pc-mono)', fontSize: 9.5, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: SEVERITY_COLOR[item.severity], margin: 0,
                }}>
                  {item.kind}
                </p>
                <p style={{
                  fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600,
                  color: 'var(--pc-fg)', margin: '6px 0 3px', textTransform: 'capitalize',
                }}>
                  {item.title}
                </p>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
                  {item.detail}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {item.href && (
                  <Link href={item.href} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '8px 14px', borderRadius: 999,
                    border: '1px solid var(--pc-line)', textDecoration: 'none',
                    fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)',
                    transition: 'border-color var(--pc-dur-fast) var(--pc-ease)',
                  }}>
                    Open
                    <Icon name="arrow-up-right" size={12} color="var(--pc-fg-3)" />
                  </Link>
                )}
                {item.ref && (
                  <button type="button" onClick={() => resolveItem(item)} style={{
                    padding: '8px 14px', borderRadius: 999,
                    border: '1px solid var(--pc-line)', background: 'transparent',
                    color: 'var(--pc-fg-2)', fontFamily: 'var(--pc-sans)', fontSize: 12,
                    cursor: 'pointer',
                    transition: 'border-color var(--pc-dur-fast) var(--pc-ease)',
                  }}>
                    Resolve
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
