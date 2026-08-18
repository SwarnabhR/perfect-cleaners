'use client';
import Link from 'next/link';

const ACCOUNT_TABS = [
  { label: 'Schedule', href: '/account/cleaning' },
  { label: 'Bookings', href: '/account'          },
  { label: 'Profile',  href: '/account/profile'  },
  { label: 'Bill',     href: '/account/wallet'   },
  { label: 'Alerts',   href: '/account/notifications' },
];

// Shared by every /account/* page so a tab added here shows up everywhere,
// instead of each page carrying its own copy of this array.
export default function AccountTabBar({ pathname }: { pathname: string }) {
  return (
    <div style={{
      display: 'flex', gap: 'var(--pc-space-1)',
      borderBottom: '1px solid var(--pc-line)',
      marginBottom: 'var(--pc-space-8)',
      overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
      scrollbarWidth: 'none' as React.CSSProperties['scrollbarWidth'],
    }}>
      {ACCOUNT_TABS.map(tab => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: 'var(--pc-space-3) var(--pc-space-4)',
              fontFamily: 'var(--pc-sans)', fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--pc-fg)' : 'var(--pc-fg-3)',
              textDecoration: 'none',
              borderBottom: active ? '2px solid var(--pc-fg)' : '2px solid transparent',
              marginBottom: -1,
              whiteSpace: 'nowrap',
              transition: 'color 0.15s ease',
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
