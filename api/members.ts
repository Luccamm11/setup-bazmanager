import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

// Registry key for the members list in Supabase/Redis
const MEMBERS_REGISTRY_KEY = 'levelup_members_registry';
const LEGACY_KEY = 'levelup_team_legacy';

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

const emptyMember = (username: string) => ({
  username,
  name: username,
  fullName: '',
  grade: '',
  entryDate: '',
  birthDate: '',
  seasons: [],
  bio: '',
  awardFocus: '',
  avatar: '',
  level: 1,
  rank: 'e_rank',
  xpTotal: 0,
  questsCompleted: 0,
  bossQuestsCompleted: 0,
  stats: {},
  initialStats: null,
  initialLevelsSet: false,
  streak: 0,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action, type } = req.query as { action?: string; type?: string };
  const targetAction = action || type;

  // ─── Sub-Rota: LEGACY MEMBERS ──────────────────────────────────────────────
  if (targetAction === 'legacy') {
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
      if (!username || !TECHNICIANS.includes(username)) {
        return res.status(403).json({ error: 'Apenas técnicos podem adicionar ou editar legado.' });
      }

      try {
        const current = await redis.get(LEGACY_KEY);
        let legacy = current ? JSON.parse(current) : [];

        if (member.id) {
          legacy = legacy.map((m: any) => m.id === member.id ? { ...m, ...member } : m);
          await redis.set(LEGACY_KEY, JSON.stringify(legacy));
          return res.status(200).json({ success: true, member });
        } else {
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

  // ─── Sub-Rota: TEAM PROGRESS ───────────────────────────────────────────────
  if (targetAction === 'progress') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username } = req.query;
    if (!username || typeof username !== 'string' || !TECHNICIANS.includes(username)) {
      return res.status(403).json({ error: 'Apenas técnicos podem ver o progresso da equipe.' });
    }

    try {
      const members = await getRegistry();
      const activeMembers = members.filter((m: any) => m.active).map((m: any) => m.username);
      const membersProgress = [];

      for (const member of activeMembers) {
        const rawData = await redis.get(`levelup_user_${member}`);
        if (rawData) {
          const userData = JSON.parse(rawData);
          const user = userData.user;
          if (user) {
            membersProgress.push({
              username: member,
              name: user.name || member,
              fullName: user.fullName || '',
              grade: user.grade || '',
              entryDate: user.entryDate || '',
              birthDate: user.birthDate || '',
              seasons: user.seasons || [],
              bio: user.bio || '',
              awardFocus: user.awardFocus || '',
              avatar: user.avatar || '',
              level: user.level_overall || 1,
              rank: user.rank || 'e_rank',
              xpTotal: user.xp_total || 0,
              questsCompleted: user.questsCompleted || 0,
              bossQuestsCompleted: user.bossQuestsCompleted || 0,
              stats: user.stats || {},
              initialStats: user.initialStats || (user.initialLevelsSet ? user.stats : null),
              initialLevelsSet: user.initialLevelsSet || false,
              streak: user.streaks?.daily_streak || 0,
            });
          } else {
            membersProgress.push(emptyMember(member));
          }
        } else {
          membersProgress.push(emptyMember(member));
        }
      }

      return res.status(200).json({ success: true, members: membersProgress });
    } catch (error: any) {
      console.error('Error fetching team progress:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // ─── Sub-Rota: RESET XP ────────────────────────────────────────────────────
  if (targetAction === 'reset-xp') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { requester, targetMember } = req.body;

    if (!requester || !TECHNICIANS.includes(requester)) {
      return res.status(403).json({ error: 'Apenas técnicos podem resetar o XP de membros.' });
    }
    if (!targetMember || typeof targetMember !== 'string') {
      return res.status(400).json({ error: 'targetMember é obrigatório.' });
    }

    try {
      const userKey = `levelup_user_${targetMember}`;
      const rawData = await redis.get(userKey);
      if (!rawData) {
        return res.status(404).json({ error: `Dados do membro "${targetMember}" não encontrados.` });
      }

      const saveData = JSON.parse(rawData);
      const user = saveData.user;
      if (!user) {
        return res.status(404).json({ error: 'Estrutura de dados inválida para este membro.' });
      }

      // Reset only XP-related fields — wallet, badges, quests etc. remain intact
      const resetStats: Record<string, number> = {};
      if (user.stats) {
        for (const realm of Object.keys(user.stats)) {
          resetStats[realm] = 0;
        }
      }

      saveData.user = {
        ...user,
        xp_total: 0,
        level_overall: 1,
        xpToNextLevel: 100,
        rank: 'e_rank',
        stats: resetStats,
      };

      await redis.set(userKey, JSON.stringify(saveData));

      return res.status(200).json({
        success: true,
        message: `XP de "${targetMember}" resetado com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro ao resetar XP:', error.message);
      return res.status(500).json({ error: 'Erro interno ao resetar XP.' });
    }
  }

  // ─── Rota Principal: MEMBERS REGISTRY ──────────────────────────────────────
  // GET — list all members (active + inactive based on query)
  if (req.method === 'GET') {
    const { requester, includeInactive } = req.query;

    if (!requester || typeof requester !== 'string') {
      return res.status(400).json({ error: 'requester é obrigatório.' });
    }

    try {
      const members = await getRegistry();
      const isActiveMember = members.some((m: any) => m.username === requester && m.active);
      const isTech = TECHNICIANS.includes(requester);

      if (!isTech && !isActiveMember) {
        return res.status(403).json({ error: 'Apenas membros ou técnicos ativos podem acessar a lista.' });
      }

      const showInactive = includeInactive === 'true' && isTech;
      const list = showInactive ? members : members.filter((m: any) => m.active);

      // Dynamically add technicians to the list so they are treated as valid members in dropdowns/chats
      const techniciansList = TECHNICIANS.map(t => ({
        username: t,
        displayName: t,
        fullName: t === 'Jonas' ? 'Jonas Lemos' : 'Ramon Montorri',
        role: 'technician',
        awardFocus: null,
        active: true
      }));

      const mergedList = [...techniciansList, ...list];
      return res.status(200).json({ success: true, members: mergedList });
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
