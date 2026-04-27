// data/initialData.ts — Factory para criar dados iniciais de um membro novo
import { MemberProfile, AwardType } from './members';
import { getAwardProfile, DefaultSkillDef, DefaultTopicDef, DefaultGoalDef, DefaultQuestDef } from './awardProfiles';

// Re-use types from the main types file at runtime
// These match the shapes in types.ts
interface SkillInit {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  realm: string;
  priority: number;
  isActive: boolean;
  xpScale: number;
}

interface TopicInit {
  id: string;
  name: string;
  difficulty: string;
  skillId: string;
}

interface GoalInit {
  id: string;
  title: string;
  description: string;
  type: string;
  deadline: string;
  xp_reward: number;
  credit_reward: number;
}

interface QuestInit {
  id: string;
  title: string;
  description: string;
  realm: string;
  knowledgeTopics: string[];
  xp_reward: number;
  credit_reward: number;
  difficulty: string;
  duration_est_min: number;
  status: string;
  source: string;
}

import { Realm, Skill } from '../types';
import { SKILL_REALMS, getXpThresholdForSkillLevel } from '../constants';

const generateId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

function buildSkillTree(defs: DefaultSkillDef[]): { skillTree: Record<string, SkillInit>; skillNameToId: Record<string, string> } {
  const skillTree: Record<string, SkillInit> = {};
  const skillNameToId: Record<string, string> = {};

  // 1. Initialize ALL 15 realms in the skill tree as base skills
  SKILL_REALMS.forEach(realm => {
    // Skill ID is the Realm enum string itself (e.g. "Programming")
    const id = realm as string;
    skillTree[id] = {
      id,
      name: id, // Will be localized in UI via t(`common:realm.${id}`) or similar
      level: 1,
      xp: 0,
      xpToNextLevel: getXpThresholdForSkillLevel(1, 1.0),
      realm: realm,
      priority: 3, // Default priority
      isActive: true,
      xpScale: 1.0,
    };
  });

  // 2. Overwrite defaults with award profile specifics
  defs.forEach(def => {
    const realmKey = def.realm as string;
    if (skillTree[realmKey]) {
      // If multiple skills map to the same realm, we take the highest priority/xpScale
      skillTree[realmKey].priority = Math.max(skillTree[realmKey].priority, def.priority);
      skillTree[realmKey].xpScale = Math.max(skillTree[realmKey].xpScale, def.xpScale);
      
      // Map the original skill name to this realm ID for topic linking
      skillNameToId[def.name] = realmKey;
    }
  });

  return { skillTree, skillNameToId };
}

function buildKnowledgeBase(defs: DefaultTopicDef[], skillNameToId: Record<string, string>): Record<string, TopicInit> {
  const kb: Record<string, TopicInit> = {};

  defs.forEach(def => {
    // Check if the topic's skillName maps to a Realm ID
    const skillId = skillNameToId[def.skillName] || def.skillName; 
    
    const id = generateId('topic');
    kb[id] = {
      id,
      name: def.name,
      difficulty: def.difficulty,
      skillId,
    };
  });

  return kb;
}

function buildMajorGoals(defs: DefaultGoalDef[]): GoalInit[] {
  return defs.map(def => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + def.deadlineDaysFromNow);
    deadline.setHours(23, 59, 59, 0);

    return {
      id: generateId('goal'),
      title: def.title,
      description: def.description,
      type: def.type,
      deadline: deadline.toISOString(),
      xp_reward: def.xp_reward,
      credit_reward: def.credit_reward,
    };
  });
}

function buildQuests(defs: DefaultQuestDef[]): QuestInit[] {
  return defs.map(def => ({
    id: generateId('quest'),
    title: def.title,
    description: def.description,
    realm: def.realm,
    knowledgeTopics: [],
    xp_reward: def.xp_reward,
    credit_reward: def.credit_reward,
    difficulty: def.difficulty,
    duration_est_min: def.duration_est_min,
    status: 'pending',
    source: 'ai_system',
  }));
}

