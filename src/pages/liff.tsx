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
      const action = urlParams.get('action') || 'home';
      const groupId = urlParams.get('groupId');

      // 根據 action 導向不同頁面
      if (groupId) {
        localStorage.setItem('currentGroupId', groupId);
      }

      switch (action) {
        case 'itinerary':
          router.push(`/trip?groupId=${groupId}`);
          break;
        case 'expenses':
          router.push(`/trip/expenses?groupId=${groupId}`);
          break;
        default:
          router.push('/trip');
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
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <p>載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <h2>❌ 錯誤</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          請在 Vercel 環境變數設定：
          <br/>
          <code>NEXT_PUBLIC_LIFF_ID</code> = 你的 LIFF ID
        </p>
        {window.liff && (
          <button 
            onClick={() => window.liff.closeWindow()}
            style={{ marginTop: '20px', padding: '10px 20px' }}
          >
            關閉
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🎒 旅遊小幫手</h1>
      {profile && <p>Hello, {profile.displayName}!</p>}
      <p>正在跳轉...</p>
    </div>
  );
}
