import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@vercel/kv';

// Initialize Redis client
const kv = createClient({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const FINANCE_KEY = 'levelup_finance_records';

  try {
    if (req.method === 'GET') {
      const records = await kv.get(FINANCE_KEY);
      return res.status(200).json({ success: true, records: records || [] });
    } 
    
    if (req.method === 'POST') {
      const { records } = req.body;
      
      if (!records || !Array.isArray(records)) {
        return res.status(400).json({ success: false, error: 'Invalid records format' });
      }

      await kv.set(FINANCE_KEY, records);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Finance API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
