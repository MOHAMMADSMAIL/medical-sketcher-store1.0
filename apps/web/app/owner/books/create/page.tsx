'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from '../Books.module.css';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CreateBookPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('9.99');
  const [status, setStatus] = useState('DRAFT');
  const [authors, setAuthors] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [productType, setProductType] = useState('book');
  const [authorId, setAuthorId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOwner) return;
    (async () => {
      try {
        const [authorsData, categoriesData] = await Promise.all([
          ownerAPI.getAuthors(1, 100),
          ownerAPI.getCategories(1, 100),
        ]);
        const authorItems = authorsData.items || [];
        const categoryItems = categoriesData.items || [];
        setAuthors(authorItems);
        setCategories(categoryItems);
        setAuthorId(authorItems[0]?.id || '');
        setCategoryId(categoryItems[0]?.id || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load authors/categories');
      }
    })();
  }, [isOwner]);

  if (authLoading) return <div className={styles.loading}>Loading…</div>;
  if (!isOwner) return <div className={styles.loading}>Unauthorized</div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !categoryId) {
      setError('Title and category are required.');
      return;
    }
    if (productType === 'book' && !authorId) {
      setError('Author is required for book products.');
      return;
    }
    try {
      setSaving(true);
      const book = await ownerAPI.createBook({
        title: title.trim(),
        slug: slugify(slug || title),
        description: description.trim(),
        price: Number(price) || 0,
        status,
        type: productType,
        ...(authorId ? { authorId } : {}),
        categoryId,
      });
      if (bookFile) await ownerAPI.uploadBookFile(book.id, bookFile, 'book');
      for (const [index, image] of coverFiles.entries()) {
        await ownerAPI.uploadBookFile(book.id, image, 'cover');
        if (index === 0) continue; // first image keeps isPrimary via server logic
      }
      router.push('/owner/books');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the product');
      setSaving(false);
    }
  };

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Create a New Product</h1>
        </div>
        {error && <div className={styles.error || styles.empty}>{error}</div>}
        <form onSubmit={submit} className={styles.toolbar || ''} style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            Title *
            <input value={title} onChange={(e) => { setTitle(e.target.value); setSlug(''); }} required
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fffa' }} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Slug (auto from title if empty)
            <input value={slug} placeholder={slugify(title) || 'auto'} onChange={(e) => setSlug(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fffa' }} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fffa', resize: 'vertical' }} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              Price (USD) *
              <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fffa' }} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fffa' }}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="COMING_SOON">Coming Soon</option>
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              Product type *
              <div style={{ display: 'flex', gap: 8 }}>
                {['book', 'merch'].map((t) => (
                  <button key={t} type="button" onClick={() => setProductType(t)}
                    style={{ cursor: 'pointer', borderRadius: 999, padding: '8px 16px', border: productType === t ? '1.5px solid #536044' : '1px solid rgba(83,96,68,.25)', background: productType === t ? '#e6e5d4' : 'transparent', fontWeight: 600 }}>
                    {t === 'book' ? 'Book (PDF/EPUB)' : 'General product (merch, cups…)'}
                  </button>
                ))}
              </div>
            </div>
            <label style={{ display: 'grid', gap: 6 }}>
              Author {productType === 'book' ? '*' : '(optional)'}
              <select value={authorId} onChange={(e) => setAuthorId(e.target.value)} required={productType === 'book'}
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fffa' }}>
                <option value="">— none —</option>
                {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              Category *
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fffa' }}>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          </div>
          {productType === 'book' && (
            <label style={{ display: 'grid', gap: 6 }}>
              Book file (PDF/EPUB — uploaded right after creation)
              <input type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" onChange={(e) => setBookFile(e.target.files?.[0] || null)}
                style={{ padding: '8px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fffa' }} />
            </label>
          )}
          <label style={{ display: 'grid', gap: 6 }}>
            Product images (PNG/JPG — first one is the cover; multiple allowed)
            <input type="file" accept="image/png,image/jpeg" multiple onChange={(e) => setCoverFiles(Array.from(e.target.files || []))}
              style={{ padding: '8px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fffa' }} />
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} className={styles.createButton || ''} style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creating…' : 'Create Book'}
            </button>
            <button type="button" onClick={() => router.push('/owner/books')} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid rgba(83,96,68,.3)', borderRadius: 999, padding: '10px 18px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </OwnerLayout>
  );
}
