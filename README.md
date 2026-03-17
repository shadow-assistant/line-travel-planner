# LINE 旅遊規劃管理小工具

一個讓 LINE 群組用戶共同編輯行程與分帳的應用程式。

## 🏗️ 技術棧

- **前端**: Next.js (React) + TypeScript
- **後端**: Vercel Serverless Functions (API Routes)
- **資料庫**: Supabase (PostgreSQL + Realtime)
- **LINE SDK**: @line/bot-sdk
- **認證**: Supabase Auth + LINE Login

## 📁 專案結構

```
line-travel-planner/
├── supabase/
│   └── schema.sql              # 資料庫 Schema
├── api/
│   ├── webhook.ts              # LINE Webhook 處理
│   ├── itineraries.ts         # 行程 CRUD
│   └── expenses.ts            # 支出與分帳
├── src/
│   ├── components/             # React 元件
│   ├── pages/
│   │   ├── index.tsx          # 首頁
│   │   ├── liff.tsx           # LIFF 入口頁面
│   │   └── trip/
│   │       ├── index.tsx      # 行程總覽
│   │       └── expenses.tsx   # 分帳頁面
│   └── lib/
│       ├── supabase.ts        # Supabase 客戶端
│       └── line.ts            # LINE 工具函數
├── .env.local.example          # 環境變數範例
├── vercel.json                 # Vercel 設定
└── package.json
```

## 🚀 快速開始

1. [第一步：設定 Supabase](./supabase/schema.sql)
2. [第二步：部署到 Vercel](./docs/deployment.md)
3. [第三步：設定 LINE LIFF](./docs/liff.md)

## 📱 功能

- ✅ 多人共編行程 (Realtime)
- ✅ 記帳分帳計算 (優化還款路徑)
- ✅ LINE LIFF 整合
- ✅ 群組權限管理
