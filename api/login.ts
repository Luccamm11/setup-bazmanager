import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

const TECHNICIAN_USERNAMES = ['Jonas', 'Ramon'];
const MEMBERS_REGISTRY_KEY = 'levelup_members_registry';

// Fallback list in case registry is not yet seeded
const FALLBACK_MEMBERS = [
  'Lucca', 'Clarice', 'Ana Clara', 'Bernardo',
  'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende',
  'Sara Galdino',
];

async function getActiveMemberUsernames(): Promise<string[]> {
  try {
    const raw = await redis.get(MEMBERS_REGISTRY_KEY);
    if (!raw) return FALLBACK_MEMBERS;
    const members: { username: string; active: boolean }[] = JSON.parse(raw);
    return members.filter(m => m.active).map(m => m.username);
  } catch {
    return FALLBACK_MEMBERS;
  }
}

async function getAwardFocusFromRegistry(username: string): Promise<string | null> {
  try {
    const raw = await redis.get(MEMBERS_REGISTRY_KEY);
    if (!raw) return null;
    const members: { username: string; awardFocus: string | null }[] = JSON.parse(raw);
    const member = members.find(m => m.username === username);
    return member?.awardFocus || null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  const isTechnician = TECHNICIAN_USERNAMES.includes(username);
  const activeMembers = await getActiveMemberUsernames();
  const allValid = [...TECHNICIAN_USERNAMES, ...activeMembers];

  if (!allValid.includes(username)) {
    return res.status(401).json({ success: false, message: 'Usuário inválido ou inativo.' });
  }

  if (password === '021083') {
    const role = isTechnician ? 'technician' : 'member';
    const awardFocus = isTechnician ? null : await getAwardFocusFromRegistry(username);
    return res.status(200).json({ success: true, username, role, awardFocus });
  }

  return res.status(401).json({ success: false, message: 'Senha incorreta.' });
}
