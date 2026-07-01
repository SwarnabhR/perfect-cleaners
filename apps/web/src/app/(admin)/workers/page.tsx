'use client';
import { useEffect, useRef, useState } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc, getDocs, where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@pc/firebase';
import type { Worker, Society } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';
import Avatar from '@/components/ui/Avatar';

type LiveWorker  = Worker  & { id: string };
type LiveSociety = Society & { id: string };
type StatusFilter = 'All' | 'Available' | 'On Job' | 'Off Today';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function workerStatus(w: LiveWorker): string {
  if (!w.isOnline)        return 'Off Today';
  if (w.activeBookingId)  return 'On Job';
  return 'Available';
}

type MaybeTs = { toDate?(): Date } | Date | string | number | null | undefined;
function fmt(ts: MaybeTs): string {
  if (!ts) return '—';
  const d = (ts as { toDate?(): Date }).toDate
    ? (ts as { toDate(): Date }).toDate()
    : new Date(ts as string | number | Date);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function StarRating({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <Icon key={i} name="star" size={11}
          color={i <= filled ? 'var(--pc-gold)' : 'var(--pc-line)'} />
      ))}
      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', marginLeft: 4 }}>
        {value ? value.toFixed(1) : '—'}
      </span>
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 14px',
  background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
  borderRadius: 8, color: 'var(--pc-fg)',
  fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
};

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)',
  textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px',
};

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

function WorkerFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: { name: string; phone: string };
  onClose: () => void;
  onSave:  (name: string, phone: string) => Promise<void>;
}) {
  const [name,  setName]  = useState(initial?.name  ?? '');
  const [phone, setPhone] = useState(
    initial?.phone ? initial.phone.replace('+91', '').replace(/\D/g, '') : '',
  );
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr('Name is required.'); return; }
    if (phone.replace(/\D/g, '').length !== 10) { setErr('Enter a valid 10-digit phone number.'); return; }
    setErr(''); setBusy(true);
    try {
      await onSave(name.trim(), phone.replace(/\D/g, ''));
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--pc-card)', borderRadius: 16, border: '1px solid var(--pc-line)',
          padding: 'clamp(16px,5vw,28px)', width: '100%', maxWidth: 400,
          maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, fontWeight: 400,
          color: 'var(--pc-fg)', margin: '0 0 20px' }}>
          {initial ? 'Edit worker' : 'Add worker'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={monoLabel}>Full name</p>
            <input
              value={name} onChange={e => { setName(e.target.value); setErr(''); }}
              placeholder="Ravi Kumar" autoFocus style={inputStyle}
            />
          </div>

          <div>
            <p style={monoLabel}>Mobile number</p>
            <div style={{ display: 'flex' }}>
              <span style={{
                display: 'flex', alignItems: 'center', padding: '10px 12px',
                background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
                borderRight: 'none', borderRadius: '8px 0 0 8px',
                fontFamily: 'var(--pc-mono)', fontSize: 13, color: 'var(--pc-fg-3)',
              }}>+91</span>
              <input
                type="tel" inputMode="numeric" maxLength={10}
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setErr(''); }}
                placeholder="98765 43210"
                style={{ ...inputStyle, borderRadius: '0 8px 8px 0', flex: 1 }}
              />
            </div>
          </div>

          {err && (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13,
              color: 'var(--pc-danger)', margin: 0 }}>{err}</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="submit" disabled={busy}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 999,
                background: 'var(--pc-warm)', border: 'none',
                fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                color: 'var(--pc-ink)', cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? 'Saving…' : initial ? 'Save changes' : 'Add worker'}
            </button>
            <button
              type="button" onClick={onClose}
              style={{
                padding: '11px 20px', borderRadius: 999,
                background: 'transparent', border: '1px solid currentColor',
                fontFamily: 'var(--pc-sans)', fontSize: 13,
                color: 'var(--pc-fg-3)', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Detail / assign panel ────────────────────────────────────────────────────

function WorkerDetailPanel({
  worker,
  societies,
  onClose,
  onEdit,
  onDelete,
}: {
  worker:    LiveWorker;
  societies: LiveSociety[];
  onClose:   () => void;
  onEdit:    () => void;
  onDelete:  () => void;
}) {
  const [assignSociety, setAssignSociety] = useState(worker.assignedSocietyId ?? '');
  const [assigning,     setAssigning]     = useState(false);
  const [delConfirm,    setDelConfirm]    = useState(false);

  async function handleAssign() {
    if (assigning) return;
    setAssigning(true);
    const society = societies.find(s => s.id === assignSociety) ?? null;
    try {
      await updateDoc(doc(db, 'workers', worker.id), {
        assignedSocietyId:   society?.id   ?? null,
        assignedSocietyName: society?.name ?? null,
      });
    } finally { setAssigning(false); }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--pc-card)', borderRadius: 16, border: '1px solid var(--pc-line)',
          padding: 'clamp(16px,5vw,28px)', width: '100%', maxWidth: 420,
          maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={worker.name || '?'} size={56} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600,
              color: 'var(--pc-fg)', margin: '0 0 2px' }}>{worker.name}</h2>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)',
              margin: '0 0 6px' }}>{worker.phone}</p>
            <StatusPill status={workerStatus(worker)} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Jobs Done',       value: worker.totalJobs ?? 0 },
            { label: 'Cars Done Today', value: worker.carsCompletedToday ?? 0 },
            { label: 'Rating',          value: worker.rating != null ? `${worker.rating.toFixed(1)} / 5.0` : '—' },
            { label: 'Joined',          value: fmt((worker as any).createdAt) },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--pc-card-hi)', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ ...monoLabel, margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600,
                color: 'var(--pc-fg)', margin: 0 }}>{String(value)}</p>
            </div>
          ))}
        </div>

        {/* Society assignment */}
        <div>
          <p style={monoLabel}>Society assignment</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={assignSociety}
              onChange={e => setAssignSociety(e.target.value)}
              style={{
                flex: 1, padding: '9px 12px',
                background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
                borderRadius: 8, color: 'var(--pc-fg)',
                fontFamily: 'var(--pc-sans)', fontSize: 13, outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">Unassigned</option>
              {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button
              type="button" onClick={handleAssign}
              disabled={assigning || assignSociety === (worker.assignedSocietyId ?? '')}
              style={{
                padding: '9px 16px', borderRadius: 8,
                background: 'var(--pc-sage)', border: 'none',
                fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                color: 'var(--pc-sage-ink)', cursor: 'pointer',
                opacity: assigning || assignSociety === (worker.assignedSocietyId ?? '') ? 0.5 : 1,
              }}
            >
              {assigning ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onEdit} style={{
            flex: 1, padding: '10px 0', borderRadius: 999,
            background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
            fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', cursor: 'pointer',
          }}>
            Edit details
          </button>

          {delConfirm ? (
            <button type="button" onClick={onDelete} style={{
              flex: 1, padding: '10px 0', borderRadius: 999,
              background: 'var(--pc-danger)', border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
              color: '#fff', cursor: 'pointer',
            }}>
              Confirm remove
            </button>
          ) : (
            <button type="button" onClick={() => setDelConfirm(true)} style={{
              flex: 1, padding: '10px 0', borderRadius: 999,
              background: 'transparent', border: '1px solid currentColor',
              fontFamily: 'var(--pc-sans)', fontSize: 13,
              color: 'var(--pc-danger)', cursor: 'pointer',
            }}>
              Remove worker
            </button>
          )}
        </div>

        <button type="button" onClick={onClose} style={{
          width: '100%', padding: '11px 0', borderRadius: 999,
          background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
          fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', cursor: 'pointer',
        }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkersPage() {
  const [workers,        setWorkers]        = useState<LiveWorker[]>([]);
  const [societies,      setSocieties]      = useState<LiveSociety[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<LiveWorker | null>(null);
  const [editingWorker,  setEditingWorker]  = useState<LiveWorker | null>(null);
  const [addOpen,        setAddOpen]        = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [loadErr,        setLoadErr]        = useState('');
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('All');

  useEffect(() => {
    getDocs(query(collection(db, 'societies'), where('isActive', '==', true)))
      .then(snap => setSocieties(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSociety))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'workers'), orderBy('createdAt', 'desc')),
      snap => {
        setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveWorker)));
        setLoading(false);
      },
      err => {
        console.warn('[Workers]', err.message);
        setLoadErr(err.code === 'permission-denied'
          ? 'Permission denied — your account may not have admin access yet.'
          : err.message);
        setLoading(false);
      },
    );
  }, []);

  async function getIdToken() {
    return getAuth().currentUser?.getIdToken() ?? '';
  }

  async function handleSaveWorker(name: string, phone: string, workerId?: string) {
    if (workerId) {
      // Edit existing — update name and phone in-place
      await updateDoc(doc(db, 'workers', workerId), {
        name,
        phone: `+91${phone}`,
      });
      return;
    }
    // Add new — use Admin SDK route to find/create Firebase user + workers doc
    const idToken = await getIdToken();
    const res = await fetch('/api/admin/create-worker', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, phone, idToken }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to add worker.');
  }

  async function handleDeleteWorker(workerId: string) {
    try {
      await deleteDoc(doc(db, 'workers', workerId));
    } finally {
      setSelectedWorker(null);
    }
  }

  const kpis = {
    total:     workers.length,
    onDuty:    workers.filter(w => w.isOnline).length,
    available: workers.filter(w => w.isOnline && !w.activeBookingId).length,
    avgRating: workers.length
      ? (workers.reduce((s, w) => s + (w.rating ?? 0), 0) / workers.length).toFixed(1)
      : '—',
  };

  const filtered = workers.filter(w => {
    const matchSearch = !search ||
      w.name?.toLowerCase().includes(search.toLowerCase()) ||
      w.phone?.includes(search);
    const matchStatus = statusFilter === 'All' || workerStatus(w) === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-page-root">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>TEAM</Eyebrow>
          <h1 className="admin-page-title">Workers</h1>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 999,
            background: 'var(--pc-warm)', border: 'none',
            fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
            color: 'var(--pc-ink)', cursor: 'pointer',
          }}
        >
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          Add worker
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid-4">
        {[
          { label: 'Total Workers', value: loading ? '—' : kpis.total,     icon: 'users'      },
          { label: 'On Duty Today', value: loading ? '—' : kpis.onDuty,    icon: 'user-check' },
          { label: 'Available Now', value: loading ? '—' : kpis.available, icon: 'circle-dot' },
          { label: 'Avg Rating',    value: loading ? '—' : kpis.avgRating, icon: 'star'       },
        ].map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color="var(--pc-sage)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{String(value)}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={14} color="var(--pc-fg-4)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              boxSizing: 'border-box', background: 'var(--pc-card)',
              border: '1px solid var(--pc-line)', borderRadius: 999,
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', outline: 'none',
            }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['All', 'Available', 'On Job', 'Off Today'] as StatusFilter[]).map(s => (
            <button type="button" key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '7px 14px', borderRadius: 999, border: '1px solid',
              borderColor: statusFilter === s ? 'var(--pc-sage)' : 'var(--pc-line)',
              background:  statusFilter === s ? 'var(--pc-sage)' : 'transparent',
              color:       statusFilter === s ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            Loading…
          </div>
        ) : loadErr ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', margin: '0 0 6px' }}>
              {loadErr}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', margin: 0 }}>
              Run <code style={{ fontFamily: 'var(--pc-mono)' }}>npm run bootstrap-admin</code> to set up admin access.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 8px' }}>
              No workers yet.
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 20px' }}>
              Add a worker above — they can log in immediately using their phone number.
            </p>
            <button type="button" onClick={() => setAddOpen(true)} style={{
              padding: '10px 24px', borderRadius: 999,
              background: 'var(--pc-warm)', border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
              color: 'var(--pc-ink)', cursor: 'pointer',
            }}>
              Add first worker
            </button>
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Worker', 'Phone', 'Status', 'Society', 'Jobs Done', 'Cars Today', 'Rating', 'Joined'].map(h => (
                    <th key={h} style={{
                      padding: '13px 18px', textAlign: 'left',
                      fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)',
                      fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr
                    key={w.id}
                    onClick={() => setSelectedWorker(w)}
                    style={{ borderBottom: '1px solid var(--pc-line)', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={w.name || '?'} size={32} />
                        <div>
                          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 1px', fontWeight: 500 }}>
                            {w.name || '—'}
                          </p>
                          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-4)', margin: 0 }}>
                            {w.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {w.phone || '—'}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <StatusPill status={workerStatus(w)} />
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {(w as any).assignedSocietyName || <span style={{ color: 'var(--pc-fg-4)' }}>Unassigned</span>}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>
                      {w.totalJobs ?? 0}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>
                      {w.carsCompletedToday ?? 0}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <StarRating value={w.rating ?? 0} />
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                      {fmt((w as any).createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add worker modal */}
      {addOpen && (
        <WorkerFormModal
          onClose={() => setAddOpen(false)}
          onSave={(name, phone) => handleSaveWorker(name, phone)}
        />
      )}

      {/* Edit worker modal */}
      {editingWorker && (
        <WorkerFormModal
          initial={{ name: editingWorker.name, phone: editingWorker.phone ?? '' }}
          onClose={() => setEditingWorker(null)}
          onSave={(name, phone) => handleSaveWorker(name, phone, editingWorker.id)}
        />
      )}

      {/* Detail panel */}
      {selectedWorker && !editingWorker && (
        <WorkerDetailPanel
          worker={selectedWorker}
          societies={societies}
          onClose={() => setSelectedWorker(null)}
          onEdit={() => { setEditingWorker(selectedWorker); setSelectedWorker(null); }}
          onDelete={() => handleDeleteWorker(selectedWorker.id)}
        />
      )}
    </div>
  );
}
