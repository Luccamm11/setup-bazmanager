import React, { useState } from 'react';
import { ALL_MEMBERS } from '../../data/members';
import BLeedProfileDashboard from './BLeedProfileDashboard';
import { Search, Loader2, ArrowLeft, ShieldAlert, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MemberInspectorProps {
    currentTech: string;
}

const MemberInspector: React.FC<MemberInspectorProps> = ({ currentTech }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMemberData, setSelectedMemberData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filteredMembers = ALL_MEMBERS.filter(m => 
        m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.username.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(m => m.role !== 'technician');

    const handleInspect = async (username: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/member-data?techUsername=${encodeURIComponent(currentTech)}&targetUsername=${encodeURIComponent(username)}`);
            const data = await res.json();
            if (data.success) {
                setSelectedMemberData(data.data);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Não foi possível conectar ao servidor para carregar os dados.");
        } finally {
            setIsLoading(false);
        }
    };

    if (selectedMemberData) {
        return (
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 shadow-glass">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-accent-tertiary/10 border border-accent-tertiary/20 flex items-center justify-center text-accent-tertiary">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Inspecionando Membro</p>
                            <h3 className="text-xl sm:text-2xl font-black text-text-primary capitalize">{selectedMemberData.user.name}</h3>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setSelectedMemberData(null)}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl transition-all font-bold group shrink-0"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Voltar para Lista</span>
                    </button>
                </div>

                <div className="relative">
                    <BLeedProfileDashboard 
                        user={selectedMemberData.user}
                        weeklyProgress={selectedMemberData.weeklyProgress || []}
                        activityLog={selectedMemberData.activityLog || []}
                        currentDate={new Date()}
                    />
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-10 relative">
            <div className="max-w-3xl mx-auto text-center space-y-4">
                <h2 className="text-2xl sm:text-3xl font-black text-text-primary">Busca de Talentos</h2>
                <p className="text-text-secondary max-w-xl mx-auto">Selecione um membro da Bazinga! para visualizar seu dossiê completo de evolução, métricas de XP e distribuição de habilidades.</p>
                
                <div className="relative mt-8">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                    <input 
                        type="text"
                        placeholder="Nome do membro ou apelido..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-primary/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white focus:outline-none focus:border-accent-tertiary transition-all shadow-glass placeholder:text-text-muted font-medium"
                    />
                </div>
            </div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl mx-auto bg-accent-red/10 border border-accent-red/20 p-5 rounded-2xl flex items-center gap-4 text-accent-red shadow-lg"
                >
                    <div className="p-2 bg-accent-red/10 rounded-lg">
                        <ShieldAlert size={20} />
                    </div>
                    <p className="text-sm font-bold">{error}</p>
                </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <AnimatePresence>
                    {filteredMembers.map(member => (
                        <motion.button
                            layout
                            key={member.username}
                            onClick={() => handleInspect(member.username)}
                            disabled={isLoading}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-primary/40 p-6 rounded-3xl border border-white/5 hover:border-accent-tertiary/40 hover:bg-white/5 transition-all text-left group relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-glass"
                        >
                            <div className="relative z-10 flex flex-col gap-1">
                                <h4 className="text-xl font-black text-text-primary group-hover:text-accent-tertiary transition-colors">{member.displayName}</h4>
                                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">{member.awardFocus || 'Multitarefa'}</p>
                            </div>
                            
                            <div className="mt-6 flex items-center gap-3 relative z-10">
                                <span className="text-[10px] font-black text-accent-tertiary uppercase tracking-wider px-3 py-1 bg-accent-tertiary/10 rounded-full group-hover:bg-accent-tertiary group-hover:text-white transition-all">
                                    Ver Perfil
                                </span>
                            </div>
                            
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-tertiary/5 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:bg-accent-tertiary/15 transition-all duration-500"></div>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100]">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-primary p-10 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm text-center"
                    >
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-accent-tertiary/20 blur-xl rounded-full animate-pulse"></div>
                            <Loader2 className="w-12 h-12 text-accent-tertiary animate-spin relative z-10" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 tracking-tight">Recuperando Dossiê</h3>
                        <p className="text-text-secondary text-sm font-medium">Extraindo logs de atividade e métricas de evolução da API B-LEED...</p>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default MemberInspector;
