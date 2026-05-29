import type { Metadata } from 'next';
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { I18nProvider } from '@/i18n';
import { CustomerAuthProvider } from '@/lib/auth/CustomerAuthContext';
import './globals.css';

// Only load the three weights we actually use — 300 and 700 don't appear anywhere
const serif = Instrument_Serif({
  subsets:  ['latin'],
  weight:   '400',
  variable: '--font-serif',
  display:  'swap',
});

const sans = Inter_Tight({
  subsets:  ['latin'],
  weight:   ['400', '500', '600'],
  variable: '--font-sans',
  display:  'swap',
});

const mono = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500'],
  variable: '--font-mono',
  display:  'swap',
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://perfectcleaners.in';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default:  'Perfect Cleaners — Premium Car Wash & Detailing, Delhi NCR',
    template: '%s | Perfect Cleaners',
  },
  description:
    'Professional car detailing, advanced ceramic coatings, and showroom-quality results. Serving Delhi NCR from our centre in Ghaziabad. Book online in under 2 minutes.',

  keywords: [
    'car detailing Delhi',
    'ceramic coating Ghaziabad',
    'car wash NCR',
    'interior detailing Noida',
    'paint protection film Delhi',
    'premium car wash',
  ],

  openGraph: {
    type:        'website',
    locale:      'en_IN',
    url:         BASE_URL,
    siteName:    'Perfect Cleaners',
    title:       'Perfect Cleaners — Premium Car Detailing, Delhi NCR',
    description: 'Certified specialists, professional-grade products. At your driveway or our centre in Ghaziabad — booked in under 2 minutes.',
    images: [
      {
        url:    '/og-default.png',
        width:  1200,
        height: 630,
        alt:    'Perfect Cleaners — Premium Car Detailing',
      },
    ],
  },

  twitter: {
    card:        'summary_large_image',
    title:       'Perfect Cleaners — Premium Car Detailing, Delhi NCR',
    description: 'Certified specialists, professional-grade products. Booked in under 2 minutes.',
    images:      ['/og-default.png'],
  },

  robots: {
    index:             true,
    follow:            true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },
};

// NOTE: maximumScale is intentionally omitted — setting it to 1 violates
// WCAG 1.4.4 by preventing user-initiated zoom. iOS input auto-zoom is
// prevented via font-size: 16px on mobile inputs (globals.css).
export const viewport = {
  width:       'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <CustomerAuthProvider>
              {children}
              <Analytics />
            </CustomerAuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
