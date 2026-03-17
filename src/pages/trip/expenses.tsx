import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'expenses' | 'settlements'>('expenses');

  useEffect(() => {
    const groupId = localStorage.getItem('currentGroupId') || router.query.groupId;
    if (groupId) {
      fetchExpenses(groupId as string);
      fetchSettlements(groupId as string);
    } else {
      setLoading(false);
    }
  }, [router.query.groupId]);

  const fetchExpenses = async (groupId: string) => {
    try {
      const res = await fetch(`/api/expenses?groupId=${groupId}`);
      const data = await res.json();
      setExpenses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettlements = async (groupId: string) => {
    try {
      const res = await fetch(`/api/expenses?action=settlements&groupId=${groupId}`);
      const data = await res.json();
      setSettlements(data || []);
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

  if (loading) {
    return (
      <div style={styles.container}>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💰 分帳紀錄</h1>

      <div style={styles.tabs}>
        <button
          style={tab === 'expenses' ? styles.activeTab : styles.tab}
          onClick={() => setTab('expenses')}
        >
          支出紀錄
        </button>
        <button
          style={tab === 'settlements' ? styles.activeTab : styles.tab}
          onClick={() => setTab('settlements')}
        >
          結算結果
        </button>
      </div>

      {tab === 'expenses' && (
        <div style={styles.content}>
          {expenses.length === 0 ? (
            <p style={styles.empty}>尚無支出紀錄</p>
          ) : (
            <div style={styles.list}>
              {expenses.map((expense) => (
                <div key={expense.id} style={styles.item}>
                  <div style={styles.itemHeader}>
                    <span style={styles.itemTitle}>{expense.title}</span>
                    <span style={styles.itemAmount}>
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                  </div>
                  <div style={styles.itemMeta}>
                    <span>📅 {expense.date}</span>
                    {expense.category && <span>🏷️ {expense.category}</span>}
                  </div>
                  {expense.notes && (
                    <p style={styles.notes}>{expense.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'settlements' && (
        <div style={styles.content}>
          {settlements.length === 0 ? (
            <p style={styles.empty}>尚無結算資料</p>
          ) : (
            <div style={styles.list}>
              {settlements.map((settlement, index) => (
                <div key={index} style={styles.settlement}>
                  <span style={styles.settlementFrom}>
                    {settlement.from_user?.display_name || 'A'}
                  </span>
                  <span style={styles.arrow}>→</span>
                  <span style={styles.settlementTo}>
                    {settlement.to_user?.display_name || 'B'}
                  </span>
                  <span style={styles.settlementAmount}>
                    {formatCurrency(settlement.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  activeTab: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#06c755',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  content: {
    minHeight: '300px',
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: '40px',
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
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: '16px',
  },
  itemAmount: {
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  itemMeta: {
    display: 'flex',
    gap: '15px',
    fontSize: '14px',
    color: '#666',
  },
  notes: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#666',
  },
  settlement: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  settlementFrom: {
    fontWeight: 'bold',
  },
  arrow: {
    margin: '0 10px',
    fontSize: '20px',
  },
  settlementTo: {
    fontWeight: 'bold',
  },
  settlementAmount: {
    fontWeight: 'bold',
    color: '#e74c3c',
    fontSize: '18px',
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
