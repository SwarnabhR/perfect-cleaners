// Fake society customers + worker assignments for live testing.
// Consumed by seed-fake-customers.mjs.

export const ANIL_ID = 'FV09wMOZytZKtA2sLhRC1ZI8a212';
export const ANIL_NAME = 'Anil';
export const ANIL_PHONE = '+919711241629';

export const WORKERS = {
  anil:   { id: ANIL_ID,  name: ANIL_NAME },
  ravi:   { id: 'demo_worker_ravi_001',   name: 'Ravi Kumar' },
  aakash: { id: 'demo_worker_aakash_003', name: 'Aakash Singh' },
  deepak: { id: 'demo_worker_deepak_005', name: 'Deepak Verma' },
  suresh: { id: 'demo_worker_suresh_002', name: 'Suresh Yadav' },
  manoj:  { id: 'demo_worker_manoj_004',  name: 'Manoj Sharma' },
};

// Worker assignment per society/tower. Most sessions go to Anil so he has the
// most cars; the others cover a tower each (or share with Anil).
export const TOWER_WORKERS = {
  demo_society_uniworld_001: {
    'Tower A': ['anil', 'ravi'],
    'Tower B': ['anil', 'aakash'],
    'Tower C': ['aakash'],
    'Tower D': ['anil'],
  },
  demo_society_dlf_002: {
    'Greens I':   ['deepak'],
    'Greens II':  ['anil', 'deepak'],
    'Greens III': ['anil'],
  },
  demo_society_mahagun_003: {
    'North Wing': ['anil', 'suresh'],
    'South Wing': ['anil', 'manoj'],
    'East Wing':  ['anil'],
    'West Wing':  ['anil'],
    'Central':    ['anil'],
  },
};

