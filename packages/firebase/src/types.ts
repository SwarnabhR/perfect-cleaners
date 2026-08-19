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

export interface Worker {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  location?: GeoPoint;
  isOnline: boolean;
  activeBookingId?: string;
  // Societies this worker regularly services — a worker can cover more than one.
  // Index-matched: assignedSocietyNames[i] is the name for assignedSocietyIds[i].
  assignedSocietyIds?: string[];
  assignedSocietyNames?: string[];
  /** @deprecated superseded by assignedSocietyIds — still read as a fallback for un-migrated docs */
  assignedSocietyId?: string;
  /** @deprecated superseded by assignedSocietyNames — still read as a fallback for un-migrated docs */
  assignedSocietyName?: string;
  rating: number;
  ratingCount?: number;    // number of customer ratings folded into `rating`'s running average
  totalJobs: number;
  carsCompletedToday: number;
  createdAt: Date;
}

// 'missed' — the session didn't happen (society holiday, worker no-show); see missedReason.
export type CleaningSessionStatus = 'scheduled' | 'inprogress' | 'done' | 'missed';

// 0 = Sunday … 6 = Saturday, matches JS Date.getDay().
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

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
  activeResidents: number;     // residents with an active customerSocietyRecord (kept in sync by pending-approvals/customer-enrollments)
  vehicleCount: number;        // cars enrolled via active customerSocietyRecords
  isActive: boolean;
  contractStart: Date;
  contractEnd?: Date;
  pricePerWash: number;        // ₹ charged to each resident per exterior wash
  cleaningSchedule: string;    // e.g. "Mon, Wed, Fri · 7:00 AM"
  contactPerson: SocietyContact;
  assignedWorkerIds: string[];
  // Per-tower worker roster — many-to-many: a tower can have multiple workers,
  // a worker can cover multiple towers. Keyed by exact tower name (must match
  // an entry in `towers` above). Read by the generate-sessions cron to
  // auto-populate a new session's workerIds/workerNames instead of leaving it
  // unassigned. Absent/missing keys mean "no default worker for that tower" —
  // sessions fall back to workerIds: [] exactly as before this field existed.
  towerWorkerAssignments?: Record<string, string[]>;
  createdAt: Date;
}

// Written by the worker app when a car is marked clean;
// triggers a push notification + billing update via Cloud Function.
export interface CleaningLog {
  id: string;
  sessionId?: string;            // absent on logs written before this field existed
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
  rating?: number;              // 1-5, set once by the customer via /api/cleaning-log/rate
  ratedAt?: Date;
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
  societyName: string;         // e.g. "Uniworld City"
  tower: string;                // e.g. "Tower A"
  monthlyFee: number;          // ₹500, ₹600, etc — always kept equal to tierPricing.normal
                                // when tierPricing is set, so pre-tier readers keep working.
  currency: 'INR';
  billingDay: number;          // 1 (1st of month)
  cleaningDays: DayOfWeek[];   // admin-configured allowed cleaning days for this tower
  cleaningSchedule: string;    // display string derived from cleaningDays, e.g. "Mon, Wed, Fri · 9:00 AM"
  // Structured start time: minutes after midnight IST (540 = 9:00 AM).
  // Authoritative when set; absent on configs saved before this field existed,
  // null when the admin's free-text time didn't parse at save time — readers
  // fall back to parsing the display string in both cases.
  cleaningTimeMinutes?: number | null;

