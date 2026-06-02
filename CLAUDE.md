# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Current Focus — DO NOT TOUCH

**`apps/mobile/` is frozen.** Do not read, edit, or create any files under `apps/mobile/` unless the user explicitly asks. All active development is on the web app (`apps/web/`) and shared packages.

## What This Project Is

**Perfect Cleaners** is a premium car wash & detailing service (Delhi NCR). This repo is a Turborepo monorepo containing the production apps and a reference design system.

| Surface | Path | Stack |
|---|---|---|
| Customer + Worker mobile | `apps/mobile` | Expo SDK 56 / React Native 0.85.3 / React 19 |
| Marketing site + Admin dashboard | `apps/web` | Next.js 16 / React 19 |
| Shared design tokens | `packages/tokens` | TypeScript constants mirrored from `design-system/colors_and_type.css` |
| Shared Firestore types + Firebase init | `packages/firebase` | Firebase JS SDK v11 |
| Shared UI primitives | `packages/ui` | React Native + web |
| Reference UI kits (static HTML, read-only) | `design-system/` | CDN React + Babel, no build step |

## Commands

```bash
# From repo root — runs all apps via Turbo
npm run dev          # start all dev servers in parallel
npm run build        # production builds for all apps
npm run lint         # run lint tasks across all workspaces
npm run typecheck    # tsc --noEmit across all packages

# Individual apps
cd apps/mobile && npm run android     # open in Android emulator
cd apps/mobile && npm run ios         # open in iOS simulator (macOS only)
cd apps/mobile && npm run web         # run mobile in browser
cd apps/web    && npm run dev         # Next.js dev server (http://localhost:3000)
```

## Version Warnings

- **Expo SDK 56** — APIs and conventions differ from training data. Read exact docs at `https://docs.expo.dev/versions/v56.0.0/` before writing any mobile code.
- **Next.js 16** — breaking changes from Next.js 13–15. Read `node_modules/next/dist/docs/` for current API before writing any web code.

## Monorepo Architecture

```
apps/
  mobile/          ← Expo Router (file-based) — Customer app + Worker app (role-gated)
  web/
    src/app/       ← Next.js App Router
      (admin)/     ← protected admin dashboard
packages/
  tokens/          ← @pc/tokens  — color, spacing, type, motion, layout constants
  firebase/        ← @pc/firebase — Firebase init, Firestore types (Booking, Worker, etc.)
  ui/              ← @pc/ui      — 11 RN primitives: Eyebrow, PrimaryButton, GhostButton, SageButton,
                                   Card, Pill, StatusBadge, Stepper, Avatar, AvatarStack, CarImage
design-system/     ← read-only reference: static HTML previews and JSX ui_kits
```

To add a workspace dependency: add `"@pc/tokens": "*"` (or other `@pc/*` package) to the app's `package.json` dependencies, then run `npm install` from the repo root.

## Mobile App Structure

Expo Router file-based routing. All screens live under `apps/mobile/app/`.

```
app/
  _layout.tsx          ← root: GestureHandlerRootView, SafeAreaProvider, font loading, StatusBar
  +html.tsx            ← Expo web HTML wrapper
  index.tsx            ← redirects to /(auth)/login
  (auth)/
    _layout.tsx        ← Stack, no header
    login.tsx          ← phone input + Firebase signInWithPhoneNumber
    otp.tsx            ← 6-digit OTP verify + Firebase credential confirm
  (onboarding)/        ← NEW — 3-step first-run flow (name → car → address)
    _layout.tsx
    name.tsx           ← [STEP 01/03] full name input
    car.tsx            ← [STEP 02/03] vehicle make/model/type/registration
    address.tsx        ← [STEP 03/03] service address + pincode
  (customer)/
    _layout.tsx        ← Stack with slide/modal animations for sub-screens
    (tabs)/
      _layout.tsx      ← bottom tab bar (Home, Bookings, Offers, Profile) + useFCM hook
      index.tsx        ← customer home screen
      bookings.tsx
      offers.tsx
      profile.tsx
    booking.tsx        ← package selector + time slot picker
    booking-detail.tsx ← NEW — detailed view of a single past/upcoming booking
    payment.tsx        ← Razorpay sheet (UPI / card / net banking)
    payment-success.tsx
    payment-methods.tsx← NEW — saved payment methods management
    tracker.tsx        ← live job tracker with stepper
    before-after.tsx
    addresses.tsx      ← NEW — manage multiple saved service addresses
    cars.tsx           ← NEW — manage registered vehicles
    rate-booking.tsx   ← NEW — star rating + review after job completion
    referral.tsx       ← NEW — referral code share + reward status
    wallet.tsx         ← NEW — PC wallet balance + transaction history
    notifications.tsx  ← NEW — in-app notification list
    settings.tsx       ← NEW — app preferences (language, notifications toggles)
    help.tsx           ← NEW — FAQ + contact links
    support-chat.tsx   ← NEW — in-app support chat thread
  (worker)/
    _layout.tsx        ← Stack with slide/modal animations
    (tabs)/
      _layout.tsx      ← bottom tab bar (Dashboard, Earnings, Profile)
      index.tsx        ← worker home: active job card + upcoming jobs list
      earnings.tsx
      profile.tsx
    job-detail.tsx     ← step-through job execution + checklist + photo capture
    photo-capture.tsx
    otp-complete.tsx
    notifications.tsx  ← NEW — worker notification inbox
    settings.tsx       ← NEW — worker preferences and app controls
```

