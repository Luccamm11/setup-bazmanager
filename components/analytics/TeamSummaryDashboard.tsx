import React from 'react';
import KpiCard from './KpiCard';
import { Users, Star, Trophy, Target, Loader2, Award, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface TeamSummaryDashboardProps {
    members: any[];
    isLoading: boolean;
}

const TeamSummaryDashboard: React.FC<TeamSummaryDashboardProps> = ({ members, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="w-12 h-12 text-accent-secondary animate-spin mb-4" />
                <p className="text-text-secondary font-bold">Consolidando dados da Bazinga! 73...</p>
            </div>
        );
    }

    if (!members || members.length === 0) {
        return (
            <div className="text-center py-20 bg-primary/20 rounded-3xl border border-dashed border-white/10">
                <p className="text-text-secondary font-medium">Nenhum dado de equipe disponível.</p>
                <p className="text-xs text-text-muted mt-2">Certifique-se de que os membros já sincronizaram seus dados ao menos uma vez.</p>
            </div>
        );
    }

    const totalXp = members.reduce((sum, m) => sum + (m.xpTotal || 0), 0);
    const avgLevel = members.length > 0 ? Math.round(members.reduce((sum, m) => sum + (m.level || 0), 0) / members.length) : 0;
    const totalQuests = members.reduce((sum, m) => sum + (m.questsCompleted || 0), 0);
    const topPerformer = [...members].sort((a, b) => b.xpTotal - a.xpTotal)[0];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={<Users size={24} />} title="Efetivo Total" value={members.length} color="text-accent-primary" />
                <KpiCard icon={<Star size={24} />} title="XP Coletivo" value={totalXp.toLocaleString()} color="text-accent-secondary" />
                <KpiCard icon={<Award size={24} />} title="Nível Médio" value={avgLevel} color="text-accent-tertiary" />
                <KpiCard icon={<Zap size={24} />} title="Objetivos Concluídos" value={totalQuests} color="text-accent-red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Ranking List */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-primary/40 backdrop-blur-2xl p-5 sm:p-8 rounded-3xl border border-white/5 shadow-glass relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-accent-secondary/5 to-transparent pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="p-2 bg-accent-secondary/10 rounded-lg text-accent-secondary shadow-glow-secondary">
                            <Trophy size={22} />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">Classificação da Equipe</h3>
                    </div>
                    <div className="space-y-3 relative z-10">
                        {members.sort((a, b) => b.xpTotal - a.xpTotal).map((member, idx) => (
                            <div key={member.username} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group">
                                <div className="flex items-center gap-4">
                                    <span className={`text-base font-black w-8 ${idx < 3 ? 'text-accent-secondary' : 'text-text-muted opacity-50'}`}>#{idx + 1}</span>
                                    <div>
                                        <p className="font-bold text-text-primary group-hover:text-accent-secondary transition-colors">{member.name}</p>
                                        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black">{member.rank.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-6">
                                    <div className="hidden sm:block">
                                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest leading-none mb-1">Status</p>
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <div className={`w-1.5 h-1.5 rounded-full ${member.streak > 0 ? 'bg-accent-secondary shadow-glow-secondary' : 'bg-gray-600'}`}></div>
                                            <span className="text-[10px] font-bold text-text-secondary">{member.streak} dias</span>
                                        </div>
                                    </div>
                                    <div className="min-w-[80px]">
                                        <p className="text-sm font-black text-white">{member.xpTotal.toLocaleString()}</p>
                                        <p className="text-[10px] text-accent-secondary uppercase font-bold tracking-wider">XP TOTAL</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Top Member Highlight & Strategy */}
                <div className="space-y-6 sm:space-y-8">
                    <motion.div variants={itemVariants} className="bg-gradient-to-br from-accent-secondary/20 to-accent-primary/10 p-8 rounded-3xl border border-accent-secondary/20 shadow-glow-secondary relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-secondary/10 rounded-full blur-3xl group-hover:bg-accent-secondary/20 transition-all duration-700"></div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-accent-secondary to-accent-primary opacity-50"></div>
                        
                        <Target className="text-accent-secondary mb-5" size={32} />
                        <h4 className="text-[10px] font-black text-accent-secondary uppercase tracking-[0.3em] mb-2 leading-none">MVP da Temporada</h4>
                        <p className="text-3xl font-black text-white mb-6 drop-shadow-md">{topPerformer?.name}</p>
                        
                        <div className="space-y-3 relative z-10">
                             <div className="flex justify-between text-[11px] font-black uppercase text-text-secondary tracking-wider">
                                <span>Impacto Coletivo</span>
                                <span className="text-white">{members.length > 0 ? Math.round((topPerformer?.xpTotal / totalXp) * 100) : 0}%</span>
                             </div>
                             <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden p-0.5">
                                <div className="bg-gradient-to-r from-accent-secondary to-accent-primary h-full rounded-full shadow-glow-secondary" style={{ width: `${members.length > 0 ? (topPerformer?.xpTotal / totalXp) * 100 : 0}%` }}></div>
                             </div>
                             <p className="text-[11px] text-text-muted font-medium italic leading-relaxed pt-2">
                                Este membro representa a maior força motriz da equipe atualmente conforme os registros de XP e metas.
                             </p>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-primary/40 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/5 shadow-glass relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-accent-tertiary/5 to-transparent pointer-events-none"></div>
                        <h4 className="text-lg sm:text-xl font-black text-text-primary tracking-tight mb-6">Metas de Gestão</h4>
                        <div className="space-y-4 relative z-10">
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-accent-tertiary/30 transition-all cursor-default group">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-tertiary group-hover:animate-pulse"></div>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Evolução de Rank</p>
                                </div>
                                <p className="text-sm font-bold text-text-secondary group-hover:text-white transition-colors">Meta: Elevar 80% da equipe para Silver Rank</p>
                             </div>
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-accent-primary/30 transition-all cursor-default group">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-primary group-hover:animate-pulse"></div>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Ritmo B-LEED</p>
                                </div>
                                <p className="text-sm font-bold text-text-secondary group-hover:text-white transition-colors">Garantir que todos completem ao menos 1 quest/dia</p>
                             </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default TeamSummaryDashboard;
