// src/pages/liff.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

declare global {
  interface Window {
    liff: any;
  }
}

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

      await window.liff.init({
        liffId: process.env.NEXT_PUBLIC_LIFF_ID!
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: 'red' }}>錯誤：{error}</p>
        <button onClick={() => window.liff.closeWindow()}>關閉</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>歡迎使用旅遊小幫手！</h1>
      {profile && <p>Hello, {profile.displayName}!</p>}
      <p>正在跳轉...</p>
    </div>
  );
}
