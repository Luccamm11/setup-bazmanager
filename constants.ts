import React from 'react';
import { User, Skill, Realm, Quest, Difficulty, QuestStatus, StoryLogEntry, Integration, Arc, KnowledgeTopic, TopicDifficulty, SystemMessage, StoreItem, Badge, WeeklyProgress, ActivityData, MajorGoal, JournalEntry } from './types';
import { Award, Star, Crown, Swords, Target, BrainCircuit, Heart, Zap, Sparkles, Coins, ShieldCheck, TrendingUp, ClipboardList, BookMarked, Shield, RefreshCw, ChevronsUp, Gift, Code, FlaskConical, Milestone, BookOpen, Repeat, BookText, Timer } from 'lucide-react';
import { TECHNICIAN_USERNAMES, ALL_USERNAMES } from './data/members';

// Re-export from centralized source
export const TECHNICIANS = TECHNICIAN_USERNAMES;
export const ALL_MEMBERS = ALL_USERNAMES;

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

export const SKILL_DEFINITIONS: Omit<Skill, 'level' | 'xp' | 'xpToNextLevel'>[] = [];

const initialSkillTree: { [skill_id: string]: Skill } = {};
SKILL_DEFINITIONS.forEach(skillDef => {
  initialSkillTree[skillDef.id] = {
    ...skillDef,
    level: 1,
    xp: 0,
    xpToNextLevel: getXpThresholdForSkillLevel(1, skillDef.xpScale),
  };
});

const INITIAL_KNOWLEDGE_BASE: { [topic_id: string]: KnowledgeTopic } = {};

export const RANKS = [
    { level: 1,  key: "e_rank", title: "Novato" },
    { level: 6,  key: "d_rank", title: "Aprendiz" },
    { level: 11, key: "c_rank", title: "Membro Dedicado" },
    { level: 21, key: "b_rank", title: "Construtor" },
    { level: 31, key: "a_rank", title: "Líder Técnico" },
    { level: 41, key: "s_rank", title: "Referência da Equipe" },
];

export const KICKOFF_ARC: Arc = {
    id: 'ftc_kickoff',
    title: 'Kickoff da Temporada',
    description: 'A nova temporada FTC começou! É hora de analisar o jogo, formar as estratégias e iniciar os projetos.',
    type: 'Exam',
    effects: ['XP de Planejamento x1.5', 'Missões de análise priorizadas', 'Lootbox épica ao completar']
};

export const COMPETITION_ARC: Arc = {
    id: 'ftc_competition_sprint',
    title: 'Sprint de Competição',
    description: 'A competição está próxima! Todos os sistemas devem priorizar integração, testes e preparação.',
    type: 'Exam',
    effects: ['XP de Build/Test x1.5', 'Missões de documentação intensificadas', 'Bônus de streak aumentado']
};

export const CHAMPIONSHIP_ARC: Arc = {
    id: 'bazinga_championship',
    title: 'Em Busca do Inspire',
    description: 'O objetivo supremo: conquistar o prêmio Inspire. Para isso, a Bazinga! 73 deve demonstrar excelência em todas as categorias: engenharia, programação, escrita técnica e conexão com a comunidade.',
    type: 'Exam',
    effects: ['Ganhos de XP x1.2 em todos os Pilares', 'Missões de Engenharia e Documentação Priorizadas', 'Acesso a Peças de Teste Especiais']
};

export const ALL_ARCS: Arc[] = [KICKOFF_ARC, COMPETITION_ARC, CHAMPIONSHIP_ARC];


