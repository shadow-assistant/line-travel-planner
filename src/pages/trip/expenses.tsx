import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  amount_twd: number;
  category: string;
  date: string;
  paid_by: string;
  notes: string;
  sharers: Array<{
    user_id: string;
    share_amount: number;
  }>;
}

interface Settlement {
  from_user_id: string;
  to_user_id: string;
  amount: number;
  from_user?: { display_name: string };
  to_user?: { display_name: string };
}

export default function ExpensesPage() {
  const router = useRouter();
  const { groupId } = router.query;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'expenses' | 'settlements'>('expenses');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    currency: 'TWD',
    category: '其他',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const gId = Array.isArray(groupId) ? groupId[0] : (groupId || '');

  useEffect(() => {
    const id = Array.isArray(gId) ? gId[0] : gId;
    if (id) {
      fetchExpenses(id);
      fetchSettlements(id);
    }
  }, [gId]);

  const fetchExpenses = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses?groupId=${id}`);
      const data = await res.json();
      setExpenses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettlements = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses?action=settlements&groupId=${id}`);
      const data = await res.json();
      setSettlements(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addExpense = async () => {
    if (!newExpense.title || !newExpense.amount) return;

    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: gId,
          ...newExpense,
          amount: parseFloat(newExpense.amount),
          paid_by: 'user-1', // TODO: 從認證取得
        }),
      });

      fetchExpenses(gId);
      fetchSettlements(gId);
      setShowAddForm(false);
      setNewExpense({
        title: '',
        amount: '',
        currency: 'TWD',
        category: '其他',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'TWD') => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount_twd || e.amount), 0);
  const categoryColors: Record<string, string> = {
    '交通': '#4fc3f7',
    '住宿': '#ba68c8',
    '餐飲': '#ffb74d',
    '門票': '#81c784',
    '購物': '#f06292',
    '其他': '#90a4ae',
  };

  return (
    <Layout activeTab="expenses" groupId={gId}>
      <div style={styles.container}>
        {/* 標題 */}
        <div style={styles.header}>
          <h1 style={styles.title}>💰 分帳紀錄</h1>
        </div>

        {/* 總花費卡片 */}
        <div style={styles.totalCard}>
          <span style={styles.totalLabel}>總花費</span>
          <span style={styles.totalValue}>{formatCurrency(totalExpenses)}</span>
          <span style={styles.totalCount}>{expenses.length} 筆消費</span>
        </div>

        {/* 分類標籤 */}
        <div style={styles.tabs}>
          <button
            style={tab === 'expenses' ? styles.activeTab : styles.tab}
            onClick={() => setTab('expenses')}
          >
            消費紀錄
          </button>
          <button
            style={tab === 'settlements' ? styles.activeTab : styles.tab}
            onClick={() => setTab('settlements')}
          >
            結算結果
          </button>
        </div>

        {tab === 'expenses' && (
          <>
            {/* 新增按鈕 */}
            <button onClick={() => setShowAddForm(!showAddForm)} style={styles.addButton}>
              {showAddForm ? '✕ 取消' : '+ 新增消費'}
            </button>

            {/* 新增表單 */}
            {showAddForm && (
              <div style={styles.form}>
                <input
                  type="text"
                  placeholder="項目名稱"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  style={styles.input}
                />
                <div style={styles.formRow}>
                  <input
                    type="number"
                    placeholder="金額"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <select
                    value={newExpense.currency}
                    onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                    style={{ ...styles.select, width: '100px' }}
                  >
                    <option value="TWD">TWD</option>
                    <option value="JPY">JPY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div style={styles.formRow}>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    style={{ ...styles.select, flex: 1 }}
                  >
                    <option value="交通">交通</option>
                    <option value="住宿">住宿</option>
                    <option value="餐飲">餐飲</option>
                    <option value="門票">門票</option>
                    <option value="購物">購物</option>
                    <option value="其他">其他</option>
                  </select>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    style={{ ...styles.input, width: '140px' }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="備註 (選填)"
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  style={styles.input}
                />
                <button onClick={addExpense} style={styles.submitButton}>
                  新增
                </button>
              </div>
            )}

            {/* 消費列表 */}
            <div style={styles.list}>
              {loading ? (
                <p style={styles.loading}>載入中...</p>
              ) : expenses.length === 0 ? (
                <div style={styles.empty}>
                  <span style={styles.emptyIcon}>💸</span>
                  <p>尚無消費紀錄</p>
                </div>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <span
                        style={{
                          ...styles.categoryBadge,
                          backgroundColor: categoryColors[expense.category] || '#90a4ae',
                        }}
                      >
                        {expense.category}
                      </span>
                      <span style={styles.cardAmount}>
                        {formatCurrency(expense.amount, expense.currency)}
                      </span>
                    </div>
                    <h3 style={styles.cardTitle}>{expense.title}</h3>
                    <div style={styles.cardMeta}>
                      <span>📅 {expense.date}</span>
                    </div>
                    {expense.notes && <p style={styles.cardNotes}>{expense.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tab === 'settlements' && (
          <div style={styles.list}>
            {settlements.length === 0 ? (
              <div style={styles.empty}>
                <span style={styles.emptyIcon}>🤝</span>
                <p>尚無待結算項目</p>
                <p style={styles.emptyHint}>大家一起記帳後會自動計算</p>
              </div>
            ) : (
              <>
                <div style={styles.settlementInfo}>
                  <p>🎯 最優轉帳路徑</p>
                </div>
                {settlements.map((settlement, index) => (
                  <div key={index} style={styles.settlementCard}>
                    <div style={styles.settlementFrom}>
                      <span style={styles.avatar}>👤</span>
                      <span>{settlement.from_user?.display_name || 'A'}</span>
                    </div>
                    <div style={styles.arrow}>→</div>
                    <div style={styles.settlementTo}>
                      <span style={styles.avatar}>👤</span>
                      <span>{settlement.to_user?.display_name || 'B'}</span>
                    </div>
                    <div style={styles.settlementAmount}>
                      {formatCurrency(settlement.amount)}
                    </div>
                  </div>
                ))}
              </>
            )}
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
  totalCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    color: '#fff',
  },
  totalLabel: {
    fontSize: '14px',
    opacity: 0.9,
  },
  totalValue: {
    fontSize: '36px',
    fontWeight: '800',
    marginTop: '8px',
  },
  totalCount: {
    fontSize: '13px',
    opacity: 0.8,
    marginTop: '4px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
  },
  tab: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#666',
  },
  activeTab: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#fff',
  },
  addButton: {
    padding: '14px',
    backgroundColor: '#fff',
    border: '2px dashed #667eea',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#667eea',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  formRow: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
  },
  select: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: '#fff',
  },
  submitButton: {
    padding: '14px',
    backgroundColor: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
    marginTop: '8px',
  },
  card: {
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '14px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  categoryBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
  },
  cardAmount: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#e74c3c',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  cardMeta: {
    display: 'flex',
    gap: '15px',
    marginTop: '8px',
    fontSize: '13px',
    color: '#666',
  },
  cardNotes: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#999',
  },
  settlementInfo: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#e8f5e9',
    borderRadius: '10px',
    color: '#4caf50',
    fontWeight: '600',
  },
  settlementCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '14px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  settlementFrom: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  settlementTo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  avatar: {
    fontSize: '24px',
  },
  arrow: {
    fontSize: '24px',
    color: '#667eea',
    fontWeight: 'bold',
  },
  settlementAmount: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#e74c3c',
  },
};
