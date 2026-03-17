// src/pages/liff.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

declare global {
  interface Window {
    liff: any;
  }
}

// 從環境變數取得 LIFF ID
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '2000000000'; // 替换为你的 LIFF ID

export default function LiffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeLiff();
  }, []);

  const initializeLiff = async () => {
    try {
      // 等待 liff SDK 載入
      await loadLiffSdk();

      if (!LIFF_ID || LIFF_ID === '2000000000') {
        throw new Error('LIFF ID 未設定，請在 Vercel 設定 NEXT_PUBLIC_LIFF_ID 環境變數');
      }

      await window.liff.init({
        liffId: LIFF_ID
      });

      if (!window.liff.isLoggedIn()) {
        window.liff.login();
        return;
      }

      const userProfile = await window.liff.getProfile();
      setProfile(userProfile);

      // 解析 URL 參數
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action') || 'trips';
      const groupId = urlParams.get('groupId');
      const tripId = urlParams.get('tripId');

      // 根據 action 導向不同頁面
      if (groupId) {
        localStorage.setItem('currentGroupId', groupId);
      }
      if (tripId) {
        localStorage.setItem('currentTripId', tripId);
      }

      switch (action) {
        case 'dashboard':
          router.push(`/trip/dashboard?groupId=${groupId}&tripId=${tripId}`);
          break;
        case 'wishlist':
          router.push(`/trip/wishlist?groupId=${groupId}&tripId=${tripId}`);
          break;
        case 'itinerary':
          router.push(`/trip/itinerary?groupId=${groupId}&tripId=${tripId}`);
          break;
        case 'expenses':
          router.push(`/trip/expenses?groupId=${groupId}&tripId=${tripId}`);
          break;
        case 'trips':
        default:
          router.push(`/trip?groupId=${groupId}`);
      }
    } catch (err: any) {
      console.error('LIFF init error:', err);
      setError(err.message || '初始化失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadLiffSdk = () => {
    return new Promise((resolve, reject) => {
      if (window.liff) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load LIFF SDK'));
      document.body.appendChild(script);
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <p>🧩 Puzzle Trip</p>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>❌ 錯誤</h2>
          <p>{error}</p>
          <p style={styles.hint}>
            請在 Vercel 環境變數設定：
            <br/>
            <code>NEXT_PUBLIC_LIFF_ID</code>
          </p>
          {window.liff && (
            <button onClick={() => window.liff.closeWindow()} style={styles.button}>
              關閉
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.welcome}>
        <h1>🧩 Puzzle Trip</h1>
        <p>拼圖遊 - 讓旅行像玩拼圖一樣簡單</p>
        {profile && <p>Hello, {profile.displayName}!</p>}
        <p>正在跳轉...</p>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8f9fa',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    maxWidth: '300px',
  },
  hint: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#666',
  },
  button: {
    marginTop: '20px',
    padding: '12px 24px',
    backgroundColor: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  welcome: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '20px',
    margin: '20px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
  },
};
