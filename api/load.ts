import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const userData = await kv.get(`levelup_user_${username}`);
    return res.status(200).json({ success: true, data: userData });
  } catch (error) {
    console.error('Error fetching data from KV:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
