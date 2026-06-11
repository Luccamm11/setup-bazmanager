import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

const REDIS_KEY = 'levelup_team_members_v2';
const TECHNICIANS = ['Jonas', 'Ramon'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  try {
    const rawData = await redis.get(REDIS_KEY);
    const members = rawData ? JSON.parse(rawData) : null;
    
    const activeMembers = members 
      ? members.filter((m: any) => m.active !== false)
      : [];

    const allValidUsernames = activeMembers.length > 0 
      ? activeMembers.map((m: any) => m.username)
      : ['Jonas', 'Ramon', 'Lucca', 'Clarice', 'Ana Clara', 'Bernardo', 'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende', 'Sara Galdino'];

    if (!allValidUsernames.includes(username)) {
      return res.status(401).json({ success: false, message: 'Usuário inválido.' });
    }

    if (password === '021083') {
      const isTech = TECHNICIANS.includes(username);
      const role = isTech ? 'technician' : 'member';
      
      const userObj = activeMembers.find((m: any) => m.username === username);
      const awardFocus = userObj ? userObj.awardFocus : null;

      return res.status(200).json({ success: true, username, role, awardFocus });
    }

    return res.status(401).json({ success: false, message: 'Senha incorreta.' });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
