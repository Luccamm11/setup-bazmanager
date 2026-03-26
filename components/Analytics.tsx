import React from 'react';
import { User, WeeklyProgress, ActivityData, Realm, Skill } from '../types';
import WeeklyXpChart from './charts/WeeklyXpChart';
import StatsRadarChart from './charts/StatsRadarChart';
import KpiCard from './analytics/KpiCard';
import TopSkillsList from './analytics/TopSkillsList';
import RealmDistributionPieChart from './charts/RealmDistributionPieChart';
import ActivityHeatmap from './charts/ActivityHeatmap';
import { ClipboardList, ShieldCheck, TrendingUp, Star, BrainCircuit, Heart, Zap, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AnalyticsProps {
    user: User;
    weeklyProgress: WeeklyProgress[];
    activityLog: ActivityData[];
    currentDate: Date;
}

const Analytics: React.FC<AnalyticsProps> = ({ user, weeklyProgress, activityLog, currentDate }) => {
    const { t } = useTranslation(['analytics', 'common']);

    const realmDisplayConfig = {
        [Realm.Mind]:     { icon: <BrainCircuit size={20} />, name: t('common:realm.Mind'),     color: "text-accent-primary" },
        [Realm.Body]:     { icon: <Heart size={20} />,        name: t('common:realm.Body'),     color: "text-accent-red" },
        [Realm.Creation]: { icon: <Zap size={20} />,          name: t('common:realm.Creation'), color: "text-accent-secondary" },
        [Realm.Spirit]:   { icon: <Sparkles size={20} />,     name: t('common:realm.Spirit'),   color: "text-accent-tertiary" },
    };
    
    const skillIdsByRealm = Object.values(user.skill_tree).reduce((acc, skill: Skill) => {
        if (!acc[skill.realm]) acc[skill.realm] = [];
        acc[skill.realm].push(skill.id);
        return acc;
    }, {} as Record<Realm, string[]>);

    const realmHeatmaps = [
        { realm: Realm.Mind,     data: activityLog.filter(log => skillIdsByRealm[Realm.Mind]?.includes(log.skillId)) },
        { realm: Realm.Body,     data: activityLog.filter(log => skillIdsByRealm[Realm.Body]?.includes(log.skillId)) },
        { realm: Realm.Creation, data: activityLog.filter(log => skillIdsByRealm[Realm.Creation]?.includes(log.skillId)) },
        { realm: Realm.Spirit,   data: activityLog.filter(log => skillIdsByRealm[Realm.Spirit]?.includes(log.skillId)) },
    ];

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold">{t('analytics')}</h2>
                <p className="text-text-secondary mt-1">{t('analytics_subtitle')}</p>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={<ClipboardList size={24} />} title={t('quests_completed')}  value={user.questsCompleted}                      color="text-accent-tertiary" />
                <KpiCard icon={<Star size={24} />}          title={t('total_xp')}           value={user.xp_total.toLocaleString()}             color="text-accent-secondary" />
                <KpiCard icon={<TrendingUp size={24} />}    title={t('current_streak')}     value={`${user.streaks.daily_streak} ${t('common:days')}`} color="text-accent-red" />
                <KpiCard icon={<ShieldCheck size={24} />}   title={t('boss_kills')}         value={user.bossQuestsCompleted}                   color="text-accent-tertiary" />
            </div>

            <div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 text-center">{t('activity_heatmap')}</h3>
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {realmHeatmaps.map(({ realm, data }) => {
                        const config = realmDisplayConfig[realm as keyof typeof realmDisplayConfig];
                        if (!config) return null;
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
                     <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">{t('weekly_progress')}</h3>
                     <RealmDistributionPieChart stats={user.stats} />
                </div>
                 <div className="bg-primary p-3 sm:p-6 rounded-lg border border-border-color">
                    <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">{t('total_xp')}</h3>
                    <TopSkillsList skills={user.skill_tree} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-primary p-3 sm:p-6 rounded-lg border border-border-color">
                     <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">{t('xp_history')}</h3>
                     <WeeklyXpChart data={weeklyProgress} />
                </div>
                <div className="lg:col-span-2 bg-primary p-3 sm:p-6 rounded-lg border border-border-color">
                    <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">{t('analytics_subtitle')}</h3>
                    <StatsRadarChart stats={user.stats} />
                </div>
            </div>
        </div>
    );
};

export default Analytics;