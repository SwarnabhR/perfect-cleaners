'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Eyebrow from '@/components/ui/Eyebrow';
import Card from '@/components/ui/Card';
import CustomSelect from '@/components/ui/CustomSelect';
import type { VehicleType } from '@pc/firebase';
import { db } from '@pc/firebase';
import { getDocs, getDoc, collection, query, where, limit, onSnapshot, doc } from 'firebase/firestore';
import AuthBottomSheet from '@/components/auth/AuthBottomSheet';
import { useCustomerAuth } from '@/lib/auth/CustomerAuthContext';
import SlideToConfirm from '@/components/ui/SlideToConfirm';

function loadRazorpay(): Promise<any> {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) { resolve((window as any).Razorpay); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve((window as any).Razorpay);
    document.body.appendChild(s);
  });
}
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
  // Indian / India-market brands
  'Datsun', 'Force Motors', 'Hindustan Motors', 'Isuzu', 'Kia',
  'Mahindra', 'Maruti Suzuki', 'MG', 'OLA Electric', 'Tata',
  // Global mass-market (sold / sold in India)
  'Chevrolet', 'Citroën', 'Fiat', 'Ford', 'Honda', 'Hyundai',
  'Jeep', 'Nissan', 'Renault', 'Skoda', 'Toyota', 'Volkswagen',
  // Premium / near-luxury
  'Audi', 'BMW', 'BYD', 'Haval', 'Lexus', 'MINI', 'Volvo',
  // Ultra-luxury & exotic
  'Aston Martin', 'Bentley', 'Ferrari', 'Jaguar', 'Lamborghini',
  'Land Rover', 'Maserati', 'McLaren', 'Mercedes-Benz',
  'Porsche', 'Rolls-Royce',
].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })).concat(['Other']);

const VEHICLE_TYPES: { label: string; value: VehicleType }[] = [
  { label: 'Hatchback',        value: 'hatchback' },
  { label: 'Sedan',            value: 'sedan'     },
  { label: 'SUV / Crossover',  value: 'suv'       },
  { label: 'Luxury / Sports',  value: 'luxury'    },
  { label: 'Van / MPV',        value: 'van'       },
  { label: 'Pickup Truck',     value: 'pickup'    },
];
const VEHICLE_TYPE_LABELS = VEHICLE_TYPES.map(t => t.label);

// Calendar constants
const CAL_DAY_LABELS  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CAL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

interface DateOption {
  id: string;
  dayName: string;
  dayNum: number;
  monthName: string;
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
  societyId?: string;
  flatNo?:    string;
  model?:     string;
  plate?:     string;
  name?:      string;
  phone?:     string;
}

function validate(fields: {
  societyId: string; flatNo: string;
  model: string; plate: string; name: string; phone: string;
}): FieldErrors {
  const e: FieldErrors = {};
  if (!fields.societyId)                                         e.societyId = 'Please select your society.';
  if (!fields.flatNo.trim())                                     e.flatNo    = 'Flat number is required.';
  if (!fields.model.trim())                                      e.model     = 'Vehicle model is required.';
  if (fields.plate.replace(/\s/g, '').length < 5)               e.plate     = 'Enter a valid number plate.';
  if (!fields.name.trim())                                       e.name      = 'Name is required.';
  if (!/^[6-9]\d{9}$/.test(fields.phone.replace(/\D/g, '')))   e.phone     = 'Enter a valid 10-digit mobile number.';
  return e;
}

// ─── Calendar picker ──────────────────────────────────────────────────────────

