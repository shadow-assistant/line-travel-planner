import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-line-signature');

  // LINE Webhook 驗證 (GET 請求)
  if (request.method === 'GET') {
    const challenge = request.query.challenge;
    if (challenge) {
      return response.status(200).send(challenge);
    }
    return response.status(200).send('LINE Webhook is working!');
  }

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 懶惰載入 - 只有收到 POST 才初始化
    const { Client } = await import('@line/bot-sdk');
    const { createClient } = await import('@supabase/supabase-js');

    // 檢查必要的環境變數
    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const lineChannelSecret = process.env.LINE_CHANNEL_SECRET;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!lineChannelAccessToken || !lineChannelSecret) {
      console.error('Missing LINE credentials');
      return response.status(200).json({ error: 'LINE credentials not configured' });
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return response.status(200).json({ error: 'Supabase credentials not configured' });
    }

    // 初始化客戶端
    const lineClient = new Client({
      channelAccessToken: lineChannelAccessToken,
      channelSecret: lineChannelSecret
    });

    const supabase = createClient(supabaseUrl, supabaseKey);

    const events = request.body.events || [];
    
    for (const event of events) {
      await handleEvent(event, lineClient, supabase);
    }

    return response.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error:', error);
    // 返回 200 避免 LINE 不斷重試
    return response.status(200).json({ error: error.message });
  }
}

async function handleEvent(event: any, lineClient: any, supabase: any) {
  if (event.type === 'message' && event.message.type === 'text') {
    await handleTextMessage(event, lineClient, supabase);
  } else if (event.type === 'join' || event.type === 'memberJoined') {
    await handleGroupJoin(event, lineClient, supabase);
  } else if (event.type === 'memberLeft') {
    await handleGroupLeave(event, supabase);
  }
}

// 處理文字訊息
async function handleTextMessage(event: any, lineClient: any, supabase: any) {
  const userId = event.source.userId;
  const groupId = event.source.groupId;
  const text = event.message.text;
  const replyToken = event.replyToken;

  if (!replyToken) return;

  let profile;
  try {
    profile = await lineClient.getProfile(userId);
  } catch (e) {
    profile = { displayName: 'User' };
  }

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
async function handleGroupJoin(event: any, lineClient: any, supabase: any) {
  if (!event.replyToken) return;
  
  const groupId = event.source.groupId;
  const liffUrl = process.env.LIFF_URL || 'https://your-app.vercel.app/liff';

  await supabase.from('groups').upsert({
    line_group_id: groupId,
    name: `Group ${groupId?.slice(0, 8) || 'Unknown'}`
  }, { onConflict: 'line_group_id' });

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
async function handleGroupLeave(event: any, supabase: any) {
  const groupId = event.source.groupId;
  console.log(`Left group: ${groupId}`);
}
