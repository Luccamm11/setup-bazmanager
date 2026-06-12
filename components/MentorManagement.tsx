import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, GraduationCap, Calendar, MapPin, Video, Award, 
  Trash2, Edit, Check, X, ChevronDown, Plus, Search, Building, 
  AlertTriangle, RefreshCw, Clock, ArrowRight, UserCheck
} from 'lucide-react';
import { Mentor, MentorshipRecord, UserRole } from '../types';

interface MentorManagementProps {
  currentUser: string;
  userRole: UserRole;
}

interface MemberOption {
  username: string;
  displayName: string;
}

export default function MentorManagement({ currentUser, userRole }: MentorManagementProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<'records' | 'mentors'>('records');

  // Mentors and Records State
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [records, setRecords] = useState<MentorshipRecord[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters
  const [mentorSearch, setMentorSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');

  // Modals / Forms state
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MentorshipRecord | null>(null);

  // Mentor Form Fields
  const [mentorName, setMentorName] = useState('');
  const [mentorArea, setMentorArea] = useState('');
  const [mentorOrg, setMentorOrg] = useState('');

  // Record Form Fields
  const [recMentorId, setRecMentorId] = useState('');
  const [recDate, setRecDate] = useState('');
  const [recType, setRecType] = useState<'online' | 'presential'>('presential');
  const [recLocationType, setRecLocationType] = useState<'our_lab' | 'visited_them' | 'other'>('our_lab');
  const [recLocationName, setRecLocationName] = useState('');
  const [recArea, setRecArea] = useState('');
  const [recParticipants, setRecParticipants] = useState<string[]>([]);
  const [recAdvantages, setRecAdvantages] = useState('');
  const [mentorDropdownOpen, setMentorDropdownOpen] = useState(false);

  // Load Mentors, Records, and Members
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch mentors and records
      const mentorRes = await fetch('/api/mentors');
      const mentorData = await mentorRes.json();
      if (mentorData.success) {
        setMentors(mentorData.mentors || []);
        setRecords(mentorData.records || []);
      } else {
        throw new Error(mentorData.error || 'Erro ao carregar mentores.');
      }

      // Fetch team members for checklist
      const memberRes = await fetch(`/api/members?requester=${encodeURIComponent(currentUser)}`);
      const memberData = await memberRes.json();
      if (memberData.success) {
        setMembers(memberData.members.map((m: any) => ({
          username: m.username,
          displayName: m.displayName
        })));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Mentor Form submit
  const handleSaveMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorName.trim() || !mentorArea.trim()) {
      alert('Nome e Área de Ajuda são obrigatórios.');
      return;
    }

    try {
      const payload = editingMentor 
        ? { action: 'editMentor', id: editingMentor.id, name: mentorName, area: mentorArea, organization: mentorOrg }
        : { action: 'addMentor', name: mentorName, area: mentorArea, organization: mentorOrg };

      const res = await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMentorModalOpen(false);
      setEditingMentor(null);
      setMentorName('');
      setMentorArea('');
      setMentorOrg('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar mentor.');
    }
  };

  // Delete Mentor
  const handleDeleteMentor = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja remover este mentor? Registros vinculados a ele continuarão no histórico.')) return;
    try {
      const res = await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteMentor', id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir mentor.');
    }
  };

  // Record Form submit
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recMentorId || !recDate || !recArea || recParticipants.length === 0) {
      alert('Preencha os campos obrigatórios (Mentor, Data, Área de Ajuda e Participantes).');
      return;
    }

    try {
      const payload = {
        action: editingRecord ? 'editRecord' : 'addRecord',
        id: editingRecord?.id,
        mentorId: recMentorId,
        date: recDate,
        type: recType,
        locationType: recType === 'presential' ? recLocationType : undefined,
        locationName: recType === 'presential' && recLocationType !== 'our_lab' ? recLocationName : undefined,
        area: recArea,
        participants: recParticipants,
        advantages: recAdvantages,
      };

      const res = await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setRecordModalOpen(false);
      setEditingRecord(null);
      // Reset fields
      setRecMentorId('');
      setRecDate('');
      setRecType('presential');
      setRecLocationType('our_lab');
      setRecLocationName('');
      setRecArea('');
      setRecParticipants([]);
      setRecAdvantages('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar registro de mentoria.');
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Excluir este registro de mentoria permanentemente?')) return;
    try {
      const res = await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteRecord', id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir registro.');
    }
  };

  // Open Edit Mentor Modal
  const openEditMentor = (mentor: Mentor) => {
    setEditingMentor(mentor);
    setMentorName(mentor.name);
    setMentorArea(mentor.area);
    setMentorOrg(mentor.organization || '');
    setMentorModalOpen(true);
  };

  // Open Edit Record Modal
  const openEditRecord = (rec: MentorshipRecord) => {
    setEditingRecord(rec);
    setRecMentorId(rec.mentorId);
    setRecDate(rec.date);
    setRecType(rec.type);
    setRecLocationType(rec.locationType || 'our_lab');
    setRecLocationName(rec.locationName || '');
    setRecArea(rec.area);
    setRecParticipants(rec.participants);
    setRecAdvantages(rec.advantages || '');
    setRecordModalOpen(true);
  };

  // Toggle participants checklist
  const toggleParticipant = (username: string) => {
    setRecParticipants(prev => 
      prev.includes(username) 
        ? prev.filter(u => u !== username) 
        : [...prev, username]
    );
  };

  // Filter lists
  const filteredMentors = mentors.filter(m => 
    m.name.toLowerCase().includes(mentorSearch.toLowerCase()) ||
    m.area.toLowerCase().includes(mentorSearch.toLowerCase()) ||
    (m.organization && m.organization.toLowerCase().includes(mentorSearch.toLowerCase()))
  );

  const filteredRecords = records.filter(r => {
    const mentor = mentors.find(m => m.id === r.mentorId);
    const mName = mentor ? mentor.name.toLowerCase() : '';
    const q = recordSearch.toLowerCase();
    return (
      r.area.toLowerCase().includes(q) ||
      mName.includes(q) ||
      (r.locationName && r.locationName.toLowerCase().includes(q))
    );
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const selectedMentorObj = mentors.find(m => m.id === recMentorId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Upper Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent-primary to-accent-tertiary shadow-glow-primary">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            Gerenciamento de Mentores
          </h1>
          <p className="text-text-secondary text-sm mt-1.5">
            Registre mentorias e consulte mentores da equipe Bazinga.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'records'
                ? 'bg-accent-primary text-white shadow-glow-primary'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Sessões
          </button>
          <button
            onClick={() => setActiveTab('mentors')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'mentors'
                ? 'bg-accent-primary text-white shadow-glow-primary'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Mentores
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto flex items-center gap-1 text-xs font-bold underline">
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-8 h-8 text-accent-primary animate-spin" />
          <p className="text-text-secondary text-sm">Carregando dados do Redis...</p>
        </div>
      ) : (
        <div>
          {/* ================= TAB 1: SESSIONS ================= */}
          {activeTab === 'records' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    value={recordSearch}
                    onChange={e => setRecordSearch(e.target.value)}
                    placeholder="Pesquisar por mentor, área ou local..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/60 placeholder:text-white/20 transition-all"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingRecord(null);
                    setRecMentorId('');
                    setRecDate(new Date().toISOString().split('T')[0]);
                    setRecType('presential');
                    setRecLocationType('our_lab');
                    setRecLocationName('');
                    setRecArea('');
                    setRecParticipants([]);
                    setRecAdvantages('');
                    setRecordModalOpen(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary border border-accent-primary/30 text-white font-bold text-sm hover:opacity-90 transition-all shadow-glow-primary shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Mentoria
                </button>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <Calendar className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-60" />
                  <p className="text-white font-bold">Nenhuma mentoria encontrada</p>
                  <p className="text-text-secondary text-xs mt-1">Registre uma mentoria ou modifique os termos da busca.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredRecords.map(rec => {
                    const mentor = mentors.find(m => m.id === rec.mentorId);
                    return (
                      <motion.div
                        key={rec.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-5 sm:p-6 transition-all duration-300 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-bold text-white">
                                {mentor ? mentor.name : 'Mentor Excluído'}
                              </h3>
                              {mentor?.organization && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/10">
                                  {mentor.organization}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-muted flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-accent-primary" />
                              {new Date(rec.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditRecord(rec)}
                              className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-text-secondary transition-all"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-400 text-text-secondary transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Record Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-white/5">
                          {/* Modality & Local */}
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Modalidade / Local</span>
                            <div className="flex items-center gap-2 text-sm text-white">
                              {rec.type === 'online' ? (
                                <>
                                  <Video className="w-4 h-4 text-cyan-400" />
                                  <span>Online / Virtual</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="w-4 h-4 text-emerald-400" />
                                  <span>
                                    {rec.locationType === 'our_lab' && 'Nosso Laboratório'}
                                    {rec.locationType === 'visited_them' && `Visitamos o Mentor: ${rec.locationName || ''}`}
                                    {rec.locationType === 'other' && `Outro: ${rec.locationName || ''}`}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Focus Area */}
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Área de Foco</span>
                            <p className="text-sm text-white font-medium flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-yellow-400" />
                              {rec.area}
                            </p>
                          </div>

                          {/* Members */}
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Membros Participantes</span>
                            <div className="flex flex-wrap gap-1">
                              {rec.participants.map(username => {
                                const mbr = members.find(m => m.username === username);
                                return (
                                  <span key={username} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                                    {mbr ? mbr.displayName : username}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Advantages / Notes */}
                        {rec.advantages && (
                          <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 text-xs space-y-1">
                            <span className="font-bold text-text-secondary block">Vantagens e Anotações da Mentoria:</span>
                            <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{rec.advantages}</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: MENTORS ================= */}
          {activeTab === 'mentors' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    value={mentorSearch}
                    onChange={e => setMentorSearch(e.target.value)}
                    placeholder="Pesquisar por mentor, área ou empresa..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/60 placeholder:text-white/20 transition-all"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingMentor(null);
                    setMentorName('');
                    setMentorArea('');
                    setMentorOrg('');
                    setMentorModalOpen(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary border border-accent-primary/30 text-white font-bold text-sm hover:opacity-90 transition-all shadow-glow-primary shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  Adicionar Mentor
                </button>
              </div>

              {filteredMentors.length === 0 ? (
                <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <GraduationCap className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-60" />
                  <p className="text-white font-bold">Nenhum mentor encontrado</p>
                  <p className="text-text-secondary text-xs mt-1">Crie um novo mentor ou refine sua pesquisa.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMentors.map(m => (
                    <motion.div
                      key={m.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-tertiary/20 flex items-center justify-center text-accent-primary font-bold text-lg border border-accent-primary/20">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">{m.name}</h3>
                            {m.organization && (
                              <p className="text-xs text-text-muted flex items-center gap-1">
                                <Building className="w-3.5 h-3.5" />
                                {m.organization}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 pt-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Área de Especialidade</span>
                          <p className="text-sm text-white/90 font-medium leading-relaxed">{m.area}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${m.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-white/20'}`} />
                          <span className="text-xs text-text-secondary">{m.active ? 'Ativo' : 'Inativo'}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditMentor(m)}
                            className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-text-secondary transition-all"
                            title="Editar Mentor"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMentor(m.id)}
                            className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-400 text-text-secondary transition-all"
                            title="Deletar Mentor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT MENTOR ================= */}
      <AnimatePresence>
        {mentorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMentorModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#16192a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-accent-primary" />
                  {editingMentor ? 'Editar Mentor' : 'Adicionar Novo Mentor'}
                </h3>
                <button
                  onClick={() => setMentorModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMentor} className="space-y-4">
                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block font-bold">Nome do Mentor *</label>
                  <input
                    value={mentorName}
                    onChange={e => setMentorName(e.target.value)}
                    placeholder="Ex: Alexandre Santos"
                    required
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block font-bold">Área de Especialidade *</label>
                  <input
                    value={mentorArea}
                    onChange={e => setMentorArea(e.target.value)}
                    placeholder="Ex: Automação / Design de Garra"
                    required
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block font-bold">Organização / Instituição (Opcional)</label>
                  <input
                    value={mentorOrg}
                    onChange={e => setMentorOrg(e.target.value)}
                    placeholder="Ex: SENAI, Bosch, UTFPR"
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-bold shadow-glow-primary hover:opacity-95 transition-all"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMentorModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-sm hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: REGISTER / EDIT RECORD ================= */}
      <AnimatePresence>
        {recordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRecordModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-[#16192a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 z-10 space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent-primary" />
                  {editingRecord ? 'Editar Registro de Mentoria' : 'Registrar Sessão de Mentoria'}
                </h3>
                <button
                  onClick={() => setRecordModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRecord} className="space-y-4">
                {/* Form fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Custom Mentor Selector Dropdown */}
                  <div className="relative">
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Mentor *</label>
                    <button
                      type="button"
                      onClick={() => setMentorDropdownOpen(v => !v)}
                      className="w-full flex items-center justify-between gap-2 bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none hover:border-white/20 transition-all"
                    >
                      <span className={selectedMentorObj ? 'text-white' : 'text-white/40'}>
                        {selectedMentorObj ? selectedMentorObj.name : 'Selecionar Mentor'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${mentorDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {mentorDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.97 }}
                          transition={{ duration: 0.12 }}
                          className="absolute z-50 top-full mt-1 w-full bg-[#1b1f35] border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-48 custom-scrollbar"
                        >
                          {mentors.length === 0 ? (
                            <div className="p-3 text-xs text-text-muted text-center">Nenhum mentor cadastrado</div>
                          ) : (
                            mentors.filter(m => m.active).map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setRecMentorId(m.id);
                                  setMentorDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                                  recMentorId === m.id ? 'text-white bg-accent-primary/20 font-bold' : 'text-white/80'
                                }`}
                              >
                                {m.name}
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Data da Mentoria *</label>
                    <input
                      type="date"
                      value={recDate}
                      required
                      onChange={e => setRecDate(e.target.value)}
                      className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/60 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Modality Selector */}
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Modalidade *</label>
                    <div className="flex bg-[#1b1f35] p-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setRecType('presential')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                          recType === 'presential' 
                            ? 'bg-accent-primary text-white shadow-glow-primary' 
                            : 'text-text-secondary hover:text-white'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Presencial
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecType('online')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                          recType === 'online' 
                            ? 'bg-accent-primary text-white shadow-glow-primary' 
                            : 'text-text-secondary hover:text-white'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        Online
                      </button>
                    </div>
                  </div>

                  {/* Area specific */}
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Área Específica que Ajudou *</label>
                    <input
                      value={recArea}
                      onChange={e => setRecArea(e.target.value)}
                      placeholder="Ex: Programação de Odometria"
                      required
                      className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all"
                    />
                  </div>
                </div>

                {/* Location Selection (for Presential) */}
                <AnimatePresence>
                  {recType === 'presential' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-3"
                    >
                      <div>
                        <label className="text-xs text-text-secondary mb-1.5 block font-bold">Local Presencial</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'our_lab', label: '🏫 Nosso Laboratório' },
                            { value: 'visited_them', label: '🚗 Visitamos o Mentor' },
                            { value: 'other', label: '📌 Outro' }
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setRecLocationType(opt.value as any)}
                              className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                                recLocationType === opt.value
                                  ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                                  : 'bg-[#1b1f35] border-white/5 text-text-secondary hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {recLocationType !== 'our_lab' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="pt-1"
                        >
                          <label className="text-xs text-text-secondary mb-1.5 block font-bold">Digite o Local Específico *</label>
                          <input
                            value={recLocationName}
                            onChange={e => setRecLocationName(e.target.value)}
                            placeholder={recLocationType === 'visited_them' ? "Ex: UTFPR Bloco G" : "Ex: Faculdade X"}
                            required
                            className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/60 transition-all"
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Participants Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs text-text-secondary block font-bold">Membros Participantes *</label>
                  <p className="text-[10px] text-text-muted">Selecione pelo menos um participante</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-[#1b1f35] rounded-xl border border-white/10 custom-scrollbar">
                    {members.map(m => {
                      const selected = recParticipants.includes(m.username);
                      return (
                        <button
                          key={m.username}
                          type="button"
                          onClick={() => toggleParticipant(m.username)}
                          className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${
                            selected 
                              ? 'bg-accent-primary/10 border-accent-primary text-accent-primary' 
                              : 'bg-white/[0.02] border-transparent hover:bg-white/5 text-text-secondary'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                            selected ? 'bg-accent-primary border-accent-primary' : 'border-white/20'
                          }`}>
                            {selected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-xs font-medium truncate">{m.displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Advantages Obtained */}
                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block font-bold">Vantagens Obtidas / Notas da Sessão</label>
                  <textarea
                    value={recAdvantages}
                    onChange={e => setRecAdvantages(e.target.value)}
                    placeholder="Quais ganhos e aprendizados a equipe obteve com essa mentoria? (Ex: Insights de engenharia, conexões de patrocínio, etc.)"
                    rows={3}
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-bold shadow-glow-primary hover:opacity-95 transition-all"
                  >
                    Confirmar Registro
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-sm hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
