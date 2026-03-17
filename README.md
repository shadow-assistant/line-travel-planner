# 🧩 Puzzle Trip 拼圖遊

LINE 旅遊規劃管理小工具 - 多人共編行程與分帳

![Puzzle Trip](https://img.shields.io/badge/Puzzle-Trip-667eea?style=for-the-badge)

## ✨ 功能特色

### 🎯 許願池
- 搜尋景點並加入清單
- Google Maps API 整合
- 投票機制（👍想去 🏆必去）

### 📋 多人行程規劃
- 拖曳排序功能
- 每日時間軸顯示
- 即時同步更新

### 💰 智慧分帳
- 多幣別支援
- 自動匯率轉換
- 最優還款路徑計算

### 📱 支援多平台
- LINE LIFF 內嵌網頁
- 響應式設計（手機/平板/電腦）

## 🏗️ 技術架構

- **前端**: Next.js 14 + React + TypeScript
- **後端**: Vercel Serverless Functions
- **資料庫**: Supabase (PostgreSQL + Realtime)
- **認證**: Supabase Auth + LINE Login
- **LINE SDK**: @line/bot-sdk

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.local.example` 為 `.env.local` 並填入：

```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
LINE_CHANNEL_ACCESS_TOKEN=your-line-token
LINE_CHANNEL_SECRET=your-line-secret
NEXT_PUBLIC_LIFF_ID=your-liff-id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### 3. 設定 Supabase

在 Supabase SQL Editor 執行 `supabase/schema.sql`

### 4. 開發

```bash
npm run dev
```

### 5. 部署

推送到 GitHub，連接 Vercel 自動部署

## 📁 專案結構

```
line-travel-planner/
├── api/                    # Serverless API
│   ├── webhook.ts         # LINE Webhook
│   ├── itineraries.ts     # 行程 API
│   ├── expenses.ts        # 分帳 API
│   └── wishlist.ts        # 許願池 API
├── src/
│   ├── components/         # React 元件
│   └── pages/
│       ├── trip/
│           ├── index.tsx  # 儀表板
│           ├── wishlist.tsx  # 許願池
│           ├── itinerary.tsx # 行程
│           └── expenses.tsx  # 分帳
├── supabase/
│   └── schema.sql         # 資料庫 Schema
└── docs/
    ├── deployment.md       # 部署教學
    └── liff.md            # LIFF 整合
```

## 📱 LINE 指令

| 指令 | 功能 |
|------|------|
| `/help` | 顯示說明 |
| `/行程` | 查看行程 |
| `/新增行程 <標題>` | 新增行程 |
| `/支出` | 查看分帳 |
| `/分帳` | 查看還款建議 |

## 🔧 環境變數

| 變數 | 說明 |
|------|------|
| `SUPABASE_URL` | Supabase 專案 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret |
| `NEXT_PUBLIC_LIFF_ID` | LINE LIFF ID |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API Key |

## 📄 License

MIT
