# Perfect Cleaners Web — Persona & Workflow Audit

**Scope:** `apps/web` only. This is a source-code and permissions audit made on
2026-08-18; it does not describe the mobile app and it cannot measure real user
adoption. “Low-use candidate” therefore means *poorly connected, disabled, or
placeholder functionality in the web code*, not a claim based on analytics.

## Product model at a glance

The web application operates a society-based car-cleaning programme. An admin
sets up societies, towers, pricing and workers; a customer requests and manages
an enrolment; scheduled cleaning sessions are created for a tower; an assigned
worker marks individual cars clean. The completion event feeds the customer's
history/rating, notifications and billing processes.

```
Admin configures society/tower + roster + price
    -> customer enrolment is approved
    -> scheduled session is generated
    -> assigned worker marks a car clean
    -> cleaning log, notification and billing records are processed
```

The operational model is not currently a self-serve online subscription. Online
Razorpay routes explicitly return “temporarily unavailable”; collection is
described in the web wallet as a phone-payment process.

## Access summary

| Area / data | Customer | Worker | Admin |
|---|---|---|---|
| Own profile, address and notifications | Read and update own data | No | Full access |
| Customer enrolment and schedule preferences | Create own request; read and update own record’s permitted preferences | No | Approve, edit and manage all |
| Cleaning sessions | Receives a customer-safe “today” view | Read/update only sessions assigned to them | Create, assign, update and delete |
| Cleaning logs | Read own logs; submit a rating through the server route | Create own logs; read own logs | Full access |
| Premium bookings | Create/read own; may only cancel own booking | Read/update assigned jobs | Full access |
| Societies, tower pricing and workers | Read society information needed for their flow | Read assigned profile/sessions | Full administration |
| Billing records, payment logs and settings | No direct access | No | Full access |
| Support messages | Read/write own conversation | No dedicated web inbox | Read/write all conversations |

The table reflects the Firestore rules plus the web UI/API paths. Admin access is
based on an authenticated `/admins/{uid}` record. Workers cannot browse other
workers’ profiles, customer records, or unassigned sessions.

---

## Persona 1 — Customer / society resident

### Primary objective

Get a car enrolled in the society programme, know when it will be cleaned,
control availability, and see clean/bill history.

### Web journey

1. Sign in with phone OTP at `/signin`.
2. Open **Schedule** (`/account/cleaning`). If not already enrolled, select the
   society/tower, provide vehicle/contact details, pick an eligible cleaning day
   and preferred time, then submit an approval request.
3. Wait for admin approval. Before approval, the resident can still maintain day
   and time preferences.
4. Once active, use the Schedule page to see today’s status and upcoming
   sessions. The resident can skip an upcoming clean, reschedule its time, or
   update ongoing preferences. The server synchronises changes to sessions that
   have not started yet.
5. After a worker completes a clean, view the log and submit a star rating.
   Notification delivery is processed asynchronously by the cleaning-log cron.
6. Use **Bookings** (`/account`) to review premium bookings; the customer can
   cancel only their own booking. Use **Profile** to edit profile details and
   **Bill** (`/account/wallet`) to see charges, payment history and society
   payment status.
7. For help, open the FAQ or send a complaint using the profile page’s email
   link.

### Customer features and boundaries

| Feature | What the customer can do | Important limitation |
|---|---|---|
| OTP sign-in | Sign in and return to the requested account page | Depends on the OTP provider being configured |
| Enrolment | Request a society/tower programme place | Cannot self-approve or alter billing configuration |
| Schedule control | Set preferred days/time; skip or reschedule future cleans | Cannot alter an already started session |
| Today and history | See own cleaning progress/logs and rate cleans | Cannot view other residents’ data |
| Premium booking | Create, view and cancel own bookings | No web booking route is exposed in the inspected route tree; booking creation may be API-led or from another client |
| Bill/wallet | View due status, charges and transactions | Customer online payment is disabled; collection is by phone/manual follow-up |
| Profile/support | Update own profile; use FAQ or email a complaint | No customer web support-chat interface was found |

### Pros

- The schedule is purpose-built for recurring society cleaning rather than
  making customers repeatedly book a wash.
- Residents retain practical control through skips, rescheduling and preferred
  days/times.
- Data access is constrained to the customer’s own profile, enrolment, logs,
  transactions and bookings.
- Completion has a traceable outcome: cleaning log, rateable service, notification
  record and bill flow.

### Cons / friction

- Approval introduces a wait before the service becomes active.
- Payment is not self-serve online despite a bill page; this can cause confusion
  and operational follow-up work.
