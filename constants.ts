import React from 'react';
// FIX: Replaced BossChallenge with MajorGoal for consistency.
import { User, Skill, Realm, Quest, Difficulty, QuestStatus, StoryLogEntry, Integration, Arc, KnowledgeTopic, TopicDifficulty, SystemMessage, StoreItem, Badge, WeeklyProgress, ActivityData, MajorGoal, JournalEntry } from './types';
import { Award, Star, Crown, Swords, Target, BrainCircuit, Heart, Zap, Sparkles, Coins, ShieldCheck, TrendingUp, ClipboardList, BookMarked, Shield, RefreshCw, ChevronsUp, Gift, Code, FlaskConical, Milestone, BookOpen, Repeat, BookText, Timer } from 'lucide-react';

export const ICON_MAP: { [key: string]: React.ElementType } = {
    Award, Star, Crown, Swords, Target, BrainCircuit, Heart, Zap, Sparkles, Coins, ShieldCheck,
    TrendingUp, ClipboardList, BookMarked, Shield, RefreshCw, ChevronsUp, Gift, Code, FlaskConical, Milestone, BookOpen, Repeat, BookText, Timer
};

export const TOPIC_XP_MAP: { [key in TopicDifficulty]: number } = {
    [TopicDifficulty.Easy]: 25,
    [TopicDifficulty.Medium]: 50,
    [TopicDifficulty.Hard]: 100,
    [TopicDifficulty.SuperHard]: 200,
};

const skillXpThresholdCache = new Map<string, number>();
export const getXpThresholdForSkillLevel = (level: number, xpScale: number = 1.0): number => {
    const cacheKey = `${level}-${xpScale}`;
    if (skillXpThresholdCache.has(cacheKey)) {
        return skillXpThresholdCache.get(cacheKey)!;
    }
    if (level < 1) return Math.floor(100 * xpScale);
    if (level === 1) return Math.floor(100 * xpScale); // Base XP for level 1 -> 2
    
    const threshold = Math.floor(getXpThresholdForSkillLevel(level - 1, xpScale) * 1.2);
    skillXpThresholdCache.set(cacheKey, threshold);
    return threshold;
};

export const getTotalXpForSkill = (skill: Skill): number => {
    let total = 0;
    for (let i = 1; i < skill.level; i++) {
        total += getXpThresholdForSkillLevel(i, skill.xpScale);
    }
    total += skill.xp;
    return total;
};

export const SKILL_DEFINITIONS: Omit<Skill, 'level' | 'xp' | 'xpToNextLevel'>[] = [
  { id: 'focus_mastery', name: 'Focus Mastery', realm: Realm.Mind, priority: 5, isActive: true, xpScale: 1.0 },
  { id: 'physical_conditioning', name: 'Physical Conditioning', realm: Realm.Body, priority: 3, isActive: true, xpScale: 1.0 },
  { id: 'creative_output', name: 'Creative Output', realm: Realm.Creation, priority: 3, isActive: true, xpScale: 1.0 },
];

const initialSkillTree: { [skill_id: string]: Skill } = {};
SKILL_DEFINITIONS.forEach(skillDef => {
  initialSkillTree[skillDef.id] = {
    ...skillDef,
    level: 1,
    xp: 0,
    xpToNextLevel: getXpThresholdForSkillLevel(1, skillDef.xpScale),
  };
});

const INITIAL_KNOWLEDGE_BASE: { [topic_id: string]: KnowledgeTopic } = {
    'fm_1': { id: 'fm_1', name: 'Deep Work Session', skillId: 'focus_mastery', difficulty: TopicDifficulty.Easy },
    'pc_1': { id: 'pc_1', name: 'Daily Exercise', skillId: 'physical_conditioning', difficulty: TopicDifficulty.Easy },
    'co_1': { id: 'co_1', name: 'Project Milestone', skillId: 'creative_output', difficulty: TopicDifficulty.Easy },
};

export const RANKS = [
    { level: 1,  key: "e_rank", title: "E-Rank Apprentice" },
    { level: 6,  key: "d_rank", title: "D-Rank Disciplined Learner" },
    { level: 11, key: "c_rank", title: "C-Rank Focused Engineer" },
    { level: 21, key: "b_rank", title: "B-Rank Builder of Systems" },
    { level: 31, key: "a_rank", title: "A-Rank Awakened Creator" },
    { level: 41, key: "s_rank", title: "S-Rank Polymath" },
];

