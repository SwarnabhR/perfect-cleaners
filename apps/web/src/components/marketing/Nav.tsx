'use client';
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
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 28,
      padding: '20px 56px',
      background: 'rgba(14,13,11,0.72)', backdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--pc-line)',
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Image src="/logo-pc-monogram.svg" width={24} height={28} alt="Perfect Cleaners mark" />
        <span style={{ fontFamily: 'var(--pc-mono)', fontSize: 14, color: '#fff', letterSpacing: '0.08em' }}>
          perfect<span style={{ color: 'var(--pc-fg-3)' }}>.cleaners</span>
        </span>
      </Link>

      {/* Nav links */}
      <div style={{
        display: 'flex', gap: 4, padding: 4, marginLeft: 'auto',
        background: 'var(--pc-card)', borderRadius: 999, border: '1px solid var(--pc-line)',
      }}>
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

      {/* Book Now CTA */}
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

      {/* User pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--pc-card)', borderRadius: 999, padding: '5px 14px 5px 5px',
        border: '1px solid var(--pc-line)',
      }}>
        <Avatar name="Aarav Mehta" size={30} />
        <div>
          <div style={{ fontFamily: 'var(--pc-sans)', 'var(--pc-text-xs)', color: '#fff', fontWeight: 500, lineHeight: 1.2 }}>Aarav Mehta</div>
          <div style={{ fontFamily: 'var(--pc-mono)', 'var(--pc-text-xs)', color: 'var(--pc-fg-3)', letterSpacing: '0.06em', lineHeight: 1.2 }}>aarav@mail.com</div>
        </div>
        <Icon name="chevron-down" size={12} color="var(--pc-fg-3)" style={{ marginLeft: 4 }} />
      </div>
    </nav>
  );
}