**Firebase Auth note:** Mobile now uses `@react-native-firebase/auth` (plus `@react-native-firebase/app`) and is no longer blocked by the Firebase JS SDK `RecaptchaVerifier` limitation in React Native. Keep web auth and shared Firebase utilities aligned with `packages/firebase` where possible.

## Mobile Shared Components (`apps/mobile/components/`)

| Component | Purpose |
|---|---|
| `AuthScreenShell.tsx` | Shared auth-screen wrapper (layout + background treatment) |
| `BackButton.tsx` | Reusable back-navigation button |
| `BrandLogo.tsx` | Brand lockup wrapper for mobile screens |
| `CreditCard.tsx` | Card visual used in payment methods surfaces |
| `HapticButton.tsx` | Touchable wrapper that fires `expo-haptics` on press |
| `OnboardingProgress.tsx` | Step indicator for onboarding flow |
| `PCMonogram.tsx` | Inline SVG stacked-P monogram (replaces the static asset for RN) |
| `RowGroup.tsx` | Grouped list-row layout primitive (settings/profile lists) |
| `TabTopBar.tsx` | Shared top bar used on tab-driven screens |

## Mobile Hooks (`apps/mobile/hooks/`)

| Hook | Purpose |
|---|---|
| `useFCM.ts` | Registers Expo push token with FCM, handles foreground notification display; consumed in `(customer)/(tabs)/_layout.tsx` |

## Web Admin Dashboard (`apps/web/src/app/(admin)/`)

`(admin)` is a Next.js App Router **route group** — the parentheses are stripped from the URL entirely. Do not use `/admin/` as a path prefix anywhere.

Sidebar-nav layout (`layout.tsx`) with these routes:

| Route | File | Description |
|---|---|---|
| `/dashboard` | `dashboard/page.tsx` | KPI cards, booking pipeline chart, live activity feed |
| `/bookings` | `bookings/page.tsx` | Paginated bookings table with status filters |
| `/workers` | `workers/page.tsx` | Worker roster with online status and assignment |
| `/customers` | `customers/page.tsx` | Customer list with vehicle and booking counts |
| `/services-mgmt` | `services-mgmt/page.tsx` | Service catalogue management |
| `/promotions` | `promotions/page.tsx` | Promo code CRUD |
| `/analytics` | `analytics/page.tsx` | Revenue charts, job mix, top services |
| `/login` | `login/page.tsx` | Admin login entry screen |
| `/settings` | `settings/page.tsx` | Operator-level settings |

Web UI primitives live in `apps/web/src/components/ui/`:

| Component | Notes |
|---|---|
| `Avatar.tsx` | Initials-based avatar, used in sidebar and tables |
| `Button.tsx` + `Button.module.css` | Primary/ghost variants with CSS modules |
| `CarImage.tsx` | SVG car silhouettes keyed by `VehicleType` |
| `Card.tsx` + `Card.module.css` | Surface card wrapper with optional interactive hover state |
| `Eyebrow.tsx` | Mono uppercase label |
| `Icon.tsx` | Inline Lucide icon renderer (name → SVG path map) |
| `Pill.tsx` | Compact label pill |
| `StatusBadge.tsx` | Booking pipeline status chip (mobile/RN) |
| `StatusPill.tsx` | Admin web status pill — coloured dot + tinted bg per status; handles booking statuses (In Progress, Confirmed, Pending, Cancelled) and worker statuses (Available, On Job, Off Today) |

