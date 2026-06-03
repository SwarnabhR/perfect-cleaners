import { db, auth } from '@pc/firebase';
import { collection, doc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import type { Booking, BookingStatus, VehicleType } from '@pc/firebase';

const GST_RATE = 0.18; // 18 % GST on services (standard rate for car wash / detailing)

export interface SubmitBookingInput {
  serviceId: string;
  serviceName: string;
  /** Base service price in ₹ before platform fee */
  price: number;
  /** Platform / convenience fee in ₹ (default 50) */
  platformFee?: number;
  /** Fully-constructed Date combining the selected calendar day + slot time */
  scheduledAt:  Date;
  societyId:    string;
  societyName:  string;
  tower?:       string;
  flatNo:       string;
  garageNo?:    string;
  vehicleMake:  string;
  vehicleModel: string;
  vehiclePlate?: string;
  vehicleYear?: number;
  vehicleType?: VehicleType;
  customerName: string;
  /** 10-digit Indian mobile number (no country prefix) */
  customerPhone: string;
  promoCode?:     string;
  promoId?:       string;
  promoDiscount?: number;
}

export interface SubmitBookingResult {
  /** Firestore document ID */
  docId: string;
  /** Human-readable booking reference shown to customers, e.g. PC-4821 */
  bookingRef: string;
}

/**
 * Writes a new booking document to Firestore and returns the document ID
 * plus a short human-readable reference number.
 *
 * Auth note: `customerId` is currently set to the phone number until Firebase
 * Auth is wired end-to-end from the web form. Replace with `user.uid` once
 * auth is integrated.
 */
export async function submitBooking(
  data: SubmitBookingInput,
): Promise<SubmitBookingResult> {
  const fee      = data.platformFee ?? 50;
  const subtotal = data.price;
  const tax      = Math.round(subtotal * GST_RATE);
  const discount = data.promoDiscount ?? 0;
  const total    = Math.max(0, subtotal + tax + fee - discount);

  const currentUser = auth.currentUser;

  const newBooking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
    customerId: currentUser?.uid ?? `phone:${data.customerPhone}`,
    serviceIds: [data.serviceId],
    vehicle: {
      id: 'web_booking_vehicle',
      make: data.vehicleMake,
      model: data.vehicleModel,
      year: data.vehicleYear ?? new Date().getFullYear(),
      type: data.vehicleType ?? 'sedan',
      registration: data.vehiclePlate ?? 'UNKNOWN',
      color: 'UNKNOWN',
    },
    status: 'pending' as BookingStatus,
    scheduledAt: data.scheduledAt,
    address: {
      societyId:   data.societyId,
      societyName: data.societyName,
      tower:       data.tower ?? null,
      flatNo:      data.flatNo,
      garageNo:    data.garageNo ?? null,
      line1:       [data.flatNo, data.tower, data.societyName].filter(Boolean).join(', '),
      pincode:     '',
      coordinates: { latitude: 0, longitude: 0 },
    },
    priceBreakdown: { subtotal, tax, total, ...(discount > 0 ? { discount } : {}) },
    paymentStatus: 'pending',
    photos: { before: [], after: [] },
  };

  // Use the Firestore doc ID as the booking ref — guaranteed unique
  const docRef    = doc(collection(db, 'bookings'));
  const bookingRef = `PC-${docRef.id.slice(-6).toUpperCase()}`;

  await setDoc(docRef, {
    ...newBooking,
    bookingRef,
    customerName:  data.customerName,
    customerPhone: `+91${data.customerPhone}`,
    ...(data.promoCode ? { promoCode: data.promoCode, promoDiscount: discount } : {}),
    createdAt:     serverTimestamp(),
    updatedAt:     serverTimestamp(),
  });

  // Increment promo usedCount (best-effort — never block the booking)
  if (data.promoId) {
    updateDoc(doc(db, 'promotions', data.promoId), { usedCount: increment(1) })
      .catch(err => console.error('[submitBooking] promo increment failed:', err));
  }

  return { docId: docRef.id, bookingRef };
}
