import React, { useState } from 'react';
import { User, Skill, Realm, KnowledgeTopic, TopicDifficulty } from '../types';
import { BrainCircuit, Heart, Zap, Sparkles, Edit, Trash2, PlusCircle, Layers, Wand2, Search } from 'lucide-react';
import { TOPIC_XP_MAP } from '../constants';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

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
}

const realmConfig = {
  [Realm.Mind]: { icon: <BrainCircuit size={20} />, color: "text-accent-primary" },
  [Realm.Body]: { icon: <Heart size={20} />, color: "text-accent-red" },
  [Realm.Creation]: { icon: <Zap size={20} />, color: "text-accent-secondary" },
  [Realm.Spirit]: { icon: <Sparkles size={20} />, color: "text-accent-tertiary" },
  [Realm.Creativity]: { icon: <Sparkles size={20} />, color: "text-accent-primary" },
  [Realm.Finance]: { icon: <Sparkles size={20} />, color: "text-accent-green" },
  [Realm.Social]: { icon: <Sparkles size={20} />, color: "text-accent-primary" },
  [Realm.Meta]: { icon: <Sparkles size={20} />, color: "text-text-secondary" },
};

const difficultyConfig: { [key in TopicDifficulty]: { color: string, label: string } } = {
    [TopicDifficulty.Easy]: { color: 'bg-accent-green', label: 'E' },
    [TopicDifficulty.Medium]: { color: 'bg-accent-secondary', label: 'M' },
    [TopicDifficulty.Hard]: { color: 'bg-accent-red', label: 'H' },
    [TopicDifficulty.SuperHard]: { color: 'bg-accent-tertiary', label: 'S' },
};

const priorityLabels: { [key: number]: string } = {
    1: 'Lowest', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Crucial',
};
const priorityColors: { [key: number]: string } = {
    1: 'text-text-muted', 2: 'text-text-secondary', 3: 'text-text-primary', 4: 'text-accent-primary', 5: 'text-accent-tertiary',
}

