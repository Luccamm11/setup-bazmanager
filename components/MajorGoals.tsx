import React from 'react';
// FIX: Replaced BossChallenge with MajorGoal.
import { MajorGoal } from '../types';
import { Target, PlusCircle, ShieldCheck, Zap, Star, DollarSign, Edit, CheckCircle, Wand2, Layers, AlertTriangle, Swords, Anvil } from 'lucide-react';

// FIX: Renamed props interface.
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
    Siege: { icon: <Swords />, color: 'border-accent-secondary', text: 'text-accent-secondary', shadow: 'shadow-[0_0_15px_rgba(227,179,65,0.5)]' },
    Forge: { icon: <Anvil />, color: 'border-accent-primary', text: 'text-accent-primary', shadow: 'shadow-[0_0_15px_rgba(88,166,255,0.5)]' },
    Gauntlet: { icon: <Zap />, color: 'border-accent-tertiary', text: 'text-accent-tertiary', shadow: 'shadow-[0_0_15px_rgba(163,113,247,0.5)]' },
};


const Countdown: React.FC<{ deadline: string; currentDate: Date }> = ({ deadline, currentDate }) => {
    const difference = +new Date(deadline) - +currentDate;
    if (difference <= 0) {
        return <span className="text-accent-red">Past Due</span>;
    }
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
    return <span>{days} day{days !== 1 ? 's' : ''} left</span>;
};


// FIX: Renamed component and props.
const MajorGoalCard: React.FC<{ goal: MajorGoal; onEdit: (goal: MajorGoal) => void; onComplete: (goal: MajorGoal) => void; onBreakdown: (goal: MajorGoal) => void; currentDate: Date }> = ({ goal, onEdit, onComplete, onBreakdown, currentDate }) => {
    const config = challengeTypeConfig[goal.type];
    return (
        <>
        <style>{`
            @keyframes pulse-glow-secondary {
                0%, 100% { box-shadow: 0 0 8px rgba(227,179,65,0.3); }
                50% { box-shadow: 0 0 16px rgba(227,179,65,0.6); }
            }
            @keyframes pulse-glow-primary {
                0%, 100% { box-shadow: 0 0 8px rgba(88,166,255,0.3); }
                50% { box-shadow: 0 0 16px rgba(88,166,255,0.6); }
            }
            @keyframes pulse-glow-tertiary {
                0%, 100% { box-shadow: 0 0 8px rgba(163,113,247,0.3); }
                50% { box-shadow: 0 0 16px rgba(163,113,247,0.6); }
            }
            .border-accent-secondary.animate-pulse-glow { animation: pulse-glow-secondary 3s infinite ease-in-out; }
            .border-accent-primary.animate-pulse-glow { animation: pulse-glow-primary 3s infinite ease-in-out; }
            .border-accent-tertiary.animate-pulse-glow { animation: pulse-glow-tertiary 3s infinite ease-in-out; }
        `}</style>
        <div className={`bg-background border-l-4 ${config.color} p-4 rounded-r-lg border border-border-color border-l-4 animate-pulse-glow`}>
            <div className="flex justify-between items-start">
                <div>
                    <div className={`flex items-center space-x-2 font-bold text-lg ${config.text}`}>
                        {config.icon}
                        <h4>{goal.title}</h4>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{goal.description}</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => onEdit(goal)} className="p-1 text-text-secondary hover:text-white"><Edit size={16} /></button>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm">
                <div className="flex items-center space-x-1 font-semibold text-text-primary bg-border-color/50 px-2 py-1 rounded-full">
                    <Countdown deadline={goal.deadline} currentDate={currentDate} />
                </div>
                <div className="flex items-center space-x-1 text-accent-secondary">
                    <Star size={16} /> <span>{goal.xp_reward} XP</span>
                </div>
                <div className="flex items-center space-x-1 text-accent-green">
                    <DollarSign size={16} /> <span>{goal.credit_reward} Credits</span>
                </div>
                {goal.penalty && (
                    <div className="flex items-center space-x-1 text-accent-red font-semibold">
                        <AlertTriangle size={16} />
                        <span>-{goal.penalty.amount} {goal.penalty.type} on fail</span>
                    </div>
                )}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
                {goal.type === 'Siege' && goal.syllabus && (
                    <button onClick={() => onBreakdown(goal)} className="flex-1 bg-accent-tertiary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded flex items-center justify-center space-x-2">
                        <Wand2 size={18} />
                        <span>Analyze Syllabus</span>
                    </button>
                )}
                <button onClick={() => onComplete(goal)} className="flex-1 bg-accent-green hover:bg-accent-green-hover text-white font-bold py-2 px-4 rounded flex items-center justify-center space-x-2">
                    <CheckCircle size={18} />
                    <span>Claim Victory</span>
                </button>
            </div>
        </div>
        </>
    );
};

const MajorGoals: React.FC<MajorGoalsProps> = ({ goals, onAdd, onBulkAdd, onEdit, onComplete, onBreakdown, currentDate }) => {
    const activeGoals = goals.filter(g => new Date(g.deadline) >= currentDate);
    
    return (
        <div className="bg-primary p-3 sm:p-4 rounded-lg border border-border-color">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h2 className="text-2xl font-bold text-text-primary flex items-center space-x-2">
                    <ShieldCheck />
                    <span>Major Goals</span>
                </h2>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={onBulkAdd} className="flex items-center justify-center space-x-2 bg-primary border border-border-color hover:bg-border-color text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors">
                        <Layers size={18} />
                        <span>Bulk Add</span>
                    </button>
                    <button onClick={onAdd} className="flex items-center justify-center space-x-2 bg-accent-primary hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        <PlusCircle size={18} />
                        <span>New Goal</span>
                    </button>
                </div>
            </div>
             {activeGoals.length > 0 ? (
                <div className="space-y-4">
                    {activeGoals.map(goal => (
                        <MajorGoalCard key={goal.id} goal={goal} onEdit={onEdit} onComplete={onComplete} onBreakdown={onBreakdown} currentDate={currentDate} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 px-4 bg-background border border-border-color rounded-lg">
                    <p className="text-text-secondary">No active Major Goals.</p>
                    <p className="text-text-muted mt-2">Set a major objective to focus your efforts!</p>
                </div>
            )}
        </div>
    );
};

export default MajorGoals;