**Theme system (`apps/web`):**
- Dark/light theming is controlled by `data-theme` on the `<html>` element.
- `ThemeProvider` (`src/components/ThemeProvider.tsx`) persists preference to `localStorage` under key `pc-theme` and exposes `useTheme()` hook with `{ theme, toggle }`.
- CSS variables for both themes live in `src/app/globals.css` — `:root` = dark (default), `[data-theme="light"]` = light overrides.
- The mobile app remains dark-only. Never add theme switching to mobile.
- Token exports: `colors` (dark) and `colorsLight` (light) are both exported from `packages/tokens/src/index.ts`.
- When writing admin or marketing components, use only `var(--pc-*)` CSS variables — never hardcode dark-specific rgba values like `rgba(255,255,255,0.08)` since these break in light mode. Use `var(--pc-line)`, `var(--pc-line-faint)`, etc. instead.
- SVG `stroke`/`fill` attributes do NOT support CSS variables — use `style={{ stroke: 'var(--pc-line-faint)' }}` (inline style prop) instead of `stroke="var(...)"` for theme-adaptive SVG colours.

## Firebase / Backend

- Realtime job tracking via **Firestore** live listeners
- Phone OTP auth via **Firebase Auth**
- Before/after photos via **Firebase Storage**
- Push notifications via **FCM** (Expo push token → FCM, managed via `useFCM` hook)
- Razorpay for payments (webhook handling via Cloud Functions)

All Firestore document types are defined in `packages/firebase/src/types.ts`. Use those types everywhere — never inline ad-hoc interfaces for Booking, Worker, Customer, etc.

Key types: `Booking`, `Customer`, `Worker`, `Vehicle`, `Service`, `Promotion`, `BookingAddress`, `PriceBreakdown`, `BookingPhotos`, `WorkerEarnings`.
Key union types: `BookingStatus` (`pending | assigned | enroute | inprogress | done | cancelled`), `VehicleType`, `ServiceCategory`.

Firebase credentials go in `.env.local` (Next.js) and `.env` (Expo — uses `EXPO_PUBLIC_*` prefix). Both prefixes are handled automatically by `packages/firebase/src/config.ts`.

## Design System Rules (non-negotiable)

These come from `design-system/README.md` and apply to every UI surface.

**Colors — dark mode (default) and light mode (web only):**
- Surfaces: `colors.ink → inkRaised → card → cardHi` (whispered steps, dark to lighter in dark mode)
- Only chromatic surface: `colors.sage` (`#4A5E44`) — fills, pills, active stepper step; never used as a button
- Primary CTA: `colors.warm` — dark mode: off-white `#F0EDE8` pill; light mode: inverts to near-black `#0E0D0B` pill. Always pair with `var(--pc-ink)` as text so both themes read correctly.
- `colors.gold` (`#C9A961`) — hairline under wordmark and Gold tier badge only; do not use as a CTA or status colour
- **Never use `var(--pc-warm)` as a status/label colour** — it inverts between themes. Use `var(--pc-info)`, `var(--pc-warning)`, `var(--pc-sage)`, or `var(--pc-danger)` for semantic status colours instead.
- Mobile app is dark-only. Light mode applies to the web (marketing site + admin dashboard) only.

**Typography:**
- Serif (`Instrument Serif`) for hero/emotional text ≥28px only
- Sans (`Inter Tight`) everywhere else
- Mono (`JetBrains Mono`) for labels and bracket notation (`[SERVICE] [01]`)

**Substitution flags (replace when licensed assets arrive):**
- `Instrument Serif` → `PP Editorial New`
- `Inter Tight` → `Satoshi` / `General Sans`
- Lucide icons → custom icon set

**Copy rules:**
- Sentence case for prose; `UPPERCASE` for labels and button text
- Bracket notation: `[SERVICE] [01] / INTERIOR DETAILING`
- Indian-English: "centre," "booking," `₹`, `+91`
- No exclamation marks; no emoji (one 👋 on Worker home is the only concession)

**Layout (mobile):** 20px screen padding, 44pt min tap target, 60pt top bar, 84pt bottom tab bar.

All token values as TypeScript constants are in `packages/tokens/src/index.ts`.

## React Native / Cross-Platform Rules

These prevent silent rendering failures that only appear on device.

**Font weights — Android requires named font families.**
Never use `fontWeight: '500'` or `'600'` alongside a custom-loaded `fontFamily`. Android does not synthesise weight variants from a single font file. Use the named weight constants from `@pc/tokens`:

