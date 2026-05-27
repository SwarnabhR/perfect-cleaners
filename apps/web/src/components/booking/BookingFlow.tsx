'use client';

import { useState } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import { submitBooking } from '@/lib/firebase/booking';
import styles from './BookingFlow.module.css';

// ─── Static data ──────────────────────────────────────────────────────────────

const PLATFORM_FEE = 50;

const SERVICES = [
  { id: 'exterior-wash',   name: 'Exterior Wash',   price: 800,   desc: 'Foam cannon + hand wash + ceramic rinse aid' },
  { id: 'premium-wash',    name: 'Premium Wash',     price: 1200,  desc: 'Full exterior + tire dressing + interior wipe' },
  { id: 'interior-detail', name: 'Interior Detail',  price: 2500,  desc: 'Deep vacuum + steam clean + leather wipe' },
  { id: 'full-detail',     name: 'Full Detail',      price: 3500,  desc: 'Complete interior + exterior + engine bay' },
  { id: 'ceramic-coating', name: 'Ceramic Coating',  price: 15000, desc: '3-year hydrophobic nano-ceramic protection' },
  { id: 'ppf',             name: 'Paint Protection', price: 22000, desc: 'Self-healing PPF film on high-wear panels' },
];

const TIMES = ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM'];

const CITIES = ['Delhi', 'Noida', 'Gurgaon', 'Ghaziabad', 'Faridabad'];

const BRANDS = [
  'Audi', 'BMW', 'Ferrari', 'Honda', 'Hyundai', 'Kia',
  'Mahindra', 'Maruti Suzuki', 'Mercedes-Benz', 'MG', 'Tata',
  'Toyota', 'Volkswagen', 'Volvo',
];

// Calendar constants
const CAL_DAY_LABELS  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CAL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

interface DateOption {
  id: string;
  dayName: string;   // 'Mon'
  dayNum: number;    // 28
  monthName: string; // 'May'
  fullDate: Date;
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildUpcomingDates(count = 5): DateOption[] {
  const base = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + 1 + i);
    const fullDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return {
      id: `d${i}`,
      dayName:   DAY_SHORT[d.getDay()],
      dayNum:    d.getDate(),
      monthName: MON_SHORT[d.getMonth()],
      fullDate,
    };
  });
}

