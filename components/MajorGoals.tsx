import React from 'react';
import { MajorGoal } from '../types';
import { Target, PlusCircle, ShieldCheck, Zap, Star, DollarSign, Edit, CheckCircle, Wand2, Layers, AlertTriangle, Swords, Anvil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface MajorGoalsProps {
    goals: MajorGoal[];
    onAdd: () => void;
    onBulkAdd: () => void;
    onEdit: (goal: MajorGoal) => void;
    onComplete: (goal: MajorGoal) => void;
    onBreakdown: (goal: MajorGoal) => void;
    currentDate: Date;
}

const challengeTypeConfig = {
    Siege:    { icon: <Swords />, color: 'border-accent-secondary', text: 'text-accent-secondary', shadow: 'shadow-[0_0_15px_rgba(227,179,65,0.5)]' },
    Forge:    { icon: <Anvil />,  color: 'border-accent-primary',   text: 'text-accent-primary',   shadow: 'shadow-[0_0_15px_rgba(88,166,255,0.5)]' },
    Gauntlet: { icon: <Zap />,   color: 'border-accent-tertiary',  text: 'text-accent-tertiary',  shadow: 'shadow-[0_0_15px_rgba(163,113,247,0.5)]' },
};

const Countdown: React.FC<{ deadline: string; currentDate: Date }> = ({ deadline, currentDate }) => {
    const { t } = useTranslation('goals');
    const difference = +new Date(deadline) - +currentDate;
    if (difference <= 0) return <span className="text-accent-red">{t('overdue')}</span>;
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
    return <span>{t('days_until', { days })}</span>;
};

const MajorGoalCard: React.FC<{ goal: MajorGoal; onEdit: (goal: MajorGoal) => void; onComplete: (goal: MajorGoal) => void; onBreakdown: (goal: MajorGoal) => void; currentDate: Date }> = ({ goal, onEdit, onComplete, onBreakdown, currentDate }) => {
    const { t } = useTranslation('goals');
    const config = challengeTypeConfig[goal.type] || challengeTypeConfig.Forge;
    return (
        <>
        <style>{`
            @keyframes pulse-glow-secondary { 0%, 100% { box-shadow: 0 0 8px rgba(227,179,65,0.3); } 50% { box-shadow: 0 0 16px rgba(227,179,65,0.6); } }
            @keyframes pulse-glow-primary   { 0%, 100% { box-shadow: 0 0 8px rgba(88,166,255,0.3);  } 50% { box-shadow: 0 0 16px rgba(88,166,255,0.6);  } }
            @keyframes pulse-glow-tertiary  { 0%, 100% { box-shadow: 0 0 8px rgba(163,113,247,0.3); } 50% { box-shadow: 0 0 16px rgba(163,113,247,0.6); } }
            .border-accent-secondary.animate-pulse-glow { animation: pulse-glow-secondary 3s infinite ease-in-out; }
            .border-accent-primary.animate-pulse-glow   { animation: pulse-glow-primary   3s infinite ease-in-out; }
            .border-accent-tertiary.animate-pulse-glow  { animation: pulse-glow-tertiary  3s infinite ease-in-out; }
        `}</style>
        <div className={`bg-white/[0.02] backdrop-blur-3xl border border-white/[0.05] border-l-2 ${config.color} p-5 sm:p-6 rounded-xl transition-all duration-500 hover:bg-white/[0.04] group`}>
            <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="flex-1 min-w-[200px]">
                    <div className={`flex items-center space-x-2.5 font-black text-lg tracking-tight ${config.text}`}>
                        <div className="p-1.5 rounded-lg bg-white/5 shrink-0">
                            {React.cloneElement(config.icon as React.ReactElement, { size: 18 })}
                        </div>
                        <h4>{goal.title}</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-text-secondary mt-2.5 font-medium leading-relaxed opacity-80">{goal.description}</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => onEdit(goal)} className="p-2 rounded-lg bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white transition-colors"><Edit size={18} /></button>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-5 text-sm font-bold">
                <div className="flex items-center space-x-1.5 font-bold text-text-primary bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 shadow-sm overflow-hidden relative">
                    <Countdown deadline={goal.deadline} currentDate={currentDate} />
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20 shadow-sm">
                    <Star size={16} /> <span>{goal.xp_reward} XP</span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-accent-green/10 text-accent-green border border-accent-green/20 shadow-sm">
                    <DollarSign size={16} /> <span>{goal.credit_reward} CR</span>
                </div>
                {goal.penalty && (
                    <div className="flex items-center space-x-1.5 text-accent-red font-bold px-3 py-1.5 rounded-lg bg-accent-red/10 border border-accent-red/20 shadow-sm">
                        <AlertTriangle size={16} />
                        <span>-{goal.penalty.amount} {goal.penalty.type}</span>
                    </div>
                )}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {goal.type === 'Siege' && goal.syllabus && (
                    <button onClick={() => onBreakdown(goal)} className="flex-1 bg-accent-tertiary/20 hover:bg-accent-tertiary hover:shadow-glow-tertiary border border-accent-tertiary/50 text-white font-bold py-2.5 px-5 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 group/btn">
                        <Wand2 size={18} className="group-hover/btn:rotate-12 transition-transform" />
                        <span>{t('syllabus_breakdown')}</span>
                    </button>
                )}
                <button onClick={() => onComplete(goal)} className="flex-1 bg-accent-green border border-accent-green-hover/50 hover:bg-[#16a34a] hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] text-white font-bold py-2.5 px-5 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 group/btn">
                    <CheckCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                    <span>{t('complete_goal')}</span>
                </button>
            </div>
        </div>
        </>
    );
};

const MajorGoals: React.FC<MajorGoalsProps> = ({ goals, onAdd, onBulkAdd, onEdit, onComplete, onBreakdown, currentDate }) => {
    const { t } = useTranslation('goals');
    const activeGoals = goals.filter(g => new Date(g.deadline) >= currentDate);
    
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants     = { hidden: { opacity: 0, scale: 0.95, y: 10 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } } };

    return (
        <motion.div className="p-6 sm:p-8 w-full h-full rounded-3xl" variants={containerVariants} initial="hidden" animate="visible">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4 border-b border-white/5 pb-5">
                <div className="flex items-center space-x-3 shrink-0">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-white shadow-sm"><ShieldCheck size={26} /></div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">{t('major_goals')}</h2>
                        <p className="text-sm text-text-secondary mt-1 font-medium">{t('major_goals_subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={onBulkAdd} className="flex items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-white transition-all active:scale-95 group" title={t('bulk_add_goals')}>
                        <Layers size={18} />
                    </button>
                    <button onClick={onAdd} className="flex items-center justify-center space-x-2 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary font-black py-2.5 px-4 rounded-xl transition-all hover:bg-accent-primary hover:text-white active:scale-95 text-xs uppercase tracking-widest">
                        <PlusCircle size={16} />
                        <span>{t('add_goal')}</span>
                    </button>
                </div>
            </div>
             <AnimatePresence>
             {activeGoals.length > 0 ? (
                <div className="space-y-6">
                    {activeGoals.map(goal => (
                        <motion.div key={goal.id} variants={itemVariants} layout>
                            <MajorGoalCard goal={goal} onEdit={onEdit} onComplete={onComplete} onBreakdown={onBreakdown} currentDate={currentDate} />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 px-6 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm">
                    <ShieldCheck className="w-14 h-14 text-text-muted mb-5 opacity-40" />
                    <p className="text-xl font-bold text-text-secondary mb-2">{t('no_goals')}</p>
                    <p className="text-text-muted mt-2 max-w-sm mx-auto leading-relaxed">{t('major_goals_subtitle')}</p>
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MajorGoals;