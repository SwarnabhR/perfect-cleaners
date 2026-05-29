'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { Service, ServiceCategory } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

type LiveService = Service & { id: string };

const CATEGORIES: ServiceCategory[] = ['exterior', 'interior', 'detailing', 'ceramic', 'paint'];
const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  exterior:  'Exterior',
  interior:  'Interior',
  detailing: 'Detailing',
  ceramic:   'Ceramic',
  paint:     'Paint Protection',
};

const BLANK: Omit<Service, 'id'> = {
  name: '', description: '', priceMin: 0, priceMax: 0, durationMin: 60,
  category: 'exterior', isPopular: false, isActive: true,
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const INPUT = {
  width: '100%', padding: '10px 14px', boxSizing: 'border-box' as const,
  background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRadius: 8,
  fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', outline: 'none',
};

export default function ServicesMgmtPage() {
  const [services, setServices]   = useState<LiveService[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [editing,  setEditing]    = useState<LiveService | null>(null);
  const [isNew,    setIsNew]      = useState(false);
  const [form,     setForm]       = useState<Omit<Service, 'id'>>(BLANK);
  const [saving,   setSaving]     = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, 'services'), snap => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveService)));
      setLoading(false);
    }, err => { console.warn('[Services]', err.message); setLoading(false); });
  }, []);

  function openAdd() {
    setForm(BLANK);
    setEditing(null);
    setIsNew(true);
  }

  function openEdit(s: LiveService) {
    const { id: _, ...rest } = s;
    setForm(rest);
    setEditing(s);
    setIsNew(false);
  }

  function closeForm() { setEditing(null); setIsNew(false); }

  async function handleSave() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      if (isNew) {
        await addDoc(collection(db, 'services'), { ...form, createdAt: serverTimestamp() });
      } else if (editing) {
        await updateDoc(doc(db, 'services', editing.id), { ...form, updatedAt: serverTimestamp() });
      }
      closeForm();
    } catch (err: any) {
      console.error('[Services] save failed:', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: LiveService) {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    await deleteDoc(doc(db, 'services', s.id));
  }

  async function toggleActive(s: LiveService) {
    await updateDoc(doc(db, 'services', s.id), { isActive: !s.isActive });
  }

  const f = (field: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const showForm = isNew || editing !== null;

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>CATALOGUE</Eyebrow>
          <h1 style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, fontWeight: 400, color: 'var(--pc-fg)', margin: 0 }}>Services</h1>
        </div>
        <button type="button" onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pc-warm)', border: 'none', borderRadius: 999,
          padding: '10px 20px', cursor: 'pointer',
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)',
        }}>
          <Icon name="plus" size={14} color="var(--pc-ink)" />
          Add Service
        </button>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>Loading…</div>
        ) : services.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            No services yet. Click "Add Service" to create your first.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                {['Service', 'Category', 'Price Range', 'Duration', 'Popular', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', margin: '0 0 2px', fontWeight: 500 }}>{s.name}</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</p>
                  </td>
                  <td style={{ padding: '14px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                    {CATEGORY_LABEL[s.category]}
                  </td>
                  <td style={{ padding: '14px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600 }}>
                    ₹{s.priceMin.toLocaleString('en-IN')}
                    {s.priceMax > s.priceMin ? ` – ₹${s.priceMax.toLocaleString('en-IN')}` : ''}
                  </td>
                  <td style={{ padding: '14px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                    {s.durationMin >= 60 ? `${Math.round(s.durationMin / 60)} hr${Math.round(s.durationMin / 60) !== 1 ? 's' : ''}` : `${s.durationMin} min`}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {s.isPopular
                      ? <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-gold)' }}>★ Popular</span>
                      : <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button type="button" onClick={() => toggleActive(s)} style={{
                      fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 500,
                      color:      s.isActive ? 'var(--pc-sage)' : 'var(--pc-fg-3)',
                      background: 'var(--pc-card-hi)', padding: '3px 10px', borderRadius: 999,
                      border: 'none', cursor: 'pointer',
                    }}>{s.isActive ? 'Active' : 'Inactive'}</button>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button type="button" onClick={() => openEdit(s)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <Icon name="pencil" size={14} color="var(--pc-fg-3)" />
                      </button>
                      <button type="button" onClick={() => handleDelete(s)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <Icon name="trash-2" size={14} color="var(--pc-danger)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Add / Edit form */}
      {showForm && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <Eyebrow>{isNew ? 'ADD SERVICE' : 'EDIT SERVICE'}</Eyebrow>
            <button type="button" onClick={closeForm} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Icon name="x" size={16} color="var(--pc-fg-2)" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <FormField label="Service Name">
              <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Premium Exterior Wash" style={INPUT} />
            </FormField>
            <FormField label="Category">
              <select value={form.category} onChange={e => f('category', e.target.value as ServiceCategory)} style={{ ...INPUT, appearance: 'auto' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </FormField>
            <FormField label="Price Min (₹)">
              <input type="number" value={form.priceMin} onChange={e => f('priceMin', Number(e.target.value))} style={INPUT} />
            </FormField>
            <FormField label="Price Max (₹)">
              <input type="number" value={form.priceMax} onChange={e => f('priceMax', Number(e.target.value))} style={INPUT} />
            </FormField>
            <FormField label="Duration (minutes)">
              <input type="number" value={form.durationMin} onChange={e => f('durationMin', Number(e.target.value))} style={INPUT} />
            </FormField>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', paddingBottom: 2 }}>
              {(['isActive', 'isPopular'] as const).map(key => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form[key]} onChange={e => f(key, e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--pc-sage)' }} />
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>{key === 'isActive' ? 'Active' : 'Popular'}</span>
                </label>
              ))}
            </div>
          </div>
          <FormField label="Description">
            <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3} placeholder="Brief description shown to customers…" style={{ ...INPUT, resize: 'vertical' }} />
          </FormField>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={handleSave} disabled={saving} style={{
              flex: 1, padding: 14, borderRadius: 8, background: 'var(--pc-warm)', color: 'var(--pc-ink)',
              border: 'none', fontFamily: 'var(--pc-sans)', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}>{saving ? 'Saving…' : isNew ? 'Add Service' : 'Save Changes'}</button>
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
