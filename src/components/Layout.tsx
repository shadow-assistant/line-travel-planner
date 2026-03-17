// src/components/Layout.tsx
import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  groupId: string | string[] | undefined;
}

declare global {
  interface Window {
    liff: any;
  }
}

export default function Layout({ children, activeTab, groupId }: LayoutProps) {
  const router = useRouter();
  const gId = Array.isArray(groupId) ? groupId[0] : groupId;

  const tabs = [
    { id: 'trips', label: '旅程', icon: '🧳', path: `/trip?groupId=${gId}` },
    { id: 'dashboard', label: '儀表板', icon: '📊', path: `/trip/dashboard?groupId=${gId}` },
    { id: 'wishlist', label: '許願池', icon: '🎯', path: `/trip/wishlist?groupId=${gId}` },
    { id: 'expenses', label: '分帳', icon: '💰', path: `/trip/expenses?groupId=${gId}` },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🧩</span>
          <span style={styles.logoText}>Puzzle Trip</span>
        </div>
      </header>

      {/* Content */}
      <main style={styles.main}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav style={styles.nav}>
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.path}
            style={{
              ...styles.navItem,
              ...(activeTab === tab.id ? styles.navItemActive : {}),
            }}
          >
            <span style={styles.navIcon}>{tab.icon}</span>
            <span style={styles.navLabel}>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

const styles: any = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8f9fa',
    fontFamily: '"Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: '80px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    fontSize: '28px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  main: {
    flex: 1,
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '10px 8px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    color: '#8e8e93',
    padding: '6px 12px',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
  },
  navItemActive: {
    color: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  navIcon: {
    fontSize: '22px',
    marginBottom: '2px',
  },
  navLabel: {
    fontSize: '11px',
    fontWeight: '500',
  },
};
