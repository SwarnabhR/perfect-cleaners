'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { CleaningSessionEnhanced, CleaningSessionStatus, Worker } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

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

type LiveWorker = Worker & { id: string };

export default function CleaningSchedulePage() {
  const [sessions,     setSessions]     = useState<LiveSession[]>([]);
  const [workers,      setWorkers]      = useState<LiveWorker[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState<CleaningSessionStatus | 'all'>('all');
  const [creating,     setCreating]     = useState(false);
  const [form,         setForm]         = useState<CreateSessionForm>(BLANK_FORM);
  const [saving,       setSaving]       = useState(false);

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
              <div>
                <p style={monoLabel}>Society Name</p>
                <input
                  type="text"
                  value={form.societyName}
                  onChange={e => setForm({ ...form, societyName: e.target.value })}
                  placeholder="e.g., Uniworld City, Lodha Group"
                  style={inputStyle}
                />
              </div>

              <div>
                <p style={monoLabel}>Society ID</p>
                <input
                  type="text"
                  value={form.societyId}
                  onChange={e => setForm({ ...form, societyId: e.target.value })}
                  placeholder="Firebase ID"
                  style={inputStyle}
                />
              </div>

              <div>
                <p style={monoLabel}>Tower</p>
                <input
                  type="text"
                  value={form.tower}
                  onChange={e => setForm({ ...form, tower: e.target.value })}
                  placeholder="e.g., Tower A, Tower B"
                  style={inputStyle}
                />
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
    </div>
  );
}
