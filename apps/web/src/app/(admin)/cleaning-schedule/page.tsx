'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { CleaningSessionEnhanced, CleaningSessionStatus, Worker, Society } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';
import { notifyCleaningMissed } from '@/lib/notification';

const MISSED_REASONS: { value: 'holiday' | 'worker_unavailable' | 'other'; label: string }[] = [
  { value: 'holiday',            label: 'Society holiday' },
  { value: 'worker_unavailable', label: 'Worker unavailable' },
  { value: 'other',              label: 'Other' },
];

type LiveSession = CleaningSessionEnhanced & { id: string };

interface CreateSessionForm {
  societyId: string;
  societyName: string;
  tower: string;
  scheduledDate: string;
  workerIds: string[];
}

const BLANK_FORM: CreateSessionForm = {
  societyId: '',
  societyName: '',
  tower: '',
  scheduledDate: new Date().toISOString().split('T')[0],
  workerIds: [],
};

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)',
  fontSize: 9.5,
  color: 'var(--pc-fg-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  boxSizing: 'border-box',
  background: 'var(--pc-card)',
  border: '1px solid var(--pc-line)',
  borderRadius: 8,
  color: 'var(--pc-fg)',
  fontFamily: 'var(--pc-sans)',
  fontSize: 14,
  outline: 'none',
};

function toDate(value: unknown): Date {
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string | number | Date);
}

