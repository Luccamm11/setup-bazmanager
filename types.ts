import React from 'react';

export enum Realm {
  Mind = "Mind",
  Body = "Body",
  Creation = "Creation",
  Spirit = "Spirit",
  Creativity = "Creativity",
  Finance = "Finance",
  Social = "Social",
  Meta = "Meta",
}

export enum Difficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
}

export enum QuestStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
}

export enum TopicDifficulty {
    Easy = "Easy",
    Medium = "Medium",
    Hard = "Hard",
    SuperHard = "SuperHard"
}

export interface KnowledgeTopic {
    id: string;
    name: string;
    difficulty: TopicDifficulty;
    skillId: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  realm: Realm;
  knowledgeTopics: string[];
  xp_reward: number;
  credit_reward: number;
  difficulty: Difficulty;
  duration_est_min: number;
  status: QuestStatus;
  deadline?: string;
  penalty?: {
      type: 'xp' | 'credits';
      amount: number;
  };
  isMystery?: boolean;
  chain?: {
    current: number;
    total: number;
  };
  isBossQuest?: boolean;
  isWeeklyBoss?: boolean;
  source?: 'google_calendar' | 'github' | 'user' | 'ai_chatbot' | 'ai_system';
}

export interface Skill {
  id:string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  realm: Realm;
  priority: number; // 1 to 5
  isActive: boolean;
  xpScale: number;
}

export interface Arc {
    id: string;
    title: string;
    description: string;
    type: 'Exam' | 'Fitness' | 'Cyber Dungeon';
    effects: string[];
    isGenerated?: boolean;
}

export interface StoreItem {
    id:string;
    name: string;
    description: string;
    cost: number;
    category: 'Buff' | 'Utility' | 'Reward';
    effect: {
        type: 'XP_BOOST' | 'STREAK_SAVER' | 'QUEST_REROLL' | 'INSTANT_STREAK' | 'REAL_WORLD_REWARD';
        value?: number; // e.g., 2 for 2x XP boost
        duration?: number; // duration in hours
        realms?: Realm[];
    };
    isGenerated?: boolean;
}

export interface ActiveBuff {
    itemId: string;
    itemName: string;
    expiryTimestamp: number;
    effect: StoreItem['effect'];
}

export interface InventoryItem {
    itemId: string;
    quantity: number;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Icon name as a string
    isGenerated?: boolean; // To distinguish system vs user-created badges
}

export interface UserState {
  coreMission: string;
  longTermGoals: string;
  shortTermGoals: string;
  emergencyGoals: string;
  sideQuests: string;
}

export interface User {
  name: string;
  rank: string;
  level_overall: number;
  xp_total: number;
  xpToNextLevel: number;
  stats: {
    [key in Realm]: number;
  };
  wallet: {
    credits: number;
    gems: number;
  };
  skill_tree: { [skill_id: string]: Skill };
  knowledgeBase: { [topic_id: string]: KnowledgeTopic };
  streaks: {
    daily_streak: number;
    lastQuestCompletionDate?: string | null;
  };
  activeArc: Arc | null;
  inventory: InventoryItem[];
  activeBuffs: ActiveBuff[];
  questsCompleted: number;
  bossQuestsCompleted: number;
  unlockedBadges: string[];
  staked_credits: number;
  stakedBuffs: { [itemId: string]: number };
  lastWeeklyBossDate?: string | null;
  state: UserState;
  completedMajorGoals?: MajorGoal[];
}

export interface StoryLogEntry {
  id: string;
  date: string;
  title: string;
  narrative: string;
}

export interface SystemMessage {
    id:string;
    text: string;
    timestamp: string;
    type: 'info' | 'warning' | 'system' | 'reward';
}

export interface Integration {
  id: string;
  name: string;
  connected: boolean;
  description: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: string;
}

export interface WeeklyProgress {
    day: string;
    xp: number;
}

export interface ActivityData {
    date: string; // YYYY-MM-DD format
    skillId: string;
    xp: number;
}

// FIX: Renamed BossChallenge to MajorGoal and battlePlan to syllabus for consistency.
export interface MajorGoal {
  id: string;
  title: string;
  description: string;
  type: 'Siege' | 'Forge' | 'Gauntlet'; // Exam, Project, Hackathon
  deadline: string; // ISO String
  xp_reward: number;
  credit_reward: number;
  syllabus?: string; // Formerly battlePlan
  skillId?: string;
  penalty?: {
      type: 'xp' | 'credits';
      amount: number;
  };
}

export interface RewardNotification {
    id: string;
    type: 'xp' | 'credits';
    originalAmount: number;
    finalAmount: number;
}

export interface AiSkillRecommendation {
    name: string;
    realm: Realm;
    reason: string;
}

export interface AiTopicRecommendation {
    name: string;
    skillId: string;
    reason: string;
}

export interface AiRecommendations {
    skills: AiSkillRecommendation[];
    topics: AiTopicRecommendation[];
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'syncing_cloud' | 'synced_cloud';