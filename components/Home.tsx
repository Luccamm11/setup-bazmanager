import React from 'react';
import { Quest, Realm, Arc, MajorGoal, User } from '../types';
import QuestBoard from './QuestBoard';
import QuestCard from './QuestCard';
import MajorGoals from './MajorGoals';
import ActiveBuffs from './ActiveBuffs';
import { Target, Zap, Gift, PlusCircle, Activity, Sparkles, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
  user: User;
  quests: Quest[];
  activeArc: Arc | null;
  majorGoals: MajorGoal[];
  onCompleteQuest: (questId: string) => void;
  onGenerateQuests: () => void;
  isLoading: boolean;
  error: string | null;
  onOpenLootbox: () => void;
  isLootboxClaimed: boolean;
  onAddQuestClick: () => void;
  onAddMajorGoal: () => void;
  onBulkAddMajorGoal: () => void;
  onEditMajorGoal: (goal: MajorGoal) => void;
  onCompleteMajorGoal: (goal: MajorGoal) => void;
  onSyllabusBreakdown: (goal: MajorGoal) => void;
  currentDate: Date;
}

const ActiveArcDisplay: React.FC<{ arc: Arc }> = ({ arc }) => {
  const { t } = useTranslation('dashboard');
  return (
    <div className="relative bg-primary/20 backdrop-blur-3xl overflow-hidden rounded-2xl border border-white/[0.05] mb-6 group transition-all duration-700">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent-tertiary/10 rounded-full mix-blend-screen filter blur-[60px] pointer-events-none group-hover:bg-accent-tertiary/20 transition-all duration-700"></div>
        <div className="relative z-10 p-5 sm:p-6">
            <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-accent-tertiary/5 rounded-lg text-accent-tertiary border border-accent-tertiary/10 shadow-sm shrink-0">
                    <Target size={20} />
                </div>
                <div>
                    <div className="text-[9px] font-black tracking-[0.2em] text-accent-tertiary/60 uppercase mb-0.5">{t('active_arc')}</div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">{arc.title}</h2>
                </div>
            </div>
            <p className="text-sm text-text-secondary/80 md:ml-[3.5rem] mb-4 leading-relaxed max-w-3xl">{arc.description}</p>
            <div className="flex flex-wrap gap-x-2 gap-y-1.5 md:ml-[3.5rem]">
                {arc.effects.map((effect, index) => (
                    <div key={index} className="flex items-center text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-white/[0.03] text-accent-primary border border-white/5 backdrop-blur-sm">
                        <Zap size={10} className="mr-1.5"/>
                        <span>{effect}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

const DailyLootboxDrop: React.FC<{ onOpen: () => void; isClaimed: boolean }> = ({ onOpen, isClaimed }) => {
  const { t } = useTranslation('dashboard');
  return (
    <div className={`relative overflow-hidden p-5 sm:p-6 rounded-2xl border flex flex-wrap items-center justify-between gap-5 transition-all duration-500
        ${isClaimed 
            ? 'bg-primary/10 border-white/[0.03] opacity-40 grayscale pointer-events-none' 
            : 'bg-primary/40 backdrop-blur-3xl border-accent-secondary/20 hover:border-accent-secondary/40 cursor-pointer group hover:bg-primary/50'
        }`}
        onClick={!isClaimed ? onOpen : undefined}
    >
        {!isClaimed && (
            <div className="absolute inset-0 z-0">
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-40 h-40 bg-accent-secondary/15 rounded-full mix-blend-screen filter blur-[50px] animate-pulse"></div>
            </div>
        )}
        
        <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
            <div className={`p-3 rounded-xl border ${isClaimed ? 'bg-white/5 border-white/5 text-text-muted' : 'bg-accent-secondary/5 border-accent-secondary/10 text-accent-secondary transition-all duration-500 shadow-sm'}`}>
                <Gift className="w-6 h-6" />
            </div>
            <div className="text-left flex-1 min-w-0">
                <h3 className={`text-lg font-black tracking-tight flex items-center gap-2 ${isClaimed ? 'text-text-muted' : 'text-accent-secondary uppercase text-[15px]'}`}>
                    {t('daily_payload')}
                    {!isClaimed && <span className="flex h-2 w-2 relative ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-secondary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-accent-secondary"></span></span>}
                </h3>
                <p className={`text-xs mt-0.5 truncate font-medium ${isClaimed ? 'text-text-muted/70' : 'text-text-secondary/70'}`}>
                    {isClaimed ? t('daily_payload_syncing') : t('daily_payload_ready')}
                </p>
            </div>
        </div>
        
        <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            disabled={isClaimed}
            className={`relative z-10 px-6 py-2.5 font-black text-xs uppercase tracking-widest rounded-lg transition-all duration-500 w-full sm:w-auto border
                ${isClaimed 
                    ? 'bg-transparent border-white/5 text-text-muted' 
                    : 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary hover:bg-accent-secondary hover:text-background active:scale-95'
                }`}
        >
            {isClaimed ? t('..common:states.claimed') : t('decrypt')}
        </button>
    </div>
  );
};


const Home: React.FC<DashboardProps> = (props) => {
  const { user, quests, activeArc, onCompleteQuest, onGenerateQuests, isLoading, error, onOpenLootbox, isLootboxClaimed, onAddQuestClick, majorGoals, onAddMajorGoal, onBulkAddMajorGoal, onEditMajorGoal, onCompleteMajorGoal, onSyllabusBreakdown, currentDate } = props;
  const { t } = useTranslation(['dashboard', 'common']);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
      className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
       {error && (
        <motion.div variants={itemVariants} className="bg-accent-red/10 border border-accent-red/40 text-accent-red px-5 py-4 rounded-xl flex items-start shadow-[0_4px_15px_rgba(218,54,51,0.1)] backdrop-blur-sm animate-pulse" role="alert">
          <ShieldAlert className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="font-bold block text-sm tracking-wide uppercase">{t('system_disruption')}</strong>
            <span className="block mt-1 opacity-90">{error}</span>
          </div>
        </motion.div>
      )}
      
      {activeArc && <motion.div variants={itemVariants}><ActiveArcDisplay arc={activeArc} /></motion.div>}
      
      <div className="flex flex-col xl:flex-row gap-6 sm:gap-8">
          <div className="flex-1 space-y-6 sm:space-y-8 min-w-0">
              <motion.div variants={itemVariants}><ActiveBuffs activeBuffs={user.activeBuffs} /></motion.div>
              
              <motion.div variants={itemVariants} className="bg-primary/40 backdrop-blur-2xl p-5 sm:p-8 rounded-3xl border border-white/5 shadow-glass relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-accent-primary/5 to-transparent pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-4 border-b border-white/5 pb-4 relative z-10">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-accent-primary/10 rounded-xl border border-accent-primary/20 text-accent-primary shadow-glow-primary shrink-0">
                          <Activity size={26} />
                      </div>
                      <div>
                          <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">{t('active_objectives')}</h2>
                          <p className="text-sm text-text-secondary mt-1 font-medium hidden sm:block">{t('active_objectives_subtitle')}</p>
                      </div>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <button 
                        onClick={onAddQuestClick}
                        className="flex items-center justify-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 text-text-primary font-bold py-2.5 px-4 sm:px-5 rounded-xl transition-all shadow-sm hover:shadow-glass hover:-translate-y-0.5 active:scale-95 group"
                    >
                        <PlusCircle className="w-5 h-5 text-text-secondary group-hover:text-accent-primary transition-colors" />
                        <span className="hidden sm:inline">{t('common:buttons.add_manual')}</span>
                    </button>
                    <QuestBoard 
                        onGenerateQuests={onGenerateQuests}
                        isLoading={isLoading} 
                    />
                  </div>
                </div>
                
                <div className="relative z-10">
                  {quests.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {quests.map(quest => (
                              <QuestCard key={quest.id} quest={quest} onComplete={onCompleteQuest} currentDate={currentDate} />
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-20 px-6 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm">
                          <Sparkles className="w-14 h-14 text-text-muted mb-5 opacity-50" />
                          <p className="text-xl font-bold text-text-secondary">{t('no_objectives')}</p>
                          <p className="text-text-muted mt-2 max-w-md mx-auto leading-relaxed">{t('no_objectives_hint')}</p>
                      </div>
                  )}
                </div>
              </motion.div>
          </div>
          
          <div className="w-full xl:w-[400px] 2xl:w-[450px] shrink-0 space-y-6 sm:space-y-8">
              <motion.div variants={itemVariants}>
                <DailyLootboxDrop onOpen={onOpenLootbox} isClaimed={isLootboxClaimed} />
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-primary/40 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-glass overflow-hidden relative h-full min-h-[500px]">
                  <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-accent-tertiary/5 to-transparent pointer-events-none"></div>
                  <div className="relative z-10 p-2 h-full">
                    <MajorGoals 
                      goals={majorGoals}
                      onAdd={onAddMajorGoal}
                      onBulkAdd={onBulkAddMajorGoal}
                      onEdit={onEditMajorGoal}
                      onComplete={onCompleteMajorGoal}
                      onBreakdown={onSyllabusBreakdown}
                      currentDate={currentDate}
                    />
                  </div>
              </motion.div>
          </div>
      </div>

    </motion.div>
  );
};

export default Home;