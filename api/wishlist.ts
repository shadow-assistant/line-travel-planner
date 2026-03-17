import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
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
        if (!groupId) {
          return response.status(400).json({ error: 'Missing groupId' });
        }
        return await getWishlist(groupId as string, response);

      case 'POST':
        return await createWishlist(body, response);

      case 'DELETE':
        return await deleteWishlist(query.id as string, response);

      default:
        return response.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

async function getWishlist(groupId: string, response: VercelResponse) {
  const { data, error } = await supabase
    .from('wishlists')
    .select(`
      *,
      wishlist_votes(*)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  // 計算每個項目的投票數
  const result = (data || []).map((item: any) => ({
    ...item,
    votes: item.wishlist_votes?.filter((v: any) => v.vote_type === 'like').length || 0,
    must_go_count: item.wishlist_votes?.filter((v: any) => v.vote_type === 'must_go').length || 0,
  }));

  return response.status(200).json(result);
}

async function createWishlist(body: any, response: VercelResponse) {
  const { 
    group_id, title, description, location, latitude, longitude, 
    place_id, photo_url, rating, website, phone, category 
  } = body;

  if (!group_id || !title) {
    return response.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('wishlists')
    .insert({
      group_id,
      title,
      description,
      location,
      latitude,
      longitude,
      place_id,
      photo_url,
      rating,
      website,
      phone,
      category,
    })
    .select()
    .single();

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(201).json(data);
}

async function deleteWishlist(id: string, response: VercelResponse) {
  if (!id) {
    return response.status(400).json({ error: 'Missing id' });
  }

  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('id', id);

  if (error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(200).json({ success: true });
}
