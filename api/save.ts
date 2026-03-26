import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, data } = req.body;

  if (!username || !data) {
    return res.status(400).json({ error: 'Username and data are required' });
  }

  try {
    await redis.set(`levelup_user_${username}`, JSON.stringify(data));
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving data to Redis:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