function CalendarPicker({
  year, month, onPrev, onNext, selected, onSelect,
}: {
  year: number; month: number;
  onPrev: () => void; onNext: () => void;
  selected: Date | null; onSelect: (d: Date) => void;
}) {
  const todayStart = (() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  })();

  const firstDow  = new Date(year, month, 1).getDay();
  const daysInMo  = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMo; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const navBtn: React.CSSProperties = {
    width: 28, height: 28,
    borderRadius: 'var(--pc-radius-sm)',
    border: '1px solid var(--pc-line-strong)',
    background: 'transparent',
    color: 'var(--pc-fg-2)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };

  return (
    <div style={{
      background: 'var(--pc-ink-raised)',
      border: '1px solid var(--pc-line-strong)',
      borderRadius: 'var(--pc-radius-md)',
      padding: 'var(--pc-space-5) var(--pc-space-5) var(--pc-space-4)',
      width: 292,
      boxShadow: 'var(--pc-shadow-pop)',
    }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--pc-space-4)' }}>
        <button type="button" onClick={onPrev} style={navBtn} aria-label="Previous month">
          <svg width="7" height="11" viewBox="0 0 7 12" fill="none">
            <path d="M6 1L1 6l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{
          fontFamily: 'var(--pc-sans)',
          fontSize: 'var(--pc-text-sm)',
          fontWeight: 600,
          color: 'var(--pc-fg)',
          letterSpacing: 'var(--pc-track-snug)',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 'var(--pc-space-2)' }}>
        {CAL_DAY_LABELS.map(l => (
          <div key={l} style={{
            textAlign: 'center',
            fontFamily: 'var(--pc-mono)',
            fontSize: 'var(--pc-text-xs)',
            color: 'var(--pc-fg-3)',
            letterSpacing: 'var(--pc-track-mono)',
            paddingBottom: 'var(--pc-space-2)',
          }}>{l}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--pc-space-1)' }}>
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
                padding: 'var(--pc-space-2) var(--pc-space-1)',
                borderRadius: 'var(--pc-radius-sm)',
                border: 'none',
                background: isSel
                  ? 'var(--pc-sage-active)'
                  : isToday
                  ? 'var(--pc-sage-subtle)'
                  : 'transparent',
                color: isPast
                  ? 'var(--pc-fg-4)'
                  : isSel
                  ? 'var(--pc-sage-on-tint)'
                  : isToday
                  ? 'var(--pc-sage-on-tint)'
                  : 'var(--pc-fg)',
                fontFamily: 'var(--pc-sans)',
                fontSize: 'var(--pc-text-sm)',
                fontWeight: (isSel || isToday) ? 600 : 400,
                cursor: isPast ? 'default' : 'pointer',
                textAlign: 'center',
                position: 'relative',
                transition: 'background var(--pc-dur-fast) var(--pc-ease)',
              }}
            >
              {day}
              {isToday && !isSel && (
                <span style={{
                  position: 'absolute', bottom: 'var(--pc-space-1)', left: '50%',
                  transform: 'translateX(-50%)',
                  width: 3, height: 3, borderRadius: 'var(--pc-radius-pill)',
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-3)', marginBottom: 'var(--pc-space-5)' }}>
      <span style={{
        fontFamily: 'var(--pc-mono)',
        fontSize: 10,
        letterSpacing: '0.1em',
        color: 'var(--pc-fg-3)',
        flexShrink: 0,
      }}>
        [{n}]
      </span>
      <h2 style={{
        fontFamily: 'var(--pc-sans)',
        fontSize: 'var(--pc-text-base)',
        fontWeight: 600,
        color: 'var(--pc-fg)',
        letterSpacing: 'var(--pc-track-snug)',
        margin: 0,
      }}>
        {children}
      </h2>
      <div style={{ flex: 1, height: 1, background: 'var(--pc-line)' }} />
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p style={{
      fontFamily: 'var(--pc-sans)',
      fontSize: 'var(--pc-text-xs)',
      color: 'var(--pc-danger)',
      marginTop: 'var(--pc-space-1)',
    }}>{msg}</p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingFlow() {
  const router = useRouter();
  const { user, profileName } = useCustomerAuth();
  const [authSheetOpen,  setAuthSheetOpen]  = useState(false);
  const [pendingSubmit,  setPendingSubmit]  = useState(false);

  const [dates]               = useState<DateOption[]>(buildUpcomingDates);
  const [selDate, setSelDate] = useState<DateOption>(() => buildUpcomingDates()[0]);
  const [selTime, setSelTime] = useState(TIMES[0]);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calYear,  setCalYear]  = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const calendarRef = useRef<HTMLDivElement>(null);

  const [liveServices, setLiveServices] = useState(SERVICES);
  const [service, setService] = useState(SERVICES[0]);

  // Fetch active services from Firestore; keep hardcoded SERVICES as fallback
  useEffect(() => {
    getDocs(query(collection(db, 'services'), where('isActive', '==', true)))
      .then(snap => {
        if (snap.empty) return;
        const rows = snap.docs.map(d => {
          const s = d.data();
          return { id: d.id, name: s.name as string, price: s.priceMin as number, desc: s.description as string };
        });
        setLiveServices(rows);
        setService(prev => rows.find(r => r.id === prev.id) ?? rows[0]);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [societies,   setSocieties]   = useState<{ id: string; name: string; towers: string[] }[]>([]);
  const [societyId,   setSocietyId]   = useState('');
  const [societyName, setSocietyName] = useState('');
  const [tower,       setTower]       = useState('');
  const [flatNo,      setFlatNo]      = useState('');
  const [garageNo,    setGarageNo]    = useState('');

  useEffect(() => {
    const q = query(collection(db, 'societies'), where('isActive', '==', true));
    return onSnapshot(q, snap => {
      setSocieties(snap.docs.map(d => ({
        id:     d.id,
        name:   d.data().name as string,
        towers: (d.data().towers ?? []) as string[],
      })));
    });
  }, []);
  const [brand,            setBrand]            = useState(BRANDS[4]);
  const [vehicleTypeLabel, setVehicleTypeLabel] = useState(VEHICLE_TYPE_LABELS[0]);
  const [model,            setModel]            = useState('');
  const [plate,            setPlate]            = useState('');

  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Pre-populate contact details from signed-in account
  useEffect(() => {
    if (!user) return;
    if (profileName) setName(profileName);
    const digits = (user.phoneNumber ?? '').replace('+91', '').replace(/\D/g, '');
    if (digits) setPhone(digits);
  }, [user?.uid, profileName]);

  const [errors,       setErrors]       = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result,       setResult]       = useState<{ bookingRef: string; paymentVia: 'razorpay' | 'wallet' } | null>(null);
  const [submitError,  setSubmitError]  = useState('');

  const [promoInput,    setPromoInput]    = useState('');
  const [promoApplied,  setPromoApplied]  = useState<{ promoId: string; code: string; description: string; discount: number } | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet,     setUseWallet]     = useState(false);

  // Fetch wallet balance when user is signed in
  useEffect(() => {
    if (!user) { setWalletBalance(0); setUseWallet(false); return; }
    getDoc(doc(db, 'customers', user.uid)).then(snap => {
      setWalletBalance(snap.exists() ? (snap.data().walletBalance ?? 0) : 0);
    });
  }, [user?.uid]);
  const [promoError,   setPromoError]   = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const gst        = Math.round(service.price * 0.18);
  const total          = service.price + gst + PLATFORM_FEE;
  const discount       = promoApplied?.discount ?? 0;
  const finalTotal     = Math.max(0, total - discount);
  const walletUsed     = useWallet ? Math.min(walletBalance, finalTotal) : 0;
  const payableAmount  = Math.max(0, finalTotal - walletUsed);

  // ─── Outside-click dismiss for calendar popover ───────────────────────────
  useEffect(() => {
    if (!showCalendar) return;
    function handleOutsideClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showCalendar]);

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

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoError(''); setPromoLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'promotions'), where('code', '==', code), limit(1)));
      if (snap.empty) { setPromoError('Promo code not found.'); return; }
      const docSnap = snap.docs[0];
      const p = docSnap.data();
      if (!p.isActive)            { setPromoError('This promo code is no longer active.'); return; }
      if (p.usedCount >= p.maxUses) { setPromoError('This promo code has reached its usage limit.'); return; }
      const now   = new Date();
      const from  = p.validFrom?.toDate  ? p.validFrom.toDate()  : new Date(p.validFrom);
      const until = p.validUntil?.toDate ? p.validUntil.toDate() : new Date(p.validUntil);
      if (now < from)  { setPromoError('This promo code is not yet active.'); return; }
      if (now > until) { setPromoError('This promo code has expired.'); return; }
      if (total < p.minOrderValue) {
        setPromoError(`Minimum order of ₹${(p.minOrderValue as number).toLocaleString('en-IN')} required.`);
        return;
      }
      const discountAmt = p.discountType === 'flat'
        ? (p.discountValue as number)
        : Math.round(total * (p.discountValue as number) / 100);
      setPromoApplied({ promoId: docSnap.id, code, description: p.description, discount: discountAmt });
      setPromoInput('');
    } catch {
      setPromoError('Could not validate promo code. Please try again.');
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleSubmit() {
    const errs = validate({ societyId, flatNo, model, plate, name, phone });
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      document.querySelector('[data-error-anchor]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!user) {
      setPendingSubmit(true);
      setAuthSheetOpen(true);
      return;
    }

    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    const scheduledAt   = buildScheduledAt(selDate, selTime);
    const bookingPayload = {
      serviceId:     service.id,
      serviceName:   service.name,
      price:         service.price,
      platformFee:   PLATFORM_FEE,
      scheduledAt:   scheduledAt.toISOString(),
      societyId,    societyName,
      tower:         tower || null,
      flatNo,        garageNo:   garageNo || null,
      vehicleMake:   brand,      vehicleModel: model,
      vehiclePlate:  plate.toUpperCase(),
      vehicleType:   VEHICLE_TYPES.find(t => t.label === vehicleTypeLabel)?.value ?? 'sedan',
      customerName:  name,
      customerPhone: phone.replace(/\D/g, ''),
      customerId:    user.uid,
      promoCode:     promoApplied?.code,
      promoId:       promoApplied?.promoId,
      promoDiscount: promoApplied?.discount,
    };

    try {
      // Wallet covers everything — no Razorpay needed
      if (payableAmount === 0) {
        const { getIdToken } = await import('firebase/auth');
        const idToken = await getIdToken(user);
        const res = await fetch('/api/payment/wallet-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ booking: bookingPayload, walletUsed }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setResult({ bookingRef: json.bookingRef, paymentVia: 'wallet' });
        setIsSubmitting(false);
        return;
      }

      // Create Razorpay order for payable amount
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payableAmount, receipt: `bk_${Date.now()}` }),
      });
      const { orderId, keyId, error: orderErr } = await orderRes.json();
      if (orderErr || !orderId) throw new Error(orderErr ?? 'Could not create payment order.');

      const RzpCheckout = await loadRazorpay();
      const rzp = new RzpCheckout({
        key:         keyId,
        amount:      Math.round(payableAmount * 100),
        currency:    'INR',
        order_id:    orderId,
        name:        'Perfect Cleaners',
        description: service.name,
        prefill:     { contact: `+91${phone}` },
        theme:       { color: '#4A5E44' },
        modal:       { ondismiss: () => setIsSubmitting(false) },
        // UPI only — shows GPay, PhonePe, Paytm, UPI ID
        method: { upi: 1, card: 0, netbanking: 0, wallet: 0, emi: 0 },
        config: {
          display: {
            blocks: { upi: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] } },
            sequence: ['block.upi'],
            preferences: { show_default_blocks: false },
          },
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                booking:             bookingPayload,
                walletUsed,
              }),
            });
            const json = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(json.error);
            setResult({ bookingRef: json.bookingRef, paymentVia: 'razorpay' });
          } catch (err: any) {
            setSubmitError(err.message ?? 'Payment verified but booking failed. Call us.');
          } finally {
            setIsSubmitting(false);
          }
        },
      });
      rzp.open();
    } catch (err: any) {
      console.error('[BookingFlow]', err);
      setSubmitError(err.message ?? 'Something went wrong. Please try again or call +91 98765 43210.');
      setIsSubmitting(false);
    }
  }

  // ─── Success popup ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(10,9,8,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--pc-ink-raised)',
        border: '1px solid var(--pc-line-strong)',
        borderRadius: 'var(--pc-radius-md)',
        padding: 'var(--pc-space-8) var(--pc-space-6)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 'var(--pc-space-4)', textAlign: 'center',
        maxHeight: '90dvh', overflowY: 'auto',
      }}>
        {/* Check icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(74,94,68,0.15)', border: '1px solid var(--pc-sage-hi)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="var(--pc-sage-hi)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>

        <div>
          <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-sage-hi)', margin: '0 0 6px' }}>
            {result.bookingRef}
          </p>
          <h2 style={{ fontFamily: 'var(--pc-serif)', fontSize: 'clamp(24px, 5vw, 30px)', fontWeight: 400, color: 'var(--pc-fg)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
            Booking confirmed.
          </h2>
        </div>

        {/* Summary rows */}
        <div style={{ width: '100%', borderTop: '1px solid var(--pc-line)', borderBottom: '1px solid var(--pc-line)', padding: 'var(--pc-space-4) 0', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
          {[
            ['Service',   service.name],
            ['Date',      `${selDate.dayName} ${selDate.dayNum} ${selDate.monthName} · ${selTime}`],
            ['Location',  [flatNo && `Flat ${flatNo}`, tower, societyName].filter(Boolean).join(', ')],
            ['Amount due',`₹${finalTotal.toLocaleString('en-IN')}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, color: 'var(--pc-fg-4)', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>{k}</span>
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', lineHeight: 1.6, margin: 0 }}>
          {result.paymentVia === 'razorpay'
            ? 'Payment received via UPI. Our detailer will arrive at the scheduled time.'
            : 'Payment deducted from your PC Wallet. Our detailer will arrive at the scheduled time.'}
        </p>

        {/* CTAs */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={() => router.push('/account')}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 999,
              background: 'var(--pc-warm)', color: 'var(--pc-ink)', border: 'none',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            View Booking →
          </button>
          <button
            type="button"
            onClick={() => router.refresh()}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 999,
              background: 'transparent', color: 'var(--pc-fg-2)',
              border: '1px solid var(--pc-line-strong)',
              fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 500,
              letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Book Another
          </button>
        </div>
      </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────────
  return (
    <>
    <AuthBottomSheet
      open={authSheetOpen}
      onClose={() => { setAuthSheetOpen(false); setPendingSubmit(false); }}
      heading="Sign in to confirm your booking. Takes 10 seconds."
      onSuccess={() => {
        setAuthSheetOpen(false);
        if (pendingSubmit) { setPendingSubmit(false); handleSubmit(); }
      }}
    />

    <div className={styles.layout}>

      {/* ── Left: form steps ── */}
      <div className={styles.formCol}>

        {/* Auth notice — shown when not signed in */}
        {!user && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap',
            padding: 'var(--pc-space-3) var(--pc-space-4)',
            background: 'var(--pc-card)',
            border: '1px solid var(--pc-line-strong)',
            borderRadius: 'var(--pc-radius-md)',
          }}>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)', margin: 0, lineHeight: 1.5 }}>
              Sign in to confirm your booking.
            </p>
            <button
              type="button"
              onClick={() => setAuthSheetOpen(true)}
              style={{
                flexShrink: 0,
                padding: '8px 18px',
                background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                border: 'none', borderRadius: 999,
                fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 600,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Sign in →
            </button>
          </div>
        )}

        {/* Step 1 — Service */}
        <section>
          <StepLabel n="01">Select Service</StepLabel>
          <CustomSelect
            options={liveServices.map(s => `${s.name} — ₹${s.price.toLocaleString('en-IN')}`)}
            value={`${service.name} — ₹${service.price.toLocaleString('en-IN')}`}
            onChange={val => {
              const s = liveServices.find(s => `${s.name} — ₹${s.price.toLocaleString('en-IN')}` === val);
              if (s) setService(s);
            }}
          />
          {service.desc && (
            <p style={{
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)',
              color: 'var(--pc-fg-3)', marginTop: 'var(--pc-space-2)', lineHeight: 1.5,
            }}>
              {service.desc}
            </p>
          )}
        </section>

        {/* Step 2 — Date & Time */}
        <section>
          <StepLabel n="02">Select Date &amp; Time</StepLabel>

          <div ref={calendarRef} style={{ position: 'relative', marginBottom: 'var(--pc-space-4)' }}>
            <div className={styles.dateRow}>

              {/* Quick-pick date pills */}
              {dates.map(d => {
                const active = selDate.id === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => { setSelDate(d); setShowCalendar(false); }}
                    className={styles.selBtn}
                    style={{
                      padding: 'var(--pc-space-2) var(--pc-space-4)',
                      borderRadius: 'var(--pc-radius-sm)',
                      border: `1px solid ${active ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                      background: active ? 'var(--pc-sage-subtle)' : 'var(--pc-card)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      minWidth: 60,
                      transition: 'border-color var(--pc-dur-fast) var(--pc-ease), background var(--pc-dur-fast) var(--pc-ease)',
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--pc-mono)',
                      fontSize: 'var(--pc-text-xs)',
                      color: active ? 'var(--pc-sage-on-tint)' : 'var(--pc-fg-3)',
                      letterSpacing: 'var(--pc-track-mono)',
                      marginBottom: 'var(--pc-space-1)',
                    }}>
                      {d.monthName.toUpperCase()}
                    </div>
                    <div style={{
                      fontFamily: 'var(--pc-sans)',
                      fontSize: 'var(--pc-text-lg)',
                      fontWeight: 600,
                      color: active ? 'var(--pc-sage-on-tint)' : 'var(--pc-fg)',
                      lineHeight: 1,
                    }}>
                      {d.dayNum}
                    </div>
                    <div style={{
                      fontFamily: 'var(--pc-sans)',
                      fontSize: 'var(--pc-text-xs)',
                      color: active ? 'var(--pc-sage-on-tint-2)' : 'var(--pc-fg-3)',
                      marginTop: 'var(--pc-space-1)',
                    }}>
                      {d.dayName}
                    </div>
                  </button>
                );
              })}

              {/* Custom date picker trigger */}
              <button
                type="button"
                onClick={() => setShowCalendar(v => !v)}
                aria-label="Open date picker"
                aria-expanded={showCalendar}
                className={styles.selBtn}
                style={{
                  padding: 'var(--pc-space-2) var(--pc-space-4)',
                  borderRadius: 'var(--pc-radius-sm)',
                  border: `1px solid ${
                    selDate.id === 'custom'
                      ? 'var(--pc-sage-hi)'
                      : showCalendar
                      ? 'var(--pc-line-strong)'
                      : 'var(--pc-line)'
                  }`,
                  background: selDate.id === 'custom'
                    ? 'var(--pc-sage-subtle)'
                    : showCalendar
                    ? 'var(--pc-card-hi)'
                    : 'var(--pc-card)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  minWidth: 60,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--pc-space-1)',
                  transition: 'border-color var(--pc-dur-fast) var(--pc-ease), background var(--pc-dur-fast) var(--pc-ease)',
                }}
                title="Choose a specific date"
              >
                {selDate.id === 'custom' ? (
                  <>
                    <div style={{
                      fontFamily: 'var(--pc-mono)',
                      fontSize: 'var(--pc-text-xs)',
                      color: 'var(--pc-sage-on-tint)',
                      letterSpacing: 'var(--pc-track-mono)',
                    }}>
                      {selDate.monthName.toUpperCase()}
                    </div>
                    <div style={{
                      fontFamily: 'var(--pc-sans)',
                      fontSize: 'var(--pc-text-lg)',
                      fontWeight: 600,
                      color: 'var(--pc-sage-on-tint)',
                      lineHeight: 1,
                    }}>
                      {selDate.dayNum}
                    </div>
                    <div style={{
                      fontFamily: 'var(--pc-sans)',
                      fontSize: 'var(--pc-text-xs)',
                      color: 'var(--pc-sage-on-tint-2)',
                    }}>
                      {selDate.dayName}
                    </div>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                         stroke={showCalendar ? 'var(--pc-fg-2)' : 'var(--pc-fg-3)'}
                         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <div style={{
                      fontFamily: 'var(--pc-sans)',
                      fontSize: 'var(--pc-text-xs)',
                      color: showCalendar ? 'var(--pc-fg-2)' : 'var(--pc-fg-3)',
                      lineHeight: 'var(--pc-lh-snug)',
                    }}>
                      Pick<br/>date
                    </div>
                  </>
                )}
              </button>
            </div>

            {showCalendar && (
              <div style={{ position: 'absolute', top: 'calc(100% + var(--pc-space-2))', left: 0, zIndex: 30 }}>
                <CalendarPicker
                  year={calYear} month={calMonth}
                  onPrev={prevCalMonth} onNext={nextCalMonth}
                  selected={selDate.id === 'custom' ? selDate.fullDate : null}
                  onSelect={handleCustomDate}
                />
              </div>
            )}
          </div>

          {/* Time chips */}
          <div className={styles.timeRow}>
            {TIMES.map(t => {
              const active = selTime === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelTime(t)}
                  className={styles.selBtn}
                  style={{
                    padding: 'var(--pc-space-2) var(--pc-space-4)',
                    borderRadius: 'var(--pc-radius-sm)',
                    border: `1px solid ${active ? 'var(--pc-sage-hi)' : 'var(--pc-line)'}`,
                    background: active ? 'var(--pc-sage-subtle)' : 'var(--pc-card)',
                    fontFamily: 'var(--pc-mono)',
                    fontSize: 'var(--pc-text-xs)',
                    color: active ? 'var(--pc-sage-on-tint)' : 'var(--pc-fg-2)',
                    letterSpacing: 'var(--pc-track-snug)',
                    cursor: 'pointer',
                    transition: 'border-color var(--pc-dur-fast) var(--pc-ease), background var(--pc-dur-fast) var(--pc-ease)',
                  }}
                >{t}</button>
              );
            })}
          </div>
        </section>

        {/* Step 3 — Location & Vehicle */}
        <section data-error-anchor>
          <StepLabel n="03">Location &amp; Vehicle</StepLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>

            {/* Society */}
            <div>
              <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-4)', marginBottom: 10 }}>Society</p>
              <CustomSelect
                options={societies.map(s => s.name)}
                value={societyName}
                placeholder="Select your society…"
                onChange={name => {
                  const s = societies.find(s => s.name === name);
                  setSocietyName(name);
                  setSocietyId(s?.id ?? '');
                  setTower('');
                }}
                error={!!errors.societyId}
              />
              <FieldError msg={errors.societyId} />
              {societies.length === 0 && (
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', marginTop: 6 }}>
                  No societies listed yet — contact us to get yours added.
                </p>
              )}
            </div>

            {/* Tower (only when society has towers) */}
            {societyId && (societies.find(s => s.id === societyId)?.towers.length ?? 0) > 0 && (
              <div>
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-4)', marginBottom: 10 }}>Tower / Block</p>
                <CustomSelect
                  options={societies.find(s => s.id === societyId)?.towers ?? []}
                  value={tower}
                  placeholder="Select tower…"
                  onChange={setTower}
                />
              </div>
            )}

            {/* Flat No + Garage No */}
            <div className={styles.fieldRow}>
              <div style={{ flex: 1 }}>
                <input
                  placeholder="Flat / unit number (e.g. 1204)"
                  value={flatNo}
                  onChange={e => setFlatNo(e.target.value)}
                  className={`${styles.input}${errors.flatNo ? ` ${styles.inputError}` : ''}`}
                />
                <FieldError msg={errors.flatNo} />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  placeholder="Garage no. (optional, e.g. G-42)"
                  value={garageNo}
                  onChange={e => setGarageNo(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Brand */}
            <div>
              <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-4)', marginBottom: 10 }}>Vehicle brand</p>
              <CustomSelect options={BRANDS} value={brand} onChange={setBrand} />
            </div>

            {/* Brand + Type row */}
            <div className={styles.fieldRow}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pc-fg-4)', marginBottom: 10 }}>Vehicle type</p>
                <CustomSelect options={VEHICLE_TYPE_LABELS} value={vehicleTypeLabel} onChange={setVehicleTypeLabel} />
              </div>
            </div>

            {/* Model + Plate */}
            <div className={styles.fieldRow}>
              <div style={{ flex: 1 }}>
                <input
                  placeholder="Model (e.g. Creta, Nexon)"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className={`${styles.input}${errors.model ? ` ${styles.inputError}` : ''}`}
                />
                <FieldError msg={errors.model} />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  placeholder="Number plate (e.g. DL 01 AB 1234)"
                  value={plate}
                  onChange={e => setPlate(e.target.value.toUpperCase())}
                  autoCapitalize="characters"
                  className={`${styles.input}${errors.plate ? ` ${styles.inputError}` : ''}`}
                  style={{ fontFamily: 'var(--pc-mono)', letterSpacing: '0.06em' }}
                />
                <FieldError msg={errors.plate} />
              </div>
            </div>

          </div>
        </section>

        {/* Step 4 — Contact */}
        <section>
          <StepLabel n="04">Your Details</StepLabel>
          {user && (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', marginBottom: 'var(--pc-space-3)' }}>
              Pre-filled from your account.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
            <div>
              <input
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                readOnly={!!user}
                className={`${styles.input}${errors.name ? ` ${styles.inputError}` : ''}`}
                style={user ? { opacity: 0.7, cursor: 'default' } : undefined}
              />
              <FieldError msg={errors.name} />
            </div>
            <div>
              <input
                placeholder="Mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                inputMode="tel"
                maxLength={10}
                readOnly={!!user}
                className={`${styles.input}${errors.phone ? ` ${styles.inputError}` : ''}`}
                style={user ? { opacity: 0.7, cursor: 'default', fontFamily: 'var(--pc-mono)' } : undefined}
              />
              <FieldError msg={errors.phone} />
            </div>
          </div>
        </section>

        {/* Promo code */}
        <section>
          <StepLabel n="05">Promo Code</StepLabel>
          {promoApplied ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--pc-space-3) var(--pc-space-4)',
              background: 'rgba(74,94,68,0.10)', border: '1px solid rgba(74,94,68,0.30)',
              borderRadius: 'var(--pc-radius-md)',
            }}>
              <div>
                <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 12, color: 'var(--pc-sage-hi)', margin: '0 0 2px', letterSpacing: '0.06em' }}>{promoApplied.code}</p>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>
                  {promoApplied.description} · −₹{promoApplied.discount.toLocaleString('en-IN')}
                </p>
              </div>
              <button type="button" onClick={() => setPromoApplied(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-4)', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>
                ×
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Enter promo code"
                value={promoInput}
                onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                onKeyDown={e => e.key === 'Enter' && applyPromo()}
                className={styles.input}
                style={{ flex: 1, fontFamily: 'var(--pc-mono)', letterSpacing: '0.06em' }}
              />
              <button type="button" onClick={applyPromo} disabled={!promoInput.trim() || promoLoading}
                style={{
                  flexShrink: 0, padding: '0 20px', borderRadius: 'var(--pc-radius-sm)',
                  background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line-strong)',
                  color: 'var(--pc-fg-2)', fontFamily: 'var(--pc-sans)', fontSize: 13,
                  fontWeight: 600, cursor: !promoInput.trim() || promoLoading ? 'not-allowed' : 'pointer',
                  opacity: !promoInput.trim() || promoLoading ? 0.5 : 1,
                }}>
                {promoLoading ? '…' : 'Apply'}
              </button>
            </div>
          )}
          {promoError && (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-danger)', margin: 'var(--pc-space-2) 0 0' }}>{promoError}</p>
          )}
          {!promoApplied && !promoError && (
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-4)', margin: 'var(--pc-space-2) 0 0', lineHeight: 1.5 }}>
              Have a discount or referral code? Enter it above to apply a deduction to your order.
            </p>
          )}
        </section>

        {/* Wallet toggle — only shown when user has a balance */}
        {walletBalance > 0 && (
          <section>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--pc-space-4)',
              background: useWallet ? 'rgba(74,94,68,0.10)' : 'var(--pc-card)',
              border: `1px solid ${useWallet ? 'rgba(74,94,68,0.35)' : 'var(--pc-line)'}`,
              borderRadius: 'var(--pc-radius-md)',
              cursor: 'pointer',
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }} onClick={() => setUseWallet(v => !v)}>
              <div>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 500, color: 'var(--pc-fg)', margin: '0 0 2px' }}>
                  Use PC Wallet — ₹{walletBalance.toLocaleString('en-IN')} available
                </p>
                <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: 0 }}>
                  {useWallet
                    ? `₹${walletUsed.toLocaleString('en-IN')} will be deducted — pay ₹${payableAmount.toLocaleString('en-IN')} via UPI`
                    : 'Tap to apply wallet balance to this booking'}
                </p>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                border: `1.5px solid ${useWallet ? 'var(--pc-sage-hi)' : 'var(--pc-line-strong)'}`,
                background: useWallet ? 'var(--pc-sage)' : 'var(--pc-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}>
                {useWallet && (
                  <svg width="11" height="9" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          </section>
        )}

        {submitError && (
          <p style={{
            fontFamily: 'var(--pc-sans)',
            fontSize: 'var(--pc-text-sm)',
            color: 'var(--pc-danger)',
            padding: 'var(--pc-space-3) var(--pc-space-4)',
            background: 'rgba(201,85,78,0.1)',
            border: '1px solid rgba(201,85,78,0.3)',
            borderRadius: 'var(--pc-radius-sm)',
          }}>{submitError}</p>
        )}

        {/* Terms acceptance */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          cursor: 'pointer',
        }}>
          <div style={{
            marginTop: 2, flexShrink: 0,
            width: 18, height: 18, borderRadius: 4,
            border: `1.5px solid ${termsAccepted ? 'var(--pc-sage-hi)' : 'var(--pc-line-strong)'}`,
            background: termsAccepted ? 'var(--pc-sage)' : 'var(--pc-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s ease, border-color 0.15s ease',
            flexDirection: 'column',
          }}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            {termsAccepted && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{
            fontFamily: 'var(--pc-sans)', fontSize: 13,
            color: 'var(--pc-fg-2)', lineHeight: 1.6,
          }}>
            I have read and agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener" style={{ color: 'var(--pc-fg)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener" style={{ color: 'var(--pc-fg)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Privacy Policy</a>.
          </span>
        </label>

        <SlideToConfirm
          label={payableAmount === 0 ? 'Confirm — Wallet Covers All' : `Pay ₹${payableAmount.toLocaleString('en-IN')} via UPI`}
          onConfirm={handleSubmit}
          disabled={!termsAccepted}
          loading={isSubmitting}
          variant="warm"
        />
      </div>

      {/* ── Right: order summary ── */}
      <div className={styles.summaryCol}>
        <div style={{
          position: 'sticky',
          top: 'var(--pc-space-8)',
          background: 'var(--pc-card)',
          border: '1px solid var(--pc-line)',
          borderRadius: 'var(--pc-radius-md)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: 'var(--pc-space-4) var(--pc-space-5)', borderBottom: '1px solid var(--pc-line)' }}>
            <Eyebrow>ORDER SUMMARY</Eyebrow>
          </div>
          <div style={{ padding: 'var(--pc-space-5)' }}>
            {[
              ['Service',      service.name],
              ['Date',         `${selDate.dayName} ${selDate.dayNum} ${selDate.monthName}`],
              ['Time',         selTime],
              ['Vehicle',      `${brand} ${model || '—'} · ${vehicleTypeLabel}${plate ? ` · ${plate}` : ''}`],
              ['Location',     [flatNo && `Flat ${flatNo}`, tower, societyName].filter(Boolean).join(', ')],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: 'var(--pc-space-2) 0',
                borderBottom: '1px solid var(--pc-line)',
              }}>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', flexShrink: 0 }}>{k}</span>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg)', textAlign: 'right', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{v}</span>
              </div>
            ))}

            <div style={{ marginTop: 'var(--pc-space-4)', paddingTop: 'var(--pc-space-4)', borderTop: '1px solid var(--pc-line-strong)' }}>
              {[
                ['Base price',   `₹${service.price.toLocaleString('en-IN')}`],
                ['GST (18%)',    `₹${gst.toLocaleString('en-IN')}`],
                ['Platform fee', `₹${PLATFORM_FEE}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--pc-space-2)' }}>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-2)' }}>{v}</span>
                </div>
              ))}
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--pc-space-2)' }}>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-sage-hi)' }}>Promo ({promoApplied?.code})</span>
                  <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-sage-hi)' }}>−₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 'var(--pc-space-3)' }}>
                <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', fontWeight: 600, color: 'var(--pc-fg)' }}>Total</span>
                <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-xl)', color: 'var(--pc-fg)' }}>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
