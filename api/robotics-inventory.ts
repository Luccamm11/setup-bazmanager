import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';
import { defaultInventory } from '../data/robotics_inventory.js';

const INVENTORY_KEY = 'levelup_robotics_inventory';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const raw = await redis.get(INVENTORY_KEY);
      let items = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
      
      if (!items || items.length === 0) {
        // Fallback to initial JS file if Redis is empty
        items = defaultInventory;
        await redis.set(INVENTORY_KEY, JSON.stringify(items));
      }
      return res.status(200).json({ success: true, items });
    }

    if (req.method === 'POST') {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ success: false, error: 'Invalid items format' });
      }

      await redis.set(INVENTORY_KEY, JSON.stringify(items));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Inventory API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