  // undefined = 'monthly' (today's only behavior — every existing config keeps
  // billing exactly as before until an admin explicitly picks a different mode).
  billingFrequency?: 'monthly' | 'one-time' | 'per-day';
  // Per-customer tier pricing — meaning depends on billingFrequency: a flat fee
  // for monthly/one-time, a per-clean rate for per-day. Optional: towers without
  // this configured have no tier picker at signup and just use monthlyFee.
  tierPricing?: {
    normal: number;
    premium: number;
    ultra: number;
  };
  // Optional add-on service on top of the regular exterior-wash cadence above —
  // its own schedule, its own flat fee charged alongside the regular cycle.
  deepClean?: {
    frequency: 'weekly' | 'daily' | 'one-time';
    fee: number;
    // Set once generate-sessions has created the single one-time deep-clean
    // session for this tower, so it's never regenerated on a later cron run.
    oneTimeGeneratedAt?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

// Customer enrollment in society cleaning program
export interface CustomerSocietyRecord {
  id: string;
  customerId: string;
  customerName?: string;        // denormalized from PendingApproval at approval time
  customerPhone?: string;       // denormalized, +91 format — needed to send notifications
  societyId: string;
  societyName: string;
  tower: string;
  unitNumber?: string;          // e.g. "1204" or "B-1204" — where the car actually lives, for the worker on the ground
  parkingNumber?: string;       // e.g. "P-42" — parking slot, for the worker on the ground
  cars: Array<{
    plate: string;           // e.g. "DL 01 AB 1234"
    make: string;
    model: string;
  }>;

  // Preferred cleaning time (overrides tower default)
  preferredCleaningTime: number; // 7, 7.5, 9, 14 (hours in 24h format, .5 = half-hour slot)
  // Preferred cleaning days, subset of the tower's SocietyBillingConfig.cleaningDays.
  // Unset/empty means "all of the tower's cleaning days" (legacy/bulk-imported behavior).
  preferredCleaningDays?: DayOfWeek[];

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

  // Tier + frequency, resolved and denormalized from the tower's
  // SocietyBillingConfig at enrollment time (same reason monthlyFee already is —
  // a later tower config change shouldn't retroactively change an existing
  // customer's plan mid-cycle). Absent on pre-tier enrollments, which just keep
  // using the flat monthlyFee with an implicit 'monthly' frequency.
  tier?: 'normal' | 'premium' | 'ultra';
  billingFrequency?: 'monthly' | 'one-time' | 'per-day';
  deepCleanEnabled?: boolean;
  oneTimeBilled?: boolean;      // set once the billing cron has charged a 'one-time' customer
  pendingAmount?: number;       // current cycle's actual amount owed, written by the billing cron

  // Unavailability rules
  skipDates: Date[];           // One-time skips
  rescheduledSlots: Array<{
    date: Date;
    fromTime: number;          // 9 (original slot, .5 = half-hour)
    toTime: number;            // 14 (new slot, .5 = half-hour)
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
  preferredCleaningTime: number; // 7, 7.5, 9, 14 (.5 = half-hour slot)
  preferredCleaningDays?: DayOfWeek[];
  tier?: 'normal' | 'premium' | 'ultra'; // resolved into monthlyFee at approval time

  // Approval workflow
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: string;         // Admin ID

  submittedAt: Date;
}

// A car on a session's real-time shared checklist.
export interface CleaningSessionCar {
  customerId: string;
  customerName?: string;       // denormalized — who the car belongs to, for the worker on the ground
  customerPhone?: string;      // denormalized — so a worker can call the resident without another lookup
  unitNumber?: string;         // denormalized — e.g. "1204" or "B-1204"
  parkingNumber?: string;      // denormalized — e.g. "P-42"
  carPlate: string;
  carMake: string;
  carModel: string;
  preferredTime: number;       // What customer prefers (7, 7.5, 9, 14 — .5 = half-hour slot)
  // 'skipped' — customer opted out for this date (see CustomerSocietyRecord.skipDates);
  // still included in cars[] (not dropped) so the worker sees "Not available" rather
  // than the car silently vanishing from the list.
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
  // Ops-only "not available today" toggle (Live Cleaning board) — distinct
  // from status: 'skipped', which means the customer opted out via their own
  // skipDates. Both must exclude the car from a worker's actionable to-do
  // list and from the session's completable denominator (see
  // resolveWorkerTodoCars and the toggleUnavailable totalCars adjustment).
  unavailable?: boolean;
  cleanedBy?: string;          // Worker ID who cleaned it
  cleanedAt?: Date;
}

// A single day's cleaning assignment at a society tower, with real-time
// per-car tracking. Created by the generate-sessions cron; workers mark
// cars done via /api/session/[id]. (Formerly named CleaningSessionEnhanced —
// the earlier single-worker CleaningSession shape is gone, along with its
// singular workerId field.)
export interface CleaningSession {
  id: string;
  societyId: string;
  societyName: string;
  tower: string;
  scheduledDate: Date;
  sessionType?: 'wash' | 'deep-clean'; // undefined = 'wash' (every session before this field existed)

  // Status
  status: CleaningSessionStatus;
  startedAt?: Date;
  // Set only by the start-sessions cron when it promotes a session at the
  // tower's configured time. Absent (or false) on a session that reached
  // 'inprogress' via the admin's manual "Emergency start" button instead.
  startedBySystem?: boolean;
  completedAt?: Date;
  // 'session_expired' is written only by the cleanup-sessions cron when a
  // 'scheduled' session's date passes without it ever starting; the other
  // three are the admin's manual mark-missed choices.
  missedReason?: 'holiday' | 'worker_unavailable' | 'session_expired' | 'other';
  missedNotes?: string;

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

