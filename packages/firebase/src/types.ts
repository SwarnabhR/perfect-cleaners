// Firestore document types for Perfect Cleaners

export type VehicleType = 'sedan' | 'suv' | 'hatchback' | 'luxury' | 'pickup' | 'van';

export type BookingStatus =
  | 'pending'
  | 'assigned'
  | 'enroute'
  | 'arrived'
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
  /**
   * Set to true after the user completes the 3-step first-run
   * onboarding flow (name → car → address). Used by index.tsx as
   * the authoritative gate — AsyncStorage is a local cache of this.
   */
  onboardingComplete?: boolean;
  /**
   * 'customer' for end-users; 'worker' for service staff.
   * Determines which tab group index.tsx routes to.
   */
  role?: 'customer' | 'worker';
  defaultAddress?: {
    societyId: string;
    societyName: string;
    tower?: string;    // e.g. "Tower A" — omitted for societies with no tower subdivision
    unitNumber: string; // e.g. "1204"
  };
  walletBalance?: number;
  outstandingBalance?: number;  // accumulated unpaid amount from society washes
  referralCode?: string;
  // Society resident fields — set when the customer belongs to a partner society
  societyId?: string;
  unitNumber?: string;    // e.g. "B-1204"
  societyName?: string;  // denormalized for quick display
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
  // Society assignment — set by admin to indicate which society this worker services
  assignedSocietyId?: string;
  assignedSocietyName?: string;
  rating: number;
  totalJobs: number;
  carsCompletedToday: number;
  earnings: WorkerEarnings;
  createdAt: Date;
}

// A single day's cleaning assignment for a worker at a society.
// Created by admin; worker marks it in-progress then done.
export type CleaningSessionStatus = 'scheduled' | 'inprogress' | 'done';

export interface CleaningSession {
  id: string;
  societyId: string;
  societyName: string;
  tower?: string;
  workerId: string;
  workerName: string;
  scheduledDate: Date;       // calendar day (time is start of day)
  status: CleaningSessionStatus;
  totalCars: number;         // set from subscribed resident count at session start
  completedCars: number;     // incremented as cleaningLogs are written
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface BookingAddress {
  line1:        string;
  city?:        string;
  pincode?:     string;
  coordinates:  GeoPoint;
  societyId?:   string;
  societyName?: string;
  tower?:       string | null;
  flatNo?:      string;
  garageNo?:    string | null;
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
  paymentId?: string;       // Razorpay order/payment ID
  photos: BookingPhotos;
  otpCode?: string;         // 4-digit OTP for job completion sign-off
  workerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;       // set when status transitions to 'done'
  // Denormalized fields written at booking creation for display & queries
  bookingRef?: string;      // human-readable ref, e.g. "PC-4A2B3C"
  customerName?: string;    // from customers/{uid}.name at booking time
  customerPhone?: string;   // E.164 format, e.g. "+919876543210"
  workerName?: string;      // from workers/{uid}.name at assignment time
}

export interface SocietyContact {
  name: string;
  phone: string;
  email?: string;
  role: string;   // e.g. "Facility Manager", "RWA President"
}

export interface Society {
  id: string;
  name: string;                // e.g. "Uniworld City"
  address: string;             // e.g. "Sector 30, Noida"
  city: string;
  pincode: string;
  towers: string[];            // e.g. ["Tower A", "Tower B", "Tower C"]
  totalUnits: number;          // total flats/villas in the complex
  activeResidents: number;     // residents with the app installed
  vehicleCount: number;        // registered vehicles
  isActive: boolean;
  contractStart: Date;
  contractEnd?: Date;
  pricePerWash: number;        // ₹ charged to each resident per exterior wash
  cleaningSchedule: string;    // e.g. "Mon, Wed, Fri · 7:00 AM"
  contactPerson: SocietyContact;
  assignedWorkerIds: string[];
  createdAt: Date;
}

// Written by the worker app when a car is marked clean;
// triggers a push notification + billing update via Cloud Function.
export interface CleaningLog {
  id: string;
  societyId: string;
  societyName: string;          // denormalized
  vehicleRegistration: string;  // e.g. "DL 01 AB 1234"
  vehicleMake: string;
  vehicleModel: string;
  customerId: string;
  customerName: string;         // denormalized
  unitNumber: string;           // e.g. "B-1204"
  workerId: string;
  workerName: string;           // denormalized
  cleanedAt: Date;
  serviceType: 'exterior' | 'interior' | 'both';
  servicePrice: number;         // ₹ amount added to customer's outstandingBalance
  photoUrls: string[];
  notificationSent: boolean;
  billed: boolean;              // true once outstandingBalance has been incremented
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

// ─── SOCIETY-BASED CLEANING SYSTEM ────────────────────────────────────────

// Billing configuration per tower (admin-set pricing)
export interface SocietyBillingConfig {
  id: string;
  societyId: string;
  tower: string;                // e.g. "Tower A"
  monthlyFee: number;          // ₹500, ₹600, etc
  currency: 'INR';
  billingDay: number;          // 1 (1st of month)
  cleaningSchedule: string;    // "Mon, Wed, Fri · 9:00 AM"
  createdAt: Date;
  updatedAt: Date;
}

// Customer enrollment in society cleaning program
export interface CustomerSocietyRecord {
  id: string;
  customerId: string;
  societyId: string;
  societyName: string;
  tower: string;
  cars: Array<{
    plate: string;           // e.g. "DL 01 AB 1234"
    make: string;
    model: string;
  }>;

