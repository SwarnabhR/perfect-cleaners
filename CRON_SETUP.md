# Cron Jobs Setup Guide

This guide explains how to set up automated tasks using **cron-jobs.org** (a free cron scheduling service).

## Overview

We have 7 automated tasks that need to run on a schedule:

| Task | Schedule | Endpoint | Purpose |
|------|----------|----------|---------|
| **Generate Sessions** | Every Sunday 11 PM | `/api/cron/generate-sessions` | Create cleaning sessions for next week |
| **Weekly Reminders** | Every Sunday 11:30 PM | `/api/cron/weekly-reminders` | Send "Cleaning reminder: Mon/Wed/Fri" SMS |
| **Payment Reminders** | 25th of month, 10 AM | `/api/cron/payment-reminders` | Send "Payment due: ₹500" SMS |
| **Monthly Billing** | 1st of month, 12:01 AM | `/api/cron/monthly-billing` | Create billing records, set payment status to pending, send due-notice SMS |
| **Process Cleaning Logs** | Every 5 minutes | `/api/cron/process-cleaning-logs` | Bill unbilled cleaning logs to `outstandingBalance`, notify customers |
| **Cleanup Sessions** | Nightly 00:30 IST | `/api/cron/cleanup-sessions` | Auto-close stale `inprogress` cleaning sessions from a prior day |
| **Reset Earnings** | Daily 00:00 IST | `/api/cron/reset-earnings` | Reset each worker's `carsCompletedToday` counter |

**Process Cleaning Logs is the most operationally critical of the seven** — it's what actually charges a customer and notifies them after a car is cleaned. If it isn't registered on cron-jobs.org, cleanings happen but nobody gets billed or told.

---

## Step 1: Set Environment Variables

Add to `.env.local` (web app) or your Vercel environment:

```env
CRON_SECRET=your-super-secret-key-here-change-this
```

Generate a strong secret:
```bash
openssl rand -hex 32
# Output example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Important:** Use the same secret for all cron jobs. Requests without the correct secret will be rejected (401 Unauthorized).

---

## Step 2: Create Cron Jobs on cron-jobs.org

### Sign Up
1. Go to [cron-jobs.org](https://cron-jobs.org)
2. Sign up with email
3. Verify email

### Create Job #1: Generate Sessions

1. Click **"Create Cron Job"**
2. Fill in:
   - **Title:** `Generate Cleaning Sessions`
   - **URL:** `https://your-domain.com/api/cron/generate-sessions?secret=your-secret-key`
   - **Schedule:** Every week on Sunday at 23:00 (11 PM)
     - Or use cron expression: `0 23 * * 0`
   - **Timeout:** 60 seconds
3. Click **"Create"**

### Create Job #2: Weekly Reminders

1. Click **"Create Cron Job"**
2. Fill in:
   - **Title:** `Weekly Cleaning Reminders`
   - **URL:** `https://your-domain.com/api/cron/weekly-reminders?secret=your-secret-key`
   - **Schedule:** Every week on Sunday at 23:30 (11:30 PM)
     - Or use cron expression: `30 23 * * 0`
   - **Timeout:** 60 seconds
3. Click **"Create"**

### Create Job #3: Payment Reminders

1. Click **"Create Cron Job"**
2. Fill in:
   - **Title:** `Payment Reminders`
   - **URL:** `https://your-domain.com/api/cron/payment-reminders?secret=your-secret-key`
   - **Schedule:** 25th of every month at 10:00 AM
     - Or use cron expression: `0 10 25 * *`
   - **Timeout:** 60 seconds
3. Click **"Create"**

### Create Job #4: Monthly Billing

1. Click **"Create Cron Job"**
2. Fill in:
   - **Title:** `Monthly Billing`
   - **URL:** `https://your-domain.com/api/cron/monthly-billing?secret=your-secret-key`
   - **Schedule:** 1st of every month at 00:01 AM
     - Or use cron expression: `1 0 1 * *`
   - **Timeout:** 60 seconds
3. Click **"Create"**

### Create Job #5: Process Cleaning Logs

1. Click **"Create Cron Job"**
2. Fill in:
   - **Title:** `Process Cleaning Logs`
   - **URL:** `https://your-domain.com/api/cron/process-cleaning-logs?secret=your-secret-key`
   - **Schedule:** Every 5 minutes
     - Or use cron expression: `*/5 * * * *`
   - **Timeout:** 60 seconds
3. Click **"Create"**

### Create Job #6: Cleanup Sessions

1. Click **"Create Cron Job"**
2. Fill in:
   - **Title:** `Cleanup Sessions`
   - **URL:** `https://your-domain.com/api/cron/cleanup-sessions?secret=your-secret-key`
   - **Schedule:** Nightly at 00:30 IST (19:00 UTC)
     - Or use cron expression: `0 19 * * *`
   - **Timeout:** 60 seconds
3. Click **"Create"**

### Create Job #7: Reset Earnings

1. Click **"Create Cron Job"**
2. Fill in:
   - **Title:** `Reset Earnings`
   - **URL:** `https://your-domain.com/api/cron/reset-earnings?secret=your-secret-key`
   - **Schedule:** Daily at 00:00 IST (18:30 UTC)
     - Or use cron expression: `30 18 * * *`
   - **Timeout:** 60 seconds
3. Click **"Create"**

---

## Step 3: Verify Jobs Are Working

### Check Status on cron-jobs.org
1. Go to your dashboard
2. Each job shows:
   - Last execution time
   - HTTP status code (200 = success)
   - Response time

### Check Firestore
- For sessions: Look in `cleaningSessions` collection
- For billing: Look in `billingRecords` collection
- For notifications: Look in `notifications` collection (if SMS enabled)