```ts
// Wrong — Android ignores fontWeight and renders 400 Regular
{ fontFamily: typography.sans, fontWeight: '600' }

// Correct — maps to the registered 'Inter Tight SemiBold' font face
{ fontFamily: typography.sansSemiBold }
```

Available named variants: `typography.sansMedium` (500), `typography.sansSemiBold` (600), `typography.sansBold` (700), `typography.monoMedium` (500). These match the keys registered in `useFonts()` in `apps/mobile/app/_layout.tsx`.

**Screen dimensions — always use the hook, never the static call.**
`Dimensions.get('window')` is frozen at module load time and does not respond to orientation changes, foldables, or the software keyboard on Android.

```ts
// Wrong — stale on rotation and foldable unfold
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({ card: { width: width - 40 } });

// Correct — re-renders on any screen size change
const { width } = useWindowDimensions();
// use width inline, not inside StyleSheet.create()
```

**`borderStyle: 'dashed'` is not rendered on Android.** Replace decorative dashed borders with a solid `borderColor` at reduced opacity, or build a custom dashed line from small Views.

**Safe area — always explicit, never assumed.**
- Top bars: `paddingTop: insets.top + gap` on the content View, not on a wrapper.
- Absolute-positioned footers: apply `paddingBottom: spacing[N] + insets.bottom` **inline** (not in StyleSheet) since the inset value is only available at render time.
- ScrollView below a sticky footer: set `contentContainerStyle={{ paddingBottom: footerHeight + insets.bottom }}`.

**Stepper layout — connectors must be siblings of dots, not children.**
The connector line between steps belongs in the same `flexDirection: 'row'` track as the dots, with `flex: 1` width. Putting it inside a column-direction step item grows it vertically, not horizontally.

```tsx
// Correct pattern
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  {steps.flatMap((_, i) => {
    const items = [<View key={`dot-${i}`} style={dotStyle} />];
    if (i < steps.length - 1)
      items.push(<View key={`conn-${i}`} style={connStyle} />); // flex: 1, height: 1
    return items;
  })}
</View>
<View style={{ flexDirection: 'row' }}>
  {steps.map((label, i) => <Text key={i} style={{ flex: 1, textAlign: 'center' }}>{label}</Text>)}
</View>
```

## Brand Assets

```
design-system/assets/logo-pc-monogram.svg         ← stacked-P mark
design-system/assets/logo-wordmark.svg            ← PERFECT CLEANERS lockup with gold rule
design-system/assets/brand-hero.png               ← Mercedes spotlight splash (canonical mobile hero)

# Hero tiles (web marketing — also in apps/web/public/)
design-system/assets/hero-professional-detailer.png  ← technician foam-gunning a luxury sedan
design-system/assets/hero-booking-app.png            ← mobile booking app product shot

# Service photography (web marketing — also in apps/web/public/)
design-system/assets/service-interior-a.png   ← leather seat microfiber clean
design-system/assets/service-interior-b.png   ← dashboard wipe / carbon trim
design-system/assets/service-exterior-a.png   ← foam-mitt exterior hand wash
design-system/assets/service-exterior-b.png   ← water beading on waxed paint (macro)
design-system/assets/service-coating-a.png    ← ceramic coating applicator pad
design-system/assets/service-coating-b.png    ← mirror-gloss reflection on coated paint
```

All generated images are also copied to `apps/web/public/` so Next.js can serve them directly as `/image-name.png`.

## Reference UI Kits (design-system/)

The static HTML prototypes in `design-system/ui_kits/` are the visual contract for each screen. Match them pixel-for-pixel when building production screens. Do not modify them — they are reference only.

| Folder | Contents |
|---|---|
| `ui_kits/customer/` | `screens.jsx` (core flows), `screens-cards.jsx` (booking/payment cards), `screens-account.jsx` (profile/settings/wallet/referral), `screens-extra.jsx` (help, chat, notifications), `screens-payment.jsx`, `pc-ui.jsx`, `tweaks-panel.jsx`, `ios-frame.jsx`, `ios-native.jsx` |
| `ui_kits/worker/` | `screens.jsx`, `screens-profile.jsx`, `screens-extra.jsx`, `pc-ui.jsx`, `ios-frame.jsx` |
| `ui_kits/admin/` | `screens.jsx` (dashboard, bookings, workers, customers), `screens-services.jsx`, `screens-extra.jsx` (promotions, settings), `pc-ui.jsx` |
| `ui_kits/marketing/` | *(planned)* |
