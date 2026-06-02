import React, { useState } from 'react';
import { User, Skill, Realm, KnowledgeTopic, TopicDifficulty } from '../types';
import { BrainCircuit, Heart, Zap, Sparkles, Edit, Trash2, PlusCircle, Layers, Wand2, Search, BookText, Users, Shield, Award, Mic2, ClipboardList, Code, Hammer, Globe } from 'lucide-react';
import { TOPIC_XP_MAP } from '../constants';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getAwardProfile } from '../data/awardProfiles';
import { ALL_MEMBERS } from '../data/members';
import type { AwardType } from '../data/members';

interface SkillTreeProps {
  user: User;
  onUpdateTopicDifficulty: (topicId: string, difficulty: TopicDifficulty) => void;
  onAddSkill: () => void;
  onEditSkill: (skill: Skill) => void;
  onDeleteSkill: (skillId: string) => void;
  onAddTopicToSkill: (skillId: string) => void;
  onEditTopic: (topic: KnowledgeTopic) => void;
  onDeleteTopic: (topicId: string) => void;
  onOpenBulkAddModal: (skill: Skill) => void;
  onUpdateSkillPriority: (skillId: string, priority: number) => void;
  onToggleSkillActive: (skillId: string) => void;
  onGenerateRecommendations: () => void;
  
  // Technician role view & initial levels setting props
  currentUserRole?: string;
  currentUser?: string;
  selectedMemberUsername?: string;
  onMemberChange?: (username: string) => void;
  onConfirmInitialLevels?: () => void;
  onAdjustInitialSkillLevel?: (skillId: string, delta: number) => void;
  onAdjustRealmLevel?: (realm: string, level: number) => void;
  onUnlockInitialLevels?: () => void;
}

const realmConfig = {
  [Realm.TechnicalWriting]: { icon: <BookText size={20} />,    color: "text-slate-400" },
  [Realm.Networking]:       { icon: <Users size={20} />,       color: "text-emerald-400" },
  [Realm.Oratory]:          { icon: <Mic2 size={20} />,        color: "text-rose-400" },
  [Realm.Planning]:         { icon: <ClipboardList size={20} />, color: "text-amber-400" },
  [Realm.Creativity]:       { icon: <Zap size={20} />,         color: "text-violet-400" },
  [Realm.Programming]:      { icon: <Code size={20} />,        color: "text-blue-400" },
  [Realm.Engineering]:      { icon: <Hammer size={20} />,      color: "text-orange-400" },
  [Realm.FirstCulture]:     { icon: <Globe size={20} />,       color: "text-cyan-400" },
};

const DifficultyButton: React.FC<{ level: TopicDifficulty; current: TopicDifficulty; label: string; colorClass: string; onClick: () => void }> = ({ level, current, label, colorClass, onClick }) => {
    const isActive = level === current;
    return (
        <button 
            onClick={onClick} 
            className={`w-6 h-6 text-xs font-bold rounded transition-all duration-200 ${isActive ? `${colorClass} text-white shadow-md` : 'bg-border-color text-text-secondary hover:bg-opacity-80'}`}
        >
            {label}
        </button>
    )
};

interface SkillCardProps {
  skill: Skill; 
  topics: KnowledgeTopic[]; 
  onUpdateTopicDifficulty: (topicId: string, difficulty: TopicDifficulty) => void;
  onEditSkill: (skill: Skill) => void;
  onDeleteSkill: (skillId: string) => void;
  onAddTopicToSkill: (skillId: string) => void;
  onEditTopic: (topic: KnowledgeTopic) => void;
  onDeleteTopic: (topicId: string) => void;
  onOpenBulkAddModal: (skill: Skill) => void;
  onUpdateSkillPriority: (skillId: string, priority: number) => void;
  onToggleSkillActive: (skillId: string) => void;
  
  // Initial levels configuration props
  isInitialEditActive?: boolean;
  onAdjustInitialSkillLevel?: (skillId: string, delta: number) => void;
}

