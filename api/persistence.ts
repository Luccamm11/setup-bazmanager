import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

async function ensureSystemReset() {
  try {
    const resetDone = await redis.get('levelup_system_reset_done_v2');
    if (resetDone === 'true') {
      return;
    }

    console.log("Starting automatic database reset for all members...");
    const keys = await redis.keys("levelup_user_*");
    for (const key of keys) {
      const username = key.replace("levelup_user_", "");
      if (username === "Jonas" || username === "Ramon") {
        console.log(`Skipping technician: ${username}`);
        continue;
      }

      const rawData = await redis.get(key);
      if (rawData) {
        const data = JSON.parse(rawData);
        if (data.user) {
          data.user.initialLevelsSet = false;
          if (data.user.stats) {
            for (const realm in data.user.stats) {
              data.user.stats[realm] = 1;
            }
          }
          data.user.level_overall = 1;
          data.user.rank = "e_rank";
          await redis.set(key, JSON.stringify(data));
          console.log(`Automatically reset ${username} to pending.`);
        }
      }
    }
    await redis.set('levelup_system_reset_done_v2', 'true');
    console.log("Automatic database reset completed successfully!");
  } catch (error) {
    console.error("Failed to run automatic reset:", error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  await ensureSystemReset();

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