export const EXAM_ARC: Arc = {
    id: 'exam_arc_sem1',
    title: 'Final Siege — Signals Gate',
    description: 'The final semester exams are imminent. All systems must prioritize academic conquest.',
    type: 'Exam',
    effects: ['Study XP x1.5', 'Non-essential quests reduced', 'Legendary Lootbox upon completion']
};

export const FITNESS_ARC: Arc = {
    id: 'fitness_arc_sprint1',
    title: 'Project Phoenix Body',
    description: 'A focused sprint to rebuild physical foundations. Body realm quests are prioritized and enhanced.',
    type: 'Fitness',
    effects: ['Body XP x1.5', 'Stamina drain reduced', 'Increased chance for rare Body-related items']
};

export const ALL_ARCS: Arc[] = [EXAM_ARC, FITNESS_ARC];


export const INITIAL_USER: User = {
  name: "Awakened",
  rank: RANKS[0].key,
  level_overall: 1,
  xp_total: 0,
  xpToNextLevel: 130,
  stats: {
    [Realm.Mind]: 10,
    [Realm.Body]: 10,
    [Realm.Creation]: 10,
    [Realm.Spirit]: 10,
    [Realm.Creativity]: 5,
    [Realm.Finance]: 5,
    [Realm.Social]: 5,
    [Realm.Meta]: 1,
  },
  wallet: {
    credits: 100,
    gems: 5,
  },
  skill_tree: initialSkillTree,
  knowledgeBase: INITIAL_KNOWLEDGE_BASE,
  streaks: {
    daily_streak: 0,
    lastQuestCompletionDate: null,
  },
  activeArc: EXAM_ARC,
  inventory: [],
  activeBuffs: [],
  questsCompleted: 0,
  bossQuestsCompleted: 0,
  unlockedBadges: [],
  staked_credits: 0,
  stakedBuffs: {},
  lastWeeklyBossDate: null,
  completedMajorGoals: [],
  activeTimedQuest: null,
  state: {
    coreMission: 'To achieve balance and mastery across the core realms of existence.',
    longTermGoals: 'Attain peak performance in Mind, Body, and Creation.',
    shortTermGoals: 'Establish a consistent daily routine and complete initial quests.',
    emergencyGoals: 'Maintain basic routines during high-stress periods.',
    sideQuests: 'Explore new interests and develop auxiliary skills.'
  }
};

const getFutureDateString = (days: number, hours?: number) => {
    const date = new Date();
    if(hours) {
        date.setHours(date.getHours() + hours);
    } else {
        date.setDate(date.getDate() + days);
        date.setHours(9, 0, 0, 0);
    }
    return date.toISOString();
}

// FIX: Renamed from INITIAL_BOSS_CHALLENGES and updated type and properties for consistency.
export const INITIAL_MAJOR_GOALS: MajorGoal[] = [
    {
        id: 'goal-1',
        title: "Foundation Blueprint",
        description: "Establish your core objectives and initialize the system.",
        type: 'Forge',
        deadline: getFutureDateString(7),
        xp_reward: 500,
        credit_reward: 100,
        skillId: 'creative_output',
        syllabus: 'Define vision, set milestones, allocate resources, and begin execution.',
        penalty: { type: 'xp', amount: 100 },
    },
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q1',
    title: "System Initialization",
    description: "Review current goals and organize your workspace.",
    realm: Realm.Mind,
    knowledgeTopics: ["fm_1"],
    xp_reward: 50,
    credit_reward: 10,
    difficulty: Difficulty.Easy,
    duration_est_min: 30,
    status: QuestStatus.Pending,
    deadline: getFutureDateString(0, 24),
    penalty: { type: 'xp', amount: 5 },
  },
];

export const INITIAL_STORY_LOG: StoryLogEntry[] = [
  {
    id: 'log1',
    date: "Week 1",
    title: "The Awakening",
    narrative: "The System activated. Initial diagnostics are complete. A new User entity has been identified. Primary objective: Level Up. The path to multidisciplinary innovation begins now."
  }
];

export const INITIAL_INTEGRATIONS: Integration[] = [
    {
        id: 'google_calendar',
        name: 'Google Calendar',
        connected: false,
        description: 'Sync your calendar to generate quests based on your schedule.'
    },
    {
        id: 'github',
        name: 'GitHub',
        connected: false,
        description: 'Track coding activity and generate quests for your repositories.'
    }
];

