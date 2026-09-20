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
  phoneNumber?: string | null;
  googleId?: string | null;
  createdAt: string;
  orders?: any[];
}

export default function UsersPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('CUSTOMER');

  useEffect(() => {
    if (!isOwner) return;
    fetchUsers();
  }, [isOwner, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ownerAPI.getUsers(1, 20, search || undefined);
      setUsers(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSave = async (id: string) => {
    try {
      setError('');
      await ownerAPI.updateUserRole(id, newRole);
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!isOwner) return <div>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <h1>Users Management</h1>

        {error && <div role="alert" style={{ color: '#b91c1c', margin: '12px 0' }}>{error}</div>}

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
              <thead>                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Role</th>
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
                      {u.phoneNumber ? (
                        <span>{u.phoneNumber}{u.googleId ? ' · G' : ''}</span>
                      ) : (
                        <span style={{ opacity: 0.4 }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[u.role.toLowerCase()]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {editingId === u.id ? (
                        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                          <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="OWNER">OWNER</option>
                          </select>
                          <button className={styles.viewBtn} onClick={() => handleRoleSave(u.id)}>Save</button>
                          <button className={styles.viewBtn} onClick={() => setEditingId(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button
                          className={styles.viewBtn}
                          onClick={() => { setEditingId(u.id); setNewRole(u.role); }}
                        >
                          Change role
                        </button>
                      )}
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
