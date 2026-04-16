import React, { useState, useEffect } from 'react';
import { User, UserRole, WeeklyProgress, ActivityData } from '../types';
import BLeedProfileDashboard from './analytics/BLeedProfileDashboard';
import { Users, User as UserIcon, Search, Target, LayoutDashboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TeamSummaryDashboard from './analytics/TeamSummaryDashboard';
import MemberInspector from './analytics/MemberInspector';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardTabProps {
    user: User;
    userRole: UserRole;
    weeklyProgress: WeeklyProgress[];
    activityLog: ActivityData[];
    currentDate: Date;
}

type Tab = 'personal' | 'team' | 'member_lookup';

const DashboardTab: React.FC<DashboardTabProps> = ({ user, userRole, weeklyProgress, activityLog, currentDate }) => {
    const { t } = useTranslation(['analytics', 'common']);
    const [activeTab, setActiveTab] = useState<Tab>('personal');
    const [teamData, setTeamData] = useState<any[]>([]);
    const [isLoadingTeam, setIsLoadingTeam] = useState(false);

    const isTechnician = userRole === 'technician';

    useEffect(() => {
        if (isTechnician && activeTab === 'team') {
            fetchTeamData();
        }
    }, [activeTab, isTechnician]);

    const fetchTeamData = async () => {
        setIsLoadingTeam(true);
        try {
            const res = await fetch(`/api/team-progress?username=${encodeURIComponent(user.name)}`);
            const data = await res.json();
            if (data.success) {
                setTeamData(data.members || []);
            }
        } catch (error) {
            console.error('Error fetching team data:', error);
        } finally {
            setIsLoadingTeam(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.3 } }
    };

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-10">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-accent-primary/10 rounded-lg text-accent-primary">
                            <LayoutDashboard size={24} />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">{t('analytics:dashboard_tab.title')}</h1>
                    </div>
                    <p className="text-text-secondary font-medium">
                        {isTechnician 
                            ? t('analytics:dashboard_tab.subtitle_technician') 
                            : t('analytics:dashboard_tab.subtitle_member')}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs (Technician only) */}
            {isTechnician && (
                <div className="flex flex-wrap gap-2 p-1.5 bg-primary/30 backdrop-blur-xl rounded-2xl border border-white/5 w-fit shadow-glass">
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${
                            activeTab === 'personal'
                                ? 'bg-accent-primary text-white shadow-glow-primary'
                                : 'text-text-secondary hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <UserIcon size={16} />
                        <span>{t('analytics:dashboard_tab.nav.personal')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${
                            activeTab === 'team'
                                ? 'bg-accent-secondary text-white shadow-glow-secondary'
                                : 'text-text-secondary hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Users size={16} />
                        <span>{t('analytics:dashboard_tab.nav.team')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('member_lookup')}
                        className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${
                            activeTab === 'member_lookup'
                                ? 'bg-accent-tertiary text-white shadow-glow-tertiary'
                                : 'text-text-secondary hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Search size={16} />
                        <span>{t('analytics:dashboard_tab.nav.member_lookup')}</span>
                    </button>
                </div>
            )}

            {/* Content with Animation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="min-h-[500px]"
                >
                    {activeTab === 'personal' && (
                        <BLeedProfileDashboard 
                            user={user} 
                            weeklyProgress={weeklyProgress} 
                            activityLog={activityLog} 
                            currentDate={currentDate} 
                        />
                    )}

                    {activeTab === 'team' && isTechnician && (
                        <TeamSummaryDashboard 
                            members={teamData} 
                            isLoading={isLoadingTeam} 
                        />
                    )}

                    {activeTab === 'member_lookup' && isTechnician && (
                        <MemberInspector currentUser={user.name} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default DashboardTab;