- Premium booking is represented in permissions/data but has no evident customer
  web booking UI in the app routes.
- Support is an email handoff rather than a tracked in-product web conversation.

---

## Persona 2 — Worker

### Primary objective

See only assigned work, complete cars accurately during a session, correct a
mistake when allowed, and retain an auditable record.

### Web journey

1. Sign in at `/worker/login` using phone OTP. Role verification routes the user
   to the worker portal.
2. Open **Dashboard** (`/worker/dashboard`) to see live assigned sessions and
   cars due for cleaning. Cars are ordered by preferred time/urgency.
3. Mark an eligible car clean. The session API verifies that the worker is
   assigned to that session, writes a cleaning log, updates progress and starts
   or completes the session as appropriate.
4. Undo a mis-tap only through the supported short-window/session-specific
   action; this removes the associated clean log and recalculates state.
5. Use **Calendar** (`/worker/calendar`) for assigned-session history and
   **Cleans** (`/worker/cleaning-logs`) for completed work. Use **Profile** for
   permitted profile and preference updates or a complaint email link.

### Worker features and boundaries

| Feature | What the worker can do | Important limitation |
|---|---|---|
| Assigned dashboard | View their current tower/society work and car queue | Cannot see or claim unassigned sessions |
| Car completion | Mark a car clean and create their own log | Unavailable cars cannot be completed |
| Undo | Reverse an eligible mistaken completion | Restricted to the linked session and short correction window |
| Calendar and clean logs | Review own assignments and work history | No access to other workers’ history |
| Profile | Update allowed operational/preference fields | Cannot edit protected stats such as `totalJobs`, IDs or creation date |
| Notifications | Receive job-assignment and operational notifications | Delivery depends on FCM configuration/token availability |

### Pros

- The worker gets a focused portal with a small, role-specific navigation.
- Assignment checks are enforced server-side for session mutation, reducing the
  risk of completing somebody else’s work.
- Preferred time ordering helps workers make sensible on-site decisions.
- The correction path is safer than treating an accidental completion as final.

### Cons / friction

- Workers cannot resolve assignment, pricing, customer eligibility or billing
  exceptions themselves; they must involve an admin.
- A web-only workflow requires reliable mobile browser connectivity on-site.
- There is no visible worker-to-admin in-product support queue; complaints use
  email.
- The portal does not expose a dedicated earnings page in the inspected web
  navigation, despite operational data such as clean counts existing.

---

## Persona 3 — Admin / operations team

### Primary objective

Configure the service, approve residents, staff sessions, supervise cleans,
collect payments and communicate with customers/workers.

### Recommended operating workflow

1. **Set up a society** — In **Societies** (`/societies-mgmt`), create/update
   society details and towers. Set whether it is active and maintain the tower
   worker roster.
2. **Set commercial rules** — In **Tower Billing** (`/tower-billing`), define
   tier prices, billing frequency (monthly, one-time or per-day), eligible
   cleaning days, cleaning schedule and optional deep-clean add-on per tower.
3. **Create and assign workers** — In **Workers** (`/workers`), create workers,
   inspect operational information and assign them to applicable societies/towers.
4. **Approve residents** — Review each application in **Approvals**
   (`/pending-approvals`). Verify payment/notes, approve or manage the request;
   approval creates/updates the active customer-society record and derives
   pricing/schedule from tower configuration. Use **Enrollments**
   (`/customer-enrollments`) for the active record list and manual customer
   management.
5. **Plan cleaning work** — Use **Schedule** (`/cleaning-schedule`) to create
   and assign cleaning sessions. The weekly generation cron also creates future
   sessions from active tower configuration and enrolments.
6. **Run the day** — Watch **Live Cleaning** (`/live-cleaning`) for real-time
   session progress and **Cleaning Logs** (`/cleaning-logs`) to investigate
   completed work, customer questions or worker performance.
7. **Collect and reconcile** — In **Billing** (`/billing`), track generated
   billing records and mark/verify payment operations. The monthly billing cron
   creates pending bills and SMS reminders; per-day pricing meters cleaning logs.
8. **Communicate and maintain** — Use **Notifications** (`/notifications`) for
   delivery history/administrative sends, **Customers** (`/customers`) for
   customer data lookup, **Dashboard** for operational overview and **Settings**
   for operator configuration.

### Admin access and responsibility map

