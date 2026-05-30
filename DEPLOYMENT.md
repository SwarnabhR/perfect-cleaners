# Deployment Checklist

## Web — Vercel

### 1. Connect repo
Import `perfect-cleaners` in Vercel. Set:
- **Framework preset**: Next.js
- **Root directory**: `apps/web`
- **Build command**: `npm run build` (default)
- **Output**: `.next` (default)

### 2. Environment variables
Set all of these in **Project Settings → Environment Variables**.
Mark each as **Production** + **Preview** as appropriate.

| Variable | Where to get it | Env |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase console → Project settings → Web app | All |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | same | All |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | same | All |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | same | All |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | same | All |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | same | All |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | same (optional — GA4) | All |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase console → Service accounts | All |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase console → Service accounts | All |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase console → Service accounts → Generate new key | All |
| `NEXT_PUBLIC_MSG91_WIDGET_ID` | msg91.com → OTP → Widget | All |
| `NEXT_PUBLIC_MSG91_WIDGET_TOKEN` | msg91.com → OTP → Widget | All |
| `MSG91_AUTH_KEY` | msg91.com → API → Auth Key | All |
| `RAZORPAY_KEY_ID` | dashboard.razorpay.com → API Keys | Production = live key; Preview = test key |
| `RAZORPAY_KEY_SECRET` | same | Production = live key; Preview = test key |
| `NEXT_PUBLIC_BASE_URL` | Your domain | `https://perfectcleaners.in` for Prod |

> **`FIREBASE_ADMIN_PRIVATE_KEY`**: paste the raw value from the JSON file as-is.
> Vercel stores it correctly. Do **not** escape the newlines manually.

### 3. Custom domain
Add `perfectcleaners.in` and `www.perfectcleaners.in` in Vercel → Domains.
Update DNS at your registrar to point to Vercel's nameservers or A record.

### 4. Firebase Auth authorised domains
Firebase console → Authentication → Settings → Authorised domains →
add `perfectcleaners.in` and your Vercel preview domain (`*.vercel.app`).

---

## Mobile — EAS Build & Submit

### Prerequisites
```bash
npm install -g eas-cli
eas login
```

### Native config files (not in git — add manually)
| File | Where to get it |
|---|---|
| `apps/mobile/google-services.json` | Firebase console → Android app → Download |
| `apps/mobile/GoogleService-Info.plist` | Firebase console → iOS app → Download |

### Cloud Function secret
```bash
# Run once before deploying functions:
npx firebase-tools functions:secrets:set MSG91_AUTH_KEY
```

### EAS secrets (alternative to .env for CI builds)
```bash
cd apps/mobile
eas secret:create --scope project --name EXPO_PUBLIC_RAZORPAY_KEY_ID --value rzp_live_…
```

### Build commands
```bash
cd apps/mobile

# Development build (dev client, internal distribution)
eas build --profile development --platform android

# Preview APK for internal testing
eas build --profile preview --platform android

# Production AAB for Play Store
eas build --profile production --platform android

# Production IPA for App Store
eas build --profile production --platform ios
```

### Submit to stores
```bash
# After a successful production build:
eas submit --platform android   # uploads AAB to Play Store (internal track)
eas submit --platform ios       # uploads IPA to App Store Connect

# Fill in before first iOS submit (eas.json → submit.production.ios):
# - ascAppId: App Store Connect → App → General → Apple ID
# - appleTeamId: developer.apple.com → Membership → Team ID
```

### OTA updates (after production is live)
```bash
# Push a JS-only update without a new store release:
eas update --channel production --message "Fix booking detail crash"
```

---

## Cloud Functions — Firebase

```bash
# First time: upgrade project to Blaze plan at
# https://console.firebase.google.com/project/perfect-cleaners/usage/details

# Set the SMS secret
npx firebase-tools functions:secrets:set MSG91_AUTH_KEY

# Deploy functions + Firestore rules + indexes
npx firebase-tools deploy
```

### MSG91 DLT registration (India requirement)
Transactional SMS in India requires a DLT-registered sender ID and template.
1. Register at https://www.trai.gov.in/dlt
2. Create a template in the MSG91 dashboard matching the message in `onBookingCreated`
3. Update `sender` in `functions/src/index.ts` to your approved 6-char sender ID
