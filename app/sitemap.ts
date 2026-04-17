import type { MetadataRoute } from 'next';
import { COST_GUIDES } from '@/lib/costGuides';
import { absoluteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/vision'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/vision/start'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/shield'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: absoluteUrl('/shield/check'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/shield/scan'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/shield/rescue'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: absoluteUrl('/connect'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/for-contractors'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/cost-guides'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  ];

  const guideRoutes: MetadataRoute.Sitemap = COST_GUIDES.map((guide) => ({
    url: absoluteUrl(`/cost-guides/${guide.slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  return [...staticRoutes, ...guideRoutes];
}
