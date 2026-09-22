'use client';
import { useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from './AuditLogs.module.css';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  user?: { email: string };
  createdAt: string;
  metadata?: any;
}

export default function AuditLogsPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    if (!isOwner) return;
    fetchLogs();
  }, [isOwner, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // /owner/audit returns a bare array (no pagination/filters server-side).
      const data = await ownerAPI.getAuditLogs(1, 50);
      const all = Array.isArray(data) ? data : (data?.items ?? []);
      setLogs(actionFilter ? all.filter((l: any) => l.action === actionFilter) : all);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!isOwner) return <div>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <h1>Audit Logs</h1>

        <input
          type="text"
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className={styles.filterInput}
        />

        {loading ? (
          <div className={styles.loading}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className={styles.empty}>No logs found</div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Date & Time</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.user?.email || 'System'}</td>
                    <td>
                      <span className={`${styles.action} ${styles[log.action.toLowerCase()]}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.entity}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td className={styles.details}>
                      <small>{log.entityId.slice(0, 8)}...</small>
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
