'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import Image from 'next/image';

const NAV_LINKS = [
  { label: 'Home',       href: '/'           },
  { label: 'Services',   href: '/services'   },
  { label: 'Gallery',    href: '/gallery'    },
  { label: 'About',      href: '/about'      },
  { label: 'Journal',    href: '/journal'    },
  { label: 'Membership', href: '/membership' },
  { label: 'Contact',    href: '/contact'    },
] as const;

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 28px)',
        padding: '20px var(--pc-screen-pad-lg)',
        background: 'rgba(14,13,11,0.45)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Image src="/logo-pc-monogram.svg" width={24} height={28} alt="Perfect Cleaners mark" />
          <span style={{
            fontFamily: 'var(--pc-mono)', fontSize: 14, color: '#fff',
            letterSpacing: '0.08em',
            textShadow: '0 1px 8px rgba(0,0,0,0.6)',
          }}>
            perfect<span style={{ color: 'var(--pc-fg-3)', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>.cleaners</span>
          </span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <div
          className="pc-hide-mobile"
          style={{
            display: 'flex', gap: 4, padding: 4,
            background: 'rgba(28,27,25,0.80)',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                padding: '8px 18px', borderRadius: 999,
                fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', fontWeight: 500,
                letterSpacing: '0.04em',
                background: active ? 'var(--pc-ink)' : 'transparent',
                color: active ? '#fff' : 'var(--pc-fg-2)',
                border: active ? '1px solid var(--pc-line)' : '1px solid transparent',
              }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right-side group — marginLeft:auto lives here, not on individual items */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center',
          gap: 'clamp(8px, 2vw, 12px)',
          flexShrink: 0,
        }}>
          {/* Book Now CTA — always visible */}
          <Link href="/book" style={{
            padding: '9px 20px', borderRadius: 999,
            fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', fontWeight: 600,
            letterSpacing: '0.04em',
            background: 'var(--pc-warm)',
            color: 'var(--pc-ink)',
            border: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Book Now
          </Link>

          {/* User pill — hidden on mobile */}
          <div
            className="pc-hide-mobile"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(28,27,25,0.80)',
              borderRadius: 999, padding: '5px 14px 5px 5px',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Avatar name="Swarnabh Roy" size={30} />
            <div>
              <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: '#fff', fontWeight: 500, lineHeight: 1.2 }}>Swarnabh Roy</div>
              <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', letterSpacing: '0.06em', lineHeight: 1.2 }}>workspace.swarnabh@gmail.com</div>
            </div>
            <Icon name="chevron-down" size={12} color="var(--pc-fg-3)" style={{ marginLeft: 4 }} />
          </div>

          {/* Hamburger / Close — visible on mobile only */}
          <button
            className="pc-mobile-menu"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            style={{
              alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: 'var(--pc-radius-sm)',
              background: menuOpen ? 'rgba(35,34,32,0.90)' : 'rgba(28,27,25,0.75)',
              border: '1px solid rgba(255,255,255,0.14)',
              flexShrink: 0,
              transition: 'background var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} size={18} color="var(--pc-fg-2)" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          role="dialog"
          aria-label="Navigation menu"
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(14,13,11,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column',
            paddingTop: 'calc(var(--pc-space-20) + 60px)',
            paddingLeft: 'var(--pc-screen-pad-lg)',
            paddingRight: 'var(--pc-screen-pad-lg)',
            paddingBottom: 'var(--pc-space-10)',
            overflowY: 'auto',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {NAV_LINKS.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: 'var(--pc-serif)',
                    fontSize: 'var(--pc-text-2xl)',
                    color: active ? '#fff' : 'var(--pc-fg-3)',
                    padding: 'var(--pc-space-4) 0',
                    borderBottom: '1px solid var(--pc-line)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    transition: 'color var(--pc-dur-fast) var(--pc-ease)',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom CTA inside drawer */}
          <div style={{ marginTop: 'auto', paddingTop: 'var(--pc-space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
            <Link
              href="/book"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', textAlign: 'center',
                padding: 'var(--pc-space-4)', borderRadius: 'var(--pc-radius-pill)',
                background: 'var(--pc-warm)', color: 'var(--pc-ink)',
                fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
                fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}
            >
              Book Now
            </Link>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', textAlign: 'center',
                padding: 'var(--pc-space-4)', borderRadius: 'var(--pc-radius-pill)',
                border: '1px solid var(--pc-line-strong)',
                color: 'var(--pc-fg)', background: 'transparent',
                fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
                fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
