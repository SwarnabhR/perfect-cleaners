'use client';
// Force every route in the (admin) group to be rendered at request time.
// Admin pages are auth-gated and use live Firestore — they must never be
// statically pre-generated (which runs without env vars and crashes Firebase).
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useTheme } from '@/components/ThemeProvider';
import { AdminAuthProvider, useAdminAuth } from '@/components/AdminAuthProvider';

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
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAdminAuth();

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
        <div style={{ padding: 'var(--pc-space-6) var(--pc-space-5) var(--pc-space-4)', borderBottom: '1px solid var(--pc-line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-3)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--pc-radius-sm)', background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkles" size={14} color="var(--pc-ink)" />
            </div>
            <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-base)', color: 'var(--pc-fg)' }}>Perfect Cleaners</span>
          </div>
          <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)', marginTop: 'var(--pc-space-1)', display: 'block' }}>Admin</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: 'var(--pc-space-3) var(--pc-space-2)' }}>
          {NAV.map(({ label, href, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--pc-space-3)',
                  padding: 'var(--pc-space-2) var(--pc-space-3)',
                  borderRadius: 'var(--pc-radius-sm)',
                  marginBottom: 'var(--pc-space-1)',
                  background: active
                    ? 'color-mix(in srgb, var(--pc-sage) 12%, transparent)'
                    : 'transparent',
                  color: active ? 'var(--pc-sage)' : 'var(--pc-fg-2)',
                  fontFamily: 'var(--pc-sans)',
                  fontSize: 'var(--pc-text-sm)',
                  fontWeight: active ? 600 : 400,
                  transition: 'background var(--pc-dur-fast) var(--pc-ease)',
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
          padding: 'var(--pc-space-3) var(--pc-space-4)',
          borderTop: '1px solid var(--pc-line)',
          display: 'flex', alignItems: 'center', gap: 'var(--pc-space-3)',
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--pc-radius-pill)', background: 'var(--pc-card-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="user" size={14} color="var(--pc-fg-2)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg)', margin: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName ?? 'Admin'}
            </p>
            <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? 'ops@perfectcleaners.in'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            onClick={signOut}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28,
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--pc-radius-xs)',
              cursor: 'pointer',
              flexShrink: 0,
              color: 'var(--pc-fg-4)',
              transition: 'color var(--pc-dur-fast) var(--pc-ease)',
            }}
          >
            <Icon name="log-out" size={14} color="currentColor" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', gap: 'var(--pc-space-3)',
          padding: 'var(--pc-space-4) var(--pc-space-8)',
          background: 'var(--pc-ink-overlay)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--pc-line)',
        }}>
          {/* Search bar */}
          <div style={{
            flex: 1, maxWidth: 400,
            display: 'flex', alignItems: 'center', gap: 'var(--pc-space-2)',
            background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
            borderRadius: 'var(--pc-radius-pill)',
            padding: 'var(--pc-space-2) var(--pc-space-4)',
          }}>
            <Icon name="search" size={14} color="var(--pc-fg-4)" />
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-4)' }}>Search\u2026</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--pc-space-2)' }}>
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                width: 36, height: 36, borderRadius: 'var(--pc-radius-pill)',
                background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                transition: 'background var(--pc-dur-fast) var(--pc-ease)',
              }}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} color="var(--pc-fg-3)" />
            </button>
            <button type="button" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--pc-space-2)',
              background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
              borderRadius: 'var(--pc-radius-pill)',
              padding: 'var(--pc-space-2) var(--pc-space-4)', cursor: 'pointer',
              fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg)',
            }}>
              <Icon name="bell" size={14} color="var(--pc-fg-3)" />
              Alerts
            </button>
            <button type="button" style={{
              width: 36, height: 36, borderRadius: 'var(--pc-radius-pill)',
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
