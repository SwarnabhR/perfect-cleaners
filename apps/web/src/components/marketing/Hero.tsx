import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <div
      className="pc-hero-grid"
      style={{
        padding: 'var(--pc-space-10) var(--pc-screen-pad-lg) 0',
        display: 'grid',
        gridTemplateColumns: '1fr 1.05fr',
        gap: 'var(--pc-space-8)',
        alignItems: 'stretch',
      }}
    >
      {/* Left: headline + CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-6)', paddingTop: 'var(--pc-space-6)' }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
          border: '1px solid var(--pc-line)', borderRadius: 999,
          padding: '5px 12px 5px 5px',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--pc-sage-hi)', display: 'block', flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)',
            color: 'var(--pc-fg-3)', letterSpacing: 'var(--pc-track-mono)',
          }}>
            DELHI NCR · GHAZIABAD
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--pc-serif)',
          fontSize: 'var(--pc-text-hero)',
          lineHeight: 'var(--pc-lh-tight)',
          color: 'var(--pc-fg)',
          letterSpacing: 'var(--pc-track-tight)',
          margin: 0,
        }}>
          The detail<br />standard<br />for Delhi NCR.
        </h1>

        {/* Sub */}
        <p style={{
          fontFamily: 'var(--pc-sans)',
          fontSize: 'var(--pc-text-base)',
          color: 'var(--pc-fg-2)',
          lineHeight: 'var(--pc-lh-loose)',
          maxWidth: 400,
          margin: 0,
        }}>
          Certified specialists, professional-grade products. At your driveway
          or our centre in Noida — booked in under 2 minutes.
        </p>

        {/*
          CTAs — styled <Link> elements, NOT <Link><Button>.
          Nesting a <button> inside an <a> is invalid HTML.
          Button appearance is applied directly to the anchor.
        */}
        <div style={{ display: 'flex', gap: 'var(--pc-space-2)', flexWrap: 'wrap' }}>
          <Link
            href="/book"
            className="pc-hero-cta-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--pc-space-4) var(--pc-space-6)',
              background: 'var(--pc-warm)',
              color: 'var(--pc-ink)',
              border: 'none',
              borderRadius: 'var(--pc-radius-pill)',
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-sm)',
              fontWeight: 600,
              letterSpacing: 'var(--pc-track-wide)',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'background var(--pc-dur-fast) var(--pc-ease), box-shadow var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            Book Now
          </Link>
          <Link
            href="/services"
            className="pc-hero-cta-ghost"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--pc-space-4) var(--pc-space-6)',
              background: 'transparent',
              color: 'var(--pc-fg)',
              border: '1px solid var(--pc-line-strong)',
              borderRadius: 'var(--pc-radius-pill)',
              fontFamily: 'var(--pc-sans)',
              fontSize: 'var(--pc-text-sm)',
              fontWeight: 500,
              letterSpacing: 'var(--pc-track-wide)',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'background var(--pc-dur-fast) var(--pc-ease), border-color var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            View Services
          </Link>
        </div>

        {/* Trust strip */}
        <div style={{
          display: 'flex', gap: 'var(--pc-space-6)', paddingTop: 'var(--pc-space-2)',
          borderTop: '1px solid var(--pc-line)',
          flexWrap: 'wrap',
        }}>
          {[
            ['1,500+', 'Cars detailed'],
            ['4.9 / 5', 'Service rating'],
            ['Since 2021', 'In business'],
          ].map(([num, label]) => (
            <div key={label}>
              <p style={{
                fontFamily: 'var(--pc-serif)',
                fontSize: 'var(--pc-text-lg)',
                color: 'var(--pc-fg)',
                letterSpacing: 'var(--pc-track-tight)',
                lineHeight: 1,
                margin: 0,
              }}>{num}</p>
              <p style={{
                fontFamily: 'var(--pc-sans)',
                fontSize: 'var(--pc-text-xs)',
                color: 'var(--pc-fg-3)',
                marginTop: 'var(--pc-space-1)',
                marginBottom: 0,
              }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: photo tiles — desktop only (hidden on mobile via .pc-hero-right CSS) */}
      <div className="pc-hero-right">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--pc-space-2)', height: 260 }}>
          <div style={{ position: 'relative', borderRadius: 'var(--pc-radius-md)', overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
            <Image
              src="/hero-professional-detailer.png"
              alt="Professional detailer foam-gunning a car"
              fill
              priority
              sizes="(max-width: 768px) 1px, 26vw"
              style={{ objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(14,13,11,0.85) 100%)' }} />
            <p style={{
              position: 'absolute', bottom: 12, left: 14, margin: 0,
              fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)',
              color: 'rgba(255,255,255,0.6)', letterSpacing: 'var(--pc-track-mono)',
            }}>CERTIFIED DETAILERS</p>
          </div>
          <div style={{ position: 'relative', borderRadius: 'var(--pc-radius-md)', overflow: 'hidden', border: '1px solid var(--pc-line)' }}>
            <Image
              src="/hero-booking-app.png"
              alt="Book a wash from your phone"
              fill
              priority
              sizes="(max-width: 768px) 1px, 26vw"
              style={{ objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(14,13,11,0.85) 100%)' }} />
            <p style={{
              position: 'absolute', bottom: 12, left: 14, margin: 0,
              fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)',
              color: 'rgba(255,255,255,0.6)', letterSpacing: 'var(--pc-track-mono)',
            }}>BOOK IN 2 MINUTES</p>
          </div>
        </div>

        {/* Process strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'var(--pc-space-2)', marginTop: 'var(--pc-space-2)',
        }}>
          <div style={{
            background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
            borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-4)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 80,
          }}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-4)', letterSpacing: 'var(--pc-track-mono)', margin: 0 }}>
              PROCESS
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg)', lineHeight: 1.35, margin: 0 }}>
              60-point<br />inspection checklist
            </p>
          </div>
          <div style={{
            background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
            borderRadius: 'var(--pc-radius-md)', padding: 'var(--pc-space-4)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 80,
          }}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-4)', letterSpacing: 'var(--pc-track-mono)', margin: 0 }}>
              COVERAGE
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg)', lineHeight: 1.35, margin: 0 }}>
              Delhi, Noida,<br />Gurgaon &amp; beyond
            </p>
          </div>
        </div>
      </div>

      {/* Full-width image bento */}
      <div
        className="pc-hero-bento"
        style={{
          gridColumn: '1 / -1',
          display: 'grid',
          gridTemplateColumns: '1fr 0.8fr 1.6fr',
          gap: 'var(--pc-space-2)',
          marginTop: 'var(--pc-space-5)',
        }}
      >
        {/* Tile 1 */}
        <div style={{ position: 'relative', borderRadius: 'var(--pc-radius-md)', overflow: 'hidden', minHeight: 220, border: '1px solid var(--pc-line)' }}>
          <Image
            src="/service-exterior-a.png"
            alt="Exterior foam wash"
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 27vw"
            style={{ objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(14,13,11,0.88) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'rgba(255,255,255,0.45)', letterSpacing: 'var(--pc-track-mono)', marginBottom: 'var(--pc-space-1)', marginTop: 0 }}>
              EXTERIOR WASH
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg)', fontWeight: 500, margin: 0 }}>
              Foam cannon to finish
            </p>
          </div>
        </div>

        {/* Tile 2 */}
        <div style={{ position: 'relative', borderRadius: 'var(--pc-radius-md)', overflow: 'hidden', minHeight: 220, border: '1px solid var(--pc-line)' }}>
          <Image
            src="/service-coating-a.png"
            alt="Ceramic coating application"
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 22vw"
            style={{ objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(14,13,11,0.88) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'rgba(255,255,255,0.45)', letterSpacing: 'var(--pc-track-mono)', marginBottom: 'var(--pc-space-1)', marginTop: 0 }}>
              CERAMIC COATING
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg)', fontWeight: 500, margin: 0 }}>
              3-year protection
            </p>
          </div>
        </div>

        {/* Tile 3 — wide, with stat overlay */}
        <div style={{ position: 'relative', borderRadius: 'var(--pc-radius-md)', overflow: 'hidden', minHeight: 220, border: '1px solid var(--pc-line)' }}>
          <Image
            src="/service-interior-a.png"
            alt="Interior detailing"
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 44vw"
            style={{ objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(14,13,11,0.82) 0%, rgba(14,13,11,0.3) 60%, rgba(14,13,11,0) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 20 }}>
            <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'rgba(255,255,255,0.45)', letterSpacing: 'var(--pc-track-mono)', marginBottom: 'var(--pc-space-1)', marginTop: 0 }}>
              INTERIOR DETAIL
            </p>
            <p style={{ fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-2xl)', color: 'var(--pc-fg)', letterSpacing: 'var(--pc-track-tight)', lineHeight: 1.05, margin: 0 }}>
              Every surface.<br />Nothing rushed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
