# Perfect Cleaners — Operations Guide

This document covers how the three primary user types interact with the platform, and the
operational flows behind them. Update this file whenever the business model changes.

---

## Business Model Overview

Perfect Cleaners is a **subscription car-care service** that operates inside residential
societies across Delhi NCR.

| Actor | Role | Pays |
|---|---|---|
| **Society / RWA** | Approves the service on their premises; sets visit days | Nothing — listing is free |
| **Resident** | Downloads the app, subscribes, gets their car cleaned | Weekly or monthly subscription |
| **Worker** | Assigned to a society; cleans all subscribed cars on visit days | — (paid by Perfect Cleaners) |
| **Admin** | Manages societies, workers, subscriptions, and analytics | — |

**Cleaning flow:**
1. Worker visits society on agreed days (e.g. Mon / Wed / Fri at 7 AM)
2. Worker marks each subscribed car as cleaned in their app
3. Resident receives an instant push notification with photos
4. Monthly subscription charge is processed via Razorpay

---

## 1 — Resident (Customer) Flow

### 1.1 Sign Up & Onboarding

1. **Download** the Perfect Cleaners app (iOS / Android)
2. **Phone OTP**: Enter your +91 mobile number → receive 6-digit OTP → verify
3. **Step 01 — Name**: Enter first name, last name, and email address
4. **Step 02 — Car**: Enter make and model (required), number plate and colour (optional).
   This is saved once and used for every clean — you never enter it again.
5. **Step 03 — Society**: Select your society from the list → pick your tower/block
   (if applicable) → enter your flat/unit number

After onboarding you land on the home screen. Your profile is saved to Firestore and
pre-fills automatically in all future interactions.

### 1.2 Subscription

1. Open the **Plans** tab or tap "View Plans" on the home screen
2. Choose a plan:
   - **Weekly**: charged per week, car cleaned on every scheduled visit
   - **Monthly**: fixed monthly fee, car cleaned on every visit during the month
3. Payment via Razorpay (UPI, card, or net banking)
4. Subscription activates immediately

To **pause or cancel**: Settings → Subscription → Pause / Cancel.
Changes take effect from the next billing cycle. No lock-in or cancellation fees.

### 1.3 Getting Cleaned

- Workers arrive at your society on the agreed schedule
- Your car is cleaned without any action required from you
- **Push notification** is sent the moment your car is marked done — includes:
  - Vehicle registration number
  - Exact timestamp
  - Before/after photos (where captured)

### 1.4 Premium Add-ons

Society subscribers can book one-time premium services:
- Interior Detailing
- Paint Correction
- Ceramic Coating

Navigate to **Home → Services** and tap a service to book. The saved car, society address,
and phone number pre-fill automatically — no re-entry needed.

---

## 2 — Worker Flow

### 2.1 Access

Workers use a dedicated login in the **Perfect Cleaners app** (same app, different role).

1. **Phone OTP login** (same flow as customer)
2. The app detects `role: 'worker'` on the Firestore `workers` document and routes to
   the worker tab group: **Home (cleaning list), Earnings, Profile**

> Workers can also access a web portal at `/worker/login` on the web app for reference
> (useful on tablet, but the mobile app is the primary interface).

### 2.2 Starting a Shift

1. Open the app → Home tab
2. Tap **ON DUTY** toggle (top-right) to go online
3. Your **assigned society** appears as the day's assignment card, showing:
   - Society name
   - Today's progress (e.g. "12 / 47 done")
   - Stats: Pending / Cleaning / Done

> **Society assignment** is set by the admin in the Workers admin page. If no society
> is shown, contact your admin to be assigned.

### 2.3 Cleaning a Car

The home screen lists every subscribed resident's vehicle in your assigned society,
sorted by unit number.

For each car:
1. Tap **CLEAN →** to mark the car as "currently being cleaned" (status: Cleaning)
2. Clean the vehicle
3. Tap **DONE ✓** to mark it complete

When you tap DONE ✓:
- A `cleaningLog` document is written to Firestore
- The resident receives a push notification automatically (via Cloud Function — requires
  Firebase Functions deployment, see `functions/` directory)
- The car row fades out to show it's complete

### 2.4 Premium Bookings (Individual Jobs)

For premium one-time bookings (interior detailing, ceramic coating, etc.) assigned by the
admin, the **job detail screen** shows:
- Customer name, vehicle, address
- 4-step stepper: En Route → Arrived → In Progress → Complete
- Checklist items to tick off during the job
- Before/after photo capture

Navigate there from the Home tab active-job card, or from the **Jobs** tab (filter: Active).

### 2.5 Ending a Shift

Tap the **ON DUTY** toggle again to go offline. Your earnings for the day update
automatically on the Earnings tab.

---

## 3 — Admin Flow

