import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://perfectcleaners.in';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                           lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/book`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/plans`,                lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/services`,             lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/services/exterior`,    lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/services/interior`,    lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/services/coating`,     lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/about`,                lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`,              lastModified: now, changeFrequency: 'yearly',  priority: 0.6 },
    { url: `${BASE}/app`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/faq`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/membership`,           lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/terms`,                lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/privacy`,              lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];

  return staticRoutes;
}
