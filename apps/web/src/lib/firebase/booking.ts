import { db } from '@pc/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Booking, BookingStatus, ServiceCategory, VehicleType } from '@pc/firebase';

export async function submitBooking(data: {
  serviceId: string;
  serviceName: string;
  price: number;
  scheduledAt: Date;
  city: string;
  pincode: string;
  addressLine1: string;
  vehicleMake: string;
  vehicleModel: string;
  customerName: string;
  customerPhone: string;
}) {
  const bookingsRef = collection(db, 'bookings');

  // Hardcode some defaults that will be selected correctly later when auth/catalog is fully built
  const newBooking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
    customerId: data.customerPhone, // use phone as temp ID if no auth
    serviceIds: [data.serviceId],
    vehicle: {
      id: 'temp_vehicle_id',
      make: data.vehicleMake,
      model: data.vehicleModel,
      year: new Date().getFullYear(),
      type: 'sedan' as VehicleType,
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
    priceBreakdown: {
      subtotal: data.price,
      tax: 0,
      total: data.price + 50, // Including platform fee
    },
    paymentStatus: 'pending',
    photos: { before: [], after: [] },
  };

  const docRef = await addDoc(bookingsRef, {
    ...newBooking,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}
