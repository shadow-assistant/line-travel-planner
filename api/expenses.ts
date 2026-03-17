import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 初始化 Supabase 客戶端
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 設定 CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { method, query, body } = request;
  const { groupId, action } = query;

  try {
    switch (method) {
      case 'GET':
        // 取得群組支出
        if (action === 'settlements') {
          // 取得分帳結算
          return await getSettlements(groupId as string, response);
        }
        if (!groupId) {
          return response.status(400).json({ error: 'Missing groupId' });
        }
        return await getExpenses(groupId as string, response);

      case 'POST':
        // 新增支出
        return await createExpense(body, response);

      case 'PUT':
        // 更新支出
        return await updateExpense(body, response);

      case 'DELETE':
        // 刪除支出
        return await deleteExpense(query.id as string, response);

      default:
        return response.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

// 取得群組所有支出
async function getExpenses(groupId: string, response: VercelResponse) {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      sharers:expense_sharers(*)
    `)
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(200).json(data);
}

// 取得分帳結算
async function getSettlements(groupId: string, response: VercelResponse) {
  const { data, error } = await supabase.rpc('calculate_settlements', {
    p_group_id: groupId
  });

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  // 取得用戶資訊
  const userIds = new Set<string>();
  data.forEach((item: any) => {
    userIds.add(item.from_user_id);
    userIds.add(item.to_user_id);
  });

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, picture_url')
    .in('id', Array.from(userIds));

  // 合併用戶資訊
  const result = data.map((item: any) => ({
    ...item,
    from_user: profiles?.find(p => p.id === item.from_user_id),
    to_user: profiles?.find(p => p.id === item.to_user_id)
  }));

  return response.status(200).json(result);
}

// 新增支出
async function createExpense(body: any, response: VercelResponse) {
  const { 
    group_id, 
    title, 
    amount, 
    currency, 
    category, 
    paid_by, 
    date, 
    notes,
    sharers  // Array of { user_id, share_amount }
  } = body;

  if (!group_id || !title || !amount || !paid_by) {
    return response.status(400).json({ error: 'Missing required fields' });
  }

  // 建立支出
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      group_id,
      title,
      amount,
      currency: currency || 'TWD',
      category,
      paid_by,
      date,
      notes
    })
    .select()
    .single();

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  // 建立分攤記錄
  if (sharers && sharers.length > 0) {
    const sharerRecords = sharers.map((s: any) => ({
      expense_id: expense.id,
      user_id: s.user_id,
      share_amount: s.share_amount
    }));

    const { error: sharerError } = await supabase
      .from('expense_sharers')
      .insert(sharerRecords);

    if (sharerError) {
      console.error('Sharer error:', sharerError);
    }
  }

  // 取得完整的支出記錄（含 sharers）
  const { data: fullExpense } = await supabase
    .from('expenses')
    .select('*, sharers:expense_sharers(*)')
    .eq('id', expense.id)
    .single();

  return response.status(201).json(fullExpense);
}

// 更新支出
async function updateExpense(body: any, response: VercelResponse) {
  const { id, title, amount, currency, category, date, notes } = body;

  if (!id) {
    return response.status(400).json({ error: 'Missing id' });
  }

  const { data, error } = await supabase
    .from('expenses')
    .update({
      title,
      amount,
      currency,
      category,
      date,
      notes
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(200).json(data);
}

// 刪除支出
async function deleteExpense(id: string, response: VercelResponse) {
  if (!id) {
    return response.status(400).json({ error: 'Missing id' });
  }

  // 先刪除分攤記錄
  await supabase
    .from('expense_sharers')
    .delete()
    .eq('expense_id', id);

  // 再刪除支出
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(200).json({ success: true });
}
