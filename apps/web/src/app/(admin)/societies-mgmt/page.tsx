'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Society } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';

type LiveSociety = Society & { id: string };
type StatusFilter = 'All' | 'Active' | 'Inactive';

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SocietiesMgmtPage() {
  const [societies,    setSocieties]    = useState<LiveSociety[]>([]);
  const [selected,     setSelected]     = useState<LiveSociety | null>(null);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>PARTNERS</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Societies</h1>
        </div>
        <button
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 999,
            background: 'var(--pc-sage)', border: 'none',
            fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
            color: 'var(--pc-sage-ink)', cursor: 'pointer',
          }}
        >
          <Icon name="plus" size={14} color="var(--pc-sage-ink)" />
          Add Society
        </button>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid-4">
        {[
          { label: 'Total Societies', value: loading ? '—' : kpis.total,                             icon: 'building-2'   },
          { label: 'Active Now',      value: loading ? '—' : kpis.active,                            icon: 'check-circle' },
          { label: 'Total Residents', value: loading ? '—' : kpis.residents.toLocaleString('en-IN'), icon: 'users'        },
          { label: 'Registered Cars', value: loading ? '—' : kpis.vehicles.toLocaleString('en-IN'),  icon: 'car'          },
        ].map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={18} color="var(--pc-sage)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{value}</p>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + status filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={14} color="var(--pc-fg-4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or city…"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, boxSizing: 'border-box',
              background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 999,
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
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            No societies found. Add your first partner society to get started.
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Society', 'City', 'Units', 'Residents', 'Vehicles', 'Status', 'Schedule', 'Since'].map(h => (
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
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 500 }}>{(s.vehicleCount ?? 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '13px 18px' }}>
                      <StatusPill status={s.isActive ? 'Available' : 'Off Today'} />
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)' }}>{s.cleaningSchedule || '—'}</td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>{formatDate((s as any).contractStart)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail drawer */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: 'var(--pc-card)', borderRadius: 16, border: '1px solid var(--pc-line)', padding: 28, width: 460, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="building-2" size={20} color="var(--pc-sage-ink)" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 2px' }}>{selected.name}</h2>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 8px' }}>{selected.address}, {selected.city} — {selected.pincode}</p>
                <StatusPill status={selected.isActive ? 'Available' : 'Off Today'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Total Units',    value: (selected.totalUnits ?? 0).toLocaleString('en-IN') },
                { label: 'Residents',      value: (selected.activeResidents ?? 0).toLocaleString('en-IN') },
                { label: 'Vehicles',       value: (selected.vehicleCount ?? 0).toLocaleString('en-IN') },
                { label: 'Monthly Fee',    value: selected.monthlyFee ? `₹${selected.monthlyFee.toLocaleString('en-IN')}` : '—' },
                { label: 'Schedule',       value: selected.cleaningSchedule || '—' },
                { label: 'Contract Since', value: formatDate((selected as any).contractStart) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--pc-card-hi)', borderRadius: 8, padding: '10px 12px' }}>
                  <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-fg)', margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {selected.contactPerson && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact Person</p>
                <div style={{ background: 'var(--pc-card-hi)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-sage-ink)' }}>{selected.contactPerson.name?.[0] ?? '?'}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 1px' }}>{selected.contactPerson.name}</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>{selected.contactPerson.role} · {selected.contactPerson.phone}</p>
                    {selected.contactPerson.email && (
                      <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-4)', margin: '2px 0 0' }}>{selected.contactPerson.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Assigned Workers ({selected.assignedWorkerIds?.length ?? 0})
              </p>
              {(selected.assignedWorkerIds?.length ?? 0) === 0 ? (
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)', margin: 0 }}>No workers assigned yet.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.assignedWorkerIds.map(wid => (
                    <span key={wid} style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-2)', background: 'var(--pc-card-hi)', borderRadius: 4, padding: '3px 8px', border: '1px solid var(--pc-line)' }}>
                      {wid.slice(0, 12)}…
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{ width: '100%', padding: '11px 0', borderRadius: 999, background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
