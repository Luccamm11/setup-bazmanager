import React, { useState } from 'react';
import { User, WeeklyProgress, ActivityData, Realm } from '../../types';
import StatsRadarChart from '../charts/StatsRadarChart';
import WeeklyXpChart from '../charts/WeeklyXpChart';
import { 
    User as UserIcon, 
    Calendar, 
    GraduationCap, 
    Trophy, 
    Settings2, 
    Eye, 
    EyeOff,
    LayoutDashboard,
    BarChart3,
    History,
    Dna
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BLeedProfileDashboardProps {
    user: User;
    weeklyProgress?: WeeklyProgress[];
    activityLog?: ActivityData[];
    currentDate: Date;
}

const BLeedProfileDashboard: React.FC<BLeedProfileDashboardProps> = ({ 
    user, 
    weeklyProgress = [], 
    activityLog = [], 
    currentDate 
}) => {
    // Visibility Toggles State
    const [visibility, setVisibility] = useState({
        photo: true,
        fullName: true,
        details: true, // Série, temporadas, entrada
        description: true,
        awardFocus: true,
        radarChart: true,
        barChart: true,
        birthDate: true
    });

    const [showSettings, setShowSettings] = useState(false);

    const toggleVisibility = (key: keyof typeof visibility) => {
        setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Formatar temporadas como badges
    const renderSeasons = () => {
        if (!user.seasons || user.seasons.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {user.seasons.map((season, i) => (
                    <span key={i} className="px-3 py-1 bg-accent-primary/20 text-accent-primary text-[10px] font-black uppercase rounded-full border border-accent-primary/30">
                        {season}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8 relative">
            {/* Visibility Dashboard Control */}
            <div className="flex justify-end sticky top-0 z-20">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-3 bg-primary/80 backdrop-blur-xl border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-all shadow-glass group"
                >
                    <Settings2 size={20} className={showSettings ? 'rotate-90' : ''} />
                </button>
                
                <AnimatePresence>
                    {showSettings && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute top-14 right-0 w-64 bg-primary/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl z-30"
                        >
                            <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                <LayoutDashboard size={16} className="text-accent-primary" />
                                Customizar Visualização
                            </h4>
                            <div className="space-y-3">
                                {Object.entries(visibility).map(([key, value]) => (
                                    <button 
                                        key={key}
                                        onClick={() => toggleVisibility(key as any)}
                                        className="flex items-center justify-between w-full p-2 hover:bg-white/5 rounded-xl transition-all"
                                    >
                                        <span className="text-xs font-bold text-text-secondary capitalize">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                        </span>
                                        {value ? <Eye size={16} className="text-accent-primary" /> : <EyeOff size={16} className="text-text-muted" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MAIN PROFILE CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Bio & Photo */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-primary/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 shadow-glass overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-primary/10 rounded-full -translate-y-20 translate-x-20 blur-3xl" />
                        
                        <div className="flex flex-col items-center text-center relative z-10">
                            {visibility.photo && (
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary p-1 mb-6 shadow-glow-primary">
                                    <div className="w-full h-full rounded-full bg-primary flex items-center justify-center overflow-hidden border-4 border-primary">
                                        <UserIcon size={50} className="text-text-muted" />
                                    </div>
                                </div>
                            )}
                            
                            {visibility.fullName && (
                                <>
                                    <h2 className="text-2xl font-black text-text-primary tracking-tight">
                                        {user.fullName || user.name}
                                    </h2>
                                    <p className="text-accent-primary font-black uppercase tracking-widest text-[10px] mt-1">
                                        {user.rank} • LVL {user.level_overall}
                                    </p>
                                </>
                            )}

                            {visibility.description && user.bio && (
                                <div className="mt-8 text-left">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Quem sou eu</p>
                                    <p className="text-text-secondary text-sm leading-relaxed italic">
                                        "{user.bio}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Personal Stats Details */}
                    {visibility.details && (
                        <div className="bg-primary/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-glass space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl">
                                <GraduationCap className="text-accent-secondary" size={20} />
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Série / Ano</p>
                                    <p className="text-sm font-bold text-text-primary">{user.grade || 'Não informado'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl">
                                <Calendar className="text-accent-tertiary" size={20} />
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Membro desde</p>
                                    <p className="text-sm font-bold text-text-primary">{user.entryDate || 'Não informado'}</p>
                                </div>
                            </div>
                            {visibility.birthDate && (
                                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl">
                                    <History className="text-accent-red" size={20} />
                                    <div>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Data de Nascimento</p>
                                        <p className="text-sm font-bold text-text-primary">{user.birthDate || 'Não informado'}</p>
                                    </div>
                                </div>
                            )}
                            <div className="p-3 bg-white/5 rounded-2xl">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Temporadas</p>
                                {renderSeasons() || <p className="text-xs text-text-muted italic">Nenhuma temporada registrada</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Charts & Focus */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Award Focus Banner */}
                    {visibility.awardFocus && (
                        <div className="bg-gradient-to-r from-accent-tertiary/20 to-accent-primary/20 border border-accent-tertiary/30 p-8 rounded-[2rem] shadow-glass relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                                <Trophy size={80} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-accent-tertiary uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                    <Dna size={14} /> Foco em Prêmios
                                </p>
                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase underline decoration-accent-tertiary underline-offset-8 decoration-4">
                                    {user.awardFocus || 'Multitarefa'}
                                </h3>
                                <p className="text-text-secondary mt-4 text-sm font-medium">
                                    Especialista dedicado a impulsionar a estratégia de {user.awardFocus || 'versatilidade operacional'} da Bazinga! 73.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Graphs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {visibility.radarChart && (
                            <div className="bg-primary/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-glass relative group">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                                        <History size={16} className="text-accent-primary" /> Atributos B-LEED
                                    </h3>
                                </div>
                                <div className="h-[250px] flex items-center justify-center p-4">
                                    <StatsRadarChart stats={user.stats} />
                                </div>
                            </div>
                        )}

                        {visibility.barChart && (
                            <div className="bg-primary/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-glass relative group">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                                        <BarChart3 size={16} className="text-accent-secondary" /> Nível de Competência
                                    </h3>
                                </div>
                                <div className="h-[250px] flex items-center justify-center p-4 overflow-hidden">
                                     {/* Representação em barra dos mesmos dados do radar */}
                                     <div className="w-full space-y-3 overflow-y-auto pr-2 max-h-full scrollbar-none">
                                         {Object.entries(user.stats).map(([key, value], index) => (
                                             <div key={key} className="space-y-1">
                                                 <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-text-secondary">
                                                     <span>{key}</span>
                                                     <span>{value}%</span>
                                                 </div>
                                                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                     <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${value}%` }}
                                                        transition={{ duration: 1, delay: index * 0.1 }}
                                                        className="h-full bg-accent-secondary shadow-glow-secondary"
                                                     />
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BLeedProfileDashboard;
