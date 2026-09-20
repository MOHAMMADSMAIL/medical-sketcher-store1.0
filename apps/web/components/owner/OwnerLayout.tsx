'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './OwnerLayout.module.css';
import { useOwnerLang, type OwnerLang } from '@/lib/i18n-owner';

interface OwnerLayoutProps {
  children: React.ReactNode;
  user?: any;
}

export function OwnerLayout({ children, user }: OwnerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const { lang, setLang, t, langs } = useOwnerLang();
  const dir = lang === 'AR' ? 'rtl' : 'ltr';

  const menuItems = [
    { href: '/owner', icon: '📊' },
    { href: '/owner/books', icon: '📚' },
    { href: '/owner/authors', icon: '✍️' },
    { href: '/owner/categories', icon: '🏷️' },
    { href: '/owner/orders', icon: '🛒' },
    { href: '/owner/users', icon: '👥' },
    { href: '/owner/library', icon: '📖' },
    { href: '/owner/reviews', icon: '⭐' },
    { href: '/owner/lessons', icon: '🎓' },
    { href: '/owner/assessments', icon: '✅' },
    { href: '/owner/exams', icon: '📝' },
    { href: '/owner/cms', icon: '🗂️' },
    { href: '/owner/media', icon: '🖼️' },
    { href: '/owner/analytics', icon: '📈' },
    { href: '/owner/audit', icon: '🔍' },
    { href: '/owner/settings', icon: '⚙️' },
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
    <div className={styles.layout} dir={dir}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.logo}>{t.studio}</h2>
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
              {sidebarOpen && <span className={styles.navLabel}>{t.nav[item.href] || item.href}</span>}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span className={styles.navIcon}>🚪</span>
            {sidebarOpen && <span>{t.logout}</span>}
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
            <h1 className={styles.pageTitle}>{t.adminTitle}</h1>
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
            <div style={{ display: 'flex', gap: 4 }}>
              {langs.map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code as OwnerLang)}
                  className={styles.toggleBtn}
                  aria-label={`Switch language to ${code}`}
                  title={code}
                  style={{
                    fontWeight: code === lang ? 700 : 400,
                    opacity: code === lang ? 1 : 0.55,
                    padding: '4px 8px',
                  }}
                >
                  {code}
                </button>
              ))}
            </div>
            <button
              onClick={() => router.push('/')}
              className={styles.visitBtn}
              title={t.visitSite}
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
