import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface TripDashboard {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
  items_count: number;
  wishlist_count: number;
  total_expenses: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { groupId, tripId } = router.query;
  const [trip, setTrip] = useState<TripDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const gId = Array.isArray(groupId) ? groupId[0] : (groupId || '');
  const tId = Array.isArray(tripId) ? tripId[0] : (tripId || '');

  useEffect(() => {
    if (tId) {
      fetchDashboard(tId);
    }
  }, [tId]);

  const fetchDashboard = async (id: string) => {
    try {
      const res = await fetch(`/api/itineraries/detail?id=${id}`);
      const data = await res.json();
      setTrip(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; color: string; text: string }> = {
      planning: { bg: '#e3f2fd', color: '#1976d2', text: '規劃中' },
      ongoing: { bg: '#e8f5e9', color: '#388e3c', text: '進行中' },
      completed: { bg: '#f5f5f5', color: '#616161', text: '已完成' },
    };
    const s = statusMap[status] || statusMap.planning;
    return { 
      style: { backgroundColor: s.bg, color: s.color, padding: '6px 14px', borderRadius: '20px', fontSize: '13px' },
      text: s.text 
    };
  };

  if (loading) {
    return (
      <Layout activeTab="dashboard" groupId={gId}>
        <div style={styles.container}>
          <p style={styles.loading}>載入中...</p>
        </div>
      </Layout>
    );
  }

  if (!trip) {
    return (
      <Layout activeTab="dashboard" groupId={gId}>
        <div style={styles.container}>
          <div style={styles.empty}>
            <p>找不到行程</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 計算天數
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <Layout activeTab="dashboard" groupId={gId}>
      <div style={styles.container}>
        {/* 返回按鈕 */}
        <button onClick={() => router.push(`/trip?groupId=${gId}`)} style={styles.backButton}>
          ← 返回行程列表
        </button>

        {/* 行程資訊 */}
        <div style={styles.header}>
          <span style={getStatusBadge(trip.status).style}>{getStatusBadge(trip.status).text}</span>
          <h1 style={styles.title}>{trip.title}</h1>
          {trip.location && <p style={styles.location}>📍 {trip.location}</p>}
          <p style={styles.date}>📅 {trip.start_date} ~ {trip.end_date} ({days}天)</p>
        </div>

        {/* 統計卡片 */}
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>📅</span>
            <span style={styles.statValue}>{days}</span>
            <span style={styles.statLabel}>天數</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>📋</span>
            <span style={styles.statValue}>{trip.items_count || 0}</span>
            <span style={styles.statLabel}>行程項目</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>🎯</span>
            <span style={styles.statValue}>{trip.wishlist_count || 0}</span>
            <span style={styles.statLabel}>許願池</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>💰</span>
            <span style={styles.statValue}>NT${(trip.total_expenses || 0).toLocaleString()}</span>
            <span style={styles.statLabel}>總花費</span>
          </div>
        </div>

        {/* 快速選單 */}
        <div style={styles.menu}>
          <button style={styles.menuButton} onClick={() => router.push(`/trip/wishlist?groupId=${gId}&tripId=${tId}`)}>
            <span style={styles.menuIcon}>🎯</span>
            <span>許願池</span>
            <span style={styles.menuDesc}>新增景點投票</span>
          </button>
          <button style={styles.menuButton} onClick={() => router.push(`/trip/itinerary?groupId=${gId}&tripId=${tId}`)}>
            <span style={styles.menuIcon}>📋</span>
            <span>行程編排</span>
            <span style={styles.menuDesc}>拖曳排序景點</span>
          </button>
          <button style={styles.menuButton} onClick={() => router.push(`/trip/expenses?groupId=${gId}&tripId=${tId}`)}>
            <span style={styles.menuIcon}>💰</span>
            <span>分帳紀錄</span>
            <span style={styles.menuDesc}>記錄與結算</span>
          </button>
        </div>

        {/* 描述 */}
        {trip.description && (
          <div style={styles.description}>
            <h3 style={styles.descTitle}>關於這趟旅程</h3>
            <p style={styles.descText}>{trip.description}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles: any = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  backButton: {
    padding: '12px 16px',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#667eea',
    cursor: 'pointer',
    textAlign: 'left',
  },
  header: {
    padding: '24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    color: '#fff',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    margin: '16px 0 8px',
  },
  location: {
    fontSize: '16px',
    opacity: 0.9,
    margin: 0,
  },
  date: {
    fontSize: '14px',
    opacity: 0.8,
    margin: '8px 0 0',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  statIcon: {
    fontSize: '28px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: '13px',
    color: '#8e8e93',
    marginTop: '4px',
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  menuIcon: {
    fontSize: '32px',
  },
  menuDesc: {
    fontSize: '13px',
    color: '#999',
    marginTop: '4px',
  },
  description: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
  },
  descTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px',
  },
  descText: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
    lineHeight: '1.6',
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    padding: '40px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '16px',
  },
};
