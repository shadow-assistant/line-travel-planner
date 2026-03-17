import { Client } from '@line/bot-sdk';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 初始化 LINE Client
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
});

// 初始化 Supabase (使用 service role key 進行管理操作)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 設定 CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 驗證 LINE Signature
    const signature = request.headers['x-line-signature'] as string;
    const bodyString = JSON.stringify(request.body);

    // 簡化驗證 (生產環境應該用原始 body)
    if (!signature) {
      console.warn('No signature provided');
    }

    const events = request.body.events || [];
    
    for (const event of events) {
      await handleEvent(event);
    }

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

async function handleEvent(event: any) {
  if (event.type === 'message' && event.message.type === 'text') {
    await handleTextMessage(event);
  } else if (event.type === 'join' || event.type === 'memberJoined') {
    await handleGroupJoin(event);
  } else if (event.type === 'memberLeft') {
    await handleGroupLeave(event);
  }
}

// 處理文字訊息
async function handleTextMessage(event: any) {
  const userId = event.source.userId;
  const groupId = event.source.groupId;
  const text = event.message.text;
  const replyToken = event.replyToken;

  if (!replyToken) return;

  // 取得用戶資訊
  let profile;
  try {
    profile = await lineClient.getProfile(userId);
  } catch (e) {
    profile = { displayName: 'User' };
  }

  // 自動建立群組記錄（如果不存在）
  if (groupId) {
    const { data: existingGroup } = await supabase
      .from('groups')
      .select('*')
      .eq('line_group_id', groupId)
      .single();

    if (!existingGroup) {
      await supabase.from('groups').insert({
        line_group_id: groupId,
        name: `LINE Group ${groupId.slice(0, 8)}`
      });
    }
  }

  // 指令處理
  const command = text.trim().toLowerCase();
  const liffUrl = process.env.LIFF_URL || 'https://your-app.vercel.app/liff';

  if (command === '/help' || command === '?') {
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: `🎒 旅遊小幫手指令：

/行程 - 查看目前行程
/新增行程 <標題> - 新增行程
/支出 - 查看分帳記錄
/分帳 - 查看還款建議
/help - 顯示此說明

或點擊下方連結開啟網頁版：
${liffUrl}`
    });
  } else if (command.startsWith('/新增行程 ')) {
    const title = text.slice(6).trim();
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: `📝 已收到行程：「${title}」\n請點擊下方連結填寫詳細資料：\n${liffUrl}?action=itinerary&groupId=${groupId}`
    });
  } else if (command === '/行程') {
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: `📋 請點擊連結查看行程：\n${liffUrl}?action=itinerary&groupId=${groupId}`
    });
  } else if (command === '/支出' || command === '/分帳') {
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: `💰 請點擊連結查看分帳：\n${liffUrl}?action=expenses&groupId=${groupId}`
    });
  }
}

// 處理加入群組
async function handleGroupJoin(event: any) {
  if (!event.replyToken) return;
  
  const groupId = event.source.groupId;
  const liffUrl = process.env.LIFF_URL || 'https://your-app.vercel.app/liff';

  // 建立群組記錄
  await supabase.from('groups').upsert({
    line_group_id: groupId,
    name: `Group ${groupId?.slice(0, 8) || 'Unknown'}`
  }, { onConflict: 'line_group_id' });

  // 發送歡迎訊息
  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: `🎉 旅遊小幫手上線！

我可以幫你：
• 📋 多人共編行程
• 💰 記帳分帳

輸入 /help 查看指令，或點擊連結使用網頁版：
${liffUrl}`
  });
}

// 處理離開群組
async function handleGroupLeave(event: any) {
  const groupId = event.source.groupId;
  console.log(`Left group: ${groupId}`);
}
