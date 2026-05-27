import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import Eyebrow from '@/components/ui/Eyebrow';

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/dashboard',   icon: 'bar-chart-3' },
  { label: 'Bookings',    href: '/bookings',     icon: 'calendar'    },
  { label: 'Workers',     href: '/workers',      icon: 'users'       },
  { label: 'Customers',   href: '/customers',    icon: 'user'        },
  { label: 'Services',    href: '/services-mgmt',icon: 'sparkles'    },
  { label: 'Promotions',  href: '/promotions',   icon: 'star'        },
  { label: 'Settings',    href: '/settings',     icon: 'settings'    },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        borderRight: '1px solid var(--pc-line)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--pc-ink-raised)',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid var(--pc-line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-pc-monogram.svg" width={22} height={26} alt="Perfect Cleaners" />
            <div>
              <div style={{ fontFamily: 'var(--pc-serif)', fontSize: 14, color: '#fff', letterSpacing: '0.04em' }}>perfect.cleaners</div>
              <Eyebrow>Admin Console</Eyebrow>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV_ITEMS.map(({ label, href, icon }) => (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, marginBottom: 2,
              fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-2)',
              fontWeight: 500,
            }}>
              <Icon name={icon} size={16} color="var(--pc-fg-3)" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Operator footer */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--pc-line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="Admin User" size={30} />
            <div>
              <div style={{ fontFamily: 'var(--pc-sans)', fontSize: 12, color: '#fff', fontWeight: 500 }}>Admin User</div>
              <Eyebrow>Operations</Eyebrow>
            </div>
            <Icon name="log-out" size={14} color="var(--pc-fg-3)" style={{ marginLeft: 'auto' }} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', position: 'relative' }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 28px',
          background: 'rgba(14,13,11,0.88)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--pc-line)',
        }}>
          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', background: 'var(--pc-card)', borderRadius: 10,
            border: '1px solid var(--pc-line)', flex: 1, maxWidth: 320,
          }}>
            <Icon name="search" size={14} color="var(--pc-fg-3)" />
            <span style={{ fontFamily: 'var(--pc-sans)', fontSize: 13, color: 'var(--pc-fg-3)' }}>
              Search bookings, customers…
            </span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--pc-mono)', fontSize: 10, color: 'var(--pc-fg-3)', padding: '2px 6px', border: '1px solid var(--pc-line)', borderRadius: 4 }}>⌘ K</span>
          </div>
          {/* Spacer */}
          <div style={{ flex: 1 }} />
          {/* New booking button */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 999,
            background: 'var(--pc-warm)', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--pc-sans)', fontSize: 12, fontWeight: 600,
            color: 'var(--pc-ink)', letterSpacing: '0.06em',
          }}>+ NEW BOOKING</button>
          {/* Notification bell */}
          <button style={{
            width: 36, height: 36, borderRadius: 999,
            background: 'var(--pc-card)', border: '1px solid var(--pc-line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}>
            <Icon name="bell" size={15} color="var(--pc-fg-2)" />
            <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: 999, background: 'var(--pc-warning)' }} />
          </button>
        </header>

        {children}
      </main>
    </div>
  );
}