export const INITIAL_SYSTEM_MESSAGES: SystemMessage[] = [
    { id: 'sys1', text: 'System Initialized. Welcome, Awakened.', timestamp: 'Just now', type: 'system' }
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [];

export const STORE_ITEMS: StoreItem[] = [
    {
        id: 'coffee_reward',
        name: "Coffee Reward",
        description: "Permission to buy a fancy coffee from your favorite cafe.",
        cost: 100,
        category: 'Reward',
        effect: { type: 'REAL_WORLD_REWARD' }
    },
    {
        id: 'focus_surge',
        name: "Focus Surge",
        description: "Doubles XP gain from all Mind quests for 24 hours.",
        cost: 250,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [Realm.Mind] }
    },
     {
        id: 'body_surge',
        name: "Body Surge",
        description: "Doubles XP gain from all Body quests for 24 hours.",
        cost: 250,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [Realm.Body] }
    },
    {
        id: 'creative_catalyst',
        name: "Creative Catalyst",
        description: "Doubles XP gain from all Creation quests for 24 hours.",
        cost: 250,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [Realm.Creation] }
    },
    {
        id: 'spirit_surge',
        name: "Spirit Surge",
        description: "Doubles XP gain from all Spirit quests for 24 hours.",
        cost: 250,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [Realm.Spirit] }
    },
    {
        id: 'trinity_core_surge',
        name: "Trinity Core Surge",
        description: "A discounted bundle that doubles XP gain from Mind, Body, and Creation quests for 24 hours.",
        cost: 600,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [Realm.Mind, Realm.Body, Realm.Creation] }
    },
    {
        id: 'omni_boost',
        name: "Omni-Boost",
        description: "Doubles XP gain from ALL quests, regardless of realm, for 24 hours.",
        cost: 800,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [] }
    },
    {
        id: 'streak_shield',
        name: "Streak Shield",
        description: "Automatically protects your daily streak for one missed day.",
        cost: 500,
        category: 'Utility',
        effect: { type: 'STREAK_SAVER' }
    },
    {
        id: 'quest_reroll',
        name: "Quest Re-roll",
        description: "Instantly receive a new set of daily quests from the System.",
        cost: 150,
        category: 'Utility',
        effect: { type: 'QUEST_REROLL' }
    },
    {
        id: 'instant_streak',
        name: "Instant 3-Day Streak",
        description: "Instantly sets your daily streak to 3 days, activating the streak bonus.",
        cost: 300,
        category: 'Utility',
        effect: { type: 'INSTANT_STREAK' }
    }
];

export const BADGE_DEFINITIONS: Badge[] = [
    { id: 'level_10', name: 'Level 10', description: 'Reached overall level 10.', icon: 'Crown' },
    { id: 'level_25', name: 'Level 25', description: 'Reached overall level 25.', icon: 'Crown' },
    { id: 'first_quest', name: 'First Step', description: 'Completed your first quest.', icon: 'Star' },
    { id: 'ten_quests', name: 'Quest Novice', description: 'Completed 10 quests.', icon: 'Star' },
    { id: 'fifty_quests', name: 'Quest Adept', description: 'Completed 50 quests.', icon: 'Star' },
    { id: 'first_boss', name: 'Boss Slayer', description: 'Completed a Boss Quest.', icon: 'Swords' },
    { id: 'mind_adept', name: 'Mind Adept', description: 'Reached level 5 in a Mind skill.', icon: 'BrainCircuit' },
    { id: 'body_adept', name: 'Body Adept', description: 'Reached level 5 in a Body skill.', icon: 'Heart' },
    { id: 'creation_adept', name: 'Creation Adept', description: 'Reached level 5 in a Creation skill.', icon: 'Zap' },
    { id: 'spirit_adept', name: 'Spirit Adept', description: 'Reached level 5 in a Spirit skill.', icon: 'Sparkles' },
];

export const INITIAL_WEEKLY_PROGRESS: WeeklyProgress[] = [
    { day: 'Mon', xp: 50 },
    { day: 'Tue', xp: 120 },
    { day: 'Wed', xp: 75 },
    { day: 'Thu', xp: 200 },
    { day: 'Fri', xp: 150 },
    { day: 'Sat', xp: 300 },
    { day: 'Sun', xp: 25 },
];

export const INITIAL_ACTIVITY_DATA: ActivityData[] = [];