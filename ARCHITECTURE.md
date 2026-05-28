# Architecture Notes

## Style system — two layers

### 1. `packages/ui` — structural / presentational components

Cross-app React Native components that are **layout-bearing** or **data-driven**.
They carry their own rendering logic and cannot be expressed as a plain style object.

| Export | What it renders |
|---|---|
| `Card` | Bordered surface container |
| `Pill` | Inline label chip |
| `StatusBadge` | Booking pipeline status pill |
| `Stepper` | Step progress indicator |
| `Avatar` | Circular user avatar |
| `AvatarStack` | Overlapping avatar row |
| `CarImage` | Brand car illustration (before/after tones) |

**Do not add buttons, text styles, or input styles here.** Those belong in the layer below.

---

### 2. `apps/mobile/theme/sharedStyles.ts` — theme-aware style tokens

A `useSharedStyles()` hook that returns a `StyleSheet` object keyed by semantic name.
Every style that (a) is used in ≥ 2 screens **and** (b) depends on `useThemeColors()` lives here.

```ts
const ss = useSharedStyles();
// ss.screen · ss.eyebrow · ss.pageTitle · ss.backBtn
// ss.primaryBtn · ss.primaryBtnText · ss.primaryBtnOff
// ss.ghostBtn · ss.ghostBtnText
// ss.formInput · ss.fieldLabel · ss.fieldArea
// ss.titleSection · ss.footerBar
// ss.onboardingStep · ss.onboardingTitle · ss.heroTitle · ss.subtitle
```

Screens call the hook once at the top of the component and spread `ss.*` onto `style` props.
The hook memoises on the colors reference — it only recomputes when the theme toggles.

---

## Route structure

```
app/
  (auth)/          login, otp
  (onboarding)/    name, car, address
  (customer)/
    (tabs)/        index, bookings, offers, profile
    booking, booking-detail, payment, payment-methods,
    tracker, wallet, rate-booking
  (worker)/
    (tabs)/        index, earnings, profile
    job-detail, photo-capture, otp-complete,
    notifications, settings
```

## Package graph

```
apps/mobile
  ├── @pc/tokens   design tokens (colors, typography, spacing, radii)
  ├── @pc/ui       presentational components (see layer 1 above)
  └── @pc/firebase Firestore config + shared TypeScript types
```

`@pc/tokens` has no dependencies.
`@pc/ui` depends on `@pc/tokens`.
`@pc/firebase` has no UI dependency.
`apps/mobile` depends on all three.