  // Preferred cleaning time (overrides tower default)
  preferredCleaningTime: number; // 7, 9, 14 (hours in 24h format)

  // Signup source and status
  signupSource: 'bulk_import' | 'self_signup';
  status: 'pending' | 'active' | 'paused' | 'inactive';

  // Billing & payment
  monthlyFee: number;
  lastBilledDate?: Date;
  nextBillingDate: Date;
  paymentStatus: 'not_verified' | 'verified' | 'pending_payment' | 'paid';
  paymentMethod?: string;       // 'phone', 'upi', 'card'
  paymentNotes?: string;        // Admin notes: "Called on Jun 10, will pay by Jun 15"

  // Unavailability rules
  skipDates: Date[];           // One-time skips
  rescheduledSlots: Array<{
    date: Date;
    fromTime: number;          // 9 (original slot)
    toTime: number;            // 14 (new slot)
  }>;
  permanentTime?: number;      // Override preferredCleaningTime

  createdAt: Date;
  updatedAt: Date;
}

// Pending self-signup requests (admin approval queue)
export interface PendingApproval {
  id: string;
  societyId: string;
  societyName: string;
  tower: string;

  // Customer info
  customerId?: string;         // null for completely new signup
  customerName: string;
  customerPhone: string;       // +91 format
  customerEmail?: string;

  // Vehicle info
  carPlate: string;
  carMake: string;
  carModel: string;

  // Preferences
  preferredCleaningTime: number; // 7, 9, 14

  // Approval workflow
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: string;         // Admin ID

  submittedAt: Date;
}

// Enhanced CleaningSession with real-time tracking
export interface CleaningSessionCar {
  customerId: string;
  carPlate: string;
  carMake: string;
  carModel: string;
  preferredTime: number;       // What customer prefers (7, 9, 14)
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
  cleanedBy?: string;          // Worker ID who cleaned it
  cleanedAt?: Date;
}

export interface CleaningSessionEnhanced {
  id: string;
  societyId: string;
  societyName: string;
  tower: string;
  scheduledDate: Date;

  // Status
  status: CleaningSessionStatus;
  startedAt?: Date;
  completedAt?: Date;

  // Real-time car tracking
  cars: CleaningSessionCar[];
  totalCars: number;
  completedCars: number;
  skippedCars: number;

  // Multi-worker support
  workerIds: string[];         // Can have 1-3+ workers
  workerNames: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