export interface InitialUserData {
  user: {
    name: string;
    rank: string;
    level_overall: number;
    xp_total: number;
    xpToNextLevel: number;
    stats: Record<string, number>;
    wallet: { credits: number; gems: number };
    skill_tree: Record<string, SkillInit>;
    knowledgeBase: Record<string, TopicInit>;
    streaks: { daily_streak: number; lastQuestCompletionDate: null };
    activeArc: null;
    inventory: never[];
    activeBuffs: never[];
    questsCompleted: number;
    bossQuestsCompleted: number;
    unlockedBadges: never[];
    staked_credits: number;
    stakedBuffs: Record<string, never>;
    lastWeeklyBossDate: null;
    completedMajorGoals: never[];
    activeTimedQuest: null;
    state: {
      coreMission: string;
      longTermGoals: string;
      shortTermGoals: string;
      emergencyGoals: string;
      sideQuests: string;
    };
  };
  quests: QuestInit[];
  majorGoals: GoalInit[];
  storyLog: Array<{ id: string; date: string; title: string; narrative: string }>;
  journalEntries: never[];
  weeklyProgress: Array<{ day: string; xp: number }>;
  activityLog: never[];
  systemMessages: never[];
  integrations: never[];
  chatHistory: never[];
}

/**
 * Builds a complete initial save state for a new member based on their award focus.
 */
export function getInitialUserData(member: MemberProfile): InitialUserData {
  const awardProfile = member.awardFocus ? getAwardProfile(member.awardFocus) : null;

  const { skillTree, skillNameToId } = awardProfile
    ? buildSkillTree(awardProfile.defaultSkills)
    : { skillTree: {}, skillNameToId: {} };

  const knowledgeBase = awardProfile
    ? buildKnowledgeBase(awardProfile.defaultTopics, skillNameToId)
    : {};

  const majorGoals = awardProfile
    ? buildMajorGoals(awardProfile.defaultGoals)
    : [];

  const quests = awardProfile
    ? buildQuests(awardProfile.defaultQuests)
    : [];

  const awardLabel = awardProfile
    ? awardProfile.namePtBR
    : 'Supervisão Geral';

  return {
    user: {
      name: member.displayName,
      rank: 'e_rank',
      level_overall: 1,
      xp_total: 0,
      xpToNextLevel: 130,
      stats: {
        [Realm.Programming]: 0,
        [Realm.Engineering]: 0,
        [Realm.TechnicalWriting]: 0,
        [Realm.Networking]: 0,
        [Realm.Planning]: 0,
        [Realm.Oratory]: 0,
        [Realm.Creativity]: 5,
        [Realm.FirstCulture]: 0,
        [Realm.Meta]: 1,
        [Realm.Mind]: 10,
        [Realm.Body]: 10,
        [Realm.Creation]: 10,
        [Realm.Spirit]: 10,
        [Realm.Finance]: 5,
        [Realm.Social]: 5,
      },
      wallet: { credits: 100, gems: 5 },
      skill_tree: skillTree,
      knowledgeBase,
      streaks: { daily_streak: 0, lastQuestCompletionDate: null },
      activeArc: null,
      inventory: [],
      activeBuffs: [],
      questsCompleted: 0,
      bossQuestsCompleted: 0,
      unlockedBadges: [],
      awardFocus: awardLabel,
      staked_credits: 0,
      stakedBuffs: {},
      lastWeeklyBossDate: null,
      completedMajorGoals: [],
      activeTimedQuest: null,
      state: {
        coreMission: member.coreMission,
        longTermGoals: member.seasonGoal,
        shortTermGoals: member.shortTermGoal,
        emergencyGoals: '',
        sideQuests: '',
      },
    },
    quests,
    majorGoals,
    storyLog: [
      {
        id: 'log_init',
        date: 'Semana 1',
        title: 'Início da Jornada',
        narrative: `${member.displayName} iniciou sua jornada na Bazinga! 73 com foco em ${awardLabel}. A temporada FTC começa agora — é hora de construir, aprender e evoluir.`,
      },
    ],
    journalEntries: [],
    weeklyProgress: [
      { day: 'Seg', xp: 0 },
      { day: 'Ter', xp: 0 },
      { day: 'Qua', xp: 0 },
      { day: 'Qui', xp: 0 },
      { day: 'Sex', xp: 0 },
      { day: 'Sáb', xp: 0 },
      { day: 'Dom', xp: 0 },
    ],
    activityLog: [],
    systemMessages: [],
    integrations: [],
    chatHistory: [],
  };
}
