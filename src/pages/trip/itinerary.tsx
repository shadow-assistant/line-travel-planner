import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface ItineraryItem {
  id: string;
  title: string;
  day_number: number;
  time: string;
  location: string;
  description: string;
  order_index: number;
  latitude?: number;
  longitude?: number;
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
  const { groupId } = router.query;
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [draggedItem, setDraggedItem] = useState<ItineraryItem | null>(null);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  const gId = Array.isArray(groupId) ? groupId[0] : groupId;

  useEffect(() => {
    if (gId) {
      fetchItineraries(gId);
    }
  }, [gId]);

  const fetchItineraries = async (id: string) => {
    try {
      const res = await fetch(`/api/itineraries?groupId=${id}`);
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

  // 拖拉相關函數
  const handleDragStart = (e: React.DragEvent, item: ItineraryItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetItem: ItineraryItem) => {
    e.preventDefault();
    if (!draggedItem || !selectedItinerary || draggedItem.id === targetItem.id) return;

    // 交換順序
    const items = [...(selectedItinerary.items || [])];
    const draggedIndex = items.findIndex(i => i.id === draggedItem.id);
    const targetIndex = items.findIndex(i => i.id === targetItem.id);

    // 移除 dragged item
    items.splice(draggedIndex, 1);
    // 插入到目標位置
    items.splice(targetIndex, 0, draggedItem);

    // 更新本地狀態
    const updatedItinerary = {
      ...selectedItinerary,
      items: items.map((item, index) => ({ ...item, order_index: index })),
    };
    setSelectedItinerary(updatedItinerary);

    // 更新服務器
    try {
      await fetch('/api/itineraries/items/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item, index) => ({ id: item.id, order_index: index })),
        }),
      });
    } catch (err) {
      console.error(err);
    }

    setDraggedItem(null);
  };

  const updateItem = async (item: ItineraryItem) => {
    try {
      await fetch('/api/itineraries/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      fetchItineraries(gId);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  // 按天分組
  const groupedItems = selectedItinerary?.items
    ?.sort((a, b) => a.day_number - b.day_number || a.order_index - b.order_index)
    .reduce((groups: any, item) => {
      const day = item.day_number || 1;
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
      return groups;
    }, {});

  return (
    <Layout activeTab="itinerary" groupId={gId}>
      <div style={styles.container}>
        {/* 標題 */}
        <div style={styles.header}>
          <h1 style={styles.title}>📋 行程規劃</h1>
        </div>

        {/* 行程選擇器 */}
        {itineraries.length > 0 && (
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
        )}

        {loading ? (
          <p style={styles.loading}>載入中...</p>
        ) : !selectedItinerary ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>📋</span>
            <p>尚無行程</p>
            <p style={styles.emptyHint}>在群組輸入 /新增行程 來建立</p>
          </div>
        ) : (
          /* 行程詳情 */
          <div style={styles.content}>
            <div style={styles.tripInfo}>
              <h2 style={styles.tripTitle}>{selectedItinerary.title}</h2>
              <p style={styles.tripLocation}>📍 {selectedItinerary.location || '未設定'}</p>
              <p style={styles.tripDate}>
                📅 {selectedItinerary.start_date} ~ {selectedItinerary.end_date}
              </p>
            </div>

            {/* 拖曳提示 */}
            <div style={styles.dragHint}>
              💡 拖曳項目可以調整順序
            </div>

            {/* 每天行程 */}
            {groupedItems && Object.keys(groupedItems).map((day) => (
              <div key={day} style={styles.daySection}>
                <h3 style={styles.dayTitle}>Day {day}</h3>
                <div style={styles.timeline}>
                  {groupedItems[day].map((item: ItineraryItem, index: number) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, item)}
                      style={{
                        ...styles.item,
                        ...(draggedItem?.id === item.id ? styles.itemDragging : {}),
                      }}
                    >
                      <div style={styles.dragHandle}>⋮⋮</div>
                      <div style={styles.itemTime}>
                        {item.time ? item.time.slice(0, 5) : `${9 + index}:00`}
                      </div>
                      <div style={styles.itemContent}>
                        <h4 style={styles.itemTitle}>{item.title}</h4>
                        {item.location && (
                          <p style={styles.itemLocation}>📍 {item.location}</p>
                        )}
                        {item.description && (
                          <p style={styles.itemDesc}>{item.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingItem(item)}
                        style={styles.editButton}
                      >
                        ✏️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {(!groupedItems || Object.keys(groupedItems).length === 0) && (
              <div style={styles.noItems}>
                <p>尚無行程項目</p>
              </div>
            )}
          </div>
        )}

        {/* 編輯Modal */}
        {editingItem && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>編輯項目</h3>
              <input
                type="text"
                placeholder="標題"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="時間 (HH:MM)"
                value={editingItem.time || ''}
                onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="地點"
                value={editingItem.location || ''}
                onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                style={styles.input}
              />
              <textarea
                placeholder="描述"
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                style={styles.textarea}
              />
              <div style={styles.modalButtons}>
                <button onClick={() => setEditingItem(null)} style={styles.cancelButton}>
                  取消
                </button>
                <button onClick={() => updateItem(editingItem)} style={styles.saveButton}>
                  儲存
                </button>
              </div>
            </div>
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
  selector: {
    marginBottom: '10px',
  },
  select: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    backgroundColor: '#fff',
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  tripInfo: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  tripTitle: {
    fontSize: '22px',
    fontWeight: '700',
    margin: 0,
  },
  tripLocation: {
    color: '#666',
    marginTop: '8px',
  },
  tripDate: {
    color: '#666',
    marginTop: '4px',
  },
  dragHint: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#e8f5e9',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#4caf50',
  },
  daySection: {
    marginBottom: '10px',
  },
  dayTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#667eea',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    cursor: 'grab',
    transition: 'all 0.2s',
  },
  itemDragging: {
    opacity: 0.5,
    transform: 'scale(1.02)',
  },
  dragHandle: {
    color: '#ccc',
    fontSize: '18px',
    cursor: 'grab',
    paddingTop: '4px',
  },
  itemTime: {
    fontSize: '14px',
    color: '#667eea',
    fontWeight: '600',
    minWidth: '50px',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  itemLocation: {
    fontSize: '13px',
    color: '#666',
    marginTop: '4px',
  },
  itemDesc: {
    fontSize: '13px',
    color: '#999',
    marginTop: '4px',
  },
  editButton: {
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
  },
  noItems: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
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
    minHeight: '80px',
    resize: 'vertical',
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
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
  saveButton: {
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
};
