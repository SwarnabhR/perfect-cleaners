import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Gzip/Brotli all responses
  compress: true,

  images: {
    // Serve AVIF first (best compression), fall back to WebP, then original
    formats: ['image/avif', 'image/webp'],
    // Breakpoints matching our CSS breakpoints + common device widths.
    // Next.js picks the nearest size ≥ the rendered width, so keep this
    // dense around the mobile range where we serve the most traffic.
    deviceSizes: [375, 430, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes:  [16, 32, 64, 96, 128, 160, 256, 384, 512],
    // Default is 60 — keep (good quality/size balance)
    // quality: 75,
    // Never unoptimise local assets
    unoptimized: false,
  },

  // Redirect admin subdomain root → /dashboard
  async redirects() {
    return [
      {
        source:      '/',
        has:         [{ type: 'host', value: 'admin.perfectcleaners.in' }],
        destination: '/dashboard',
        permanent:   false,
      },
      // /societies was split: public marketing → /for-societies, admin → /societies-mgmt.
      // This config-level redirect fires before any page.tsx renders, preventing the
      // route collision between app/(admin)/societies/page.tsx and app/societies/page.tsx.
      {
        source:      '/societies',
        destination: '/for-societies',
        permanent:   true,
      },
    ];
  },

  // Security headers — applied to every route
  async headers() {
    const base = [
      { key: 'X-Frame-Options',         value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options',  value: 'nosniff' },
      { key: 'X-DNS-Prefetch-Control',  value: 'on' },
      { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
      {
        key:   'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
      },
      {
        key:   'Strict-Transport-Security',
        // 2-year max-age; preload eligible
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key:   'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://verify.msg91.com https://verify.phone91.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://*.vercel-analytics.com https://verify.msg91.com https://verify.phone91.com https://control.msg91.com wss:",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests",
        ].join('; '),
      },
    ];

    return [{ source: '/(.*)', headers: base }];
  },
};

export default nextConfig;