### Check Logs
Go to `/api/cron/[job-name]` and look for `console.log` output in:
- Next.js dev server logs (if running locally)
- Vercel deployment logs (if deployed to Vercel)

---

## What Each Job Does

### `/api/cron/generate-sessions` (Sunday 11 PM)

**Process:**
1. Read all `societyBillingConfig` entries
2. For each society + tower:
   - Get all active customers in that tower
   - Get cleaning schedule (e.g., "Mon, Wed, Fri")
   - Create `CleaningSession` for each cleaning day
   - Add each customer's car to the session
   - Exclude customers who have `skipDates` for that day

**Creates:** `cleaningSessions` documents

**Example:**
```
Society: Uniworld City, Tower A
Schedule: Mon, Wed, Fri
Date: Monday, June 10
Cars: 298 residents
Status: scheduled (awaiting worker assignment)
```

---

### `/api/cron/weekly-reminders` (Sunday 11:30 PM)

**Process:**
1. Get all active customers
2. For each customer:
   - Check if they have skip dates this week
   - If not skipped: Send SMS reminder
   - Message: "🧹 Cleaning reminder: Your car will be cleaned Mon/Wed/Fri"

**Creates:** `notifications` documents (status: sent)

---

### `/api/cron/payment-reminders` (25th of month, 10 AM)

**Process:**
1. Get all customers with `paymentStatus: 'pending_payment'`
2. Send SMS: "💳 Payment reminder: ₹500 due for this month's cleanings. Call us to pay."
3. Log notification sent

**Creates:** `notifications` documents (status: sent)

---

### `/api/cron/monthly-billing` (1st of month, 12:01 AM)

**Process:**
1. Get all active customers
2. For each customer:
   - Create `billingRecord` for this month
   - Update `paymentStatus` to `'pending_payment'`
   - Set `nextBillingDate` to 1st of next month
   - Send payment reminder SMS (optional)

**Creates:** `billingRecords` documents

**Example:**
```
Customer: Rajesh Kumar
Society: Uniworld City, Tower A
Amount: ₹500
Status: pending
Due: June 5 (5 days from billing date)
```

---

## Troubleshooting

### Jobs Not Running?

1. **Check cron-jobs.org dashboard:**
   - Log in and verify jobs are enabled (green toggle)
   - Check "Last Execution" time

2. **Verify URL is correct:**
   - Test manually: `curl "https://your-domain.com/api/cron/generate-sessions?secret=YOUR-SECRET"`
   - Should get HTTP 200 with JSON response

3. **Check environment variables:**
   ```bash
   echo $CRON_SECRET  # Should print your secret
   ```

4. **Check Firebase credentials:**
   - Make sure `.env.local` has all `NEXT_PUBLIC_FIREBASE_*` variables
   - Test connection: Deploy to production first

### Job Runs But No Data?

1. **Check Firestore:**
   - Go to Firebase Console → Firestore Database
   - Verify collections exist and have documents

2. **Check logs:**
   - For Vercel: Go to Deployment → Functions logs
   - For local: Check Next.js dev server console

3. **Check cron response:**
   - On cron-jobs.org dashboard, click job → "View Response"
   - Should show `{ success: true, ... }`

### Getting 401 Unauthorized?

1. **Secret mismatch:**
   - URL secret must match `.env.local` CRON_SECRET
   - Example: If env says `CRON_SECRET=abc123`, URL must have `?secret=abc123`

2. **Missing environment variable:**
   - Add `CRON_SECRET` to `.env.local`
   - Restart Next.js dev server
   - If on Vercel, add to Project Settings → Environment Variables

---

## SMS Integration

SMS is sent via 91msg (`NINEONE_MSG_API_KEY` / `NINEONE_MSG_SENDER_ID` in env) through the shared `sendAndStoreSMS` helper in `src/lib/notify-sms.ts`. `weekly-reminders`, `payment-reminders`, and `monthly-billing` all call it directly (not via HTTP — they're server-to-server, so they skip the `/api/notification/send` round-trip and call the same underlying function it uses). Every send, successful or not, is logged to the `notifications` collection for the admin Notifications history page.

If `NINEONE_MSG_API_KEY`/`NINEONE_MSG_SENDER_ID` aren't set, sends fail gracefully (logged as `status: 'failed'`, cron job still completes) rather than throwing.

---

## Advanced: Custom Schedules

cron-jobs.org supports cron expressions. Examples:

| Expression | Meaning |
|-----------|---------|
| `0 23 * * 0` | Every Sunday at 11 PM |
| `30 23 * * 0` | Every Sunday at 11:30 PM |
| `0 10 25 * *` | 25th of every month at 10 AM |
| `1 0 1 * *` | 1st of every month at 12:01 AM |
| `0 9 * * 1` | Every Monday at 9 AM |
| `0 */4 * * *` | Every 4 hours |

---

## Monitoring

**Best Practices:**

1. **Set email notifications:**
   - On cron-jobs.org, enable "Email on failure"
   - Get alerts if a job fails

2. **Check status weekly:**
   - Log in to dashboard every Monday
   - Verify all jobs ran successfully

3. **Monitor Firestore:**
   - Verify `cleaningSessions` are created each week
   - Verify `billingRecords` are created on 1st

4. **Test manually (once a month):**
   - Run jobs manually from dashboard (test button)
   - Verify expected behavior

---

## Questions?

- **cron-jobs.org help:** https://cron-jobs.org/help
- **Cron expression builder:** https://crontab.guru
- **Firebase docs:** https://firebase.google.com/docs/firestore
