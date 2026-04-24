import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

const FINANCE_KEY = 'levelup_finance_records';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const raw = await redis.get(FINANCE_KEY);
      const records = raw ? JSON.parse(raw) : [];
      return res.status(200).json({ success: true, records });
    }

    if (req.method === 'POST') {
      const { records } = req.body;

      if (!records || !Array.isArray(records)) {
        return res.status(400).json({ success: false, error: 'Invalid records format' });
      }

      await redis.set(FINANCE_KEY, JSON.stringify(records));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Finance API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
