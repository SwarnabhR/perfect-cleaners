'use client';
import { useEffect, useRef, useState } from 'react';
import {
  collection, onSnapshot, orderBy, query,
} from 'firebase/firestore';
import { db } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

interface LiveSession {
  id: string;
  societyId: string; societyName: string; tower?: string;
  workerId: string; workerName: string;
  scheduledDate: any;
  status: 'scheduled' | 'inprogress' | 'done';
  totalCars: number; completedCars: number;
  startedAt?: any; completedAt?: any;
}
interface LiveSociety { id: string; name: string; towers: string[]; }
interface LiveWorker  { id: string; name: string; isOnline: boolean; }

const STATUS_LABEL: Record<string, string> = {
  scheduled:  'Scheduled',
  inprogress: 'In Progress',
  done:       'Done',
};
const FILTERS = ['All', 'Scheduled', 'In Progress', 'Done'];

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 14px',
  background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
  borderRadius: 8, color: 'var(--pc-fg)',
  fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
};
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)',
  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6,
};

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

interface ModalDraft {
  societyId: string; societyName: string; tower: string;
  workerId: string; workerName: string;
  scheduledDate: string; scheduledTime: string;
  totalCars: string;
}
const EMPTY_DRAFT: ModalDraft = {
  societyId: '', societyName: '', tower: '',
  workerId: '', workerName: '',
  scheduledDate: '', scheduledTime: '07:00',
  totalCars: '10',
};

