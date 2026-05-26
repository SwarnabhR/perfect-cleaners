// Firestore document types for Perfect Cleaners

export type VehicleType = 'sedan' | 'suv' | 'hatchback' | 'luxury' | 'pickup' | 'van';

export type BookingStatus =
  | 'pending'
  | 'assigned'
  | 'enroute'
  | 'inprogress'
  | 'done'
  | 'cancelled';

export type ServiceCategory =
  | 'exterior'
  | 'interior'
  | 'detailing'
  | 'ceramic'
  | 'paint';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  registration: string;  // e.g. DL 01 AB 1234
  color: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  priceMin: number;
  priceMax: number;
  durationMin: number;   // estimated duration in minutes
  category: ServiceCategory;
  isPopular: boolean;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;         // +91 format
  email?: string;
  vehicles: Vehicle[];
  createdAt: Date;
}

export interface WorkerEarnings {
  today: number;
  week: number;
  month: number;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  location?: GeoPoint;
  isOnline: boolean;
  activeBookingId?: string;
  rating: number;
  totalJobs: number;
  earnings: WorkerEarnings;
  createdAt: Date;
}

export interface BookingAddress {
  line1: string;
  city: string;
  pincode: string;
  coordinates: GeoPoint;
}

export interface PriceBreakdown {
  subtotal: number;
  tax: number;
  total: number;
}

export interface BookingPhotos {
  before: string[];   // Storage download URLs
  after: string[];
}

export interface Booking {
  id: string;
  customerId: string;
  workerId?: string;
  serviceIds: string[];
  vehicle: Vehicle;
  status: BookingStatus;
  scheduledAt: Date;
  address: BookingAddress;
  priceBreakdown: PriceBreakdown;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentId?: string;    // Razorpay order/payment ID
  photos: BookingPhotos;
  otpCode?: string;      // 4-digit OTP for job completion sign-off
  workerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discountType: 'flat' | 'percent';
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
}
