import { notFound } from 'next/navigation';
import StoreChrome from '@/components/store/StoreChrome';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';

type Section = { id: string; type: string; content: { order?: number; title?: string; body?: string } };
type CmsPage = { id: string; slug: string; title: string; status: string; sections: Section[] };

// Legal pages are published from the Owner CMS. Drafts stay invisible: the public
// endpoint only returns PUBLISHED pages and this route renders 404 otherwise.
export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const allowed = ['privacy-policy', 'terms-of-service', 'refund-policy', 'copyright-policy', 'cookie-policy'];
  if (!allowed.includes(slug)) notFound();

  let page: CmsPage | null = null;
  try {
    const response = await fetch(`${API_URL}/api/pages/${slug}`, { cache: 'no-store' });
    if (!response.ok) notFound();
    page = (await response.json()) as CmsPage;
  } catch {
    notFound();
  }
  if (!page || page.status !== 'PUBLISHED') notFound();

  const sections = [...page.sections].sort(
    (a, b) => Number(a.content?.order ?? 0) - Number(b.content?.order ?? 0),
  );

  return (
    <StoreChrome>
      <main className="mx-auto max-w-[820px] px-5 py-16 lg:px-10">
        <h1 className="serif text-5xl">{page.title}</h1>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.id}>
              {section.content?.title && <h2 className="serif text-2xl">{section.content.title}</h2>}
              {String(section.content?.body ?? '')
                .split('\n')
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index} className="mt-3 leading-8 text-[#3c4433]">{paragraph}</p>
                ))}
            </section>
          ))}
        </div>
      </main>
    </StoreChrome>
  );
}
