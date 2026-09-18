'use client';
import { useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from './Categories.module.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  products: any[];
}

export default function CategoriesPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '' });

  useEffect(() => {
    if (!isOwner) return;
    fetchCategories();
  }, [isOwner]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await ownerAPI.getCategories(1, 50);
      setCategories(data.items);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ownerAPI.createCategory(formData);
      setFormData({ name: '', slug: '' });
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to create category:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await ownerAPI.deleteCategory(id);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!isOwner) return <div>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Categories Management</h1>
          <button onClick={() => setShowForm(!showForm)} className={styles.addButton}>
            {showForm ? '✕ Cancel' : '+ Add Category'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className={styles.form}>
            <input
              type="text"
              placeholder="Category Name"
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
            <button type="submit" className={styles.submitBtn}>Create</button>
          </form>
        )}

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Books</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.name}</td>
                    <td>{cat.slug}</td>
                    <td>{cat.products?.length || 0}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className={styles.deleteBtn}
                      >
                        Delete
                      </button>
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
