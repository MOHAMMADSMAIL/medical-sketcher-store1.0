'use client';
import { useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from './Dashboard.module.css';

interface DashboardStats {
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  comingSoonBooks: number;
  totalUsers: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalDownloads: number;
}

export default function DashboardPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner) return;

    const fetchStats = async () => {
      try {
        const data = await ownerAPI.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [isOwner]);

  if (authLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className={styles.unauthorized}>
        <h2>Unauthorized</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <OwnerLayout user={user}>
      <div className={styles.dashboardContainer}>
        <h1 className={styles.pageTitle}>Dashboard</h1>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.statsGrid}>
          <StatCard
            title="Total Books"
            value={stats?.totalBooks || 0}
            icon="📚"
            loading={statsLoading}
          />
          <StatCard
            title="Published"
            value={stats?.publishedBooks || 0}
            icon="✅"
            loading={statsLoading}
          />
          <StatCard
            title="Draft"
            value={stats?.draftBooks || 0}
            icon="📝"
            loading={statsLoading}
          />
          <StatCard
            title="Coming Soon"
            value={stats?.comingSoonBooks || 0}
            icon="⏳"
            loading={statsLoading}
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon="👥"
            loading={statsLoading}
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            icon="📦"
            loading={statsLoading}
          />
          <StatCard
            title="Paid Orders"
            value={stats?.paidOrders || 0}
            icon="💰"
            loading={statsLoading}
          />
          <StatCard
            title="Pending Orders"
            value={stats?.pendingOrders || 0}
            icon="⏳"
            loading={statsLoading}
          />
          <StatCard
            title="Total Revenue"
            value={`$${(stats?.totalRevenue || 0).toFixed(2)}`}
            icon="💵"
            loading={statsLoading}
            isAmount
          />
          <StatCard
            title="Total Downloads"
            value={stats?.totalDownloads || 0}
            icon="⬇️"
            loading={statsLoading}
          />
        </div>
      </div>
    </OwnerLayout>
  );
}

function StatCard({
  title,
  value,
  icon,
  loading,
  isAmount,
}: {
  title: string;
  value: string | number;
  icon: string;
  loading: boolean;
  isAmount?: boolean;
}) {
  return (
    <div className={`${ styles.statCard} ${loading ? styles.loading : ''}`}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statContent}>
        <p className={styles.statLabel}>{title}</p>
        <p className={`${styles.statValue} ${isAmount ? styles.amountValue : ''}`}>
          {loading ? '...' : value}
        </p>
      </div>
    </div>
  );
}
