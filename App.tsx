import React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
// FIX: Imported MajorGoal type to resolve definition errors.
import { User, Quest, StoryLogEntry, Integration, Realm, Arc, SystemMessage, TopicDifficulty, StoreItem, QuestStatus, Difficulty, ChatMessage, Badge, Skill, WeeklyProgress, KnowledgeTopic, ActivityData, MajorGoal, ActiveBuff, InventoryItem, RewardNotification, UserState, AiRecommendations, SyncStatus, JournalEntry, ActiveTimedQuest } from './types';
// FIX: Imported INITIAL_MAJOR_GOALS constant to resolve definition errors.
import { INITIAL_USER, INITIAL_QUESTS, INITIAL_STORY_LOG, INITIAL_INTEGRATIONS, RANKS, INITIAL_SYSTEM_MESSAGES, STORE_ITEMS, ALL_ARCS, BADGE_DEFINITIONS, INITIAL_WEEKLY_PROGRESS, INITIAL_ACTIVITY_DATA, INITIAL_MAJOR_GOALS, getXpThresholdForSkillLevel, TOPIC_XP_MAP, getTotalXpForSkill, INITIAL_JOURNAL_ENTRIES } from './constants';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SkillTree from './components/SkillTree';
import StoryLog from './components/StoryLog';
import Analytics from './components/Analytics';
import Store from './components/Store';
import Staking from './components/Staking';
import Inventory from './components/Inventory';
import SettingsModal from './components/SettingsModal';
import MyState from './components/MyState';

import LevelUpAnimation from './components/LevelUpAnimation';
import Chatbot from './components/Chatbot';
import Badges from './components/Badges';
import SystemLog from './components/SystemLog';
import Menu from './components/Menu';
import Journal from './components/Journal';
import Timer from './components/Timer';
import AddQuestModal from './components/AddQuestModal';
import AddEditSkillModal from './components/AddEditSkillModal';
import AddEditTopicModal from './components/AddEditTopicModal';
import AddBulkTopicsModal from './components/AddBulkTopicsModal';
import AddEditMajorGoalModal from './components/AddEditMajorGoalModal';
import SyllabusBreakdownModal from './components/SyllabusBreakdownModal';
import BulkAddMajorGoalsModal from './components/BulkAddMajorGoalsModal';
import AddEditArcModal from './components/AddEditArcModal';
import RewardToast from './components/RewardToast';
import AddEditBadgeModal from './components/AddEditBadgeModal';
import AddStoreItemModal from './components/AddStoreItemModal';
import RecommendationsModal from './components/RecommendationsModal';
import EnterApiKeyModal from './components/EnterApiKeyModal';
import NameEntryModal from './components/NameEntryModal';
import { generateDailyQuests, getAiChatResponseAndActions, devGenerateText, generateKnowledgeTopics, generateTopicsFromSyllabus, generateMajorGoals, generateShortText, generateArc, generateBadge, generateStoreItem, generateRecommendations, generateJournalChecklist } from './services/geminiService';
import { getUpcomingEvents, formatEventsForPrompt } from './services/googleCalendarService';
import { getRecentActivity, formatActivityForPrompt as formatGithubActivityForPrompt } from './services/githubService';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, TreeDeciduous, Package, BotMessageSquare, Menu as MenuIcon, LayoutDashboard, MoreHorizontal } from 'lucide-react';

type View = 'dashboard' | 'skill_tree' | 'chatbot' | 'inventory' | 'more' | 'store' | 'staking' | 'system_log' | 'analytics' | 'story_log' | 'badges' | 'journal' | 'timer';

const SAVE_DATA_PREFIX = 'levelUpAwakeningSaveData_';
const PROFILE_PIC_PREFIX = 'levelUpAwakeningProfilePic_';
const LOCAL_USER_ID = 'local_user';


const migrateLoadedState = (loadedState: any): any => {
    if (!loadedState) return undefined;
    const user = loadedState.user || INITIAL_USER;
    
    // This function ensures that if we add new properties to the user object,
    // old save files won't crash the app. It guarantees that properties
    // expected to be arrays are, in fact, arrays.
    const defaults: Partial<User> = {
        completedMajorGoals: [],
        activeBuffs: [],
        unlockedBadges: [],
        inventory: [],
        stakedBuffs: {},
        activeTimedQuest: null,
    };

    const migratedUser = { ...defaults, ...user };
    
    return { ...loadedState, user: migratedUser };
};

const loadUser = (userId: string) => {
  try {
    const serializedState = localStorage.getItem(`${SAVE_DATA_PREFIX}${userId}`);
    if (serializedState === null) return null;
    return migrateLoadedState(JSON.parse(serializedState));
  } catch (err) {
    console.error("Could not load state from localStorage", err);
    return null;
  }
};

const getRankForLevel = (level: number): string => {
  let currentRank = RANKS[0].title;
  for (const rank of RANKS) {
    if (level >= rank.level) {
      currentRank = rank.title;
    } else {
      break;
    }
  }
  return currentRank;
};

const xpThresholdCache = new Map<number, number>();
const getXpThresholdForLevel = (level: number): number => {
    if (xpThresholdCache.has(level)) {
        return xpThresholdCache.get(level)!;
    }
    if (level < 1) return 130;
    if (level === 1) return 130;
    
    const threshold = Math.floor(getXpThresholdForLevel(level - 1) * 1.5);
    xpThresholdCache.set(level, threshold);
    return threshold;
};

const calculateXpForNextNLevels = (startLevel: number, n: number): number => {
    let totalXp = 0;
    for (let i = 0; i < n; i++) {
        totalXp += getXpThresholdForLevel(startLevel + i);
    }
    return totalXp;
};

