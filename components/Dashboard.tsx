import React from 'react';
// FIX: Replaced BossChallenge with MajorGoal for consistency.
import { Quest, Realm, Arc, MajorGoal, User } from '../types';
import QuestBoard from './QuestBoard';
import QuestCard from './QuestCard';
import MajorGoals from './MajorGoals';
import ActiveBuffs from './ActiveBuffs';
import { Target, Zap, Gift, PlusCircle, Activity, Sparkles, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  user: User;
  quests: Quest[];
  activeArc: Arc | null;
  // FIX: Renamed `challenges` to `majorGoals` and updated type.
  majorGoals: MajorGoal[];
  onCompleteQuest: (questId: string) => void;
  onGenerateQuests: () => void;
  isLoading: boolean;
  error: string | null;
  onOpenLootbox: () => void;
  isLootboxClaimed: boolean;
  onAddQuestClick: () => void;
  // FIX: Renamed props to match App.tsx and new component names.
  onAddMajorGoal: () => void;
  onBulkAddMajorGoal: () => void;
  onEditMajorGoal: (goal: MajorGoal) => void;
  onCompleteMajorGoal: (goal: MajorGoal) => void;
  onSyllabusBreakdown: (goal: MajorGoal) => void;
  currentDate: Date;
}

const ActiveArcDisplay: React.FC<{ arc: Arc }> = ({ arc }) => (
    <div className="relative bg-primary/40 backdrop-blur-2xl overflow-hidden rounded-3xl border border-white/5 mb-8 shadow-glass group transition-all hover:shadow-[0_8px_40px_rgba(168,85,247,0.15)] hover:border-accent-tertiary/30">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent-tertiary/10 rounded-full mix-blend-screen filter blur-[60px] pointer-events-none group-hover:bg-accent-tertiary/20 transition-all duration-700"></div>
        <div className="relative z-10 p-6 sm:p-8">
            <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-accent-tertiary/10 rounded-xl text-accent-tertiary border border-accent-tertiary/20 shadow-glow-tertiary">
                    <Target className="w-7 h-7" />
                </div>
                <div>
                    <div className="text-xs font-bold tracking-widest text-accent-tertiary uppercase mb-1">Active Story Arc</div>
                    <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-white to-accent-tertiary/80 tracking-tight leading-none drop-shadow-sm">{arc.title}</h2>
                </div>
            </div>
            <p className="text-base text-text-secondary md:ml-[4.5rem] mb-6 leading-relaxed max-w-3xl">{arc.description}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-2 md:ml-[4.5rem]">
                {arc.effects.map((effect, index) => (
                    <div key={index} className="flex items-center text-xs font-bold px-3 py-1.5 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20 backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-0.5">
                        <Zap size={14} className="mr-1.5"/>
                        <span>{effect}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const DailyLootboxDrop: React.FC<{ onOpen: () => void; isClaimed: boolean }> = ({ onOpen, isClaimed }) => (
    <div className={`relative overflow-hidden p-6 sm:p-8 rounded-3xl border flex flex-wrap items-center justify-between gap-5 transition-all duration-500 shadow-glass
        ${isClaimed 
            ? 'bg-primary/20 border-white/5 grayscale-[0.5] opacity-60 backdrop-blur-md' 
            : 'bg-primary/60 backdrop-blur-2xl border-accent-secondary/30 hover:shadow-glow-secondary hover:border-accent-secondary/50 cursor-pointer group hover:-translate-y-1'
        }`}
        onClick={!isClaimed ? onOpen : undefined}
    >
        {!isClaimed && (
            <div className="absolute inset-0 z-0">
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-40 h-40 bg-accent-secondary/15 rounded-full mix-blend-screen filter blur-[50px] animate-pulse"></div>
            </div>
        )}
        
        <div className="relative z-10 flex items-center gap-5 w-full sm:w-auto">
            <div className={`p-4 rounded-2xl border ${isClaimed ? 'bg-white/5 border-white/5 text-text-muted' : 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-glow-secondary'}`}>
                <Gift className="w-8 h-8" />
            </div>
            <div className="text-left flex-1 min-w-0">
                <h3 className={`text-xl font-black tracking-tight flex items-center gap-2 ${isClaimed ? 'text-text-muted' : 'text-accent-secondary drop-shadow-sm'}`}>
                    Daily Supply Drop
                    {!isClaimed && <span className="flex h-2.5 w-2.5 relative ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-secondary opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-secondary"></span></span>}
                </h3>
                <p className={`text-sm mt-1 truncate font-medium ${isClaimed ? 'text-text-muted/70' : 'text-text-secondary'}`}>
                    {isClaimed ? 'Next drop arrives tomorrow' : 'Encrypted payload ready for decryption'}
                </p>
            </div>
        </div>
        
        <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            disabled={isClaimed}
            className={`relative z-10 px-8 py-3.5 font-bold tracking-wide rounded-xl transition-all duration-300 w-full sm:w-auto
                ${isClaimed 
                    ? 'bg-white/5 border border-white/5 text-text-muted' 
                    : 'bg-accent-secondary text-background hover:bg-[#fde047] hover:shadow-glow-secondary active:scale-95'
                }`}
        >
            {isClaimed ? 'Decrypted' : 'Decrypt Now'}
        </button>
    </div>
);


const Dashboard: React.FC<DashboardProps> = (props) => {
  // FIX: Destructure renamed props.
  const { user, quests, activeArc, onCompleteQuest, onGenerateQuests, isLoading, error, onOpenLootbox, isLootboxClaimed, onAddQuestClick, majorGoals, onAddMajorGoal, onBulkAddMajorGoal, onEditMajorGoal, onCompleteMajorGoal, onSyllabusBreakdown, currentDate } = props;

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
      className="space-y-8 max-w-7xl mx-auto pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
       {error && (
        <motion.div variants={itemVariants} className="bg-accent-red/10 border border-accent-red/40 text-accent-red px-5 py-4 rounded-xl flex items-start shadow-[0_4px_15px_rgba(218,54,51,0.1)] backdrop-blur-sm animate-pulse" role="alert">
          <ShieldAlert className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="font-bold block text-sm tracking-wide uppercase">System Disruption</strong>
            <span className="block mt-1 opacity-90">{error}</span>
          </div>
        </motion.div>
      )}
      
      {activeArc && <motion.div variants={itemVariants}><ActiveArcDisplay arc={activeArc} /></motion.div>}
      
      <div className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1 space-y-8 min-w-0">
              <motion.div variants={itemVariants}><ActiveBuffs activeBuffs={user.activeBuffs} /></motion.div>
              
              <motion.div variants={itemVariants} className="bg-primary/40 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/5 shadow-glass relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-accent-primary/5 to-transparent pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4 border-b border-white/5 pb-5 relative z-10">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-accent-primary/10 rounded-xl border border-accent-primary/20 text-accent-primary shadow-glow-primary shrink-0">
                          <Activity size={26} />
                      </div>
                      <div>
                          <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">Active Objectives</h2>
                          <p className="text-sm text-text-secondary mt-1 font-medium hidden sm:block">Your immediate tasks and daily operations</p>
                      </div>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <button 
                        onClick={onAddQuestClick}
                        className="flex items-center justify-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 text-text-primary font-bold py-2.5 px-4 sm:px-5 rounded-xl transition-all shadow-sm hover:shadow-glass hover:-translate-y-0.5 active:scale-95 group"
                    >
                        <PlusCircle className="w-5 h-5 text-text-secondary group-hover:text-accent-primary transition-colors" />
                        <span className="hidden sm:inline">Manual Add</span>
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
                          <p className="text-xl font-bold text-text-secondary">No active objectives detected.</p>
                          <p className="text-text-muted mt-2 max-w-md mx-auto leading-relaxed">Initiate a sync with the AI Core to generate new tasks based on your goals and schedule.</p>
                      </div>
                  )}
                </div>
              </motion.div>
          </div>
          
          <div className="w-full xl:w-[400px] 2xl:w-[450px] shrink-0 space-y-8">
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

export default Dashboard;