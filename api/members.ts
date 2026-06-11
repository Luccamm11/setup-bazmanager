import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

// Registry key for the members list in Redis
const MEMBERS_REGISTRY_KEY = 'levelup_members_registry';

// Default members seeded on first call if registry is empty
const DEFAULT_MEMBERS = [
  { username: 'Lucca',        displayName: 'Lucca',        awardFocus: 'Sustentabilidade',   active: true },
  { username: 'Clarice',      displayName: 'Clarice',      awardFocus: 'PensamentoCriativo', active: true },
  { username: 'Ana Clara',    displayName: 'Ana Clara',    awardFocus: 'PensamentoCriativo', active: true },
  { username: 'Bernardo',     displayName: 'Bernardo',     awardFocus: 'Conexao',            active: true },
  { username: 'Enzo Soares',  displayName: 'Enzo Soares',  awardFocus: 'Controle',           active: true },
  { username: 'Pedro',        displayName: 'Pedro',        awardFocus: 'Controle',           active: true },
  { username: 'Yan',          displayName: 'Yan',          awardFocus: 'Inovacao',           active: true },
  { username: 'Guilherme',    displayName: 'Guilherme',    awardFocus: 'Design',             active: true },
  { username: 'Enzo Resende', displayName: 'Enzo Resende', awardFocus: 'Design',             active: true },
  { username: 'Sara Galdino', displayName: 'Sara',         awardFocus: 'Conexao',            active: true },
];

const TECHNICIANS = ['Jonas', 'Ramon'];

async function getRegistry() {
  const raw = await redis.get(MEMBERS_REGISTRY_KEY);
  if (raw) return JSON.parse(raw);
  // First time — seed from defaults and persist
  await redis.set(MEMBERS_REGISTRY_KEY, JSON.stringify(DEFAULT_MEMBERS));
  return DEFAULT_MEMBERS;
}

async function saveRegistry(members: typeof DEFAULT_MEMBERS) {
  await redis.set(MEMBERS_REGISTRY_KEY, JSON.stringify(members));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET — list all members (active + inactive based on query)
  if (req.method === 'GET') {
    const { requester, includeInactive } = req.query;

    if (!requester || typeof requester !== 'string' || !TECHNICIANS.includes(requester)) {
      return res.status(403).json({ error: 'Apenas técnicos podem gerenciar membros.' });
    }

    try {
      const members = await getRegistry();
      const list = includeInactive === 'true' ? members : members.filter((m: any) => m.active);
      return res.status(200).json({ success: true, members: list });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST — add new member
  if (req.method === 'POST') {
    const { requester, username, displayName, awardFocus } = req.body;

    if (!requester || !TECHNICIANS.includes(requester)) {
      return res.status(403).json({ error: 'Apenas técnicos podem adicionar membros.' });
    }
    if (!username || !displayName) {
      return res.status(400).json({ error: 'username e displayName são obrigatórios.' });
    }

    try {
      const members = await getRegistry();
      const existing = members.find((m: any) => m.username === username);

      if (existing) {
        // Reactivate if previously inactivated
        existing.active = true;
        existing.displayName = displayName;
        existing.awardFocus = awardFocus || null;
        await saveRegistry(members);
        return res.status(200).json({ success: true, action: 'reactivated' });
      }

      members.push({ username, displayName, awardFocus: awardFocus || null, active: true });
      await saveRegistry(members);
      return res.status(201).json({ success: true, action: 'created' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH — edit member (displayName, awardFocus, active status)
  if (req.method === 'PATCH') {
    const { requester, username, displayName, awardFocus, active } = req.body;

    if (!requester || !TECHNICIANS.includes(requester)) {
      return res.status(403).json({ error: 'Apenas técnicos podem editar membros.' });
    }
    if (!username) {
      return res.status(400).json({ error: 'username é obrigatório.' });
    }

    try {
      const members = await getRegistry();
      const member = members.find((m: any) => m.username === username);
      if (!member) return res.status(404).json({ error: 'Membro não encontrado.' });

      if (displayName !== undefined) member.displayName = displayName;
      if (awardFocus !== undefined) member.awardFocus = awardFocus;
      if (active !== undefined) member.active = active;

      await saveRegistry(members);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