| Admin area | Operational responsibility |
|---|---|
| Dashboard | Review high-level operating state before drilling into exceptions |
| Societies + Tower Billing | Keep tower list, schedules, rosters and commercial terms accurate before approving customers |
| Approvals + Enrollments | Verify eligibility/payment notes and prevent duplicate/incorrect active records |
| Schedule + Live Cleaning | Ensure sessions exist, have workers, and are progressing on the correct day |
| Cleaning Logs + Customers | Resolve “was my car cleaned?” disputes from source records |
| Workers | Provision identities and keep assignments current |
| Billing | Reconcile calls/manual collection with monthly, one-time or per-day billing records |
| Notifications | Audit outgoing SMS/push communication and failures |
| Settings | Restrict changes to authorised operators only |

### Pros

- The web console covers the full operational chain from society configuration to
  completion evidence and billing.
- Tower-level configuration allows one society to operate different schedules,
  prices and rosters.
- Approval is a useful control point: customers do not become billable active
  records merely by submitting a request.
- Admin rules give operations full access while normal roles remain scoped to
  their own data.

### Cons / operational risk

- The workflow is admin-heavy: society setup, roster maintenance, approval and
  manual collection all require ongoing intervention.
- Several critical outcomes depend on external cron jobs. If session generation,
  log processing or monthly billing is not configured/running, cleaning may occur
  without a customer notification or correct bill record.
- Billing documents are created automatically, but payment collection is still
  manual/phone-led.
- The top-bar search currently only navigates to Live Cleaning; it does not pass
  or execute the entered query. The top-bar Alerts panel is static (“No new
  alerts.”).

---

## Feature usefulness audit

### High-value features to protect

| Feature | Why it matters |
|---|---|
| Tower configuration + approvals | Establishes who should be cleaned, when and at what commercial terms |
| Assigned live sessions + completion log | The source of truth for daily service delivery |
| Customer skip/reschedule | Prevents wasted worker visits and improves resident control |
| Cleaning-log processor | Produces post-clean notifications and usage-based charges where applicable |
| Live Cleaning / Cleaning Logs | Gives operations evidence to act on missed-service complaints |

### Weak, incomplete or low-use candidates

These items should be validated with product analytics and operator interviews
before removal. They are candidates because the web implementation is disabled,
unwired or materially weaker than its UI suggests.

| Feature | Audit evidence | Recommendation |
|---|---|---|
| Online payment / “Pay now” expectations | `/api/payment/create-order`, `/verify` and `/settle-balance` explicitly return that online payment is unavailable; the web wallet says the team collects by phone. | Hide or relabel online-payment affordances until Razorpay is live; make “contact us to pay” the clear primary action. |
| Admin top-bar search | Submit simply routes to `/live-cleaning` and discards the text. | Implement real filtering/search or remove the field to avoid false expectation. |
| Admin Alerts dropdown | Hard-coded “No new alerts.” content, not connected to notification data. | Connect it to actionable failures/approvals or remove it. |
| Premium bookings on web | Bookings are authorised in rules and visible in account data, but no customer-facing booking page appears in the inspected web route tree. | Either add the web booking flow or remove/clarify web copy that suggests self-service booking. |
| Customer support chat | Support data is permissioned, but no customer web chat route is present; web profile only provides `mailto:` complaint support. | Decide on email support or build an agent inbox and customer web chat; do not maintain an unused support data model. |
| Worker notifications | Assignment notification route and FCM support exist, but delivery is token/configuration dependent and there is no obvious worker web notification centre. | Instrument delivery and add a web-visible fallback/inbox before relying on pushes. |
| Legacy documentation claims | `GUIDE.md` describes a self-service weekly/monthly subscription and Razorpay activation that do not match current web code. | Update or archive it; make this audit/the future operations guide the source of truth. |

## Key risks and next decisions

1. Choose one billing experience: fully launch Razorpay, or standardise every
   customer-facing web message around manual collection. The current hybrid is
   confusing.
2. Add production monitoring for all seven cron tasks and alert operations on a
   missed or failed run. The session/log/billing chain depends on them.
3. Define a single owner and response process for support messages/complaints.
4. Instrument page views and completion funnels before judging actual adoption of
   offers, notifications, support and premium bookings. This code audit cannot
   establish usage counts.
5. Replace the old guide’s subscription claims with the active society-enrolment
   workflow and keep future documentation tied to the web route inventory.

## Audit basis

- Web routes and navigation under `apps/web/src/app`
- Role-aware Firestore permissions in `firestore.rules`
- Session, notification and payment API routes under `apps/web/src/app/api`
- Cron dependency and operational schedule in `CRON_SETUP.md`