export const INITIAL_USER: User = {
  name: "Awakened",
  rank: RANKS[0].key,
  level_overall: 1,
  xp_total: 0,
  xpToNextLevel: 130,
  stats: {
    [Realm.TechnicalWriting]: 10,
    [Realm.Networking]: 10,
    [Realm.Oratory]: 10,
    [Realm.Planning]: 10,
    [Realm.Creativity]: 10,
    [Realm.Programming]: 10,
    [Realm.Engineering]: 10,
    [Realm.FirstCulture]: 10,
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
  activeArc: CHAMPIONSHIP_ARC,
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
    coreMission: '',
    longTermGoals: '',
    shortTermGoals: '',
    emergencyGoals: '',
    sideQuests: '',
    awardFocus: ''
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
export const INITIAL_MAJOR_GOALS: MajorGoal[] = [];

export const INITIAL_QUESTS: Quest[] = [];

export const INITIAL_STORY_LOG: StoryLogEntry[] = [
  {
    id: 'log1',
    date: "Semana 1",
    title: "Início da Jornada",
    narrative: "O sistema foi ativado. Um novo membro da Bazinga! 73 foi identificado. Objetivo principal: evoluir. A jornada de desenvolvimento na FIRST Tech Challenge começa agora."
  }
];

export const INITIAL_INTEGRATIONS: Integration[] = [];

export const INITIAL_SYSTEM_MESSAGES: SystemMessage[] = [];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [];

export const STORE_ITEMS: StoreItem[] = [
    {
        id: 'coffee_reward',
        name: "Cafézinho ou Lanche",
        description: "Permissão para comprar um café/lanche especial durante o encontro.",
        cost: 100,
        category: 'Reward',
        effect: { type: 'REAL_WORLD_REWARD' }
    },
    {
        id: '3d_priority',
        name: "Prioridade na Impressora 3D",
        description: "Vá para o topo da fila de impressão 3D para o seu projeto pessoal ou peça de teste.",
        cost: 300,
        category: 'Reward',
        effect: { type: 'REAL_WORLD_REWARD' }
    },
    {
        id: 'playlist_control',
        name: "DJ do Laboratório",
        description: "Direito exclusivo de escolher a playlist de músicas do laboratório por um encontro inteiro.",
        cost: 150,
        category: 'Reward',
        effect: { type: 'REAL_WORLD_REWARD' }
    },
    {
        id: 'programming_surge',
        name: "Foco em Programação",
        description: "Ganha 2x XP em todas as missões de 'Programming' por 24h.",
        cost: 250,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [Realm.Programming] }
    },
    {
        id: 'engineering_surge',
        name: "Foco em Engenharia",
        description: "Ganha 2x XP em todas as missões de 'Engineering' por 24h.",
        cost: 250,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [Realm.Engineering] }
    },
    {
        id: 'writing_catalyst',
        name: "Catalisador de Escrita",
        description: "Ganha 2x XP em missões de 'Technical Writing' por 24h.",
        cost: 250,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [Realm.TechnicalWriting] }
    },
    {
        id: 'networking_surge',
        name: "Surto de Networking",
        description: "Ganha 2x XP em missões de 'Networking' por 24h.",
        cost: 250,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [Realm.Networking] }
    },
    {
        id: 'inspire_core_surge',
        name: "Pack Inspire Award",
        description: "Um pacote que dobra o XP de Engenharia, Programação e Escrita Técnica por 24h.",
        cost: 650,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [Realm.Engineering, Realm.Programming, Realm.TechnicalWriting] }
    },
    {
        id: 'omni_boost',
        name: "Grind de Temporada",
        description: "Dobra o ganho de XP de TODAS as missões (todos os Realms) por 24 horas. Para sprints finais.",
        cost: 800,
        category: 'Buff',
        effect: { type: 'XP_BOOST', value: 2, duration: 24, realms: [] }
    },
    {
        id: 'streak_shield',
        name: "Escudo Anti-Falta",
        description: "Protege sua Streak (dias consecutivos) caso você não consiga treinar/completar missão naquele dia.",
        cost: 500,
        category: 'Utility',
        effect: { type: 'STREAK_SAVER' }
    },
    {
        id: 'quest_reroll',
        name: "Re-roll de Missões",
        description: "Receba novas missões diárias instantaneamente (bom quando as missões atuais estão bloqueadas).",
        cost: 150,
        category: 'Utility',
        effect: { type: 'QUEST_REROLL' }
    }
];

export const BADGE_DEFINITIONS: Badge[] = [
    { id: 'level_10', name: 'Novato Promissor', description: 'Chegou no nível 10.', icon: 'Star' },
    { id: 'level_25', name: 'Veterano Bazinga', description: 'Chegou no nível 25. Já ensina aos novatos.', icon: 'Crown' },
    { id: 'first_quest', name: 'Primeiro Parafuso', description: 'Completou a 1ª missão.', icon: 'Target' },
    { id: 'fifty_quests', name: 'Máquina de Fazer', description: 'Completou 50 missões para a equipe.', icon: 'Zap' },
    { id: 'first_boss', name: 'Entrega Crítica', description: 'Completou um Major Goal (Sub-sistema ou Entrega Grande).', icon: 'Swords' },
    { id: 'design_award', name: 'Mestre do Design', description: 'Completou todas as metas do prêmio de Design.', icon: 'BrainCircuit' },
    { id: 'innovate_award', name: 'Inovadornato', description: 'Completou todas as metas do prêmio Innovate.', icon: 'FlaskConical' },
    { id: 'control_award', name: 'Control Freak', description: 'Completou todas as metas do Controle (Software).', icon: 'Code' },
    { id: 'connect_award', name: 'Conector', description: 'Criou conexões poderosas (Connect Award).', icon: 'Heart' },
    { id: 'outreach_award', name: 'Inspirador', description: 'Atingiu a comunidade (Outreach Award).', icon: 'Sparkles' },
    { id: 'spca_award', name: 'Sustentabilidade', description: 'Mestre em negócios, verbas e futuro (Sustentabilidade/Pensamento Criativo).', icon: 'Coins' },
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