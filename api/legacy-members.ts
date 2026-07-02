import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const LEGACY_KEY = 'levelup_team_legacy';

  if (req.method === 'GET') {
    try {
      const data = await redis.get(LEGACY_KEY);
      return res.status(200).json({ success: true, legacy: data ? JSON.parse(data) : [] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { username, member } = req.body;
    // Check if technician (simplified check)
    if (!username || !['Jonas', 'Ramon'].includes(username)) {
      return res.status(403).json({ error: 'Apenas técnicos podem adicionar ou editar legado.' });
    }

    try {
      const current = await redis.get(LEGACY_KEY);
      let legacy = current ? JSON.parse(current) : [];
      
      if (member.id) {
        // Update existing legacy member
        legacy = legacy.map((m: any) => m.id === member.id ? { ...m, ...member } : m);
        await redis.set(LEGACY_KEY, JSON.stringify(legacy));
        return res.status(200).json({ success: true, member });
      } else {
        // Create new legacy member
        const newMember = {
          ...member,
          id: `legacy_${Date.now()}`,
          addedAt: new Date().toISOString()
        };
        
        legacy.push(newMember);
        await redis.set(LEGACY_KEY, JSON.stringify(legacy));
        
        return res.status(200).json({ success: true, member: newMember });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
