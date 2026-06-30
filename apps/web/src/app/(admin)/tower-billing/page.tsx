'use client';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@pc/firebase';
import type { SocietyBillingConfig } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

type LiveBillingConfig = SocietyBillingConfig & { id: string };

interface FormData {
  societyId: string;
  societyName: string;
  tower: string;
  monthlyFee: number;
  cleaningSchedule: string;
}

const BLANK_FORM: FormData = {
  societyId: '',
  societyName: '',
  tower: '',
  monthlyFee: 0,
  cleaningSchedule: 'Mon, Wed, Fri · 9:00 AM',
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

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)',
  fontSize: 9.5,
  color: 'var(--pc-fg-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 6px',
};

export default function TowerBillingPage() {
  const [configs, setConfigs] = useState<LiveBillingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing,   setEditing]   = useState<LiveBillingConfig | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form,      setForm]      = useState<FormData>(BLANK_FORM);
  const [saving,    setSaving]    = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    return onSnapshot(
      collection(db, 'societyBillingConfig'),
      snap => {
        setConfigs(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveBillingConfig)));
        setLoading(false);
      },
      err => {
        console.warn('[TowerBilling]', err.message);
        setLoading(false);
      }
    );
  }, []);

  function openAdd() {
    setForm(BLANK_FORM);
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(config: LiveBillingConfig) {
    setForm({
      societyId: config.societyId,
      societyName: config.societyName,
      tower: config.tower,
      monthlyFee: config.monthlyFee,
      cleaningSchedule: config.cleaningSchedule,
    });
    setEditing(config);
    setModalOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setModalOpen(false);
    setForm(BLANK_FORM);
  }

  async function handleSave() {
    if (!form.societyId.trim() || !form.tower.trim() || form.monthlyFee <= 0 || saving) return;
    setSaving(true);
    try {
      const docId = editing?.id || `${form.societyId}_${form.tower}`;
      await setDoc(doc(db, 'societyBillingConfig', docId), {
        societyId: form.societyId.trim(),
        societyName: form.societyName.trim(),
        tower: form.tower.trim(),
        monthlyFee: form.monthlyFee,
        cleaningSchedule: form.cleaningSchedule.trim(),
        currency: 'INR',
        billingDay: 1,
        updatedAt: serverTimestamp(),
      });
      closeForm();
    } catch (err: unknown) {
      console.error('[TowerBilling] save failed:', err instanceof Error ? err.message : err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'societyBillingConfig', id));
    } catch (err: unknown) {
      console.error('[TowerBilling] delete failed:', err instanceof Error ? err.message : err);
    }
  }

  const filtered = configs.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.societyName.toLowerCase().includes(q) ||
      c.tower.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-page-root">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>BILLING</Eyebrow>
          <h1 className="admin-page-title">Tower Pricing</h1>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '4px 0 0' }}>
            Set monthly cleaning fees for each tower
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
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
          Add Pricing
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
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
          placeholder="Search by society name or tower…"
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

      {/* Form Modal */}
      {modalOpen && (
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
          onClick={closeForm}
        >
          <div
            style={{
              background: 'var(--pc-card)',
              borderRadius: 16,
              border: '1px solid var(--pc-line)',
              padding: 'clamp(16px,5vw,28px)',
              width: '100%',
              maxWidth: 450,
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
              {editing ? 'Edit Tower Pricing' : 'Add Tower Pricing'}
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
                  readOnly={!!editing}
                />
              </div>

              <div>
                <p style={monoLabel}>Tower Name</p>
                <input
                  type="text"
                  value={form.tower}
                  onChange={e => setForm({ ...form, tower: e.target.value })}
                  placeholder="e.g., Tower A, Tower B, North Wing"
                  style={inputStyle}
                  readOnly={!!editing}
                />
              </div>

              <div>
                <p style={monoLabel}>Monthly Fee (₹)</p>
                <input
                  type="number"
                  value={form.monthlyFee}
                  onChange={e => setForm({ ...form, monthlyFee: parseInt(e.target.value) || 0 })}
                  placeholder="450"
                  min="0"
                  step="10"
                  style={inputStyle}
                />
              </div>

              <div>
                <p style={monoLabel}>Cleaning Schedule</p>
                <input
                  type="text"
                  value={form.cleaningSchedule}
                  onChange={e => setForm({ ...form, cleaningSchedule: e.target.value })}
                  placeholder="Mon, Wed, Fri · 9:00 AM - 12:00 PM"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !form.societyId || !form.tower || form.monthlyFee <= 0}
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
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Pricing'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
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

      {/* List */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 8px' }}>
              No tower pricing configured
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 20px' }}>
              Add the first tower to set up billing.
            </p>
            <button
              type="button"
              onClick={openAdd}
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
              Add Pricing
            </button>
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {['Society', 'Tower', 'Monthly Fee', 'Schedule', 'Billing', 'Action'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '13px 18px',
                        textAlign: 'left',
                        fontFamily: 'var(--pc-sans)',
                        fontSize: 11,
                        color: 'var(--pc-fg-3)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(config => (
                  <tr key={config.id} style={{ borderBottom: '1px solid var(--pc-line)' }}>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 500 }}>
                      {config.societyName}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {config.tower}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600 }}>
                      ₹{config.monthlyFee.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {config.cleaningSchedule}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>
                      {config.billingDay}st
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => openEdit(config)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'transparent',
                            border: '1px solid var(--pc-line)',
                            fontFamily: 'var(--pc-sans)',
                            fontSize: 11,
                            color: 'var(--pc-fg-2)',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(config.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'transparent',
                            border: '1px solid var(--pc-danger)',
                            fontFamily: 'var(--pc-sans)',
                            fontSize: 11,
                            color: 'var(--pc-danger)',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
