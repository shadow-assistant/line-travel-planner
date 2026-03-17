# 🚀 部署指引

## 第一步：在 Supabase 建立專案

1. 前往 [Supabase](https://supabase.com/) 註冊/登入
2. 建立新專案 (New Project)
3. 取得以下資訊：
   - **Project URL** (Settings → API)
   - **anon public** key (Settings → API)
   - **service_role** key (Settings → API) ⚠️ 請妥善保管

## 第二步：執行 Schema

1. 在 Supabase Dashboard 開啟 **SQL Editor**
2. 複製 `supabase/schema.sql` 內容並執行
3. 確認所有資料表和 RLS 政策已建立

## 第三步：在 Vercel 部署

### 方法 A：使用 Vercel CLI
```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 部署
cd line-travel-planner
vercel
```

### 方法 B：使用 GitHub 部署
1. 將專案推送到 GitHub
2. 前往 [Vercel](https://vercel.com/) import repository
3. 設定環境變數（見下文）

## 第四步：設定環境變數

在 Vercel Project Settings → Environment Variables 設定：

| 變數名稱 | 值 | 說明 |
|---------|-----|------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 專案 URL |
| `SUPABASE_ANON_KEY` | `eyJxxx...` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` | service_role key |
| `LINE_CHANNEL_ACCESS_TOKEN` | `xxx...` | LINE Channel Access Token |
| `LINE_CHANNEL_SECRET` | `xxx...` | LINE Channel Secret |
| `LIFF_ID` | `xxx...` | LINE LIFF ID |
| `LIFF_URL` | `https://your-app.vercel.app/liff` | LIFF 網址 |

## 第五步：設定 LINE Developer

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立 Provider 和 Channel (Messaging API)
3. 取得 Channel Access Token
4. 設定 Webhook URL：
   ```
   https://your-app.vercel.app/api/webhook
   ```
5. 啟用 Webhook 並驗證

## 第六步：設定 LIFF

1. 在 LINE Developers Console 新增 LIFF App
2. 設定：
   - **Size**: Full (100%)
   - **Endpoint URL**: `https://your-app.vercel.app/liff`
   - **Scope**: `openid`, `profile`, `chat_message.write`
3. 取得 LIFF ID

## 驗證部署

```bash
# 測試 Webhook
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"events": []}'
```

## 常見問題

### Q: 出現 401 Unauthorized
A: 檢查 LINE Channel Access Token 是否正確

### Q: 出現 RLS 錯誤
A: 確認已執行 schema.sql 且 RLS 已啟用

### Q: Realtime 不運作
A: 確認已在 Supabase 啟用 Realtime 並加入 table 到 publication
