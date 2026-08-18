'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@pc/firebase';
import Icon from '@/components/ui/Icon';
import { useTheme } from '@/components/ThemeProvider';
import { AdminAuthProvider, useAdminAuth } from '@/components/AdminAuthProvider';

// Module-level so React never sees a new component type on re-render of AdminShell.
function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { role } = useAdminAuth();
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

      <nav style={{ flex: 1, padding: 'var(--pc-space-3) var(--pc-space-2)', overflowY: 'auto' }}>
        {NAV_SECTIONS.map(section => {
          const visible = section.items.filter(item => canAccess(role, item.capability));
          if (visible.length === 0) return null;
          return (
            <div key={section.heading ?? 'top'}>
              {section.heading && (
                <p style={{
                  fontFamily: 'var(--pc-mono)', fontSize: 10, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'var(--pc-fg-4)',
                  margin: 'var(--pc-space-4) 0 var(--pc-space-1)', padding: '0 var(--pc-space-3)',
                }}>
                  {section.heading}
                </p>
              )}
              {visible.map(({ label, href, icon }) => {
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
            </div>
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

type NavItem = {
  label: string;
  href: string;
  icon: string;
  capability: 'analyst' | 'operations' | 'billing' | 'support' | 'owner';
};

// Grouped by the owner's mental model — run today's work, manage customers,
// configure once, reconcile money, supervise the automation — rather than by
// which subsystem a page happens to belong to.
const NAV_SECTIONS: { heading: string | null; items: NavItem[] }[] = [
  { heading: null, items: [
    { label: 'Dashboard',   href: '/dashboard',       icon: 'layout-dashboard', capability: 'analyst' },
  ]},
  { heading: 'Today', items: [
    { label: 'Live Cleaning', href: '/live-cleaning', icon: 'activity', capability: 'operations' },
    { label: 'Cleaning Logs', href: '/cleaning-logs', icon: 'list-checks', capability: 'operations' },
  ]},
  { heading: 'Customers', items: [
    { label: 'Approvals',   href: '/pending-approvals', icon: 'check-circle', capability: 'operations' },
    { label: 'Enrollments', href: '/customer-enrollments', icon: 'users', capability: 'operations' },
    { label: 'Customers',   href: '/customers',      icon: 'users', capability: 'support' },
  ]},
  { heading: 'Setup', items: [
    { label: 'Societies',   href: '/societies-mgmt',  icon: 'building-2', capability: 'operations' },
    { label: 'Tower Billing', href: '/tower-billing', icon: 'credit-card', capability: 'billing' },
    { label: 'Workers',     href: '/workers',        icon: 'hard-hat', capability: 'operations' },
    { label: 'Settings',    href: '/settings',       icon: 'settings', capability: 'owner' },
  ]},
  { heading: 'Money', items: [
    { label: 'Billing',     href: '/billing',        icon: 'indian-rupee', capability: 'billing' },
  ]},
  { heading: 'System', items: [
    { label: 'Operations', href: '/operations', icon: 'inbox', capability: 'operations' },
    // Exception tool, not daily workflow — sessions generate, start, and
    // close automatically; this page is for reassignment and corrections.
    { label: 'Session Monitor', href: '/cleaning-schedule', icon: 'calendar', capability: 'operations' },
    { label: 'Notifications', href: '/notifications', icon: 'bell', capability: 'support' },
    { label: 'System Health', href: '/system-health', icon: 'heart-pulse', capability: 'operations' },
  ]},
];

// Flat list, section order preserved — the mobile bottom bar takes the first
// five visible items, so "Today" pages land right after Dashboard.
const NAV: NavItem[] = NAV_SECTIONS.flatMap(s => s.items);

function canAccess(role: ReturnType<typeof useAdminAuth>['role'], capability: NavItem['capability']) {
  if (role === 'owner') return true;
  if (role === 'operations') return ['analyst', 'operations'].includes(capability);
  if (role === 'billing') return ['analyst', 'billing'].includes(capability);
  if (role === 'support') return ['analyst', 'support'].includes(capability);
  return capability === 'analyst';
}

// Bottom-tab items (5 most important for mobile)

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
  const [alerts, setAlerts] = useState<{ id: string; message?: string; type?: string }[]>([]);
  const { theme, toggle } = useTheme();
  const { user, role, signOut } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => onSnapshot(
    query(collection(db, 'notifications'), orderBy('sentAt', 'desc'), limit(50)),
    snap => setAlerts(snap.docs
      .map(d => ({ id: d.id, ...d.data() } as { id: string; message?: string; type?: string; status?: string }))
      .filter(n => n.type === 'cron_alert' || n.status === 'failed')
      .slice(0, 5)),
    err => console.warn('[AdminAlerts]', err.message),
  ), []);

  // /login renders its own full-screen layout — don't bleed the
  // authenticated sidebar/topbar chrome behind it.
  if (pathname === '/login') return <>{children}</>;

  return (
    <>
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
          {/* zIndex 50: must exceed the click-outside overlay's zIndex 49 below —
              header creates its own stacking context, so its profile/alerts
              dropdowns (zIndex 100, but scoped to this context) would otherwise
              render visually on top yet still receive the overlay's clicks. */}
          <header style={{
            position: 'sticky', top: 0, zIndex: 50,
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
              onSubmit={e => { e.preventDefault(); const term = searchQuery.trim(); if (term) { router.push(`/live-cleaning?q=${encodeURIComponent(term)}`); setSearchQuery(''); } }}
              style={{ flex: 1, maxWidth: 400 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-2)', background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 'var(--pc-radius-pill)', padding: 'var(--pc-space-2) var(--pc-space-4)' }}>
                <Icon name="search" size={14} color="var(--pc-fg-4)" />
                <input
                  className="admin-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search cleaning sessions…"
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
                  <span className="hide-xs">Alerts{alerts.length ? ` (${alerts.length})` : ''}</span>
                </button>
                {alertsOpen && (
                  <div className="admin-dropdown-pop" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 10, padding: 16, minWidth: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 100 }}>
                    <p style={{ fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ALERTS</p>
                    {alerts.length === 0 ? (
                      <p style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)', margin: 0, lineHeight: 1.5 }}>No active delivery or cron alerts.</p>
                    ) : alerts.map(alert => (
                      <Link key={alert.id} href="/notifications" onClick={() => setAlertsOpen(false)} style={{ display: 'block', color: 'var(--pc-danger)', fontFamily: 'var(--pc-sans)', fontSize: 12, lineHeight: 1.4, textDecoration: 'none', padding: '8px 0', borderTop: '1px solid var(--pc-line)' }}>
                        {alert.message ?? 'A notification delivery failed.'}
                      </Link>
                    ))}
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
                  <div className="admin-dropdown-pop" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--pc-card)', border: '1px solid var(--pc-line)', borderRadius: 10, padding: 16, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 100 }}>
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
          {NAV.filter(item => canAccess(role, item.capability)).slice(0, 5).map(({ label, href, icon }) => {
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