function formatDate(date: unknown): string {
  return toDate(date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(date: unknown): string {
  return toDate(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

type LiveWorker  = Worker  & { id: string };
type LiveSociety = Society & { id: string };

export default function CleaningSchedulePage() {
  const [sessions,     setSessions]     = useState<LiveSession[]>([]);
  const [workers,      setWorkers]      = useState<LiveWorker[]>([]);
  const [societies,    setSocieties]    = useState<LiveSociety[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState<CleaningSessionStatus | 'all'>('all');
  const [creating,     setCreating]     = useState(false);
  const [form,         setForm]         = useState<CreateSessionForm>(BLANK_FORM);
  const [saving,       setSaving]       = useState(false);
  const [reassigning,  setReassigning]  = useState<LiveSession | null>(null);
  const [reassignIds,  setReassignIds]  = useState<string[]>([]);
  const [markingMissed, setMarkingMissed] = useState<LiveSession | null>(null);
  const [missedReason, setMissedReason] = useState<'holiday' | 'worker_unavailable' | 'other'>('worker_unavailable');
  const [missedNotes,  setMissedNotes]  = useState('');
  const [missedBusy,   setMissedBusy]   = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'cleaningSessions'), orderBy('scheduledDate', 'desc')),
      snap => {
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSession)));
        setLoading(false);
      },
      err => {
        console.warn('[CleaningSchedule]', err.message);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      collection(db, 'workers'),
      snap => setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveWorker))),
      err => console.warn('[CleaningSchedule] workers:', err.message),
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      collection(db, 'societies'),
      snap => setSocieties(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSociety))),
      err => console.warn('[CleaningSchedule] societies:', err.message),
    );
  }, []);

  async function handleCreateSession() {
    if (!form.societyId.trim() || !form.tower.trim() || form.workerIds.length === 0 || saving) return;
    setSaving(true);

    try {
      const scheduledDate = new Date(form.scheduledDate);
      const sessionId = `${form.societyId}_${form.tower}_${form.scheduledDate}`;
      const selectedWorkers = workers.filter(w => form.workerIds.includes(w.id));
      const workerNames = selectedWorkers.map(w => w.name);

      await setDoc(doc(db, 'cleaningSessions', sessionId), {
        societyId: form.societyId.trim(),
        societyName: form.societyName.trim(),
        tower: form.tower.trim(),
        scheduledDate,
        status: 'scheduled',
        cars: [],
        totalCars: 0,
        completedCars: 0,
        skippedCars: 0,
        workerIds: form.workerIds,
        workerNames,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCreating(false);
      setForm(BLANK_FORM);
    } catch (err: unknown) {
      console.error('[CleaningSchedule] create failed:', err instanceof Error ? err.message : err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSession(id: string) {
    try {
      await deleteDoc(doc(db, 'cleaningSessions', id));
    } catch (err: unknown) {
      console.error('[CleaningSchedule] delete failed:', err instanceof Error ? err.message : err);
    }
  }

  async function handleStartSession(id: string) {
    try {
      await setDoc(
        doc(db, 'cleaningSessions', id),
        {
          status: 'inprogress' as CleaningSessionStatus,
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err: unknown) {
      console.error('[CleaningSchedule] start failed:', err instanceof Error ? err.message : err);
    }
  }

  function openReassign(session: LiveSession) {
    setReassigning(session);
    setReassignIds(session.workerIds ?? []);
  }

  async function handleReassignWorkers() {
    if (!reassigning || reassignIds.length === 0 || saving) return;
    setSaving(true);
    try {
      const selectedWorkers = workers.filter(w => reassignIds.includes(w.id));
      await setDoc(
        doc(db, 'cleaningSessions', reassigning.id),
        {
          workerIds: reassignIds,
          workerNames: selectedWorkers.map(w => w.name),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setReassigning(null);
    } catch (err: unknown) {
      console.error('[CleaningSchedule] reassign failed:', err instanceof Error ? err.message : err);
    } finally {
      setSaving(false);
    }
  }

  function openMarkMissed(session: LiveSession) {
    setMarkingMissed(session);
    setMissedReason('worker_unavailable');
    setMissedNotes('');
  }

  async function handleMarkMissed() {
    if (!markingMissed || missedBusy) return;
    setMissedBusy(true);
    try {
      await setDoc(
        doc(db, 'cleaningSessions', markingMissed.id),
        {
          status: 'missed' as CleaningSessionStatus,
          missedReason,
          missedNotes: missedNotes.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Find the next scheduled session for this tower, for a friendlier notification.
      const nextSnap = await getDocs(query(
        collection(db, 'cleaningSessions'),
        where('societyId', '==', markingMissed.societyId),
        where('tower', '==', markingMissed.tower),
        where('status', '==', 'scheduled'),
        orderBy('scheduledDate', 'asc'),
        limit(1),
      ));
      const nextDate = nextSnap.docs[0]?.data().scheduledDate;
      const nextDateLabel = nextDate
        ? (nextDate.toDate?.() ?? new Date(nextDate)).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
        : undefined;

      // Notify the affected customers, best-effort — skip anyone we don't have a phone number for.
      const customerIds = [...new Set(markingMissed.cars.map(c => c.customerId))];
      if (customerIds.length > 0) {
        const recordsSnap = await getDocs(query(
          collection(db, 'customerSocietyRecords'),
          where('societyId', '==', markingMissed.societyId),
          where('tower', '==', markingMissed.tower),
        ));
        for (const recordDoc of recordsSnap.docs) {
          const rec = recordDoc.data();
          if (!customerIds.includes(rec.customerId) || !rec.customerPhone) continue;
          await notifyCleaningMissed(
            rec.customerPhone,
            rec.customerName ?? 'there',
            markingMissed.societyName,
            markingMissed.tower,
            missedReason,
            nextDateLabel,
          );
        }
      }

      setMarkingMissed(null);
    } catch (err: unknown) {
      console.error('[CleaningSchedule] mark missed failed:', err instanceof Error ? err.message : err);
    } finally {
      setMissedBusy(false);
    }
  }

  const filtered = sessions.filter(s => filterStatus === 'all' || s.status === filterStatus);

  const stats = {
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    inProgress: sessions.filter(s => s.status === 'inprogress').length,
    done: sessions.filter(s => s.status === 'done').length,
  };

  return (
    <div className="admin-page-root">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>OPERATIONS</Eyebrow>
          <h1 className="admin-page-title">Weekly Cleaning Schedule</h1>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '4px 0 0' }}>
            Create & manage cleaning sessions. Assign workers and track progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 999,
            background: 'var(--pc-warm)',
            border: 'none',
            fontFamily: 'var(--pc-sans)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--pc-ink)',
            cursor: 'pointer',
          }}
        >
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          Create Session
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid-3">
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
            <Icon name="calendar" size={18} color="var(--pc-info)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.scheduled}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              AWAITING WORKERS
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
            <Icon name="activity" size={18} color="var(--pc-warning)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.inProgress}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              CLEANING IN PROGRESS
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
              {loading ? '—' : stats.done}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              ALL CARS CLEANED
            </p>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['all', 'scheduled', 'inprogress', 'done'] as const).map(status => (
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

      {/* List */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 8px' }}>
              No sessions scheduled
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 20px' }}>
              Create a new cleaning session to get started.
            </p>
            <button
              type="button"
              onClick={() => setCreating(true)}
              style={{
                padding: '10px 24px',
                borderRadius: 999,
                background: 'var(--pc-warm)',
                border: 'none',
                fontFamily: 'var(--pc-sans)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--pc-ink)',
                cursor: 'pointer',
              }}
            >
              Create Session
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filtered.map((session, idx) => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--pc-line)' : 'none',
                }}
              >
                {/* Date & Status */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 4px' }}>
                    {formatDate(session.scheduledDate)}
                  </p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', margin: '0 0 8px' }}>
                    {session.societyName} · {session.tower}
                  </p>
                  <StatusPill status={session.status.replace('_', ' ') as any} />
                </div>

                {/* Progress */}
                <div style={{ textAlign: 'center', minWidth: 120 }}>
                  <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 4px', fontWeight: 600 }}>
                    {session.completedCars}/{session.totalCars}
                  </p>
                  <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
                    CARS DONE
                  </p>
                </div>

                {/* Workers */}
                <div style={{ textAlign: 'center', minWidth: 100 }}>
                  <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 4px', fontWeight: 600 }}>
                    {session.workerIds.length}
                  </p>
                  <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
                    WORKERS
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {session.status === 'scheduled' && (
                    <button
                      type="button"
                      onClick={() => handleStartSession(session.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 6,
                        background: 'var(--pc-sage)',
                        border: 'none',
                        fontFamily: 'var(--pc-sans)',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--pc-sage-ink)',
                        cursor: 'pointer',
                      }}
                    >
                      Start
                    </button>
                  )}
                  {(session.status === 'scheduled' || session.status === 'inprogress') && (
                    <>
                      <button
                        type="button"
                        onClick={() => openReassign(session)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 6,
                          background: 'transparent',
                          border: '1px solid var(--pc-line)',
                          fontFamily: 'var(--pc-sans)',
                          fontSize: 12,
                          color: 'var(--pc-fg-2)',
                          cursor: 'pointer',
                        }}
                      >
                        Reassign
                      </button>
                      <button
                        type="button"
                        onClick={() => openMarkMissed(session)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 6,
                          background: 'transparent',
                          border: '1px solid var(--pc-warning)',
                          fontFamily: 'var(--pc-sans)',
                          fontSize: 12,
                          color: 'var(--pc-warning)',
                          cursor: 'pointer',
                        }}
                      >
                        Mark Missed
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(session.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      background: 'transparent',
                      border: '1px solid var(--pc-danger)',
                      fontFamily: 'var(--pc-sans)',
                      fontSize: 12,
                      color: 'var(--pc-danger)',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      {creating && (
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
          onClick={() => setCreating(false)}
        >
          <div
            style={{
              background: 'var(--pc-card)',
              borderRadius: 16,
              border: '1px solid var(--pc-line)',
              padding: 'clamp(16px,5vw,28px)',
              width: '100%',
              maxWidth: 480,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2
              style={{
                fontFamily: 'var(--pc-serif)',
                fontSize: 22,
                fontWeight: 400,
                color: 'var(--pc-fg)',
                margin: '0 0 20px',
              }}
            >
              Create Cleaning Session
            </h2>

            <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Society dropdown — auto-fills ID and name */}
              <div>
                <p style={monoLabel}>Society</p>
                {societies.length === 0 ? (
                  <input
                    type="text"
                    value={form.societyName}
                    onChange={e => setForm({ ...form, societyName: e.target.value, societyId: e.target.value })}
                    placeholder="Society name (no societies in DB yet)"
                    style={inputStyle}
                  />
                ) : (
                  <select
                    value={form.societyId}
                    onChange={e => {
                      const selected = societies.find(s => s.id === e.target.value);
                      setForm(f => ({
                        ...f,
                        societyId: selected?.id ?? '',
                        societyName: selected?.name ?? '',
                        tower: '',
                      }));
                    }}
                    style={inputStyle}
                  >
                    <option value="">Select a society…</option>
                    {societies.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tower dropdown — populated from selected society */}
              <div>
                <p style={monoLabel}>Tower</p>
                {(() => {
                  const selectedSociety = societies.find(s => s.id === form.societyId);
                  const towers = selectedSociety?.towers ?? [];
                  if (towers.length === 0) {
                    return (
                      <input
                        type="text"
                        value={form.tower}
                        onChange={e => setForm({ ...form, tower: e.target.value })}
                        placeholder="e.g., Tower A, Tower B"
                        style={inputStyle}
                      />
                    );
                  }
                  return (
                    <select
                      value={form.tower}
                      onChange={e => setForm({ ...form, tower: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select a tower…</option>
                      {towers.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              <div>
                <p style={monoLabel}>Scheduled Date</p>
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <p style={monoLabel}>Assign Workers</p>
                <div style={{ background: 'var(--pc-card-hi)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {workers.length === 0 ? (
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>
                      No workers found. Add workers first.
                    </p>
                  ) : workers.map(w => {
                    const checked = form.workerIds.includes(w.id);
                    return (
                      <label
                        key={w.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: checked ? 'color-mix(in srgb, var(--pc-sage) 10%, transparent)' : 'transparent', border: `1px solid ${checked ? 'var(--pc-sage-hi)' : 'transparent'}`, transition: 'background 0.15s' }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setForm(f => ({
                            ...f,
                            workerIds: checked
                              ? f.workerIds.filter(id => id !== w.id)
                              : [...f.workerIds, w.id],
                          }))}
                          style={{ accentColor: 'var(--pc-sage)', width: 15, height: 15, flexShrink: 0 }}
                        />
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', flex: 1 }}>{w.name}</span>
                        <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)' }}>
                          {w.isOnline ? '● Online' : '○ Offline'}
                        </span>
                      </label>
                    );
                  })}
                  <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', margin: '4px 0 0' }}>
                    {form.workerIds.length} worker{form.workerIds.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleCreateSession}
                  disabled={saving || !form.societyId || !form.tower || form.workerIds.length === 0}
                  style={{
                    flex: 1,
                    padding: '11px 0',
                    borderRadius: 999,
                    background: 'var(--pc-warm)',
                    border: 'none',
                    fontFamily: 'var(--pc-sans)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--pc-ink)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Creating…' : 'Create Session'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  style={{
                    padding: '11px 20px',
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
            </form>
          </div>
        </div>
      )}

      {/* Reassign Workers Modal */}
      {reassigning && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setReassigning(null)}
        >
          <div
            style={{ background: 'var(--pc-card)', borderRadius: 16, border: '1px solid var(--pc-line)', padding: 'clamp(16px,5vw,28px)', width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, fontWeight: 400, color: 'var(--pc-fg)', margin: '0 0 8px' }}>
              Reassign Workers
            </h2>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 20px' }}>
              {reassigning.societyName} · {reassigning.tower} · {formatDate(reassigning.scheduledDate)}
            </p>

            <div style={{ background: 'var(--pc-card-hi)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {workers.length === 0 ? (
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>No workers found.</p>
              ) : workers.map(w => {
                const checked = reassignIds.includes(w.id);
                return (
                  <label
                    key={w.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: checked ? 'color-mix(in srgb, var(--pc-sage) 10%, transparent)' : 'transparent', border: `1px solid ${checked ? 'var(--pc-sage-hi)' : 'transparent'}` }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setReassignIds(ids => checked ? ids.filter(id => id !== w.id) : [...ids, w.id])}
                      style={{ accentColor: 'var(--pc-sage)', width: 15, height: 15, flexShrink: 0 }}
                    />
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', flex: 1 }}>{w.name}</span>
                    <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)' }}>
                      {w.isOnline ? '● Online' : '○ Offline'}
                    </span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleReassignWorkers}
                disabled={saving || reassignIds.length === 0}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 999,
                  background: 'var(--pc-warm)', border: 'none',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                  color: 'var(--pc-ink)', cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setReassigning(null)}
                style={{ padding: '11px 20px', borderRadius: 999, background: 'transparent', border: '1px solid currentColor', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Missed Modal */}
      {markingMissed && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setMarkingMissed(null)}
        >
          <div
            style={{ background: 'var(--pc-card)', borderRadius: 16, border: '1px solid var(--pc-line)', padding: 'clamp(16px,5vw,28px)', width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, fontWeight: 400, color: 'var(--pc-fg)', margin: '0 0 8px' }}>
              Mark Cleaning Missed
            </h2>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 20px' }}>
              {markingMissed.societyName} · {markingMissed.tower} · {formatDate(markingMissed.scheduledDate)}. Affected residents will be notified with the reason below.
            </p>

            <p style={monoLabel}>Reason</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {MISSED_REASONS.map(r => (
                <label
                  key={r.value}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 6, background: missedReason === r.value ? 'color-mix(in srgb, var(--pc-warning) 10%, transparent)' : 'var(--pc-card-hi)', border: `1px solid ${missedReason === r.value ? 'var(--pc-warning)' : 'transparent'}` }}
                >
                  <input type="radio" name="missedReason" checked={missedReason === r.value} onChange={() => setMissedReason(r.value)} style={{ accentColor: 'var(--pc-warning)' }} />
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)' }}>{r.label}</span>
                </label>
              ))}
            </div>

            <p style={monoLabel}>Notes (optional)</p>
            <textarea
              value={missedNotes}
              onChange={e => setMissedNotes(e.target.value)}
              placeholder="e.g., Diwali holiday, worker called in sick"
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical', marginBottom: 20 } as React.CSSProperties}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleMarkMissed}
                disabled={missedBusy}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 999,
                  background: 'var(--pc-danger)', border: 'none',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                  color: '#fff', cursor: missedBusy ? 'not-allowed' : 'pointer',
                  opacity: missedBusy ? 0.6 : 1,
                }}
              >
                {missedBusy ? 'Marking…' : 'Mark Missed & Notify'}
              </button>
              <button
                type="button"
                onClick={() => setMarkingMissed(null)}
                style={{ padding: '11px 20px', borderRadius: 999, background: 'transparent', border: '1px solid currentColor', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', cursor: 'pointer' }}
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
