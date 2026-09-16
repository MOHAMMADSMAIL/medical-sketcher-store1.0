'use client';
import { useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from './OwnerDataPage.module.css';

type Kind = 'lessons' | 'assessments';

interface DataItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  passScore?: number;
}

const KIND_CONFIG: Record<Kind, { label: string; extraField?: 'passScore' }> = {
  lessons: { label: 'Lesson' },
  assessments: { label: 'Assessment', extraField: 'passScore' },
};

export function OwnerDataPage({ kind }: { kind: Kind }) {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [items, setItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [passScore, setPassScore] = useState('70');
  const [saving, setSaving] = useState(false);

  const config = KIND_CONFIG[kind];

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const data =
        kind === 'lessons'
          ? await ownerAPI.getLessons(1, 50)
          : await ownerAPI.getAssessments(1, 50);
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOwner) return;
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, kind]);

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setPassScore('70');
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim()) return;
    try {
      setSaving(true);
      if (kind === 'lessons') {
        await ownerAPI.createLesson({ title, slug, status: 'DRAFT' });
      } else {
        await ownerAPI.createAssessment({ title, slug, passScore: Number(passScore) || 70, status: 'DRAFT' });
      }
      resetForm();
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      if (kind === 'lessons') await ownerAPI.publishLesson(id);
      else await ownerAPI.publishAssessment(id);
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete this ${config.label.toLowerCase()}?`)) return;
    try {
      if (kind === 'lessons') await ownerAPI.deleteLesson(id);
      else await ownerAPI.deleteAssessment(id);
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) return <div className={styles.loading}>Loading…</div>;
  if (!isOwner) return <div className={styles.loading}>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{config.label}s Management</h1>
          <button className={styles.createButton} onClick={() => setShowForm((s) => !s)}>
            + Add {config.label}
          </button>
        </div>

        {error && <div className={styles.errorBanner} role="alert">{error}</div>}

        {showForm && (
          <div className={styles.form}>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={styles.input}
            />
            {config.extraField === 'passScore' && (
              <input
                type="number"
                placeholder="Pass score"
                value={passScore}
                onChange={(e) => setPassScore(e.target.value)}
                className={styles.inputSmall}
              />
            )}
            <button className={styles.saveButton} disabled={saving} onClick={handleCreate}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className={styles.cancelButton} onClick={resetForm}>
              Cancel
            </button>
          </div>
        )}

        <div className={styles.toolbar}>
          <input
            type="text"
            placeholder={`Search ${config.label.toLowerCase()}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {loading ? (
          <div className={styles.loading}>Loading {config.label.toLowerCase()}s...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No {config.label.toLowerCase()}s found</div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  {config.extraField === 'passScore' && <th>Pass Score</th>}
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.slug}</td>
                    {config.extraField === 'passScore' && <td>{item.passScore ?? '-'}</td>}
                    <td>
                      <span className={`${styles.badge} ${styles[item.status.toLowerCase()]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className={styles.actions}>
                        {item.status !== 'PUBLISHED' && (
                          <button className={styles.publishBtn} onClick={() => handlePublish(item.id)}>
                            Publish
                          </button>
                        )}
                        <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
