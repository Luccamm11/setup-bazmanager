import React, { useState, useEffect } from 'react';
import { Search, Info, Loader2, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BLeedProfileDashboard from './BLeedProfileDashboard';
import { useTranslation } from 'react-i18next';

interface MemberInspectorProps {
    currentUser: string;
}

const MemberInspector: React.FC<MemberInspectorProps> = ({ currentUser }) => {
    const { t } = useTranslation(['analytics']);
    const [searchTerm, setSearchTerm] = useState('');
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);

    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/team-progress?username=' + currentUser);
                const data = await res.json();
                if (data.success) {
                    setMembers(data.members);
                }
            } catch (err) {
                console.error('Error fetching members:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [currentUser]);

    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedMember) {
        return (
            <BLeedProfileDashboard 
                user={selectedMember} 
                onBack={() => setSelectedMember(null)}
                currentDate={new Date()}
            />
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">{t('analytics:profile.search_title')}</h2>
                    <p className="text-sm text-text-secondary max-w-xl">
                        {t('analytics:profile.search_subtitle')}
                    </p>
                </div>
                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-secondary transition-colors" size={18} />
                    <input 
                        type="text"
                        placeholder={t('analytics:profile.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-primary/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-accent-secondary/50 focus:bg-primary/60 transition-all shadow-glass"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-accent-secondary animate-spin mb-4" />
                    <p className="text-text-secondary text-sm font-bold">{t('analytics:tech.loading_data')}</p>
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="text-center py-20 bg-primary/20 rounded-3xl border border-dashed border-white/10">
                    <Info className="w-10 h-10 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary font-medium">{t('analytics:tech.no_missions')}</p> 
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMembers.map((member, idx) => (
                        <motion.div
                            key={member.username}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedMember(member)}
                            className="bg-primary/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group shadow-glass"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 flex items-center justify-center border border-white/10 text-accent-secondary group-hover:scale-105 transition-transform">
                                    {member.avatar ? (
                                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white truncate">{member.name}</h4>
                                    <p className="text-[10px] text-accent-secondary font-black uppercase tracking-widest">{member.rank}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-accent-secondary" 
                                                style={{ width: `${Math.min((member.level / 50) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-black text-text-muted">LVL {member.level}</span>
                                    </div>
                                </div>
                                <ChevronRight className="text-text-muted group-hover:text-white group-hover:translate-x-1 transition-all" size={20} />
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{t('analytics:profile.view_profile')}</span>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${member.streak > 0 ? 'bg-accent-secondary animate-pulse' : 'bg-zinc-600'}`}></div>
                                    <span className="text-[9px] font-bold text-text-secondary">{member.streak}d</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MemberInspector;
