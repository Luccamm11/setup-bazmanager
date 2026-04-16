import React, { useState, useEffect } from 'react';
import { Search, Info, Loader2, ChevronRight, User, Plus, History, GraduationCap, X, CheckCircle2 } from 'lucide-react';
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
    const [legacyMembers, setLegacyMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const isTechnician = ['Jonas', 'Gustavo'].includes(currentUser);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [membersRes, legacyRes] = await Promise.all([
                    fetch('/api/team-progress?username=' + currentUser),
                    fetch('/api/legacy-members')
                ]);
                
                const membersData = await membersRes.json();
                const legacyData = await legacyRes.json();
                
                if (membersData.success) {
                    setMembers(membersData.members);
                }
                if (legacyData.success) {
                    setLegacyMembers(legacyData.legacy);
                }
            } catch (err) {
                console.error('Error fetching members:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const allPeople = [
        ...members.map(m => ({ ...m, type: 'active' })),
        ...legacyMembers.map(m => ({ 
            ...m, 
            type: m.legacyType, // 'mentor' or 'former'
            username: m.id,
            rank: m.legacyType === 'mentor' ? 'MENTOR' : 'EX-MEMBRO',
            streak: 0,
            level: 0
        }))
    ];

    const filteredMembers = allPeople.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.username && m.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const [newLegacy, setNewLegacy] = useState({
        name: '',
        legacyType: 'mentor',
        howHelps: '',
        reasonForLeaving: '',
        birthDate: '',
        entryDate: '',
        seasons: '',
        bio: ''
    });

    const handleAddLegacy = async () => {
        try {
            const res = await fetch('/api/legacy-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: currentUser, 
                    member: newLegacy 
                })
            });
            const data = await res.json();
            if (data.success) {
                setLegacyMembers(prev => [...prev, data.member]);
                setIsAddModalOpen(false);
                setNewLegacy({
                    name: '',
                    legacyType: 'mentor',
                    howHelps: '',
                    reasonForLeaving: '',
                    birthDate: '',
                    entryDate: '',
                    seasons: '',
                    bio: ''
                });
            }
        } catch (err) {
            console.error('Error adding legacy member:', err);
        }
    };

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
                    <h2 className="text-2xl font-black text-white tracking-tight">{t('analytics:profile.search_title', 'Inspecionar Membros')}</h2>
                    <p className="text-sm text-text-secondary max-w-xl">
                        {t('analytics:profile.search_subtitle', 'Visualize o dossiê detalhado dos membros e o histórico do time.')}
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-secondary transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder={t('analytics:profile.search_placeholder', 'Buscar membro...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-primary/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-accent-secondary/50 transition-all shadow-glass"
                        />
                    </div>
                    {isTechnician && (
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="p-3 bg-accent-primary/20 text-accent-primary border border-accent-primary/30 rounded-2xl hover:bg-accent-primary/30 transition-all shadow-glow-primary shrink-0"
                            title="Adicionar Mentor ou Ex-Membro"
                        >
                            <Plus size={20} />
                        </button>
                    )}
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
                            className={`bg-primary/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group shadow-glass ${member.type === 'mentor' ? 'border-accent-tertiary/20' : member.type === 'former' ? 'border-accent-red/20' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform ${member.type === 'mentor' ? 'from-accent-tertiary/20 to-accent-primary/20 text-accent-tertiary' : member.type === 'former' ? 'from-accent-red/20 to-accent-tertiary/20 text-accent-red' : 'from-accent-primary/20 to-accent-secondary/20 text-accent-secondary'}`}>
                                    {member.avatar ? (
                                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-2xl" />
                                    ) : member.type === 'mentor' ? (
                                        <GraduationCap size={24} />
                                    ) : member.type === 'former' ? (
                                        <History size={24} />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white truncate">{member.name}</h4>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${member.type === 'mentor' ? 'text-accent-tertiary' : member.type === 'former' ? 'text-accent-red' : 'text-accent-secondary'}`}>{member.rank}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${member.type === 'mentor' ? 'bg-accent-tertiary' : member.type === 'former' ? 'bg-accent-red' : 'bg-accent-secondary'}`}
                                                style={{ width: member.type === 'active' ? `${Math.min((member.level / 50) * 100, 100)}%` : '100%' }}
                                            />
                                        </div>
                                        {member.type === 'active' && <span className="text-[9px] font-black text-text-muted">LVL {member.level}</span>}
                                        {member.type !== 'active' && <span className="text-[9px] font-black text-text-muted uppercase">{member.type === 'mentor' ? 'Ativo' : 'Histórico'}</span>}
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

            {/* ADD LEGACY MODAL */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setIsAddModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-xl bg-primary/90 border border-white/10 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden" >
                            <div className="p-8 pb-4">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-accent-secondary/20 rounded-2xl text-accent-secondary">
                                        <Plus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">Adicionar Legado</h3>
                                        <p className="text-xs text-text-secondary font-medium">Cadastre mentores ou membros históricos da equipe.</p>
                                    </div>
                                    <button onClick={() => setIsAddModalOpen(false)} className="ml-auto p-2 hover:bg-white/5 rounded-xl transition-all" >
                                        <X size={20} className="text-text-muted" />
                                    </button>
                                </div>

                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tipo</label>
                                            <select 
                                                value={newLegacy.legacyType}
                                                onChange={(e) => setNewLegacy({...newLegacy, legacyType: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-secondary/50 outline-none transition-all appearance-none"
                                            >
                                                <option value="mentor" className="bg-primary">Mentor</option>
                                                <option value="former" className="bg-primary">Membro Anterior</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Nome Completo</label>
                                            <input 
                                                type="text" 
                                                value={newLegacy.name}
                                                onChange={(e) => setNewLegacy({...newLegacy, name: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-secondary/50 outline-none transition-all"
                                                placeholder="Ex: João Silva"
                                            />
                                        </div>
                                    </div>

                                    {newLegacy.legacyType === 'mentor' ? (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Como ajuda a equipe?</label>
                                            <textarea 
                                                value={newLegacy.howHelps}
                                                onChange={(e) => setNewLegacy({...newLegacy, howHelps: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-secondary/50 outline-none transition-all h-24 resize-none"
                                                placeholder="Responsabilidades, mentorias, etc..."
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Como ajudava a equipe?</label>
                                                <textarea 
                                                    value={newLegacy.howHelps}
                                                    onChange={(e) => setNewLegacy({...newLegacy, howHelps: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-secondary/50 outline-none transition-all h-20 resize-none"
                                                    placeholder="Papel que exercia na época..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Por que saiu?</label>
                                                <input 
                                                    type="text" 
                                                    value={newLegacy.reasonForLeaving}
                                                    onChange={(e) => setNewLegacy({...newLegacy, reasonForLeaving: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-secondary/50 outline-none transition-all"
                                                    placeholder="Motivo da saída..."
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Data de Nascimento</label>
                                            <input 
                                                type="text" 
                                                value={newLegacy.birthDate}
                                                onChange={(e) => setNewLegacy({...newLegacy, birthDate: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-secondary/50 outline-none transition-all"
                                                placeholder="DD/MM/AAAA"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Temporadas</label>
                                            <input 
                                                type="text" 
                                                value={newLegacy.seasons}
                                                onChange={(e) => setNewLegacy({...newLegacy, seasons: e.target.value})}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-secondary/50 outline-none transition-all"
                                                placeholder="Ex: 2022, 2023"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Dados Pessoais / Bio</label>
                                        <textarea 
                                            value={newLegacy.bio}
                                            onChange={(e) => setNewLegacy({...newLegacy, bio: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-secondary/50 outline-none transition-all h-20 resize-none"
                                            placeholder="Informações adicionais..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 pt-4">
                                <button 
                                    onClick={handleAddLegacy}
                                    className="w-full py-4 bg-accent-secondary text-white rounded-2xl font-black uppercase tracking-widest shadow-glow-secondary hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={20} />
                                    Cadastrar no Sistema
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MemberInspector;
