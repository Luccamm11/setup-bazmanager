import React from 'react';
import { User, WeeklyProgress, ActivityData, Realm, Skill } from '../types';
import WeeklyXpChart from './charts/WeeklyXpChart';
import StatsRadarChart from './charts/StatsRadarChart';
import KpiCard from './analytics/KpiCard';
import TopSkillsList from './analytics/TopSkillsList';
import RealmDistributionPieChart from './charts/RealmDistributionPieChart';
import { ClipboardList, ShieldCheck, TrendingUp, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AnalyticsProps {
    user: User;
    weeklyProgress: WeeklyProgress[];
    activityLog: ActivityData[];
    currentDate: Date;
}

const Analytics: React.FC<AnalyticsProps> = ({ user, weeklyProgress, activityLog, currentDate }) => {
    const { t } = useTranslation(['analytics', 'common']);

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold">{t('analytics')}</h2>
                <p className="text-text-secondary mt-1">{t('analytics_subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={<ClipboardList size={24} />} title={t('quests_completed')}  value={user.questsCompleted}                      color="text-accent-tertiary" />
                <KpiCard icon={<Star size={24} />}          title={t('total_xp')}           value={user.xp_total.toLocaleString()}             color="text-accent-secondary" />
                <KpiCard icon={<TrendingUp size={24} />}    title={t('current_streak')}     value={`${user.streaks.daily_streak} ${t('common:days')}`} color="text-accent-red" />
                <KpiCard icon={<ShieldCheck size={24} />}   title={t('boss_kills')}         value={user.bossQuestsCompleted}                   color="text-accent-tertiary" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-primary p-3 sm:p-6 rounded-lg border border-border-color">
                     <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">{t('weekly_progress')}</h3>
                     <RealmDistributionPieChart stats={user.stats} />
                </div>
                 <div className="bg-primary p-3 sm:p-6 rounded-lg border border-border-color">
                    <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">{t('total_xp')}</h3>
                    <TopSkillsList skills={user.skill_tree || {}} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-primary p-3 sm:p-6 rounded-lg border border-border-color">
                     <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-4">{t('xp_history')}</h3>
                     <WeeklyXpChart data={weeklyProgress || []} />
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