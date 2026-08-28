import redis from './redis.js';
import type { ActivityEvaluation, AppNotification, Realm } from '../../types.js';

const TECHNICIANS = ['Jonas', 'Ramon'];
const NOTIF_PREFIX = 'levelup_notifications_';
const MAX_NOTIFICATIONS = 50;

const getXpThresholdForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

const getRankForLevel = (level: number): string => {
  if (level >= 41) return 's_rank';
  if (level >= 31) return 'a_rank';
  if (level >= 21) return 'b_rank';
  if (level >= 11) return 'c_rank';
  if (level >= 6) return 'd_rank';
  return 'e_rank';
};

const loadNotifications = async (username: string): Promise<AppNotification[]> => {
  const raw = await redis.get(`${NOTIF_PREFIX}${username}`);
  return raw ? JSON.parse(raw) : [];
};

const saveNotifications = async (username: string, notifications: AppNotification[]) => {
  await redis.set(`${NOTIF_PREFIX}${username}`, JSON.stringify(notifications));
};

export async function addNotificationToUser(
  recipient: string,
  notificationData: Omit<AppNotification, 'id' | 'read' | 'createdAt' | 'recipientUsername'>
) {
  try {
    const existing = await loadNotifications(recipient);
    const newNotif: AppNotification = {
      ...notificationData,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recipientUsername: recipient,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const merged = [newNotif, ...existing].slice(0, MAX_NOTIFICATIONS);
    await saveNotifications(recipient, merged);
  } catch (err: any) {
    console.error(`Error adding notification to ${recipient}:`, err.message);
  }
}

export async function notifyTechniciansOnActivityCreated(params: {
  activityTitle: string;
  activityType: 'autonomous_dev' | 'collective_evolution' | 'mentorship';
  author: string;
  activityId: string;
}) {
  const { activityTitle, activityType, author, activityId } = params;

  let typeLabel = 'Desenvolvimento Autônomo';
  if (activityType === 'collective_evolution') typeLabel = 'Evolução Coletiva';
  if (activityType === 'mentorship') typeLabel = 'Mentoria';

  for (const tech of TECHNICIANS) {
    await addNotificationToUser(tech, {
      type: 'evaluation_pending',
      title: 'Nova Atividade para Avaliar',
      message: `${author} registrou "${activityTitle}" (${typeLabel}). Clique em Avaliar para atribuir pontos e habilidades.`,
      relatedId: activityId,
    });
  }
}

export async function applyActivityEvaluation(params: {
  evaluation: ActivityEvaluation;
  activityTitle: string;
  activityType: 'autonomous_dev' | 'collective_evolution' | 'mentorship';
  previousEvaluation?: ActivityEvaluation;
}) {
  const { evaluation, activityTitle, previousEvaluation } = params;

  for (const [username, score] of Object.entries(evaluation.memberScores)) {
    try {
      const userKey = `levelup_user_${username}`;
      const raw = await redis.get(userKey);
      if (!raw) continue;

      const saveData = JSON.parse(raw);
      const user = saveData.user;
      if (!user) continue;

      // Calculate diff if previous evaluation existed for this user
      const prevMemberScore = previousEvaluation?.memberScores?.[username];
      const prevTotalXp = prevMemberScore ? prevMemberScore.totalXp : 0;
      const xpToAdd = score.totalXp - prevTotalXp;

      let newXpTotal = (user.xp_total || 0) + xpToAdd;
      let newLevel = user.level_overall || 1;
      let xpForNext = user.xpToNextLevel || getXpThresholdForLevel(newLevel);
      let newRank = user.rank || 'e_rank';

      while (newXpTotal >= xpForNext) {
        newXpTotal -= xpForNext;
        newLevel++;
        xpForNext = getXpThresholdForLevel(newLevel);
        newRank = getRankForLevel(newLevel);
      }

      // Update realm stats
      const updatedStats = { ...(user.stats || {}) };
      for (const [realm, pts] of Object.entries(score.realmScores)) {
        const prevPts = (prevMemberScore?.realmScores?.[realm as Realm] || 0);
        const ptsDiff = (pts || 0) - prevPts;
        updatedStats[realm] = Math.max(0, (updatedStats[realm] || 0) + ptsDiff);
      }

      saveData.user = {
        ...user,
        xp_total: Math.max(0, newXpTotal),
        level_overall: newLevel,
        rank: newRank,
        xpToNextLevel: xpForNext,
        stats: updatedStats,
      };

      await redis.set(userKey, JSON.stringify(saveData));

      // Notify the member
      await addNotificationToUser(username, {
        type: 'activity_evaluated',
        title: 'Atividade Avaliada!',
        message: `Sua atividade "${activityTitle}" foi avaliada por ${evaluation.evaluatedBy}. Você recebeu +${score.totalXp} XP!`,
        relatedId: evaluation.id,
      });
    } catch (memberErr: any) {
      console.error(`Error updating member ${username} with evaluation:`, memberErr.message);
    }
  }
}
