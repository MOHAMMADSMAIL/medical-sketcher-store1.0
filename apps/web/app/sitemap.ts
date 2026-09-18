import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://medicalsketcherstore.com';
  const routes = ['/', '/shop', '/login', '/register'];
  return routes.map((route, index) => ({ url: `${base}${route}`, lastModified: new Date(), changeFrequency: index === 0 ? 'weekly' : 'daily', priority: index === 0 ? 1 : 0.7 }));
}
