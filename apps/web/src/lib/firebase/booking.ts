import { db } from '@pc/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Booking, BookingStatus, VehicleType } from '@pc/firebase';

export interface SubmitBookingInput {
  serviceId: string;
  serviceName: string;
  /** Base service price in ₹ before platform fee */
  price: number;
  /** Platform / convenience fee in ₹ (default 50) */
  platformFee?: number;
  /** Fully-constructed Date combining the selected calendar day + slot time */
  scheduledAt: Date;
  city: string;
  pincode: string;
  addressLine1: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear?: number;
  vehicleType?: VehicleType;
  customerName: string;
  /** 10-digit Indian mobile number (no country prefix) */
  customerPhone: string;
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
  const fee = data.platformFee ?? 50;
  const subtotal = data.price;
  const total = subtotal + fee;

  const newBooking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
    customerId: `phone:${data.customerPhone}`, // temp ID until auth is live
    serviceIds: [data.serviceId],
    vehicle: {
      id: 'web_booking_vehicle',
      make: data.vehicleMake,
      model: data.vehicleModel,
      year: data.vehicleYear ?? new Date().getFullYear(),
      type: data.vehicleType ?? 'sedan',
      registration: 'UNKNOWN',
      color: 'UNKNOWN',
    },
    status: 'pending' as BookingStatus,
    scheduledAt: data.scheduledAt,
    address: {
      line1: data.addressLine1,
      city: data.city,
      pincode: data.pincode,
      coordinates: { latitude: 0, longitude: 0 },
    },
    priceBreakdown: { subtotal, tax: 0, total },
    paymentStatus: 'pending',
    photos: { before: [], after: [] },
  };

  // Random 4-digit suffix for a display-friendly booking ref
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  const bookingRef = `PC-${suffix}`;

  const docRef = await addDoc(collection(db, 'bookings'), {
    ...newBooking,
    bookingRef,
    customerName: data.customerName,
    customerPhone: `+91${data.customerPhone}`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { docId: docRef.id, bookingRef };
}
