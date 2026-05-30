'use client';

import { WorkerAuthProvider, useWorkerAuth } from '@/components/WorkerAuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';

const NAV = [
  { label: 'Dashboard', href: '/worker/dashboard', icon: 'layout-dashboard' },
  { label: 'Jobs',      href: '/worker/jobs',      icon: 'calendar'         },
  { label: 'Earnings',  href: '/worker/earnings',  icon: 'indian-rupee'     },
  { label: 'Profile',   href: '/worker/profile',   icon: 'user'             },
] as const;

function WorkerShell({ children }: { children: React.ReactNode }) {
  const { worker, loading, signOut } = useWorkerAuth();
  const pathname = usePathname();

  if (pathname === '/worker/login') return <>{children}</>;
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--pc-ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-4)' }}>
          Loading…
        </span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pc-ink)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 var(--pc-screen-pad-lg)',
        height: 56,
        background: 'var(--pc-ink-overlay)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--pc-line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--pc-sage)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="hard-hat" size={14} color="var(--pc-sage-ink)" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, fontWeight: 600, color: 'var(--pc-fg)', lineHeight: 1.2 }}>
              {worker?.name ?? 'Worker Portal'}
            </div>
            <div style={{ fontFamily: 'var(--pc-mono)', fontSize: 9, color: 'var(--pc-fg-4)', letterSpacing: '0.1em' }}>
              PERFECT CLEANERS
            </div>
          </div>
        </div>

        {/* Online status badge */}
        {worker && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: worker.isOnline ? 'rgba(111,174,106,0.15)' : 'var(--pc-card)',
            border: `1px solid ${worker.isOnline ? 'rgba(111,174,106,0.4)' : 'var(--pc-line)'}`,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: worker.isOnline ? 'var(--pc-success)' : 'var(--pc-fg-4)',
            }} />
            <span style={{
              fontFamily: 'var(--pc-sans)', fontSize: 11, fontWeight: 500,
              color: worker.isOnline ? 'var(--pc-success)' : 'var(--pc-fg-4)',
            }}>
              {worker.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        )}
      </header>

      {/* Page content */}
      <main style={{ flex: 1, paddingBottom: 72 }}>
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'var(--pc-card)',
        borderTop: '1px solid var(--pc-line)',
        padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
        display: 'flex',
      }}>
        {NAV.map(({ label, href, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '4px 0',
              textDecoration: 'none',
              color: active ? 'var(--pc-sage-hi)' : 'var(--pc-fg-4)',
              transition: 'color 0.15s ease',
            }}>
              <Icon name={icon} size={20} color="currentColor" />
              <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 10, fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkerAuthProvider>
      <WorkerShell>{children}</WorkerShell>
    </WorkerAuthProvider>
  );
}
