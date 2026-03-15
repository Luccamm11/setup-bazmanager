import React from 'react';
import { User, Realm, SyncStatus } from '../types';
import XpBar from './XpBar';
import { Settings, Flame, Heart, BrainCircuit, Zap, Sparkles, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  user: User;
  userPicture?: string | null;
  onSettingsClick: () => void;
  syncStatus: SyncStatus;
}

const StatDisplay: React.FC<{ icon: React.ReactNode; value: number; colorClass: string; bgClass: string; label: string }> = ({ icon, value, colorClass, bgClass, label }) => (
  <div className={`flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-white/[0.03] ${bgClass} transition-all duration-300 hover:bg-white/[0.08] group`}>
    <div className={`p-1 sm:p-1.5 rounded-md bg-black/20 ${colorClass}`}>
      {icon}
    </div>
    <div className="flex flex-col">
        <span className="text-[7.5px] sm:text-[9px] uppercase font-black text-text-muted tracking-[0.1em] leading-tight mb-0.5">{label}</span>
        <span className={`text-xs sm:text-base font-black ${colorClass} leading-none`}>{value}</span>
    </div>
  </div>
);

const SyncIndicator: React.FC<{ status: SyncStatus }> = ({ status }) => {
    const config = {
        idle: { icon: null, text: '', color: '' },
        syncing: { icon: <Loader2 size={16} className="animate-spin" />, text: 'Saving...', color: 'text-accent-primary' },
        synced: { icon: <CheckCircle size={16} />, text: 'Saved', color: 'text-accent-green' },
        error: { icon: <AlertTriangle size={16} />, text: 'Save Error', color: 'text-accent-red' },
    };
    const current = config[status];
    if (status === 'idle') return null;

    return (
        <div className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 ${current.color} transition-all duration-500`}>
            {current.icon}
            <span>{current.text}</span>
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ user, userPicture, onSettingsClick, syncStatus }) => {
    const activeBuffNames = user.activeBuffs.map(b => b.itemName).join(', ');
  return (
    <header className="bg-primary/60 backdrop-blur-xl border-b border-white/5 px-3 sm:px-6 lg:px-8 py-3 sm:py-6 mb-4 sm:mb-6 sticky top-0 z-40 shadow-glass">
       <style>{`
        @keyframes streak-pulse-anim {
          0%, 100% { 
            transform: scale(1);
            filter: drop-shadow(0 0 5px rgba(234, 179, 8, 0.4));
          }
          50% { 
            transform: scale(1.05);
            filter: drop-shadow(0 0 12px rgba(234, 179, 8, 0.8));
          }
        }
        .streak-pulse {
          animation: streak-pulse-anim 2.5s infinite ease-in-out;
        }
        @keyframes buff-pulse-anim {
          0%, 100% { 
            transform: scale(1);
            filter: drop-shadow(0 0 3px rgba(168, 85, 247, 0.5));
          }
          50% { 
            transform: scale(1.15);
            filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.9));
          }
        }
        .buff-pulse {
          animation: buff-pulse-anim 2s infinite ease-in-out;
        }
      `}</style>
      <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:gap-5">
        <div className="flex justify-between items-start lg:items-center w-full gap-4">
            {/* User Info Section */}
            <div className="flex items-center space-x-3 sm:space-x-5 shrink min-w-0">
              <div className="relative group cursor-pointer shrink-0">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-primary to-accent-tertiary rounded-full opacity-60 group-hover:opacity-100 blur-[2px] transition duration-500"></div>
                <img 
                  src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`} 
                  alt="User profile"
                  className="relative w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-primary border-2 border-background object-cover"
                />
                <span className="absolute -bottom-1 -right-1 sm:-right-2 text-[8px] sm:text-xs bg-gradient-to-r from-accent-tertiary to-accent-primary text-white font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white/20 z-10">LVL {user.level_overall}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1">
                  <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight drop-shadow-md truncate">{user.name}</h1>
                   {user.activeBuffs.length > 0 && (
                      <div className="relative group shrink-0" title={`Active Buffs: ${activeBuffNames}`}>
                          <Zap size={20} className="text-accent-tertiary buff-pulse sm:w-[22px] sm:h-[22px]" />
                      </div>
                  )}
                  {user.streaks.daily_streak > 0 && (
                    <div className="flex items-center space-x-1.5 bg-gradient-to-r from-accent-secondary/20 to-orange-500/20 border border-accent-secondary/30 px-2 py-0.5 rounded-full text-xs sm:text-sm font-bold streak-pulse text-accent-secondary shadow-glow-secondary shrink-0" title={`Current daily streak: ${user.streaks.daily_streak} days`}>
                      <Flame size={14} className="sm:w-4 sm:h-4" />
                      <span>{user.streaks.daily_streak}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] sm:text-sm text-accent-primary/90 font-bold uppercase tracking-widest mt-0.5 truncate">{user.rank}</p>
              </div>
            </div>
            
            {/* Right Actions & Stats Section */}
            <div className="flex flex-col items-end space-y-2 sm:space-y-4 shrink-0">
                <div className="flex items-center space-x-2 sm:space-x-3 bg-white/[0.03] p-1 rounded-xl border border-white/5 backdrop-blur-md">
                    <SyncIndicator status={syncStatus} />
                    <button onClick={onSettingsClick} className="p-1 sm:p-2 rounded-lg text-text-secondary hover:text-white transition-all">
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5 opacity-60 group-hover:opacity-100" />
                    </button>
                </div>
                
                {/* Desktop Stats Row */}
                <div className="hidden lg:flex gap-3">
                    <StatDisplay icon={<BrainCircuit size={16} />} value={user.stats[Realm.Mind]} colorClass="text-accent-primary" bgClass="bg-accent-primary/10 hover:bg-accent-primary/20" label="Mind" />
                    <StatDisplay icon={<Heart size={16} />} value={user.stats[Realm.Body]} colorClass="text-accent-red" bgClass="bg-accent-red/10 hover:bg-accent-red/20" label="Body" />
                    <StatDisplay icon={<Zap size={16} />} value={user.stats[Realm.Creation]} colorClass="text-accent-secondary" bgClass="bg-accent-secondary/10 hover:bg-accent-secondary/20" label="Creation" />
                    <StatDisplay icon={<Sparkles size={16} />} value={user.stats[Realm.Spirit]} colorClass="text-accent-tertiary" bgClass="bg-accent-tertiary/10 hover:bg-accent-tertiary/20" label="Spirit" />
                </div>
            </div>
        </div>
        
        {/* Mobile/Tablet Stats Row */}
        <div className="flex lg:hidden w-full gap-1.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <StatDisplay icon={<BrainCircuit size={16} />} value={user.stats[Realm.Mind]} colorClass="text-accent-primary" bgClass="bg-accent-primary/10 shrink-0" label="Mind" />
            <StatDisplay icon={<Heart size={16} />} value={user.stats[Realm.Body]} colorClass="text-accent-red" bgClass="bg-accent-red/10 shrink-0" label="Body" />
            <StatDisplay icon={<Zap size={16} />} value={user.stats[Realm.Creation]} colorClass="text-accent-secondary" bgClass="bg-accent-secondary/10 shrink-0" label="Creation" />
            <StatDisplay icon={<Sparkles size={16} />} value={user.stats[Realm.Spirit]} colorClass="text-accent-tertiary" bgClass="bg-accent-tertiary/10 shrink-0" label="Spirit" />
        </div>
      </div>
      
      {/* XP Bar moved slightly out of the main grid for full-width layout inside header */}
      <div className="max-w-7xl mx-auto mt-3 sm:mt-5">
        <XpBar currentXp={user.xp_total} xpToNextLevel={user.xpToNextLevel} />
      </div>
    </header>
  );
};

export default Header;