Admin dashboard is accessible at **admin.perfectcleaners.in** (or `/dashboard` on the
web app).

Login: `/login` with admin Firebase credentials.

### 3.1 Admin Dashboard

The dashboard shows:
- Revenue (all time / today)
- Active jobs
- Workers online
- Total bookings
- Top workers leaderboard
- Recent bookings table

### 3.2 Societies Management (`/societies-mgmt`)

Manage partner societies.

**Add a society:**
1. Click **Add Society** (top-right)
2. Fill in: name, address, city, pincode, towers list (comma-separated), total units,
   monthly fee, cleaning schedule, contact person details
3. Set `isActive: true`

**Assign workers to a society:**
- Open the society detail drawer (click a row)
- Note the assigned worker IDs section — update the worker's `assignedSocietyId` field in
  the Workers page

**Key fields:**
- `towers`: array of tower/block names — drives the resident onboarding picker
- `cleaningSchedule`: display string e.g. "Mon, Wed, Fri · 7:00 AM"
- `isActive`: controls whether the society appears in the resident app

### 3.3 Workers Management (`/workers`)

- View all workers with status (Available / On Job / Off Today), rating, jobs done, earnings
- Click a row to see full stats including this-week and this-month earnings
- To assign a worker to a society: update `assignedSocietyId` and `assignedSocietyName`
  directly in the Firebase console (admin UI for this is a planned feature)

### 3.4 Cleaning Activity (`/cleaning-logs`)

Real-time view of all cleaning activity.

**Filters:** Today / Last 7 Days / All Time

**Per-worker breakdown table shows:**
- Worker name and assigned society
- Number of cars cleaned (with visual progress bar)
- Last activity timestamp

**Click any worker row** to expand a detailed log of every car they cleaned:
- Time, unit number, resident name, vehicle registration, service type

Use this page to:
- Verify workers are completing their shifts
- Identify under-performing societies or workers
- Resolve resident complaints ("was my car cleaned today?")

### 3.5 Customers (`/customers`)

- View all registered residents with their society, unit, vehicles, and booking count
- Search by name or phone

### 3.6 Bookings (`/bookings`)

Premium add-on bookings (interior detailing, ceramic coating, etc.) — not society
subscription cleans. Society cleans are tracked in `/cleaning-logs`.

### 3.7 Analytics (`/analytics`)

Revenue charts, job mix, and top services by booking count.

---

## 4 — Notification System

Resident notifications are triggered when a `cleaningLog` document is created in Firestore.

**Current status:** The notification trigger is defined (the `notificationSent: false` flag
on each `cleaningLog`) but requires a Firebase Cloud Function to execute.

**To implement:**
```javascript
// functions/src/index.ts
exports.onCleaningLogCreated = functions.firestore
  .document('cleaningLogs/{logId}')
  .onCreate(async (snap, context) => {
    const log = snap.data();
    // 1. Fetch customer's FCM token from customers/{log.customerId}
    // 2. Send push notification via admin.messaging().send(...)
    // 3. Update cleaningLogs/{logId} → notificationSent: true
  });
```

FCM tokens are registered via the `useFCM` hook in the customer mobile app
(`apps/mobile/hooks/useFCM.ts`).

---

## 5 — Firestore Collections Reference

| Collection | Contents |
|---|---|
| `customers` | Resident profiles — name, phone, societyId, unitNumber, vehicles[], subscriptionStatus |
| `workers` | Worker profiles — name, phone, assignedSocietyId, isOnline, rating, earnings |
| `societies` | Partner society records — name, address, towers[], cleaningSchedule, contactPerson |
| `cleaningLogs` | Individual car cleaning events — workerId, customerId, vehicleRegistration, cleanedAt |
| `bookings` | Premium add-on bookings — customerId, workerId, serviceIds[], status, priceBreakdown |
| `promotions` | Promo codes — code, discountType, discountValue, validFrom/Until |

---

## 6 — Key URLs

| URL | Purpose |
|---|---|
| `perfectcleaners.in` | Marketing site (home, services, for-societies, plans, contact) |
| `perfectcleaners.in/for-societies` | RWA / society manager pitch page |
| `perfectcleaners.in/plans` | Subscription plan selection for residents |
| `perfectcleaners.in/contact` | Contact / society listing enquiry form |
| `admin.perfectcleaners.in` | Admin dashboard (redirects to `/dashboard`) |
| `perfectcleaners.in/worker/login` | Worker web portal login |

---

## 7 — Updating This Guide

Update this file when any of the following change:
- Subscription pricing or plan structure
- Onboarding steps or required fields
- Society listing process (e.g. if RWA starts paying a platform fee)
- Notification delivery mechanism
- Admin workflows (new pages, changed routes)
- New user types or roles

Last updated: 2026-05-31
