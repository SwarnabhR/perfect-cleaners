import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://perfectcleaners.co.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/workers',
          '/customers',
          '/societies-mgmt',
          '/tower-billing',
          '/pending-approvals',
          '/cleaning-schedule',
          '/live-cleaning',
          '/customer-enrollments',
          '/billing',
          '/settings',
          '/worker/',
          '/account/',
          '/session/',
          '/signin',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
