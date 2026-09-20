'use client';
import { Fragment, useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from './Orders.module.css';

interface Order {
  id: string;
  total: string;
  status: string;
  user: { email: string; name: string };
  createdAt: string;
  items?: any[];
  payments?: any[];
}

export default function OrdersPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner) return;
    fetchOrders();
  }, [isOwner, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ownerAPI.getOrders(1, 10, { status: statusFilter || undefined });
      setOrders(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!isOwner) return <div>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <h1>Orders Management</h1>

        {error && <div role="alert" style={{ color: '#b91c1c', margin: '12px 0' }}>{error}</div>}

        <div className={styles.filters}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filterSelect}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className={styles.empty}>No orders found</div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <Fragment key={order.id}>
                  <tr>
                    <td>{order.id.slice(0, 8)}</td>
                    <td>{order.user?.email || 'N/A'}</td>
                    <td>${order.total}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[order.status.toLowerCase()]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className={styles.viewBtn} onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                        {expandedId === order.id ? 'Hide' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr>
                      <td colSpan={6} style={{ background: '#f8fafc' }}>
                        <div style={{ padding: '10px 14px' }}>
                          <b>Order {order.id}</b>
                          <div style={{ marginTop: 6 }}>Items: {(order.items || []).map((item: any) => `${item.product?.title || item.productId} ×${item.quantity ?? 1}`).join(', ') || '—'}</div>
                          <div>Payments: {(order.payments || []).map((p: any) => `${p.provider} · ${p.status} · $${Number(p.amount).toFixed(2)}`).join(' | ') || '—'}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
