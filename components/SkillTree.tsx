import React from 'react';
import { User, Skill, Realm, KnowledgeTopic, TopicDifficulty } from '../types';
import { BrainCircuit, Heart, Zap, Sparkles, Edit, Trash2, PlusCircle, Layers, Wand2 } from 'lucide-react';
import { TOPIC_XP_MAP } from '../constants';

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
    <div className={`bg-primary p-4 rounded-lg border border-border-color flex flex-col transition-opacity duration-300 ${!skill.isActive ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center space-x-2 font-bold text-lg ${config.color}`}>
          {config.icon}
          <h3>{skill.name}</h3>
        </div>
        <div className='flex items-center space-x-2'>
            <button onClick={() => onToggleSkillActive(skill.id)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${skill.isActive ? 'bg-accent-primary' : 'bg-border-color'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${skill.isActive ? 'translate-x-5' : 'translate-x-0'}`}/>
            </button>
            <span className={`font-bold text-md text-text-primary`}>Lvl {skill.level}</span>
            <button onClick={() => onEditSkill(skill)} className="text-text-secondary hover:text-white"><Edit size={16} /></button>
            <button onClick={() => onDeleteSkill(skill.id)} className="text-text-secondary hover:text-accent-red"><Trash2 size={16} /></button>
        </div>
      </div>
      
      {/* XP Bar */}
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-1 items-center">
            <span className="flex items-center space-x-1">XP</span>
            <span>{skill.xp} / {skill.xpToNextLevel}</span>
        </div>
        <div className="w-full bg-background rounded-full h-2 border border-border-color/50">
          <div className={`${config.color.replace('text', 'bg')}`} style={{ width: `${progress}%`, height: '100%', borderRadius: 'inherit' }}></div>
        </div>
      </div>

      {/* Priority */}
      <div className="mt-4 flex justify-between items-center border-t border-border-color pt-3">
        <h4 className="text-sm font-semibold text-text-secondary">Priority</h4>
        <span className={`text-sm font-bold ${priorityColors[skill.priority]}`}>{priorityLabels[skill.priority]}</span>
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
                    <div key={topic.id} className="border-t border-border-color py-2.5 px-1">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-text-primary">{topic.name}</p>
                                <p className={`text-xs font-semibold ${difficultyConfig[topic.difficulty].color.replace('bg-', 'text-')}`}>{topic.difficulty}</p>
                            </div>
                            <div className="flex items-center space-x-1.5">
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
                <div className="text-center py-4 flex-grow flex items-center justify-center">
                    <p className="text-xs text-text-muted italic">No topics yet. Click '+' to add one.</p>
                </div>
            )}
      </div>
    </div>
  );
};

const SkillTree: React.FC<SkillTreeProps> = (props) => {
  const { user, onUpdateTopicDifficulty, onAddSkill, onEditSkill, onDeleteSkill, onAddTopicToSkill, onEditTopic, onDeleteTopic, onOpenBulkAddModal, onUpdateSkillPriority, onToggleSkillActive, onGenerateRecommendations } = props;

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

  return (
    <div className="space-y-8">
      <div className='text-center'>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Knowledge & Skills</h2>
        <div className="flex justify-center items-center gap-2 sm:gap-4 mb-6 flex-wrap">
            <button onClick={onAddSkill} className="flex items-center space-x-2 bg-accent-green hover:bg-accent-green-hover text-white font-semibold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                <PlusCircle size={18} />
                <span>New Skill</span>
            </button>
             <button onClick={onGenerateRecommendations} className="flex items-center space-x-2 bg-accent-tertiary hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                <Wand2 size={18} />
                <span>Get AI Recommendations</span>
            </button>
        </div>
      </div>

      {Object.entries(skillsByRealm).map(([realm, skills]) => (
        <div key={realm}>
          <h3 className={`text-xl sm:text-2xl font-semibold mb-4 capitalize ${realmConfig[realm as Realm]?.color || 'text-text-primary'}`}>{realm}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.map(skill => (
                <SkillCard 
                    key={skill.id} 
                    skill={skill} 
                    topics={topicsBySkillId[skill.id] || []} 
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
        </div>
      ))}
    </div>
  );
};

export default SkillTree;