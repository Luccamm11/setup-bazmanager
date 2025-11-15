import React from 'react';

interface XpBarProps {
  currentXp: number;
  xpToNextLevel: number;
}

const XpBar: React.FC<XpBarProps> = ({ currentXp, xpToNextLevel }) => {
  const progressPercentage = Math.min((currentXp / xpToNextLevel) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs text-text-secondary mb-1">
        <span>XP</span>
        <span>{`${currentXp} / ${xpToNextLevel}`}</span>
      </div>
      <div className="w-full bg-background rounded-full h-2.5 border border-border-color p-0.5">
        <div 
          className="bg-gradient-to-r from-accent-primary to-accent-tertiary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default XpBar;