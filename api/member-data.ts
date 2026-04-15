import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

const TECHNICIANS = ['Jonas', 'Gustavo'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { techUsername, targetUsername } = req.query;

  if (!techUsername || typeof techUsername !== 'string' || !TECHNICIANS.includes(techUsername)) {
    return res.status(403).json({ error: 'Acesso negado. Apenas técnicos podem inspecionar membros.' });
  }

  if (!targetUsername || typeof targetUsername !== 'string') {
    return res.status(400).json({ error: 'Membro alvo é obrigatório.' });
  }

  try {
    const rawData = await redis.get(`levelup_user_${targetUsername}`);
    if (!rawData) {
      return res.status(404).json({ error: 'Membro não encontrado ou ainda não inicializou o sistema.' });
    }

    const userData = JSON.parse(rawData);
    // Remove sensitive data if any (not needed here but good practice)
    
    return res.status(200).json({ success: true, data: userData });
  } catch (error: any) {
    console.error('Error fetching member data:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
