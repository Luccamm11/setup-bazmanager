import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

const TECHNICIANS = ['Jonas', 'Ramon'];
const MEMBERS_REGISTRY_KEY = 'levelup_members_registry';

// Fallback list if registry not yet seeded
const FALLBACK_MEMBERS = [
  'Lucca', 'Clarice', 'Ana Clara', 'Bernardo',
  'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende', 'Sara Galdino'
];

async function getActiveMembers(): Promise<string[]> {
  try {
    const raw = await redis.get(MEMBERS_REGISTRY_KEY);
    if (!raw) return FALLBACK_MEMBERS;
    const members: { username: string; active: boolean }[] = JSON.parse(raw);
    return members.filter(m => m.active).map(m => m.username);
  } catch {
    return FALLBACK_MEMBERS;
  }
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string' || !TECHNICIANS.includes(username)) {
    return res.status(403).json({ error: 'Apenas técnicos podem ver o progresso da equipe.' });
  }

  try {
    const activeMembers = await getActiveMembers();
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
