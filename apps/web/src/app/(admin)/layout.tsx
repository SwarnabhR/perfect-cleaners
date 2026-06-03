'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useTheme } from '@/components/ThemeProvider';
import { AdminAuthProvider, useAdminAuth } from '@/components/AdminAuthProvider';

// Module-level so React never sees a new component type on re-render of AdminShell.
function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'var(--pc-card)', borderRight: '1px solid var(--pc-line)',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflowY: 'auto',
    }}>
      <div style={{ padding: 'var(--pc-space-6) var(--pc-space-5) var(--pc-space-4)', borderBottom: '1px solid var(--pc-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-3)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 'var(--pc-radius-sm)', background: 'var(--pc-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={14} color="var(--pc-ink)" />
          </div>
          <div>
            <span style={{ fontFamily: 'var(--pc-serif)', fontSize: 'var(--pc-text-base)', color: 'var(--pc-fg)', display: 'block' }}>Perfect Cleaners</span>
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-xs)', color: 'var(--pc-fg-4)', textTransform: 'uppercase', letterSpacing: 'var(--pc-track-wide)' }}>Admin</span>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close menu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pc-fg-3)', display: 'flex', padding: 4 }}>
            <Icon name="x" size={18} color="currentColor" />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: 'var(--pc-space-3) var(--pc-space-2)' }}>
        {NAV.map(({ label, href, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }} onClick={onClose}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--pc-space-3)',
                padding: 'var(--pc-space-2) var(--pc-space-3)',
                borderRadius: 'var(--pc-radius-sm)', marginBottom: 'var(--pc-space-1)',
                background: active ? 'color-mix(in srgb, var(--pc-sage) 12%, transparent)' : 'transparent',
                color: active ? 'var(--pc-sage)' : 'var(--pc-fg-2)',
                fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)',
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

      <SidebarFooter />
    </aside>
  );
}

function SidebarFooter() {
  const { user, signOut } = useAdminAuth();
  return (
    <div style={{ padding: 'var(--pc-space-3) var(--pc-space-4)', borderTop: '1px solid var(--pc-line)', display: 'flex', alignItems: 'center', gap: 'var(--pc-space-3)' }}>
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
      <button type="button" aria-label="Sign out" onClick={signOut} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'transparent', border: 'none', borderRadius: 'var(--pc-radius-xs)', cursor: 'pointer', color: 'var(--pc-fg-4)', transition: 'color var(--pc-dur-fast) var(--pc-ease)' }}>
        <Icon name="log-out" size={14} color="currentColor" />
      </button>
    </div>
  );
}

const NAV = [
  { label: 'Dashboard',  href: '/dashboard',    icon: 'layout-dashboard' },
  { label: 'Societies',  href: '/societies-mgmt', icon: 'building-2'     },
  { label: 'Bookings',   href: '/bookings',      icon: 'calendar'         },
  { label: 'Customers',  href: '/customers',     icon: 'users'            },
  { label: 'Workers',    href: '/workers',        icon: 'hard-hat'         },
  { label: 'Activity',   href: '/cleaning-logs', icon: 'list-checks'      },
  { label: 'Services',   href: '/services-mgmt', icon: 'sparkles'         },
  { label: 'Promotions', href: '/promotions',    icon: 'tag'              },
  { label: 'Analytics',  href: '/analytics',     icon: 'bar-chart-2'      },
  { label: 'Settings',   href: '/settings',      icon: 'settings'         },
];

