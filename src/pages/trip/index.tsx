import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface DashboardData {
  itineraries: any[];
  totalExpenses: number;
  memberCount: number;
  wishlistCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { groupId } = router.query;
  const [data, setData] = useState<DashboardData>({
    itineraries: [],
    totalExpenses: 0,
    memberCount: 0,
    wishlistCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const gId = Array.isArray(groupId) ? groupId[0] : (groupId || '');

  useEffect(() => {
    const id = Array.isArray(gId) ? gId[0] : gId;
    if (id) {
      fetchDashboardData(id);
    }
  }, [gId]);

  const fetchDashboardData = async (id: string) => {
    try {
      const [itinerariesRes, expensesRes] = await Promise.all([
        fetch(`/api/itineraries?groupId=${id}`),
        fetch(`/api/expenses?groupId=${id}`),
      ]);

      const itineraries = await itinerariesRes.json();
      const expenses = await expensesRes.json();

      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount_twd || e.amount), 0);

      setData({
        itineraries: itineraries || [],
        totalExpenses,
        memberCount: 3, // TODO: 從 API 取得
        wishlistCount: 0, // TODO: 從 API 取得
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentItinerary = data.itineraries[0];

  return (
    <Layout activeTab="dashboard" groupId={gId}>
      <div style={styles.container}>
        {/* 歡迎區塊 */}
        <div style={styles.welcome}>
          <h1 style={styles.title}>🧩 Puzzle Trip</h1>
          <p style={styles.subtitle}>拼圖遊 - 讓旅行像玩拼圖一樣簡單</p>
        </div>

        {/* 統計卡片 */}
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>📅</span>
            <span style={styles.statValue}>{data.itineraries.length}</span>
            <span style={styles.statLabel}>行程數</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>💵</span>
            <span style={styles.statValue}>NT$ {data.totalExpenses.toLocaleString()}</span>
            <span style={styles.statLabel}>總花費</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>👥</span>
            <span style={styles.statValue}>{data.memberCount}</span>
            <span style={styles.statLabel}>成員</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>🎯</span>
            <span style={styles.statValue}>{data.wishlistCount}</span>
            <span style={styles.statLabel}>許願池</span>
          </div>
        </div>

        {/* 當前行程 */}
        {currentItinerary ? (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📌 當前行程</h2>
            <div style={styles.currentTrip}>
              <div style={styles.tripHeader}>
                <h3 style={styles.tripTitle}>{currentItinerary.title}</h3>
                <span style={styles.tripStatus}>{currentItinerary.status || '規劃中'}</span>
              </div>
              <p style={styles.tripLocation}>📍 {currentItinerary.location || '未設定地點'}</p>
              <p style={styles.tripDate}>
                📅 {currentItinerary.start_date} ~ {currentItinerary.end_date}
              </p>
              {currentItinerary.description && (
                <p style={styles.tripDesc}>{currentItinerary.description}</p>
              )}
              <button
                style={styles.actionButton}
                onClick={() => router.push(`/trip/itinerary?groupId=${gId}`)}
              >
                查看行程 →
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🧳</span>
            <p>還沒有行程</p>
            <p style={styles.emptyHint}>在群組輸入 /新增行程 來建立</p>
          </div>
        )}

        {/* 快速操作 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⚡ 快速操作</h2>
          <div style={styles.quickActions}>
            <button style={styles.quickButton} onClick={() => router.push(`/trip/wishlist?groupId=${gId}`)}>
              <span style={styles.quickIcon}>🎯</span>
              <span>許願池</span>
            </button>
            <button style={styles.quickButton} onClick={() => router.push(`/trip/expenses?groupId=${gId}`)}>
              <span style={styles.quickIcon}>💰</span>
              <span>記帳</span>
            </button>
            <button style={styles.quickButton} onClick={() => router.push(`/trip/itinerary?groupId=${gId}`)}>
              <span style={styles.quickIcon}>📋</span>
              <span>編排行程</span>
            </button>
          </div>
        </div>

        {/* LINE Bot 資訊 */}
        <div style={styles.botInfo}>
          <p>💡 邀請朋友加入LINE群組，一起規劃旅程！</p>
          <p style={styles.botId}>Puzzle Trip LINE Bot: @605qzmde</p>
        </div>
      </div>
    </Layout>
  );
}

const styles: any = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  welcome: {
    textAlign: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    color: '#fff',
  },
  title: {
    fontSize: '32px',
    margin: 0,
    fontWeight: '800',
  },
  subtitle: {
    margin: '8px 0 0',
    fontSize: '16px',
    opacity: 0.9,
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
  section: {
    marginTop: '8px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '12px',
  },
  currentTrip: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  tripHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  tripTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
  },
  tripStatus: {
    padding: '4px 12px',
    backgroundColor: '#e8f5e9',
    color: '#4caf50',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  tripLocation: {
    color: '#666',
    margin: '8px 0',
  },
  tripDate: {
    color: '#666',
    margin: '8px 0',
  },
  tripDesc: {
    color: '#999',
    fontSize: '14px',
    marginTop: '12px',
  },
  actionButton: {
    marginTop: '16px',
    padding: '12px 24px',
    backgroundColor: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  emptyIcon: {
    fontSize: '48px',
  },
  emptyHint: {
    color: '#999',
    fontSize: '14px',
    marginTop: '8px',
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  quickButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px 12px',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a1a2e',
  },
  quickIcon: {
    fontSize: '28px',
  },
  botInfo: {
    textAlign: 'center',
    padding: '16px',
    backgroundColor: '#fff3e0',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#666',
  },
  botId: {
    marginTop: '8px',
    fontWeight: '600',
    color: '#1a1a2e',
  },
};
