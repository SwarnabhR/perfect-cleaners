# Twilio SMS Setup Guide

This guide explains how to set up SMS delivery via Twilio for the Perfect Cleaners application.

## Overview

We use **Twilio** to send SMS notifications to customers:
- Approval notifications
- Car cleaned notifications
- Weekly cleaning reminders
- Payment reminders

---

## Step 1: Create Twilio Account

### 1. Sign Up
1. Go to [twilio.com](https://www.twilio.com)
2. Click **"Sign Up"**
3. Enter email and password
4. Verify phone number (they'll call/SMS you)

### 2. Get Free Trial Credit
- Free account includes **$15 credit** (enough for ~1500 SMS)
- SMS to India costs ~₹1 each
- Sufficient to test thoroughly

### 3. Get Account Credentials
1. Go to **Console Dashboard**: https://console.twilio.com
2. Find your:
   - **Account SID** (looks like: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token** (looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
3. Copy both values

### 4. Buy a Phone Number
1. In Console, go to **Phone Numbers → Manage → Buy a Number**
2. Select:
   - Country: **United States** (SMS to India still works)
   - Number Type: **SMS-capable**
3. Click on any number
4. Review and click **"Buy"** (costs ~$1/month, charged to credit)
5. Your number is now active

**Note:** You can also use a number from other countries. US numbers work fine for sending SMS to India.

---

## Step 2: Add Environment Variables

Add these to `.env.local` (web app):

```env
# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

**Format for phone number:**
- Use E.164 format: `+[country code][number]`
- Example US: `+14155552671`
- Example India: `+919876543210`
- Example UK: `+441632960000`

### For Vercel Deployment

1. Go to **Vercel Dashboard → Project Settings → Environment Variables**
2. Add same three variables
3. Select environments: **Production** (and Preview if testing)
4. Click **"Save"**
5. Redeploy with `git push`

---

## Step 3: Verify SMS Setup

### Test Locally

```bash
# Start Next.js dev server
npm run dev

# In another terminal, test SMS endpoint
curl -X POST http://localhost:3000/api/notification/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "approval",
    "recipientPhone": "+919876543210",
    "recipientName": "Rajesh Kumar",
    "data": {
      "schedule": "Mon, Wed, Fri",
      "startDate": "Jun 10"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "notificationId": "approval_...",
  "message": "✅ Approved! Your car will be cleaned every Mon, Wed, Fri starting Jun 10",
  "messageId": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

### Test on Vercel

1. Deploy to Vercel: `git push`
2. Wait for deployment to complete
3. Test API:
```bash
curl -X POST https://your-domain.com/api/notification/send \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## Step 4: Monitor SMS Delivery

### Check Twilio Console

1. Go to **Console → Messaging → Logs**
2. See all SMS sent/received
3. Check status: `delivered`, `failed`, `undelivered`

### Check Firestore

1. Firebase Console → Firestore Database
2. Collection: `notifications`
3. View recent documents:
   - `status`: "sent" or "failed"
   - `messageId`: Twilio message SID
   - `error`: if failed
   - `sentAt`: timestamp

### Monitor Costs

1. Go to **Console → Billing**
2. See current usage and remaining credit
3. Overage rate: ~$0.0075 per SMS to India (~₹0.62)

---

## Troubleshooting

### SMS Not Sending?

**Check 1: Environment Variables**
```bash
# Verify env vars are set
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_PHONE_NUMBER
```

If empty, you forgot to set them in `.env.local`.

**Check 2: Phone Number Format**
- Must be E.164 format: `+91XXXXXXXXXX`
- Your app normalizes: `9876543210` → `+919876543210`
- But if customer enters `+919876543210` directly, it should work

**Check 3: Account Suspended**
- Go to Twilio Console
- Check if account is active (not suspended)
- Check if trial credit is expired

**Check 4: Rate Limiting**
- If sending 100+ SMS/minute, Twilio may rate-limit
- Built-in delay: 1 SMS per second is safe

**Check 5: Invalid Phone**
- Twilio rejects if number doesn't look valid
- Example: `+1` (no digits after country code) fails

### SMS Delivered but Customer Didn't Receive?

1. **Check Twilio logs** for delivery status
2. **Verify phone number** with customer
3. **Check customer's SMS settings** (not blocking numbers)
4. **Wait 5 minutes** (SMS can take time)

### "Twilio credentials not configured"?

1. You forgot to add env variables
2. Or typo in variable name (must be exact: `TWILIO_ACCOUNT_SID`)
3. On Vercel, redeploy after adding env vars: `git push`

### Getting HTTP 401 from Twilio?

1. Account SID is wrong
2. Auth Token is wrong
3. Copy directly from Twilio Console (don't retype)

---

## Advanced: Upgrading from Trial

### When to Upgrade

- Free $15 credit runs out (~1500 SMS)
- Want to send SMS beyond US

### Upgrade Steps

1. Go to **Console → Billing → Settings**
2. Click **"Upgrade Account"**
3. Add credit card
4. Set monthly budget (recommended: $50-100/month)
5. Enjoy unlimited SMS!

### Pricing for India

- Outbound SMS to India: ~$0.0075 per SMS (₹0.62)
- Inbound SMS from India: Free
- Phone number: ~$1/month

For 300 customers × 4 SMS/month = 1200 SMS = ~$9/month

---

## Testing Checklist

Before going live, test:

- [ ] Approval SMS: "✅ Approved!"
- [ ] Car cleaned SMS: "✨ Your car is clean!"
- [ ] Weekly reminder: "🧹 Cleaning reminder..."
- [ ] Payment reminder: "💳 Payment due..."
- [ ] Phone numbers with different formats:
  - [ ] `+919876543210` (E.164)
  - [ ] `919876543210` (no +)
  - [ ] `9876543210` (no country code)
- [ ] Check Twilio logs for delivery status
- [ ] Check Firebase notifications collection
- [ ] Monitor costs in Twilio billing

---

## Integration Points

SMS is automatically sent from:

1. **Approval Page** (`/pending-approvals`)
   - When admin clicks "Approve"
   - Sends: "Approved! Starting [date]"

2. **Cron: Weekly Reminders** (`/api/cron/weekly-reminders`)
   - Every Sunday 11:30 PM
   - Sends: "Cleaning reminder: Mon/Wed/Fri"

3. **Cron: Monthly Billing** (`/api/cron/monthly-billing`)
   - 1st of month 12:01 AM
   - Sends: (optional, currently disabled)

4. **Cron: Payment Reminders** (`/api/cron/payment-reminders`)
   - 25th of month 10 AM
   - Sends: "Payment due: ₹500"

All SMS are logged to Firestore `notifications` collection.

---

## API Reference

### Send SMS Programmatically

```typescript
import { sendSMSViaTwilio, normalizePhoneNumber } from '@/lib/twilio';

// Normalize phone
const phone = normalizePhoneNumber('9876543210'); // → +919876543210

// Send SMS
const result = await sendSMSViaTwilio(
  phone,
  'Hello! Your car is clean. -Perfect Cleaners'
);

if (result.success) {
  console.log('Message ID:', result.messageId);
} else {
  console.error('Failed:', result.error);
}
```

### Check Message Status

```typescript
import { checkSMSStatus } from '@/lib/twilio';

const status = await checkSMSStatus('SMxxxxxxxxxxx');
// Returns: 'queued' | 'sending' | 'sent' | 'failed' | 'delivered' | etc.
```

---

## Support

- **Twilio Docs:** https://www.twilio.com/docs/sms/api
- **Twilio Support:** https://www.twilio.com/help
- **Status Page:** https://status.twilio.com
- **Community:** https://stackoverflow.com/questions/tagged/twilio

---

## Next Steps

1. ✅ Set up Twilio account
2. ✅ Get credentials
3. ✅ Buy phone number
4. ✅ Add env variables
5. ✅ Test SMS
6. ✅ Deploy to Vercel
7. ✅ Monitor in Twilio Console

Then you're ready to send SMS notifications! 🚀
