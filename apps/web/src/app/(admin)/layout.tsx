'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useTheme } from '@/components/ThemeProvider';

const NAV = [
  { label: 'Dashboard',  href: '/dashboard',     icon: 'layout-dashboard' },
  { label: 'Bookings',   href: '/bookings',       icon: 'calendar' },
  { label: 'Customers',  href: '/customers',      icon: 'users' },
  { label: 'Workers',    href: '/workers',        icon: 'hard-hat' },
  { label: 'Services',   href: '/services-mgmt',  icon: 'sparkles' },
  { label: 'Promotions', href: '/promotions',     icon: 'tag' },
  { label: 'Analytics',  href: '/analytics',      icon: 'bar-chart-2' },
  { label: 'Settings',   href: '/settings',       icon: 'settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--pc-ink)' }}>

      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--pc-card)', borderRight: '1px solid var(--pc-line)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--pc-line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkles" size={14} color="var(--pc-ink)" />
            </div>
            <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 16, color: 'var(--pc-fg)' }}>Perfect Cleaners</span>
          </div>
          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 10, color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, display: 'block' }}>Admin</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map(({ label, href, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  background: active ? 'var(--pc-sage-tint, color-mix(in srgb, var(--pc-sage) 12%, transparent))' : 'transparent',
                  color: active ? 'var(--pc-sage)' : 'var(--pc-fg-2)',
                  fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'background 0.15s',
                }}>
                  <Icon name={icon} size={15} color={active ? 'var(--pc-sage)' : 'var(--pc-fg-3)'} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom user row */}
        <div style={{
          padding: '12px 14px', borderTop: '1px solid var(--pc-line)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="user" size={14} color="var(--pc-fg-2)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)', margin: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Admin</p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 11, color: 'var(--pc-fg-3)', margin: 0 }}>ops@perfectcleaners.in</p>
          </div>
          <Icon name="log-out" size={14} color="var(--pc-fg-4)" style={{ cursor: 'pointer', flexShrink: 0 }} />
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 28px',
          background: 'var(--pc-ink-overlay)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--pc-line)',
        }}>
          {/* Search bar */}
          <div style={{
            flex: 1, maxWidth: 400,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 999,
            padding: '7px 14px',
          }}>
            <Icon name="search" size={14} color="var(--pc-fg-4)" />
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)' }}>Search\u2026</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: 36, height: 36, borderRadius: 999,
                background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                transition: 'background var(--pc-dur-fast) var(--pc-ease)',
              }}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} color="var(--pc-fg-3)" />
            </button>
            <button type="button" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 999,
              padding: '7px 14px', cursor: 'pointer',
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg)',
            }}>
              <Icon name="bell" size={14} color="var(--pc-fg-3)" />
              Alerts
            </button>
            <button type="button" style={{
              width: 36, height: 36, borderRadius: 999,
              background: 'var(--pc-card-hi)', border: '1px solid var(--pc-line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Icon name="user" size={14} color="var(--pc-fg-2)" />
            </button>
          </div>
        </header>

        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