const formatMajorGoalsForPrompt = (goals: MajorGoal[], skills: { [id: string]: Skill }, now: Date): string => {
    if (!goals || goals.length === 0) {
        return "No active major goals.";
    }

    const formattedGoals = goals
    .filter(goal => {
        const deadlinePassed = new Date(goal.deadline) < now;
        if (deadlinePassed) return false;

        if (goal.skillId) {
            const skill = skills[goal.skillId];
            if (skill && !skill.isActive) {
                return false;
            }
        }
        return true;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .map(goal => {
        const startDate = new Date(goal.deadline);
        const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        const eventDate = `${startDate.toLocaleDateString()}`;
        return `- Title: "${goal.title}" (Type: ${goal.type})\n  Description: ${goal.description}\n  Rewards: ${goal.xp_reward} XP, ${goal.credit_reward} Credits`;
    }).join('\n');
    
    if (!formattedGoals) {
        return "No active major goals.";
    }

    return `MAJOR GOALS (User-defined, highest priority objectives):\n${formattedGoals}`;
};

const recalculateSkillTree = (
    currentSkillTree: { [id: string]: Skill }, 
    currentKnowledgeBase: { [id: string]: KnowledgeTopic }
): { [id: string]: Skill } => {
    const newSkillTree = JSON.parse(JSON.stringify(currentSkillTree)); // Deep copy
    // Fix: Cast Object.values to KnowledgeTopic[] to ensure correct type inference.
    const topicsBySkill = (Object.values(currentKnowledgeBase) as KnowledgeTopic[]).reduce((acc, topic) => {
        if (!acc[topic.skillId]) acc[topic.skillId] = [];
        acc[topic.skillId].push(topic);
        return acc;
    }, {} as Record<string, KnowledgeTopic[]>);

    for (const skillId in newSkillTree) {
        const skill = newSkillTree[skillId];
        const skillTopics = topicsBySkill[skillId] || [];
        
        const totalXp = skillTopics.reduce((sum, topic) => sum + (TOPIC_XP_MAP[topic.difficulty] || 0), 0);
        
        let remainingXp = totalXp;
        let newLevel = 1;
        let xpForNextLevel = getXpThresholdForSkillLevel(1, skill.xpScale);

        while (remainingXp >= xpForNextLevel) {
            remainingXp -= xpForNextLevel;
            newLevel++;
            xpForNextLevel = getXpThresholdForSkillLevel(newLevel, skill.xpScale);
        }

        newSkillTree[skillId] = {
            ...skill,
            level: newLevel,
            xp: Math.floor(remainingXp),
            xpToNextLevel: xpForNextLevel,
        };
    }
    return newSkillTree;
};


const App: React.FC = () => {
  const [userPicture, setUserPicture] = useState<string | null>(() => localStorage.getItem(`${PROFILE_PIC_PREFIX}${LOCAL_USER_ID}`) || null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const saveTimeoutRef = useRef<number | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('googleAiApiKey') || '');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(!localStorage.getItem('googleAiApiKey'));
  const [isNameEntryModalOpen, setIsNameEntryModalOpen] = useState(false);

  const [user, _setUser] = useState<User>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.user || INITIAL_USER;
  });
  const [quests, setQuests] = useState<Quest[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.quests || INITIAL_QUESTS;
  });
  const [storyLog, setStoryLog] = useState<StoryLogEntry[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.storyLog || INITIAL_STORY_LOG;
  });
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.journalEntries || INITIAL_JOURNAL_ENTRIES;
  });
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.weeklyProgress || INITIAL_WEEKLY_PROGRESS;
  });
  const [activityLog, setActivityLog] = useState<ActivityData[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.activityLog || INITIAL_ACTIVITY_DATA;
  });
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.systemMessages || INITIAL_SYSTEM_MESSAGES;
  });
  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.integrations || INITIAL_INTEGRATIONS;
  });
  const [storeItems, setStoreItems] = useState<StoreItem[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.storeItems || STORE_ITEMS;
  });
  const [allArcs, setAllArcs] = useState<Arc[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.allArcs || ALL_ARCS;
  });
  const [activeArcId, setActiveArcId] = useState<string | null>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.activeArcId || INITIAL_USER.activeArc?.id || null;
  });
  const [allBadges, setAllBadges] = useState<Badge[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.allBadges || BADGE_DEFINITIONS;
  });
  const [view, setView] = useState<View>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingQuests, setIsLoadingQuests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLootboxClaim, setLastLootboxClaim] = useState<string | null>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.lastLootboxClaim || null;
  });

  useEffect(() => {
    if (user.name === "Awakened") {
      setIsNameEntryModalOpen(true);
    }
  }, [user.name]);

  const handleSaveName = (newName: string) => {
    setUser(prev => ({ ...prev, name: newName }));
    setIsNameEntryModalOpen(false);
  };
  const [levelUpData, setLevelUpData] = useState<{ level: number, rank: string } | null>(null);
  const previousLevel = useRef<number>(user.level_overall);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.chatHistory || [];
  });
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  const [isAddQuestModalOpen, setIsAddQuestModalOpen] = useState(false);

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<KnowledgeTopic | null>(null);
  const [defaultSkillForTopic, setDefaultSkillForTopic] = useState<string | undefined>();
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [skillForBulkAdd, setSkillForBulkAdd] = useState<Skill | null>(null);

  const [majorGoals, setMajorGoals] = useState<MajorGoal[]>(() => {
    const localData = loadUser(LOCAL_USER_ID);
    return localData?.majorGoals || INITIAL_MAJOR_GOALS;
  });
  const [isMajorGoalModalOpen, setIsMajorGoalModalOpen] = useState(false);
  const [editingMajorGoal, setEditingMajorGoal] = useState<MajorGoal | null>(null);
  const [isBulkGoalModalOpen, setIsBulkGoalModalOpen] = useState(false);

  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [goalForBreakdown, setGoalForBreakdown] = useState<MajorGoal | null>(null);
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

  const [isArcModalOpen, setIsArcModalOpen] = useState(false);
  const [rewardNotifications, setRewardNotifications] = useState<RewardNotification[]>([]);

  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);

  const [isStoreItemModalOpen, setIsStoreItemModalOpen] = useState(false);
  const [editingStoreItem, setEditingStoreItem] = useState<StoreItem | null>(null);

  const [isRecommendationsModalOpen, setIsRecommendationsModalOpen] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendations | null>(null);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  const [timeOffsetInHours, setTimeOffsetInHours] = useState(0);

  const setStateFromData = useCallback((data: any) => {
    _setUser(data.user || INITIAL_USER);
    setQuests(data.quests || INITIAL_QUESTS);
    setStoryLog(data.storyLog || INITIAL_STORY_LOG);
    setJournalEntries(data.journalEntries || INITIAL_JOURNAL_ENTRIES);
    setWeeklyProgress(data.weeklyProgress || INITIAL_WEEKLY_PROGRESS);
    setActivityLog(data.activityLog || INITIAL_ACTIVITY_DATA);
    setSystemMessages(data.systemMessages || INITIAL_SYSTEM_MESSAGES);
    setIntegrations(data.integrations || INITIAL_INTEGRATIONS);
    setStoreItems(data.storeItems || STORE_ITEMS);
    setAllArcs(data.allArcs || ALL_ARCS);
    setActiveArcId(data.activeArcId || INITIAL_USER.activeArc?.id || null);
    setAllBadges(data.allBadges || BADGE_DEFINITIONS);
    setMajorGoals(data.majorGoals || INITIAL_MAJOR_GOALS);
    setLastLootboxClaim(data.lastLootboxClaim || null);
    setChatHistory(data.chatHistory || []);
  }, []);

  const handleSaveApiKey = useCallback((newKey: string) => {
    localStorage.setItem('googleAiApiKey', newKey);
    setApiKey(newKey);
    setIsApiKeyModalOpen(false);
    setSystemMessages(prev => [{ id: `apikey-saved-${Date.now()}`, text: 'API Key has been saved.', timestamp: 'Just now', type: 'system' }, ...prev]);
  }, []);

  const handleProfilePictureChange = useCallback((dataUrl: string | null) => {
    if (dataUrl) {
      localStorage.setItem(`${PROFILE_PIC_PREFIX}${LOCAL_USER_ID}`, dataUrl);
    } else {
      localStorage.removeItem(`${PROFILE_PIC_PREFIX}${LOCAL_USER_ID}`);
    }
    setUserPicture(dataUrl);
    setSystemMessages(prev => [{ id: `pfp-update-${Date.now()}`, text: `Profile picture ${dataUrl ? 'updated' : 'reset to default'}.`, timestamp: 'Just now', type: 'system' }, ...prev]);
  }, [setSystemMessages]);

  // Autosave to localStorage on state change
  useEffect(() => {
    const stateToSave = {
        user, quests, storyLog, weeklyProgress, activityLog, systemMessages,
        integrations, storeItems, allArcs, activeArcId, allBadges, majorGoals,
        lastLootboxClaim, chatHistory, journalEntries,
    };

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
        setSyncStatus('syncing');
        try {
            const serializedState = JSON.stringify(stateToSave);
            localStorage.setItem(`${SAVE_DATA_PREFIX}${LOCAL_USER_ID}`, serializedState);
            setSyncStatus('synced');
            setTimeout(() => setSyncStatus('idle'), 1500);
        } catch (err) {
            console.error("Could not save state to localStorage", err);
            setSyncStatus('error');
        }
    }, 1000);

  }, [
    user, quests, storyLog, weeklyProgress, activityLog, systemMessages,
    integrations, storeItems, allArcs, activeArcId, allBadges, majorGoals,
    lastLootboxClaim, chatHistory, journalEntries
  ]);



  const setUser = useCallback((newUserOrFn: React.SetStateAction<User>) => {
      _setUser(currentUser => {
          const newUser = typeof newUserOrFn === 'function' ? newUserOrFn(currentUser) : newUserOrFn;
          
          const sanitizedUser = { ...newUser };
          if (sanitizedUser.wallet.credits < 0) {
              sanitizedUser.wallet = { ...sanitizedUser.wallet, credits: 0 };
          }
          
          let skillsChanged = false;
          const sanitizedSkillTree = { ...sanitizedUser.skill_tree };
          for (const skillId in sanitizedSkillTree) {
              if (sanitizedSkillTree[skillId].xp < 0) {
                  sanitizedSkillTree[skillId] = { ...sanitizedSkillTree[skillId], xp: 0 };
                  skillsChanged = true;
              }
          }
          if (skillsChanged) {
              sanitizedUser.skill_tree = sanitizedSkillTree;
          }

          return sanitizedUser;
      });
  }, []);
  
  const handleResetData = useCallback(() => {
    if (window.confirm("Are you sure you want to delete all your progress? This action cannot be undone.")) {
      localStorage.removeItem(`${SAVE_DATA_PREFIX}${LOCAL_USER_ID}`);
      localStorage.removeItem(`${PROFILE_PIC_PREFIX}${LOCAL_USER_ID}`);
      localStorage.removeItem('googleAiApiKey');
      window.location.reload();
    }
  }, []);

  const getCurrentDate = useCallback(() => {
    const date = new Date();
    // Force IST (UTC+5:30) and add dev offset
    const timeOffsetMilliseconds = timeOffsetInHours * 60 * 60 * 1000;
    const istOffset = (5.5 * 60 * 60 * 1000) + timeOffsetMilliseconds;
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + istOffset);
  }, [timeOffsetInHours]);

  const getFutureDateWithOffset = (currentDate: Date, hours: number): Date => {
      const newDate = new Date(currentDate);
      newDate.setHours(newDate.getHours() + hours);
      return newDate;
  };


  const handleCheckForNewBadges = useCallback(() => {
    const newlyUnlocked: Badge[] = [];
    allBadges.forEach(badge => {
        if (user.unlockedBadges.includes(badge.id)) return;

        let unlocked = false;
        switch (badge.id) {
            case 'level_10': unlocked = user.level_overall >= 10; break;
            case 'level_25': unlocked = user.level_overall >= 25; break;
            case 'first_quest': unlocked = user.questsCompleted >= 1; break;
            case 'ten_quests': unlocked = user.questsCompleted >= 10; break;
            case 'fifty_quests': unlocked = user.questsCompleted >= 50; break;
            case 'first_boss': unlocked = user.bossQuestsCompleted >= 1; break;
            case 'mind_adept': unlocked = Object.values(user.skill_tree).some((s: Skill) => s.realm === Realm.Mind && s.level >= 5); break;
            case 'body_adept': unlocked = Object.values(user.skill_tree).some((s: Skill) => s.realm === Realm.Body && s.level >= 5); break;
            case 'creation_adept': unlocked = Object.values(user.skill_tree).some((s: Skill) => s.realm === Realm.Creation && s.level >= 5); break;
            case 'spirit_adept': unlocked = Object.values(user.skill_tree).some((s: Skill) => s.realm === Realm.Spirit && s.level >= 5); break;
        }

        if (unlocked) newlyUnlocked.push(badge);
    });

    if (newlyUnlocked.length > 0) {
        setUser(prev => ({
            ...prev,
            unlockedBadges: [...prev.unlockedBadges, ...newlyUnlocked.map(b => b.id)]
        }));
        newlyUnlocked.forEach(badge => {
            setSystemMessages(prev => [{
                id: `badge-${badge.id}-${Date.now()}`,
                text: `Achievement Unlocked: ${badge.name}!`,
                timestamp: 'Just now',
                type: 'reward'
            }, ...prev]);
        });
    }
  }, [user.unlockedBadges, user.level_overall, user.questsCompleted, user.bossQuestsCompleted, user.skill_tree, allBadges, setUser]);


  useEffect(() => {
      handleCheckForNewBadges();
  }, [user.questsCompleted, user.bossQuestsCompleted, user.level_overall, user.skill_tree, handleCheckForNewBadges]);


  useEffect(() => {
    if (user.level_overall > previousLevel.current) {
        setLevelUpData({ level: user.level_overall, rank: user.rank });
        let sound = new Audio('/src/assets/audio/level_up.mp3');
        if (sound) {
            sound.volume = 0.5;
            sound.play().catch(e => console.log("Audio play blocked by browser:", e));
        }
    }
    previousLevel.current = user.level_overall;
  }, [user.level_overall, user.rank]);

  useEffect(() => {
    if (levelUpData) {
      const timer = setTimeout(() => {
        setLevelUpData(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [levelUpData]);


  useEffect(() => {
    const interval = setInterval(() => {
        const now = Date.now();
        const activeBuffs = user.activeBuffs;
        const expiredBuffs = activeBuffs.filter(buff => buff.expiryTimestamp < now);

        if (expiredBuffs.length > 0) {
            setUser(prev => ({
                ...prev,
                activeBuffs: prev.activeBuffs.filter(buff => buff.expiryTimestamp >= now),
            }));
            expiredBuffs.forEach(buff => {
                setSystemMessages(prevMessages => [{
                    id: `buff-expire-${buff.itemId}-${now}`,
                    text: `Buff expired: ${buff.itemName}.`,
                    timestamp: 'Just now',
                    type: 'info'
                }, ...prevMessages]);
            });
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [user.activeBuffs, setUser]);


  useEffect(() => {
    const interval = setInterval(() => {
      const now = getCurrentDate();
      const pendingQuests = quests.filter(q => q.status === QuestStatus.Pending);
      const failedQuests = pendingQuests.filter(q => q.deadline && new Date(q.deadline) < now);
      const failedMajorGoals = majorGoals.filter(g => g.deadline && new Date(g.deadline) < now);

      if (failedQuests.length > 0 || failedMajorGoals.length > 0) {
        let totalUserXpPenalty = 0;
        let totalCreditPenalty = 0;
        
        failedQuests.forEach(q => {
            if (q.penalty) {
                if (q.penalty.type === 'credits') {
                    totalCreditPenalty += q.penalty.amount;
                }
                if (q.penalty.type === 'xp') {
                    totalUserXpPenalty += q.penalty.amount;
                }
                setSystemMessages(prev => [{id: `fail-${q.id}`, text: `Time-driven quest "${q.title}" failed. Penalty applied.`, timestamp: 'Just now', type: 'warning'}, ...prev]);
            }
        });

        failedMajorGoals.forEach(g => {
            if (g.penalty) {
                if (g.penalty.type === 'credits') {
                    totalCreditPenalty += g.penalty.amount;
                }
                if (g.penalty.type === 'xp') {
                    totalUserXpPenalty += g.penalty.amount;
                }
                setSystemMessages(prev => [{id: `fail-goal-${g.id}`, text: `Major Goal "${g.title}" deadline missed. Penalty applied.`, timestamp: 'Just now', type: 'warning'}, ...prev]);
            }
        });
        
        if (totalUserXpPenalty > 0 || totalCreditPenalty > 0) {
            setUser(prev => {
                let totalXpOwned = 0;
                for (let i = 1; i < prev.level_overall; i++) {
                    totalXpOwned += getXpThresholdForLevel(i);
                }
                totalXpOwned += prev.xp_total;

                let newTotalXpOwned = Math.max(0, totalXpOwned - totalUserXpPenalty);
                
                let newLevel = 1;
                let xpForNext = getXpThresholdForLevel(1);
                while (newTotalXpOwned >= xpForNext) {
                    newTotalXpOwned -= xpForNext;
                    newLevel++;
                    xpForNext = getXpThresholdForLevel(newLevel);
                }
                const newRank = getRankForLevel(newLevel);

                return {
                    ...prev,
                    level_overall: newLevel,
                    rank: newRank,
                    xp_total: Math.floor(newTotalXpOwned),
                    xpToNextLevel: xpForNext,
                    wallet: { ...prev.wallet, credits: Math.max(0, prev.wallet.credits - totalCreditPenalty) },
                };
            });
        }
        
        if (failedQuests.length > 0) {
            setQuests(currentQuests => currentQuests.filter(q => !failedQuests.some(fq => fq.id === q.id)));
        }
        if (failedMajorGoals.length > 0) {
            setMajorGoals(currentGoals => currentGoals.filter(g => !failedMajorGoals.some(fg => fg.id === g.id)));
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [quests, majorGoals, getCurrentDate, setUser]);


  const handleGenerateQuests = useCallback(async () => {
    setIsLoadingQuests(true);
    setError(null);
    try {
      
      const now = getCurrentDate();

      let shouldGenerateWeeklyBoss = false;
      if (user.lastWeeklyBossDate) {
          const lastBossDate = new Date(user.lastWeeklyBossDate);
          const oneWeek = 7 * 24 * 60 * 60 * 1000;
          if (now.getTime() - lastBossDate.getTime() >= oneWeek) {
              shouldGenerateWeeklyBoss = true;
          }
      } else {
          shouldGenerateWeeklyBoss = true; // First time ever
      }

      const contextualData: { [key: string]: string } = {};
      if (integrations.find(i => i.id === 'google_calendar' && i.connected)) {
          try {
            const events = await getUpcomingEvents();
            contextualData['Google Calendar'] = formatEventsForPrompt(events);
          } catch (e) {
             const errorMessage = e instanceof Error ? e.message : "Unknown error.";
             setSystemMessages(prev => [{id: `gcal-err-${Date.now()}`, text: `Google Calendar Sync Failed: ${errorMessage}`, timestamp: 'Just now', type: 'warning'}, ...prev]);
          }
      }
      if (integrations.find(i => i.id === 'github' && i.connected)) {
          contextualData['GitHub'] = formatGithubActivityForPrompt(await getRecentActivity());
      }
      
      const newQuestsData = await generateDailyQuests(apiKey, user, contextualData, chatHistory, shouldGenerateWeeklyBoss);

      const nowWithOffset = getCurrentDate();

      const newQuests = newQuestsData.map(q => {
          const deadlineDate = getFutureDateWithOffset(nowWithOffset, q.deadlineHours || 24);

          if (!q.isMystery && !q.penalty) {
              q.penalty = { type: 'xp', amount: Math.max(1, Math.floor(q.xp_reward * 0.25)) };
          }
          
          return {
              ...q,
              status: QuestStatus.Pending,
              deadline: deadlineDate.toISOString(),
          };
      });
      
      if (shouldGenerateWeeklyBoss && newQuests.some(q => q.isWeeklyBoss)) {
          setUser(prev => ({...prev, lastWeeklyBossDate: now.toISOString() }));
      }
      
      setQuests(newQuests);
      setSystemMessages(prev => [{id: `quests-gen-${Date.now()}`, text: 'New daily quests have been generated.', timestamp: 'Just now', type: 'system'}, ...prev]);

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      setSystemMessages(prev => [{id: `quests-err-${Date.now()}`, text: `Quest Generation Failed: ${errorMessage}`, timestamp: 'Just now', type: 'warning'}, ...prev]);
    } finally {
      setIsLoadingQuests(false);
    }
  }, [apiKey, user, integrations, chatHistory, getCurrentDate, getFutureDateWithOffset, setUser]);
  
 const handleGrantReward = useCallback((
    baseXp: number,
    baseCredits: number,
    realm: Realm,
    activitySource: string, // e.g., questId, 'lootbox', topicId
    userUpdateFn?: (user: User) => Partial<User> // Optional function for additional updates
) => {
    setUser(prevUser => {
        // --- 1. Calculate final amounts
        let finalXp = baseXp;
        let finalCredits = baseCredits;

        prevUser.activeBuffs.forEach(buff => {
            if (buff.effect.type === 'XP_BOOST' && (!buff.effect.realms || buff.effect.realms.length === 0 || buff.effect.realms.includes(realm))) {
                finalXp = Math.floor(finalXp * (buff.effect.value || 1));
            }
        });
        const dailySyncBonus = prevUser.streaks.daily_streak * 1;
        finalXp = Math.floor(finalXp * (1 + dailySyncBonus / 100));

        // --- 2. Handle side-effects (notifications)
        if (finalXp !== baseXp && baseXp > 0) {
            setRewardNotifications(prev => [...prev, { id: `reward-xp-${Date.now()}`, type: 'xp', originalAmount: baseXp, finalAmount: finalXp }]);
        }
        if (finalCredits !== baseCredits && baseCredits > 0) {
             setRewardNotifications(prev => [...prev, { id: `reward-cr-${Date.now()}`, type: 'credits', originalAmount: baseCredits, finalAmount: finalCredits }]);
        }

        // --- 3. Calculate level up
        let newXpTotal = prevUser.xp_total + finalXp;
        let newLevel = prevUser.level_overall;
        let newRank = prevUser.rank;
        let xpForNext = prevUser.xpToNextLevel;

        while (newXpTotal >= xpForNext) {
            newXpTotal -= xpForNext;
            newLevel++;
            xpForNext = getXpThresholdForLevel(newLevel);
            newRank = getRankForLevel(newLevel);
        }
        
        // --- 4. Log Activity
        const todayStr = getCurrentDate().toISOString().split('T')[0];
        if (finalXp > 0) {
            setActivityLog(prev => [...prev, { date: todayStr, skillId: activitySource, xp: finalXp }]);
        }
        
        // --- 5. Construct the new user state
        let updatedUser: User = {
            ...prevUser,
            level_overall: newLevel,
            rank: newRank,
            xp_total: newXpTotal,
            xpToNextLevel: xpForNext,
            stats: { ...prevUser.stats, [realm]: prevUser.stats[realm] + 1 },
            wallet: { ...prevUser.wallet, credits: prevUser.wallet.credits + finalCredits },
        };

        // --- 6. Apply any additional updates
        if (userUpdateFn) {
            const additionalUpdates = userUpdateFn(updatedUser);
            updatedUser = { ...updatedUser, ...additionalUpdates };
        }

        return updatedUser;
    });
}, [getCurrentDate]);

const handleCompleteQuest = useCallback((questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const questCompleter = (user: User): Partial<User> => {
        const today = getCurrentDate().toISOString().split('T')[0];
        let newStreak = user.streaks.daily_streak;
        if (user.streaks.lastQuestCompletionDate !== today) {
            newStreak++;
        }
        return {
            streaks: { daily_streak: newStreak, lastQuestCompletionDate: today },
            questsCompleted: user.questsCompleted + 1,
            bossQuestsCompleted: user.bossQuestsCompleted + (quest.isBossQuest || quest.isWeeklyBoss ? 1 : 0),
        };
    };

    handleGrantReward(quest.xp_reward, quest.credit_reward, quest.realm, questId, questCompleter);
    setQuests(prev => prev.filter(q => q.id !== questId));

}, [quests, getCurrentDate, handleGrantReward]);

const handleCompleteMajorGoal = useCallback((goal: MajorGoal) => {
    const realm = goal.skillId ? user.skill_tree[goal.skillId]?.realm || Realm.Meta : Realm.Meta;
    
    const goalCompleter = (user: User): Partial<User> => {
        const updatedCompletedGoals = [...(user.completedMajorGoals || []), goal];
        return {
            bossQuestsCompleted: user.bossQuestsCompleted + 1,
            completedMajorGoals: updatedCompletedGoals
        };
    };

    handleGrantReward(goal.xp_reward, goal.credit_reward, realm, goal.id, goalCompleter);

    setMajorGoals(prev => prev.filter(g => g.id !== goal.id));
    setSystemMessages(prev => [{ id: `goal-complete-${Date.now()}`, text: `Major Goal Completed: ${goal.title}! Rewards granted.`, timestamp: 'Just now', type: 'reward'}, ...prev]);
}, [user.skill_tree, handleGrantReward]);

const handleOpenLootbox = useCallback(() => {
    const today = getCurrentDate().toISOString().split('T')[0];
    if (lastLootboxClaim === today) {
        setSystemMessages(prev => [{id: `loot-claimed-${Date.now()}`, text: 'Daily lootbox already claimed.', timestamp: 'Just now', type: 'info'}, ...prev]);
        return;
    }

    const streak = user.streaks.daily_streak;
    const streakBonusMultiplier = 1 + (Math.min(streak, 50) * 0.02); // 2% bonus per day, capped at 100% bonus
    let rewardText = '';
    
    const rewardRoll = Math.random();

    if (rewardRoll < 0.50) { // 50% chance for credits
        const baseAmount = Math.floor(Math.random() * 51) + 25; // 25-75 credits
        const finalAmount = Math.floor(baseAmount * streakBonusMultiplier);
        handleGrantReward(0, finalAmount, Realm.Meta, 'lootbox-credits');
        rewardText = `You found ${finalAmount} Credits!`;
        if (streak > 0) {
            rewardText += ` (includes +${((streakBonusMultiplier - 1) * 100).toFixed(0)}% streak bonus)`;
        }
    } else if (rewardRoll < 0.75) { // 25% chance for XP
        const baseAmount = Math.floor(Math.random() * 51) + 25; // 25-75 XP
        const finalAmount = Math.floor(baseAmount * streakBonusMultiplier);
        handleGrantReward(finalAmount, 0, Realm.Meta, 'lootbox-xp');
        rewardText = `You gained ${finalAmount} bonus XP!`;
        if (streak > 0) {
            rewardText += ` (includes +${((streakBonusMultiplier - 1) * 100).toFixed(0)}% streak bonus)`;
        }
    } else if (rewardRoll < 0.85) { // 10% chance for gems
        const baseAmount = Math.floor(Math.random() * 2) + 1; // 1-2 gems
        const finalAmount = baseAmount + Math.floor(streak / 10); // +1 gem every 10 streak days
        setUser(prev => ({ ...prev, wallet: { ...prev.wallet, gems: prev.wallet.gems + finalAmount }}));
        rewardText = `RARE DROP! You found ${finalAmount} Gem(s)!`;
        if (streak >= 10) {
            rewardText += ` (includes bonus from streak)`;
        }
    } else { // 15% chance for an item
        const potentialItems = storeItems.filter(item => item.category === 'Utility' || item.category === 'Buff');
        if (potentialItems.length > 0) {
            const droppedItem = potentialItems[Math.floor(Math.random() * potentialItems.length)];
            setUser(prev => {
                const newInventory = [...prev.inventory];
                const existingItem = newInventory.find(i => i.itemId === droppedItem.id);
                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    newInventory.push({ itemId: droppedItem.id, quantity: 1 });
                }
                return { ...prev, inventory: newInventory };
            });
            rewardText = `EPIC DROP! You found a "${droppedItem.name}"! It has been added to your inventory.`;
        } else {
            // Fallback to credits if no items are available
            const amount = 50;
            handleGrantReward(0, amount, Realm.Meta, 'lootbox-credits-fallback');
            rewardText = `You found a fallback reward of ${amount} Credits!`;
        }
    }

    setLastLootboxClaim(today);
    setSystemMessages(prev => [{id: `loot-reward-${Date.now()}`, text: rewardText, timestamp: 'Just now', type: 'reward'}, ...prev]);
}, [lastLootboxClaim, getCurrentDate, setUser, handleGrantReward, user.streaks.daily_streak, storeItems]);

const handleUpdateTopicDifficulty = useCallback((topicId: string, newDifficulty: TopicDifficulty) => {
    const topic = user.knowledgeBase[topicId];
    if (!topic || topic.difficulty === newDifficulty) return;

    const oldDifficulty = topic.difficulty;
    const oldTopicXp = TOPIC_XP_MAP[oldDifficulty] || 0;
    const newTopicXp = TOPIC_XP_MAP[newDifficulty] || 0;
    const xpDifference = newTopicXp - oldTopicXp;

    setUser(prevUser => {
        // 1. Update knowledge base
        const newKnowledgeBase = { ...prevUser.knowledgeBase };
        if (newKnowledgeBase[topicId]) {
            newKnowledgeBase[topicId].difficulty = newDifficulty;
        }

        // 2. Recalculate skill tree based on new knowledge base
        const newSkillTree = recalculateSkillTree(prevUser.skill_tree, newKnowledgeBase);

        // 3. Handle User Level and XP
        let newXpTotal = prevUser.xp_total + xpDifference;
        let newLevel = prevUser.level_overall;
        let newRank = prevUser.rank;
        let xpForNext = prevUser.xpToNextLevel;

        if (xpDifference > 0) {
            while (newXpTotal >= xpForNext) {
                newXpTotal -= xpForNext;
                newLevel++;
                xpForNext = getXpThresholdForLevel(newLevel);
                newRank = getRankForLevel(newLevel);
            }
        } else if (xpDifference < 0) {
            while (newXpTotal < 0) {
                if (newLevel === 1) {
                    newXpTotal = 0;
                    break;
                }
                newLevel--;
                const prevLevelXpThreshold = getXpThresholdForLevel(newLevel);
                newXpTotal += prevLevelXpThreshold;
                xpForNext = prevLevelXpThreshold;
                newRank = getRankForLevel(newLevel);
            }
        }
        
        return {
            ...prevUser,
            knowledgeBase: newKnowledgeBase,
            skill_tree: newSkillTree,
            level_overall: newLevel,
            rank: newRank,
            xp_total: Math.floor(newXpTotal),
            xpToNextLevel: xpForNext,
        };
    });
}, [user.knowledgeBase]);

  const handleBuyItem = useCallback((item: StoreItem) => {
      if (user.wallet.credits < item.cost) {
          setSystemMessages(prev => [{id: `buy-fail-${Date.now()}`, text: 'Insufficient credits.', timestamp: 'Just now', type: 'warning'}, ...prev]);
          return;
      }
      setUser(prev => {
        const newInventory = [...prev.inventory];
        const existingItem = newInventory.find(i => i.itemId === item.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            newInventory.push({ itemId: item.id, quantity: 1 });
        }
        return {
          ...prev,
          wallet: { ...prev.wallet, credits: prev.wallet.credits - item.cost },
          inventory: newInventory
        }
      });
      setSystemMessages(prev => [{id: `buy-ok-${Date.now()}`, text: `Acquired: ${item.name}.`, timestamp: 'Just now', type: 'info'}, ...prev]);
  }, [user.wallet.credits, setUser]);

  const handleUseItem = useCallback((itemId: string) => {
    const itemToUse = storeItems.find(i => i.id === itemId);
    const inventoryItem = user.inventory.find(i => i.itemId === itemId);
    if (!itemToUse || !inventoryItem) return;

    let success = true;
    switch(itemToUse.effect.type) {
      case 'XP_BOOST':
        setUser(prev => {
          const now = Date.now();
          const expiry = now + (itemToUse.effect.duration || 24) * 3600 * 1000;
          const newBuff: ActiveBuff = {
            itemId: itemToUse.id,
            itemName: itemToUse.name,
            expiryTimestamp: expiry,
            effect: itemToUse.effect,
          };
          return { ...prev, activeBuffs: [...prev.activeBuffs, newBuff] };
        });
        break;
      case 'STREAK_SAVER':
        // Logic to apply this would be elsewhere (e.g., daily reset check)
        break;
      case 'QUEST_REROLL':
        handleGenerateQuests();
        break;
      case 'INSTANT_STREAK':
         setUser(prev => ({...prev, streaks: {...prev.streaks, daily_streak: 3}}));
         break;
      default:
        success = false;
        break;
    }

    if (success) {
        setUser(prev => {
          const newInventory = prev.inventory.map(i => {
            if (i.itemId === itemId) {
              return { ...i, quantity: i.quantity - 1 };
            }
            return i;
          }).filter(i => i.quantity > 0);
          return { ...prev, inventory: newInventory };
        });
        setSystemMessages(prev => [{id: `use-item-${Date.now()}`, text: `Activated: ${itemToUse.name}.`, timestamp: 'Just now', type: 'info'}, ...prev]);
    }
  }, [storeItems, user.inventory, setUser, handleGenerateQuests]);

  const handleStakeCredits = useCallback((amount: number) => {
      setUser(prev => {
          const stakeableAmount = Math.min(amount, prev.wallet.credits);
          const stakingLimit = prev.level_overall * 100;
          const roomToStake = Math.max(0, stakingLimit - prev.staked_credits);
          const finalAmount = Math.min(stakeableAmount, roomToStake);
          
          if (finalAmount <= 0) return prev;
          
          return {
              ...prev,
              wallet: { ...prev.wallet, credits: prev.wallet.credits - finalAmount },
              staked_credits: prev.staked_credits + finalAmount,
          }
      });
  }, [setUser]);

  const handleWithdrawCredits = useCallback((amount: number) => {
      setUser(prev => {
          const withdrawableAmount = Math.min(amount, prev.staked_credits);
          if (withdrawableAmount <= 0) return prev;
          return {
              ...prev,
              wallet: { ...prev.wallet, credits: prev.wallet.credits + withdrawableAmount },
              staked_credits: prev.staked_credits - withdrawableAmount,
          }
      });
  }, [setUser]);

  const handleStakeBuff = useCallback((itemId: string) => {
    setUser(prev => {
        const inventoryItem = prev.inventory.find(i => i.itemId === itemId);
        if (!inventoryItem || inventoryItem.quantity <= 0) return prev;

        const currentStakedCount = prev.stakedBuffs[itemId] || 0;
        const buffStakingLimit = Math.floor(prev.level_overall / 10) + 1;
        if (currentStakedCount >= buffStakingLimit) {
            setSystemMessages(p => [{id: `stake-limit-${Date.now()}`, text: 'Infusion limit reached for this buff at your current level.', timestamp: 'Just now', type: 'warning'}, ...p]);
            return prev;
        }

        const newInventory = prev.inventory.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
        const newStakedBuffs = { ...prev.stakedBuffs, [itemId]: currentStakedCount + 1 };
        
        return {
            ...prev,
            inventory: newInventory,
            stakedBuffs: newStakedBuffs,
        };
    });
  }, [setUser]);

  const handleSendMessage = useCallback(async (message: string) => {
    const userMessage: ChatMessage = { id: `chat-${Date.now()}`, text: message, sender: 'user', timestamp: new Date().toLocaleTimeString() };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setIsChatbotLoading(true);

    try {
        const { text, functionCalls } = await getAiChatResponseAndActions(apiKey, user, newHistory, message, quests, majorGoals, storeItems);
        
        if (functionCalls) {
            for (const call of functionCalls) {
                const args: any = call.args;
                switch(call.name) {
                    case 'addQuest':
                        const questArgs = args as Partial<Quest>;
                        const newQuestData: Omit<Quest, 'id' | 'status' | 'source'> = {
                          title: questArgs.title || 'AI Generated Quest',
                          description: questArgs.description || '',
                          realm: questArgs.realm || Realm.Mind,
                          knowledgeTopics: [],
                          xp_reward: questArgs.xp_reward || 20,
                          credit_reward: questArgs.credit_reward || 10,
                          difficulty: questArgs.difficulty || Difficulty.Easy,
                          duration_est_min: questArgs.duration_est_min || 30,
                        };
                        handleAddPersonalQuest(newQuestData);
                        break;
                    case 'completeQuest':
                        const questToComplete = quests.find(q => q.title.toLowerCase() === (args.questTitle as string)?.toLowerCase());
                        if (questToComplete) {
                            handleCompleteQuest(questToComplete.id);
                        }
                        break;
                    case 'addMajorGoal':
                        const goalArgs = args as Partial<MajorGoal> & { deadlineDays: number };
                        const deadline = new Date();
                        deadline.setDate(deadline.getDate() + (goalArgs.deadlineDays || 7));
                        deadline.setHours(23, 59, 59, 999);
                        const newGoal: MajorGoal = {
                            id: `goal-${Date.now()}`,
                            title: goalArgs.title || 'New Goal',
                            description: goalArgs.description || '',
                            type: goalArgs.type || 'Forge',
                            deadline: deadline.toISOString(),
                            xp_reward: goalArgs.xp_reward || 500,
                            credit_reward: goalArgs.credit_reward || 100,
                            skillId: goalArgs.skillId,
                            syllabus: goalArgs.syllabus,
                        };
                        setMajorGoals(prev => [...prev, newGoal]);
                        break;
                    case 'completeMajorGoal':
                        const goalToComplete = majorGoals.find(g => g.title.toLowerCase() === (args.goalTitle as string)?.toLowerCase());
                        if (goalToComplete) {
                            handleCompleteMajorGoal(goalToComplete);
                        }
                        break;
                    case 'buyStoreItem':
                        const itemToBuy = storeItems.find(i => i.name.toLowerCase() === (args.itemName as string)?.toLowerCase());
                        if (itemToBuy) {
                            handleBuyItem(itemToBuy);
                        }
                        break;
                    case 'useInventoryItem':
                        const itemToUse = storeItems.find(i => i.name.toLowerCase() === (args.itemName as string)?.toLowerCase());
                        if (itemToUse) {
                            handleUseItem(itemToUse.id);
                        }
                        break;
                    case 'updateUserState':
                        const stateUpdate = args as Partial<UserState>;
                        handleUpdateUserState(stateUpdate);
                        break;
                }
            }
        }
        
        if (text) {
            const aiMessage: ChatMessage = { id: `chat-${Date.now()}-ai`, text: text, sender: 'ai', timestamp: new Date().toLocaleTimeString() };
            setChatHistory(prev => [...prev, aiMessage]);
        }

    } catch(e) {
        console.error("Chatbot Error:", e);
        const errorMessage: ChatMessage = { id: `chat-err-${Date.now()}`, text: "Error: Could not connect to the AI core.", sender: 'ai', timestamp: new Date().toLocaleTimeString() };
        setChatHistory(prev => [...prev, errorMessage]);
    } finally {
        setIsChatbotLoading(false);
    }
  }, [apiKey, chatHistory, user, quests, majorGoals, storeItems]);

  const handleJournalSubmit = useCallback(async (goalId: string, reflection: string) => {
    const goal = user.completedMajorGoals?.find(g => g.id === goalId);
    if (!goal) return;

    setIsChatbotLoading(true);

    try {
      // 1. Grant journaling XP
      handleGrantReward(25, 0, Realm.Spirit, 'journal-entry');

      // 2. Generate checklist quests
      const checklistItems = await generateJournalChecklist(apiKey, reflection, goal, user);
      
      const newQuests: Quest[] = checklistItems.map((item, index) => ({
        ...item,
        id: `journal-quest-${Date.now()}-${index}`,
        status: QuestStatus.Pending,
        source: 'ai_system',
        difficulty: Difficulty.Easy, // Journal quests are simple fix-its
        credit_reward: 5,
        duration_est_min: 15,
        knowledgeTopics: [],
      }));

      // 3. Create journal entry
      const newJournalEntry: JournalEntry = {
        id: `journal-${Date.now()}`,
        majorGoalId: goal.id,
        majorGoalTitle: goal.title,
        reflectionText: reflection,
        generatedChecklistQuestIds: newQuests.map(q => q.id),
        timestamp: new Date().toISOString(),
      };

      // 4. Update state
      setQuests(prev => [...prev, ...newQuests]);
      setJournalEntries(prev => [...prev, newJournalEntry]);
      setSystemMessages(prev => [{id: `journal-ok-${Date.now()}`, text: `Journal entry logged for "${goal.title}". Improvement plan generated.`, timestamp: 'Just now', type: 'system'}, ...prev]);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setSystemMessages(prev => [{id: `journal-err-${Date.now()}`, text: `Journaling Failed: ${errorMessage}`, timestamp: 'Just now', type: 'warning'}, ...prev]);
    } finally {
      setIsChatbotLoading(false);
    }
  }, [apiKey, user, handleGrantReward]);

  const handleStartTimedQuest = useCallback((title: string, realm: Realm, estimatedMinutes: number) => {
    const newTimedQuest: ActiveTimedQuest = {
        title,
        realm,
        estimatedMinutes,
        startTime: new Date().toISOString(),
    };
    setUser(prev => ({ ...prev, activeTimedQuest: newTimedQuest }));
    setView('timer');
    setSystemMessages(prev => [{
        id: `timer-start-${Date.now()}`,
        text: `Timed quest started: "${title}". Estimated time: ${estimatedMinutes} minutes.`,
        timestamp: 'Just now',
        type: 'info'
    }, ...prev]);
  }, [setUser]);

  const handleCompleteTimedQuest = useCallback(() => {
    const activeQuest = user.activeTimedQuest;
    if (!activeQuest) return;

    const startTime = new Date(activeQuest.startTime).getTime();
    const endTime = Date.now();
    const elapsedSeconds = Math.floor((endTime - startTime) / 1000);
    const elapsedMinutes = elapsedSeconds / 60;
    
    const baseXp = Math.floor(activeQuest.estimatedMinutes * 1.5);
    const baseCredits = Math.floor(activeQuest.estimatedMinutes * 0.5);

    let bonusXp = 0;
    let bonusCredits = 0;
    let bonusMessage = '';

    if (elapsedMinutes <= activeQuest.estimatedMinutes) {
        const timeSavedRatio = (activeQuest.estimatedMinutes - elapsedMinutes) / activeQuest.estimatedMinutes;
        const bonusPercentage = Math.min(timeSavedRatio, 0.5); // Cap bonus at 50%
        bonusXp = Math.floor(baseXp * bonusPercentage);
        bonusCredits = Math.floor(baseCredits * bonusPercentage);
        bonusMessage = ` Time bonus: +${bonusXp} XP, +${bonusCredits} Credits!`;
    }
    
    handleGrantReward(baseXp + bonusXp, baseCredits + bonusCredits, activeQuest.realm, 'timed-quest');

    setSystemMessages(prev => [{
        id: `timer-complete-${Date.now()}`,
        text: `Timed quest "${activeQuest.title}" completed in ${Math.round(elapsedMinutes)}m. Reward: +${baseXp + bonusXp} XP, +${baseCredits + bonusCredits} Credits.${bonusMessage}`,
        timestamp: 'Just now',
        type: 'reward'
    }, ...prev]);
    
    setUser(prev => ({ ...prev, activeTimedQuest: null }));
    setView('dashboard');

  }, [user.activeTimedQuest, setUser, handleGrantReward]);

  const handleIntegrationToggle = useCallback((id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  }, []);

  const handleSetActiveArc = useCallback((id: string | null) => {
    setActiveArcId(id);
    const activeArc = allArcs.find(arc => arc.id === id);
    setUser(prev => ({...prev, activeArc: activeArc || null}));
    if (activeArc) {
        setSystemMessages(prev => [{id: `arc-set-${Date.now()}`, text: `Arc Activated: ${activeArc.title}`, timestamp: 'Just now', type: 'system'}, ...prev]);
    } else {
        setSystemMessages(prev => [{id: `arc-clear-${Date.now()}`, text: `Active Arc has been deactivated.`, timestamp: 'Just now', type: 'system'}, ...prev]);
    }
  }, [allArcs, setUser]);

  const handleAddPersonalQuest = useCallback((questData: Omit<Quest, 'id' | 'status' | 'source'>) => {
    const deadline = getFutureDateWithOffset(getCurrentDate(), 24);
    const newQuest: Quest = {
      ...questData,
      id: `personal-${Date.now()}`,
      status: QuestStatus.Pending,
      source: 'user',
      deadline: deadline.toISOString(),
      penalty: { type: 'xp', amount: Math.max(1, Math.floor(questData.xp_reward * 0.25)) },
    };
    setQuests(prev => [newQuest, ...prev]);
    setIsAddQuestModalOpen(false);
  }, [getCurrentDate, getFutureDateWithOffset]);
  
  const handleSaveSkill = useCallback((skillData: { id?: string; name: string; realm: Realm }) => {
      setUser(prev => {
          const newSkillTree = { ...prev.skill_tree };
          if (skillData.id) { // Editing existing skill
              newSkillTree[skillData.id] = { ...newSkillTree[skillData.id], ...skillData };
          } else { // Adding new skill
              const id = skillData.name.toLowerCase().replace(/\s/g, '_') + `_${Date.now()}`;
              newSkillTree[id] = {
                  id,
                  name: skillData.name,
                  realm: skillData.realm,
                  level: 1,
                  xp: 0,
                  xpToNextLevel: getXpThresholdForSkillLevel(1, 1.0),
                  priority: 3,
                  isActive: true,
                  xpScale: 1.0
              };
          }
          return { ...prev, skill_tree: newSkillTree };
      });
      setIsSkillModalOpen(false);
      setEditingSkill(null);
  }, [setUser]);

  const handleSaveTopic = useCallback((topicData: { id?: string; name: string; skillId: string, difficulty: TopicDifficulty }) => {
    setUser(prev => {
        const newKnowledgeBase = { ...prev.knowledgeBase };
        let newSkillTree = prev.skill_tree;
        if(topicData.id) { // Editing
             newKnowledgeBase[topicData.id] = { ...newKnowledgeBase[topicData.id], ...topicData };
        } else { // Adding
            const id = `topic-${Date.now()}`;
            newKnowledgeBase[id] = { ...topicData, id };
        }
        newSkillTree = recalculateSkillTree(prev.skill_tree, newKnowledgeBase);
        return { ...prev, knowledgeBase: newKnowledgeBase, skill_tree: newSkillTree };
    });
    setIsTopicModalOpen(false);
    setEditingTopic(null);
  }, [setUser]);

  const handleSaveBulkTopics = useCallback((skillId: string, topicNames: string[]) => {
    setUser(prev => {
        const newKnowledgeBase = { ...prev.knowledgeBase };
        topicNames.forEach(name => {
            const id = `topic-${Date.now()}-${name.replace(/\s/g, '_')}`;
            newKnowledgeBase[id] = {
                id,
                name,
                skillId,
                difficulty: TopicDifficulty.Easy,
            };
        });
        const newSkillTree = recalculateSkillTree(prev.skill_tree, newKnowledgeBase);
        return { ...prev, knowledgeBase: newKnowledgeBase, skill_tree: newSkillTree };
    });
    setIsBulkAddModalOpen(false);
  }, [setUser]);
  
  const handleSaveMajorGoal = useCallback((goalData: Omit<MajorGoal, 'id'>) => {
    setMajorGoals(prev => {
        if(editingMajorGoal) {
            return prev.map(g => g.id === editingMajorGoal.id ? { ...g, ...goalData } : g);
        } else {
            const newGoal: MajorGoal = { ...goalData, id: `major-goal-${Date.now()}` };
            if(!newGoal.penalty) {
                newGoal.penalty = { type: 'xp', amount: Math.floor(newGoal.xp_reward * 0.25) };
            }
            return [...prev, newGoal];
        }
    });
    setIsMajorGoalModalOpen(false);
    setEditingMajorGoal(null);
  }, [editingMajorGoal]);

  const handleSaveBulkMajorGoals = useCallback((goals: Omit<MajorGoal, 'id'>[]) => {
      const newGoals: MajorGoal[] = goals.map(g => ({
          ...g,
          id: `major-goal-${Date.now()}-${g.title.replace(/\s/g, '_')}`,
          penalty: { type: 'xp', amount: Math.floor(g.xp_reward * 0.25) },
      }));
      setMajorGoals(prev => [...prev, ...newGoals]);
      setIsBulkGoalModalOpen(false);
  }, []);

  const handleBreakdownSyllabus = useCallback(async (goal: MajorGoal) => {
      if (!goal.skillId || !goal.syllabus) return;
      const skill = user.skill_tree[goal.skillId];
      if(!skill) return;

      setGoalForBreakdown(goal);
      setIsBreakdownModalOpen(true);
      setIsGeneratingTopics(true);
      setGeneratedTopics([]);

      try {
          const existingTopics = (Object.values(user.knowledgeBase) as KnowledgeTopic[]).filter((t) => t.skillId === skill.id);
          const topics = await generateTopicsFromSyllabus(apiKey, goal.syllabus, skill, existingTopics);
          setGeneratedTopics(topics);
      } catch (e) {
          console.error("Syllabus Breakdown Error:", e);
      } finally {
          setIsGeneratingTopics(false);
      }
  }, [apiKey, user.skill_tree, user.knowledgeBase]);

  const handleSaveArc = useCallback((arcData: Omit<Arc, 'id'>, isFromAi: boolean) => {
      const newArc: Arc = {
          ...arcData,
          id: `arc-${Date.now()}`,
          isGenerated: isFromAi,
      };
      setAllArcs(prev => [...prev, newArc]);
      setIsArcModalOpen(false);
  }, []);

  const handleDeleteArc = useCallback((arcId: string) => {
      if (activeArcId === arcId) {
          handleSetActiveArc(null);
      }
      setAllArcs(prev => prev.filter(a => a.id !== arcId));
  }, [activeArcId, handleSetActiveArc]);

  const handleSaveBadge = useCallback((badgeData: Omit<Badge, 'id'>) => {
      if (editingBadge) {
          setAllBadges(prev => prev.map(b => b.id === editingBadge.id ? { ...b, ...badgeData } : b));
      } else {
          const newBadge = { ...badgeData, id: `badge-${Date.now()}` };
          setAllBadges(prev => [...prev, newBadge]);
      }
      setIsBadgeModalOpen(false);
  }, [editingBadge]);

  const handleDeleteBadge = useCallback((badgeId: string) => {
      setAllBadges(prev => prev.filter(b => b.id !== badgeId));
      setUser(prev => ({ ...prev, unlockedBadges: prev.unlockedBadges.filter(id => id !== badgeId) }));
  }, [setUser]);

  const handleSaveStoreItem = useCallback((itemData: Omit<StoreItem, 'id'>) => {
      if (editingStoreItem) {
          setStoreItems(prev => prev.map(i => i.id === editingStoreItem.id ? { ...i, ...itemData } : i));
      } else {
          const newItem = { ...itemData, id: `item-${Date.now()}` };
          setStoreItems(prev => [...prev, newItem]);
      }
      setIsStoreItemModalOpen(false);
  }, [editingStoreItem]);

  const handleDeleteStoreItem = useCallback((itemId: string) => {
      setStoreItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const handleUpdateUserState = useCallback((newState: Partial<UserState>) => {
      setUser(prev => ({
          ...prev,
          state: { ...prev.state, ...newState }
      }));
  }, [setUser]);

  const handleDownloadBackup = useCallback(() => {
    const backupData = {
        user, quests, storyLog, weeklyProgress, activityLog, systemMessages,
        integrations, storeItems, allArcs, activeArcId, allBadges, majorGoals,
        lastLootboxClaim, chatHistory, journalEntries,
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `levelup-awakening-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSystemMessages(prev => [{ id: `backup-${Date.now()}`, text: 'User data backup downloaded.', timestamp: 'Just now', type: 'system' }, ...prev]);
  }, [user, quests, storyLog, weeklyProgress, activityLog, systemMessages, integrations, storeItems, allArcs, activeArcId, allBadges, majorGoals, lastLootboxClaim, chatHistory, journalEntries]);

  const handleUploadBackup = useCallback((file: File) => {
    if (!window.confirm("Are you sure you want to restore from this backup? All current progress for this user will be overwritten.")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') {
          throw new Error("File content is not readable.");
        }
        const parsedData = JSON.parse(content);
        const migratedData = migrateLoadedState(parsedData);
        
        setStateFromData(migratedData);
        
        setSystemMessages(prev => [{ id: `restore-${Date.now()}`, text: 'Data successfully restored from backup.', timestamp: 'Just now', type: 'system' }, ...prev]);
      } catch (err) {
        console.error("Failed to parse backup file:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error.";
        setSystemMessages(prev => [{ id: `restore-err-${Date.now()}`, text: `Failed to restore backup: ${errorMessage}`, timestamp: 'Just now', type: 'warning' }, ...prev]);
      }
    };

    reader.onerror = () => {
      console.error("Failed to read backup file.");
      setSystemMessages(prev => [{ id: `restore-err-${Date.now()}`, text: 'Failed to read the backup file.', timestamp: 'Just now', type: 'warning' }, ...prev]);
    };

    reader.readAsText(file);
  }, [setStateFromData]);
  
  const handleRestoreFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const content = event.target?.result;
            if (typeof content !== 'string') {
                throw new Error("File content is not readable.");
            }
            
            const parsedData = JSON.parse(content);
            const migratedData = migrateLoadedState(parsedData);
            setStateFromData(migratedData);
            setSystemMessages(prev => [{ id: `restore-login-${Date.now()}`, text: 'Data successfully loaded from file.', timestamp: 'Just now', type: 'system' }, ...prev]);

        } catch (err) {
             const errorMessage = err instanceof Error ? err.message : "Unknown error.";
             setError(`Failed to load backup: ${errorMessage}`);
        }
    };
    reader.onerror = () => {
        setError('Failed to read the backup file.');
    };
    reader.readAsText(file);
  };

  const handleGenerateRecommendations = useCallback(async () => {
    setIsRecommendationsModalOpen(true);
    setIsGeneratingRecommendations(true);
    setAiRecommendations(null);
    try {
      const recs = await generateRecommendations(apiKey, user, majorGoals);
      setAiRecommendations(recs);
    } catch(e) {
      console.error(e);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  }, [apiKey, user, majorGoals]);

  const handleSaveRecommendations = useCallback((
    selectedSkills: { name: string; realm: Realm }[],
    selectedTopics: { name: string; skillId: string }[]
  ) => {
      selectedSkills.forEach(skill => handleSaveSkill(skill));
      selectedTopics.forEach(topic => handleSaveTopic({ ...topic, difficulty: TopicDifficulty.Easy }));
      setIsRecommendationsModalOpen(false);
      setSystemMessages(prev => [{id: `recs-add-${Date.now()}`, text: 'AI recommendations have been added to your skill tree.', timestamp: 'Just now', type: 'info'}, ...prev]);
  }, [handleSaveSkill, handleSaveTopic]);

  const handleToggleSkillActive = useCallback((skillId: string) => {
      setUser(prev => {
          const newSkillTree = { ...prev.skill_tree };
          if(newSkillTree[skillId]) {
              newSkillTree[skillId].isActive = !newSkillTree[skillId].isActive;
          }
          return { ...prev, skill_tree: newSkillTree };
      });
  }, [setUser]);

  const handleUpdateSkillPriority = useCallback((skillId: string, priority: number) => {
      setUser(prev => {
          const newSkillTree = { ...prev.skill_tree };
          if(newSkillTree[skillId]) {
              newSkillTree[skillId].priority = priority;
          }
          return { ...prev, skill_tree: newSkillTree };
      });
  }, [setUser]);

  const handleDeleteTopic = useCallback((topicId: string) => {
    const topicToDelete = user.knowledgeBase[topicId];
    if (!topicToDelete) return;

    const updatedQuests = quests.map(q => ({
        ...q,
        knowledgeTopics: q.knowledgeTopics.filter(tId => tId !== topicId)
    }));
    
    const questsToRemoveIds = new Set<string>();
    const finalQuests = updatedQuests.filter(q => {
        if (q.knowledgeTopics.length === 0 && q.source !== 'user') {
            questsToRemoveIds.add(q.id);
            return false;
        }
        return true;
    });
    setQuests(finalQuests);

    const newKnowledgeBase = { ...user.knowledgeBase };
    delete newKnowledgeBase[topicId];
    
    const newSkillTree = recalculateSkillTree(user.skill_tree, newKnowledgeBase);

    setUser(prev => ({
        ...prev,
        knowledgeBase: newKnowledgeBase,
        skill_tree: newSkillTree,
    }));
    
    let message = `Knowledge topic "${topicToDelete.name}" was deleted.`;
    if (questsToRemoveIds.size > 0) {
        message += ` ${questsToRemoveIds.size} related quest(s) were removed.`;
    }
    setSystemMessages(prev => [{ id: `delete-topic-${Date.now()}`, text: message, timestamp: 'Just now', type: 'info' }, ...prev]);
  }, [user.knowledgeBase, user.skill_tree, quests, setUser]);

  const handleDeleteSkill = useCallback((skillId: string) => {
    const skillToDelete = user.skill_tree[skillId];
    if (!skillToDelete) return;

    const topicsToDeleteIds = (Object.values(user.knowledgeBase) as KnowledgeTopic[]).filter((topic) => topic.skillId === skillId).map((topic) => topic.id);
    const topicsToDeleteIdsSet = new Set(topicsToDeleteIds);

    const updatedQuests = quests.map(q => ({
        ...q,
        knowledgeTopics: q.knowledgeTopics.filter(tId => !topicsToDeleteIdsSet.has(tId))
    }));

    const questsToRemoveIds = new Set<string>();
    const finalQuests = updatedQuests.filter(q => {
        if (q.knowledgeTopics.length === 0 && q.source !== 'user') {
            questsToRemoveIds.add(q.id);
            return false;
        }
        return true;
    });
    setQuests(finalQuests);
    
    const newKnowledgeBase = { ...user.knowledgeBase };
    topicsToDeleteIds.forEach(id => delete newKnowledgeBase[id]);

    const newSkillTree = { ...user.skill_tree };
    delete newSkillTree[skillId];

    setUser(prev => ({
        ...prev,
        skill_tree: newSkillTree,
        knowledgeBase: newKnowledgeBase,
    }));
    
    let message = `Skill "${skillToDelete.name}" and its ${topicsToDeleteIds.length} topics were deleted.`;
    if (questsToRemoveIds.size > 0) {
        message += ` ${questsToRemoveIds.size} related quest(s) were removed.`;
    }
    setSystemMessages(prev => [{ id: `delete-skill-${Date.now()}`, text: message, timestamp: 'Just now', type: 'info' }, ...prev]);
  }, [user.skill_tree, user.knowledgeBase, quests, setUser]);

  // --- START: HANDLERS FOR TESTING PANEL ---
  const handleAddXp = (amount: number) => {
    handleGrantReward(amount, 0, Realm.Meta, 'dev-xp');
  };

  const handleAddCredits = (amount: number) => {
    handleGrantReward(0, amount, Realm.Meta, 'dev-credits');
  };

  const handleAddGems = (amount: number) => {
    setUser(prev => ({ ...prev, wallet: { ...prev.wallet, gems: prev.wallet.gems + amount }}));
  };

  const handleSetStat = (realm: Realm, value: number) => {
    setUser(prev => ({ ...prev, stats: { ...prev.stats, [realm]: value }}));
  };

  const handleSetStreak = (streak: number) => {
    setUser(prev => ({ ...prev, streaks: { ...prev.streaks, daily_streak: streak } }));
  };

  const handleResetLootbox = () => {
    setLastLootboxClaim(null);
  };
  
  const handleSimpleReset = useCallback(() => {
    setStateFromData({ user: INITIAL_USER });
  }, [setStateFromData]);


  const handleAddItemToInventory = (itemId: string) => {
    setUser(prev => {
        const newInventory = [...prev.inventory];
        const existingItem = newInventory.find(i => i.itemId === itemId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            newInventory.push({ itemId: itemId, quantity: 1 });
        }
        return { ...prev, inventory: newInventory };
    });
  };

  const handleAddSkillXp = (skillId: string, amount: number) => {
    setUser(prev => {
        const newSkillTree = { ...prev.skill_tree };
        const skill = newSkillTree[skillId];
        if (!skill) return prev;
        
        let currentTotalXp = getTotalXpForSkill(skill);
        let newTotalXp = currentTotalXp + amount;
        
        let newLevel = 1;
        let xpForNext = getXpThresholdForSkillLevel(1, skill.xpScale);

        while (newTotalXp >= xpForNext) {
            newTotalXp -= xpForNext;
            newLevel++;
            xpForNext = getXpThresholdForSkillLevel(newLevel, skill.xpScale);
        }

        newSkillTree[skillId] = {
            ...skill,
            level: newLevel,
            xp: Math.floor(newTotalXp),
            xpToNextLevel: xpForNext,
        };
        return { ...prev, skill_tree: newSkillTree };
    });
  };

  const handleAddDevQuest = (type: 'timed' | 'mystery') => {
    const deadline = getFutureDateWithOffset(getCurrentDate(), 1);
    const newQuest: Quest = {
        id: `dev-quest-${Date.now()}`,
        title: type === 'mystery' ? 'A Mysterious Objective' : 'A Time-Sensitive Task',
        description: `This is a developer-generated quest.`,
        realm: Realm.Meta,
        knowledgeTopics: [],
        xp_reward: 50,
        credit_reward: 25,
        difficulty: Difficulty.Medium,
        duration_est_min: 60,
        status: QuestStatus.Pending,
        isMystery: type === 'mystery',
        deadline: deadline.toISOString(),
        penalty: { type: 'xp', amount: 15 },
        source: 'ai_system',
    };
    setQuests(prev => [newQuest, ...prev]);
  };

  const handleRunDiagnostics = (): string[] => {
    const issues: string[] = [];
    quests.forEach(q => { q.knowledgeTopics.forEach(topicId => { if (!user.knowledgeBase[topicId]) issues.push(`Quest "${q.title}" links to missing topic ID: ${topicId}`); }); });
    (Object.values(user.knowledgeBase) as KnowledgeTopic[]).forEach(topic => { if (!user.skill_tree[topic.skillId]) issues.push(`Topic "${topic.name}" links to missing skill ID: ${topic.skillId}`); });
    user.inventory.forEach(invItem => { if (!storeItems.find(storeItem => storeItem.id === invItem.itemId)) issues.push(`Inventory has missing item ID: ${invItem.itemId}`); });
    user.unlockedBadges.forEach(badgeId => { if (!allBadges.find(b => b.id === badgeId)) issues.push(`User has missing badge ID: ${badgeId}`); });
    majorGoals.forEach(g => { if(g.skillId && !user.skill_tree[g.skillId]) issues.push(`Major Goal "${g.title}" links to missing skill ID: ${g.skillId}`); });
    return issues;
  };

  const handleInduceAnomaly = () => {
    const randomItem = storeItems[Math.floor(Math.random() * storeItems.length)];
    if (!randomItem) return;
    setUser(prev => ({ ...prev, inventory: [...prev.inventory, { itemId: randomItem.id, quantity: -1 }] }));
    setSystemMessages(prev => [{ id: `anomaly-${Date.now()}`, text: 'Anomaly induced: Negative item quantity.', timestamp: 'Just now', type: 'warning'}, ...prev]);
  };
  // --- END: HANDLERS FOR TESTING PANEL ---

  const activeMajorGoals = majorGoals.filter(goal => {
      if (goal.skillId) {
          const skill = user.skill_tree[goal.skillId];
          if (skill && !skill.isActive) {
              return false;
          }
      }
      return true;
  });

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard user={user} quests={quests} activeArc={user.activeArc} majorGoals={activeMajorGoals} onCompleteQuest={handleCompleteQuest} onGenerateQuests={handleGenerateQuests} isLoading={isLoadingQuests} error={error} onOpenLootbox={handleOpenLootbox} isLootboxClaimed={lastLootboxClaim === getCurrentDate().toISOString().split('T')[0]} onAddQuestClick={() => setIsAddQuestModalOpen(true)} onAddMajorGoal={() => setIsMajorGoalModalOpen(true)} onBulkAddMajorGoal={() => setIsBulkGoalModalOpen(true)} onEditMajorGoal={(goal) => { setEditingMajorGoal(goal); setIsMajorGoalModalOpen(true); }} onCompleteMajorGoal={handleCompleteMajorGoal} onSyllabusBreakdown={handleBreakdownSyllabus} currentDate={getCurrentDate()} />;
      case 'skill_tree': return <SkillTree user={user} onUpdateTopicDifficulty={handleUpdateTopicDifficulty} onAddSkill={() => setIsSkillModalOpen(true)} onEditSkill={(skill) => { setEditingSkill(skill); setIsSkillModalOpen(true); }} onDeleteSkill={handleDeleteSkill} onAddTopicToSkill={(skillId) => { setDefaultSkillForTopic(skillId); setIsTopicModalOpen(true); }} onEditTopic={(topic) => { setEditingTopic(topic); setIsTopicModalOpen(true); }} onDeleteTopic={handleDeleteTopic} onOpenBulkAddModal={(skill) => { setSkillForBulkAdd(skill); setIsBulkAddModalOpen(true); }} onUpdateSkillPriority={handleUpdateSkillPriority} onToggleSkillActive={handleToggleSkillActive} onGenerateRecommendations={handleGenerateRecommendations} />;
      case 'chatbot': return <Chatbot history={chatHistory} onSendMessage={handleSendMessage} isLoading={isChatbotLoading} completedMajorGoals={user.completedMajorGoals || []} onJournalSubmit={handleJournalSubmit} />;
      case 'inventory': return <Inventory inventory={user.inventory} storeItems={storeItems} onUseItem={handleUseItem} />;
      case 'store': return <Store items={storeItems} onBuyItem={handleBuyItem} userCredits={user.wallet.credits} onAddItem={() => setIsStoreItemModalOpen(true)} onEditItem={(item) => { setEditingStoreItem(item); setIsStoreItemModalOpen(true); }} onDeleteItem={handleDeleteStoreItem} />;
      case 'staking': return <Staking user={user} storeItems={storeItems} onStakeCredits={handleStakeCredits} onWithdrawCredits={handleWithdrawCredits} onStakeBuff={handleStakeBuff} />;
      case 'system_log': return <SystemLog messages={systemMessages} />;
      case 'analytics': return <Analytics user={user} weeklyProgress={weeklyProgress} activityLog={activityLog} currentDate={getCurrentDate()} />;
      case 'story_log': return <StoryLog entries={storyLog} />;
      case 'journal': return <Journal journalEntries={journalEntries} quests={quests} onCompleteQuest={handleCompleteQuest} currentDate={getCurrentDate()} />;
      case 'timer': return <Timer activeQuest={user.activeTimedQuest || null} onStartQuest={handleStartTimedQuest} onCompleteQuest={handleCompleteTimedQuest} apiKey={apiKey} />;
      case 'badges': return <Badges user={user} allBadges={allBadges} onAddBadge={() => setIsBadgeModalOpen(true)} onEditBadge={(badge) => { setEditingBadge(badge); setIsBadgeModalOpen(true); }} onDeleteBadge={handleDeleteBadge} />;
      case 'more': return <Menu onNavigate={setView} />;
      default: return <Dashboard user={user} quests={quests} activeArc={user.activeArc} majorGoals={activeMajorGoals} onCompleteQuest={handleCompleteQuest} onGenerateQuests={handleGenerateQuests} isLoading={isLoadingQuests} error={error} onOpenLootbox={handleOpenLootbox} isLootboxClaimed={lastLootboxClaim === getCurrentDate().toISOString().split('T')[0]} onAddQuestClick={() => setIsAddQuestModalOpen(true)} onAddMajorGoal={() => setIsMajorGoalModalOpen(true)} onBulkAddMajorGoal={() => setIsBulkGoalModalOpen(true)} onEditMajorGoal={(goal) => { setEditingMajorGoal(goal); setIsMajorGoalModalOpen(true); }} onCompleteMajorGoal={handleCompleteMajorGoal} onSyllabusBreakdown={handleBreakdownSyllabus} currentDate={getCurrentDate()} />;
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } }
  };
  
  const navItems: { view: View, label: string, icon: React.ElementType }[] = [
      { view: 'dashboard', label: 'Quests', icon: LayoutDashboard },
      { view: 'skill_tree', label: 'Skills', icon: TreeDeciduous },
      { view: 'chatbot', label: 'Chat', icon: BotMessageSquare },
      { view: 'inventory', label: 'Inventory', icon: Package },
      { view: 'more', label: 'More', icon: MoreHorizontal },
  ];
  
  if (isApiKeyModalOpen) {
    return <EnterApiKeyModal onSave={handleSaveApiKey} />;
  }

  if (isNameEntryModalOpen) {
    return <NameEntryModal onSave={handleSaveName} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-background overflow-hidden relative">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 md:w-24 lg:w-64 bg-primary/80 backdrop-blur-3xl border-r border-white/5 shadow-[8px_0_32px_rgba(0,0,0,0.3)] z-50 shrink-0">
        <div className="p-4 md:p-2 lg:p-4 border-b border-white/5 flex items-center justify-center lg:justify-start gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-tertiary flex items-center justify-center shadow-glow-primary shrink-0">
                 <Dna className="w-6 h-6 text-white" />
             </div>
             <span className="font-black text-xl tracking-tight text-white hidden lg:block">Level-Up</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
           {navItems.map(item => (
             <button key={item.view} onClick={() => setView(item.view)} className={`flex items-center w-full px-3 py-3 rounded-xl transition-all duration-300 group ${view === item.view ? 'bg-accent-primary/15 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] text-white relative' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}>
                {view === item.view && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-primary rounded-r-md shadow-glow-primary"></div>}
                <item.icon size={22} className={`shrink-0 md:mx-auto lg:mx-0 ${view === item.view ? 'text-accent-primary drop-shadow-sm' : 'group-hover:text-text-primary'}`} />
                <span className={`ml-4 font-bold tracking-wide text-sm hidden lg:block ${view === item.view ? 'uppercase' : ''}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0">
          <main className="flex-grow overflow-y-auto custom-scrollbar relative flex flex-col">
            <Header user={user} userPicture={userPicture} onSettingsClick={() => setIsSettingsOpen(true)} syncStatus={syncStatus} />
            <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-0 sm:pt-0 lg:pt-0 w-full min-h-min relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full h-full absolute inset-0 pt-0 sm:pt-0 lg:pt-0 px-4 sm:px-6 lg:px-8 pb-32"
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
      </div>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <footer className="md:hidden flex-shrink-0 bg-primary/80 backdrop-blur-3xl border-t border-white/5 p-2 z-40 shadow-[0_-8px_32px_rgba(0,0,0,0.4)] relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <nav className="max-w-7xl mx-auto flex justify-around relative z-10">
          {navItems.map(item => (
             <button key={item.view} onClick={() => setView(item.view)} className={`flex flex-col items-center justify-center w-full p-2 rounded-xl transition-all duration-300 ${view === item.view ? 'text-accent-primary bg-accent-primary/10 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)] -translate-y-1' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'}`}>
                <item.icon size={24} className={view === item.view ? 'drop-shadow-sm' : ''} />
                <span className={`text-[10px] mt-1 font-bold tracking-wide ${view === item.view ? 'uppercase' : ''}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </footer>

      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} integrations={integrations} onIntegrationToggle={handleIntegrationToggle} allArcs={allArcs} activeArcId={activeArcId} onSetActiveArc={handleSetActiveArc} onDeleteArc={handleDeleteArc} onOpenArcModal={() => setIsArcModalOpen(true)} userState={user.state} onUpdateUserState={handleUpdateUserState} onDownloadBackup={handleDownloadBackup} onUploadBackup={handleUploadBackup} onResetData={handleResetData} userName={user.name} userPicture={userPicture} onProfilePictureChange={handleProfilePictureChange} apiKey={apiKey} onSaveApiKey={handleSaveApiKey} />}
      {isAddQuestModalOpen && <AddQuestModal isOpen={isAddQuestModalOpen} onClose={() => setIsAddQuestModalOpen(false)} onAddQuest={handleAddPersonalQuest} apiKey={apiKey} />}
      {isSkillModalOpen && <AddEditSkillModal isOpen={isSkillModalOpen} onClose={() => { setIsSkillModalOpen(false); setEditingSkill(null); }} onSave={handleSaveSkill} skillToEdit={editingSkill} apiKey={apiKey} />}
      {isTopicModalOpen && <AddEditTopicModal isOpen={isTopicModalOpen} onClose={() => { setIsTopicModalOpen(false); setEditingTopic(null); setDefaultSkillForTopic(undefined); }} onSave={handleSaveTopic} topicToEdit={editingTopic} skills={Object.values(user.skill_tree)} defaultSkillId={defaultSkillForTopic} apiKey={apiKey} />}
      {isBulkAddModalOpen && <AddBulkTopicsModal isOpen={isBulkAddModalOpen} onClose={() => { setIsBulkAddModalOpen(false); setSkillForBulkAdd(null); }} skill={skillForBulkAdd} onSaveTopics={handleSaveBulkTopics} onGenerateTopics={(skill) => generateKnowledgeTopics(apiKey, skill)} />}
      {isMajorGoalModalOpen && <AddEditMajorGoalModal isOpen={isMajorGoalModalOpen} onClose={() => { setIsMajorGoalModalOpen(false); setEditingMajorGoal(null); }} onSave={handleSaveMajorGoal} goalToEdit={editingMajorGoal} skills={Object.values(user.skill_tree)} apiKey={apiKey} />}
      {isBulkGoalModalOpen && <BulkAddMajorGoalsModal isOpen={isBulkGoalModalOpen} onClose={() => setIsBulkGoalModalOpen(false)} onSave={handleSaveBulkMajorGoals} user={user} xpForNextSixLevels={calculateXpForNextNLevels(user.level_overall, 6)} apiKey={apiKey} />}
      {isBreakdownModalOpen && <SyllabusBreakdownModal isOpen={isBreakdownModalOpen} onClose={() => setIsBreakdownModalOpen(false)} goal={goalForBreakdown} isLoading={isGeneratingTopics} generatedTopics={generatedTopics} onConfirm={(selected) => handleSaveBulkTopics(goalForBreakdown!.skillId!, selected)} />}
      {isArcModalOpen && <AddEditArcModal isOpen={isArcModalOpen} onClose={() => setIsArcModalOpen(false)} onSave={handleSaveArc} apiKey={apiKey} />}
      {isBadgeModalOpen && <AddEditBadgeModal isOpen={isBadgeModalOpen} onClose={() => setIsBadgeModalOpen(false)} onSave={handleSaveBadge} badgeToEdit={editingBadge} onGenerateBadge={(prompt) => generateBadge(apiKey, prompt)} />}
      {isStoreItemModalOpen && <AddStoreItemModal isOpen={isStoreItemModalOpen} onClose={() => setIsStoreItemModalOpen(false)} onSave={handleSaveStoreItem} itemToEdit={editingStoreItem} user={user} apiKey={apiKey} />}
      {isRecommendationsModalOpen && <RecommendationsModal isOpen={isRecommendationsModalOpen} onClose={() => setIsRecommendationsModalOpen(false)} recommendations={aiRecommendations} onSave={handleSaveRecommendations} isLoading={isGeneratingRecommendations} userSkills={user.skill_tree} />}

      {levelUpData && <LevelUpAnimation level={levelUpData.level} rank={levelUpData.rank} onClose={() => setLevelUpData(null)} />}
      <RewardToast notifications={rewardNotifications} onRemove={(id) => setRewardNotifications(prev => prev.filter(n => n.id !== id))} />
    </div>
  );
};

export default App;