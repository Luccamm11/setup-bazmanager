import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, data } = req.body;

  if (!username || !data) {
    return res.status(400).json({ error: 'Username and data are required' });
  }

  try {
    // Save user data to KV, overriding whatever was there
    await kv.set(`levelup_user_${username}`, data);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving data to KV:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
