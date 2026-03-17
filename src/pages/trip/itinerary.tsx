import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface ItineraryItem {
  id: string;
  title: string;
  day_number: number;
  time: string;
  location: string;
  description: string;
}

interface Itinerary {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  items: ItineraryItem[];
}

export default function ItineraryPage() {
  const router = useRouter();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    const groupId = localStorage.getItem('currentGroupId') || router.query.groupId;
    if (groupId) {
      fetchItineraries(groupId as string);
    } else {
      setLoading(false);
    }
  }, [router.query.groupId]);

  const fetchItineraries = async (groupId: string) => {
    try {
      const res = await fetch(`/api/itineraries?groupId=${groupId}`);
      const data = await res.json();
      setItineraries(data || []);
      if (data && data.length > 0) {
        setSelectedItinerary(data[0]);
      }
    } catch (err) {
      console.error(err);
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

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📋 行程規劃</h1>

      {itineraries.length === 0 ? (
        <div style={styles.empty}>
          <p>尚無行程</p>
          <p style={styles.hint}>請在群組輸入 /新增行程 來建立行程</p>
        </div>
      ) : (
        <>
          <div style={styles.selector}>
            <select
              value={selectedItinerary?.id || ''}
              onChange={(e) => {
                const found = itineraries.find(i => i.id === e.target.value);
                setSelectedItinerary(found || null);
              }}
              style={styles.select}
            >
              {itineraries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          {selectedItinerary && (
            <div style={styles.content}>
              <div style={styles.header}>
                <h2>{selectedItinerary.title}</h2>
                <p>{selectedItinerary.location}</p>
                <p style={styles.date}>
                  {selectedItinerary.start_date} ~ {selectedItinerary.end_date}
                </p>
              </div>

              {(!selectedItinerary.items || selectedItinerary.items.length === 0) ? (
                <p style={styles.noItems}>尚無行程項目</p>
              ) : (
                <div style={styles.timeline}>
                  {selectedItinerary.items
                    .sort((a, b) => a.day_number - b.day_number || a.time.localeCompare(b.time))
                    .map((item) => (
                      <div key={item.id} style={styles.item}>
                        <div style={styles.dayBadge}>Day {item.day_number}</div>
                        {item.time && <span style={styles.time}>{item.time}</span>}
                        <div style={styles.itemContent}>
                          <h3>{item.title}</h3>
                          {item.location && <p>📍 {item.location}</p>}
                          {item.description && <p style={styles.desc}>{item.description}</p>}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div style={styles.footer}>
        <button onClick={() => router.push(`/trip?groupId=${router.query.groupId}`)} style={styles.backButton}>
          ← 返回
        </button>
        <button onClick={() => window.liff?.closeWindow()} style={styles.closeButton}>
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
    marginBottom: '20px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  hint: {
    fontSize: '14px',
    marginTop: '10px',
  },
  selector: {
    marginBottom: '20px',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '10px',
    border: '1px solid #ddd',
  },
  content: {
    marginBottom: '20px',
  },
  header: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
  },
  date: {
    color: '#666',
    fontSize: '14px',
  },
  noItems: {
    textAlign: 'center',
    color: '#666',
    padding: '20px',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  item: {
    display: 'flex',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  dayBadge: {
    backgroundColor: '#06c755',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '5px',
    fontSize: '12px',
    fontWeight: 'bold',
    height: 'fit-content',
  },
  time: {
    fontSize: '14px',
    color: '#666',
    minWidth: '50px',
  },
  itemContent: {
    flex: 1,
  },
  desc: {
    fontSize: '14px',
    color: '#666',
    marginTop: '5px',
  },
  footer: {
    marginTop: '30px',
    display: 'flex',
    gap: '10px',
  },
  backButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '25px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  closeButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: '25px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};
