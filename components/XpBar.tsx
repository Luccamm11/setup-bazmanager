import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface XpBarProps {
  currentXp: number;
  xpToNextLevel: number;
}

const XpBar: React.FC<XpBarProps> = ({ currentXp, xpToNextLevel }) => {
  const { t } = useTranslation();
  const progressPercentage = Math.min((currentXp / xpToNextLevel) * 100, 100);

  return (
    <div className="w-full group">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] text-accent-primary/60 uppercase">{t('common:progress')}</span>
        <span className="text-[10px] sm:text-xs font-bold text-white/80 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">{`${currentXp} / ${xpToNextLevel}`}</span>
      </div>
      <div className="w-full bg-black/20 rounded-full h-1.5 sm:h-2 relative overflow-hidden flex items-center">
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