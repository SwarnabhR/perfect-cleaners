'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getDoc, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, increment } from 'firebase/firestore';
import { db, auth } from '@pc/firebase';
import type { CustomerSocietyRecord, Society, DayOfWeek, VehicleCategory, SocietyBillingConfig } from '@pc/firebase';
import Card from '@/components/ui/Card';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import StatusPill from '@/components/ui/StatusPill';
import { notifyApproval } from '@/lib/notification';

type LiveRecord  = CustomerSocietyRecord & { id: string };
type LiveSociety = Society & { id: string };

const DAY_ORDER: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
const DAY_LABELS: Record<DayOfWeek, string> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
const NAME_TO_DAY: Record<string, DayOfWeek> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
function parseDaysFromSchedule(schedule: string): DayOfWeek[] {
  return (schedule.split('·')[0] ?? '').split(',').map(d => NAME_TO_DAY[d.trim()]).filter((d): d is DayOfWeek => d !== undefined);
}

// The monthly-billing cron bills every active record unconditionally on the
// 1st of the month, regardless of when it was activated — so a record's
// first real bill always lands there, never "tomorrow".
function firstOfNextMonth(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatSlotTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour % 1) * 60);
  const h12 = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// 5:45 AM start, then the standard 30-minute grid through 11:00 AM — matches
// the customer-facing picker in account/cleaning/page.tsx so admin-set and
// customer-set times line up.
const TIME_OPTIONS = [
  { label: formatSlotTime(5.75), value: 5.75 },
  ...Array.from({ length: 11 }, (_, i) => {
    const value = 6 + i * 0.5;
    return { label: formatSlotTime(value), value };
  }),
];

const ENROLLMENT_STATUS_LABEL: Record<string, string> = {
  pending:  'Pending',
  active:   'Active',
  paused:   'Paused',
  inactive: 'Cancelled',
};

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--pc-mono)',
  fontSize: 9.5,
  color: 'var(--pc-fg-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 14px',
  background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
  borderRadius: 8, color: 'var(--pc-fg)',
  fontFamily: 'var(--pc-sans)', fontSize: 14, outline: 'none',
};

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; text: string }> = {
    not_verified: { bg: 'color-mix(in srgb, var(--pc-warning) 12%, transparent)', color: 'var(--pc-warning)', text: 'Not Verified' },
    verified: { bg: 'color-mix(in srgb, var(--pc-info) 12%, transparent)', color: 'var(--pc-info)', text: 'Verified' },
    pending_payment: { bg: 'color-mix(in srgb, var(--pc-warning) 12%, transparent)', color: 'var(--pc-warning)', text: 'Pending' },
    paid: { bg: 'color-mix(in srgb, var(--pc-sage) 12%, transparent)', color: 'var(--pc-sage)', text: 'Paid' },
  };

  const style = styles[status] || styles.verified;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 6,
        background: style.bg,
        fontFamily: 'var(--pc-mono)',
        fontSize: 10,
        fontWeight: 600,
        color: style.color,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      <Icon
        name={
          status === 'paid' ? 'check-circle' : status === 'verified' ? 'clock' : status === 'pending_payment' ? 'alert-circle' : 'x-circle'
        }
        size={12}
        color={style.color}
      />
      {style.text}
    </span>
  );
}

function monthStart() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Add Customer modal ─────────────────────────────────────────────────────
//
// The only path CLAUDE.md calls "Bulk Import": an admin directly enrolling a
// resident who has no app account and may never install one, may never give
// a phone number, but definitely has a car that lives somewhere specific —
// so tower + unit number (not phone) is the durable identity key here, and
// the only thing a worker actually needs to find the car on the ground.
// Writes straight to status: 'active' — the admin keying this in directly
// *is* the verification step, matching CLAUDE.md's bulk-import semantics.

// One row per vehicle the resident parks with us — a car and a two-wheeler are
// two separate physical tasks, so each is its own row (and its own session entry).
interface CarRow {
  plate: string; make: string; model: string; category: VehicleCategory;
}

interface CustomerForm {
  name: string; phone: string;
  societyId: string; societyName: string; tower: string; unitNumber: string; parkingNumber: string; parkingLevel: string;
  cars: CarRow[];
  preferredTime: number; preferredDays: DayOfWeek[];
  tier: 'normal' | 'premium' | 'ultra';
  paymentMethod: string; paymentNotes: string;
}

const BLANK_FORM: CustomerForm = {
  name: '', phone: '',
  societyId: '', societyName: '', tower: '', unitNumber: '', parkingNumber: '', parkingLevel: '',
  cars: [{ plate: '', make: '', model: '', category: 'car' }],
  preferredTime: 9, preferredDays: [],
  tier: 'normal',
  paymentMethod: '', paymentNotes: '',
};

function formFromRecord(record: LiveRecord): CustomerForm {
  return {
    name:          record.customerName ?? '',
    phone:         (record.customerPhone ?? '').replace('+91', '').replace(/\D/g, '').slice(-10),
    societyId:     record.societyId,
    societyName:   record.societyName,
    tower:         record.tower,
    unitNumber:    record.unitNumber ?? '',
    parkingNumber: record.parkingNumber ?? '',
    parkingLevel:  record.parkingLevel ?? '',
    cars: (record.cars?.length ? record.cars : [{ plate: '', make: '', model: '' }]).map(c => ({
      plate: c.plate ?? '', make: c.make ?? '', model: c.model ?? '', category: c.category ?? 'car',
    })),
    preferredTime:  record.permanentTime ?? record.preferredCleaningTime ?? 9,
    preferredDays:  record.preferredCleaningDays ?? [],
    tier:           record.tier ?? 'normal',
    paymentMethod:  record.paymentMethod ?? '',
    paymentNotes:   record.paymentNotes ?? '',
  };
}

function CustomerFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: LiveRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [societies, setSocieties] = useState<LiveSociety[]>([]);
  const [form, setForm] = useState<CustomerForm>(initial ? formFromRecord(initial) : BLANK_FORM);
  const [towerDays, setTowerDays] = useState<DayOfWeek[]>([]);
  const [towerParkingLevels, setTowerParkingLevels] = useState<string[]>([]);
  const [tierPricing, setTierPricing] = useState<{ normal: number; premium: number; ultra: number } | null>(null);
  const [twoWheelerFee, setTwoWheelerFee] = useState(0);
  const [configMonthlyFee, setConfigMonthlyFee] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // One-time fetch — this list doesn't need to be live for a modal that's
  // open for a few seconds at a time.
  useEffect(() => {
    getDocs(query(collection(db, 'societies'), where('isActive', '==', true)))
      .then(snap => setSocieties(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSociety))))
      .catch(() => {});
  }, []);

  // Tower's admin-configured cleaning days + pricing, so the pickers below only
  // ever offer valid choices — same constraint the self-signup form applies.
  // On edit this refreshes options for a changed tower without clobbering the
  // seeded values (tier/parking are only reset when the tower no longer offers
  // them).
  useEffect(() => {
    if (!form.societyId || !form.tower) { setTowerDays([]); setTowerParkingLevels([]); setTierPricing(null); setTwoWheelerFee(0); setConfigMonthlyFee(null); return; }
    getDocs(query(
      collection(db, 'societyBillingConfig'),
      where('societyId', '==', form.societyId),
      where('tower', '==', form.tower),
    )).then(snap => {
      const config = snap.docs[0]?.data();
      const days = (config?.cleaningDays as DayOfWeek[] | undefined)?.length
        ? (config!.cleaningDays as DayOfWeek[])
        : parseDaysFromSchedule((config?.cleaningSchedule as string | undefined) ?? '');
      const levels = (config?.availableParkingLevels as string[] | undefined) ?? [];
      setTowerDays(days);
      setTowerParkingLevels(levels);
      setTierPricing((config?.tierPricing as { normal: number; premium: number; ultra: number } | undefined) ?? null);
      setTwoWheelerFee((config?.twoWheelerFee as number | undefined) ?? 0);
      setConfigMonthlyFee((config?.monthlyFee as number | undefined) ?? null);
      setForm(f => ({
        ...f,
        preferredDays: f.preferredDays.length ? f.preferredDays.filter(d => days.includes(d)) : days,
        parkingLevel:  levels.includes(f.parkingLevel) ? f.parkingLevel : '',
      }));
    }).catch(() => { setTowerDays([]); setTowerParkingLevels([]); setTierPricing(null); setTwoWheelerFee(0); setConfigMonthlyFee(null); });
  }, [form.societyId, form.tower]);

  const selectedSociety = societies.find(s => s.id === form.societyId) ?? null;
  const digits = form.phone.replace(/\D/g, '');
  const hasPhone = digits.length > 0;

  // Rows a resident left completely blank are ignored; every row that carries
  // any detail must at least have a plate.
  const cleanedCars = form.cars.filter(c => c.plate.trim() || c.make.trim() || c.model.trim());
  const hasTwoWheeler = cleanedCars.some(c => c.category === 'two-wheeler');
  const hadTwoWheeler = (initial?.cars ?? []).some(c => c.category === 'two-wheeler');
  const baseFee = tierPricing
    ? tierPricing[form.tier]
    : Math.max(0, (initial?.monthlyFee ?? configMonthlyFee ?? 500) - (hadTwoWheeler ? twoWheelerFee : 0));
  const monthlyFee = baseFee + (hasTwoWheeler ? twoWheelerFee : 0);

  // Admin add/edit is data entry for a resident who may never open the app, so
  // a name, a full address (society + tower + flat) and at least one plate are
  // all mandatory — a record without them is unusable on the ground.
  const requirementsMet =
    Boolean(form.name.trim() && form.societyId && form.tower && form.unitNumber.trim())
    && cleanedCars.length > 0
    && cleanedCars.every(c => c.plate.trim())
    && (!hasPhone || digits.length === 10);

  function updateCar(i: number, patch: Partial<CarRow>) {
    setForm(f => ({ ...f, cars: f.cars.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));
  }
  function addCar() {
    setForm(f => ({ ...f, cars: [...f.cars, { plate: '', make: '', model: '', category: 'car' }] }));
  }
  function removeCar(i: number) {
    setForm(f => ({ ...f, cars: f.cars.length > 1 ? f.cars.filter((_, idx) => idx !== i) : f.cars }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || (hasPhone && digits.length !== 10) || !form.societyId || !form.tower
        || !form.unitNumber.trim() || saving || cleanedCars.length === 0
        || cleanedCars.some(c => !c.plate.trim())) {
      setError('Name, society, tower, unit number and at least one vehicle plate are required. Phone, if given, must be 10 digits.');
      return;
    }
    setError(''); setSaving(true);

    const cars = cleanedCars.map(c => ({
      plate:    c.plate.trim().toUpperCase(),
      make:     c.make.trim(),
      model:    c.model.trim(),
      category: c.category,
    }));

    try {
      // Contact number is stored in +91 form; the identity key (customerId) is
      // fixed at creation and never re-derived from it on edit, so editing the
      // phone only changes contact info, not the record's identity.
      const phone       = hasPhone ? `+91${digits}` : '';
      const identity    = hasPhone ? digits : form.unitNumber.trim().toUpperCase().replace(/\s+/g, '');
      const customerId  = initial?.customerId ?? `admin_${identity}`;
      const newRecordId = `${customerId}_${form.societyId}_${form.tower}`;

      const configSnap = await getDocs(query(
        collection(db, 'societyBillingConfig'),
        where('societyId', '==', form.societyId),
        where('tower', '==', form.tower),
      ));
      const billingConfig    = configSnap.docs[0]?.data();
      const tierPricingCfg   = billingConfig?.tierPricing as { normal: number; premium: number; ultra: number } | undefined;
      const twoWheelerFeeCfg = (billingConfig?.twoWheelerFee as number | undefined) ?? 0;
      const cleaningSchedule = (billingConfig?.cleaningSchedule as string | undefined) ?? 'Mon, Wed, Fri · 9:00 AM';

      // Fee follows the vehicles: the tier car fee (or, when this tower has no
      // tiers, whatever the resident was already paying minus any prior
      // two-wheeler charge) plus a flat two-wheeler fee when one is registered.
      const carFee     = tierPricingCfg ? tierPricingCfg[form.tier] : undefined;
      const baseFeeCfg = carFee
        ?? (initial
            ? Math.max(0, (initial.monthlyFee ?? 500) - (hadTwoWheeler ? twoWheelerFeeCfg : 0))
            : (billingConfig?.monthlyFee as number | undefined) ?? 500);
      const fee = baseFeeCfg + (cars.some(c => c.category === 'two-wheeler') ? twoWheelerFeeCfg : 0);

      const fields = {
        customerName:          form.name.trim(),
        ...(phone ? { customerPhone: phone } : {}),
        societyId:             form.societyId,
        societyName:           form.societyName,
        tower:                 form.tower,
        unitNumber:            form.unitNumber.trim(),
        parkingNumber:         form.parkingNumber.trim(),
        parkingLevel:          form.parkingLevel,
        cars,
        preferredCleaningTime: form.preferredTime,
        preferredCleaningDays: form.preferredDays,
        ...(tierPricingCfg ? { tier: form.tier } : {}),
        monthlyFee:            fee,
        paymentMethod:         form.paymentMethod,
        paymentNotes:          form.paymentNotes.trim(),
        updatedAt:             serverTimestamp(),
      };

      if (isEdit && initial) {
        const moved = newRecordId !== initial.id;
        if (moved) {
          const clash = await getDoc(doc(db, 'customerSocietyRecords', newRecordId));
          if (clash.exists()) {
            setError('This customer is already enrolled in that tower.');
            setSaving(false);
            return;
          }
        }

        const oldCarCount = initial.cars?.length ?? 0;
        const newCarCount = cars.length;

        if (moved) {
          // The doc id embeds society+tower, so a move recreates the record
          // under its new key (preserving everything else) instead of leaving
          // a doc whose id and fields disagree.
          const rest: Record<string, unknown> = { ...initial };
          delete rest.id;
          await setDoc(doc(db, 'customerSocietyRecords', newRecordId), { ...rest, ...fields });
          await deleteDoc(doc(db, 'customerSocietyRecords', initial.id));
        } else {
          await updateDoc(doc(db, 'customerSocietyRecords', initial.id), fields);
        }

        // Keep the society roster counters honest: a move shifts a resident
        // between two societies; an in-place edit only moves the car count.
        if (initial.status === 'active') {
          if (moved) {
            updateDoc(doc(db, 'societies', initial.societyId), {
              activeResidents: increment(-1),
              vehicleCount:    increment(-oldCarCount),
            }).catch(err => console.warn('[CustomerForm] society counter update failed:', err));
            updateDoc(doc(db, 'societies', form.societyId), {
              activeResidents: increment(1),
              vehicleCount:    increment(newCarCount),
            }).catch(err => console.warn('[CustomerForm] society counter update failed:', err));
          } else if (oldCarCount !== newCarCount) {
            updateDoc(doc(db, 'societies', form.societyId), {
              vehicleCount: increment(newCarCount - oldCarCount),
            }).catch(err => console.warn('[CustomerForm] society counter update failed:', err));
          }
        }

        // Reflect the edit on any already-generated future session for this
        // tower — best-effort, the record is already saved either way.
        try {
          const token = await auth.currentUser?.getIdToken();
          if (token) {
            const res = await fetch('/api/admin/resync-sessions', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body:    JSON.stringify({
                recordId:  newRecordId,
                societyId: form.societyId,
                tower:     form.tower,
                customerId,
                ...(moved ? { previous: { societyId: initial.societyId, tower: initial.tower } } : {}),
              }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              console.warn('[CustomerForm] session resync failed:', data.error);
            }
          }
        } catch (err: unknown) {
          console.warn('[CustomerForm] session resync failed:', err instanceof Error ? err.message : err);
        }
      } else {
        // Add: a resident who won't self-sign-up, keyed by tower + unit (or
        // phone) since they may never have an account.
        const existing = await getDoc(doc(db, 'customerSocietyRecords', newRecordId));
        if (existing.exists()) {
          setError(hasPhone ? 'This phone number is already enrolled in this tower.' : 'This unit is already enrolled in this tower.');
          setSaving(false);
          return;
        }

        await setDoc(doc(db, 'customerSocietyRecords', newRecordId), {
          customerId,
          ...fields,
          signupSource:     'bulk_import',
          status:           'active',
          billingFrequency: (billingConfig?.billingFrequency as CustomerSocietyRecord['billingFrequency']) ?? 'monthly',
          deepCleanEnabled: false,
          deepCleanAvailable: !!billingConfig?.deepClean,
          deepCleanFrequency: billingConfig?.deepClean?.frequency ?? 'weekly',
          nextBillingDate:  Timestamp.fromDate(firstOfNextMonth()),
          paymentStatus:    form.paymentMethod ? 'verified' : 'not_verified',
          skipDates:        [],
          rescheduledSlots: [],
          createdAt:        serverTimestamp(),
        });

        updateDoc(doc(db, 'societies', form.societyId), {
          activeResidents: increment(1),
          vehicleCount:    increment(cars.length),
        }).catch(err => console.warn('[CustomerForm] society counter update failed:', err));

        // Best-effort, and only possible when we actually have a number —
        // often the only notification a non-app resident ever gets.
        if (hasPhone) {
          const nextWeekDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          notifyApproval(phone, form.name.trim(), form.societyName, form.tower, cleaningSchedule, nextWeekDate)
            .catch(err => console.warn('[CustomerForm] approval SMS failed:', err));
        }
      }

      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--pc-ink-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--pc-card)', borderRadius: 16, border: '1px solid var(--pc-line)', padding: 'clamp(16px,5vw,28px)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, fontWeight: 400, color: 'var(--pc-fg)', margin: '0 0 6px' }}>
          {isEdit ? 'Edit customer' : 'Add customer'}
        </h2>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 20px', lineHeight: 1.5 }}>
          {isEdit
            ? 'Change this resident’s society, tower, flat and parking, or add, edit and remove their vehicles.'
            : 'For a resident who won’t self-sign-up — added straight to Active, no app account needed.'}
        </p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={e => e.preventDefault()}>
          <div>
            <p style={monoLabel}>Full name *</p>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Resident's name" style={inputStyle} autoFocus />
          </div>

          <div>
            <p style={monoLabel}>Mobile number (optional)</p>
            <div style={{ display: 'flex' }}>
              <span style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontFamily: 'var(--pc-mono)', fontSize: 13, color: 'var(--pc-fg-3)' }}>+91</span>
              <input
                type="tel" inputMode="numeric" maxLength={10} value={digits}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                placeholder="Leave blank if unknown" style={{ ...inputStyle, borderRadius: '0 8px 8px 0', flex: 1 }}
              />
            </div>
            {!hasPhone && (
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-4)', margin: '6px 0 0' }}>
                No approval SMS will be sent without a number — the resident can add one later from their profile.
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={monoLabel}>Society *</p>
              <select
                value={form.societyId} style={{ ...inputStyle, cursor: 'pointer' }}
                onChange={e => {
                  const s = societies.find(x => x.id === e.target.value);
                  setForm(f => ({ ...f, societyId: s?.id ?? '', societyName: s?.name ?? '', tower: '' }));
                }}
              >
                <option value="">Select society…</option>
                {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <p style={monoLabel}>Tower *</p>
              <select
                value={form.tower} disabled={!selectedSociety}
                onChange={e => setForm(f => ({ ...f, tower: e.target.value }))}
                style={{ ...inputStyle, cursor: selectedSociety ? 'pointer' : 'not-allowed', opacity: selectedSociety ? 1 : 0.5 }}
              >
                <option value="">Select tower…</option>
                {(selectedSociety?.towers ?? []).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={monoLabel}>Unit / flat number *</p>
              <input
                value={form.unitNumber} onChange={e => setForm(f => ({ ...f, unitNumber: e.target.value }))}
                placeholder="e.g. B-1204" style={inputStyle}
              />
            </div>
            <div>
              <p style={monoLabel}>Parking / spot no.</p>
              <input
                value={form.parkingNumber} onChange={e => setForm(f => ({ ...f, parkingNumber: e.target.value }))}
                placeholder="e.g. P-42 (optional)" style={inputStyle}
              />
            </div>
          </div>
          {towerParkingLevels.length > 0 && (
            <div>
              <p style={monoLabel}>Parking level</p>
              <select
                value={form.parkingLevel} style={{ ...inputStyle, cursor: 'pointer' }}
                onChange={e => setForm(f => ({ ...f, parkingLevel: e.target.value }))}
              >
                <option value="">Not specified…</option>
                {towerParkingLevels.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
          )}
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-4)', margin: '-8px 0 0' }}>
            Where the car actually lives — this is what the worker uses to find it.
          </p>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ ...monoLabel, margin: 0 }}>Vehicles</p>
              <button
                type="button" onClick={addCar}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, background: 'transparent', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-2)', cursor: 'pointer' }}
              >
                <Icon name="plus" size={12} color="var(--pc-fg-2)" /> Add vehicle
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.cars.map((car, i) => (
                <div key={i} style={{ background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['car', 'two-wheeler'] as VehicleCategory[]).map(cat => {
                        const selected = car.category === cat;
                        const twoWheelerBlocked = cat === 'two-wheeler' && !isEdit && twoWheelerFee === 0;
                        return (
                          <button
                            key={cat} type="button" disabled={twoWheelerBlocked}
                            onClick={() => updateCar(i, { category: cat })}
                            title={twoWheelerBlocked ? 'This tower has no two-wheeler pricing set' : undefined}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999,
                              background: selected ? 'var(--pc-sage)' : 'transparent',
                              border: `1px solid ${selected ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                              fontFamily: 'var(--pc-sans)', fontSize: 12,
                              color: selected ? 'var(--pc-sage-ink)' : 'var(--pc-fg-3)',
                              cursor: twoWheelerBlocked ? 'not-allowed' : 'pointer', opacity: twoWheelerBlocked ? 0.5 : 1,
                            }}
                          >
                            <Icon name={cat === 'two-wheeler' ? 'bike' : 'car'} size={12} color={selected ? 'var(--pc-sage-ink)' : 'var(--pc-fg-3)'} />
                            {cat === 'two-wheeler' ? 'Two-wheeler' : 'Car'}
                          </button>
                        );
                      })}
                    </div>
                    {form.cars.length > 1 && (
                      <button
                        type="button" aria-label="Remove vehicle" onClick={() => removeCar(i)}
                        style={{ display: 'inline-flex', alignItems: 'center', padding: 6, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        <Icon name="trash-2" size={14} color="var(--pc-danger)" />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                    <div>
                      <p style={monoLabel}>Plate *</p>
                      <input value={car.plate} onChange={e => updateCar(i, { plate: e.target.value })} placeholder={car.category === 'two-wheeler' ? 'DL 01 AB 5678' : 'DL 01 AB 1234'} style={inputStyle} />
                    </div>
                    <div>
                      <p style={monoLabel}>Make</p>
                      <input value={car.make} onChange={e => updateCar(i, { make: e.target.value })} placeholder={car.category === 'two-wheeler' ? 'Honda, TVS…' : 'Maruti, Honda…'} style={inputStyle} />
                    </div>
                    <div>
                      <p style={monoLabel}>Model</p>
                      <input value={car.model} onChange={e => updateCar(i, { model: e.target.value })} placeholder={car.category === 'two-wheeler' ? 'Activa, Jupiter…' : 'Swift, City…'} style={inputStyle} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {twoWheelerFee === 0 && !isEdit && (
              <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-4)', margin: '8px 0 0' }}>
                This tower has no two-wheeler pricing set, so only cars can be added.
              </p>
            )}
          </div>

          {tierPricing && (
            <div>
              <p style={monoLabel}>Tier</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {([
                  { key: 'normal' as const,  label: 'Normal' },
                  { key: 'premium' as const, label: 'Premium' },
                  { key: 'ultra' as const,   label: 'Ultra' },
                ]).map(({ key, label }) => {
                  const selected = form.tier === key;
                  return (
                    <button key={key} type="button" onClick={() => setForm(f => ({ ...f, tier: key }))} style={{
                      padding: '10px 8px', borderRadius: 8, textAlign: 'center',
                      background: selected ? 'var(--pc-sage)' : 'var(--pc-card-hi)',
                      border: `1px solid ${selected ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                      cursor: 'pointer',
                    }}>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 600, color: selected ? 'var(--pc-sage-ink)' : 'var(--pc-fg)', margin: '0 0 2px' }}>
                        {label}
                      </p>
                      <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 11, color: selected ? 'var(--pc-sage-ink)' : 'var(--pc-fg-3)', margin: 0 }}>
                        ₹{tierPricing[key].toLocaleString('en-IN')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {towerDays.length > 0 && (
            <div>
              <p style={monoLabel}>Cleaning days (this tower)</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DAY_ORDER.filter(d => towerDays.includes(d)).map(day => {
                  const selected = form.preferredDays.includes(day);
                  return (
                    <button key={day} type="button" onClick={() => setForm(f => {
                      const next = selected ? f.preferredDays.filter(d => d !== day) : [...f.preferredDays, day];
                      return { ...f, preferredDays: next.length > 0 ? next : f.preferredDays };
                    })} style={{
                      padding: '8px 14px', borderRadius: 8,
                      background: selected ? 'var(--pc-sage)' : 'var(--pc-card-hi)',
                      border: `1px solid ${selected ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                      fontFamily: 'var(--pc-sans)', fontSize: 13,
                      color: selected ? 'var(--pc-sage-ink)' : 'var(--pc-fg-3)', cursor: 'pointer',
                    }}>
                      {DAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p style={monoLabel}>Preferred cleaning time</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
              {TIME_OPTIONS.map(opt => {
                const selected = form.preferredTime === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, preferredTime: opt.value }))} style={{
                    padding: '8px 0', borderRadius: 8, textAlign: 'center',
                    background: selected ? 'var(--pc-sage)' : 'var(--pc-card-hi)',
                    border: `1px solid ${selected ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                    fontFamily: 'var(--pc-sans)', fontSize: 12,
                    color: selected ? 'var(--pc-sage-ink)' : 'var(--pc-fg-3)', cursor: 'pointer',
                  }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={monoLabel}>Payment method</p>
              <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Not collected yet</option>
                <option value="phone">Phone Payment</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <p style={monoLabel}>Payment notes</p>
              <input value={form.paymentNotes} onChange={e => setForm(f => ({ ...f, paymentNotes: e.target.value }))} placeholder="Optional" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--pc-line)' }}>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pc-fg-3)' }}>Monthly fee</span>
            <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, color: 'var(--pc-fg)' }}>₹{monthlyFee.toLocaleString('en-IN')}</span>
          </div>

          {!requirementsMet && (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-4)', margin: 0 }}>
              Name, society, tower, flat / unit number, and at least one vehicle plate are required.
            </p>
          )}

          {error && <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button" onClick={handleSubmit} disabled={saving || !requirementsMet}
              style={{ flex: 1, padding: '11px 0', borderRadius: 999, background: 'var(--pc-warm)', border: 'none', fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-ink)', cursor: (saving || !requirementsMet) ? 'not-allowed' : 'pointer', opacity: (saving || !requirementsMet) ? 0.6 : 1 }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add & Activate'}
            </button>
            <button type="button" onClick={onClose} style={{ padding: '11px 20px', borderRadius: 999, background: 'transparent', border: '1px solid currentColor', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Helpers for schedule modal ───────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getUpcomingDates(dayIndices: number[], n: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let scanned = 0; dates.length < n && scanned < 400; scanned++) {
    if (dayIndices.includes(cursor.getDay())) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function toDate(v: unknown): Date {
  if (!v) return new Date();
  const maybe = v as { toDate?: () => Date };
  return typeof maybe.toDate === 'function' ? maybe.toDate() : new Date(v as string | number | Date);
}

// ─── Schedule modal — manage skip dates & permanent time ──────────────────────

interface RescheduledSlot {
  date: Date;
  fromTime: number;
  toTime: number;
}

function ScheduleModal({
  record,
  onClose,
}: {
  record: LiveRecord;
  onClose: () => void;
}) {
  const [towerDays, setTowerDays] = useState<DayOfWeek[]>([]);
  const [skipDates, setSkipDates] = useState<Date[]>(
    (record.skipDates ?? []).map(toDate)
  );
  const [rescheduledSlots, setRescheduledSlots] = useState<RescheduledSlot[]>(
    ((record.rescheduledSlots ?? []) as (Omit<RescheduledSlot, 'date'> & { date: unknown })[]).map(s => ({
      ...s,
      date: toDate(s.date),
    }))
  );
  const [permanentTime, setPermanentTime] = useState<number>(
    record.permanentTime ?? record.preferredCleaningTime ?? 9
  );
  const [saving, setSaving] = useState(false);
  const [reschedulingDate, setReschedulingDate] = useState<string | null>(null);

  useEffect(() => {
    getDocs(query(
      collection(db, 'societyBillingConfig'),
      where('societyId', '==', record.societyId),
      where('tower', '==', record.tower),
    )).then(snap => {
      const config = snap.docs[0]?.data();
      const days = (config?.cleaningDays as DayOfWeek[] | undefined)?.length
        ? (config!.cleaningDays as DayOfWeek[])
        : parseDaysFromSchedule((config?.cleaningSchedule as string | undefined) ?? '');
      setTowerDays(days);
    }).catch(() => {});
  }, [record.societyId, record.tower]);

  const preferredDays = record.preferredCleaningDays?.length
    ? record.preferredCleaningDays
    : towerDays;

  const upcomingDates = preferredDays.length > 0
    ? getUpcomingDates(preferredDays, 8)
    : [];

  function getRescheduleForDate(date: Date): RescheduledSlot | undefined {
    return rescheduledSlots.find(s => isSameDay(s.date, date));
  }

  function getEffectiveTime(date: Date): number {
    const rescheduled = getRescheduleForDate(date);
    if (rescheduled) return rescheduled.toTime;
    return permanentTime;
  }

  function dateKey(date: Date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  async function handleToggleSkip(date: Date) {
    setSaving(true);
    const alreadySkipped = skipDates.some(d => isSameDay(d, date));
    const updated = alreadySkipped
      ? skipDates.filter(d => !isSameDay(d, date))
      : [...skipDates, date];
    setSkipDates(updated);
    try {
      await setDoc(
        doc(db, 'customerSocietyRecords', record.id),
        { skipDates: updated.map(d => Timestamp.fromDate(d)), updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (err: unknown) {
      console.error('[ScheduleModal] toggle skip failed:', err);
      setSkipDates(skipDates);
    } finally {
      setSaving(false);
    }
  }

  async function handleReschedule(date: Date, toTime: number) {
    const existing = getRescheduleForDate(date);
    const updated = existing
      ? rescheduledSlots.map(s => isSameDay(s.date, date) ? { ...s, toTime } : s)
      : [...rescheduledSlots, { date, fromTime: permanentTime, toTime }];
    setRescheduledSlots(updated);
    setReschedulingDate(null);
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'customerSocietyRecords', record.id),
        {
          rescheduledSlots: updated.map(s => ({
            date: Timestamp.fromDate(s.date),
            fromTime: s.fromTime,
            toTime: s.toTime,
          })),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err: unknown) {
      console.error('[ScheduleModal] reschedule failed:', err);
      setRescheduledSlots(rescheduledSlots);
    } finally {
      setSaving(false);
    }
  }

  async function handleClearReschedule(date: Date) {
    const updated = rescheduledSlots.filter(s => !isSameDay(s.date, date));
    setRescheduledSlots(updated);
    setReschedulingDate(null);
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'customerSocietyRecords', record.id),
        {
          rescheduledSlots: updated.map(s => ({
            date: Timestamp.fromDate(s.date),
            fromTime: s.fromTime,
            toTime: s.toTime,
          })),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err: unknown) {
      console.error('[ScheduleModal] clear reschedule failed:', err);
      setRescheduledSlots(rescheduledSlots);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTime(hour: number) {
    setPermanentTime(hour);
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'customerSocietyRecords', record.id),
        { permanentTime: hour, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (err: unknown) {
      console.error('[ScheduleModal] save time failed:', err);
      setPermanentTime(record.permanentTime ?? record.preferredCleaningTime ?? 9);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--pc-ink-scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--pc-card)', borderRadius: 16, border: '1px solid var(--pc-line)', padding: 'clamp(16px,5vw,28px)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, fontWeight: 400, color: 'var(--pc-fg)', margin: '0 0 4px' }}>
          Schedule: {record.customerName ?? record.customerId.slice(0, 8)}
        </h2>
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: '0 0 20px' }}>
          {record.societyName} · {record.tower} · {record.unitNumber}
        </p>

        {/* Upcoming cleanings */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-3)', margin: '0 0 12px' }}>
            UPCOMING CLEANINGS
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {upcomingDates.map((date, i) => {
              const isSkipped = skipDates.some(d => isSameDay(d, date));
              const rescheduled = getRescheduleForDate(date);
              const effectiveTime = getEffectiveTime(date);
              const isRescheduling = reschedulingDate === dateKey(date);
              return (
                <div key={i}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px',
                    background: isSkipped ? 'var(--pc-ink-raised)' : 'var(--pc-card-hi)',
                    border: `1px solid ${isSkipped ? 'var(--pc-line-faint)' : rescheduled ? 'var(--pc-warning)' : 'var(--pc-line)'}`,
                    borderRadius: 8,
                    opacity: isSkipped ? 0.65 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: isSkipped ? 'var(--pc-fg-4)' : 'var(--pc-fg)', textDecoration: isSkipped ? 'line-through' : 'none' }}>
                        {formatDateShort(date)}
                      </span>
                      <span style={{
                        fontFamily: 'var(--pc-mono)', fontSize: 10,
                        color: rescheduled ? 'var(--pc-warning)' : 'var(--pc-fg-4)',
                        textDecoration: rescheduled ? 'line-through' : 'none',
                        marginRight: rescheduled ? 4 : 0,
                      }}>
                        {formatSlotTime(permanentTime)}
                      </span>
                      {rescheduled && (
                        <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-warning)' }}>
                          → {formatSlotTime(effectiveTime)}
                        </span>
                      )}
                      {isSkipped && (
                        <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--pc-fg-4)', textTransform: 'uppercase' }}>
                          Skipped
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setReschedulingDate(isRescheduling ? null : dateKey(date))}
                        style={{
                          padding: '4px 10px', borderRadius: 999,
                          border: '1px solid var(--pc-info)',
                          background: isRescheduling ? 'var(--pc-info)' : 'transparent',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--pc-sans)', fontSize: 11,
                          color: isRescheduling ? 'white' : 'var(--pc-info)',
                          opacity: saving ? 0.5 : 1,
                        }}
                      >
                        {rescheduled ? 'Change' : 'Time'}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleToggleSkip(date)}
                        style={{
                          padding: '4px 12px', borderRadius: 999,
                          border: '1px solid currentColor', background: 'transparent',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--pc-sans)', fontSize: 11,
                          color: isSkipped ? 'var(--pc-sage-hi)' : 'var(--pc-fg-3)',
                          opacity: saving ? 0.5 : 1,
                        }}
                      >
                        {isSkipped ? 'Undo' : 'Skip'}
                      </button>
                    </div>
                  </div>
                  {/* Inline time picker for rescheduling */}
                  {isRescheduling && (
                    <div style={{
                      marginTop: 4, padding: '10px 14px',
                      background: 'var(--pc-card)',
                      border: '1px solid var(--pc-line)',
                      borderRadius: 8,
                    }}>
                      <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-4)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Change time for {formatDateShort(date)}
                      </p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {TIME_OPTIONS.filter(opt => opt.value !== effectiveTime).map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleReschedule(date, opt.value)}
                            style={{
                              padding: '6px 12px', borderRadius: 6,
                              background: 'var(--pc-ink-raised)',
                              border: '1px solid var(--pc-line)',
                              fontFamily: 'var(--pc-sans)', fontSize: 12,
                              color: 'var(--pc-fg-2)',
                              cursor: 'pointer',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {rescheduled && (
                        <button
                          type="button"
                          onClick={() => handleClearReschedule(date)}
                          style={{
                            marginTop: 8, padding: '4px 12px', borderRadius: 6,
                            background: 'transparent',
                            border: '1px solid var(--pc-danger)',
                            fontFamily: 'var(--pc-sans)', fontSize: 11,
                            color: 'var(--pc-danger)',
                            cursor: 'pointer',
                          }}
                        >
                          Reset to default time
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setReschedulingDate(null)}
                        style={{
                          marginTop: 8, marginLeft: 8, padding: '4px 12px', borderRadius: 6,
                          background: 'transparent',
                          border: '1px solid var(--pc-line)',
                          fontFamily: 'var(--pc-sans)', fontSize: 11,
                          color: 'var(--pc-fg-3)',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11.5, color: 'var(--pc-fg-4)', margin: '8px 0 0' }}>
            {skipDates.length} skip{skipDates.length !== 1 ? 's' : ''},
            {rescheduledSlots.length} reschedule{rescheduledSlots.length !== 1 ? 's' : ''}.
            {skipDates.length < upcomingDates.length && ` ${upcomingDates.length - skipDates.length} cleaning${upcomingDates.length - skipDates.length !== 1 ? 's' : ''} active.`}
          </p>
        </section>

        {/* Time preference */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-3)', margin: '0 0 12px' }}>
            PERMANENT TIME PREFERENCE
          </p>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', margin: '0 0 12px' }}>
            Overrides the tower default. Changes apply from the next session.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
            {TIME_OPTIONS.map(opt => {
              const selected = permanentTime === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveTime(opt.value)}
                  style={{
                    padding: '8px 0', borderRadius: 8, textAlign: 'center',
                    background: selected ? 'var(--pc-sage)' : 'var(--pc-card-hi)',
                    border: `1px solid ${selected ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                    fontFamily: 'var(--pc-sans)', fontSize: 12,
                    color: selected ? 'var(--pc-sage-ink)' : 'var(--pc-fg-3)',
                    cursor: saving ? 'default' : 'pointer',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 24px', borderRadius: 999,
              background: 'var(--pc-warm)', border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
              color: 'var(--pc-ink)', cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerEnrollmentsPage() {
  const [records, setRecords] = useState<LiveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [cleanedThisMonth, setCleanedThisMonth] = useState<Record<string, number>>({});
  const [billingConfigs, setBillingConfigs] = useState<Record<string, SocietyBillingConfig>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<LiveRecord | null>(null);
  const [scheduleRecord, setScheduleRecord] = useState<LiveRecord | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'customerSocietyRecords')),
      snap => {
        setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveRecord)));
        setLoading(false);
      },
      err => {
        console.warn('[CustomerEnrollments]', err.message);
        setLoading(false);
      }
    );
  }, []);

  // Cars cleaned this month, per customer — the number an admin actually
  // wants when checking whether enrolled residents are being served.
  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'cleaningLogs'), where('cleanedAt', '>=', monthStart())),
      snap => {
        const counts: Record<string, number> = {};
        snap.docs.forEach(d => {
          const cid = d.data().customerId as string | undefined;
          if (!cid) return;
          counts[cid] = (counts[cid] ?? 0) + 1;
        });
        setCleanedThisMonth(counts);
      },
      err => console.warn('[CustomerEnrollments] cleaningLogs listener:', err.message),
    );
  }, []);

  // Tower pricing keyed by society+tower — lets each row show the tier and the
  // two-wheeler fee that make up the resident's monthly fee, without a
  // per-row query.
  useEffect(() => {
    getDocs(collection(db, 'societyBillingConfig'))
      .then(snap => {
        const map: Record<string, SocietyBillingConfig> = {};
        snap.docs.forEach(d => {
          const cfg = d.data() as SocietyBillingConfig;
          map[`${cfg.societyId}__${cfg.tower}`] = cfg;
        });
        setBillingConfigs(map);
      })
      .catch(() => {});
  }, []);

  async function handleMarkAsPaid(id: string) {
    try {
      await setDoc(
        doc(db, 'customerSocietyRecords', id),
        {
          paymentStatus: 'paid',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setMarkingPaidId(null);
    } catch (err: unknown) {
      console.error('[CustomerEnrollments] mark paid failed:', err instanceof Error ? err.message : err);
    }
  }

  async function handleToggleStatus(record: LiveRecord) {
    const nextStatus = record.status === 'active' ? 'paused' : 'active';
    try {
      await setDoc(
        doc(db, 'customerSocietyRecords', record.id),
        {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Pausing/reactivating changes how many cars the society's worker
      // roster is actually cleaning — keep the society-level counters in step.
      const carCount = record.cars?.length ?? 1;
      const delta = nextStatus === 'active' ? carCount : -carCount;
      updateDoc(doc(db, 'societies', record.societyId), {
        activeResidents: increment(delta),
        vehicleCount:    increment(delta),
      }).catch(err => console.warn('[CustomerEnrollments] society counter update failed:', err));
    } catch (err: unknown) {
      console.error('[CustomerEnrollments] toggle status failed:', err instanceof Error ? err.message : err);
    }
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
    setConfirmRemoveOpen(false);
    setRemoveError('');
  }

  function toggleSelected(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleRemoveSelected() {
    const toRemove = records.filter(r => selectedIds.has(r.id));
    if (toRemove.length === 0) return;
    setRemoving(true);
    setRemoveError('');
    try {
      const results = await Promise.allSettled(
        toRemove.map(r => deleteDoc(doc(db, 'customerSocietyRecords', r.id))),
      );
      const deleted = toRemove.filter((_, i) => results[i].status === 'fulfilled');

      // Only active records count towards the society roster — paused ones
      // were already subtracted when they were paused.
      const perSociety: Record<string, { residents: number; vehicles: number }> = {};
      deleted.forEach(r => {
        if (r.status !== 'active') return;
        const s = (perSociety[r.societyId] ??= { residents: 0, vehicles: 0 });
        s.residents += 1;
        s.vehicles += r.cars?.length ?? 1;
      });
      Object.entries(perSociety).forEach(([societyId, s]) => {
        updateDoc(doc(db, 'societies', societyId), {
          activeResidents: increment(-s.residents),
          vehicleCount:    increment(-s.vehicles),
        }).catch(err => console.warn('[CustomerEnrollments] society counter update failed:', err));
      });

      const failed = toRemove.length - deleted.length;
      if (failed > 0) {
        setSelectedIds(new Set(toRemove.filter((_, i) => results[i].status === 'rejected').map(r => r.id)));
        setRemoveError(`${failed} customer${failed !== 1 ? 's' : ''} could not be removed. Try again.`);
      } else {
        exitSelectMode();
      }
    } finally {
      setRemoving(false);
    }
  }

  const filtered = records.filter(r => {
    if (filterStatus !== 'all' && r.paymentStatus !== filterStatus) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.societyName.toLowerCase().includes(q) ||
      r.tower.toLowerCase().includes(q) ||
      r.customerId.toLowerCase().includes(q) ||
      (r.customerName ?? '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: records.length,
    verified: records.filter(r => r.paymentStatus === 'verified').length,
    pending: records.filter(r => r.paymentStatus === 'pending_payment').length,
    paid: records.filter(r => r.paymentStatus === 'paid').length,
  };

  return (
    <div className="admin-page-root">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 4 }}>CUSTOMERS</Eyebrow>
          <h1 className="admin-page-title">Active Enrollments</h1>
          <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-3)', margin: '8px 0 0' }}>
            View all enrolled customers, track payment status, and manage monthly billing
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {selectMode ? (
            <>
              <button
                type="button"
                onClick={exitSelectMode}
                style={{
                  padding: '10px 20px', borderRadius: 999,
                  background: 'transparent', border: '1px solid var(--pc-line)',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => setConfirmRemoveOpen(true)}
                style={{
                  padding: '10px 20px', borderRadius: 999,
                  background: 'transparent', border: '1px solid var(--pc-danger)',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                  color: 'var(--pc-danger)',
                  cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedIds.size === 0 ? 0.5 : 1,
                }}
              >
                Remove selected ({selectedIds.size})
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelectMode(true)}
                disabled={loading || records.length === 0}
                style={{
                  padding: '10px 20px', borderRadius: 999,
                  background: 'transparent', border: '1px solid var(--pc-line)',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', cursor: 'pointer',
                }}
              >
                Remove customers
              </button>
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
                Add customer
              </button>
            </>
          )}
        </div>
      </div>
      {removeError && (
        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', margin: 0 }}>{removeError}</p>
      )}

      {/* Stats */}
      <div className="kpi-grid-4">
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
            <Icon name="users" size={18} color="var(--pc-info)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.total}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              TOTAL ENROLLED
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
              {loading ? '—' : stats.paid}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              PAID
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
            <Icon name="clock" size={18} color="var(--pc-info)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.verified}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              VERIFIED
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
            <Icon name="alert-circle" size={18} color="var(--pc-warning)" />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 22, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
              {loading ? '—' : stats.pending}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>
              PENDING PAYMENT
            </p>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="enrollment-search-row" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
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
            placeholder="Search by society, tower, or customer ID…"
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

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'verified', 'pending_payment', 'paid'].map(status => (
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
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 18, color: 'var(--pc-fg)', margin: '0 0 8px' }}>
              No enrollments found
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0 }}>
              Customers will appear here once they’re approved.
            </p>
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
                  {selectMode && (
                    <th style={{ padding: '13px 0 13px 18px', width: 24 }}>
                      <input
                        type="checkbox"
                        aria-label="Select all shown customers"
                        checked={filtered.length > 0 && filtered.every(r => selectedIds.has(r.id))}
                        onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(r => r.id)) : new Set())}
                        style={{ cursor: 'pointer', accentColor: 'var(--pc-sage)' }}
                      />
                    </th>
                  )}
                  {['Customer', 'Society', 'Tower', 'Car', 'Plan', 'Cleaned (mo.)', 'Status', 'Payment', 'Next Billing', 'Action'].map(h => (
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
                {filtered.map((record, idx) => (
                  <tr key={record.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--pc-line)' : 'none' }}>
                    {selectMode && (
                      <td style={{ padding: '13px 0 13px 18px', width: 24 }}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${record.customerName ?? record.customerId}`}
                          checked={selectedIds.has(record.id)}
                          onChange={() => toggleSelected(record.id)}
                          style={{ cursor: 'pointer', accentColor: 'var(--pc-sage)' }}
                        />
                      </td>
                    )}
                    <td style={{ padding: '13px 18px' }}>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, color: 'var(--pc-fg)', margin: 0 }}>
                        {record.customerName ?? '—'}
                      </p>
                      <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-4)', margin: '2px 0 0' }}>
                        {record.customerId.slice(0, 8)}
                      </p>
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {record.societyName}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', margin: 0 }}>{record.tower}</p>
                      {record.unitNumber && (
                        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10.5, color: 'var(--pc-fg-4)', margin: '2px 0 0', letterSpacing: '0.03em' }}>{record.unitNumber}</p>
                      )}
                      {(record.parkingLevel || record.parkingNumber) && (
                        <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10.5, color: 'var(--pc-fg-4)', margin: '2px 0 0', letterSpacing: '0.03em' }}>
                          {[record.parkingLevel, record.parkingNumber].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {record.cars?.length ? record.cars.map((c, ci) => (
                          <span key={ci} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-2)' }}>
                            <Icon name={c.category === 'two-wheeler' ? 'bike' : 'car'} size={11} color="var(--pc-fg-3)" />
                            {c.plate || '—'}
                          </span>
                        )) : (
                          <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-4)' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      {(() => {
                        const twoWheelers = (record.cars ?? []).filter(c => c.category === 'two-wheeler').length;
                        const cfg = billingConfigs[`${record.societyId}__${record.tower}`];
                        const twoWheelerFee = cfg?.twoWheelerFee ?? 0;
                        const per = record.billingFrequency === 'per-day' ? '/clean' : record.billingFrequency === 'one-time' ? 'one-time' : '/mo';
                        return (
                          <div>
                            {record.tier && (
                              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: 'color-mix(in srgb, var(--pc-sage) 14%, transparent)', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-mono)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pc-sage-hi)' }}>
                                {record.tier}
                              </span>
                            )}
                            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-fg)', margin: record.tier ? '4px 0 0' : 0 }}>
                              ₹{(record.monthlyFee ?? 0).toLocaleString('en-IN')}
                              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, fontWeight: 400, color: 'var(--pc-fg-4)' }}> {per}</span>
                            </p>
                            {twoWheelers > 0 && (
                              <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-3)', margin: '3px 0 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                <Icon name="bike" size={10} color="var(--pc-fg-3)" />
                                {twoWheelers}× 2-wheeler{twoWheelerFee > 0 ? ` ₹${twoWheelerFee}` : ''}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: cleanedThisMonth[record.customerId] ? 'var(--pc-sage-hi)' : 'var(--pc-fg-4)' }}>
                      {cleanedThisMonth[record.customerId] ?? 0}
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <StatusPill status={ENROLLMENT_STATUS_LABEL[record.status] ?? record.status} />
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <PaymentStatusBadge status={record.paymentStatus} />
                    </td>
                    <td style={{ padding: '13px 18px', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>
                      {(typeof (record.nextBillingDate as unknown as { toDate?: unknown }).toDate === 'function'
        ? (record.nextBillingDate as unknown as { toDate: () => Date }).toDate()
        : new Date(record.nextBillingDate as string | number | Date)
      ).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setEditRecord(record)}
                          title="Edit address & vehicles"
                          style={{
                            display: 'inline-flex', alignItems: 'center', padding: '5px 8px',
                            borderRadius: 6, background: 'transparent', border: '1px solid var(--pc-line)',
                            color: 'var(--pc-fg-2)', cursor: 'pointer',
                          }}
                        >
                          <Icon name="pencil" size={12} color="var(--pc-fg-2)" />
                        </button>
                        {record.status === 'pending' && (
                          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-4)' }}>
                            See Pending Approvals
                          </span>
                        )}
                        {record.paymentStatus === 'pending_payment' && (
                          <button
                            type="button"
                            onClick={() => setMarkingPaidId(record.id)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: 'var(--pc-sage)',
                              border: 'none',
                              fontFamily: 'var(--pc-sans)',
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--pc-sage-ink)',
                              cursor: 'pointer',
                            }}
                          >
                            Mark Paid
                          </button>
                        )}
                        {record.paymentStatus === 'paid' && (
                          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-sage)', fontWeight: 600 }}>
                            ✓ Paid
                          </span>
                        )}
                        {record.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => setScheduleRecord(record)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: 'color-mix(in srgb, var(--pc-info) 12%, transparent)',
                              border: '1px solid var(--pc-info)',
                              fontFamily: 'var(--pc-sans)',
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--pc-info)',
                              cursor: 'pointer',
                            }}
                          >
                            Schedule
                          </button>
                        )}
                        {(record.status === 'active' || record.status === 'paused') && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(record)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: 'transparent',
                              border: `1px solid ${record.status === 'active' ? 'var(--pc-warning)' : 'var(--pc-sage-hi)'}`,
                              fontFamily: 'var(--pc-sans)',
                              fontSize: 11,
                              fontWeight: 600,
                              color: record.status === 'active' ? 'var(--pc-warning)' : 'var(--pc-sage-hi)',
                              cursor: 'pointer',
                            }}
                          >
                            {record.status === 'active' ? 'Pause' : 'Resume'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmation Modal */}
      {markingPaidId && (
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
          onClick={() => setMarkingPaidId(null)}
        >
          <div
            style={{
              background: 'var(--pc-card)',
              borderRadius: 16,
              border: '1px solid var(--pc-line)',
              padding: 'clamp(16px,5vw,28px)',
              width: '100%',
              maxWidth: 360,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, fontWeight: 400, color: 'var(--pc-fg)', margin: '0 0 12px' }}>
              Mark Payment Received
            </h2>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Record payment for this customer’s monthly enrollment?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => markingPaidId && handleMarkAsPaid(markingPaidId)}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 999,
                  background: 'var(--pc-sage)',
                  border: 'none',
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--pc-sage-ink)',
                  cursor: 'pointer',
                }}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setMarkingPaidId(null)}
                style={{
                  flex: 1,
                  padding: '11px 0',
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
          </div>
        </div>
      )}

      {/* Remove confirmation modal */}
      {confirmRemoveOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200, background: 'var(--pc-ink-scrim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={() => !removing && setConfirmRemoveOpen(false)}
        >
          <div
            style={{
              background: 'var(--pc-card)', borderRadius: 16, border: '1px solid var(--pc-line)',
              padding: 'clamp(16px,5vw,28px)', width: '100%', maxWidth: 380,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 20, fontWeight: 400, color: 'var(--pc-fg)', margin: '0 0 12px' }}>
              Remove {selectedIds.size} customer{selectedIds.size !== 1 ? 's' : ''}
            </h2>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg-2)', margin: '0 0 20px', lineHeight: 1.5 }}>
              This permanently deletes their enrollment and stops all future cleanings and billing. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                disabled={removing}
                onClick={handleRemoveSelected}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 999,
                  background: 'var(--pc-danger)', border: 'none',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
                  color: '#fff', cursor: removing ? 'wait' : 'pointer', opacity: removing ? 0.7 : 1,
                }}
              >
                {removing ? 'Removing…' : 'Remove'}
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={() => setConfirmRemoveOpen(false)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 999,
                  background: 'transparent', border: '1px solid currentColor',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit customer modal */}
      {addOpen && (
        <CustomerFormModal
          onClose={() => setAddOpen(false)}
          onSaved={() => setAddOpen(false)}
        />
      )}
      {editRecord && (
        <CustomerFormModal
          initial={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={() => setEditRecord(null)}
        />
      )}

      {/* Schedule modal */}
      {scheduleRecord && (
        <ScheduleModal
          record={scheduleRecord}
          onClose={() => setScheduleRecord(null)}
        />
      )}
    </div>
  );
}
