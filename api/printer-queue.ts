import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

const REDIS_KEY = 'levelup_printer_queue';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  if (method === 'GET') {
    try {
      const rawData = await redis.get(REDIS_KEY);
      const queue = rawData ? JSON.parse(rawData) : [];
      return res.status(200).json({ success: true, queue });
    } catch (error: any) {
      console.error('Error fetching printer queue:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (method === 'POST') {
    const { filename, userName } = req.body;

    if (!filename || !userName) {
      return res.status(400).json({ error: 'Filename and userName are required.' });
    }

    try {
      const rawData = await redis.get(REDIS_KEY);
      const queue = rawData ? JSON.parse(rawData) : [];

      const newItem = {
        id: `print-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        filename,
        userName,
        status: queue.length === 0 ? 'printing' : 'pending',
        createdAt: new Date().toISOString(),
      };

      queue.push(newItem);
      await redis.set(REDIS_KEY, JSON.stringify(queue));

      return res.status(201).json({ success: true, item: newItem });
    } catch (error: any) {
      console.error('Error adding to printer queue:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (method === 'PUT') {
    const { action, itemId } = req.body;

    try {
      const rawData = await redis.get(REDIS_KEY);
      let queue = rawData ? JSON.parse(rawData) : [];

      if (action === 'complete') {
          // Remove the completed item (it should be the one at the top)
          queue = queue.filter((item: any) => item.id !== itemId);
          
          // Set the next one to 'printing'
          if (queue.length > 0) {
              queue[0].status = 'printing';
          }
      }

      await redis.set(REDIS_KEY, JSON.stringify(queue));
      return res.status(200).json({ success: true, queue });
    } catch (error: any) {
      console.error('Error updating printer queue:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
