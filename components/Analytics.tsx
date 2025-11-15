import React from 'react';
import { User, WeeklyProgress, ActivityData, Realm, Skill } from '../types';
import WeeklyXpChart from './charts/WeeklyXpChart';
import StatsRadarChart from './charts/StatsRadarChart';
import KpiCard from './analytics/KpiCard';
import TopSkillsList from './analytics/TopSkillsList';
import RealmDistributionPieChart from './charts/RealmDistributionPieChart';
import ActivityHeatmap from './charts/ActivityHeatmap';
import { ClipboardList, ShieldCheck, TrendingUp, Star, BrainCircuit, Heart, Zap, Sparkles } from 'lucide-react';

interface AnalyticsProps {
    user: User;
    weeklyProgress: WeeklyProgress[];
    activityLog: ActivityData[];
    currentDate: Date;
}

const realmDisplayConfig = {
    [Realm.Mind]: { icon: <BrainCircuit size={20} />, name: "Mind Activity", color: "text-accent-primary" },
    [Realm.Body]: { icon: <Heart size={20} />, name: "Body Activity", color: "text-accent-red" },
    [Realm.Creation]: { icon: <Zap size={20} />, name: "Creation Activity", color: "text-accent-secondary" },
    [Realm.Spirit]: { icon: <Sparkles size={20} />, name: "Spirit Activity", color: "text-accent-tertiary" },
};

const Analytics: React.FC<AnalyticsProps> = ({ user, weeklyProgress, activityLog, currentDate }) => {
    
    const skillIdsByRealm = Object.values(user.skill_tree).reduce((acc, skill: Skill) => {
        if (!acc[skill.realm]) {
            acc[skill.realm] = [];
        }
        acc[skill.realm].push(skill.id);
        return acc;
    }, {} as Record<Realm, string[]>);

    const mindActivity = activityLog.filter(log => skillIdsByRealm[Realm.Mind]?.includes(log.skillId));
    const bodyActivity = activityLog.filter(log => skillIdsByRealm[Realm.Body]?.includes(log.skillId));
    const creationActivity = activityLog.filter(log => skillIdsByRealm[Realm.Creation]?.includes(log.skillId));
    const spiritActivity = activityLog.filter(log => skillIdsByRealm[Realm.Spirit]?.includes(log.skillId));
    
    const realmHeatmaps = [
        { realm: Realm.Mind, data: mindActivity },
        { realm: Realm.Body, data: bodyActivity },
        { realm: Realm.Creation, data: creationActivity },
        { realm: Realm.Spirit, data: spiritActivity },
    ];

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold">Progress Analytics</h2>
                <p className="text-text-secondary mt-1">Visualize your journey and track your growth.</p>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={<ClipboardList size={24} />} title="Quests Completed" value={user.questsCompleted} color="text-accent-tertiary" />
                <KpiCard icon={<Star size={24} />} title="Total XP Earned" value={user.xp_total.toLocaleString()} color="text-accent-secondary" />
                <KpiCard icon={<TrendingUp size={24} />} title="Daily Streak" value={`${user.streaks.daily_streak} Days`} color="text-accent-red" />
                <KpiCard icon={<ShieldCheck size={24} />} title="Bosses Defeated" value={user.bossQuestsCompleted} color="text-accent-tertiary" />
            </div>

            <div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 text-center">Realm Activity Heatmaps</h3>
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {realmHeatmaps.map(({ realm, data }) => {
                        const config = realmDisplayConfig[realm as keyof typeof realmDisplayConfig];
                        return (
                            <div key={realm} className="bg-primary p-3 sm:p-6 rounded-lg border border-border-color">
                                <h4 className={`text-lg sm:text-xl font-bold text-text-primary mb-4 flex items-center space-x-2 ${config.color}`}>
                                    {config.icon}
                                    <span>{config.name}</span>
                                </h4>
                                <ActivityHeatmap activityData={data} currentDate={currentDate} />
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-primary p-3 sm:p-6 rounded-lg border border-border-color">
                     <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">Quest Distribution by Realm</h3>
                     <RealmDistributionPieChart stats={user.stats} />
                </div>
                 <div className="bg-primary p-3 sm:p-6 rounded-lg border border-border-color">
                    <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">Top 5 Skills</h3>
                    <TopSkillsList skills={user.skill_tree} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-primary p-3 sm:p-6 rounded-lg border border-border-color">
                     <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">Weekly XP Gain</h3>
                     <WeeklyXpChart data={weeklyProgress} />
                </div>
                <div className="lg:col-span-2 bg-primary p-3 sm:p-6 rounded-lg border border-border-color">
                    <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">Realm Stats Balance</h3>
                    <StatsRadarChart stats={user.stats} />
                </div>
            </div>
        </div>
    );
};

export default Analytics;