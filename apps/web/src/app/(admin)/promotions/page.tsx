'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Promotion } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

type LivePromo = Promotion & { id: string };

const STATUS_COLORS: Record<string, string> = {
  Active:    'var(--pc-sage)',
  Expired:   'var(--pc-danger)',
  Scheduled: 'var(--pc-warning)',
  'Used Up': 'var(--pc-fg-3)',
  Paused:    'var(--pc-fg-3)',
};

function promoStatus(p: LivePromo): string {
  if (!p.isActive) return 'Paused';
  const now = Date.now();
  const from  = (p.validFrom  as any)?.toDate?.()?.getTime() ?? 0;
  const until = (p.validUntil as any)?.toDate?.()?.getTime() ?? Infinity;
  if (now < from)  return 'Scheduled';
  if (now > until) return 'Expired';
  if (p.maxUses > 0 && p.usedCount >= p.maxUses) return 'Used Up';
  return 'Active';
}

function formatDate(ts: any): string {
  if (!ts) return 'No expiry';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toDateInput(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().slice(0, 10);
}

function generateCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

const BLANK_FORM = {
  code: '', description: '', discountType: 'flat' as 'flat' | 'percent',
  discountValue: 0, minOrderValue: 0, maxUses: 0,
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  isActive: true,
};

const INPUT = {
  width: '100%', padding: '10px 14px', boxSizing: 'border-box' as const,
  background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRadius: 8,
  fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', outline: 'none',
};

export default function PromotionsPage() {
  const [promos,  setPromos]  = useState<LivePromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LivePromo | null>(null);
  const [isNew,   setIsNew]   = useState(false);
  const [form,    setForm]    = useState(BLANK_FORM);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, 'promotions'), snap => {
      setPromos(snap.docs.map(d => ({ id: d.id, ...d.data() } as LivePromo)));
      setLoading(false);
    }, err => { console.warn('[Promos]', err.message); setLoading(false); });
  }, []);

  function openAdd() {
    setForm({ ...BLANK_FORM, code: generateCode() });
    setEditing(null);
    setIsNew(true);
  }

  function openEdit(p: LivePromo) {
    setForm({
      code:          p.code,
      description:   p.description,
      discountType:  p.discountType,
      discountValue: p.discountValue,
      minOrderValue: p.minOrderValue,
      maxUses:       p.maxUses,
      validFrom:     toDateInput(p.validFrom),
      validUntil:    toDateInput(p.validUntil),
      isActive:      p.isActive,
    });
    setEditing(p);
    setIsNew(false);
  }

  function closeForm() { setEditing(null); setIsNew(false); }

  async function handleSave() {
    if (!form.code.trim() || saving) return;
    setSaving(true);
    try {
      const data = {
        code:          form.code.toUpperCase().trim(),
        description:   form.description.trim(),
        discountType:  form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue),
        maxUses:       Number(form.maxUses),
        usedCount:     isNew ? 0 : editing?.usedCount ?? 0,
        validFrom:     Timestamp.fromDate(new Date(form.validFrom)),
        validUntil:    Timestamp.fromDate(new Date(form.validUntil)),
        isActive:      form.isActive,
      };
      if (isNew) {
        await addDoc(collection(db, 'promotions'), { ...data, createdAt: serverTimestamp() });
      } else if (editing) {
        await updateDoc(doc(db, 'promotions', editing.id), { ...data, updatedAt: serverTimestamp() });
      }
      closeForm();
    } catch (err: any) {
      console.error('[Promos] save failed:', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: LivePromo) {
    if (!confirm(`Delete promo "${p.code}"?`)) return;
    await deleteDoc(doc(db, 'promotions', p.id));
  }

  async function togglePause(p: LivePromo) {
    await updateDoc(doc(db, 'promotions', p.id), { isActive: !p.isActive });
  }

  const f = (field: keyof typeof form, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const activeCount   = promos.filter(p => promoStatus(p) === 'Active').length;
  const totalUses     = promos.reduce((s, p) => s + (p.usedCount ?? 0), 0);

  return (
    <div className="admin-page-root">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>MARKETING</Eyebrow>
          <h1 className="admin-page-title">Promotions</h1>
        </div>
        <button type="button" onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-warm)', border: 'none', borderRadius: 999,
          padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)',
        }}>
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          Create Promo
        </button>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid-3">
        {[
          { label: 'Active Promos', value: loading ? '—' : String(activeCount),  icon: 'tag' },
          { label: 'Total Uses',    value: loading ? '—' : String(totalUses),     icon: 'bar-chart-2' },
          { label: 'Total Promos',  value: loading ? '—' : String(promos.length), icon: 'percent' },
        ].map(({ label, value, icon }) => (
          <Card key={label} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
              <Icon name={icon} size={14} color="var(--pc-fg-4)" />
            </div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 24, color: 'var(--pc-fg)', margin: 0 }}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pc-line)' }}>
          <Eyebrow>ALL PROMOTIONS</Eyebrow>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : promos.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            No promos yet. Create your first promotion above.
          </div>
        ) : (
          <div className="table-scroll-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                {['Code', 'Discount', 'Type', 'Uses', 'Min Order', 'Valid Until', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promos.map(p => {
                const status = promoStatus(p);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--pc-line)', opacity: status === 'Expired' || status === 'Used Up' ? 0.6 : 1 }}>
                    <td style={{ padding: '13px 18px' }}>
                      <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 13, color: 'var(--pc-fg)', fontWeight: 600, background: 'var(--pc-card-hi)', padding: '3px 8px', borderRadius: 4 }}>
                        {p.code}
                      </span>
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600 }}>
                      {p.discountType === 'percent' ? `${p.discountValue}% off` : `₹${p.discountValue} off`}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {p.discountType === 'percent' ? 'Percentage' : 'Flat'}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {p.usedCount}{p.maxUses > 0 ? `/${p.maxUses}` : ''}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {p.minOrderValue > 0 ? `₹${p.minOrderValue}` : '—'}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
                      {formatDate(p.validUntil)}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: STATUS_COLORS[status] ?? 'var(--pc-fg-3)', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: STATUS_COLORS[status] ?? 'var(--pc-fg-3)' }}>{status}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button type="button" onClick={() => openEdit(p)} title="Edit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                          <Icon name="pencil" size={14} color="var(--pc-fg-3)" />
                        </button>
                        <button type="button" onClick={() => togglePause(p)} title={p.isActive ? 'Pause' : 'Resume'} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                          <Icon name={p.isActive ? 'pause' : 'play'} size={14} color="var(--pc-fg-3)" />
                        </button>
                        <button type="button" onClick={() => handleDelete(p)} title="Delete" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                          <Icon name="trash-2" size={14} color="var(--pc-danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      {/* Add / Edit form */}
      {(isNew || editing) && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <Eyebrow>{isNew ? 'CREATE PROMOTION' : 'EDIT PROMOTION'}</Eyebrow>
            <button type="button" onClick={closeForm} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Icon name="x" size={16} color="var(--pc-fg-2)" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Promo Code</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={form.code} onChange={e => f('code', e.target.value.toUpperCase())} placeholder="SHINE10" style={{ ...INPUT, flex: 1 }} />
                <button type="button" onClick={() => f('code', generateCode())} style={{
                  padding: '0 14px', background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
                  borderRadius: 8, color: 'var(--pc-fg-2)', fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>Generate</button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Discount Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['flat', 'percent'] as const).map(type => (
                  <button type="button" key={type} onClick={() => f('discountType', type)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid',
                    borderColor: form.discountType === type ? 'var(--pc-sage)' : 'var(--pc-line)',
                    background:  form.discountType === type ? 'var(--pc-sage)' : 'transparent',
                    color:       form.discountType === type ? 'var(--pc-ink)' : 'var(--pc-fg-2)',
                    fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer', fontWeight: 500,
                  }}>{type === 'flat' ? 'Flat ₹' : 'Percentage %'}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                {form.discountType === 'percent' ? 'Discount (%)' : 'Discount Amount (₹)'}
              </label>
              <input type="number" value={form.discountValue} onChange={e => f('discountValue', e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Min Order Value (₹)</label>
              <input type="number" value={form.minOrderValue} onChange={e => f('minOrderValue', e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Max Uses (0 = unlimited)</label>
              <input type="number" value={form.maxUses} onChange={e => f('maxUses', e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Valid From</label>
              <input type="date" value={form.validFrom} onChange={e => f('validFrom', e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Valid Until</label>
              <input type="date" value={form.validUntil} onChange={e => f('validUntil', e.target.value)} style={INPUT} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
              <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--pc-sage)', cursor: 'pointer' }} />
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>Active immediately</span>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Description</label>
            <input value={form.description} onChange={e => f('description', e.target.value)} placeholder="Shown to customers in the app" style={INPUT} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={handleSave} disabled={saving} style={{
              flex: 1, padding: 14, borderRadius: 8, background: 'var(--pc-warm)', color: 'var(--pc-ink)',
              border: 'none', fontFamily: 'var(--pc-sans)', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}>{saving ? 'Saving…' : isNew ? 'Create Promotion' : 'Save Changes'}</button>
            <button type="button" onClick={closeForm} style={{
              flex: 1, padding: 14, borderRadius: 8, background: 'transparent', color: 'var(--pc-fg)',
              border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </Card>
      )}
    </div>
  );
}
