'use client';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, COMMON_PARKING_LEVELS } from '@pc/firebase';
import type { SocietyBillingConfig, DayOfWeek } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';

type LiveBillingConfig = SocietyBillingConfig & { id: string };

const DAY_ORDER: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
const DAY_LABELS: Record<DayOfWeek, string> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
const NAME_TO_DAY: Record<string, DayOfWeek> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function parseDaysFromSchedule(schedule: string): DayOfWeek[] {
  const daysPart = schedule.split('·')[0] ?? '';
  return daysPart.split(',').map(d => NAME_TO_DAY[d.trim()]).filter((d): d is DayOfWeek => d !== undefined);
}

function parseTimeFromSchedule(schedule: string): string {
  const parts = schedule.split('·');
  return parts.length > 1 ? parts[1].trim() : '9:00 AM';
}

function buildScheduleString(days: DayOfWeek[], time: string): string {
  const label = [...days].sort((a, b) => a - b).map(d => DAY_LABELS[d]).join(', ');
  return time ? `${label} · ${time}` : label;
}

// "9:00 AM" → 540. The structured source of truth the crons read
// (cleaningTimeMinutes); the display string above is presentation only.
function parseTimeToMinutes(time: string): number | null {
  const m = time.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2] ?? 0);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  const meridiem = m[3].toUpperCase();
  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  return hour * 60 + minute;
}

type BillingFrequency = 'monthly' | 'one-time' | 'per-day';
type DeepCleanFrequency = 'weekly' | 'daily' | 'one-time';

const BILLING_FREQUENCY_OPTS: { value: BillingFrequency; label: string }[] = [
  { value: 'monthly',  label: 'Monthly' },
  { value: 'one-time', label: 'One-time' },
  { value: 'per-day',  label: 'Per-day (metered)' },
];

const DEEP_CLEAN_FREQUENCY_OPTS: { value: DeepCleanFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily',  label: 'Daily' },
  { value: 'one-time', label: 'One-time' },
];

interface FormData {
  societyId: string;
  societyName: string;
  tower: string;
  tierNormal: number;
  tierPremium: number;
  tierUltra: number;
  twoWheelerFee: number;
  billingFrequency: BillingFrequency;
  deepCleanEnabled: boolean;
  deepCleanFrequency: DeepCleanFrequency;
  deepCleanFee: number;
  cleaningDays: DayOfWeek[];
  cleaningTime: string;
  parkingLevels: string[];
}

