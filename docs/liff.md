# 📱 LINE LIFF 整合

## 什麼是 LIFF？

LIFF (LINE Front-end Framework) 讓 LINE 內的網頁應用可以取得用戶資訊並發送訊息。

## 整合流程

### 1. 在 LINE Developers 建立 LIFF App

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇你的 Provider 和 Messaging API Channel
3. 點擊 **LIFF** 標籤
4. 新增 LIFF App

### 2. 設定 LIFF

```
Name: 旅遊小幫手
Size: Full (100%)
Endpoint URL: https://your-app.vercel.app/liff
Scopes: 
  - openid
  - profile
  - chat_message.write (可選)
```

### 3. 取得 LIFF ID

建立後會取得 LIFF ID，格式類似：`2001234567-abcdefgh`

### 4. 在應用程式中使用

在網頁中引入 LIFF SDK：

```html
<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
```

初始化 LIFF：

```javascript
liff.init({
  liffId: '2001234567-abcdefgh'
}).then(() => {
  if (liff.isLoggedIn()) {
    // 已登入
    liff.getProfile().then(profile => {
      console.log(profile);
    });
  } else {
    // 導向登入
    liff.login();
  }
});
```

## 自動關聯群組

### 從 LINE 進入網頁時取得群組資訊

LINE 6.14+ 支援在 LIFF URL 中帶入資訊：

```
https://your-app.vercel.app/liff?groupId=Cxxx&userId=Uxxx
```

### 在 webhook.ts 中處理

```typescript
// 當用戶點擊 LIFF 連結時
if (event.type === 'postback') {
  const data = parsePostbackData(event.postback.data);
  // data.groupId, data.userId
}
```

## 完整流程圖

```
┌─────────────────────────────────────────────────────┐
│  LINE 群組                                          │
│  用戶輸入 /行程 或 點擊 LIFF 連結                    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  LINE Platform                                       │
│  驗證用戶並轉發到 Webhook                            │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  Vercel API (/api/webhook)                          │
│  1. 驗證 Signature                                   │
│  2. 解析事件                                         │
│  3. 關聯群組與用戶                                    │
│  4. 回覆訊息（含 LIFF 連結）                          │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  LIFF 網頁 (/liff)                                   │
│  1. 初始化 LIFF                                      │
│  2. 取得用戶資訊                                      │
│  3. 解析 URL 參數 (groupId)                          │
│  4. 顯示對應的行程/分帳頁面                           │
└─────────────────────────────────────────────────────┘
```

## 安全性考量

1. **不要在 client-side 儲存 sensitive data**
2. **使用 server-side 驗證用戶**
3. **LIFF URL 參數可以被修改**，務必在後端驗證

## 測試

1. 在 LINE 中傳送 LIFF 連結給自己
2. 點擊連結，確認可以開啟網頁
3. 確認可以取得用戶名稱
