import React, { useState, useEffect } from 'react';
import { MemberProfile } from '../../data/members';
import { 
  Users, UserPlus, Edit2, Trash2, Save, X, Search, Check, AlertTriangle, 
  Dna, GraduationCap, Trophy, Calendar, Award, Loader2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface MemberManagementProps {
  currentUser: string;
  onMembersUpdated: (members: MemberProfile[]) => void;
}

const AWARD_OPTIONS = [
  { value: null, label: 'Nenhum / Geral' },
  { value: 'Sustentabilidade', label: '🌱 Sustentabilidade' },
  { value: 'PensamentoCriativo', label: '💡 Pensamento Criativo' },
  { value: 'Conexao', label: '🤝 Conexão' },
  { value: 'Alcance', label: '📢 Alcance' },
  { value: 'Controle', label: '🤖 Controle' },
  { value: 'Inovacao', label: '🚀 Inovação' },
  { value: 'Design', label: '🔧 Design Industrial' },
];

const awardColors: Record<string, string> = {
  Sustentabilidade: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  PensamentoCriativo: 'border-violet-500/30 text-violet-400 bg-violet-500/10',
  Conexao: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
  Alcance: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
  Controle: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  Inovacao: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  Design: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
};

export const MemberManagement: React.FC<MemberManagementProps> = ({ currentUser, onMembersUpdated }) => {
  const { t } = useTranslation(['analytics', 'common']);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    fullName: '',
    role: 'member' as 'member' | 'technician',
    grade: '',
    awardFocus: null as string | null,
    coreMission: '',
    seasonGoal: '',
    shortTermGoal: '',
    seasons: [] as string[]
  });

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
        onMembersUpdated(data.members || []);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const resetForm = () => {
    setFormData({
      username: '',
      displayName: '',
      fullName: '',
      role: 'member',
      grade: '',
      awardFocus: null,
      coreMission: '',
      seasonGoal: '',
      shortTermGoal: '',
      seasons: []
    });
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (member: MemberProfile) => {
    setFormData({
      username: member.username,
      displayName: member.displayName,
      fullName: member.fullName || '',
      role: member.role,
      grade: member.grade || '',
      awardFocus: member.awardFocus || null,
      coreMission: member.coreMission || '',
      seasonGoal: member.seasonGoal || '',
      shortTermGoal: member.shortTermGoal || '',
      seasons: member.seasons || []
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.displayName) {
      alert('Login e Nome de Exibição são obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modalMode,
          member: formData,
          username: currentUser
        })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(data.members);
        onMembersUpdated(data.members);
        setIsModalOpen(false);
        resetForm();
      } else {
        alert('Erro ao salvar membro: ' + data.error);
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro de conexão ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (username: string) => {
    if (username === currentUser) {
      alert('Você não pode desativar seu próprio usuário.');
      return;
    }

    const confirmMsg = `Tem certeza que deseja DESATIVAR o membro ${username}?\n\nEle não aparecerá mais nas listas de login e gráficos, mas os dados de progresso dele no banco de dados serão preservados.`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          member: { username },
          username: currentUser
        })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(data.members);
        onMembersUpdated(data.members);
      } else {
        alert('Erro ao desativar membro: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const term = search.toLowerCase();
    const matchesSearch = m.displayName.toLowerCase().includes(term) || 
                          m.username.toLowerCase().includes(term) || 
                          (m.fullName && m.fullName.toLowerCase().includes(term));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-primary/20 backdrop-blur-md p-4 rounded-3xl border border-white/5 shadow-glass">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Pesquisar membro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary shadow-inner text-sm font-medium transition-all"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={loadMembers}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-text-secondary hover:text-white transition-all shadow-sm flex items-center justify-center"
            title="Recarregar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-secondary hover:to-accent-primary text-white font-bold py-2.5 px-5 rounded-2xl transition-all shadow-glow-primary active:scale-98 text-sm"
          >
            <UserPlus size={18} />
            <span>Adicionar Membro</span>
          </button>
        </div>
      </div>

      {/* Members Grid / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="animate-spin text-accent-primary w-10 h-10" />
          <span className="text-text-muted text-sm font-semibold">Carregando lista de membros...</span>
        </div>
      ) : (
        <div className="bg-primary/20 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-text-secondary">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="p-4 font-black text-text-primary uppercase tracking-wider text-[11px]">{t('user', 'Membro')}</th>
                  <th className="p-4 font-black text-text-primary uppercase tracking-wider text-[11px]">Login (Username)</th>
                  <th className="p-4 font-black text-text-primary uppercase tracking-wider text-[11px]">Cargo</th>
                  <th className="p-4 font-black text-text-primary uppercase tracking-wider text-[11px]">Foco de Prêmio</th>
                  <th className="p-4 font-black text-text-primary uppercase tracking-wider text-[11px]">Status</th>
                  <th className="p-4 font-black text-text-primary uppercase tracking-wider text-[11px] text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMembers.map(member => {
                  const isActive = member.active !== false;
                  return (
                    <tr 
                      key={member.username} 
                      className={`hover:bg-white/[0.02] transition-colors ${!isActive ? 'opacity-50 bg-black/10' : ''}`}
                    >
                      {/* Name/Display */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center font-black text-white text-xs">
                            {member.displayName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-white leading-none">{member.displayName}</p>
                            {member.fullName && <p className="text-[11px] text-text-muted mt-1 truncate max-w-[180px]">{member.fullName}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="p-4 font-mono text-xs text-text-secondary">{member.username}</td>

                      {/* Role */}
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${member.role === 'technician' ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                          {member.role === 'technician' ? '🛡️ Técnico' : 'Membro'}
                        </span>
                      </td>

                      {/* Award Focus */}
                      <td className="p-4">
                        {member.awardFocus ? (
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wide ${awardColors[member.awardFocus] || 'border-white/10 text-white bg-white/5'}`}>
                            {member.awardFocus}
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-muted italic">Geral</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-glow-primary"></span>
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-text-muted border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => openEditModal(member)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-text-secondary hover:text-white transition-all"
                            title="Editar Dossiê"
                          >
                            <Edit2 size={14} />
                          </button>
                          
                          {isActive ? (
                            <button 
                              onClick={() => handleRemove(member.username)}
                              disabled={member.username === currentUser}
                              className="p-2 bg-white/5 hover:bg-accent-red/10 rounded-xl text-text-secondary hover:text-accent-red transition-all disabled:opacity-40"
                              title="Desativar"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button 
                              onClick={async () => {
                                setFormData({
                                  username: member.username,
                                  displayName: member.displayName,
                                  fullName: member.fullName || '',
                                  role: member.role,
                                  grade: member.grade || '',
                                  awardFocus: member.awardFocus || null,
                                  coreMission: member.coreMission || '',
                                  seasonGoal: member.seasonGoal || '',
                                  shortTermGoal: member.shortTermGoal || '',
                                  seasons: member.seasons || []
                                });
                                // Reactivate
                                setLoading(true);
                                try {
                                  const res = await fetch('/api/members', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      action: 'add',
                                      member: { ...member, active: true },
                                      username: currentUser
                                    })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    setMembers(data.members);
                                    onMembersUpdated(data.members);
                                  }
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="p-2 bg-white/5 hover:bg-emerald-500/10 rounded-xl text-text-secondary hover:text-emerald-400 transition-all"
                              title="Reativar"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-text-muted italic">Nenhum membro encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal - Add / Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-primary/90 border border-white/10 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent-primary/20 rounded-2xl text-accent-primary">
                    <Dna size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {modalMode === 'add' ? 'Adicionar Novo Membro' : `Editar Dossiê: ${formData.username}`}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">Defina os parâmetros técnicos e pessoais do perfil.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                  <X size={20} className="text-text-muted" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[65vh] overflow-y-auto pr-4 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username (Login) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Login (Username)</label>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      disabled={modalMode === 'edit'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all disabled:opacity-50"
                      placeholder="Ex: Luiz"
                      required
                    />
                  </div>

                  {/* Display Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Nome de Exibição (DisplayName)</label>
                    <input 
                      type="text" 
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all"
                      placeholder="Ex: Luiz Silva"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Nome Completo</label>
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all"
                      placeholder="Ex: Luiz Henrique Silva"
                    />
                  </div>

                  {/* Grade */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Série / Grau Escolar</label>
                    <input 
                      type="text" 
                      value={formData.grade}
                      onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all"
                      placeholder="Ex: 3º Ano Ensino Médio"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Role */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Cargo</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="member" className="bg-zinc-900">Membro</option>
                      <option value="technician" className="bg-zinc-900">🛡️ Técnico</option>
                    </select>
                  </div>

                  {/* Award Focus */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Foco de Prêmio (Realms)</label>
                    <select
                      value={formData.awardFocus || ''}
                      onChange={(e) => setFormData({...formData, awardFocus: e.target.value || null})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {AWARD_OPTIONS.map(opt => (
                        <option key={opt.value || 'null'} value={opt.value || ''} className="bg-zinc-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="h-px bg-white/5 my-4" />

                {/* Core Mission */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Missão Principal (Core Mission)</label>
                  <textarea 
                    value={formData.coreMission}
                    onChange={(e) => setFormData({...formData, coreMission: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all h-20 resize-none"
                    placeholder="Descrição da missão individual do membro..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Season Goal */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Meta da Temporada (LongTerm)</label>
                    <textarea 
                      value={formData.seasonGoal}
                      onChange={(e) => setFormData({...formData, seasonGoal: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all h-20 resize-none"
                      placeholder="Meta a longo prazo na robótica..."
                    />
                  </div>

                  {/* Short Term Goal */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Meta de Curto Prazo (ShortTerm)</label>
                    <textarea 
                      value={formData.shortTermGoal}
                      onChange={(e) => setFormData({...formData, shortTermGoal: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary/50 outline-none transition-all h-20 resize-none"
                      placeholder="Próximos passos práticos..."
                    />
                  </div>
                </div>

                {modalMode === 'add' && (
                  <div className="flex items-center space-x-2 text-text-muted text-xs bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl">
                    <AlertTriangle className="text-yellow-500 shrink-0" size={16} />
                    <span>Ao salvar, a senha de login padrão será configurada como <strong>021083</strong>. O membro poderá alterar depois.</span>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-white/5 flex gap-3 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-text-secondary hover:text-white transition-all uppercase tracking-wider"
                  >
                    {t('common:actions.cancel', 'Cancelar')}
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-secondary hover:to-accent-primary text-white border border-transparent rounded-xl text-xs font-bold transition-all shadow-glow-primary active:scale-98 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>{t('common:actions.save', 'Salvar')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemberManagement;
