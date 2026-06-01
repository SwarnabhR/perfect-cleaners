'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Society } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

type LiveSociety  = Society & { id: string };
type StatusFilter = 'All' | 'Active' | 'Inactive';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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

// ─── Form modal (shared by Add + Edit) ────────────────────────────────────────

interface SocietyDraft {
  name: string; address: string; city: string; pincode: string;
  towers: string; totalUnits: string; pricePerWash: string;
  cleaningSchedule: string; isActive: boolean;
  cpName: string; cpPhone: string; cpRole: string; cpEmail: string;
}

const EMPTY_DRAFT: SocietyDraft = {
  name: '', address: '', city: 'Delhi', pincode: '',
  towers: '', totalUnits: '', pricePerWash: '',
  cleaningSchedule: 'Mon, Wed, Fri · 7:00 AM', isActive: true,
  cpName: '', cpPhone: '', cpRole: 'Facility Manager', cpEmail: '',
};

function toDraft(s: LiveSociety): SocietyDraft {
  return {
    name:             s.name,
    address:          s.address,
    city:             s.city,
    pincode:          s.pincode,
    towers:           (s.towers ?? []).join(', '),
    totalUnits:       String(s.totalUnits ?? ''),
    pricePerWash:     String(s.pricePerWash ?? ''),
    cleaningSchedule: s.cleaningSchedule ?? '',
    isActive:         s.isActive ?? true,
    cpName:           s.contactPerson?.name  ?? '',
    cpPhone:          s.contactPerson?.phone ?? '',
    cpRole:           s.contactPerson?.role  ?? 'Facility Manager',
    cpEmail:          s.contactPerson?.email ?? '',
  };
}

function fromDraft(d: SocietyDraft) {
  return {
    name:             d.name.trim(),
    address:          d.address.trim(),
    city:             d.city.trim(),
    pincode:          d.pincode.trim(),
    towers:           d.towers.split(',').map(t => t.trim()).filter(Boolean),
    totalUnits:       parseInt(d.totalUnits) || 0,
    pricePerWash:     parseFloat(d.pricePerWash) || 0,
    cleaningSchedule: d.cleaningSchedule.trim(),
    isActive:         d.isActive,
    contactPerson: {
      name:  d.cpName.trim(),
      phone: d.cpPhone.trim(),
      role:  d.cpRole.trim(),
      email: d.cpEmail.trim(),
    },
  };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div role="switch" aria-checked={checked} tabIndex={0}
      onClick={onChange}
      onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onChange()}
      style={{
        width: 44, height: 24, borderRadius: 999, cursor: 'pointer', flexShrink: 0,
        background: checked ? 'var(--pc-sage)' : 'var(--pc-card-hi)',
        position: 'relative', transition: 'background 0.2s',
        border: `2px solid ${checked ? 'transparent' : 'var(--pc-line)'}`,
        outline: 'none',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
  );
}

function SocietyFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: LiveSociety;
  onClose: () => void;
  onSave:  (data: ReturnType<typeof fromDraft>) => Promise<void>;
}) {
  const [draft, setDraft] = useState<SocietyDraft>(initial ? toDraft(initial) : EMPTY_DRAFT);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');

  function set(key: keyof SocietyDraft) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(d => ({ ...d, [key]: e.target.value }));
      setErr('');
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim())    { setErr('Society name is required.'); return; }
    if (!draft.address.trim()) { setErr('Address is required.'); return; }
    setErr(''); setBusy(true);
    try {
      await onSave(fromDraft(draft));
      onClose();
    } catch (e: any) {
      setErr(e.message ?? 'Something went wrong.');
    } finally { setBusy(false); }
  }

  const Row = ({ label, fieldKey, ph, type = 'text' }: {
    label: string; fieldKey: keyof SocietyDraft; ph?: string; type?: string;
  }) => (
    <div>
      <p style={monoLabel}>{label}</p>
      <input
        type={type} value={String(draft[fieldKey])}
        onChange={set(fieldKey as any)} placeholder={ph ?? ''}
        style={inputStyle}
      />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div style={{ background: 'var(--pc-card)', borderRadius: 16, border: '1px solid var(--pc-line)',
        padding: 'clamp(16px, 4vw, 28px)', width: 560, maxWidth: 'min(560px, calc(100vw - 32px))', maxHeight: '90vh',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, fontWeight: 400,
          color: 'var(--pc-fg)', margin: 0 }}>
          {initial ? 'Edit society' : 'Add society'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Society details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Row label="Society name" fieldKey="name" ph="Uniworld City" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Row label="Address" fieldKey="address" ph="Sector 30, Noida" />
            </div>
            <Row label="City"    fieldKey="city"    ph="Noida" />
            <Row label="Pincode" fieldKey="pincode" ph="201301" />
          </div>

          {/* Towers */}
          <Row label="Towers / blocks (comma-separated)" fieldKey="towers" ph="Tower A, Tower B, Tower C" />

          {/* Billing & schedule */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Row label="Total units"     fieldKey="totalUnits"       ph="320" type="number" />
            <Row label="Price per wash (₹)" fieldKey="pricePerWash"  ph="99"  type="number" />
            <div style={{ gridColumn: '1 / -1' }}>
              <Row label="Cleaning schedule" fieldKey="cleaningSchedule" ph="Mon, Wed, Fri · 7:00 AM" />
            </div>
          </div>

          {/* Contact person */}
          <div>
            <p style={{ ...monoLabel, marginBottom: 12 }}>Contact person</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Row label="Name"  fieldKey="cpName"  ph="Rajesh Kumar" />
              <Row label="Role"  fieldKey="cpRole"  ph="Facility Manager" />
              <Row label="Phone" fieldKey="cpPhone" ph="+91 98765 43210" />
              <Row label="Email (optional)" fieldKey="cpEmail" ph="rjk@society.in" type="email" />
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderTop: '1px solid var(--pc-line)' }}>
            <div>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500,
                color: 'var(--pc-fg)', margin: 0 }}>Active</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)',
                margin: '2px 0 0' }}>Workers can log cleans; residents receive notifications</p>
            </div>
            <Toggle
              checked={draft.isActive}
              onChange={() => setDraft(d => ({ ...d, isActive: !d.isActive }))}
            />
          </div>

          {err && <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13,
            color: 'var(--pc-danger)', margin: 0 }}>{err}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={busy} style={{
              flex: 1, padding: '11px 0', borderRadius: 999,
              background: 'var(--pc-warm)', border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
              color: 'var(--pc-ink)', cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1,
            }}>
              {busy ? 'Saving…' : initial ? 'Save changes' : 'Add society'}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: '11px 20px', borderRadius: 999,
              background: 'transparent', border: '1px solid currentColor',
              fontFamily: 'var(--pc-sans)', fontSize: 13,
              color: 'var(--pc-fg-3)', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function SocietyDetailPanel({
  society,
  onClose,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  society:        LiveSociety;
  onClose:        () => void;
  onEdit:         () => void;
  onDelete:       () => void;
  onToggleActive: () => void;
}) {
  const [delConfirm, setDelConfirm] = useState(false);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div style={{ background: 'var(--pc-card)', borderRadius: 16, border: '1px solid var(--pc-line)',
        padding: 28, width: 480, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--pc-sage)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="building-2" size={20} color="var(--pc-sage-ink)" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600,
              color: 'var(--pc-fg)', margin: '0 0 2px' }}>{society.name}</h2>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)',
              margin: '0 0 8px' }}>{society.address}, {society.city} — {society.pincode}</p>
            <StatusPill status={society.isActive ? 'Available' : 'Off Today'} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Total Units',    value: (society.totalUnits ?? 0).toLocaleString('en-IN') },
            { label: 'Residents',      value: (society.activeResidents ?? 0).toLocaleString('en-IN') },
            { label: 'Vehicles',       value: (society.vehicleCount ?? 0).toLocaleString('en-IN') },
            { label: 'Price per Wash', value: society.pricePerWash ? `₹${society.pricePerWash.toLocaleString('en-IN')}` : '—' },
            { label: 'Schedule',       value: society.cleaningSchedule || '—' },
            { label: 'Contract Since', value: formatDate(society.contractStart) },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--pc-card-hi)', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ ...monoLabel, margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                color: 'var(--pc-fg)', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Contact person */}
        {society.contactPerson?.name && (
          <div>
            <p style={monoLabel}>Contact person</p>
            <div style={{ background: 'var(--pc-card-hi)', borderRadius: 8, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--pc-sage)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                  color: 'var(--pc-sage-ink)' }}>{society.contactPerson.name[0] ?? '?'}</span>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600,
                  color: 'var(--pc-fg)', margin: '0 0 1px' }}>{society.contactPerson.name}</p>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>
                  {society.contactPerson.role} · {society.contactPerson.phone}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={onEdit} style={{
            flex: 1, padding: '10px 0', borderRadius: 999,
            background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
            fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', cursor: 'pointer',
          }}>Edit</button>

          <button type="button" onClick={onToggleActive} style={{
            flex: 1, padding: '10px 0', borderRadius: 999,
            background: society.isActive ? 'rgba(201,169,97,0.1)' : 'rgba(74,94,68,0.1)',
            border: `1px solid ${society.isActive ? 'var(--pc-gold)' : 'var(--pc-sage-hi)'}`,
            fontFamily: 'var(--pc-sans)', fontSize: 13,
            color: society.isActive ? 'var(--pc-gold)' : 'var(--pc-sage-hi)', cursor: 'pointer',
          }}>
            {society.isActive ? 'Deactivate' : 'Activate'}
          </button>

          {delConfirm ? (
            <button type="button" onClick={onDelete} style={{
              flex: 1, padding: '10px 0', borderRadius: 999,
              background: 'var(--pc-danger)', border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
              color: '#fff', cursor: 'pointer',
            }}>Confirm delete</button>
          ) : (
            <button type="button" onClick={() => setDelConfirm(true)} style={{
              flex: 1, padding: '10px 0', borderRadius: 999,
              background: 'transparent', border: '1px solid currentColor',
              fontFamily: 'var(--pc-sans)', fontSize: 13,
              color: 'var(--pc-danger)', cursor: 'pointer',
            }}>Delete</button>
          )}
        </div>

        <button type="button" onClick={onClose} style={{
          width: '100%', padding: '11px 0', borderRadius: 999,
          background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
          fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', cursor: 'pointer',
        }}>Close</button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SocietiesMgmtPage() {
  const [societies,    setSocieties]    = useState<LiveSociety[]>([]);
  const [selected,     setSelected]     = useState<LiveSociety | null>(null);
  const [editing,      setEditing]      = useState<LiveSociety | null>(null);
  const [addOpen,      setAddOpen]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'societies'), orderBy('createdAt', 'desc')),
      snap => {
        setSocieties(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSociety)));
        setLoading(false);
      },
      err => { console.warn('[Societies]', err.message); setLoading(false); },
    );
  }, []);

  async function handleAdd(data: ReturnType<typeof fromDraft>) {
    await addDoc(collection(db, 'societies'), {
      ...data,
      activeResidents: 0,
      vehicleCount:    0,
      assignedWorkerIds: [],
      contractStart:   serverTimestamp(),
      createdAt:       serverTimestamp(),
    });
  }

  async function handleEdit(data: ReturnType<typeof fromDraft>) {
    if (!editing) return;
    await updateDoc(doc(db, 'societies', editing.id), { ...data, updatedAt: serverTimestamp() });
  }

  async function handleToggleActive(society: LiveSociety) {
    await updateDoc(doc(db, 'societies', society.id), { isActive: !society.isActive });
    setSelected(null);
  }

  async function handleDelete(societyId: string) {
    await deleteDoc(doc(db, 'societies', societyId));
    setSelected(null);
  }

  const kpis = {
    total:     societies.length,
    active:    societies.filter(s => s.isActive).length,
    residents: societies.reduce((sum, s) => sum + (s.activeResidents ?? 0), 0),
    vehicles:  societies.reduce((sum, s) => sum + (s.vehicleCount ?? 0), 0),
  };

  const filtered = societies.filter(s => {
    const matchSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' ? s.isActive : !s.isActive);
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-page-root">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>PARTNERS</Eyebrow>
          <h1 className="admin-page-title">Societies</h1>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 999,
          background: 'var(--pc-warm)', border: 'none',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
          color: 'var(--pc-ink)', cursor: 'pointer',
        }}>
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          Add Society
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid-4">
        {[
          { label: 'Total Societies', value: loading ? '—' : kpis.total,                             icon: 'building-2'   },
          { label: 'Active Now',      value: loading ? '—' : kpis.active,                            icon: 'check-circle' },
          { label: 'Total Residents', value: loading ? '—' : kpis.residents.toLocaleString('en-IN'), icon: 'users'        },
          { label: 'Registered Cars', value: loading ? '—' : kpis.vehicles.toLocaleString('en-IN'),  icon: 'car'          },
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
            placeholder="Search by name or city…"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              boxSizing: 'border-box', background: 'var(--pc-card)',
              border: '1px solid var(--pc-line)', borderRadius: 999,
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', outline: 'none',
            }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['All', 'Active', 'Inactive'] as StatusFilter[]).map(s => (
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
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 8px' }}>No societies yet.</p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 20px' }}>
              Add your first partner society to start scheduling washes.
            </p>
            <button type="button" onClick={() => setAddOpen(true)} style={{
              padding: '10px 24px', borderRadius: 999,
              background: 'var(--pc-warm)', border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
              color: 'var(--pc-ink)', cursor: 'pointer',
            }}>Add first society</button>
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Society', 'City', 'Units', 'Residents', 'Vehicles', 'Price / wash', 'Status', 'Schedule'].map(h => (
                    <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} onClick={() => setSelected(s)} style={{ borderBottom: '1px solid var(--pc-line)', cursor: 'pointer' }}>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name="building-2" size={15} color="var(--pc-sage-ink)" />
                        </div>
                        <div>
                          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 1px', fontWeight: 500 }}>{s.name}</p>
                          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-4)', margin: 0 }}>{s.pincode}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{s.city || '—'}</td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{(s.totalUnits ?? 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)' }}>{(s.activeResidents ?? 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, color: 'var(--pc-fg)' }}>{(s.vehicleCount ?? 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)' }}>
                      {s.pricePerWash ? `₹${s.pricePerWash}` : '—'}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <StatusPill status={s.isActive ? 'Available' : 'Off Today'} />
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', whiteSpace: 'nowrap' }}>{s.cleaningSchedule || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      {addOpen && (
        <SocietyFormModal onClose={() => setAddOpen(false)} onSave={handleAdd} />
      )}
      {editing && (
        <SocietyFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={handleEdit}
        />
      )}
      {selected && !editing && (
        <SocietyDetailPanel
          society={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); setSelected(null); }}
          onDelete={() => handleDelete(selected.id)}
          onToggleActive={() => handleToggleActive(selected)}
        />
      )}
    </div>
  );
}
