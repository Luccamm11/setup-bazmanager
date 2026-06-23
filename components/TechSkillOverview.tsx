import React, { useState, useEffect } from 'react';
import { User, Realm } from '../types';
import { useMembers } from '../hooks/useMembers';
import { SKILL_REALMS, RANKS } from '../constants';
import SkillTree from './SkillTree';
import { 
  ArrowLeft, Search, Sliders, Save, CheckCircle2, User as UserIcon, 
  BookText, Users as UsersIcon, Mic2, ClipboardList, Zap, Code, Hammer, Globe,
  ShieldAlert, Sparkles, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Config colors and icons matching SkillTree.tsx
const realmConfig = {
  [Realm.TechnicalWriting]: { icon: <BookText size={20} />,    color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" },
  [Realm.Networking]:       { icon: <UsersIcon size={20} />,   color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  [Realm.Oratory]:          { icon: <Mic2 size={20} />,        color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
  [Realm.Planning]:         { icon: <ClipboardList size={20} />, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  [Realm.Creativity]:       { icon: <Zap size={20} />,         color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
  [Realm.Programming]:      { icon: <Code size={20} />,        color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  [Realm.Engineering]:      { icon: <Hammer size={20} />,      color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  [Realm.FirstCulture]:     { icon: <Globe size={20} />,       color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" },
};

const getRankForLevel = (level: number): { key: string; title: string } => {
  let currentRank = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.level) {
      currentRank = rank;
    }
  }
  return currentRank;
};

// Colors for different award focus points
const awardColors: Record<string, string> = {
  Sustentabilidade: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  PensamentoCriativo: 'border-violet-500/30 text-violet-400 bg-violet-500/10',
  Conexao: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
  Alcance: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
  Controle: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  Inovacao: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  Design: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
};

interface TechSkillOverviewProps {
  currentUser: string;
}

export const TechSkillOverview: React.FC<TechSkillOverviewProps> = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [memberData, setMemberData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { members: dynamicMembers, loading: membersLoading } = useMembers(currentUser);
  
  // Nivelamento form state (1 to 100)
  const [levelValues, setLevelValues] = useState<Record<Realm, number>>({
    [Realm.TechnicalWriting]: 1,
    [Realm.Networking]: 1,
    [Realm.Oratory]: 1,
    [Realm.Planning]: 1,
    [Realm.Creativity]: 1,
    [Realm.Programming]: 1,
    [Realm.Engineering]: 1,
    [Realm.FirstCulture]: 1,
  });

  // Track members status: maps username to boolean indicating if levels are set
  const [membersStatus, setMembersStatus] = useState<Record<string, boolean>>({});
  const [statusLoading, setStatusLoading] = useState(true);

  // Fetch status of all members on load to display indicator
  useEffect(() => {
    async function loadMembersStatus() {
      if (membersLoading || dynamicMembers.length === 0) return;
      setStatusLoading(true);
      const statuses: Record<string, boolean> = {};
      const members = dynamicMembers.filter(m => m.role === 'member' && m.active);
      
      try {
        await Promise.all(
          members.map(async (member) => {
            const res = await fetch(`/api/persistence?username=${member.username}`);
            const data = await res.json();
            if (data.success && data.data?.user) {
              statuses[member.username] = !!data.data.user.initialLevelsSet;
            } else {
              statuses[member.username] = false;
            }
          })
        );
      } catch (err) {
        console.error('Error loading members status', err);
      } finally {
        setMembersStatus(statuses);
        setStatusLoading(false);
      }
    }
    loadMembersStatus();
  }, [dynamicMembers, membersLoading]);

  // Fetch specific member data when selected
  useEffect(() => {
    if (!selectedUsername) {
      setMemberData(null);
      return;
    }

    async function loadMemberData() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/persistence?username=${selectedUsername}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setMemberData(data.data);
          // Pre-populate stats if they are already saved
          if (data.data.user.stats) {
            const initialVals = { ...levelValues };
            SKILL_REALMS.forEach(realm => {
              initialVals[realm] = data.data.user.stats[realm] || 1;
            });
            setLevelValues(initialVals);
          }
        } else {
          // Member has no saved data yet — initialize with defaults
          const profile = getMemberByUsername(selectedUsername);
          if (profile) {
            const initial = getInitialUserData(profile);
            setMemberData(initial);
            // Default level is 1
            const defaultVals = { ...levelValues };
            SKILL_REALMS.forEach(realm => {
              defaultVals[realm] = 1;
            });
            setLevelValues(defaultVals);
          }
        }
      } catch (err) {
        console.error('Error fetching member data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadMemberData();
  }, [selectedUsername]);

  const handleSliderChange = (realm: Realm, val: number) => {
    setLevelValues(prev => ({ ...prev, [realm]: val }));
  };

  // Calculations for preview
  const averageLevel = SKILL_REALMS.length > 0 
    ? Math.round(SKILL_REALMS.reduce((sum, r) => sum + levelValues[r], 0) / SKILL_REALMS.length)
    : 1;
  const currentRank = getRankForLevel(averageLevel);

  const handleConfirmNivelamento = async () => {
    if (!selectedUsername || !memberData) return;
    
    const confirmMsg = `Deseja confirmar o nivelamento inicial de ${selectedUsername}?\n\n` +
      SKILL_REALMS.map(r => `• ${r}: ${levelValues[r]}`).join('\n') +
      `\n\nNível Geral Estimado: ${averageLevel} (${currentRank.title})\n\nEsta ação só poderá ser feita uma vez!`;
      
    if (!window.confirm(confirmMsg)) return;

    setIsSaving(true);
    try {
      const updatedUser = { ...memberData.user };
      updatedUser.stats = { ...levelValues };
      updatedUser.level_overall = averageLevel;
      updatedUser.rank = currentRank.key;
      updatedUser.initialLevelsSet = true;

      // Update XP for next level based on new overall level
      updatedUser.xpToNextLevel = Math.floor(130 * Math.pow(1.2, averageLevel - 1));

      // Update their core skill tree levels to match stats if applicable or keep defaults
      // We will update the memberData state and persist it
      const updatedData = {
        ...memberData,
        user: updatedUser
      };

      const res = await fetch('/api/persistence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedUsername, data: updatedData })
      });
      
      const data = await res.json();
      if (data.success) {
        setMemberData(updatedData);
        setMembersStatus(prev => ({ ...prev, [selectedUsername]: true }));
        alert(`Nivelamento inicial de ${selectedUsername} salvo com sucesso!`);
      } else {
        alert('Erro ao salvar o nivelamento: ' + data.error);
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro de conexão ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMembers = dynamicMembers
    .filter(m => m.role === 'member' && m.active)
    .filter(m => m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 (m.fullName && m.fullName.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 min-h-[70vh]">
      <AnimatePresence mode="wait">
        {!selectedUsername ? (
          // MEMEMBER SELECTOR SCREEN
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="text-center md:text-left md:flex md:items-center md:justify-between border-b border-white/5 pb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
                  <Sliders className="text-accent-primary" />
                  Nivelamento e Árvores de Habilidades
                </h2>
                <p className="text-text-secondary mt-1">
                  Gerencie o nível inicial dos reinos e visualize as árvores de habilidades de todos os membros.
                </p>
              </div>
              <div className="mt-4 md:mt-0 w-full md:max-w-md relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full opacity-25 group-hover:opacity-40 blur transition duration-300"></div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Pesquisar membro..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-primary/80 backdrop-blur-md border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary shadow-inner text-sm font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            {statusLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="animate-spin text-accent-primary w-10 h-10" />
                <span className="text-text-muted text-sm font-semibold">Carregando membros da robótica...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredMembers.map(member => {
                  const isLeveled = membersStatus[member.username];
                  return (
                    <motion.button
                      key={member.username}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedUsername(member.username)}
                      className="bg-primary/30 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-2xl p-5 text-left flex flex-col justify-between h-48 transition-all hover:shadow-[0_10px_35px_rgba(0,0,0,0.4)] relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start w-full">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary group-hover:text-white transition-colors">
                            <UserIcon size={20} />
                          </div>
                          <div>
                            <h4 className="font-black text-white text-base leading-tight">{member.displayName}</h4>
                            <p className="text-xs text-text-muted truncate max-w-[150px]">{member.fullName || member.displayName}</p>
                          </div>
                        </div>
                        
                        {isLeveled ? (
                          <div className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1 shadow-sm">
                            <CheckCircle2 size={10} />
                            Nivelado
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1 shadow-sm animate-pulse">
                            Pendente
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex-grow flex items-end">
                        {member.awardFocus ? (
                          <span className={`text-[10px] font-extrabold px-2 py-1 rounded-md border tracking-wide uppercase ${awardColors[member.awardFocus] || 'border-white/10 text-white bg-white/5'}`}>
                            {member.awardFocus}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-text-muted italic">Foco Geral</span>
                        )}
                      </div>

                      <div className="mt-4 border-t border-white/5 pt-3 w-full flex items-center justify-between text-xs text-text-secondary">
                        <span className="font-semibold text-text-muted">Acessar árvore</span>
                        <ArrowLeft size={14} className="rotate-180 text-text-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          // SPECIFIC MEMBER DETAIL SCREEN
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setSelectedUsername(null)}
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-text-secondary hover:text-white transition-all shadow-sm flex items-center justify-center"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  Árvore de {selectedUsername}
                </h3>
                <p className="text-xs text-text-secondary">
                  Visualizando perfil técnico de {getMemberByUsername(selectedUsername)?.fullName || selectedUsername}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="animate-spin text-accent-primary w-8 h-8" />
                <span className="text-text-muted text-sm">Buscando dados de {selectedUsername}...</span>
              </div>
            ) : memberData?.user ? (
              // Check if initial levels have been set
              memberData.user.initialLevelsSet ? (
                // VIEW MODE (Read-only Skill Tree)
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-primary/10 rounded-3xl border border-white/5 p-6 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <span className="font-black text-xl bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-white">
                        Lvl {memberData.user.level_overall}
                      </span>
                      <span className="font-black text-sm tracking-wider uppercase text-accent-primary">
                        Rank: {getRankForLevel(memberData.user.level_overall).title}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      Nivelado pelo Técnico
                    </div>
                  </div>
                  
                  <SkillTree user={memberData.user} readOnly={true} />
                </motion.div>
              ) : (
                // SETUP MODE (Assign Initial Levels Form 1-100)
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto shadow-glass relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-transparent pointer-events-none"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 mb-8 gap-4">
                    <div>
                      <h4 className="text-xl font-black text-white flex items-center gap-2">
                        <Sliders className="text-amber-400" />
                        Definir Nível Inicial (1 a 100)
                      </h4>
                      <p className="text-sm text-text-secondary mt-1">
                        Estipule o nível pré-existente de {selectedUsername} em cada um dos 8 reinos da robótica.
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-inner">
                      <div className="text-center">
                        <span className="block text-[10px] font-extrabold uppercase text-text-muted tracking-wider">Nível Geral</span>
                        <span className="font-black text-2xl text-accent-primary">{averageLevel}</span>
                      </div>
                      <div className="h-8 w-px bg-white/10"></div>
                      <div>
                        <span className="block text-[10px] font-extrabold uppercase text-text-muted tracking-wider">Rank Atribuído</span>
                        <span className="font-black text-sm text-white">{currentRank.title}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {SKILL_REALMS.map(realm => {
                      const config = realmConfig[realm];
                      const val = levelValues[realm];
                      return (
                        <div key={realm} className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl flex flex-col space-y-3 hover:bg-white/[0.04] transition-all">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2.5">
                              <div className={`p-2 rounded-xl ${config.bg} ${config.border} ${config.color} border`}>
                                {config.icon}
                              </div>
                              <span className="font-bold text-white text-sm">{realm}</span>
                            </div>
                            <input 
                              type="number"
                              min={1}
                              max={100}
                              value={val}
                              onChange={(e) => {
                                const v = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                                handleSliderChange(realm, v);
                              }}
                              className="w-16 bg-black/40 border border-white/10 rounded-lg text-center font-black text-sm text-white py-1 focus:outline-none focus:border-accent-primary"
                            />
                          </div>

                          <div className="flex items-center space-x-4 w-full">
                            <input 
                              type="range"
                              min={1}
                              max={100}
                              value={val}
                              onChange={(e) => handleSliderChange(realm, parseInt(e.target.value))}
                              className="flex-1 accent-accent-primary cursor-pointer h-1.5 bg-white/10 rounded-full"
                            />
                            <span className="text-xs font-extrabold text-text-secondary w-6 text-right">{val}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center space-x-2 text-text-muted text-xs bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                      <ShieldAlert className="text-amber-400 shrink-0" size={16} />
                      <span><strong>Atenção:</strong> O nivelamento inicial só pode ser feito uma vez e não poderá ser alterado posteriormente.</span>
                    </div>

                    <button 
                      onClick={handleConfirmNivelamento}
                      disabled={isSaving}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-secondary hover:to-accent-primary text-white font-bold py-3 px-8 rounded-xl transition-all shadow-glow-primary active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          <span>Salvar Nivelamento</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            ) : (
              <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl max-w-xl mx-auto">
                <p className="text-text-secondary font-medium">Erro ao carregar dados do usuário.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TechSkillOverview;
