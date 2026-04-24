import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

const KANBAN_KEY = 'levelup_kanban_tasks';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const raw = await redis.get(KANBAN_KEY);
      const tasks = raw ? JSON.parse(raw) : [];
      return res.status(200).json({ success: true, tasks });
    }

    if (req.method === 'POST') {
      const { tasks } = req.body;

      if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ success: false, error: 'Invalid tasks format' });
      }

      await redis.set(KANBAN_KEY, JSON.stringify(tasks));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Kanban API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
