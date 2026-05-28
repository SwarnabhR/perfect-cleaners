'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';
import { useTheme } from '@/components/ThemeProvider';

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
  const { theme, toggle } = useTheme();

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenuOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

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
          background: scrolled ? 'var(--pc-nav-bg-scrolled)' : 'transparent',
          backdropFilter: scrolled ? 'blur(18px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
          borderBottom: scrolled
            ? '1px solid var(--pc-line-faint)'
            : '1px solid transparent',
          transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
        }}
      >
        {/* ── Wordmark */}
        <Link
          href="/"
          aria-label="Perfect Cleaners — home"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0, textDecoration: 'none',
          }}
        >
          <Image
            src="/logo-pc-monogram.svg"
            width={18} height={22}
            alt=""
            aria-hidden="true"
          />
          <span style={{
            fontFamily: 'var(--pc-mono)',
            fontSize: 'var(--pc-text-xs)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--pc-fg)',
            userSelect: 'none',
          }}>
            Perfect Cleaners
          </span>
        </Link>

        {/* ── Centre links — desktop only */}
        <div
          className="pc-nav-desktop"
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center',
            gap: 'clamp(var(--pc-space-4), 2.4vw, var(--pc-space-8))',
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
                  fontSize: 'var(--pc-text-xs)',
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
                {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: '1px',
                      background: 'var(--pc-line-warm)',
                      borderRadius: '1px',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Right actions */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center',
          gap: 'clamp(var(--pc-space-3), 2vw, var(--pc-space-6))',
          flexShrink: 0,
        }}>

          {/*
            Book Now — desktop.
            pc-nav-book-now provides hover styles (border lift + faint bg).
          */}
          <Link
            href="/book"
            className="pc-nav-desktop pc-nav-book-now"
            style={{
              fontFamily: 'var(--pc-mono)',
              fontSize: 'var(--pc-text-xs)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--pc-warm)',
              border: '1px solid var(--pc-line-warm)',
              borderRadius: '999px',
              padding: 'var(--pc-space-2) var(--pc-space-5)',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              transition: 'border-color 0.2s ease, background 0.2s ease',
            }}
          >
            Book Now
          </Link>

          {/* Theme toggle — desktop */}
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="pc-nav-desktop"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32,
              borderRadius: '50%',
              border: '1px solid var(--pc-line-strong)',
              background: 'transparent',
              color: 'var(--pc-fg-3)',
              cursor: 'pointer',
              transition: 'border-color 0.18s ease, color 0.18s ease',
            }}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} color="currentColor" strokeWidth={1.5} />
          </button>

          {/* Account icon — desktop */}
          <Link
            href="/account"
            aria-label="Account"
            className="pc-nav-desktop"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32,
              borderRadius: '50%',
              border: '1px solid var(--pc-line-strong)',
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
              alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--pc-fg-2)', flexShrink: 0, padding: 0, marginRight: -4,
            }}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} size={19} color="currentColor" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/*
        Mobile drawer.
        Previously role="dialog" aria-modal="true" — removed because no
        focus trap is implemented. The dialog contract requires focus to be
        trapped inside the drawer while open; without it, screen reader users
        tab out into background content, violating the promise made by
        aria-modal. role="navigation" is semantically accurate and makes no
        modal promises.

        inert is set when the drawer is closed so keyboard users cannot
        tab into the visually hidden links behind pointerEvents:none.
      */}
      <div
        id="mobile-nav-drawer"
        role="navigation"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        // @ts-expect-error — inert is a valid HTML attribute not yet in React's types
        inert={!menuOpen ? '' : undefined}
        className="pc-nav-drawer"
        style={{
          position: 'fixed', inset: 0, zIndex: 49,
          background: 'var(--pc-ink-overlay)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex', flexDirection: 'column',
          paddingTop: 'calc(60px + 40px)',
          paddingLeft: 'var(--pc-screen-pad-lg)',
          paddingRight: 'var(--pc-screen-pad-lg)',
          overflowY: 'auto',
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? 'translateY(0)' : 'translateY(-6px)',
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s ease, transform 0.28s ease',
        }}
      >
        {/* Links */}
        <ul style={{ display: 'flex', flexDirection: 'column', listStyle: 'none', margin: 0, padding: 0 }}>
          {[{ label: 'Home', href: '/' }, ...NAV_LINKS].map(({ label, href }, i) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block',
                    fontFamily: 'var(--pc-serif)',
                    fontSize: 'clamp(30px, 7vw, 44px)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                    color: active ? 'var(--pc-fg)' : 'var(--pc-fg-4)',
                    padding: 'var(--pc-space-4) 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    transition: 'color 0.15s ease',
                    transitionDelay: menuOpen ? `${i * 0.03}s` : '0s',
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Location tag */}
        <p style={{
          fontFamily: 'var(--pc-mono)',
          fontSize: 'var(--pc-text-xs)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--pc-fg-dim)',
          marginTop: 'var(--pc-space-8)', marginBottom: 0,
        }}>
          Delhi NCR · Ghaziabad
        </p>

        {/* Bottom CTA */}
        <div style={{ marginTop: 'auto', paddingTop: 'var(--pc-space-8)' }}>
          <Link
            href="/book"
            onClick={() => setMenuOpen(false)}
            className="pc-nav-drawer-cta"
            style={{
              display: 'block', textAlign: 'center',
              padding: 'var(--pc-space-4) 0', borderRadius: '999px',
              background: 'var(--pc-warm)', color: 'var(--pc-ink)',
              fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)',
              letterSpacing: '0.16em', textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'background var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            Book Now
          </Link>
        </div>
      </div>
    </>
  );
}
