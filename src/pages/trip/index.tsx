import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface Trip {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
}

export default function TripsPage() {
  const router = useRouter();
  const { groupId } = router.query;
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gId, setGId] = useState<string>('');
  const [newTrip, setNewTrip] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    // 等待 router 準備好
    if (!router.isReady) return;
    
    // 從 URL 或 localStorage 取得 groupId
    const id = Array.isArray(groupId) ? groupId[0] : (groupId || (typeof window !== 'undefined' ? localStorage.getItem('currentGroupId') : null) || '');
    
    if (id) {
      setGId(id);
      localStorage.setItem('currentGroupId', id);
      fetchTrips(id);
    } else {
      setError('請從 LINE 群組進入應用程式');
      setLoading(false);
    }
  }, [router.isReady, groupId]);

  const fetchTrips = async (id: string) => {
    try {
      const res = await fetch(`/api/itineraries?groupId=${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTrips(data || []);
    } catch (err) {
      console.error(err);
      setError('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const createTrip = async () => {
    if (!gId || !newTrip.title || !newTrip.start_date || !newTrip.end_date) return;

    try {
      const res = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: gId,
          ...newTrip,
          status: 'planning',
        }),
      });

      if (res.ok) {
        fetchTrips(gId);
        setShowCreateForm(false);
        setNewTrip({ title: '', description: '', location: '', start_date: '', end_date: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTrip = async (tripId: string) => {
    if (!confirm('確定要刪除這個行程嗎？')) return;

    try {
      await fetch(`/api/itineraries?id=${tripId}`, { method: 'DELETE' });
      fetchTrips(gId);
    } catch (err) {
      console.error(err);
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
      style: { backgroundColor: s.bg, color: s.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px' },
      text: s.text 
    };
  };

  // 載入中
  if (loading) {
    return (
      <Layout activeTab="trips" groupId={gId}>
        <div style={styles.container}>
          <div style={styles.loading}>載入中...</div>
        </div>
      </Layout>
    );
  }

  // 錯誤訊息
  if (error) {
    return (
      <Layout activeTab="trips" groupId={gId}>
        <div style={styles.container}>
          <div style={styles.error}>
            <p>{error}</p>
            <p style={styles.hint}>請透過 LINE 群組的連結進入應用程式</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeTab="trips" groupId={gId}>
      <div style={styles.container}>
        {/* 標題 */}
        <div style={styles.header}>
          <h1 style={styles.title}>🧩 我的旅程</h1>
          <p style={styles.subtitle}>管理你的所有旅遊行程</p>
        </div>

        {/* 新增行程按鈕 */}
        <button onClick={() => setShowCreateForm(!showCreateForm)} style={styles.addButton}>
          {showCreateForm ? '✕ 取消' : '+ 新增行程'}
        </button>

        {/* 新增表單 */}
        {showCreateForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>建立新行程</h3>
            <input
              type="text"
              placeholder="行程名稱 *"
              value={newTrip.title}
              onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="目的地"
              value={newTrip.location}
              onChange={(e) => setNewTrip({ ...newTrip, location: e.target.value })}
              style={styles.input}
            />
            <div style={styles.dateRow}>
              <input
                type="date"
                value={newTrip.start_date}
                onChange={(e) => setNewTrip({ ...newTrip, start_date: e.target.value })}
                style={styles.dateInput}
              />
              <span style={styles.dateSeparator}>~</span>
              <input
                type="date"
                value={newTrip.end_date}
                onChange={(e) => setNewTrip({ ...newTrip, end_date: e.target.value })}
                style={styles.dateInput}
              />
            </div>
            <textarea
              placeholder="描述 (選填)"
              value={newTrip.description}
              onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
              style={styles.textarea}
            />
            <button onClick={createTrip} style={styles.submitButton}>
              建立行程
            </button>
          </div>
        )}

        {/* 行程列表 */}
        <div style={styles.list}>
          {trips.length === 0 ? (
            <div style={styles.empty}>
              <span style={styles.emptyIcon}>🧳</span>
              <p>還沒有行程</p>
              <p style={styles.emptyHint}>點擊上方「新增行程」開始規劃</p>
            </div>
          ) : (
            trips.map((trip) => (
              <div key={trip.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={getStatusBadge(trip.status).style}>{getStatusBadge(trip.status).text}</span>
                  <button onClick={() => deleteTrip(trip.id)} style={styles.deleteButton}>🗑️</button>
                </div>
                <h3 style={styles.cardTitle}>{trip.title}</h3>
                {trip.location && <p style={styles.cardLocation}>📍 {trip.location}</p>}
                <p style={styles.cardDate}>📅 {trip.start_date} ~ {trip.end_date}</p>
                {trip.description && <p style={styles.cardDesc}>{trip.description}</p>}
                
                {/* 進入行程的選單 */}
                <div style={styles.tripMenu}>
                  <button 
                    style={styles.tripMenuButton}
                    onClick={() => router.push(`/trip/dashboard?groupId=${gId}&tripId=${trip.id}`)}
                  >
                    📊 儀表板
                  </button>
                  <button 
                    style={styles.tripMenuButton}
                    onClick={() => router.push(`/trip/wishlist?groupId=${gId}&tripId=${trip.id}`)}
                  >
                    🎯 許願池
                  </button>
                  <button 
                    style={styles.tripMenuButton}
                    onClick={() => router.push(`/trip/itinerary?groupId=${gId}&tripId=${trip.id}`)}
                  >
                    📋 行程
                  </button>
                  <button 
                    style={styles.tripMenuButton}
                    onClick={() => router.push(`/trip/expenses?groupId=${gId}&tripId=${trip.id}`)}
                  >
                    💰 分帳
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 說明 */}
        <div style={styles.info}>
          <p>💡 選擇一個行程進入後，可進行：</p>
          <ul style={styles.infoList}>
            <li>📊 查看行程儀表板</li>
            <li>🎯 新增景點到許願池並投票</li>
            <li>📋 編排每日行程</li>
            <li>💰 記錄分帳</li>
          </ul>
        </div>
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
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '16px',
  },
  hint: {
    fontSize: '14px',
    color: '#999',
    marginTop: '10px',
  },
  header: {
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    margin: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#666',
    marginTop: '8px',
  },
  addButton: {
    padding: '16px',
    backgroundColor: '#fff',
    border: '2px dashed #667eea',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#667eea',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  input: {
    padding: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dateInput: {
    flex: 1,
    padding: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
  },
  dateSeparator: {
    color: '#999',
  },
  textarea: {
    padding: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical',
  },
  submitButton: {
    padding: '16px',
    backgroundColor: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '48px',
  },
  emptyHint: {
    color: '#999',
    fontSize: '14px',
  },
  card: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  deleteButton: {
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
  },
  cardLocation: {
    color: '#666',
    marginTop: '8px',
  },
  cardDate: {
    color: '#999',
    fontSize: '14px',
    marginTop: '4px',
  },
  cardDesc: {
    color: '#666',
    fontSize: '14px',
    marginTop: '8px',
  },
  tripMenu: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
  },
  tripMenuButton: {
    padding: '12px',
    backgroundColor: '#f8f9fa',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  info: {
    padding: '16px',
    backgroundColor: '#e3f2fd',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#1976d2',
  },
  infoList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
    color: '#333',
  },
};
