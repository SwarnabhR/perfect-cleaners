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
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
