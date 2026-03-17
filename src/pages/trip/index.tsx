import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Itinerary {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
}

export default function TripPage() {
  const router = useRouter();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const groupId = localStorage.getItem('currentGroupId') || router.query.groupId;
    if (groupId) {
      fetchItineraries(groupId as string);
    } else {
      setError('請透過 LINE 群組進入');
      setLoading(false);
    }
  }, [router.query.groupId]);

  const fetchItineraries = async (groupId: string) => {
    try {
      const res = await fetch(`/api/itineraries?groupId=${groupId}`);
      const data = await res.json();
      setItineraries(data || []);
    } catch (err) {
      setError('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p>載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎒 旅遊小幫手</h1>
      
      <div style={styles.menu}>
        <Link href={`/trip/itinerary?groupId=${router.query.groupId}`} style={styles.card}>
          <span style={styles.emoji}>📋</span>
          <span>行程規劃</span>
        </Link>
        
        <Link href={`/trip/expenses?groupId=${router.query.groupId}`} style={styles.card}>
          <span style={styles.emoji}>💰</span>
          <span>分帳紀錄</span>
        </Link>
      </div>

      <h2 style={styles.sectionTitle}>目前行程</h2>
      
      {itineraries.length === 0 ? (
        <p style={styles.empty}>尚無行程，點擊上方「行程規劃」新增</p>
      ) : (
        <div style={styles.list}>
          {itineraries.map((item) => (
            <div key={item.id} style={styles.item}>
              <h3>{item.title}</h3>
              <p>{item.location}</p>
              <p style={styles.date}>
                {item.start_date} ~ {item.end_date}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={styles.footer}>
        <button onClick={() => window.liff?.closeWindow()} style={styles.button}>
          關閉
        </button>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    padding: '20px',
    fontFamily: 'system-ui, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  menu: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '30px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px',
    backgroundColor: '#f5f5f5',
    borderRadius: '15px',
    textDecoration: 'none',
    color: '#333',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  emoji: {
    fontSize: '40px',
    marginBottom: '10px',
  },
  sectionTitle: {
    marginBottom: '15px',
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: '20px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  item: {
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  date: {
    color: '#666',
    fontSize: '14px',
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center',
  },
  button: {
    padding: '12px 30px',
    fontSize: '16px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
  },
};
