'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';
import { useTheme } from '@/components/ThemeProvider';
import { useI18n } from '@/i18n';

const NAV_HREFS = ['/services', '/plans', '/gallery', '/about', '/journal', '/contact'] as const;

/** CSS selector that matches all naturally focusable elements. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Nav() {
  const pathname  = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();
  const { t } = useI18n();

  const triggerRef = useRef<HTMLButtonElement>(null); // hamburger
  const drawerRef  = useRef<HTMLDivElement>(null);    // drawer container

  const NAV_LINKS = [
    { label: t.nav.services, href: NAV_HREFS[0] },
    { label: t.nav.plans,    href: NAV_HREFS[1] },
    { label: t.nav.gallery,  href: NAV_HREFS[2] },
    { label: t.nav.about,    href: NAV_HREFS[3] },
    { label: t.nav.journal,  href: NAV_HREFS[4] },
    { label: t.nav.contact,  href: NAV_HREFS[5] },
  ];

  // ── Scroll listener ──────────────────────────────────────────────────────
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Escape to close ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenuOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // ── Focus management ──────────────────────────────────────────────────────
  // On open: move focus to first focusable element inside the drawer.
  // On close: return focus to the hamburger trigger.
  useEffect(() => {
    if (menuOpen) {
      // Small rAF so the drawer is visible/interactable before we focus.
      const id = requestAnimationFrame(() => {
        const first = drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
        first?.focus();
      });
      return () => cancelAnimationFrame(id);
    } else {
      triggerRef.current?.focus();
    }
  }, [menuOpen]);

  // ── Focus trap (Tab / Shift+Tab) ──────────────────────────────────────────
  const handleDrawerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const nodes = Array.from(
      drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
    );
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last  = nodes[nodes.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: if focus is on first element, wrap to last
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: if focus is on last element, wrap to first
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

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
                className="pc-nav-link"
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
            pc-nav-book-now provides hover/active/focus-visible styles.
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
              transition: 'border-color var(--pc-dur-fast) var(--pc-ease), background var(--pc-dur-fast) var(--pc-ease), transform var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            {t.nav.bookNow}
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
            ref={triggerRef}
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
        Mobile drawer — now a proper dialog with focus trap.

        Accessibility contract met:
        - role="dialog" aria-modal="true": announces as modal to screen readers.
        - aria-labelledby: points to the visually-hidden #mobile-nav-title heading.
        - Focus moves in on open (first focusable element).
        - Tab / Shift+Tab cycle within the drawer (handleDrawerKeyDown).
        - Escape closes the drawer and returns focus to the hamburger.
        - Focus returns to triggerRef on close (useEffect above).
        - inert when closed: prevents background tab traversal before
          React has painted the closed state.
      */}
      <div
        id="mobile-nav-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-title"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        className="pc-nav-drawer"
        onKeyDown={handleDrawerKeyDown}
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
        {/* Visually-hidden title for screen readers */}
        <h2
          id="mobile-nav-title"
          style={{
            position: 'absolute', width: 1, height: 1,
            padding: 0, margin: -1, overflow: 'hidden',
            clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0,
          }}
        >
          Site navigation
        </h2>

        {/* Links */}
        <ul style={{ display: 'flex', flexDirection: 'column', listStyle: 'none', margin: 0, padding: 0 }}>
          {[{ label: t.nav.home, href: '/' }, ...NAV_LINKS].map(({ label, href }, i) => {
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
          {t.nav.location}
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
              transition: 'background var(--pc-dur-fast) var(--pc-ease), transform var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            {t.nav.bookNow}
          </Link>
        </div>
      </div>
    </>
  );
}