const BLANK_FORM: FormData = {
  societyId: '',
  societyName: '',
  tower: '',
  tierNormal: 0,
  tierPremium: 0,
  tierUltra: 0,
  twoWheelerFee: 0,
  billingFrequency: 'monthly',
  deepCleanEnabled: false,
  deepCleanFrequency: 'weekly',
  deepCleanFee: 0,
  cleaningDays: [1, 3, 5],
  cleaningTime: '9:00 AM',
  parkingLevels: [],
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
  const [newLevelInput, setNewLevelInput] = useState('');

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
      // Prefill all three tiers with the flat fee when this config predates tiers,
      // so the form never shows blank prices for an already-priced tower.
      tierNormal:  config.tierPricing?.normal  ?? config.monthlyFee,
      tierPremium: config.tierPricing?.premium ?? config.monthlyFee,
      tierUltra:   config.tierPricing?.ultra   ?? config.monthlyFee,
      twoWheelerFee: config.twoWheelerFee ?? 0,
      billingFrequency:   config.billingFrequency ?? 'monthly',
      deepCleanEnabled:   !!config.deepClean,
      deepCleanFrequency: config.deepClean?.frequency ?? 'weekly',
      deepCleanFee:       config.deepClean?.fee ?? 0,
      cleaningDays: config.cleaningDays?.length ? config.cleaningDays : parseDaysFromSchedule(config.cleaningSchedule),
      cleaningTime: parseTimeFromSchedule(config.cleaningSchedule),
      parkingLevels: config.availableParkingLevels ?? [],
    });
    setEditing(config);
    setModalOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setModalOpen(false);
    setForm(BLANK_FORM);
    setNewLevelInput('');
  }

  function addParkingLevel(level: string) {
    const trimmed = level.trim();
    if (!trimmed || form.parkingLevels.includes(trimmed)) return;
    setForm(f => ({ ...f, parkingLevels: [...f.parkingLevels, trimmed] }));
    setNewLevelInput('');
  }

  async function handleSave() {
    if (!form.societyId.trim() || !form.tower.trim() || form.tierNormal <= 0 || form.cleaningDays.length === 0 || saving) return;
    setSaving(true);
    try {
      const docId = editing?.id || `${form.societyId}_${form.tower}`;
      await setDoc(doc(db, 'societyBillingConfig', docId), {
        societyId: form.societyId.trim(),
        societyName: form.societyName.trim(),
        tower: form.tower.trim(),
        // monthlyFee mirrors the Normal tier so readers that don't know about
        // tiers yet (billing page, wallet page, notification copy) keep working.
        monthlyFee: form.tierNormal,
        tierPricing: { normal: form.tierNormal, premium: form.tierPremium, ultra: form.tierUltra },
        ...(form.twoWheelerFee > 0 ? { twoWheelerFee: form.twoWheelerFee } : {}),
        billingFrequency: form.billingFrequency,
        ...(form.deepCleanEnabled
          ? { deepClean: { frequency: form.deepCleanFrequency, fee: form.deepCleanFee } }
          : {}),
        cleaningDays: form.cleaningDays,
        cleaningSchedule: buildScheduleString(form.cleaningDays, form.cleaningTime.trim()),
        ...(form.parkingLevels.length ? { availableParkingLevels: form.parkingLevels } : {}),
        // null (not absent) when the time doesn't parse, so a bad edit can't
        // silently leave a stale structured time from a previous save behind.
        cleaningTimeMinutes: parseTimeToMinutes(form.cleaningTime.trim()),
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
            Set tier pricing, billing frequency, and deep-clean add-ons for each tower
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
            background: 'var(--pc-ink-scrim)',
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
                <p style={monoLabel}>Tier Pricing (₹)</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {([
                    { key: 'tierNormal' as const,  label: 'Normal'  },
                    { key: 'tierPremium' as const, label: 'Premium' },
                    { key: 'tierUltra' as const,   label: 'Ultra Premium' },
                  ]).map(({ key, label }) => (
                    <div key={key}>
                      <p style={{ ...monoLabel, fontSize: 9, marginBottom: 4 }}>{label}</p>
                      <input
                        type="number"
                        value={form[key]}
                        onChange={e => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })}
                        placeholder="450"
                        min="0"
                        step="10"
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', margin: '6px 0 0' }}>
                  Each resident picks a tier at signup. For “Per-day” billing below, these are per-clean rates, not monthly totals.
                </p>
              </div>

              <div>
                <p style={monoLabel}>Two-wheeler Fee (₹)</p>
                <input
                  type="number"
                  value={form.twoWheelerFee}
                  onChange={e => setForm({ ...form, twoWheelerFee: parseInt(e.target.value) || 0 })}
                  placeholder="199"
                  min="0"
                  step="10"
                  style={inputStyle}
                />
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', margin: '6px 0 0' }}>
                  Flat monthly fee for a bike/scooter/scooty — untiered. Leave at 0 to hide the two-wheeler option at signup for this tower.
                </p>
              </div>

              <div>
                <p style={monoLabel}>Billing Frequency</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {BILLING_FREQUENCY_OPTS.map(opt => {
                    const checked = form.billingFrequency === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, billingFrequency: opt.value }))}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: `1px solid ${checked ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                          background: checked ? 'var(--pc-sage)' : 'var(--pc-card-hi)',
                          color: checked ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                          fontFamily: 'var(--pc-sans)',
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: form.deepCleanEnabled ? 10 : 0 }}>
                  <input
                    type="checkbox"
                    id="deepCleanEnabled"
                    checked={form.deepCleanEnabled}
                    onChange={e => setForm({ ...form, deepCleanEnabled: e.target.checked })}
                    style={{ accentColor: 'var(--pc-sage)', width: 15, height: 15, cursor: 'pointer' }}
                  />
                  <label htmlFor="deepCleanEnabled" style={{ ...monoLabel, margin: 0, cursor: 'pointer' }}>
                    Deep clean add-on
                  </label>
                </div>
                {form.deepCleanEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, background: 'var(--pc-card-hi)', borderRadius: 8 }}>
                    <div>
                      <p style={{ ...monoLabel, fontSize: 9 }}>Frequency</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {DEEP_CLEAN_FREQUENCY_OPTS.map(opt => {
                          const checked = form.deepCleanFrequency === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setForm(f => ({ ...f, deepCleanFrequency: opt.value }))}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: `1px solid ${checked ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                                background: checked ? 'var(--pc-sage)' : 'var(--pc-card)',
                                color: checked ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                                fontFamily: 'var(--pc-sans)',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p style={{ ...monoLabel, fontSize: 9 }}>Add-on Fee (₹)</p>
                      <input
                        type="number"
                        value={form.deepCleanFee}
                        onChange={e => setForm({ ...form, deepCleanFee: parseInt(e.target.value) || 0 })}
                        placeholder="200"
                        min="0"
                        step="10"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p style={monoLabel}>Allowed Cleaning Days</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DAY_ORDER.map(day => {
                    const checked = form.cleaningDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          cleaningDays: checked
                            ? f.cleaningDays.filter(d => d !== day)
                            : [...f.cleaningDays, day],
                        }))}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: `1px solid ${checked ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                          background: checked ? 'var(--pc-sage)' : 'var(--pc-card-hi)',
                          color: checked ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                          fontFamily: 'var(--pc-sans)',
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', margin: '6px 0 0' }}>
                  Customers can only choose a preferred day from this set.
                </p>
              </div>

              <div>
                <p style={monoLabel}>Cleaning Time</p>
                <input
                  type="text"
                  value={form.cleaningTime}
                  onChange={e => setForm({ ...form, cleaningTime: e.target.value })}
                  placeholder="9:00 AM"
                  style={inputStyle}
                />
              </div>

              <div>
                <p style={monoLabel}>Parking Levels</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {form.parkingLevels.map(level => (
                    <span
                      key={level}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px', borderRadius: 8,
                        border: '1px solid var(--pc-sage-hi)', background: 'var(--pc-sage)',
                        color: 'var(--pc-sage-ink)', fontFamily: 'var(--pc-sans)', fontSize: 12.5,
                      }}
                    >
                      {level}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, parkingLevels: f.parkingLevels.filter(l => l !== level) }))}
                        aria-label={`Remove ${level}`}
                        style={{ display: 'flex', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit' }}
                      >
                        <Icon name="x" size={12} color="currentColor" />
                      </button>
                    </span>
                  ))}
                  {form.parkingLevels.length === 0 && (
                    <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)' }}>
                      None configured — enrollment forms will use a free-text spot number only.
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {COMMON_PARKING_LEVELS.filter(l => !form.parkingLevels.includes(l)).map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => addParkingLevel(level)}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: '1px dashed var(--pc-line)',
                        background: 'transparent', color: 'var(--pc-fg-3)',
                        fontFamily: 'var(--pc-sans)', fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      + {level}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={newLevelInput}
                    onChange={e => setNewLevelInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addParkingLevel(newLevelInput); } }}
                    placeholder="Custom level, e.g. Basement 3"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => addParkingLevel(newLevelInput)}
                    style={{
                      padding: '0 16px', borderRadius: 8, border: '1px solid var(--pc-line)',
                      background: 'var(--pc-card-hi)', color: 'var(--pc-fg-2)',
                      fontFamily: 'var(--pc-sans)', fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Add
                  </button>
                </div>
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', margin: '6px 0 0' }}>
                  Some towers have Ground only, some go up to B3/B4, some don't track this at all — leave empty if this tower doesn't.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !form.societyId || !form.tower || form.tierNormal <= 0 || form.cleaningDays.length === 0}
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
                  {['Society', 'Tower', 'Tier Pricing', 'Schedule', 'Billing', 'Action'].map(h => (
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
                    <td style={{ padding: '13px 18px' }}>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 600, margin: 0 }}>
                        {config.tierPricing
                          ? `₹${config.tierPricing.normal} / ₹${config.tierPricing.premium} / ₹${config.tierPricing.ultra}`
                          : `₹${config.monthlyFee.toLocaleString('en-IN')}`}
                      </p>
                      {config.deepClean && (
                        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-info)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          + deep clean ({config.deepClean.frequency}) ₹{config.deepClean.fee}
                        </p>
                      )}
                      {!!config.twoWheelerFee && (
                        <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <Icon name="bike" size={10} color="var(--pc-fg-3)" />
                          2-wheeler ₹{config.twoWheelerFee}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {config.cleaningSchedule}
                      {!!config.availableParkingLevels?.length && (
                        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-4)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Parking: {config.availableParkingLevels.join(', ')}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-mono)', fontSize: 11, color: 'var(--pc-fg-3)' }}>
                      {config.billingFrequency === 'one-time' ? 'One-time' : config.billingFrequency === 'per-day' ? 'Per-day' : `Monthly · ${config.billingDay}st`}
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
