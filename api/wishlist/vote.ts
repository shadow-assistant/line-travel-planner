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
  response.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method === 'POST') {
    return await vote(request.body, response);
  }

  return response.status(405).json({ error: 'Method not allowed' });
}

async function vote(body: any, response: VercelResponse) {
  const { wishlist_id, user_id, vote_type } = body;

  if (!wishlist_id || !vote_type) {
    return response.status(400).json({ error: 'Missing required fields' });
  }

  // 檢查是否已經投票
  const { data: existingVote } = await supabase
    .from('wishlist_votes')
    .select('*')
    .eq('wishlist_id', wishlist_id)
    .eq('user_id', user_id || 'anonymous')
    .eq('vote_type', vote_type)
    .single();

  if (existingVote) {
    // 取消投票
    const { error } = await supabase
      .from('wishlist_votes')
      .delete()
      .eq('id', existingVote.id);

    if (error) {
      return response.status(500).json({ error: error.message });
    }

    return response.status(200).json({ success: true, action: 'removed' });
  } else {
    // 新增投票
    const { error } = await supabase
      .from('wishlist_votes')
      .insert({
        wishlist_id,
        user_id: user_id || 'anonymous',
        vote_type,
      });

    if (error) {
      return response.status(500).json({ error: error.message });
    }

    return response.status(201).json({ success: true, action: 'added' });
  }
}
