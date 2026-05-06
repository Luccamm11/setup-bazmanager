import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

const KEYS = {
  attendance: 'levelup_attendance_records',
  finance: 'levelup_finance_records',
  kanban: 'levelup_kanban_tasks',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type } = req.query as { type?: string };

  if (!type || !KEYS[type as keyof typeof KEYS]) {
    return res.status(400).json({ success: false, error: 'Invalid or missing type parameter' });
  }

  const REDIS_KEY = KEYS[type as keyof typeof KEYS];

  try {
    if (req.method === 'GET') {
      const rawData = await redis.get(REDIS_KEY);
      const data = rawData ? JSON.parse(rawData) : (type === 'kanban' ? [] : {});
      return res.status(200).json({ success: true, [type]: data });
    }

    if (req.method === 'POST') {
      const { records, tasks } = req.body;
      const data = type === 'kanban' ? tasks : records;

      if (!data) {
        return res.status(400).json({ success: false, error: 'No data provided' });
      }

      if (type === 'kanban' && !Array.isArray(data)) {
        return res.status(400).json({ success: false, error: 'Invalid tasks format' });
      }

      await redis.set(REDIS_KEY, JSON.stringify(data));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error(`${type} API Error:`, error.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
