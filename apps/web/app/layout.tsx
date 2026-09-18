import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Providers from './providers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medicalsketcherstore.com';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Medical Sketcher Store — German for Healthcare Professionals', template: '%s | Medical Sketcher Store' },
  description: 'Visual, practical German learning materials for nurses and healthcare professionals.',
  keywords: ['German for nurses', 'Medical German', 'healthcare vocabulary', 'German workbook'],
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: siteUrl, siteName: 'Medical Sketcher Store', title: 'Medical Sketcher Store — German for Healthcare Professionals', description: 'Visual, practical German learning materials for nurses and healthcare professionals.' },
  twitter: { card: 'summary_large_image', title: 'Medical Sketcher Store', description: 'German for healthcare professionals.' },
};
const organizationSchema = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Medical Sketcher Store', url: siteUrl, description: 'German language learning materials for healthcare professionals.', sameAs: ['https://www.instagram.com/medical.sketcher/'] };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
