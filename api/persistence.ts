import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  if (method === 'GET') {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    try {
      const rawData = await redis.get(`levelup_user_${username}`);
      const userData = rawData ? JSON.parse(rawData) : null;
      return res.status(200).json({ success: true, data: userData });
    } catch (error) {
      console.error('Error fetching data from Redis:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (method === 'POST') {
    const { username, data } = req.body;

    if (!username || !data) {
      return res.status(400).json({ error: 'Username and data are required' });
    }

    try {
      const key = `levelup_user_${username}`;
      const serializedData = JSON.stringify(data);
      await redis.set(key, serializedData);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error(`FAILURE: Error saving data for ${username}:`, error.message || error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
