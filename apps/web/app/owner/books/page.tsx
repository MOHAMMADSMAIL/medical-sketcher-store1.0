'use client';
import { useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import Link from 'next/link';
import styles from './Books.module.css';

interface Book {
  id: string;
  title: string;
  slug: string;
  price: string;
  status: string;
  author: { name: string };
  category: { name: string };
  createdAt: string;
}

export default function BooksPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOwner) return;

    const fetchBooks = async () => {
      try {
        setLoading(true);
        const data = await ownerAPI.getBooks(page, 10, {
          search: searchTerm || undefined,
          status: statusFilter || undefined,
        });
        setBooks(data.items);
      } catch (err) {
        console.error('Failed to load books:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchBooks, 300);
    return () => clearTimeout(timer);
  }, [isOwner, page, searchTerm, statusFilter]);

  const handleDelete = async (book: Book) => {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    try {
      setError('');
      await ownerAPI.deleteBook(book.id);
      setBooks((current) => current.filter((item) => item.id !== book.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!isOwner) return <div>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Books Management</h1>
          <Link href="/owner/books/create" className={styles.createButton}>
            + Add Book
          </Link>
        </div>

        <div className={styles.toolbar}>
          <input
            type="text"
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="COMING_SOON">Coming Soon</option>
          </select>
        </div>

        {error && <div className={styles.empty}>{error}</div>}
        {loading ? (
          <div className={styles.loading}>Loading books...</div>
        ) : books.length === 0 ? (
          <div className={styles.empty}>No books found</div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>{book.title}</td>
                    <td>{book.author?.name || 'N/A'}</td>
                    <td>{book.category?.name || 'N/A'}</td>
                    <td>${book.price}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[book.status.toLowerCase()]}`}>
                        {book.status}
                      </span>
                    </td>
                    <td>{new Date(book.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/owner/books/${book.id}`} className={styles.editBtn}>
                          Edit
                        </Link>
                        <button className={styles.deleteBtn} onClick={() => void handleDelete(book)}>Delete</button>
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
