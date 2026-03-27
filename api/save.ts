import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, data } = req.body;

  if (!username || !data) {
    return res.status(400).json({ error: 'Username and data are required' });
  }

  try {
    console.log(`Saving progress for: ${username}`);
    const key = `levelup_user_${username}`;
    const serializedData = JSON.stringify(data);
    
    await redis.set(key, serializedData);
    
    console.log(`Successfully saved data for ${username}. Length: ${serializedData.length}`);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error(`FAILURE: Error saving data for ${username}:`, error.message || error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

