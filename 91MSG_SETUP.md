# 91msg SMS Setup Guide

This guide explains how to set up SMS delivery via **91msg** — an Indian SMS gateway that's cheaper and faster for India than Twilio.

## Why 91msg?

| Feature | Twilio | 91msg |
|---------|--------|-------|
| **Cost per SMS** | ~$0.0075 (₹0.62) | ₹0.20-0.50 |
| **Delivery in India** | Good | Excellent |
| **Setup time** | 5 min | 2 min |
| **Support** | International | India-focused |
| **Bulk discounts** | Limited | Very good |

**For 300 customers × 4 SMS/month = 1200 SMS:**
- Twilio: ~$9/month
- 91msg: ~₹240-600/month ($3-7)

91msg is **10x cheaper** for India! 💰

---

## Step 1: Create 91msg Account

### 1. Sign Up
1. Go to [91msg.com](https://www.91msg.com)
2. Click **"Register"**
3. Enter email and password
4. Verify email

### 2. Add Credit

**Option A: Pay Per SMS (Easy)**
- Go to Wallet → Add Balance
- Add ₹500 (~1000 SMS at ₹0.50 each)
- Credit appears instantly

**Option B: Bulk Package (Cheaper)**
- 500 SMS: ₹99 (₹0.20 each)
- 1000 SMS: ₹199 (₹0.20 each)
- 5000 SMS: ₹899 (₹0.18 each)
- Buy from "Packages" section

### 3. Get API Credentials

1. Go to **Settings → API**
2. Find your:
   - **API Key** (alphanumeric string)
3. Copy it (you'll need this)

### 4. Create Sender ID

1. Go to **Settings → Sender ID**
2. Click **"Add Sender ID"**
3. Enter: `PCWASH` (or your brand name)
4. Wait for approval (usually 5-10 minutes)
5. Once approved, use in environment variable

---

## Step 2: Add Environment Variables

Replace Twilio variables with 91msg variables in `.env.local`:

```env
# Remove Twilio (optional, but cleanup):
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
# TWILIO_PHONE_NUMBER=...

# Add 91msg:
SMS_PROVIDER=91msg
NINEONE_MSG_API_KEY=your_api_key_here
NINEONE_MSG_SENDER_ID=PCWASH
```

### For Vercel Deployment

1. Go to **Vercel Dashboard → Project Settings → Environment Variables**
2. Update/add:
   - `SMS_PROVIDER` = `91msg`
   - `NINEONE_MSG_API_KEY` = your key
   - `NINEONE_MSG_SENDER_ID` = PCWASH
3. Remove Twilio variables (optional)
4. Click **"Save"**
5. Redeploy: `git push`

---

## Step 3: Verify SMS Setup

### Test Locally

```bash
# Start Next.js dev server
npm run dev

# Test SMS endpoint
curl -X POST http://localhost:3000/api/notification/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "approval",
    "recipientPhone": "9876543210",
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
  "messageId": "12345678"
}
```

### Test on Vercel

1. Deploy: `git push`
2. Test API:
```bash
curl -X POST https://your-domain.com/api/notification/send \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## Step 4: Monitor Delivery

### Check 91msg Console

1. Log in to [91msg.com](https://www.91msg.com)
2. Go to **Dashboard → SMS Logs**
3. See all SMS sent:
   - Status: Delivered, Failed, Pending
   - Timestamp
   - Phone number
   - Message content

### Check Firestore

1. Firebase Console → Firestore Database
2. Collection: `notifications`
3. View documents:
   - `status`: "sent" or "failed"
   - `messageId`: 91msg message ID
   - `sentAt`: timestamp

### Monitor Balance

1. 91msg Dashboard → Wallet
2. See current balance (updates in real-time)
3. Get low-balance alert (usually at ₹50)

---

## Troubleshooting

### SMS Not Sending?

**Check 1: Environment Variable**
```bash
echo $SMS_PROVIDER        # Should be "91msg"
echo $NINEONE_MSG_API_KEY # Should show your key
echo $NINEONE_MSG_SENDER_ID # Should show "PCWASH"
```

If empty, you forgot to set in `.env.local`.

**Check 2: API Key Is Correct**
- Go to 91msg Console → Settings → API
- Copy key exactly (don't add spaces)
- Paste in `.env.local`

**Check 3: Sender ID Is Approved**
- Go to 91msg → Settings → Sender ID
- Should show "Approved" status
- If "Pending", wait 5-10 minutes

**Check 4: Account Has Balance**
- Go to 91msg → Wallet
- Balance should be > 0
- If not, add ₹500 credit

**Check 5: Phone Number Format**
- 91msg accepts: `9876543210` (10 digits)
- Our code converts: `+919876543210` → `919876543210`
- This is correct!

### SMS Delivered But Content Wrong?

- Check 91msg SMS Logs for actual message sent
- Verify message is < 160 characters (else split into multiple SMS)
- Some emojis (✅, 🧹, 💳) may not display correctly
  - Replace with text alternatives if needed

### Getting "Invalid API Key"?

1. Log out of 91msg, log in again
2. Copy API key freshly from Settings
3. Paste (don't retype)
4. Restart dev server or redeploy

### Getting "Sender ID Not Approved"?

1. Go to 91msg → Settings → Sender ID
2. Click **"Add"** if not there
3. Enter your brand name
4. Wait 5-10 minutes for approval
5. Check again

### Low Balance Alert?

1. Go to 91msg → Wallet
2. Click **"Add Balance"**
3. Pay ₹500-1000
4. Credit appears instantly
5. Can now send more SMS

---

## Pricing & Billing

### SMS Costs (₹ per SMS)

| Plan | Cost | Min Order |
|------|------|-----------|
| Pay-as-you-go | ₹0.50 | ₹100 |
| 500 SMS pack | ₹0.20 | ₹99 |
| 1000 SMS pack | ₹0.20 | ₹199 |
| 5000 SMS pack | ₹0.18 | ₹899 |

### Estimated Monthly Cost

**For 300 customers, 4 SMS/month:**

- 1200 SMS × ₹0.20 = **₹240/month**
- Or quarterly: ₹720 per 3 months
- **Savings vs Twilio: ~₹500-700/month**

### Free Trial?

- No formal trial, but start with ₹100
- Enough to test 200 SMS
- Refund available if unused (contact support)

---

## Advanced: Bulk Messaging

91msg has features for bulk SMS:

1. **CSV Upload:** Upload phone numbers + messages
2. **Scheduled:** Send at specific time/date
3. **Templates:** Save message templates
4. **Reports:** Detailed delivery reports

For now, we use the API directly. Later you could automate bulk sends.

---

## API Reference

### Send SMS via Code

```typescript
import { sendSMSVia91msg, normalizePhoneFor91msg } from '@/lib/91msg';

// Normalize phone (any format → 919876543210)
const phone = normalizePhoneFor91msg('9876543210');

// Send SMS
const result = await sendSMSVia91msg(
  phone,
  'Hello! Your car is clean. -Perfect Cleaners'
);

if (result.success) {
  console.log('Message ID:', result.messageId);
} else {
  console.error('Failed:', result.error);
}
```

### Phone Number Formats Accepted

```
+919876543210  → 919876543210 ✓
919876543210   → 919876543210 ✓
9876543210     → 919876543210 ✓
+91-9876543210 → 919876543210 ✓
```

---

## Switch Between Providers

You can use both Twilio and 91msg! Just change `SMS_PROVIDER`:

```env
# Use 91msg (Indian, cheaper)
SMS_PROVIDER=91msg
NINEONE_MSG_API_KEY=...
NINEONE_MSG_SENDER_ID=...

# OR use Twilio (International)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

The API automatically chooses based on `SMS_PROVIDER` env var. 🔄

---

## Testing Checklist

Before going live, test:

- [ ] SMS sent successfully: Check 91msg logs
- [ ] Approval SMS: "✅ Approved!"
- [ ] Weekly reminder: "🧹 Cleaning reminder..."
- [ ] Payment reminder: "💳 Payment due..."
- [ ] Phone numbers work:
  - [ ] `9876543210` (10 digits)
  - [ ] `919876543210` (with country code)
  - [ ] `+919876543210` (E.164 format)
- [ ] Firestore notifications updated
- [ ] Balance decremented correctly

---

## Support

- **91msg Help:** https://www.91msg.com/support
- **91msg Documentation:** https://www.91msg.com/docs
- **Email Support:** support@91msg.com (usually replies in 1 hour)

---

## Next Steps

1. ✅ Create 91msg account
2. ✅ Add credit (₹500)
3. ✅ Get API key
4. ✅ Create Sender ID
5. ✅ Set environment variables
6. ✅ Test SMS
7. ✅ Deploy to Vercel
8. ✅ Monitor in 91msg console

**You're all set!** 🚀 SMS via 91msg is now active and much cheaper than Twilio! 💰
