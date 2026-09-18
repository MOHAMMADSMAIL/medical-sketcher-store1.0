'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './OwnerLayout.module.css';

interface OwnerLayoutProps {
  children: React.ReactNode;
  user?: any;
}

export function OwnerLayout({ children, user }: OwnerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const menuItems = [
    { href: '/owner', label: 'Dashboard', icon: '📊' },
    { href: '/owner/books', label: 'Books', icon: '📚' },
    { href: '/owner/authors', label: 'Authors', icon: '✍️' },
    { href: '/owner/categories', label: 'Categories', icon: '🏷️' },
    { href: '/owner/orders', label: 'Orders', icon: '🛒' },
    { href: '/owner/users', label: 'Users', icon: '👥' },
    { href: '/owner/library', label: 'Library', icon: '📖' },
    { href: '/owner/reviews', label: 'Reviews', icon: '⭐' },
    { href: '/owner/lessons', label: 'Lessons', icon: '🎓' },
    { href: '/owner/assessments', label: 'Assessments', icon: '✅' },
    { href: '/owner/cms', label: 'CMS', icon: '📝' },
    { href: '/owner/media', label: 'Media', icon: '🖼️' },
    { href: '/owner/analytics', label: 'Analytics', icon: '📈' },
    { href: '/owner/audit', label: 'Audit Logs', icon: '🔍' },
    { href: '/owner/settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleLogout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/logout`,
        { method: 'POST', credentials: 'include' }
      );
      router.push('/owner/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.logo}>Owner Studio</h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={styles.toggleBtn}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {menuItems.map(item => (
            <Link key={item.href} href={item.href} className={styles.navItem}>
              <span className={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span className={styles.navIcon}>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.mainContainer}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={styles.mobileToggle}
              aria-label="Toggle sidebar mobile"
            >
              ☰
            </button>
            <h1 className={styles.pageTitle}>Medical Sketcher Admin</h1>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              {user && (
                <>
                  <span className={styles.userName}>{user.name || user.email}</span>
                  <span className={styles.userRole}>{user.role.toUpperCase()}</span>
                </>
              )}
            </div>
            <button
              onClick={() => router.push('/')}
              className={styles.visitBtn}
              title="Visit public website"
            >
              🌐
            </button>
          </div>
        </header>

        {/* Content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
