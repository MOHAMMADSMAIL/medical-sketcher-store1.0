'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from '../Books.module.css';

interface BookDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: string;
  currency: string;
  status: string;
  author: { id: string; name: string };
  category: { id: string; name: string };
  media: { id: string; originalName: string | null; mimeType: string; size: number; isPrimary: boolean }[];
}

export default function EditBookPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;
  const [book, setBook] = useState<BookDetail | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOwner || !id) return;
    (async () => {
      try {
        const data = await ownerAPI.getBook(id);
        setBook(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setPrice(String(data.price));
        setStatus(data.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load the book');
      }
    })();
  }, [isOwner, id]);

  if (authLoading) return <div className={styles.loading}>Loading…</div>;
  if (!isOwner) return <div className={styles.loading}>Unauthorized</div>;
  if (!book) return <div className={styles.loading}>{error || 'Loading book…'}</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      setSaving(true);
      await ownerAPI.updateBook(id, { title: title.trim(), description: description.trim(), price: Number(price) || 0, status });
      if (bookFile) await ownerAPI.uploadBookFile(id, bookFile, 'book');
      if (coverFile) await ownerAPI.uploadBookFile(id, coverFile, 'cover');
      setMessage('Book saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the book');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Edit: {book.title}</h1>
        </div>
        {error && <div className={styles.empty}>{error}</div>}
        {message && <div className={styles.empty}>✓ {message}</div>}
        <form onSubmit={save} className={styles.toolbar || ''} style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            Title *
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
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
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          </div>
          <label style={{ display: 'grid', gap: 6 }}>
            Replace book file (PDF/EPUB)
            <input type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" onChange={(e) => setBookFile(e.target.files?.[0] || null)}
              style={{ padding: '8px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fffa' }} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Replace cover image (PNG/JPG)
            <input type="file" accept="image/png,image/jpeg" onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              style={{ padding: '8px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fffa' }} />
          </label>
          {book.media.length > 0 && (
            <div style={{ color: '#69725f', fontSize: 12 }}>
              Attached files: {book.media.map((media) => `${media.originalName || media.mimeType}${media.isPrimary ? ' (downloadable)' : ''}`).join(', ')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} className={styles.createButton || ''} style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => router.push('/owner/books')} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid rgba(83,96,68,.3)', borderRadius: 999, padding: '10px 18px' }}>
              Back
            </button>
          </div>
        </form>
      </div>
    </OwnerLayout>
  );
}
