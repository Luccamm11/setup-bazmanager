import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

const TECHNICIANS = ['Jonas', 'Gustavo'];
const ALL_MEMBERS = [
  'Jonas', 'Gustavo', 'Lucca', 'Clarice', 'Ana Clara', 'Bernardo', 
  'Ana Luisa', 'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username } = req.query;

  // Only technicians can view all members' progress
  if (!username || typeof username !== 'string' || !TECHNICIANS.includes(username)) {
    return res.status(403).json({ error: 'Apenas técnicos podem ver o progresso da equipe.' });
  }

  try {
    const membersProgress = [];

    for (const member of ALL_MEMBERS) {
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
            streak: user.streaks?.daily_streak || 0,
          });
        } else {
          membersProgress.push({
            username: member,
            name: member,
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
            streak: 0,
          });
        }
      } else {
        // Member has no save data yet
        membersProgress.push({
          username: member,
          name: member,
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
          streak: 0,
        });
      }
    }

    return res.status(200).json({ success: true, members: membersProgress });
  } catch (error: any) {
    console.error('Error fetching team progress:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