export const FAKE_CUSTOMERS = [
  {
    customerName: 'Vikram Malhotra', customerPhone: '+919811300001',
    societyId: 'demo_society_uniworld_001', tower: 'Tower A',
    unitNumber: '1102', parkingNumber: 'P-11',
    cars: [
      { plate: 'DL 01 MN 2020', make: 'Mercedes-Benz', model: 'E 200' },
      { plate: 'DL 01 NO 5050', make: 'Toyota',        model: 'Fortuner' },
    ],
    preferredCleaningTime: 7, preferredCleaningDays: [1, 3, 5],
    tier: 'premium', billingFrequency: 'monthly', paymentStatus: 'paid', paymentMethod: 'phone',
  },
  {
    customerName: 'Sneha Kapoor', customerPhone: '+919811300002',
    societyId: 'demo_society_uniworld_001', tower: 'Tower A',
    unitNumber: '0907', parkingNumber: 'P-09',
    cars: [{ plate: 'DL 01 PQ 4567', make: 'Maruti Suzuki', model: 'Swift' }],
    preferredCleaningTime: 9, preferredCleaningDays: [1, 3, 5],
    tier: 'normal', billingFrequency: 'monthly', paymentStatus: 'paid', paymentMethod: 'upi',
  },
  {
    customerName: 'Arjun Nanda', customerPhone: '+919811300003',
    societyId: 'demo_society_uniworld_001', tower: 'Tower A',
    unitNumber: '1503', parkingNumber: 'P-15',
    cars: [{ plate: 'DL 01 RS 3210', make: 'Hyundai', model: 'i20' }],
    preferredCleaningTime: 7.5, preferredCleaningDays: [1, 3, 5],
    tier: 'normal', billingFrequency: 'monthly', paymentStatus: 'pending_payment', paymentMethod: 'phone',
    skipDates: ['2026-08-17'],
  },
  {
    customerName: 'Kavita Mehrotra', customerPhone: '+919811300004',
    societyId: 'demo_society_uniworld_001', tower: 'Tower B',
    unitNumber: 'B-1204', parkingNumber: 'P-B02',
    cars: [{ plate: 'DL 01 TU 8888', make: 'Kia', model: 'Carens' }],
    preferredCleaningTime: 9, preferredCleaningDays: [1, 3, 5],
    tier: 'normal', billingFrequency: 'monthly', paymentStatus: 'verified', paymentMethod: 'upi',
  },
  {
    customerName: 'Rohan Bhatia', customerPhone: '+919811300005',
    societyId: 'demo_society_uniworld_001', tower: 'Tower B',
    unitNumber: 'B-0701', parkingNumber: 'P-B07',
    cars: [{ plate: 'DL 01 VW 2323', make: 'Skoda', model: 'Slavia' }],
    preferredCleaningTime: 7, preferredCleaningDays: [1, 3, 5],
    tier: 'normal', billingFrequency: 'monthly', paymentStatus: 'paid', paymentMethod: 'phone',
  },
  {
    customerName: 'Nisha Reddy', customerPhone: '+919811300006',
    societyId: 'demo_society_uniworld_001', tower: 'Tower C',
    unitNumber: '1604', parkingNumber: 'P-16',
    cars: [{ plate: 'DL 01 WX 9090', make: 'Toyota', model: 'Hyryder' }],
    preferredCleaningTime: 9, preferredCleaningDays: [1, 3, 5],
    tier: 'premium', billingFrequency: 'monthly', paymentStatus: 'paid', paymentMethod: 'upi',
  },
  {
    customerName: 'Gaurav Sethi', customerPhone: '+919811300007',
    societyId: 'demo_society_uniworld_001', tower: 'Tower D',
    unitNumber: '2201', parkingNumber: 'P-22',
    cars: [{ plate: 'DL 01 YZ 5454', make: 'Mahindra', model: 'XUV700' }],
    preferredCleaningTime: 7, preferredCleaningDays: [1, 3, 5],
    tier: 'ultra', billingFrequency: 'monthly', paymentStatus: 'paid', paymentMethod: 'card',
  },
  {
    customerName: 'Farah Khan', customerPhone: '+919811300008',
    societyId: 'demo_society_uniworld_001', tower: 'Tower D',
    unitNumber: '2105', parkingNumber: 'P-21',
    cars: [{ plate: 'DL 01 AB 7878', make: 'Tata', model: 'Punch' }],
    preferredCleaningTime: 14, preferredCleaningDays: [1, 3, 5],
    tier: 'normal', billingFrequency: 'monthly', paymentStatus: 'verified', paymentMethod: 'phone',
  },
  {
    customerName: 'Varun Chopra', customerPhone: '+919811300009',
    societyId: 'demo_society_dlf_002', tower: 'Greens I',
    unitNumber: 'A-110', parkingNumber: 'P-A11',
    cars: [{ plate: 'DL 03 CD 1212', make: 'Honda', model: 'Elevate' }],
    preferredCleaningTime: 7.5, preferredCleaningDays: [2, 4, 6],
    tier: 'premium', billingFrequency: 'monthly', paymentStatus: 'paid', paymentMethod: 'upi',
  },
  {
    customerName: 'Meera Iyer', customerPhone: '+919811300010',
    societyId: 'demo_society_dlf_002', tower: 'Greens II',
    unitNumber: 'B-204', parkingNumber: 'P-B20',
    cars: [
      { plate: 'DL 03 EF 3434', make: 'Hyundai', model: 'Verna' },
      { plate: 'DL 03 EF 3435', make: 'Hyundai', model: 'i20' },
    ],
    preferredCleaningTime: 9, preferredCleaningDays: [2, 4, 6],
    tier: 'normal', billingFrequency: 'monthly', paymentStatus: 'paid', paymentMethod: 'phone',
  },
  {
    customerName: 'Karan Thapar', customerPhone: '+919811300011',
    societyId: 'demo_society_dlf_002', tower: 'Greens III',
    unitNumber: 'C-312', parkingNumber: 'P-C31',
    cars: [{ plate: 'DL 03 GH 6565', make: 'MG', model: 'Hector' }],
    preferredCleaningTime: 9.5, preferredCleaningDays: [2, 4, 6],
    tier: 'premium', billingFrequency: 'monthly', paymentStatus: 'verified', paymentMethod: 'upi',
  },
  {
    customerName: 'Pooja Desai', customerPhone: '+919811300012',
    societyId: 'demo_society_mahagun_003', tower: 'North Wing',
    unitNumber: 'NB-105', parkingNumber: 'P-N10',
    cars: [{ plate: 'MH 12 IJ 8080', make: 'Tata', model: 'Tiago' }],
    preferredCleaningTime: 6.5, preferredCleaningDays: [0, 1, 3, 5],
    tier: 'normal', billingFrequency: 'monthly', paymentStatus: 'paid', paymentMethod: 'upi',
    skipDates: ['2026-08-16'],
  },
  {
    customerName: 'Amitabh Saxena', customerPhone: '+919811300013',
    societyId: 'demo_society_mahagun_003', tower: 'South Wing',
    unitNumber: 'SW-212', parkingNumber: 'P-S21',
    cars: [{ plate: 'UP 16 KL 1717', make: 'Honda', model: 'Amaze' }],
    preferredCleaningTime: 7, preferredCleaningDays: [0, 1, 3, 5],
    tier: 'normal', billingFrequency: 'monthly', paymentStatus: 'pending_payment', paymentMethod: 'phone',
  },
  {
    customerName: 'Ritika Jain', customerPhone: '+919811300014',
    societyId: 'demo_society_mahagun_003', tower: 'East Wing',
    unitNumber: 'EW-310', parkingNumber: 'P-E30',
    cars: [{ plate: 'DL 05 MN 2929', make: 'Volkswagen', model: 'Virtus' }],
    preferredCleaningTime: 9, preferredCleaningDays: [0, 1, 3, 5],
    tier: 'premium', billingFrequency: 'monthly', paymentStatus: 'paid', paymentMethod: 'card',
  },
  {
    customerName: 'Shubham Gupta', customerPhone: '+919811300015',
    societyId: 'demo_society_mahagun_003', tower: 'West Wing',
    unitNumber: 'WW-118', parkingNumber: 'P-W11',
    cars: [{ plate: 'UP 16 OP 3636', make: 'Renault', model: 'Kiger' }],
    preferredCleaningTime: 7, preferredCleaningDays: [0, 1, 3, 5],
    permanentTime: 14,
    tier: 'normal', billingFrequency: 'monthly', paymentStatus: 'verified', paymentMethod: 'phone',
  },
  {
    customerName: 'Tanvi Mishra', customerPhone: '+919811300016',
    societyId: 'demo_society_mahagun_003', tower: 'Central',
    unitNumber: 'C-405', parkingNumber: 'P-C40',
    cars: [{ plate: 'UP 16 QR 7777', make: 'Citroen', model: 'C3' }],
    preferredCleaningTime: 7, preferredCleaningDays: [0, 1, 3, 5],
    tier: 'normal', billingFrequency: 'monthly', paymentStatus: 'paid', paymentMethod: 'upi',
    rescheduledSlots: [{ date: '2026-08-17', fromTime: 7, toTime: 14 }],
  },
];

// Pending self-signups for the admin approval queue.
export const PENDING_APPROVALS = [
  {
    id: 'approval_sameer_uniworld',
    societyId: 'demo_society_uniworld_001', societyName: 'Princess park', tower: 'Tower A',
    customerName: 'Sameer Chawla', customerPhone: '+919811300017',
    carPlate: 'DL 01 ST 1111', carMake: 'Maruti Suzuki', carModel: 'Fronx',
    preferredCleaningTime: 7, preferredCleaningDays: [1, 3, 5],
    tier: 'normal',
  },
  {
    id: 'approval_lavanya_mahagun',
    societyId: 'demo_society_mahagun_003', societyName: 'Angel Jupiter', tower: 'Central',
    customerName: 'Lavanya Pillai', customerPhone: '+919811300018',
    carPlate: 'KA 05 TU 2222', carMake: 'Hyundai', carModel: 'Creta',
    preferredCleaningTime: 9, preferredCleaningDays: [0, 1, 3, 5],
    tier: 'normal',
  },
];
