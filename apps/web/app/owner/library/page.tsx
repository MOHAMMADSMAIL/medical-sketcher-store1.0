'use client';
import { useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from './Library.module.css';

interface LibraryEntry {
  id: string;
  userId: string;
  productId: string;
  expiresAt: string | null;
  user: { email: string };
  product: { title: string };
  order?: { id: string } | null;
}

interface Option {
  id: string;
  label: string;
}

export default function LibraryPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<Option[]>([]);
  const [books, setBooks] = useState<Option[]>([]);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantBookId, setGrantBookId] = useState('');
  const [granting, setGranting] = useState(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ownerAPI.getLibraryAccess(1, 50);
      setEntries(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library access');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOwner) return;
    fetchEntries();
    ownerAPI.getUsers(1, 100).then((data) =>
      setUsers((data.items || []).map((u: any) => ({ id: u.id, label: u.email })))
    ).catch(() => {});
    ownerAPI.getBooks(1, 100).then((data) =>
      setBooks((data.items || []).map((b: any) => ({ id: b.id, label: b.title })))
    ).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  const handleGrant = async () => {
    if (!grantUserId || !grantBookId) return;
    try {
      setGranting(true);
      await ownerAPI.grantLibraryAccess(grantUserId, grantBookId);
      setGrantUserId('');
      setGrantBookId('');
      fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant access');
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (entry: LibraryEntry) => {
    if (!confirm(`Revoke access for ${entry.user?.email} to "${entry.product?.title}"?`)) return;
    try {
      await ownerAPI.revokeLibraryAccess(entry.userId, entry.productId);
      fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access');
    }
  };

  const handleExtend = async (entry: LibraryEntry) => {
    const days = prompt('Extend access by how many days?', '30');
    if (!days) return;
    const n = parseInt(days, 10);
    if (Number.isNaN(n)) return;
    const base = entry.expiresAt ? new Date(entry.expiresAt) : new Date();
    base.setDate(base.getDate() + n);
    try {
      await ownerAPI.extendLibraryAccess(entry.id, base);
      fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend access');
    }
  };

  if (authLoading) return <div className={styles.loading}>Loading…</div>;
  if (!isOwner) return <div className={styles.loading}>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <h1>Library Access</h1>

        {error && <div className={styles.errorBanner} role="alert">{error}</div>}

        <div className={styles.grantForm}>
          <select value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} className={styles.select}>
            <option value="">Select user…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
          <select value={grantBookId} onChange={(e) => setGrantBookId(e.target.value)} className={styles.select}>
            <option value="">Select book…</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
          <button className={styles.grantBtn} disabled={granting || !grantUserId || !grantBookId} onClick={handleGrant}>
            {granting ? 'Granting…' : 'Grant Access'}
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading library access...</div>
        ) : entries.length === 0 ? (
          <div className={styles.empty}>No library access records found</div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Book</th>
                  <th>Order</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.user?.email}</td>
                    <td>{entry.product?.title}</td>
                    <td>{entry.order?.id ? entry.order.id.slice(0, 8) : 'Manual grant'}</td>
                    <td>{entry.expiresAt ? new Date(entry.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.extendBtn} onClick={() => handleExtend(entry)}>Extend</button>
                        <button className={styles.revokeBtn} onClick={() => handleRevoke(entry)}>Revoke</button>
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
