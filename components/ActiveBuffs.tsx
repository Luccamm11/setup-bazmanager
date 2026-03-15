import React, { useState, useEffect } from 'react';
import { ActiveBuff } from '../types';
import { Zap, Shield, RefreshCw, ChevronsUp, Gift, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const containerVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.3, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
        className="bg-primary/40 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/5 shadow-glass relative overflow-hidden group"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-secondary/10 rounded-full mix-blend-screen filter blur-[40px] pointer-events-none group-hover:bg-accent-secondary/20 transition-all duration-700"></div>
        
        <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-accent-secondary shadow-sm">
                <Sparkles size={20} className="animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">Active Buffs</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-2"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
            <AnimatePresence>
            {activeBuffs.map(buff => {
                 const icon = itemIcons[buff.effect.type];
                 return (
                    <motion.div 
                        key={buff.itemId} 
                        variants={itemVariants}
                        layout
                        className="bg-black/20 p-4 rounded-2xl border border-white/5 flex items-center space-x-4 hover:bg-white/5 hover:border-white/10 transition-all duration-300 group/item hover:shadow-glow-secondary hover:-translate-y-1"
                    >
                        <div className="flex-shrink-0 p-2 bg-white/5 rounded-xl border border-white/5 group-hover/item:scale-110 transition-transform duration-300">{icon}</div>
                        <div className="flex-grow min-w-0">
                            <p className="font-bold text-white tracking-wide truncate">{buff.itemName}</p>
                            <div className="flex items-center text-xs font-medium text-accent-secondary bg-accent-secondary/10 inline-flex px-2 py-0.5 rounded-lg border border-accent-secondary/20 space-x-1.5 mt-1.5 shadow-sm">
                                <Clock size={12} />
                                <BuffCountdown expiryTimestamp={buff.expiryTimestamp} />
                            </div>
                        </div>
                    </motion.div>
                 )
            })}
            </AnimatePresence>
        </div>
    </motion.div>
  );
};

export default ActiveBuffs;