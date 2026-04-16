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
    Dna,
    Edit2,
    Save,
    CheckCircle2,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface BLeedProfileDashboardProps {
    user: User;
    weeklyProgress?: WeeklyProgress[];
    activityLog?: ActivityData[];
    currentDate: Date;
    onUpdateUser?: (user: any) => void;
    onBack?: () => void;
}

const BLeedProfileDashboard: React.FC<BLeedProfileDashboardProps> = ({ 
    activityLog = [], 
    currentDate,
    onUpdateUser,
    onBack
}) => {
    const { t } = useTranslation(['analytics', 'common']);
    
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

    // First-time setup state (Only for active registered users)
    const isLegacy = user.type === 'mentor' || user.type === 'former';
    const [isSetupOpen, setIsSetupOpen] = useState(!isLegacy && !user.profileSetup);
    const [setupData, setSetupData] = useState({
        fullName: user.fullName || '',
        grade: user.grade || '',
        entryDate: user.entryDate || '',
        birthDate: user.birthDate || '',
        seasons: user.seasons?.join(', ') || '',
        bio: user.bio || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveSetup = async () => {
        setIsSaving(true);
        try {
            const updatedUser = {
                ...user,
                fullName: setupData.fullName,
                grade: setupData.grade,
                entryDate: setupData.entryDate,
                birthDate: setupData.birthDate,
                seasons: setupData.seasons.split(',').map(s => s.trim()).filter(s => s !== ''),
                bio: setupData.bio,
                profileSetup: true
            };
            await onUpdateUser(updatedUser);
            setIsSetupOpen(false);
        } catch (error) {
            console.error('Error saving profile setup:', error);
        } finally {
            setIsSaving(false);
        }
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
            {/* Header with Back Button and Visibility Control */}
            <div className="flex justify-between items-center sticky top-0 z-20">
                {onBack && (
                    <button 
                        onClick={onBack}
                        className="p-3 bg-primary/80 backdrop-blur-xl border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-all shadow-glass flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"
                    >
                        <X size={18} /> {t('common:actions.back', 'Voltar')}
                    </button>
                )}
                <div className="flex-1" />
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
                                {t('analytics:profile.customize')}
                            </h4>
                            <div className="space-y-3">
                                {Object.entries(visibility).map(([key, value]) => (
                                    <button 
                                        key={key}
                                        onClick={() => toggleVisibility(key as any)}
                                        className="flex items-center justify-between w-full p-2 hover:bg-white/5 rounded-xl transition-all"
                                    >
                                        <span className="text-xs font-bold text-text-secondary">
                                            {t(`analytics:profile.${key}`)}
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
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon size={50} className="text-text-muted" />
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {visibility.fullName && (
                                <>
                                    <h2 className="text-2xl font-black text-text-primary tracking-tight">
                                        {user.fullName || user.name}
                                    </h2>
                                    <p className={`font-black uppercase tracking-widest text-[10px] mt-1 ${user.type === 'mentor' ? 'text-accent-tertiary' : user.type === 'former' ? 'text-accent-red' : 'text-accent-primary'}`}>
                                        {user.rank} {user.type === 'active' && `• LVL ${user.level_overall || 0}`}
                                    </p>
                                </>
                            )}

                            {visibility.description && user.bio && (
                                <div className="mt-8 text-left">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">{t('analytics:profile.description_label')}</p>
                                    <p className="text-text-secondary text-sm leading-relaxed italic">
                                        "{user.bio}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Basic Info Details */}
                    {visibility.details && (
                        <div className="bg-primary/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-glass space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl">
                                <GraduationCap className="text-accent-secondary" size={20} />
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">{t('analytics:profile.grade')}</p>
                                    <p className="text-sm font-bold text-text-primary">{user.grade || t('analytics:profile.not_informed')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl">
                                <Calendar className="text-accent-tertiary" size={20} />
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">{t('analytics:profile.entryDate')}</p>
                                    <p className="text-sm font-bold text-text-primary">{user.entryDate || t('analytics:profile.not_informed')}</p>
                                </div>
                            </div>
                            {visibility.birthDate && (
                                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl">
                                    <History className="text-accent-red" size={20} />
                                    <div>
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">{t('analytics:profile.birthDate')}</p>
                                        <p className="text-sm font-bold text-text-primary">{user.birthDate || t('analytics:profile.not_informed')}</p>
                                    </div>
                                </div>
                            )}
                            <div className="p-3 bg-white/5 rounded-2xl">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">{t('analytics:profile.seasons')}</p>
                                {user.seasons ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {(Array.isArray(user.seasons) ? user.seasons : String(user.seasons).split(',')).map((s, i) => (
                                            <span key={i} className="text-[9px] font-bold text-text-secondary bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{s}</span>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-text-muted italic">{t('analytics:profile.no_seasons')}</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Charts & Focus */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Award Focus or Legacy Type Details */}
                    {isLegacy ? (
                        <div className={`p-8 rounded-[2.5rem] border shadow-glass relative overflow-hidden group ${user.type === 'mentor' ? 'bg-accent-tertiary/10 border-accent-tertiary/30' : 'bg-accent-red/10 border-accent-red/30'}`}>
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                {user.type === 'mentor' ? <GraduationCap size={120} /> : <History size={120} />}
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2 ${user.type === 'mentor' ? 'text-accent-tertiary' : 'text-accent-red'}`}>
                                        <Info size={14} /> {user.type === 'mentor' ? 'Contribuição do Mentor' : 'Histórico na Equipe'}
                                    </p>
                                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-tight">
                                        {user.howHelps || user.howHeHelped || 'Informação não fornecida.'}
                                    </h3>
                                </div>
                                
                                {user.type === 'former' && user.reasonForLeaving && (
                                    <div className="pt-6 border-t border-white/10">
                                        <p className="text-[10px] font-black text-accent-red uppercase tracking-[0.3em] mb-2">Motivo da Saída</p>
                                        <p className="text-text-secondary text-sm font-medium leading-relaxed">
                                            {user.reasonForLeaving}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        visibility.awardFocus && (
                            <div className="bg-gradient-to-r from-accent-tertiary/20 to-accent-primary/20 border border-accent-tertiary/30 p-8 rounded-[2rem] shadow-glass relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                                    <Trophy size={80} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-accent-tertiary uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                        <Dna size={14} /> {t('analytics:profile.awardFocus')}
                                    </p>
                                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase underline decoration-accent-tertiary underline-offset-8 decoration-4">
                                        {user.awardFocus || t('analytics:profile.award_focus_default')}
                                    </h3>
                                    <p className="text-text-secondary mt-4 text-sm font-medium">
                                        {t('analytics:profile.award_focus_description', { focus: user.awardFocus || t('analytics:profile.award_focus_default') })}
                                    </p>
                                </div>
                            </div>
                        )
                    )}

                    {/* Graphs and Attributes - Only for Active Members */}
                    {!isLegacy && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {visibility.radarChart && (
                                    <div className="bg-primary/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-glass relative group">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                                                <History size={16} className="text-accent-primary" /> {t('analytics:profile.radarChart')}
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
                                                <BarChart3 size={16} className="text-accent-secondary" /> {t('analytics:profile.barChart')}
                                            </h3>
                                        </div>
                                        <div className="h-[250px] flex items-center justify-center p-4 overflow-hidden">
                                            <div className="w-full space-y-3 overflow-y-auto pr-2 max-h-full scrollbar-none">
                                                {Object.entries(user.stats || {}).map(([key, value], index) => (
                                                    <div key={key} className="space-y-1">
                                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-text-secondary">
                                                            <span>{t(`common:realm.${key}`)}</span>
                                                            <span>{(value as number) || 0}%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(value as number) || 0}%` }}
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

                            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
                                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] mb-6">{t('analytics:profile.bleed_attributes')}</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {Object.entries(user.stats || {}).map(([realm, val]: [string, any], index) => (
                                        <div key={realm} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold text-text-secondary">{t(`common:realm.${realm}`)}</span>
                                                <span className="text-[10px] font-black text-white">{val || 0} pts</span>
                                            </div>
                                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(val, 100)}%` }}
                                                    transition={{ duration: 1, delay: index * 0.1 }}
                                                    className="h-full bg-accent-secondary"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* FIRST TIME SETUP MODAL */}
            <AnimatePresence>
                {isSetupOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                            onClick={() => setIsSetupOpen(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-primary/90 border border-white/10 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 pb-4">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-accent-primary/20 rounded-2xl text-accent-primary">
                                        <Dna size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">{t('analytics:profile.setup_title', 'Configurar Dossiê')}</h3>
                                        <p className="text-xs text-text-secondary font-medium">{t('analytics:profile.setup_subtitle', 'Estas informações aparecerão no seu perfil.')}</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsSetupOpen(false)}
                                        className="ml-auto p-2 hover:bg-white/5 rounded-xl transition-all"
                                    >
                                        <X size={20} className="text-text-muted" />
                                    </button>
                                </div>

                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('analytics:profile.fullName')}</label>
                                        <input 
                                            type="text" 
                                            value={setupData.fullName}
                                            onChange={(e) => setSetupData({...setupData, fullName: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all"
                                            placeholder="Nome completo..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('analytics:profile.grade')}</label>
                                            <input 
                                                type="text" 
                                                value={setupData.grade}
                                                onChange={(e) => setSetupData({...setupData, grade: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all"
                                                placeholder="Ex: 3º Ano Médio"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('analytics:profile.entryDate')}</label>
                                            <input 
                                                type="text" 
                                                value={setupData.entryDate}
                                                onChange={(e) => setSetupData({...setupData, entryDate: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all"
                                                placeholder="Ex: Fevereiro 2024"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('analytics:profile.birthDate')}</label>
                                            <input 
                                                type="text" 
                                                value={setupData.birthDate}
                                                onChange={(e) => setSetupData({...setupData, birthDate: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all"
                                                placeholder="Ex: 24/05/2008"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('analytics:profile.seasons')}</label>
                                            <input 
                                                type="text" 
                                                value={setupData.seasons}
                                                onChange={(e) => setSetupData({...setupData, seasons: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all"
                                                placeholder="Ex: 2023, 2024"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('analytics:profile.bio_label', 'Quem sou eu')}</label>
                                        <textarea 
                                            value={setupData.bio}
                                            onChange={(e) => setSetupData({...setupData, bio: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all h-20 resize-none"
                                            placeholder="Conte um pouco sobre você..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 pt-4">
                                <button 
                                    onClick={handleSaveSetup}
                                    disabled={isSaving}
                                    className="w-full py-4 bg-accent-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isSaving ? (
                                        <motion.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                        >
                                            <Dna size={20} />
                                        </motion.div>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} />
                                            {t('common:actions.save_changes', 'Salvar Alterações')}
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[9px] text-text-muted uppercase font-black tracking-tighter mt-4">
                                    {t('analytics:profile.setup_notice', 'Esta ação é feita uma única vez por temporada.')}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BLeedProfileDashboard;
