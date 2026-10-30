import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';
import { authenticateRequest } from './_lib/auth.js';

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
    const auth = authenticateRequest(req);
    if (!auth.valid || !auth.user) {
      return res.status(401).json({ error: 'Unauthorized. Invalid or missing token.' });
    }

    const { username, data } = req.body;

    if (!username || !data) {
      return res.status(400).json({ error: 'Username and data are required' });
    }

    // Only allow updating own data, or if user is a technician
    if (auth.user.username !== username && auth.user.role !== 'technician') {
      return res.status(403).json({ error: 'Forbidden. You cannot overwrite another user data.' });
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
