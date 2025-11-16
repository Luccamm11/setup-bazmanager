import React, { useState, useEffect, useCallback } from 'react';
import { Quest, Realm, Difficulty } from '../types';
import { CheckCircle, Star, DollarSign, Clock, AlertTriangle, Calendar, User as UserIcon, Bot, GitCommit, Cpu } from 'lucide-react';

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
        return <span className="font-mono">Expired</span>;
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
  const isBoss = quest.isBossQuest || quest.isWeeklyBoss;
  const [isFailed, setIsFailed] = useState(false);

  let cardClasses = `bg-background p-4 rounded-lg border border-border-color w-full transition-all duration-300`;
  if (isBoss && !isFailed) {
    cardClasses += ' border-accent-red';
  }
  if (isFailed) {
      cardClasses += ' quest-fail-animation';
  }

  const sourceConfig = {
    google_calendar: { icon: <Calendar size={16} />, text: 'From Google Calendar', color: 'text-blue-400' },
    github: { icon: <GitCommit size={16} />, text: 'From GitHub Activity', color: 'text-gray-400' },
    user: { icon: <UserIcon size={16} />, text: 'Personal Quest', color: 'text-green-400' },
    ai_chatbot: { icon: <Bot size={16} />, text: 'From AI Chat', color: 'text-purple-400' },
    ai_system: { icon: <Cpu size={16} />, text: 'System Generated', color: 'text-gray-500' },
  };

  const sourceInfo = quest.source ? sourceConfig[quest.source] : null;

  return (
    <>
    <style>{`
        @keyframes quest-fail-anim {
          0% {
            transform: translateX(0);
            border-color: #DA3633;
            box-shadow: 0 0 10px rgba(218, 54, 51, 0.5);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
          50% {
             border-color: #30363D;
             box-shadow: none;
          }
          100% {
            transform: translateX(0);
            opacity: 0;
            border-color: #DA3633;
          }
        }
        .quest-fail-animation {
            animation: quest-fail-anim 1.5s ease-in-out forwards;
        }
    `}</style>
    <div className={cardClasses}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex-grow">
          <div className="flex items-center space-x-2">
             <h3 className="text-lg font-bold text-text-primary">{quest.title}</h3>
             {sourceInfo && (
                <div title={sourceInfo.text} className={sourceInfo.color}>
                    {sourceInfo.icon}
                </div>
             )}
          </div>
          <p className="text-sm text-text-secondary mt-1">{quest.description}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-text-primary">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-accent-secondary" />
              <span>{quest.xp_reward} XP</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-accent-green" />
              <span>{quest.credit_reward} Credits</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-text-secondary" />
              <span>{quest.duration_est_min} min</span>
            </div>
            <span className={`font-semibold ${difficultyColors[quest.difficulty]}`}>{quest.difficulty}</span>
            {quest.penalty && (
              <div className="flex items-center space-x-1 text-accent-red font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>-{quest.penalty.amount} {quest.penalty.type}</span>
              </div>
            )}
            {quest.deadline && (
                <div className="flex items-center space-x-1 text-accent-red font-semibold">
                    <Countdown deadline={quest.deadline} onExpire={() => setIsFailed(true)} />
                </div>
            )}
          </div>
        </div>
        <div className="mt-4 md:mt-0 md:ml-4 flex-shrink-0">
          <button
            onClick={() => onComplete(quest.id)}
            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-accent-green text-white font-bold py-2 px-4 rounded-lg hover:bg-accent-green-hover"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Complete</span>
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default QuestCard;