const SkillCard: React.FC<SkillCardProps> = (props) => {
  const { t } = useTranslation(['skills', 'common']);
  const { 
    skill, topics, onUpdateTopicDifficulty, onEditSkill, onDeleteSkill, 
    onAddTopicToSkill, onEditTopic, onDeleteTopic, onOpenBulkAddModal, 
    onUpdateSkillPriority, onToggleSkillActive, isInitialEditActive, onAdjustInitialSkillLevel 
  } = props;
  const config = realmConfig[skill.realm] || realmConfig[Realm.Planning];
  const progress = (skill.xp / skill.xpToNextLevel) * 100;

  const difficultyConfig: { level: TopicDifficulty; label: string; colorClass: string }[] = [
    { level: TopicDifficulty.Easy,      label: t('common:topic_difficulty.easy')[0].toUpperCase(),      colorClass: 'bg-accent-green' },
    { level: TopicDifficulty.Medium,    label: t('common:topic_difficulty.medium')[0].toUpperCase(),    colorClass: 'bg-accent-secondary' },
    { level: TopicDifficulty.Hard,      label: t('common:topic_difficulty.hard')[0].toUpperCase(),      colorClass: 'bg-accent-red' },
    { level: TopicDifficulty.SuperHard, label: t('common:topic_difficulty.super_hard')[0].toUpperCase(),colorClass: 'bg-accent-tertiary' },
  ];

  const priorityLabels: { [key: number]: string } = {
    1: t('common:difficulty.Easy'), 2: t('common:difficulty.Medium'), 3: t('common:difficulty.Medium'), 4: t('common:difficulty.Hard'), 5: t('common:difficulty.Legendary'),
  };
  const priorityColors: { [key: number]: string } = {
    1: 'text-text-muted', 2: 'text-text-secondary', 3: 'text-text-primary', 4: 'text-accent-primary', 5: 'text-accent-tertiary',
  };

  return (
    <motion.div 
      className={`bg-primary/40 p-5 rounded-2xl border border-white/5 flex flex-col transition-all duration-300 backdrop-blur-md shadow-glass hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-white/10 ${!skill.isActive ? 'opacity-50 grayscale-[0.5]' : ''}`}
      layout
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center space-x-3 font-black text-xl tracking-tight ${config.color}`}>
          <div className="p-2 bg-white/5 rounded-xl border border-white/10 shadow-sm">{config.icon}</div>
          <h3>{skill.name}</h3>
        </div>
        <div className='flex items-center space-x-2'>
            {isInitialEditActive && onAdjustInitialSkillLevel ? (
              <div className="flex items-center gap-1 mr-2 select-none p-1 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <button 
                  onClick={() => onAdjustInitialSkillLevel(skill.id, -1)} 
                  type="button"
                  aria-label="Diminuir nível"
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-base hover:bg-red-500/20 hover:border-red-500/40 active:scale-90 text-text-secondary hover:text-red-300 transition-all duration-200"
                >
                  −
                </button>
                <span className="font-black text-sm bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/40 text-amber-300 shadow-sm min-w-[52px] text-center">
                  Nv {skill.level}
                </span>
                <button 
                  onClick={() => onAdjustInitialSkillLevel(skill.id, 1)} 
                  type="button"
                  aria-label="Aumentar nível"
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-base hover:bg-green-500/20 hover:border-green-500/40 active:scale-90 text-text-secondary hover:text-green-300 transition-all duration-200"
                >
                  +
                </button>
              </div>
            ) : (
              <span className="font-black text-lg bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 text-white shadow-sm mr-2">{t('skill_level', { level: skill.level })}</span>
            )}
            <button title={t('common:states.active')} onClick={() => onToggleSkillActive(skill.id)} className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${skill.isActive ? 'bg-accent-primary' : 'bg-white/20'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${skill.isActive ? 'translate-x-4' : 'translate-x-0'}`}/>
            </button>
            <button onClick={() => onEditSkill(skill)} className="p-1.5 rounded-md text-text-secondary hover:bg-white/10 hover:text-white transition-colors"><Edit size={16} /></button>
            <button onClick={() => onDeleteSkill(skill.id)} className="p-1.5 rounded-md text-text-secondary hover:bg-accent-red/20 hover:text-accent-red transition-colors"><Trash2 size={16} /></button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase text-text-secondary mb-1.5 items-center">
            <span>{t('total_xp')}</span>
            <span className="text-white">{skill.xp} / {skill.xpToNextLevel}</span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-2.5 border border-white/5 p-px shadow-inner overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${config.color.replace('text', 'bg')} rounded-full relative shadow-glow-primary`}
          >
             <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"></div>
          </motion.div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/5 mb-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
          <Sparkles size={12} className={priorityColors[skill.priority]} />
          {t('skill_priority')}
        </h4>
        <span className={`text-sm font-black tracking-wide ${priorityColors[skill.priority]}`}>{priorityLabels[skill.priority]}</span>
      </div>
      
      <div className="mt-4 border-t border-border-color pt-3 flex-grow flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-text-secondary">{t('no_topics')}</h4>
             <div className="flex items-center space-x-1">
                <button onClick={() => onAddTopicToSkill(skill.id)} className="text-text-secondary hover:text-accent-primary transition-colors" aria-label={t('add_topic')}><PlusCircle size={18} /></button>
                <button onClick={() => onOpenBulkAddModal(skill)} className="text-text-secondary hover:text-accent-primary transition-colors" aria-label={t('bulk_add_topics')}><Layers size={18} /></button>
            </div>
          </div>
          {topics.length > 0 ? (
            <div className="space-y-2 flex-grow">
                {topics.map(topic => (
                    <div key={topic.id} className="border-t border-white/5 py-2.5 px-1 hover:bg-white/5 transition-colors rounded">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-text-primary font-medium">{topic.name}</p>
                                <p className="text-xs font-semibold text-text-secondary">{t(`common:topic_difficulty.${topic.difficulty.toLowerCase().replace(' ', '_')}`)}</p>
                            </div>
                            <div className="flex items-center space-x-1.5 opacity-80 hover:opacity-100 transition-opacity">
                                {difficultyConfig.map(d => (
                                    <DifficultyButton key={d.level} level={d.level} current={topic.difficulty} label={d.label} colorClass={d.colorClass} onClick={() => onUpdateTopicDifficulty(topic.id, d.level)} />
                                ))}
                                <button onClick={() => onEditTopic(topic)} className="text-text-secondary hover:text-white ml-2"><Edit size={14} /></button>
                                <button onClick={() => onDeleteTopic(topic.id)} className="text-text-secondary hover:text-accent-red"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
           ) : (
                <div className="text-center py-4 flex-grow flex items-center justify-center bg-white/5 rounded-lg border border-dashed border-white/10 mt-2">
                    <p className="text-xs text-text-muted italic">{t('no_topics')}</p>
                </div>
            )}
      </div>
    </motion.div>
  );
};

const SkillTree: React.FC<SkillTreeProps> = (props) => {
  const { t } = useTranslation(['skills', 'common']);
  const { 
    user, onUpdateTopicDifficulty, onAddSkill, onEditSkill, onDeleteSkill, 
    onAddTopicToSkill, onEditTopic, onDeleteTopic, onOpenBulkAddModal, 
    onUpdateSkillPriority, onToggleSkillActive, onGenerateRecommendations,
    currentUserRole, currentUser, selectedMemberUsername, onMemberChange,
    onConfirmInitialLevels, onAdjustInitialSkillLevel, onAdjustRealmLevel, onUnlockInitialLevels
  } = props;
  const [searchQuery, setSearchQuery] = useState('');

  const skillsByRealm = Object.values(user.skill_tree).reduce((acc: Record<Realm, Skill[]>, skill: Skill) => {
    const realm = skill.realm || Realm.Planning;
    if (!acc[realm]) acc[realm] = [];
    acc[realm].push(skill);
    return acc;
  }, {} as Record<Realm, Skill[]>);

  const topicsBySkillId = Object.values(user.knowledgeBase).reduce((acc: Record<string, KnowledgeTopic[]>, topic: KnowledgeTopic) => {
    if (!acc[topic.skillId]) acc[topic.skillId] = [];
    acc[topic.skillId].push(topic);
    return acc;
  }, {} as Record<string, KnowledgeTopic[]>);

  const filteredSkillsByRealm = Object.entries(skillsByRealm).reduce((acc, [realm, skills]) => {
    const filteredSkills = skills.map(skill => {
      const allTopics = topicsBySkillId[skill.id] || [];
      if (!searchQuery) return { skill, topics: allTopics };
      const skillNameMatches = skill.name.toLowerCase().includes(searchQuery);
      const matchingTopics = allTopics.filter(topic => topic.name.toLowerCase().includes(searchQuery));
      if (skillNameMatches) return { skill, topics: allTopics };
      if (matchingTopics.length > 0) return { skill, topics: matchingTopics };
      return null;
    }).filter(Boolean) as { skill: Skill; topics: KnowledgeTopic[] }[];

    if (filteredSkills.length > 0) acc[realm as Realm] = filteredSkills;
    return acc;
  }, {} as Record<Realm, { skill: Skill; topics: KnowledgeTopic[] }[]>);

  const awardType = user.awardFocus as AwardType;
  const awardProfile = awardType ? getAwardProfile(awardType) : null;
  
  const radarData = Object.values(Realm).map(realm => {
      const skillsInRealm = skillsByRealm[realm as Realm] || [];
      const totalLevel = skillsInRealm.reduce((sum, skill) => sum + skill.level, 0);
      const subject = t(`common:realm.${realm}`);
      const val = totalLevel + Math.floor(user.level_overall / 4); 
      return { subject, A: val, fullMark: Math.max(30, val + 5) };
  });

  const maxScore = Math.max(...radarData.map(d => d.A), 10);
  const chartDomain = [0, maxScore + (maxScore * 0.2)];

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  // True whenever a technician is viewing another member's tree (regardless of lock state)
  const isTechnicianViewingMember = currentUserRole === 'technician' && selectedMemberUsername !== undefined && selectedMemberUsername !== currentUser;

  // True when the technician can actively set initial levels (unlocked state)
  const isInitialEditActive = isTechnicianViewingMember && !user.initialLevelsSet;

  // Show the realm panel whenever technician is viewing a member AND levels are unlocked
  const showRealmPanel = isInitialEditActive && !!onAdjustRealmLevel;

  // Compute average level per realm for the realm panel
  const realmAverageLevels = Object.values(Realm).reduce((acc, realm) => {
    const skills = skillsByRealm[realm as Realm] || [];
    if (skills.length === 0) { acc[realm] = 1; return acc; }
    const avg = Math.round(skills.reduce((s, sk) => s + sk.level, 0) / skills.length);
    acc[realm] = avg;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      
      {/* 1. Technician Member Selection Dropdown */}
      {currentUserRole === 'technician' && onMemberChange && (
        <div className="max-w-xs mx-auto mb-2 p-4 rounded-2xl border border-white/5 bg-primary/30 backdrop-blur-md flex flex-col gap-2 shadow-inner">
          <label className="text-[10px] uppercase tracking-widest font-black text-text-muted text-center flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-accent-primary" /> Visualizar Árvore do Competidor
          </label>
          <select
            value={selectedMemberUsername || ''}
            onChange={(e) => onMemberChange(e.target.value)}
            style={{ backgroundColor: '#18181b', color: '#ffffff' }}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary transition-all duration-300 cursor-pointer"
          >
            {ALL_MEMBERS.filter(m => m.role === 'member').map(m => (
              <option key={m.username} value={m.username} style={{ backgroundColor: '#18181b', color: '#ffffff' }}>
                {m.displayName} ({m.awardFocus || 'Geral'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 2. Banner: Technician setting initial levels */}
      {isInitialEditActive && onConfirmInitialLevels && (
        <div className="max-w-2xl mx-auto mb-8 p-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 backdrop-blur-md flex flex-col gap-4 shadow-glass">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-left">
              <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                ⚠️ Modo de Ajuste de Níveis Iniciais — ATIVO
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                Defina o nível atual de cada habilidade de <strong className="text-white">{user.name}</strong> abaixo usando os botões <span className="inline-flex items-center gap-0.5 bg-white/10 px-1.5 py-0.5 rounded font-black text-amber-300">−</span> e <span className="inline-flex items-center gap-0.5 bg-white/10 px-1.5 py-0.5 rounded font-black text-amber-300">+</span> em cada card de habilidade.
              </p>
            </div>
            <button
              onClick={onConfirmInitialLevels}
              type="button"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shrink-0"
            >
              ✓ Confirmar e Travar Níveis de {user.name}
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-300/70 bg-amber-500/10 rounded-xl px-4 py-2 border border-amber-500/10">
            <span>👇</span>
            <span>Cada card abaixo tem os botões <strong>−</strong> e <strong>+</strong> ao lado do nível para ajustar. Mínimo: 1 · Máximo: 10</span>
          </div>
        </div>
      )}

      {/* 3. Info Banner: Member waiting for setup */}
      {currentUserRole === 'member' && !user.initialLevelsSet && (
        <div className="max-w-xl mx-auto mb-8 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center shadow-glass">
          <h4 className="text-sm text-amber-400 font-black uppercase tracking-wider flex items-center justify-center gap-2">
            ⚠️ Aguardando Definição de Níveis Iniciais
          </h4>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            Seus níveis de habilidade iniciais ainda não foram configurados pelo Técnico. A progressão de XP e a conclusão de missões e tarefas serão liberadas assim que seus níveis iniciais forem travados.
          </p>
        </div>
      )}

      {/* 4. Success State: Levels Locked — show prominent unlock button */}
      {currentUserRole === 'technician' && user.initialLevelsSet && user.name !== currentUser && (
        <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-center shadow-glass flex flex-col items-center gap-3">
          <p className="text-sm text-emerald-400 font-black flex items-center gap-2">
            🔒 Níveis iniciais de <span className="text-white">{user.name}</span> definidos e bloqueados.
          </p>
          {onUnlockInitialLevels && (
            <button
              onClick={onUnlockInitialLevels}
              type="button"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-amber-400 hover:text-amber-300 font-black text-xs uppercase tracking-wider py-2 px-5 rounded-xl transition-all duration-300 active:scale-95 hover:shadow-md"
            >
              🔓 Destravar para Reajustar Níveis
            </button>
          )}
        </div>
      )}

      <div className='text-center'>
        <h2 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">
          {t('skill_tree')} {user.name !== currentUser ? `— ${user.name}` : ''}
        </h2>
        <p className="text-text-secondary mb-6">{t('skill_tree_subtitle')}</p>
        
        <motion.div variants={itemVariants} className="w-full max-w-2xl mx-auto h-[350px] sm:h-[400px] bg-primary/20 backdrop-blur-xl border border-white/5 rounded-3xl p-4 shadow-glass mb-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-accent-primary/5 to-transparent pointer-events-none"></div>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={chartDomain} tick={false} axisLine={false} />
                    <Radar name={t('realm_radar')} dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="rgba(59, 130, 246, 0.4)" fillOpacity={0.6} dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1 }} activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)', color: '#fff', padding: '10px 15px' }} itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }} labelStyle={{ color: '#94a3b8', marginBottom: '5px' }} formatter={(value: number) => [`${t('skill_level', { level: value })}`, t('realm_radar')]} />
                </RadarChart>
            </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-center items-center gap-3 sm:gap-4 mb-8 flex-wrap">
            <button onClick={onAddSkill} className="flex items-center space-x-2 bg-gradient-to-r from-accent-green to-emerald-500 hover:from-emerald-500 hover:to-accent-green text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-glow-primary hover:shadow-glow-secondary active:scale-95 border border-white/10">
                <PlusCircle size={18} />
                <span>{t('add_skill')}</span>
            </button>
             <button onClick={onGenerateRecommendations} className="flex items-center space-x-2 bg-gradient-to-r from-accent-tertiary to-purple-500 hover:from-purple-500 hover:to-accent-tertiary text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-glow-tertiary hover:shadow-glow-primary active:scale-95 border border-white/10">
                <Wand2 size={18} />
                <span>{t('generate_topics')}</span>
            </button>
        </motion.div>
        
        <motion.div variants={itemVariants} className="max-w-xl mx-auto mb-10">
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-primary to-accent-tertiary rounded-full opacity-30 group-hover:opacity-60 blur transition duration-500"></div>
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-primary transition-colors" />
                    <input
                        type="text"
                        placeholder={`${t('topic_name')}...`}
                        onChange={e => setSearchQuery(e.target.value.toLowerCase())}
                        className="w-full bg-primary/80 backdrop-blur-md border border-white/10 rounded-full py-3.5 pl-14 pr-6 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary shadow-inner text-sm font-medium transition-all"
                    />
                </div>
            </div>
        </motion.div>
      </div>

      {/* Skills grid + Realm panel side by side */}
      <div className={`flex flex-col ${showRealmPanel ? 'xl:flex-row' : ''} gap-6 items-start`}>

        {/* LEFT: Skills grid */}
        <div className="flex-1 min-w-0 space-y-6">
          {Object.entries(filteredSkillsByRealm).map(([realm, skillData]) => (
            <motion.div variants={itemVariants} key={realm} className="bg-white/[0.02] p-6 rounded-3xl border border-white/[0.02]">
              <h3 className={`text-xl sm:text-2xl font-black mb-6 capitalize flex items-center gap-3 ${realmConfig[realm as Realm]?.color || 'text-text-primary'}`}>
                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                  {realmConfig[realm as Realm]?.icon}
                </div>
                {t(`common:realm.${realm}`)}
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skillData.map(({ skill, topics }) => (
                  <SkillCard 
                    key={skill.id} skill={skill} topics={topics}
                    onUpdateTopicDifficulty={onUpdateTopicDifficulty} onEditSkill={onEditSkill}
                    onDeleteSkill={onDeleteSkill} onAddTopicToSkill={onAddTopicToSkill}
                    onEditTopic={onEditTopic} onDeleteTopic={onDeleteTopic}
                    onOpenBulkAddModal={onOpenBulkAddModal} onUpdateSkillPriority={onUpdateSkillPriority}
                    onToggleSkillActive={onToggleSkillActive}
                    isInitialEditActive={isInitialEditActive}
                    onAdjustInitialSkillLevel={onAdjustInitialSkillLevel}
                  />
                ))}
              </div>
            </motion.div>
          ))}
          {Object.keys(filteredSkillsByRealm).length === 0 && searchQuery && (
            <motion.div variants={itemVariants} className="text-center py-10 bg-white/5 border border-dashed border-white/10 rounded-2xl w-full max-w-xl mx-auto backdrop-blur-sm">
              <p className="text-text-secondary font-medium">{t('no_topics')}</p>
            </motion.div>
          )}
        </div>

        {/* RIGHT: Realm level panel — only in initial edit mode */}
        {showRealmPanel && (
          <motion.div
            variants={itemVariants}
            className="xl:sticky xl:top-4 xl:w-72 w-full shrink-0"
          >
            <div className="bg-primary/60 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-5 shadow-glass flex flex-col gap-4">
              {/* Panel header */}
              <div className="flex items-center gap-2 pb-3 border-b border-amber-500/20">
                <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Ajuste por Reino</h4>
                  <p className="text-[10px] text-text-muted mt-0.5">Nível aplicado a todas as habilidades</p>
                </div>
              </div>

              {/* Realm rows */}
              <div className="flex flex-col gap-2">
                {Object.values(Realm).map(realm => {
                  const config = realmConfig[realm as Realm];
                  const currentLevel = realmAverageLevels[realm] ?? 1;
                  const skillCount = (skillsByRealm[realm as Realm] || []).length;
                  if (skillCount === 0) return null;
                  return (
                    <div
                      key={realm}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-amber-500/20 transition-all duration-200 group"
                    >
                      {/* icon + name */}
                      <div className={`flex items-center gap-2 min-w-0 ${config?.color || 'text-text-primary'}`}>
                        <div className="shrink-0 p-1.5 bg-white/5 rounded-lg border border-white/10 group-hover:border-white/20 transition-all">
                          <span className="w-3.5 h-3.5 block">{config?.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate">{t(`common:realm.${realm}`)}</p>
                          <p className="text-[9px] text-text-muted">{skillCount} habilidade{skillCount > 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* level controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={`Diminuir nível de ${realm}`}
                          onClick={() => onAdjustRealmLevel(realm, currentLevel - 1)}
                          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 active:scale-90 text-text-secondary transition-all duration-150"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-black text-sm bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-lg py-0.5">
                          {currentLevel}
                        </span>
                        <button
                          type="button"
                          aria-label={`Aumentar nível de ${realm}`}
                          onClick={() => onAdjustRealmLevel(realm, currentLevel + 1)}
                          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-300 active:scale-90 text-text-secondary transition-all duration-150"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer tip */}
              <p className="text-[9px] text-text-muted text-center pt-2 border-t border-white/5 leading-relaxed">
                Esses controles ajustam <strong className="text-amber-400/70">todas</strong> as habilidades do reino de uma vez.
                Os cards abaixo também têm controles individuais.
              </p>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default SkillTree;