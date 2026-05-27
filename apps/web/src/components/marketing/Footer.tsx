'use client';

import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import styles from './Footer.module.css';

const SOCIAL_LINKS = [
  { icon: 'camera',  href: 'https://instagram.com', label: 'Instagram' },
  { icon: 'phone',   href: 'tel:+919876543210',     label: 'Call us' },
  { icon: 'shield',  href: '/about',                label: 'About' },
  { icon: 'star',    href: '/membership',           label: 'Membership' },
] as const;

const QUICK_LINKS = [
  { label: 'Services',              href: '/services'   },
  { label: 'Exterior Wash',         href: '/services'   },
  { label: 'Interior Detailing',    href: '/services'   },
  { label: 'Painting & Coating',    href: '/services'   },
];

const OFFICIAL_LINES = [
  { label: 'Ghaziabad, Delhi NCR',  href: undefined },
  { label: '+91 98765 43210',       href: 'tel:+919876543210' },
  { label: '09:00 – 21:00 IST',     href: undefined },
];

const BOOKING_LINKS = [
  { label: 'Book a Service',  href: '/book'       },
  { label: 'Our Gallery',     href: '/gallery'    },
  { label: 'Special Promo',   href: '/membership' },
];

export default function Footer() {
  return (
    <footer
      className={`pc-footer-grid ${styles.footer}`}
      style={{
        padding: 'var(--pc-space-20) var(--pc-screen-pad-lg) var(--pc-space-10)',
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
        gap: 'var(--pc-space-10)',
        borderTop: '1px solid var(--pc-line)',
        marginTop: 'var(--pc-space-20)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pc-space-2)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-pc-monogram.svg" width={28} height={32} alt="Perfect Cleaners mark" />
          <span style={{
            fontFamily: 'var(--pc-mono)',
            fontSize: 'var(--pc-text-sm)',
            color: 'var(--pc-fg)',
            letterSpacing: 'var(--pc-track-mono)',
          }}>
            perfect<span style={{ color: 'var(--pc-fg-3)' }}>.cleaners</span>
          </span>
        </div>

        <Eyebrow>EMAIL →</Eyebrow>
        <a
          href="mailto:hello@perfectcleaners.in"
          className={`${styles.emailLink} pc-footer-email`}
        >
          hello@perfectcleaners.in
        </a>

        <Eyebrow>SOCIAL MEDIA</Eyebrow>
        <div style={{ display: 'flex', gap: 'var(--pc-space-2)' }}>
          {SOCIAL_LINKS.map(({ icon, href, label }) => (
            <a
              key={icon}
              href={href}
              aria-label={label}
              className={styles.socialIcon}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <Icon name={icon} size={14} color="var(--pc-fg-2)" />
            </a>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <Eyebrow>QUICK LINKS</Eyebrow>
        <div style={{ marginTop: 'var(--pc-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
          {QUICK_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className={styles.navLink}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Official */}
      <div>
        <Eyebrow>OFFICIAL</Eyebrow>
        <div style={{ marginTop: 'var(--pc-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
          {OFFICIAL_LINES.map(({ label, href }) =>
            href ? (
              <a key={label} href={href} className={styles.navLink}>
                {label}
              </a>
            ) : (
              <div key={label} style={{ fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)' }}>
                {label}
              </div>
            )
          )}
        </div>
      </div>

      {/* Booking */}
      <div>
        <Eyebrow>BOOKING</Eyebrow>
        <div style={{ marginTop: 'var(--pc-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
          {BOOKING_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className={styles.navLink}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
