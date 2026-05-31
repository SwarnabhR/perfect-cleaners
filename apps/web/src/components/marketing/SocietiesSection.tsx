import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';

const STEPS = [
  {
    num: '01',
    label: 'SOCIETY SIGNS UP',
    title: 'One contract, whole campus',
    body: 'The RWA or facility manager contacts us. We agree on a schedule, scope, and monthly fee — typically under 48 hours to set up.',
  },
  {
    num: '02',
    label: 'RESIDENTS REGISTER',
    title: 'App install, unit + car added',
    body: 'Residents download Perfect Cleaners, enter their unit number, and add their vehicles. No recurring booking required.',
  },
  {
    num: '03',
    label: 'WE CLEAN',
    title: 'Workers arrive on schedule',
    body: 'Our certified team arrives at the society gate at the agreed time. Every registered vehicle is serviced before the team departs.',
  },
  {
    num: '04',
    label: 'INSTANT NOTIFY',
    title: 'Push notification when done',
    body: 'The moment your car is marked clean, you get a notification with a timestamp, plate, and before/after photo.',
  },
] as const;

export default function SocietiesSection() {
  return (
    <div style={{ margin: '0 var(--pc-screen-pad-lg)', paddingTop: 'var(--pc-space-20)' }}>

      {/* Header row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 'var(--pc-space-10)', flexWrap: 'wrap', gap: 'var(--pc-space-6)',
      }}>
        <div>
          <Eyebrow style={{ display: 'block', marginBottom: 'var(--pc-space-4)' }}>
            [SOCIETY PARTNERSHIPS]
          </Eyebrow>
          <h2 style={{
            fontFamily: 'var(--pc-serif)',
            fontSize: 'clamp(32px, 5vw, 52px)',
            color: 'var(--pc-fg)',
            letterSpacing: 'var(--pc-track-tight)',
            lineHeight: 1.05,
            margin: 0,
          }}>
            Your whole society,<br />showroom clean.
          </h2>
        </div>
        <p style={{
          fontFamily: 'var(--pc-sans)',
          fontSize: 'var(--pc-text-base)',
          color: 'var(--pc-fg-2)',
          lineHeight: 'var(--pc-lh-loose)',
          maxWidth: 400,
          margin: 0,
        }}>
          We partner with residential societies across Delhi NCR. One contract with the RWA covers every resident — professional cleaning on a fixed schedule, with instant push notifications.
        </p>
      </div>

      {/* 4-step flow cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--pc-space-3)',
        marginBottom: 'var(--pc-space-10)',
      }}>
        {STEPS.map(step => (
          <div key={step.num} style={{
            background: 'var(--pc-card)',
            border: '1px solid var(--pc-line)',
            borderRadius: 'var(--pc-radius-md)',
            padding: 'var(--pc-space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--pc-space-3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{
                fontFamily: 'var(--pc-mono)',
                fontSize: 'var(--pc-text-xs)',
                color: 'var(--pc-sage-hi)',
                letterSpacing: 'var(--pc-track-mono)',
              }}>
                {step.label}
              </span>
              <span style={{
                fontFamily: 'var(--pc-mono)',
                fontSize: 28,
                color: 'var(--pc-line-strong)',
                lineHeight: 1,
              }}>
                {step.num}
              </span>
            </div>
            <h3 style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-base)',
              fontWeight: 600,
              color: 'var(--pc-fg)',
              margin: 0,
              lineHeight: 1.3,
            }}>
              {step.title}
            </h3>
            <p style={{
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-sm)',
              color: 'var(--pc-fg-3)',
              lineHeight: 'var(--pc-lh-loose)',
              margin: 0,
              flex: 1,
            }}>
              {step.body}
            </p>
          </div>
        ))}
      </div>

      {/* Stats strip + CTA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--pc-line)',
        paddingTop: 'var(--pc-space-6)',
        gap: 'var(--pc-space-6)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 'var(--pc-space-8)', flexWrap: 'wrap' }}>
          {[
            ['50+',      'Partner societies'],
            ['10,000+',  'Residents served'],
            ['< 5 min',  'Avg per vehicle'],
          ].map(([num, label]) => (
            <div key={label}>
              <p style={{
                fontFamily: 'var(--pc-serif)',
                fontSize: 'var(--pc-text-lg)',
                color: 'var(--pc-fg)',
                margin: 0,
                lineHeight: 1,
              }}>
                {num}
              </p>
              <p style={{
                fontFamily: 'var(--pc-sans)',
                fontSize: 'var(--pc-text-xs)',
                color: 'var(--pc-fg-3)',
                margin: 'var(--pc-space-1) 0 0',
              }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/for-societies"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: 'var(--pc-space-4) var(--pc-space-6)',
            background: 'var(--pc-warm)',
            color: 'var(--pc-ink)',
            borderRadius: 'var(--pc-radius-pill)',
            fontFamily: 'var(--pc-sans)',
            fontSize: 'var(--pc-text-sm)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 'var(--pc-track-wide)',
            textDecoration: 'none',
          }}
        >
          Partner Your Society →
        </Link>
      </div>
    </div>
  );
}
