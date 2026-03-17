import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface WishlistItem {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  place_id: string;
  photo_url: string;
  rating: number;
  website: string;
  phone: string;
  category: string;
  votes: number;
  must_go_count: number;
  user_vote?: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function WishlistPage() {
  const router = useRouter();
  const { groupId } = router.query;
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualPlace, setManualPlace] = useState({ title: '', location: '', description: '' });

  const gId = Array.isArray(groupId) ? groupId[0] : (groupId || '');

  useEffect(() => {
    const id = Array.isArray(gId) ? gId[0] : gId;
    if (id) {
      fetchWishlist(id);
    }
  }, [gId]);

  const fetchWishlist = async (id: string) => {
    try {
      const res = await fetch(`/api/wishlist?groupId=${id}`);
      const data = await res.json();
      setWishlist(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchPlaces = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);

    // 如果沒有 API Key，切換到手動輸入模式
    if (!GOOGLE_MAPS_API_KEY) {
      setManualMode(true);
      setSearching(false);
      return;
    }

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&language=zh-TW&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results.slice(0, 5));
      } else {
        // 沒有結果，切換到手動模式
        setManualPlace({ ...manualPlace, title: searchQuery });
        setManualMode(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      setManualMode(true);
    } finally {
      setSearching(false);
    }
  };

  const addToWishlist = async (place: any) => {
    if (!gId) return;

    let photoUrl = null;
    if (place.photos && place.photos[0]) {
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`;
    }

    try {
      const newItem = {
        group_id: gId,
        title: place.name,
        description: '',
        location: place.formatted_address || place.vicinity,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        place_id: place.place_id,
        photo_url: photoUrl,
        rating: place.rating || 0,
        website: '',
        phone: '',
        category: place.types?.[0] || '景點',
      };

      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        fetchWishlist(gId);
        setSearchResults([]);
        setSearchQuery('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addManualPlace = async () => {
    if (!gId || !manualPlace.title) return;

    try {
      const newItem = {
        group_id: gId,
        title: manualPlace.title,
        description: manualPlace.description,
        location: manualPlace.location,
        latitude: null,
        longitude: null,
        place_id: null,
        photo_url: null,
        rating: 0,
        website: '',
        phone: '',
        category: '景點',
      };

      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        fetchWishlist(gId);
        setManualPlace({ title: '', location: '', description: '' });
        setManualMode(false);
        setSearchQuery('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const vote = async (itemId: string, voteType: string) => {
    try {
      await fetch('/api/wishlist/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlist_id: itemId, vote_type: voteType }),
      });
      fetchWishlist(gId);
    } catch (err) {
      console.error(err);
    }
  };

  const sortedWishlist = [...wishlist].sort((a, b) => (b.votes || 0) - (a.votes || 0));

  return (
    <Layout activeTab="wishlist" groupId={gId}>
      <div style={styles.container}>
        {/* 標題 */}
        <div style={styles.header}>
          <h1 style={styles.title}>🎯 許願池</h1>
          <p style={styles.subtitle}>搜尋景點或手動新增大家一起投票！</p>
        </div>

        {/* 搜尋框 */}
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="🔍 搜尋景點..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchPlaces()}
            style={styles.searchInput}
          />
          <button onClick={searchPlaces} disabled={searching} style={styles.searchButton}>
            {searching ? '搜尋中...' : '搜尋'}
          </button>
        </div>

        {/* API Key 提示 */}
        {!GOOGLE_MAPS_API_KEY && (
          <div style={styles.apiHint}>
            ⚠️ 未設定 Google Maps API Key，僅能手動新增景點
          </div>
        )}

        {/* 手動輸入模式 */}
        {manualMode && (
          <div style={styles.manualForm}>
            <h3 style={styles.manualTitle}>➕ 手動新增景點</h3>
            <input
              type="text"
              placeholder="景點名稱 *"
              value={manualPlace.title}
              onChange={(e) => setManualPlace({ ...manualPlace, title: e.target.value })}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="地址"
              value={manualPlace.location}
              onChange={(e) => setManualPlace({ ...manualPlace, location: e.target.value })}
              style={styles.input}
            />
            <textarea
              placeholder="描述 (可選)"
              value={manualPlace.description}
              onChange={(e) => setManualPlace({ ...manualPlace, description: e.target.value })}
              style={styles.textarea}
            />
            <div style={styles.manualButtons}>
              <button onClick={() => setManualMode(false)} style={styles.cancelButton}>
                取消
              </button>
              <button onClick={addManualPlace} style={styles.addButton}>
                新增至許願池
              </button>
            </div>
          </div>
        )}

        {/* 搜尋結果 */}
        {searchResults.length > 0 && (
          <div style={styles.searchResults}>
            <h3 style={styles.resultTitle}>搜尋結果</h3>
            {searchResults.map((place) => (
              <div key={place.place_id} style={styles.resultItem}>
                <div style={styles.resultInfo}>
                  <span style={styles.resultName}>{place.name}</span>
                  <span style={styles.resultAddress}>{place.vicinity || place.formatted_address}</span>
                  {place.rating && (
                    <span style={styles.resultRating}>⭐ {place.rating}</span>
                  )}
                </div>
                <button onClick={() => addToWishlist(place)} style={styles.addButton}>
                  + 加入
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 許願池列表 */}
        <div style={styles.list}>
          {loading ? (
            <p style={styles.loading}>載入中...</p>
          ) : sortedWishlist.length === 0 ? (
            <div style={styles.empty}>
              <span style={styles.emptyIcon}>🎯</span>
              <p>許願池是空的</p>
              <p style={styles.emptyHint}>搜尋景點或手動新增</p>
            </div>
          ) : (
            sortedWishlist.map((item) => (
              <div key={item.id} style={styles.card}>
                {item.photo_url && (
                  <div style={styles.cardImage}>
                    <img src={item.photo_url} alt={item.title} style={styles.image} onError={(e) => {e.currentTarget.style.display = 'none'}} />
                    <span style={styles.category}>{item.category}</span>
                  </div>
                )}
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  {item.location && <p style={styles.cardLocation}>📍 {item.location}</p>}
                  {item.rating > 0 && <p style={styles.cardRating}>⭐ {item.rating}</p>}
                  
                  {/* 投票按鈕 */}
                  <div style={styles.voteButtons}>
                    <button 
                      onClick={() => vote(item.id, 'like')}
                      style={{
                        ...styles.voteButton,
                        ...(item.user_vote === 'like' ? styles.voteButtonActive : {}),
                      }}
                    >
                      👍 {item.votes || 0}
                    </button>
                    <button 
                      onClick={() => vote(item.id, 'must_go')}
                      style={{
                        ...styles.voteButton,
                        ...(item.user_vote === 'must_go' ? styles.voteButtonMustGo : {}),
                      }}
                    >
                      🏆 想去 {item.must_go_count || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
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
    fontSize: '14px',
  },
  searchBox: {
    display: 'flex',
    gap: '10px',
  },
  searchInput: {
    flex: 1,
    padding: '14px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '16px',
    outline: 'none',
  },
  searchButton: {
    padding: '14px 20px',
    backgroundColor: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  apiHint: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#fff3e0',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#f57c00',
  },
  manualForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  manualTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  input: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
  },
  textarea: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
    minHeight: '60px',
    resize: 'vertical',
  },
  manualButtons: {
    display: 'flex',
    gap: '10px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  addButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  resultTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  resultInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  resultName: {
    fontWeight: '600',
  },
  resultAddress: {
    fontSize: '12px',
    color: '#666',
  },
  resultRating: {
    fontSize: '12px',
    color: '#f5a623',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  emptyIcon: {
    fontSize: '48px',
  },
  emptyHint: {
    color: '#999',
    fontSize: '14px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  cardImage: {
    position: 'relative',
    height: '150px',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  category: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '4px 10px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    borderRadius: '20px',
    fontSize: '12px',
  },
  cardContent: {
    padding: '16px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  cardLocation: {
    color: '#666',
    fontSize: '14px',
    marginTop: '4px',
  },
  cardRating: {
    color: '#f5a623',
    fontSize: '14px',
    marginTop: '4px',
  },
  voteButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  voteButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  voteButtonActive: {
    backgroundColor: '#667eea',
    color: '#fff',
  },
  voteButtonMustGo: {
    backgroundColor: '#f5a623',
    color: '#fff',
  },
};
