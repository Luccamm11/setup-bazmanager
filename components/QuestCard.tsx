import React, { useState, useEffect, useCallback } from 'react';
import { Quest, Realm, Difficulty } from '../types';
import { CheckCircle, Star, DollarSign, Clock, AlertTriangle, Calendar, User as UserIcon, Bot, GitCommit, Cpu, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
interface QuestCardProps {
  quest: Quest;
  onComplete: (questId: string) => void;
  currentDate: Date; // Keep for initial calculation, though countdown is self-driven
}

const difficultyColors = {
    [Difficulty.Easy]: 'text-accent-green',
    [Difficulty.Medium]: 'text-accent-secondary',
    [Difficulty.Hard]: 'text-accent-red',
};

const Countdown: React.FC<{ deadline: string; onExpire: () => void }> = ({ deadline, onExpire }) => {
    const { t } = useTranslation('dashboard');
    const [timeLeftMs, setTimeLeftMs] = useState(() => +new Date(deadline) - Date.now());
    const expiredRef = React.useRef(false);

    useEffect(() => {
        if (timeLeftMs <= 0) {
            if (!expiredRef.current) {
                onExpire();
                expiredRef.current = true;
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeftMs(prev => prev - 1000);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeftMs, onExpire]);


    if (timeLeftMs <= 0) {
        return <span className="font-mono">{t('quest.expired')}</span>;
    }

    const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeftMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeLeftMs / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeftMs / 1000) % 60);

    const parts = [];
    if (days > 0) {
        parts.push(`${days}d`);
    }
    parts.push(String(hours).padStart(2, '0'));
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(seconds).padStart(2, '0'));

    return <span className="font-mono">{parts.join(':')}</span>;
};

