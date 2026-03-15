import React from 'react';
import { motion } from 'framer-motion';

interface XpBarProps {
  currentXp: number;
  xpToNextLevel: number;
}

const XpBar: React.FC<XpBarProps> = ({ currentXp, xpToNextLevel }) => {
  const progressPercentage = Math.min((currentXp / xpToNextLevel) * 100, 100);

  return (
    <div className="w-full group">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] sm:text-xs font-black tracking-widest text-accent-primary uppercase drop-shadow-sm">Experience</span>
        <span className="text-xs sm:text-sm font-bold text-white border border-white/10 bg-white/5 px-2 py-0.5 rounded-md shadow-sm">{`${currentXp} / ${xpToNextLevel}`}</span>
      </div>
      <div className="w-full bg-black/40 rounded-full h-3 sm:h-4 border border-white/5 p-0.5 relative overflow-hidden shadow-inner flex items-center">
        <motion.div 
          className="h-full bg-gradient-to-r from-accent-primary via-blue-400 to-accent-tertiary rounded-full shadow-glow-primary relative overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none"></div>
            <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-white/40 to-transparent blur-[2px]"></div>
        </motion.div>
      </div>
    </div>
  );
};

export default XpBar;