const DifficultyButton: React.FC<{ level: TopicDifficulty, current: TopicDifficulty, onClick: () => void }> = ({ level, current, onClick }) => {
    const isActive = level === current;
    const config = difficultyConfig[level];
    return (
        <button 
            onClick={onClick} 
            className={`w-6 h-6 text-xs font-bold rounded transition-all duration-200 ${isActive ? `${config.color} text-white shadow-md` : 'bg-border-color text-text-secondary hover:bg-opacity-80'}`}
        >
            {config.label}
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
}

const SkillCard: React.FC<SkillCardProps> = (props) => {
  const { skill, topics, onUpdateTopicDifficulty, onEditSkill, onDeleteSkill, onAddTopicToSkill, onEditTopic, onDeleteTopic, onOpenBulkAddModal, onUpdateSkillPriority, onToggleSkillActive } = props;
  const config = realmConfig[skill.realm] || realmConfig[Realm.Meta];
  const progress = (skill.xp / skill.xpToNextLevel) * 100;

  return (
    <motion.div 
      className={`bg-primary/40 p-5 rounded-2xl border border-white/5 flex flex-col transition-all duration-300 backdrop-blur-md shadow-glass hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-white/10 ${!skill.isActive ? 'opacity-50 grayscale-[0.5]' : ''}`}
      layout
    >
      {/* Top Section */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center space-x-3 font-black text-xl tracking-tight ${config.color}`}>
          <div className="p-2 bg-white/5 rounded-xl border border-white/10 shadow-sm">{config.icon}</div>
          <h3>{skill.name}</h3>
        </div>
        <div className='flex items-center space-x-2'>
            <span className={`font-black text-lg bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 text-white shadow-sm mr-2`}>Lvl {skill.level}</span>
            <button title="Toggle Active Status" onClick={() => onToggleSkillActive(skill.id)} className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${skill.isActive ? 'bg-accent-primary' : 'bg-white/20'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${skill.isActive ? 'translate-x-4' : 'translate-x-0'}`}/>
            </button>
            <button onClick={() => onEditSkill(skill)} className="p-1.5 rounded-md text-text-secondary hover:bg-white/10 hover:text-white transition-colors"><Edit size={16} /></button>
            <button onClick={() => onDeleteSkill(skill.id)} className="p-1.5 rounded-md text-text-secondary hover:bg-accent-red/20 hover:text-accent-red transition-colors"><Trash2 size={16} /></button>
        </div>
      </div>
      
      {/* XP Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase text-text-secondary mb-1.5 items-center">
            <span>Experience</span>
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

      {/* Priority */}
      <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/5 mb-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
          <Sparkles size={12} className={priorityColors[skill.priority]} />
          Priority
        </h4>
        <span className={`text-sm font-black tracking-wide ${priorityColors[skill.priority]}`}>{priorityLabels[skill.priority]}</span>
      </div>
      
      {/* Knowledge Topics */}
        <div className="mt-4 border-t border-border-color pt-3 flex-grow flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-text-secondary">Knowledge Topics</h4>
             <div className="flex items-center space-x-1">
                <button onClick={() => onAddTopicToSkill(skill.id)} className="text-text-secondary hover:text-accent-primary transition-colors" aria-label="Add new topic"><PlusCircle size={18} /></button>
                <button onClick={() => onOpenBulkAddModal(skill)} className="text-text-secondary hover:text-accent-primary transition-colors" aria-label="Bulk add topics"><Layers size={18} /></button>
            </div>
          </div>
          {topics.length > 0 ? (
            <div className="space-y-2 flex-grow">
                {topics.map(topic => (
                    <div key={topic.id} className="border-t border-white/5 py-2.5 px-1 hover:bg-white/5 transition-colors rounded">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-text-primary font-medium">{topic.name}</p>
                                <p className={`text-xs font-semibold ${difficultyConfig[topic.difficulty].color.replace('bg-', 'text-')}`}>{topic.difficulty}</p>
                            </div>
                            <div className="flex items-center space-x-1.5 opacity-80 hover:opacity-100 transition-opacity">
                                <DifficultyButton level={TopicDifficulty.Easy} current={topic.difficulty} onClick={() => onUpdateTopicDifficulty(topic.id, TopicDifficulty.Easy)} />
                                <DifficultyButton level={TopicDifficulty.Medium} current={topic.difficulty} onClick={() => onUpdateTopicDifficulty(topic.id, TopicDifficulty.Medium)} />
                                <DifficultyButton level={TopicDifficulty.Hard} current={topic.difficulty} onClick={() => onUpdateTopicDifficulty(topic.id, TopicDifficulty.Hard)} />
                                <DifficultyButton level={TopicDifficulty.SuperHard} current={topic.difficulty} onClick={() => onUpdateTopicDifficulty(topic.id, TopicDifficulty.SuperHard)} />
                                <button onClick={() => onEditTopic(topic)} className="text-text-secondary hover:text-white ml-2"><Edit size={14} /></button>
                                <button onClick={() => onDeleteTopic(topic.id)} className="text-text-secondary hover:text-accent-red"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
           ) : (
                <div className="text-center py-4 flex-grow flex items-center justify-center bg-white/5 rounded-lg border border-dashed border-white/10 mt-2">
                    <p className="text-xs text-text-muted italic">No topics yet. Click '+' to add one.</p>
                </div>
            )}
      </div>
    </motion.div>
  );
};

const SkillTree: React.FC<SkillTreeProps> = (props) => {
  const { user, onUpdateTopicDifficulty, onAddSkill, onEditSkill, onDeleteSkill, onAddTopicToSkill, onEditTopic, onDeleteTopic, onOpenBulkAddModal, onUpdateSkillPriority, onToggleSkillActive, onGenerateRecommendations } = props;
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const skillsByRealm = Object.values(user.skill_tree).reduce((acc: Record<Realm, Skill[]>, skill: Skill) => {
    const realm = skill.realm || Realm.Meta;
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
      
      if (!searchQuery) {
        return { skill, topics: allTopics };
      }

      const skillNameMatches = skill.name.toLowerCase().includes(searchQuery);
      const matchingTopics = allTopics.filter(topic => topic.name.toLowerCase().includes(searchQuery));

      if (skillNameMatches) {
        return { skill, topics: allTopics };
      }
      if (matchingTopics.length > 0) {
        return { skill, topics: matchingTopics };
      }
      return null;
    }).filter(Boolean) as { skill: Skill; topics: KnowledgeTopic[] }[];

    if (filteredSkills.length > 0) {
      acc[realm as Realm] = filteredSkills;
    }
    return acc;
  }, {} as Record<Realm, { skill: Skill; topics: KnowledgeTopic[] }[]>);


  // Calculate data for Radar Chart
  const radarData = Object.values(Realm).filter(r => r !== Realm.Meta).map(realm => {
      const skillsInRealm = skillsByRealm[realm] || [];
      const totalLevel = skillsInRealm.reduce((sum, skill) => sum + skill.level, 0);
      return {
          subject: realm,
          A: totalLevel,
          fullMark: Math.max(20, totalLevel + 5) // Dynamic scale based on highest level, min 20
      };
  });

  // Calculate highest realm value for dynamic scaling 
  const maxScore = Math.max(...radarData.map(d => d.A), 10);
  const chartDomain = [0, maxScore + (maxScore * 0.2)]; // Add 20% padding to top

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className='text-center'>
        <h2 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">Knowledge & Skills</h2>
        <p className="text-text-secondary mb-6">Allocate XP to level up realms and unlock new abilities.</p>
        
        {/* Radar Chart Visualization */}
        <motion.div variants={itemVariants} className="w-full max-w-2xl mx-auto h-[350px] sm:h-[400px] bg-primary/20 backdrop-blur-xl border border-white/5 rounded-3xl p-4 shadow-glass mb-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-accent-primary/5 to-transparent pointer-events-none"></div>
            
            {/* Custom Tooltip component for Recharts */}
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={chartDomain} tick={false} axisLine={false} />
                    <Radar
                        name="Realm Proficiency"
                        dataKey="A"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="rgba(59, 130, 246, 0.4)"
                        fillOpacity={0.6}
                        dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1 }}
                        activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)', color: '#fff', padding: '10px 15px' }}
                        itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '5px' }}
                        formatter={(value: number) => [`Level ${value}`, 'Proficiency']}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-center items-center gap-3 sm:gap-4 mb-8 flex-wrap">
            <button onClick={onAddSkill} className="flex items-center space-x-2 bg-gradient-to-r from-accent-green to-emerald-500 hover:from-emerald-500 hover:to-accent-green text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-glow-primary hover:shadow-glow-secondary active:scale-95 border border-white/10">
                <PlusCircle size={18} />
                <span>New Skill</span>
            </button>
             <button onClick={onGenerateRecommendations} className="flex items-center space-x-2 bg-gradient-to-r from-accent-tertiary to-purple-500 hover:from-purple-500 hover:to-accent-tertiary text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-glow-tertiary hover:shadow-glow-primary active:scale-95 border border-white/10">
                <Wand2 size={18} />
                <span>AI Recommendations</span>
            </button>
        </motion.div>
        
        <motion.div variants={itemVariants} className="max-w-xl mx-auto mb-10">
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-primary to-accent-tertiary rounded-full opacity-30 group-hover:opacity-60 blur transition duration-500"></div>
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search skills or topics..."
                        onChange={handleSearchChange}
                        className="w-full bg-primary/80 backdrop-blur-md border border-white/10 rounded-full py-3.5 pl-14 pr-6 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary shadow-inner text-sm font-medium transition-all"
                    />
                </div>
            </div>
        </motion.div>
      </div>

      {Object.entries(filteredSkillsByRealm).map(([realm, skillData]) => (
        <motion.div variants={itemVariants} key={realm} className="bg-white/[0.02] p-6 rounded-3xl border border-white/[0.02]">
          <h3 className={`text-xl sm:text-2xl font-black mb-6 capitalize flex items-center gap-3 ${realmConfig[realm as Realm]?.color || 'text-text-primary'}`}>
              <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                  {realmConfig[realm as Realm]?.icon}
              </div>
              {realm}
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {skillData.map(({ skill, topics }) => (
                <SkillCard 
                    key={skill.id} 
                    skill={skill} 
                    topics={topics} 
                    onUpdateTopicDifficulty={onUpdateTopicDifficulty} 
                    onEditSkill={onEditSkill}
                    onDeleteSkill={onDeleteSkill}
                    onAddTopicToSkill={onAddTopicToSkill}
                    onEditTopic={onEditTopic}
                    onDeleteTopic={onDeleteTopic}
                    onOpenBulkAddModal={onOpenBulkAddModal}
                    onUpdateSkillPriority={onUpdateSkillPriority}
                    onToggleSkillActive={onToggleSkillActive}
                />
            ))}
          </div>
        </motion.div>
      ))}
      {Object.keys(filteredSkillsByRealm).length === 0 && searchQuery && (
        <motion.div variants={itemVariants} className="text-center py-10 bg-white/5 border border-dashed border-white/10 rounded-2xl w-full max-w-xl mx-auto backdrop-blur-sm">
          <p className="text-text-secondary font-medium">No knowledge entries found matching <span className="text-white">"{searchQuery}"</span>.</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SkillTree;