'use client';
import { useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import Link from 'next/link';
import styles from './Authors.module.css';

interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  products: any[];
}

export default function AuthorsPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', bio: '' });

  useEffect(() => {
    if (!isOwner) return;
    fetchAuthors();
  }, [isOwner, page, search]);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const data = await ownerAPI.getAuthors(page, 10, search || undefined);
      setAuthors(data.items);
    } catch (err) {
      console.error('Failed to load authors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ownerAPI.createAuthor(formData);
      setFormData({ name: '', slug: '', bio: '' });
      setShowForm(false);
      fetchAuthors();
    } catch (err) {
      console.error('Failed to create author:', err);
    }
  };

  const handleDeleteAuthor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this author?')) return;
    try {
      await ownerAPI.deleteAuthor(id);
      fetchAuthors();
    } catch (err) {
      console.error('Failed to delete author:', err);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!isOwner) return <div>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Authors Management</h1>
          <button onClick={() => setShowForm(!showForm)} className={styles.addButton}>
            {showForm ? '✕ Cancel' : '+ Add Author'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateAuthor} className={styles.form}>
            <input
              type="text"
              placeholder="Author Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
            <textarea
              placeholder="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
            <button type="submit" className={styles.submitBtn}>Create Author</button>
          </form>
        )}

        <input
          type="text"
          placeholder="Search authors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />

        {loading ? (
          <div className={styles.loading}>Loading authors...</div>
        ) : authors.length === 0 ? (
          <div className={styles.empty}>No authors found</div>
        ) : (
          <div className={styles.grid}>
            {authors.map((author) => (
              <div key={author.id} className={styles.card}>
                <h3>{author.name}</h3>
                <p className={styles.meta}>{author.products?.length || 0} books</p>
                {author.bio && <p className={styles.bio}>{author.bio}</p>}
                <div className={styles.actions}>
                  <button className={styles.editBtn}>Edit</button>
                  <button
                    onClick={() => handleDeleteAuthor(author.id)}
                    className={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
