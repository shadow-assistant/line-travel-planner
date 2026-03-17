import { Client, WebhookRequest, TextMessage, TemplateMessage } from '@line/bot-sdk';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 初始化 LINE Client
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
});

// 初始化 Supabase
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
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 驗證 LINE Signature
    const signature = request.headers['x-line-signature'] as string;
    const bodyString = JSON.stringify(request.body);

    if (!lineClient.validateSignature(bodyBuffer(signature), bodyString)) {
      console.error('Invalid signature');
      return response.status(401).json({ error: 'Invalid signature' });
    }

    const events = request.body.events;
    
    for (const event of events) {
      await handleEvent(event);
    }

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

function bodyBuffer(signature: string): Buffer {
  // 在實際部署時，需要從原始請求 body 計算
  // 這裡是簡化版本，生產環境需要正確處理
  return Buffer.from(JSON.stringify(request.body || {}));
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

  // 取得用戶資訊
  const profile = await lineClient.getProfile(userId);

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

    // 自動加入成員
    await supabase.from('group_members').upsert({
      group_id: (await supabase.from('groups').select('id').eq('line_group_id', groupId).single()).data?.id,
      user_id: userId, // 注意：這裡需要先建立 auth user
      line_user_id: userId,
      display_name: profile.displayName,
      role: 'member'
    }, { onConflict: 'group_id,line_user_id' });
  }

  // 指令處理
  const command = text.trim().toLowerCase();

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
${process.env.LIFF_URL}`
    });
  } else if (command.startsWith('/新增行程 ')) {
    const title = text.slice(6).trim();
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: `📝 已收到行程：「${title}」\n請點擊下方連結填寫詳細資料：\n${process.env.LIFF_URL}?action=itinerary&groupId=${groupId}`
    });
  } else if (command === '/行程') {
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: `📋 請點擊連結查看行程：\n${process.env.LIFF_URL}?action=itinerary&groupId=${groupId}`
    });
  } else if (command === '/支出' || command === '/分帳') {
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: `💰 請點擊連結查看分帳：\n${process.env.LIFF_URL}?action=expenses&groupId=${groupId}`
    });
  }
}

// 處理加入群組
async function handleGroupJoin(event: any) {
  const groupId = event.source.groupId;
  const groupSummary = await lineClient.getGroupSummary(groupId);

  // 建立群組記錄
  await supabase.from('groups').upsert({
    line_group_id: groupId,
    name: groupSummary.groupName || `Group ${groupId.slice(0, 8)}`
  }, { onConflict: 'line_group_id' });

  // 發送歡迎訊息
  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: `🎉 旅遊小幫手上線！

我可以幫你：
• 📋 多人共編行程
• 💰 記帳分帳

輸入 /help 查看指令，或點擊連結使用網頁版：
${process.env.LIFF_URL}`
  });
}

// 處理離開群組
async function handleGroupLeave(event: any) {
  const groupId = event.source.groupId;
  
  // 可選：標記群組為停用
  // await supabase.from('groups').update({ active: false }).eq('line_group_id', groupId);
}