const QuestCard: React.FC<QuestCardProps> = ({ quest, onComplete }) => {
  const { t } = useTranslation(['dashboard', 'common']);
  const isBoss = quest.isBossQuest || quest.isWeeklyBoss;
  const [isFailed, setIsFailed] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  let cardClasses = `relative p-5 sm:p-7 rounded-3xl border transition-all duration-300 overflow-hidden group shadow-sm flex flex-col h-full w-full `;
  if (isBoss && !isFailed && !isCompleting) {
    cardClasses += ' bg-accent-red/[0.03] backdrop-blur-3xl border-accent-red/20 hover:border-accent-red/40';
  } else if (!isFailed && !isCompleting) {
    cardClasses += ' bg-white/[0.015] backdrop-blur-3xl border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.03] cursor-pointer';
  }

  if (isFailed) {
      cardClasses += ' bg-background border-border-color quest-fail-animation opacity-50 grayscale';
  }
  
  if (isCompleting) {
      cardClasses += ' bg-accent-green/10 border-accent-green shadow-[0_0_30px_rgba(46,160,67,0.3)] scale-[1.02] opacity-0 transition-all duration-700';
  }

  const handleComplete = () => {
      setIsCompleting(true);
      // Play a small sound if available (optional)
      setTimeout(() => {
          onComplete(quest.id);
      }, 700); // Wait for animation to finish
  };

  const sourceConfig = {
    google_calendar: { icon: <Calendar size={16} />, text: t('quest.sources.google_calendar'), color: 'text-blue-400' },
    github: { icon: <GitCommit size={16} />, text: t('quest.sources.github'), color: 'text-gray-400' },
    user: { icon: <UserIcon size={16} />, text: t('quest.sources.user'), color: 'text-green-400' },
    ai_chatbot: { icon: <Bot size={16} />, text: t('quest.sources.ai_chatbot'), color: 'text-purple-400' },
    ai_system: { icon: <Cpu size={16} />, text: t('quest.sources.ai_system'), color: 'text-gray-500' },
  };

  const sourceInfo = quest.source ? sourceConfig[quest.source] : null;

  return (
    <>
    <style>{`
        @keyframes quest-fail-anim {
          0% { transform: translateX(0); border-color: #DA3633; box-shadow: 0 0 10px rgba(218, 54, 51, 0.5); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
          50% { border-color: #30363D; box-shadow: none; }
          100% { transform: translateX(0); border-color: #DA3633; }
        }
        .quest-fail-animation { animation: quest-fail-anim 1.5s ease-in-out forwards; }
        
        @keyframes float-up-fade {
          0% { opacity: 0; transform: translateY(10px) scale(0.8); }
          20% { opacity: 1; transform: translateY(-10px) scale(1.1); }
          80% { opacity: 1; transform: translateY(-30px) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.9); }
        }
        .animate-float-up { animation: float-up-fade 0.7s ease-out forwards; }
    `}</style>
    
    <motion.div 
      className={cardClasses}
      whileHover={!isCompleting && !isFailed ? { y: -4, scale: 1.01 } : {}}
      transition={{ duration: 0.2 }}
      layout
    >
      {/* Dynamic completion overlay */}
      <AnimatePresence>
        {isCompleting && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none rounded-2xl"
            >
                <div className="flex flex-col items-center animate-float-up space-y-2">
                    <Sparkles className="text-accent-green w-10 h-10 mb-1" />
                    <div className="flex space-x-3 text-xl font-black shrink-0">
                        <span className="text-accent-secondary drop-shadow-[0_2px_10px_rgba(227,179,65,0.5)]">+{quest.xp_reward} XP</span>
                        <span className="text-accent-green drop-shadow-[0_2px_10px_rgba(46,160,67,0.5)]">+{quest.credit_reward} CR</span>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full relative z-10 w-full">
        <div className="flex items-start justify-between mb-2 sm:mb-3 w-full gap-4">
          <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
              <h3 className={`text-lg font-black tracking-tight ${isBoss ? 'text-accent-red' : 'text-text-primary'}`}>
                 {isBoss && <span className="mr-2 inline-block px-1.5 py-0.5 text-[8px] bg-accent-red/10 text-accent-red border border-accent-red/30 rounded uppercase tracking-[0.2em] font-black align-middle">{t('quest.boss')}</span>}
                 {quest.title}
              </h3>
           </div>
           {sourceInfo && (
              <div title={sourceInfo.text} className={`p-1.5 rounded-lg bg-white/5 ${sourceInfo.color} shrink-0 mt-0.5 shadow-sm`}>
                  {sourceInfo.icon}
              </div>
           )}
        </div>
        
        <p className="text-sm text-text-secondary leading-relaxed mb-4 flex-grow opacity-70">{quest.description}</p>

        <div className="mt-auto border-t border-white/5 pt-4 sm:pt-5">
           <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2.5 text-sm font-bold w-full">
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20 shadow-sm">
                  <Star className="w-4 h-4" />
                  <span>{quest.xp_reward} XP</span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-accent-green/10 text-accent-green border border-accent-green/20 shadow-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>{quest.credit_reward} CR</span>
                </div>
                <div className="flex items-center space-x-1.5 text-text-secondary bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <Clock className="w-4 h-4 opacity-70" />
                  <span>{quest.duration_est_min}m</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-white/[0.02] border border-white/5 ${difficultyColors[quest.difficulty]}`}>
                        {t(`common:difficulty.${quest.difficulty}`)}
                    </span>
                </div>
                {quest.penalty && (
                  <div className="flex items-center space-x-1.5 text-accent-red bg-accent-red/10 px-3 py-1.5 rounded-lg border border-accent-red/20 shadow-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>-{quest.penalty.amount} {quest.penalty.type}</span>
                  </div>
                )}
                {quest.deadline && (
                    <div className="flex items-center space-x-1.5 text-accent-red font-mono bg-accent-red/5 px-3 py-1.5 rounded-lg border border-accent-red/10 shadow-sm whitespace-nowrap">
                        <Countdown deadline={quest.deadline} onExpire={() => setIsFailed(true)} />
                    </div>
                )}
              </div>
              
              <div className="w-full flex justify-end shrink-0 pt-1">
                <button
                  onClick={handleComplete}
                  disabled={isFailed || isCompleting}
                  className={`w-full sm:w-[140px] flex items-center justify-center space-x-2 font-black text-[11px] uppercase tracking-[0.1em] py-2.5 px-4 rounded-lg transition-all duration-500
                    ${(isFailed || isCompleting) 
                      ? 'bg-transparent border border-white/5 text-text-muted cursor-not-allowed' 
                      : 'bg-accent-green/10 border border-accent-green/30 text-accent-green hover:bg-accent-green hover:text-white'
                    }
                  `}
                 >
                  <CheckCircle className={`w-4 h-4`} />
                  <span>{t('common:buttons.complete')}</span>
                </button>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
    </>
  );
};

export default QuestCard;