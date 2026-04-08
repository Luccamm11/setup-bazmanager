import React from 'react';
import { User, Realm, SyncStatus } from '../types';
import XpBar from './XpBar';
import { Settings, Flame, Heart, BrainCircuit, Zap, Sparkles, CheckCircle, Loader2, AlertTriangle, Globe, BookText, Users, Mic2, ClipboardList, Code, Hammer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const realmStatsConfig: { [key in Realm]?: { icon: React.ReactNode; color: string; bg: string } } = {
  [Realm.Programming]: { icon: <Code size={14} />, color: "text-blue-400", bg: "bg-blue-500/10" },
  [Realm.Engineering]: { icon: <Hammer size={14} />, color: "text-orange-400", bg: "bg-orange-500/10" },
  [Realm.TechnicalWriting]: { icon: <BookText size={14} />, color: "text-slate-400", bg: "bg-slate-500/10" },
  [Realm.Networking]: { icon: <Users size={14} />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  [Realm.Planning]: { icon: <ClipboardList size={14} />, color: "text-amber-400", bg: "bg-amber-500/10" },
  [Realm.Oratory]: { icon: <Mic2 size={14} />, color: "text-rose-400", bg: "bg-rose-500/10" },
  [Realm.Creativity]: { icon: <Zap size={14} />, color: "text-violet-400", bg: "bg-violet-500/10" },
  [Realm.FirstCulture]: { icon: <Globe size={14} />, color: "text-cyan-400", bg: "bg-cyan-500/10" },
};

interface HeaderProps {
  user: User;
  userPicture?: string | null;
  onSettingsClick: () => void;
  syncStatus: SyncStatus;
}

const StatDisplay: React.FC<{ icon: React.ReactNode; value: number; colorClass: string; bgClass: string; label: string }> = ({ icon, value, colorClass, bgClass, label }) => (
  <div className={`flex items-center space-x-1 sm:space-x-2 px-1.5 py-1 sm:px-3 sm:py-2 rounded-lg border border-white/[0.03] ${bgClass} transition-all duration-300 hover:bg-white/[0.08] group`}>
    <div className={`p-0.5 sm:p-1.5 rounded-md bg-black/20 ${colorClass}`}>
      {icon}
    </div>
    <div className="flex flex-col">
        <span className="text-[7px] sm:text-[9px] uppercase font-black text-text-muted tracking-[0.1em] leading-tight">{label}</span>
        <span className={`text-[11px] sm:text-base font-black ${colorClass} leading-none`}>{value}</span>
    </div>
  </div>
);

const SyncIndicator: React.FC<{ status: SyncStatus }> = ({ status }) => {
    const { t } = useTranslation();
    const config = {
        idle: { icon: null, text: '', color: '', bg: '' },
        syncing: { icon: <Loader2 size={14} className="animate-spin" />, text: t('states.syncing'), color: 'text-accent-primary', bg: 'bg-accent-primary/5' },
        synced: { icon: <CheckCircle size={14} />, text: t('states.synced'), color: 'text-accent-green', bg: 'bg-accent-green/5' },
        error: { icon: <AlertTriangle size={14} />, text: t('states.error'), color: 'text-accent-red', bg: 'bg-accent-red/5' },
    };
    const current = config[status];
    if (status === 'idle') return null;

    return (
        <div 
            className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md ${current.bg} ${current.color} transition-all duration-500 shadow-glass animate-in fade-in slide-in-from-right-4`}
            title={status === 'error' ? 'Connection to System Core lost. Retrying on next change.' : ''}
        >
            {current.icon}
            <span className="hidden sm:inline">{current.text}</span>
        </div>
    );
};

const LanguageToggle: React.FC = () => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    const toggleLanguage = () => {
        const newLang = currentLang === 'pt-BR' || currentLang === 'pt' ? 'en' : 'pt-BR';
        i18n.changeLanguage(newLang);
    };

    const isPtBR = currentLang === 'pt-BR' || currentLang === 'pt';

    return (
        <button
            onClick={toggleLanguage}
            title={isPtBR ? 'Switch to English' : 'Mudar para Português'}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-text-secondary hover:text-white transition-all text-xs font-bold"
        >
            <Globe size={13} />
            <span>{isPtBR ? 'EN' : 'PT'}</span>
        </button>
    );
};

const Header: React.FC<HeaderProps> = ({ user, userPicture, onSettingsClick, syncStatus }) => {
    const { t } = useTranslation();
    const activeBuffNames = user.activeBuffs.map(b => b.itemName).join(', ');
  return (
    <header className="bg-primary/60 backdrop-blur-xl border-b border-white/5 px-3 sm:px-6 lg:px-8 py-2 sm:py-6 mb-2 sm:mb-6 sticky top-0 z-40 shadow-glass">
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
      <div className="max-w-7xl mx-auto flex flex-col gap-1.5 sm:gap-5">
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
                      <div className="relative group shrink-0" title={`${t('store:active_buffs')}: ${activeBuffNames}`}>
                          <Zap size={20} className="text-accent-tertiary buff-pulse sm:w-[22px] sm:h-[22px]" />
                      </div>
                  )}
                  {user.streaks.daily_streak > 0 && (
                    <div className="flex items-center space-x-1.5 bg-gradient-to-r from-accent-secondary/20 to-orange-500/20 border border-accent-secondary/30 px-2 py-0.5 rounded-full text-xs sm:text-sm font-bold streak-pulse text-accent-secondary shadow-glow-secondary shrink-0" title={`${t('streak')}: ${user.streaks.daily_streak} ${t('days')}`}>
                      <Flame size={14} className="sm:w-4 sm:h-4" />
                      <span>{user.streaks.daily_streak}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] sm:text-sm text-accent-primary/90 font-bold uppercase tracking-widest mt-0.5 truncate">{t(`constants:ranks.${user.rank}`)}</p>
              </div>
            </div>
            
            {/* Right Actions & Stats Section */}
            <div className="flex flex-col items-end space-y-2 sm:space-y-4 shrink-0">
                <div className="flex items-center space-x-2 sm:space-x-3 bg-white/[0.03] p-1 rounded-xl border border-white/5 backdrop-blur-md">
                    <SyncIndicator status={syncStatus} />
                    <LanguageToggle />
                    <button onClick={onSettingsClick} className="p-1 sm:p-2 rounded-lg text-text-secondary hover:text-white transition-all">
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5 opacity-60 group-hover:opacity-100" />
                    </button>
                </div>
                
                {/* Desktop Stats Row */}
                <div className="hidden lg:flex gap-3">
                    {Object.entries(realmStatsConfig).map(([realm, config]) => (
                        <StatDisplay 
                            key={realm}
                            icon={config.icon} 
                            value={user.stats[realm as Realm] || 0} 
                            colorClass={config.color} 
                            bgClass={`${config.bg} hover:bg-opacity-20`} 
                            label={t(`common:realm.${realm}`)} 
                        />
                    ))}
                </div>
            </div>
        </div>
        
        {/* Mobile/Tablet Stats Row */}
        <div className="flex lg:hidden w-full gap-1 sm:gap-3 overflow-x-auto scrollbar-hide py-1">
            {Object.entries(realmStatsConfig).map(([realm, config]) => (
                <StatDisplay 
                    key={`mobile-${realm}`}
                    icon={config.icon} 
                    value={user.stats[realm as Realm] || 0} 
                    colorClass={config.color} 
                    bgClass={`${config.bg} shrink-0`} 
                    label={t(`common:realm.${realm}`)} 
                />
            ))}
        </div>
      </div>
      
      {/* XP Bar */}
      <div className="max-w-7xl mx-auto mt-1.5 sm:mt-5">
        <XpBar currentXp={user.xp_total} xpToNextLevel={user.xpToNextLevel} />
      </div>
    </header>
  );
};

export default Header;