export default function SessionsPage() {
  const [sessions,  setSessions]  = useState<LiveSession[]>([]);
  const [societies, setSocieties] = useState<LiveSociety[]>([]);
  const [workers,   setWorkers]   = useState<LiveWorker[]>([]);
  const [filter,    setFilter]    = useState('All');
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [draft,     setDraft]     = useState<ModalDraft>(EMPTY_DRAFT);
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState('');
  const [copied,    setCopied]    = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'cleaningSessions'), orderBy('scheduledDate', 'desc'));
    return onSnapshot(q,
      snap => { setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSession))); setLoading(false); },
      err  => { console.warn('[Sessions]', err.message); setLoading(false); },
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'societies'), snap =>
      setSocieties(snap.docs.map(d => ({ id: d.id, name: d.data().name, towers: d.data().towers ?? [] }))),
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'workers'), snap =>
      setWorkers(snap.docs.map(d => ({ id: d.id, name: d.data().name, isOnline: d.data().isOnline }))),
    );
  }, []);

  // Close modal on outside click
  useEffect(() => {
    if (!modal) return;
    function close(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setModal(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [modal]);

  const selectedSociety = societies.find(s => s.id === draft.societyId);

  function setField(field: keyof ModalDraft, value: string) {
    setDraft(d => ({ ...d, [field]: value }));
  }

  function handleSocietyChange(societyId: string) {
    const soc = societies.find(s => s.id === societyId);
    setDraft(d => ({ ...d, societyId, societyName: soc?.name ?? '', tower: '' }));
  }

  function handleWorkerChange(workerId: string) {
    const wkr = workers.find(w => w.id === workerId);
    setDraft(d => ({ ...d, workerId, workerName: wkr?.name ?? '' }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.societyId || !draft.workerId || !draft.scheduledDate || !draft.totalCars) return;
    setSaving(true);
    setSaveErr('');
    try {
      const scheduledDate = new Date(`${draft.scheduledDate}T${draft.scheduledTime}:00`).toISOString();
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societyId:    draft.societyId,
          societyName:  draft.societyName,
          tower:        draft.tower || undefined,
          workerId:     draft.workerId,
          workerName:   draft.workerName,
          scheduledDate,
          totalCars:    Number(draft.totalCars),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create session.');
      setModal(false);
      setDraft(EMPTY_DRAFT);
    } catch (err: any) {
      setSaveErr(err.message);
    } finally {
      setSaving(false);
    }
  }

  function copyLink(sessionId: string) {
    const url = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(sessionId);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const filtered = sessions.filter(s =>
    filter === 'All' || STATUS_LABEL[s.status] === filter,
  );
  const counts = {
    total:      sessions.length,
    scheduled:  sessions.filter(s => s.status === 'scheduled').length,
    inprogress: sessions.filter(s => s.status === 'inprogress').length,
    done:       sessions.filter(s => s.status === 'done').length,
  };

  return (
    <div className="admin-page-root">

      <div className="admin-page-header">
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>OPERATIONS</Eyebrow>
          <h1 className="admin-page-title">Cleaning Sessions</h1>
        </div>
        <button
          type="button"
          onClick={() => { setModal(true); setDraft(EMPTY_DRAFT); setSaveErr(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 999, background: 'var(--pc-warm)', border: 'none', fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)', cursor: 'pointer' }}
        >
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          New Session
        </button>
      </div>

      <div className="kpi-grid-4">
        {[
          { label: 'Total',       value: counts.total,      icon: 'calendar'  },
          { label: 'Scheduled',   value: counts.scheduled,  icon: 'clock'     },
          { label: 'In Progress', value: counts.inprogress, icon: 'activity'  },
          { label: 'Done',        value: counts.done,       icon: 'check-circle' },
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

      <div className="filter-chips">
        {FILTERS.map(f => (
          <button type="button" key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 999, border: '1px solid',
            borderColor: filter === f ? 'var(--pc-sage)' : 'var(--pc-line)',
            background:  filter === f ? 'var(--pc-sage)' : 'transparent',
            color:       filter === f ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
            fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer', minHeight: 36,
          }}>{f}</button>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>No sessions found.</div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Date & Time', 'Society', 'Tower', 'Worker', 'Progress', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', whiteSpace: 'nowrap' }}>{formatDate(s.scheduledDate)}</td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', whiteSpace: 'nowrap' }}>{s.societyName}</td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', whiteSpace: 'nowrap' }}>{s.tower ?? '—'}</td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', whiteSpace: 'nowrap' }}>{s.workerName}</td>
                    <td style={{ padding: '13px 18px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 13, color: s.completedCars === s.totalCars ? 'var(--pc-sage)' : 'var(--pc-fg)', fontWeight: 600 }}>
                          {s.completedCars} / {s.totalCars}
                        </span>
                        <div style={{ width: 64, height: 4, borderRadius: 2, background: 'var(--pc-card-hi)', overflow: 'hidden', flexShrink: 0 }}>
                          <div style={{ height: '100%', background: 'var(--pc-sage)', width: `${s.totalCars > 0 ? (s.completedCars / s.totalCars) * 100 : 0}%`, transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}><StatusPill status={STATUS_LABEL[s.status] ?? s.status} /></td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => copyLink(s.id)}
                        title="Copy worker link"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, border: '1px solid var(--pc-line)', background: 'transparent', fontFamily: 'var(--pc-sans)', fontSize: 12, color: copied === s.id ? 'var(--pc-sage)' : 'var(--pc-fg-3)', cursor: 'pointer' }}
                      >
                        <Icon name={copied === s.id ? 'check' : 'link'} size={11} color={copied === s.id ? 'var(--pc-sage)' : 'var(--pc-fg-3)'} />
                        {copied === s.id ? 'Copied' : 'Share link'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Session modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div
            ref={modalRef}
            style={{ width: '100%', maxWidth: 480, background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 16, padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>NEW SESSION</p>
                <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: 0, fontWeight: 400 }}>Create Cleaning Session</h2>
              </div>
              <button type="button" onClick={() => setModal(false)} style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="x" size={14} color="var(--pc-fg-3)" />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Society</label>
                <select
                  required
                  value={draft.societyId}
                  onChange={e => handleSocietyChange(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select society…</option>
                  {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {selectedSociety && selectedSociety.towers.length > 0 && (
                <div>
                  <label style={labelStyle}>Tower (optional)</label>
                  <select
                    value={draft.tower}
                    onChange={e => setField('tower', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">All towers / no tower</option>
                    {selectedSociety.towers.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle}>Assigned Worker</label>
                <select
                  required
                  value={draft.workerId}
                  onChange={e => handleWorkerChange(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select worker…</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name} {w.isOnline ? '● Online' : ''}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input
                    type="date"
                    required
                    value={draft.scheduledDate}
                    onChange={e => setField('scheduledDate', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Start Time</label>
                  <input
                    type="time"
                    required
                    value={draft.scheduledTime}
                    onChange={e => setField('scheduledTime', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Number of Cars</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={500}
                  value={draft.totalCars}
                  onChange={e => setField('totalCars', e.target.value)}
                  style={inputStyle}
                />
              </div>

              {saveErr && (
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-danger)', margin: 0 }}>{saveErr}</p>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, padding: '12px 0', borderRadius: 999, border: '1px solid var(--pc-line)', background: 'transparent', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px 0', borderRadius: 999, border: 'none', background: saving ? 'var(--pc-card-hi)' : 'var(--pc-warm)', fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: saving ? 'var(--pc-fg-3)' : 'var(--pc-ink)', cursor: saving ? 'default' : 'pointer' }}>
                  {saving ? 'Creating…' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
