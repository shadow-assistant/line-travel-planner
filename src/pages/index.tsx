import type { NextPage } from 'next'

const Home: NextPage = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>🎒 旅遊小幫手</h1>
      <p>LINE 旅遊規劃管理工具</p>
      
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <h2>功能</h2>
        <ul style={{ textAlign: 'left' }}>
          <li>📋 多人共編行程</li>
          <li>💰 記帳分帳</li>
          <li>🔄 即時同步</li>
        </ul>
      </div>

      <div style={{ marginTop: '30px' }}>
        <p>請透過 LINE 開啟 LIFF 頁面使用</p>
      </div>
    </div>
  )
}

export default Home