function buildScheduledAt(dateOpt: DateOption, timeStr: string): Date {
  const [timePart, meridiem] = timeStr.split(' ');
  let [h, m] = timePart.split(':').map(Number);
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  const { fullDate: fd } = dateOpt;
  return new Date(fd.getFullYear(), fd.getMonth(), fd.getDate(), h, m, 0, 0);
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface FieldErrors {
  address?: string;
  pincode?: string;
  model?:   string;
  name?:    string;
  phone?:   string;
}

function validate(fields: {
  address: string; pincode: string;
  model: string; name: string; phone: string;
}): FieldErrors {
  const e: FieldErrors = {};
  if (!fields.address.trim())                                          e.address = 'Address is required.';
  if (!/^\d{6}$/.test(fields.pincode))                                e.pincode = 'Enter a valid 6-digit pincode.';
  if (!fields.model.trim())                                            e.model   = 'Vehicle model is required.';
  if (!fields.name.trim())                                             e.name    = 'Name is required.';
  if (!/^[6-9]\d{9}$/.test(fields.phone.replace(/\D/g, '')))         e.phone   = 'Enter a valid 10-digit mobile number.';
  return e;
}

// ─── Calendar picker sub-component ───────────────────────────────────────────

function CalendarPicker({
  year, month, onPrev, onNext,
  selected, onSelect,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const todayStart = (() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  })();

  const firstDow   = new Date(year, month, 1).getDay();
  const daysInMo   = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMo; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const navBtn: React.CSSProperties = {
    width: 28, height: 28, borderRadius: 7,
    border: '1px solid var(--pc-line-strong)',
    background: 'transparent', color: 'var(--pc-fg-2)',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };

  return (
    <div style={{
      background: 'var(--pc-ink-raised)',
      border: '1px solid var(--pc-line-strong)',
      borderRadius: 14,
      padding: '18px 18px 14px',
      width: 292,
      boxShadow: 'var(--pc-shadow-pop)',
    }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button type="button" onClick={onPrev} style={navBtn} aria-label="Previous month">
          <svg width="7" height="11" viewBox="0 0 7 12" fill="none">
            <path d="M6 1L1 6l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{
          fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600,
          color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-snug)',
        }}>
          {CAL_MONTH_NAMES[month]} {year}
        </span>
        <button type="button" onClick={onNext} style={navBtn} aria-label="Next month">
          <svg width="7" height="11" viewBox="0 0 7 12" fill="none">
            <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day-of-week header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
        {CAL_DAY_LABELS.map(l => (
          <div key={l} style={{
            textAlign: 'center',
            fontFamily: 'var(--pc-mono)', fontSize: 9,
            color: 'var(--pc-fg-3)', letterSpacing: 'var(--pc-track-mono)',
            paddingBottom: 6,
          }}>{l}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const cellDate = new Date(year, month, day);
          const isPast   = cellDate <= todayStart;
          const isSel    = selected != null &&
            selected.getFullYear() === year &&
            selected.getMonth()    === month &&
            selected.getDate()     === day;
          const isToday  = cellDate.getTime() === todayStart.getTime();

          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => !isPast && onSelect(cellDate)}
              style={{
                padding: '6px 2px',
                borderRadius: 6,
                border: 'none',
                background: isSel
                  ? 'rgba(91,111,82,0.85)'
                  : isToday
                  ? 'rgba(91,111,82,0.15)'
                  : 'transparent',
                color: isPast
                  ? 'var(--pc-fg-4)'
                  : isSel
                  ? '#fff'
                  : isToday
                  ? 'var(--pc-sage-ink)'
                  : 'var(--pc-fg)',
                fontFamily: 'var(--pc-sans)', fontSize: 13,
                fontWeight: (isSel || isToday) ? 600 : 400,
                cursor: isPast ? 'default' : 'pointer',
                textAlign: 'center',
                position: 'relative',
                transition: 'background 80ms',
              }}
            >
              {day}
              {isToday && !isSel && (
                <span style={{
                  position: 'absolute', bottom: 1, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 3, height: 3, borderRadius: '50%',
                  background: 'var(--pc-sage-hi)', display: 'block',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step label & field error ─────────────────────────────────────────────────

function StepLabel({ n, children }: { n: string; children: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'var(--pc-card)', border: '1px solid var(--pc-line-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', flexShrink: 0,
      }}>{n}</div>
      <h3 style={{
        fontFamily: 'var(--pc-sans)', fontSize: 16, fontWeight: 600,
        color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-snug)',
      }}>{children}</h3>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p style={{
      fontFamily: 'var(--pc-sans)', fontSize: 12,
      color: 'var(--pc-danger)', marginTop: 5,
    }}>{msg}</p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingFlow() {
  // Date / time
  const [dates]           = useState<DateOption[]>(buildUpcomingDates);
  const [selDate, setSelDate] = useState<DateOption>(() => buildUpcomingDates()[0]);
  const [selTime, setSelTime] = useState(TIMES[0]);

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear,  setCalYear]  = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  // Service
  const [service, setService] = useState(SERVICES[0]);

  // Location + vehicle
  const [city,    setCity]    = useState(CITIES[0]);
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [brand,   setBrand]   = useState(BRANDS[4]); // Hyundai default
  const [model,   setModel]   = useState('');

  // Contact
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');

  // UI
  const [errors,       setErrors]       = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result,       setResult]       = useState<{ bookingRef: string } | null>(null);
  const [submitError,  setSubmitError]  = useState('');

  const total = service.price + PLATFORM_FEE;

  // ── Calendar helpers ─────────────────────────────────────────────────────────
  function prevCalMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextCalMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }
  function handleCustomDate(d: Date) {
    setSelDate({
      id:        'custom',
      dayName:   DAY_SHORT[d.getDay()],
      dayNum:    d.getDate(),
      monthName: MON_SHORT[d.getMonth()],
      fullDate:  d,
    });
    setShowCalendar(false);
  }

  // ── Form submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const errs = validate({ address, pincode, model, name, phone });
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      document.querySelector('[data-error-anchor]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const scheduledAt = buildScheduledAt(selDate, selTime);
      const res = await submitBooking({
        serviceId:    service.id,
        serviceName:  service.name,
        price:        service.price,
        platformFee:  PLATFORM_FEE,
        scheduledAt,
        city,
        pincode,
        addressLine1: address,
        vehicleMake:  brand,
        vehicleModel: model,
        customerName: name,
        customerPhone: phone.replace(/\D/g, ''),
      });
      setResult({ bookingRef: res.bookingRef });
    } catch (err) {
      console.error('[BookingFlow] submitBooking error:', err);
      setSubmitError('Something went wrong. Please try again or call us at +91 98765 43210.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Success screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '80px 24px 120px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(91,111,82,0.18)', border: '1px solid rgba(91,111,82,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
               stroke="var(--pc-sage-hi)" strokeWidth="2.5"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>

        <Eyebrow style={{ marginBottom: 10, display: 'block' }}>
          [CONFIRMED] · {result.bookingRef}
        </Eyebrow>
        <h2 style={{
          fontFamily: 'var(--pc-serif)', fontSize: 38,
          color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)',
          lineHeight: 1.05, marginBottom: 16,
        }}>Booking confirmed.</h2>
        <p style={{
          fontFamily: 'var(--pc-sans)', fontSize: 15,
          color: 'var(--pc-fg-2)', lineHeight: 1.6,
          marginBottom: 40, maxWidth: 380, margin: '0 auto 40px',
        }}>
          <strong style={{ color: 'var(--pc-fg)' }}>{service.name}</strong> · ₹{total.toLocaleString('en-IN')} ·{' '}
          {selDate.dayName} {selDate.dayNum} {selDate.monthName} at {selTime}.
          {' '}We'll confirm via WhatsApp on{' '}
          <strong style={{ color: 'var(--pc-fg)' }}>+91 {phone}</strong>.
        </p>

        <Card style={{ padding: 20, textAlign: 'left', marginBottom: 28 }}>
          {[
            ['Booking ref',  result.bookingRef],
            ['Service',      service.name],
            ['Scheduled',    `${selDate.dayName} ${selDate.dayNum} ${selDate.monthName} · ${selTime}`],
            ['Vehicle',      `${brand} ${model}`],
            ['Location',     `${address}, ${city} – ${pincode}`],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '10px 0', borderBottom: '1px solid var(--pc-line)', gap: 16,
            }}>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', letterSpacing: 'var(--pc-track-mono)', textTransform: 'uppercase', flexShrink: 0, paddingTop: 1 }}>{k}</span>
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', textAlign: 'right' }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14 }}>
            <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', letterSpacing: 'var(--pc-track-mono)', textTransform: 'uppercase' }}>Total paid</span>
            <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 26, color: 'var(--pc-fg)' }}>₹{total.toLocaleString('en-IN')}</span>
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <PrimaryButton onClick={() => window.location.reload()} style={{ padding: '14px 28px' }}>
            Book Another →
          </PrimaryButton>
          <GhostButton onClick={() => window.location.href = '/'} style={{ padding: '13px 28px' }}>
            Back to Home
          </GhostButton>
        </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth: 1040,
      margin: '0 auto',
      padding: '72px 40px 120px',
      display: 'flex',
      gap: 56,
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    }}>

      {/* ── Left: form steps ── */}
      <div style={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 48 }}>

        {/* Step 1 — Service */}
        <section>
          <StepLabel n="01">Select Service</StepLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {SERVICES.map(s => {
              const active = service.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setService(s)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `1px solid ${active ? 'rgba(91,111,82,0.55)' : 'var(--pc-line)'}`,
                    background: active ? 'rgba(58,77,54,0.35)' : 'var(--pc-card)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 120ms, background 120ms',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500,
                    color: active ? 'var(--pc-sage-ink)' : 'var(--pc-fg)',
                    marginBottom: 4,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8,
                  }}>
                    <span>{s.name}</span>
                    <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: active ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)' }}>
                      ₹{s.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--pc-sans)', fontSize: 12,
                    color: active ? 'rgba(232,237,227,0.7)' : 'var(--pc-fg-3)',
                    lineHeight: 1.45,
                  }}>{s.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2 — Date & Time */}
        <section>
          <StepLabel n="02">Select Date & Time</StepLabel>

          {/* Date pills + custom date picker */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>

              {/* Quick-pick date pills (next 5 days) */}
              {dates.map(d => {
                const active = selDate.id === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => { setSelDate(d); setShowCalendar(false); }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: `1px solid ${active ? 'rgba(91,111,82,0.55)' : 'var(--pc-line)'}`,
                      background: active ? 'rgba(58,77,54,0.35)' : 'var(--pc-card)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      minWidth: 60,
                      transition: 'border-color 120ms, background 120ms',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: active ? 'var(--pc-sage-ink)' : 'var(--pc-fg-3)', letterSpacing: 'var(--pc-track-mono)', marginBottom: 3 }}>
                      {d.monthName.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 17, fontWeight: 600, color: active ? 'var(--pc-sage-ink)' : 'var(--pc-fg)', lineHeight: 1 }}>
                      {d.dayNum}
                    </div>
                    <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: active ? 'rgba(232,237,227,0.7)' : 'var(--pc-fg-3)', marginTop: 2 }}>
                      {d.dayName}
                    </div>
                  </button>
                );
              })}

              {/* Pick a specific date */}
              <button
                type="button"
                onClick={() => setShowCalendar(v => !v)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${
                    selDate.id === 'custom'
                      ? 'rgba(91,111,82,0.55)'
                      : showCalendar
                      ? 'var(--pc-line-strong)'
                      : 'var(--pc-line)'
                  }`,
                  background: selDate.id === 'custom'
                    ? 'rgba(58,77,54,0.35)'
                    : showCalendar
                    ? 'var(--pc-card-hi)'
                    : 'var(--pc-card)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  minWidth: 60,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  transition: 'border-color 120ms, background 120ms',
                }}
                title="Choose a specific date"
              >
                {selDate.id === 'custom' ? (
                  <>
                    <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-sage-ink)', letterSpacing: 'var(--pc-track-mono)' }}>
                      {selDate.monthName.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 17, fontWeight: 600, color: 'var(--pc-sage-ink)', lineHeight: 1 }}>
                      {selDate.dayNum}
                    </div>
                    <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'rgba(232,237,227,0.7)' }}>
                      {selDate.dayName}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Calendar icon */}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                         stroke={showCalendar ? 'var(--pc-fg-2)' : 'var(--pc-fg-3)'}
                         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: showCalendar ? 'var(--pc-fg-2)' : 'var(--pc-fg-3)', lineHeight: 1.2 }}>
                      Pick<br/>date
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Calendar dropdown */}
            {showCalendar && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                zIndex: 30,
              }}>
                <CalendarPicker
                  year={calYear}
                  month={calMonth}
                  onPrev={prevCalMonth}
                  onNext={nextCalMonth}
                  selected={selDate.id === 'custom' ? selDate.fullDate : null}
                  onSelect={handleCustomDate}
                />
              </div>
            )}
          </div>

          {/* Time chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TIMES.map(t => {
              const active = selTime === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelTime(t)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: `1px solid ${active ? 'rgba(91,111,82,0.55)' : 'var(--pc-line)'}`,
                    background: active ? 'rgba(58,77,54,0.35)' : 'var(--pc-card)',
                    fontFamily: 'var(--pc-mono)', fontSize: 12,
                    color: active ? 'var(--pc-sage-ink)' : 'var(--pc-fg-2)',
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'border-color 120ms, background 120ms',
                  }}
                >{t}</button>
              );
            })}
          </div>
        </section>

        {/* Step 3 — Location & Vehicle */}
        <section data-error-anchor>
          <StepLabel n="03">Location & Vehicle</StepLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* City + Pincode */}
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className={`${styles.input} ${styles.select}`}
                style={{ flex: 1 }}
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ flex: 1 }}>
                <input
                  placeholder="Pincode"
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  maxLength={6}
                  inputMode="numeric"
                  className={`${styles.input}${errors.pincode ? ` ${styles.inputError}` : ''}`}
                />
                <FieldError msg={errors.pincode} />
              </div>
            </div>

            {/* Address */}
            <div>
              <input
                placeholder="Full address (flat / house no., street, locality)"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className={`${styles.input}${errors.address ? ` ${styles.inputError}` : ''}`}
              />
              <FieldError msg={errors.address} />
            </div>

            {/* Brand + Model */}
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className={`${styles.input} ${styles.select}`}
                style={{ flex: 1 }}
              >
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <div style={{ flex: 1 }}>
                <input
                  placeholder="Model (e.g. Nexon, Creta)"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className={`${styles.input}${errors.model ? ` ${styles.inputError}` : ''}`}
                />
                <FieldError msg={errors.model} />
              </div>
            </div>
          </div>
        </section>

        {/* Step 4 — Contact */}
        <section>
          <StepLabel n="04">Contact Details</StepLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <input
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`${styles.input}${errors.name ? ` ${styles.inputError}` : ''}`}
              />
              <FieldError msg={errors.name} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-3)',
                  pointerEvents: 'none',
                }}>+91</span>
                <input
                  placeholder="98765 43210"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  maxLength={10}
                  inputMode="tel"
                  className={`${styles.input}${errors.phone ? ` ${styles.inputError}` : ''}`}
                  style={{ paddingLeft: 42 }}
                />
              </div>
              <FieldError msg={errors.phone} />
            </div>
          </div>
        </section>
      </div>

      {/* ── Right: sticky summary ── */}
      <div style={{ flex: '0 0 300px', minWidth: 260 }}>
        <div style={{ position: 'sticky', top: 100 }}>
          <Card style={{ padding: 24 }}>
            <Eyebrow style={{ marginBottom: 20, display: 'block' }}>
              Booking Summary
            </Eyebrow>

            {/* Service */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, color: 'var(--pc-fg)', fontWeight: 500 }}>
                {service.name}
              </span>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 13, color: 'var(--pc-fg)' }}>
                ₹{service.price.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)' }}>Platform fee</span>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-fg-2)' }}>₹{PLATFORM_FEE}</span>
            </div>

            {/* Divider + Total */}
            <div style={{
              borderTop: '1px solid var(--pc-line)',
              marginTop: 16, paddingTop: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 8,
            }}>
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 15, fontWeight: 600, color: 'var(--pc-fg)' }}>
                Total
              </span>
              <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 28, color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)' }}>
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Slot summary */}
            <div style={{
              background: 'var(--pc-card-hi)', borderRadius: 8, padding: '10px 12px', marginBottom: 20,
            }}>
              <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', letterSpacing: 'var(--pc-track-mono)', marginBottom: 4 }}>
                SLOT
              </div>
              <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)' }}>
                {selDate.dayName} {selDate.dayNum} {selDate.monthName} · {selTime}
              </div>
            </div>

            {/* Submit */}
            {submitError && (
              <p style={{
                fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-danger)',
                marginBottom: 12, lineHeight: 1.5,
              }}>{submitError}</p>
            )}
            <PrimaryButton
              full
              disabled={isSubmitting}
              onClick={handleSubmit}
              style={{
                padding: '15px 0',
                fontSize: 14,
                opacity: isSubmitting ? 0.65 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Confirming…' : 'Confirm Booking →'}
            </PrimaryButton>

            <p style={{
              fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)',
              marginTop: 12, textAlign: 'center', lineHeight: 1.5,
            }}>
              Payment collected on arrival · Free cancellation up to 2 hrs before slot
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
