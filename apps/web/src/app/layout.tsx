import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { I18nProvider } from '@/i18n';
import { CustomerAuthProvider } from '@/lib/auth/CustomerAuthContext';
import './globals.css';

const serif = localFont({
  src:      './fonts/InstrumentSerif-Regular.ttf',
  variable: '--font-serif',
  display:  'swap',
});

const sans = localFont({
  src: [
    { path: './fonts/InterTight-Regular.ttf', weight: '400' },
    { path: './fonts/InterTight-Medium.ttf', weight: '500' },
    { path: './fonts/InterTight-SemiBold.ttf', weight: '600' },
    { path: './fonts/InterTight-Bold.ttf', weight: '700' },
  ],
  variable: '--font-sans',
  display:  'swap',
});

const mono = localFont({
  src: [
    { path: './fonts/JetBrainsMono-Regular.ttf', weight: '400' },
    { path: './fonts/JetBrainsMono-Medium.ttf', weight: '500' },
  ],
  variable: '--font-mono',
  display: 'swap',
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://perfectcleaners.co.in';

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
        url:    '/opengraph-image',
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
    images:      ['/opengraph-image'],
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
    <html lang="en" data-theme="light" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
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