// Bottom-tab items (5 most important for mobile)
const TABS = NAV.slice(0, 5);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const [open,        setOpen]        = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertsOpen,  setAlertsOpen]  = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      {/* ── Responsive styles injected once at layout level ───────────────── */}
      <style>{`
        /* Page wrapper */
        .admin-page-root {
          padding: clamp(16px, 4vw, 32px);
          display: flex;
          flex-direction: column;
          gap: clamp(16px, 3vw, 28px);
        }

        /* KPI grids */
        .kpi-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .kpi-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

        /* 2-col chart rows */
        .charts-row-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        .charts-row-1-4-1 { display: grid; grid-template-columns: 1.4fr 1fr; gap: 12px; }

        /* Table overflow scroll */
        .table-scroll-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-scroll-wrap table { min-width: 600px; }

        /* Mobile sidebar overlay */
        .sidebar-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.5);
        }
        .sidebar-drawer {
          display: none;
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 210;
          width: 280px;
          box-shadow: 4px 0 24px rgba(0,0,0,0.3);
        }
        .hamburger-btn { display: none; }

        /* Bottom nav (mobile) */
        .bottom-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
          background: var(--pc-card);
          border-top: 1px solid var(--pc-line);
          padding: 8px 0 env(safe-area-inset-bottom, 8px);
        }
        .bottom-nav-inner {
          display: flex;
          justify-content: space-around;
          align-items: center;
        }
        .bottom-nav-item {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 6px 12px;
          text-decoration: none;
          font-family: var(--pc-sans); font-size: 10px;
          color: var(--pc-fg-3);
          border-radius: var(--pc-radius-sm);
          transition: color var(--pc-dur-fast) var(--pc-ease);
          min-width: 44px; min-height: 44px; justify-content: center;
        }
        .bottom-nav-item.active { color: var(--pc-sage); }

        /* ── Breakpoints ── */
        @media (max-width: 1023px) {
          .sidebar-static   { display: none !important; }
          .hamburger-btn     { display: flex !important; }
          .sidebar-overlay.is-open { display: block; }
          .sidebar-drawer.is-open  { display: flex !important; flex-direction: column; }
        }

        @media (max-width: 767px) {
          .kpi-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .kpi-grid-3 { grid-template-columns: repeat(2, 1fr); }
          .charts-row-2-1   { grid-template-columns: 1fr; }
          .charts-row-1-4-1 { grid-template-columns: 1fr; }
        }

        @media (max-width: 639px) {
          .bottom-nav { display: block; }
          /* push page content above bottom nav */
          .admin-main-content { padding-bottom: 72px; }
        }

        @media (max-width: 479px) {
          .kpi-grid-4 { grid-template-columns: 1fr 1fr; }
          .kpi-grid-3 { grid-template-columns: 1fr; }
        }

        /* Responsive page title used on every admin page */
        .admin-page-title {
          font-family: var(--pc-serif);
          font-size: clamp(22px, 4vw, 28px);
          font-weight: 400;
          color: var(--pc-fg);
          margin: 0;
          letter-spacing: -0.02em;
        }

        /* Page header row: title left, action button right — wraps on mobile */
        .admin-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        /* Filter chip rows that should wrap on mobile */
        .filter-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Drowdown/popover: never wider than viewport */
        .admin-dropdown {
          max-width: min(280px, 90vw);
        }

        .admin-search-input::placeholder { color: var(--pc-fg-4); }
        .admin-search-input::-webkit-search-cancel-button { display: none; }
        .hide-xs { display: none; }
        @media (min-width: 640px) { .hide-xs { display: inline; } }

        /* Stack filter rows on narrow screens */
        @media (max-width: 639px) {
          .filter-row {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-row .filter-chips {
            justify-content: flex-start;
          }
        }
      `}</style>

      {/* ── Mobile overlay ───────────────────────────────────────────────── */}
      <div className={`sidebar-overlay${open ? ' is-open' : ''}`} onClick={() => setOpen(false)} />

      {/* ── Mobile off-canvas drawer ─────────────────────────────────────── */}
      <div className={`sidebar-drawer${open ? ' is-open' : ''}`}>
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--pc-ink)' }}>

        {/* Desktop sidebar */}
        <div className="sidebar-static" style={{ position: 'sticky', top: 0, height: '100vh' }}>
          <Sidebar />
        </div>

        {/* Page area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Top bar */}
          <header style={{
            position: 'sticky', top: 0, zIndex: 40,
            display: 'flex', alignItems: 'center', gap: 'var(--pc-space-3)',
            padding: 'var(--pc-space-3) clamp(12px,4vw,var(--pc-space-8))',
            background: 'var(--pc-ink-overlay)', backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--pc-line)',
          }}>
            {/* Hamburger — hidden on desktop via CSS */}
            <button
              type="button"
              className="hamburger-btn"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              style={{
                alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36,
                background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
                borderRadius: 'var(--pc-radius-sm)', cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Icon name="menu" size={16} color="var(--pc-fg-2)" />
            </button>

            {/* Search */}
            <form
              onSubmit={e => { e.preventDefault(); if (searchQuery.trim()) { router.push(`/bookings?search=${encodeURIComponent(searchQuery.trim())}`); setSearchQuery(''); } }}
              style={{ flex: 1, maxWidth: 400 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-2)', background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-pill)', padding: 'var(--pc-space-2) var(--pc-space-4)' }}>
                <Icon name="search" size={14} color="var(--pc-fg-4)" />
                <input
                  className="admin-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search bookings…"
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg)', flex: 1, minWidth: 0 }}
                />
              </div>
            </form>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--pc-space-2)' }}>
              <button
                type="button" onClick={toggle}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{ width: 36, height: 36, borderRadius: 'var(--pc-radius-pill)', background: 'var(--pc-card)', border: '1px solid var(--pc-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background var(--pc-dur-fast) var(--pc-ease)' }}
              >
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} color="var(--pc-fg-3)" />
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => { setAlertsOpen(o => !o); setProfileOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-2)', background: alertsOpen ? 'var(--pc-card-hi)' : 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-pill)', padding: 'var(--pc-space-2) var(--pc-space-4)', cursor: 'pointer', fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg)' }}
                >
                  <Icon name="bell" size={14} color="var(--pc-fg-3)" />
                  <span className="hide-xs">Alerts</span>
                </button>
                {alertsOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 10, padding: 16, minWidth: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 100 }}>
                    <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ALERTS</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0, lineHeight: 1.5 }}>No new alerts.</p>
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => { setProfileOpen(o => !o); setAlertsOpen(false); }}
                  style={{ width: 36, height: 36, borderRadius: 'var(--pc-radius-pill)', background: profileOpen ? 'color-mix(in srgb, var(--pc-sage) 15%, transparent)' : 'var(--pc-card-hi)', border: '1px solid var(--pc-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Icon name="user" size={14} color="var(--pc-fg-2)" />
                </button>
                {profileOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 10, padding: 16, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 100 }}>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 14, fontWeight: 600, color: 'var(--pc-fg)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName ?? 'Admin'}</p>
                    <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: 'var(--pc-fg-3)', margin: '0 0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email ?? 'ops@perfectcleaners.in'}</p>
                    <button type="button" onClick={signOut} style={{ width: '100%', padding: '9px 0', borderRadius: 6, background: 'transparent', border: '1px solid var(--pc-line)', fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-danger)', cursor: 'pointer' }}>Sign out</button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="admin-main-content" style={{ flex: 1 }}>
            {children}
          </main>
        </div>
      </div>

      {/* Click-outside overlay to close dropdowns */}
      {(alertsOpen || profileOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => { setAlertsOpen(false); setProfileOpen(false); }} />
      )}

      {/* ── Bottom tab bar (mobile ≤639px) ───────────────────────────────── */}
      <nav className="bottom-nav" aria-label="Main navigation">
        <div className="bottom-nav-inner">
          {TABS.map(({ label, href, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} className={`bottom-nav-item${active ? ' active' : ''}`}>
                <Icon name={icon} size={20} color={active ? 'var(--pc-sage)' : 'var(--pc-fg-3)'} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
