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
  const { groupId } = query;

  try {
    switch (method) {
      case 'GET':
        // 取得群組行程
        if (!groupId) {
          return response.status(400).json({ error: 'Missing groupId' });
        }
        return await getItineraries(groupId as string, response);

      case 'POST':
        // 新增行程
        return await createItinerary(body, response);

      case 'PUT':
        // 更新行程
        return await updateItinerary(body, response);

      case 'DELETE':
        // 刪除行程
        return await deleteItinerary(query.id as string, response);

      default:
        return response.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

// 取得群組所有行程
async function getItineraries(groupId: string, response: VercelResponse) {
  const { data, error } = await supabase
    .from('itineraries')
    .select(`
      *,
      items:itinerary_items(*)
    `)
    .eq('group_id', groupId)
    .order('start_date', { ascending: true });

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(200).json(data || []);
}

// 新增行程
async function createItinerary(body: any, response: VercelResponse) {
  const { group_id, title, description, start_date, end_date, location, created_by } = body;

  if (!group_id || !title || !created_by) {
    return response.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('itineraries')
    .insert({
      group_id,
      title,
      description,
      start_date,
      end_date,
      location,
      created_by
    })
    .select()
    .single();

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(201).json(data);
}

// 更新行程
async function updateItinerary(body: any, response: VercelResponse) {
  const { id, title, description, start_date, end_date, location } = body;

  if (!id) {
    return response.status(400).json({ error: 'Missing id' });
  }

  const { data, error } = await supabase
    .from('itineraries')
    .update({
      title,
      description,
      start_date,
      end_date,
      location
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(200).json(data);
}

// 刪除行程
async function deleteItinerary(id: string, response: VercelResponse) {
  if (!id) {
    return response.status(400).json({ error: 'Missing id' });
  }

  const { error } = await supabase
    .from('itineraries')
    .delete()
    .eq('id', id);

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(200).json({ success: true });
}
