'use client';
import { useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from './Users.module.css';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
  orders?: any[];
}

export default function UsersPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOwner) return;
    fetchUsers();
  }, [isOwner, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await ownerAPI.getUsers(1, 20, search || undefined);
      setUsers(data.items);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!isOwner) return <div>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <h1>Users Management</h1>

        <input
          type="text"
          placeholder="Search users by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />

        {loading ? (
          <div className={styles.loading}>Loading users...</div>
        ) : users.length === 0 ? (
          <div className={styles.empty}>No users found</div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Orders</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.name || '-'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[u.role.toLowerCase()]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.orders?.length || 0}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className={styles.viewBtn}>View</button>
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
