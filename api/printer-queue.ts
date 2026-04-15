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
    const { 
      filename, 
      userName, 
      materialType, 
      materialQuantity, 
      color, 
      brand, 
      estimatedTime 
    } = req.body;

    if (!filename || !userName) {
      return res.status(400).json({ error: 'Filename and userName are required.' });
    }

    try {
      const rawData = await redis.get(REDIS_KEY);
      const queue = rawData ? JSON.parse(rawData) : [];

      // Check if there are any active (non-completed) items
      const hasActiveItems = queue.some((item: any) => item.status !== 'completed');

      const newItem = {
        id: `print-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        filename,
        userName,
        status: !hasActiveItems ? 'printing' : 'pending',
        createdAt: new Date().toISOString(),
        materialType,
        materialQuantity: Number(materialQuantity),
        color,
        brand,
        estimatedTime,
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
    const { action, itemId, quality, hasProblem, problemDescription } = req.body;

    try {
      const rawData = await redis.get(REDIS_KEY);
      let queue = rawData ? JSON.parse(rawData) : [];

      if (action === 'complete') {
          // Find the item and mark it as completed with feedback
          queue = queue.map((item: any) => {
              if (item.id === itemId) {
                  return {
                      ...item,
                      status: 'completed',
                      quality: Number(quality),
                      hasProblem: !!hasProblem,
                      problemDescription: problemDescription || '',
                      completedAt: new Date().toISOString()
                  };
              }
              return item;
          });
          
          // Set the next 'pending' one to 'printing'
          const nextPendingIndex = queue.findIndex((item: any) => item.status === 'pending');
          if (nextPendingIndex !== -1) {
              queue[nextPendingIndex].status = 'printing';
          }
      } else if (action === 'delete') {
          queue = queue.filter((item: any) => item.id !== itemId);
          
          // If we deleted the printing one, start the next pending
          const stillHasPrinting = queue.some((item: any) => item.status === 'printing');
          if (!stillHasPrinting) {
              const nextPendingIndex = queue.findIndex((item: any) => item.status === 'pending');
              if (nextPendingIndex !== -1) {
                  queue[nextPendingIndex].status = 'printing';
              }
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
