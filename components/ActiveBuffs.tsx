import React, { useState, useEffect } from 'react';
import { ActiveBuff } from '../types';
import { Zap, Shield, RefreshCw, ChevronsUp, Gift, Clock } from 'lucide-react';

interface ActiveBuffsProps {
  activeBuffs: ActiveBuff[];
}

const itemIcons: { [key: string]: React.ReactNode } = {
    'XP_BOOST': <Zap className="w-6 h-6 text-accent-secondary" />,
    'STREAK_SAVER': <Shield className="w-6 h-6 text-accent-primary" />,
    'QUEST_REROLL': <RefreshCw className="w-6 h-6 text-accent-green" />,
    'INSTANT_STREAK': <ChevronsUp className="w-6 h-6 text-accent-secondary" />,
    'REAL_WORLD_REWARD': <Gift className="w-6 h-6 text-accent-tertiary" />,
};

const BuffCountdown: React.FC<{ expiryTimestamp: number }> = ({ expiryTimestamp }) => {
    const [timeLeft, setTimeLeft] = useState(expiryTimestamp - Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(expiryTimestamp - Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, [expiryTimestamp]);

    if (timeLeft <= 0) {
        return <span className="font-mono">Expired</span>;
    }
    
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)));
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    return (
        <span className="font-mono">
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
    );
};


const ActiveBuffs: React.FC<ActiveBuffsProps> = ({ activeBuffs }) => {
  if (activeBuffs.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary p-3 sm:p-4 rounded-lg border border-border-color">
        <h3 className="text-lg font-bold text-text-primary mb-3">Active Buffs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeBuffs.map(buff => {
                 const icon = itemIcons[buff.effect.type];
                 return (
                    <div key={buff.itemId} className="bg-background p-3 rounded-lg border border-border-color flex items-center space-x-3">
                        <div className="flex-shrink-0">{icon}</div>
                        <div className="flex-grow">
                            <p className="font-semibold text-text-primary">{buff.itemName}</p>
                            <div className="flex items-center text-xs text-text-secondary space-x-1 mt-1">
                                <Clock size={12} />
                                <BuffCountdown expiryTimestamp={buff.expiryTimestamp} />
                            </div>
                        </div>
                    </div>
                 )
            })}
        </div>
    </div>
  );
};

export default ActiveBuffs;