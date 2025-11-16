import React from 'react';
import { User, Realm, SyncStatus } from '../types';
import XpBar from './XpBar';
import { Settings, Flame, Heart, BrainCircuit, Zap, Sparkles, CheckCircle, Loader2, AlertTriangle, CloudOff, Cloud, CloudCheck } from 'lucide-react';
import * as googleAuth from '../auth/googleAuth';

interface HeaderProps {
  user: User;
  userProfile: googleAuth.UserProfile | null;
  onSettingsClick: () => void;
  syncStatus: SyncStatus;
}

const StatDisplay: React.FC<{ icon: React.ReactNode; value: number; color: string }> = ({ icon, value, color }) => (
  <div className={`flex items-center space-x-1 text-sm font-semibold ${color}`}>
    {icon}
    <span>{value}</span>
  </div>
);

const SyncIndicator: React.FC<{ status: SyncStatus }> = ({ status }) => {
    const config = {
        // FIX: Added a color property to the idle state to satisfy TypeScript's type checker, even though this branch returns null.
        idle: { icon: null, text: '', color: '' },
        syncing: { icon: <Loader2 size={16} className="animate-spin" />, text: 'Saving...', color: 'text-accent-primary' },
        synced: { icon: <CheckCircle size={16} />, text: 'Saved Locally', color: 'text-accent-green' },
        syncing_cloud: { icon: <Cloud size={16} className="animate-pulse" />, text: 'Syncing to cloud...', color: 'text-accent-primary' },
        synced_cloud: { icon: <CloudCheck size={16} />, text: 'Synced to Cloud', color: 'text-accent-green' },
        error: { icon: <CloudOff size={16} />, text: 'Sync Error', color: 'text-accent-red' },
    };
    const current = config[status];
    if (status === 'idle') return null;

    return (
        <div className={`flex items-center space-x-1 text-xs font-semibold p-1 rounded-md ${current.color} transition-opacity duration-500`}>
            {current.icon}
            <span>{current.text}</span>
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ user, userProfile, onSettingsClick, syncStatus }) => {
    const activeBuffNames = user.activeBuffs.map(b => b.itemName).join(', ');
  return (
    <header className="bg-background p-3 sm:p-4 sticky top-0 z-40">
       <style>{`
        @keyframes streak-pulse-anim {
          0%, 100% { 
            transform: scale(1);
            text-shadow: 0 0 4px rgba(88, 166, 255, 0.4);
          }
          50% { 
            transform: scale(1.05);
            text-shadow: 0 0 10px rgba(88, 166, 255, 0.7);
          }
        }
        .streak-pulse {
          animation: streak-pulse-anim 2.5s infinite ease-in-out;
        }
        @keyframes buff-pulse-anim {
          0%, 100% { 
            transform: scale(1);
            filter: drop-shadow(0 0 2px #E3B341);
          }
          50% { 
            transform: scale(1.1);
            filter: drop-shadow(0 0 5px #E3B341);
          }
        }
        .buff-pulse {
          animation: buff-pulse-anim 2s infinite ease-in-out;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={userProfile?.picture} 
                alt="User profile"
                className="w-14 h-14 rounded-full bg-primary border border-border-color"
              />
              <span className="absolute -bottom-2 -right-2 text-xs bg-accent-secondary text-background font-black px-2 py-0.5 rounded-full uppercase">LVL {user.level_overall}</span>
            </div>
            <div>
              <div className="flex items-center gap-x-3">
                <h1 className="text-lg sm:text-xl font-bold text-text-primary">{user.name}</h1>
                 {user.activeBuffs.length > 0 && (
                    <div className="relative group" title={`Active Buffs: ${activeBuffNames}`}>
                        <Zap size={20} className="text-accent-secondary buff-pulse" />
                    </div>
                )}
                {user.streaks.daily_streak > 0 && (
                  <div className="flex items-center space-x-1 text-accent-primary px-2 py-0.5 rounded-full text-sm font-semibold streak-pulse" title={`Current daily streak: ${user.streaks.daily_streak} days`}>
                    <Flame size={16} />
                    <span>{user.streaks.daily_streak}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-text-secondary font-semibold">{user.rank}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <SyncIndicator status={syncStatus} />
            <button onClick={onSettingsClick} className="p-2 rounded-full text-text-secondary hover:bg-primary/50 hover:text-white transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        <XpBar currentXp={user.xp_total} xpToNextLevel={user.xpToNextLevel} />

        <div className="mt-4 flex justify-around items-center bg-primary p-2 rounded-lg border border-border-color">
          <StatDisplay icon={<BrainCircuit size={18} />} value={user.stats[Realm.Mind]} color="text-accent-primary" />
          <StatDisplay icon={<Heart size={18} />} value={user.stats[Realm.Body]} color="text-accent-red" />
          <StatDisplay icon={<Zap size={18} />} value={user.stats[Realm.Creation]} color="text-accent-secondary" />
          <StatDisplay icon={<Sparkles size={18} />} value={user.stats[Realm.Spirit]} color="text-accent-tertiary" />
        </div>
      </div>
    </header>
  );
};

export default Header;