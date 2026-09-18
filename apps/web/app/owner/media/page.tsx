'use client';
import { useEffect, useRef, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from './Media.module.css';

interface MediaItem {
  id: string;
  storageKey: string;
  mimeType: string;
  size: number;
  originalName?: string;
  createdAt?: string;
}

export default function MediaPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ownerAPI.getMedia(1, 50);
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOwner) return;
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      await ownerAPI.uploadMedia(file, file.type.split('/')[0]);
      fetchMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media file?')) return;
    try {
      await ownerAPI.deleteMedia(id);
      fetchMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (authLoading) return <div className={styles.loading}>Loading…</div>;
  if (!isOwner) return <div className={styles.loading}>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Media Library</h1>
          <label className={styles.uploadButton}>
            {uploading ? 'Uploading…' : '+ Upload File'}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              className={styles.hiddenInput}
            />
          </label>
        </div>

        {error && <div className={styles.errorBanner} role="alert">{error}</div>}

        {loading ? (
          <div className={styles.loading}>Loading media...</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>No media files found</div>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <div key={item.id} className={styles.card}>
                {item.mimeType.startsWith('image/') ? (
                  <div className={styles.thumb}>🖼️</div>
                ) : (
                  <div className={styles.thumb}>📄</div>
                )}
                <div className={styles.meta}>
                  <p className={styles.name}>{item.originalName || item.storageKey.split('/').pop()}</p>
                  <p className={styles.sub}>{item.mimeType} · {formatSize(item.size)}</p>
                </div>
                <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
