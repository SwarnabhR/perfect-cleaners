'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';

const NAV_LINKS = [
  { label: 'Services', href: '/services' },
  { label: 'Plans',    href: '/plans'    },
  { label: 'Gallery',  href: '/gallery'  },
  { label: 'About',    href: '/about'    },
  { label: 'Journal',  href: '/journal'  },
  { label: 'Contact',  href: '/contact'  },
] as const;

export default function Nav() {
  const pathname  = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    onScroll(); // initialise on mount in case page loads mid-scroll
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenuOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <nav
        aria-label="Main navigation"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--pc-screen-pad-lg)',
          // Appears transparent; tint fades in on scroll — never a heavy box
          background: scrolled
            ? 'rgba(14,13,11,0.78)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(18px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
          // Hairline only on scroll — invisible at top of page
          borderBottom: scrolled
            ? '1px solid rgba(255,255,255,0.055)'
            : '1px solid transparent',
          transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
        }}
      >

        {/* ── Wordmark (left) ──────────────────────────────────────────── */}
        <Link
          href="/"
          aria-label="Perfect Cleaners — home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
            textDecoration: 'none',
          }}
        >
          <Image
            src="/logo-pc-monogram.svg"
            width={18}
            height={22}
            alt=""
            aria-hidden="true"
          />
          <span style={{
            fontFamily: 'var(--pc-mono)',
            fontSize: 10.5,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--pc-fg)',
            userSelect: 'none',
          }}>
            Perfect Cleaners
          </span>
        </Link>

        {/* ── Centre links — desktop only ──────────────────────────────── */}
        <div
          className="pc-nav-desktop"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(18px, 2.4vw, 36px)',
          }}
        >
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: 'var(--pc-mono)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--pc-fg)' : 'var(--pc-fg-3)',
                  position: 'relative',
                  paddingBottom: 3,
                  transition: 'color 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
                {/* Active indicator — single hairline beneath text */}
                {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: 'rgba(240,237,232,0.45)',
                      borderRadius: '1px',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Right actions ────────────────────────────────────────────── */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(14px, 2vw, 22px)',
          flexShrink: 0,
        }}>

          {/* Book Now — desktop */}
          <Link
            href="/book"
            className="pc-nav-desktop"
            style={{
              fontFamily: 'var(--pc-mono)',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--pc-warm)',
              border: '1px solid rgba(240,237,232,0.22)',
              borderRadius: '999px',
              padding: '7px 18px',
              whiteSpace: 'nowrap',
              transition: 'border-color 0.2s ease, background 0.2s ease',
            }}
          >
            Book Now
          </Link>

          {/* Account icon — desktop */}
          <Link
            href="/account"
            aria-label="Account"
            className="pc-nav-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--pc-fg-3)',
              transition: 'border-color 0.18s ease, color 0.18s ease',
            }}
          >
            <Icon name="user" size={14} color="currentColor" strokeWidth={1.5} />
          </Link>

          {/* Hamburger — mobile */}
          <button
            className="pc-nav-hamburger"
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-drawer"
            style={{
              /* No display here — .pc-nav-hamburger CSS controls visibility.
                 Inline display would override the 'display:none' on desktop. */
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--pc-fg-2)',
              flexShrink: 0,
              padding: 0,
              marginRight: -4,
            }}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} size={19} color="currentColor" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-label="Navigation"
        aria-modal="true"
        aria-hidden={!menuOpen}
        className="pc-nav-drawer"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 49,
          background: 'rgba(12,11,9,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex',
          flexDirection: 'column',
          // top padding = nav height + breathing room; bottom via .pc-nav-drawer CSS (safe-area-aware)
          paddingTop: 'calc(60px + 40px)',
          paddingLeft: 'var(--pc-screen-pad-lg)',
          paddingRight: 'var(--pc-screen-pad-lg)',
          overflowY: 'auto',
          // Animate in/out with opacity + slight Y shift
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? 'translateY(0)' : 'translateY(-6px)',
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s ease, transform 0.28s ease',
        }}
      >
        {/* Links */}
        <nav aria-label="Mobile navigation" style={{ display: 'flex', flexDirection: 'column' }}>
          {[{ label: 'Home', href: '/' }, ...NAV_LINKS].map(({ label, href }, i) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: 'var(--pc-serif)',
                  fontSize: 'clamp(30px, 7vw, 44px)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  color: active
                    ? 'var(--pc-fg)'
                    : 'rgba(240,237,232,0.18)',
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  transition: 'color 0.15s ease',
                  // Stagger entrance: each link waits a little longer
                  transitionDelay: menuOpen ? `${i * 0.03}s` : '0s',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Location tag */}
        <p style={{
          fontFamily: 'var(--pc-mono)',
          fontSize: 9.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(240,237,232,0.2)',
          marginTop: 32,
          marginBottom: 0,
        }}>
          Delhi NCR · Ghaziabad
        </p>

        {/* Bottom CTA */}
        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          <Link
            href="/book"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '15px 0',
              borderRadius: '999px',
              background: 'var(--pc-warm)',
              color: 'var(--pc-ink)',
              fontFamily: 'var(--pc-mono)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Book Now
          </Link>
        </div>
      </div>
    </>
  );
}
