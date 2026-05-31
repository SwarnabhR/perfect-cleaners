'use client';
import Link from 'next/link';
import Image from 'next/image';
import LogoMark from '@/components/ui/LogoMark';
import Eyebrow from '@/components/ui/Eyebrow';
import Icon from '@/components/ui/Icon';
import { useI18n } from '@/i18n';
import styles from './Footer.module.css';

const QUICK_LINKS_HREFS  = ['/services', '/services/exterior', '/services/interior', '/services/coating', '/terms', '/privacy'];
const OFFICIAL_HREFS     = [undefined, 'tel:+919876543210', undefined] as (string | undefined)[];
const BOOKING_HREFS      = ['/plans', '/for-societies', '/membership'];

const SOCIAL_LINKS = [
  { icon: 'camera',  href: 'https://instagram.com', ariaLabel: 'Instagram' },
  { icon: 'phone',   href: 'tel:+919876543210',     ariaLabel: 'Call us'   },
  { icon: 'shield',  href: '/about',                ariaLabel: 'About'     },
  { icon: 'star',    href: '/membership',           ariaLabel: 'Membership' },
] as const;

export default function Footer() {
  const { lang, setLang, t } = useI18n();
  const f = t.footer;

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
          <LogoMark width={28} height={32} color="var(--pc-fg)" />
          <span style={{
            fontFamily: 'var(--pc-mono)',
            fontSize: 'var(--pc-text-sm)',
            color: 'var(--pc-fg)',
            letterSpacing: 'var(--pc-track-mono)',
          }}>
            perfect<span style={{ color: 'var(--pc-fg-3)' }}>.cleaners</span>
          </span>
        </div>

        <Eyebrow>{f.emailLabel}</Eyebrow>
        <a
          href="mailto:hello@perfectcleaners.in"
          className={`${styles.emailLink} pc-footer-email`}
        >
          hello@perfectcleaners.in
        </a>

        <Eyebrow>{f.socialLabel}</Eyebrow>
        <div style={{ display: 'flex', gap: 'var(--pc-space-2)' }}>
          {SOCIAL_LINKS.map(({ icon, href, ariaLabel }) => (
            <a
              key={icon}
              href={href}
              aria-label={ariaLabel}
              className={styles.socialIcon}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <Icon name={icon} size={14} color="var(--pc-fg-2)" />
            </a>
          ))}
        </div>

        {/* Language toggle */}
        <div
          role="group"
          aria-label="Language"
          style={{
            display: 'inline-flex',
            border: '1px solid var(--pc-line)',
            borderRadius: 999,
            overflow: 'hidden',
            alignSelf: 'flex-start',
            marginTop: 'var(--pc-space-2)',
          }}
        >
          {(['en', 'hi'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              style={{
                padding: '5px 14px',
                background: lang === l ? 'var(--pc-card-hi)' : 'transparent',
                color: lang === l ? 'var(--pc-fg)' : 'var(--pc-fg-4)',
                fontFamily: 'var(--pc-sans)',
                fontSize: 12,
                fontWeight: lang === l ? 600 : 400,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.18s ease, color 0.18s ease',
              }}
            >
              {l === 'en' ? t.common.langEn : t.common.langHi}
            </button>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <Eyebrow>{f.quickLinksLabel}</Eyebrow>
        <div style={{ marginTop: 'var(--pc-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
          {f.quickLinks.map((label, i) => (
            <Link key={i} href={QUICK_LINKS_HREFS[i]} className={styles.navLink}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Official */}
      <div>
        <Eyebrow>{f.officialLabel}</Eyebrow>
        <div style={{ marginTop: 'var(--pc-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
          {f.official.map((label, i) => {
            const href = OFFICIAL_HREFS[i];
            return href ? (
              <a key={i} href={href} className={styles.navLink}>
                {label}
              </a>
            ) : (
              <p key={i} style={{ margin: 0, fontFamily: 'var(--pc-sans)', fontSize: 'var(--pc-text-sm)', color: 'var(--pc-fg-2)' }}>
                {label}
              </p>
            );
          })}
        </div>
      </div>

      {/* Booking */}
      <div>
        <Eyebrow>{f.bookingLabel}</Eyebrow>
        <div style={{ marginTop: 'var(--pc-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--pc-space-3)' }}>
          {f.booking.map((label, i) => (
            <Link key={i} href={BOOKING_HREFS[i]} className={styles.navLink}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
