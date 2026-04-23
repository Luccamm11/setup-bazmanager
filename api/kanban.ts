import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/kv';
import { KanbanTask } from '../types';

const kv = createClient({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const KANBAN_KEY = 'levelup_kanban_tasks';

  try {
    if (req.method === 'GET') {
      const records = await kv.get<KanbanTask[]>(KANBAN_KEY);
      return res.status(200).json({ success: true, tasks: records || [] });
    } 
    
    if (req.method === 'POST') {
      const { tasks } = req.body;
      
      if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ success: false, error: 'Invalid tasks format' });
      }

      await kv.set(KANBAN_KEY, tasks);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Kanban API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
