import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, GraduationCap, Calendar, MapPin, Video, Award, 
  Trash2, Edit, Check, X, ChevronDown, Plus, Search, Building, 
  AlertTriangle, RefreshCw, Clock, ArrowRight, UserCheck, Heart,
  Star, FileText, ChevronRight
} from 'lucide-react';
import { Mentor, MentorshipRecord, VolunteerWork, VolunteerContribution, UserRole } from '../types';

interface MentorManagementProps {
  currentUser: string;
  userRole: UserRole;
}

interface MemberOption {
  username: string;
  displayName: string;
}

// Role badge helper
const RoleBadge = ({ role }: { role: Mentor['role'] }) => {
  if (role === 'mentor') return (
    <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-primary/15 text-accent-primary border border-accent-primary/20 font-bold uppercase tracking-wider flex items-center gap-1">
      <GraduationCap className="w-2.5 h-2.5" /> Mentor
    </span>
  );
  if (role === 'volunteer') return (
    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
      <Heart className="w-2.5 h-2.5" /> Voluntário
    </span>
  );
  return (
    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
      <Star className="w-2.5 h-2.5" /> Mentor & Voluntário
    </span>
  );
};

export default function MentorManagement({ currentUser, userRole }: MentorManagementProps) {
  // Tabs: 'records' | 'people' | 'volunteer_works'
  const [activeTab, setActiveTab] = useState<'records' | 'people' | 'volunteer_works'>('records');

  // State
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [records, setRecords] = useState<MentorshipRecord[]>([]);
  const [volunteerWorks, setVolunteerWorks] = useState<VolunteerWork[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters
  const [mentorSearch, setMentorSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [workSearch, setWorkSearch] = useState('');

  // ─── Mentor/Person modal ───────────────────────────────────────────────────
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [mentorName, setMentorName] = useState('');
  const [mentorArea, setMentorArea] = useState('');
  const [mentorOrg, setMentorOrg] = useState('');
  const [mentorRole, setMentorRole] = useState<Mentor['role']>('mentor');

  // ─── Mentorship Record modal ───────────────────────────────────────────────
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MentorshipRecord | null>(null);
  const [recMentorId, setRecMentorId] = useState('');
  const [recDate, setRecDate] = useState('');
  const [recType, setRecType] = useState<'online' | 'presential'>('presential');
  const [recLocationType, setRecLocationType] = useState<'our_lab' | 'visited_them' | 'other'>('our_lab');
  const [recLocationName, setRecLocationName] = useState('');
  const [recArea, setRecArea] = useState('');
  const [recParticipants, setRecParticipants] = useState<string[]>([]);
  const [recAdvantages, setRecAdvantages] = useState('');
  const [mentorDropdownOpen, setMentorDropdownOpen] = useState(false);

  // ─── Volunteer Work modal ──────────────────────────────────────────────────
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<VolunteerWork | null>(null);
  const [workEventName, setWorkEventName] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workDate, setWorkDate] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  // contributions: list of { username, contribution }
  const [workContributions, setWorkContributions] = useState<VolunteerContribution[]>([]);

  // ─── Fetch Data ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mentorRes = await fetch('/api/mentors');
      const mentorData = await mentorRes.json();
      if (mentorData.success) {
        // Backfill role for legacy entries without it
        setMentors((mentorData.mentors || []).map((m: any) => ({ ...m, role: m.role || 'mentor' })));
        setRecords(mentorData.records || []);
        setVolunteerWorks(mentorData.volunteerWorks || []);
      } else {
        throw new Error(mentorData.error || 'Erro ao carregar dados.');
      }

      const memberRes = await fetch(`/api/members?requester=${encodeURIComponent(currentUser)}`);
      const memberData = await memberRes.json();
      if (memberData.success) {
        setMembers(memberData.members.map((m: any) => ({
          username: m.username,
          displayName: m.displayName
        })));
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Person (Mentor/Volunteer) handlers ────────────────────────────────────
  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorName.trim() || !mentorArea.trim()) {
      alert('Nome e Área de Ajuda são obrigatórios.');
      return;
    }
    try {
      const payload = editingMentor
        ? { action: 'editMentor', id: editingMentor.id, name: mentorName, area: mentorArea, organization: mentorOrg, role: mentorRole }
        : { action: 'addMentor', name: mentorName, area: mentorArea, organization: mentorOrg, role: mentorRole };

      const res = await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setPersonModalOpen(false);
      setEditingMentor(null);
      setMentorName(''); setMentorArea(''); setMentorOrg(''); setMentorRole('mentor');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar.');
    }
  };

  const handleDeletePerson = async (id: string) => {
    if (!window.confirm('Tem certeza? Registros vinculados a esta pessoa continuarão no histórico.')) return;
    try {
      await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteMentor', id }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir.');
    }
  };

  const openEditPerson = (m: Mentor) => {
    setEditingMentor(m);
    setMentorName(m.name);
    setMentorArea(m.area);
    setMentorOrg(m.organization || '');
    setMentorRole(m.role || 'mentor');
    setPersonModalOpen(true);
  };

  // ─── Mentorship Record handlers ────────────────────────────────────────────
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
      setRecMentorId(''); setRecDate(''); setRecType('presential');
      setRecLocationType('our_lab'); setRecLocationName('');
      setRecArea(''); setRecParticipants([]); setRecAdvantages('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar registro de mentoria.');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Excluir este registro de mentoria permanentemente?')) return;
    try {
      await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteRecord', id }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

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

  const toggleParticipant = (username: string) => {
    setRecParticipants(prev =>
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };

  // ─── Volunteer Work handlers ───────────────────────────────────────────────
  const handleSaveWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workEventName.trim() || !workDate || workContributions.length === 0) {
      alert('Evento, data e pelo menos um voluntário são obrigatórios.');
      return;
    }
    try {
      const payload = {
        action: editingWork ? 'editVolunteerWork' : 'addVolunteerWork',
        id: editingWork?.id,
        eventName: workEventName,
        location: workLocation,
        date: workDate,
        description: workDescription,
        contributions: workContributions,
      };
      const res = await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setWorkModalOpen(false);
      setEditingWork(null);
      setWorkEventName(''); setWorkLocation(''); setWorkDate('');
      setWorkDescription(''); setWorkContributions([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar trabalho voluntário.');
    }
  };

  const handleDeleteWork = async (id: string) => {
    if (!window.confirm('Excluir este trabalho voluntário permanentemente?')) return;
    try {
      await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteVolunteerWork', id }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditWork = (w: VolunteerWork) => {
    setEditingWork(w);
    setWorkEventName(w.eventName);
    setWorkLocation(w.location);
    setWorkDate(w.date);
    setWorkDescription(w.description);
    setWorkContributions(w.contributions);
    setWorkModalOpen(true);
  };

  const toggleWorkMember = (username: string) => {
    setWorkContributions(prev => {
      if (prev.find(c => c.username === username)) {
        return prev.filter(c => c.username !== username);
      }
      return [...prev, { username, contribution: '' }];
    });
  };

  const updateContribution = (username: string, text: string) => {
    setWorkContributions(prev =>
      prev.map(c => c.username === username ? { ...c, contribution: text } : c)
    );
  };

  // ─── Filters ───────────────────────────────────────────────────────────────
  const filteredMentors = mentors.filter(m =>
    m.name.toLowerCase().includes(mentorSearch.toLowerCase()) ||
    m.area.toLowerCase().includes(mentorSearch.toLowerCase()) ||
    (m.organization && m.organization.toLowerCase().includes(mentorSearch.toLowerCase()))
  );

  const filteredRecords = records.filter(r => {
    const mentor = mentors.find(m => m.id === r.mentorId);
    const mName = mentor ? mentor.name.toLowerCase() : '';
    const q = recordSearch.toLowerCase();
    return r.area.toLowerCase().includes(q) || mName.includes(q) || (r.locationName && r.locationName.toLowerCase().includes(q));
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredWorks = volunteerWorks.filter(w =>
    w.eventName.toLowerCase().includes(workSearch.toLowerCase()) ||
    w.location.toLowerCase().includes(workSearch.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const selectedMentorObj = mentors.find(m => m.id === recMentorId);

  // ─── Mentor-eligible persons (role mentor or both) ─────────────────────────
  const mentorPersons = mentors.filter(m => m.role === 'mentor' || m.role === 'both');

  // ─── Volunteer-eligible persons (role volunteer or both) ───────────────────
  const volunteerPersons = mentors.filter(m => m.role === 'volunteer' || m.role === 'both');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent-primary to-emerald-500 shadow-glow-primary">
              <Users className="w-7 h-7 text-white" />
            </div>
            Mentores & Voluntários
          </h1>
          <p className="text-text-secondary text-sm mt-1.5">
            Gerencie mentores, voluntários e registros de mentorias e trabalhos voluntários.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          {[
            { key: 'records', label: 'Sessões', icon: Calendar },
            { key: 'people', label: 'Pessoas', icon: Users },
            { key: 'volunteer_works', label: 'Trabalhos', icon: Heart },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-accent-primary text-white shadow-glow-primary'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
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
          <p className="text-text-secondary text-sm">Carregando dados...</p>
        </div>
      ) : (
        <div>
          {/* ═══════════════ TAB: SESSIONS ═══════════════ */}
          {activeTab === 'records' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
                    setRecMentorId(''); setRecDate(new Date().toISOString().split('T')[0]);
                    setRecType('presential'); setRecLocationType('our_lab');
                    setRecLocationName(''); setRecArea(''); setRecParticipants([]); setRecAdvantages('');
                    setRecordModalOpen(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary border border-accent-primary/30 text-white font-bold text-sm hover:opacity-90 transition-all shadow-glow-primary shrink-0"
                >
                  <Plus className="w-4 h-4" /> Registrar Mentoria
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
                              <h3 className="text-lg font-bold text-white">{mentor ? mentor.name : 'Mentor Excluído'}</h3>
                              {mentor && <RoleBadge role={mentor.role} />}
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
                            <button onClick={() => openEditRecord(rec)} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-text-secondary transition-all">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteRecord(rec.id)} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-400 text-text-secondary transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-white/5">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Modalidade / Local</span>
                            <div className="flex items-center gap-2 text-sm text-white">
                              {rec.type === 'online' ? (
                                <><Video className="w-4 h-4 text-cyan-400" /><span>Online / Virtual</span></>
                              ) : (
                                <><MapPin className="w-4 h-4 text-emerald-400" />
                                <span>
                                  {rec.locationType === 'our_lab' && 'Nosso Laboratório'}
                                  {rec.locationType === 'visited_them' && `Visitamos: ${rec.locationName || ''}`}
                                  {rec.locationType === 'other' && `Outro: ${rec.locationName || ''}`}
                                </span></>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Área de Foco</span>
                            <p className="text-sm text-white font-medium flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-yellow-400" /> {rec.area}
                            </p>
                          </div>
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

                        {rec.advantages && (
                          <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 text-xs space-y-1">
                            <span className="font-bold text-text-secondary block">Vantagens e Anotações:</span>
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

          {/* ═══════════════ TAB: PEOPLE ═══════════════ */}
          {activeTab === 'people' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    value={mentorSearch}
                    onChange={e => setMentorSearch(e.target.value)}
                    placeholder="Pesquisar por nome, área ou empresa..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/60 placeholder:text-white/20 transition-all"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingMentor(null);
                    setMentorName(''); setMentorArea(''); setMentorOrg(''); setMentorRole('mentor');
                    setPersonModalOpen(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary border border-accent-primary/30 text-white font-bold text-sm hover:opacity-90 transition-all shadow-glow-primary shrink-0"
                >
                  <UserPlus className="w-4 h-4" /> Adicionar Pessoa
                </button>
              </div>

              {filteredMentors.length === 0 ? (
                <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <Users className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-60" />
                  <p className="text-white font-bold">Nenhuma pessoa encontrada</p>
                  <p className="text-text-secondary text-xs mt-1">Adicione um mentor, voluntário ou ambos.</p>
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
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-tertiary/20 flex items-center justify-center text-accent-primary font-bold text-lg border border-accent-primary/20 shrink-0">
                            {m.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-base leading-tight">{m.name}</h3>
                            {m.organization && (
                              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                                <Building className="w-3.5 h-3.5 shrink-0" /> {m.organization}
                              </p>
                            )}
                            <div className="mt-1.5">
                              <RoleBadge role={m.role} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1">
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
                          <button onClick={() => openEditPerson(m)} className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-text-secondary transition-all" title="Editar">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeletePerson(m.id)} className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-400 text-text-secondary transition-all" title="Deletar">
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

          {/* ═══════════════ TAB: VOLUNTEER WORKS ═══════════════ */}
          {activeTab === 'volunteer_works' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    value={workSearch}
                    onChange={e => setWorkSearch(e.target.value)}
                    placeholder="Pesquisar por evento ou local..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/60 placeholder:text-white/20 transition-all"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingWork(null);
                    setWorkEventName(''); setWorkLocation('');
                    setWorkDate(new Date().toISOString().split('T')[0]);
                    setWorkDescription(''); setWorkContributions([]);
                    setWorkModalOpen(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 border border-emerald-500/30 text-white font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0"
                >
                  <Plus className="w-4 h-4" /> Registrar Trabalho Voluntário
                </button>
              </div>

              {filteredWorks.length === 0 ? (
                <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <Heart className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-60" />
                  <p className="text-white font-bold">Nenhum trabalho voluntário encontrado</p>
                  <p className="text-text-secondary text-xs mt-1">Registre o primeiro trabalho voluntário da equipe.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredWorks.map(w => (
                    <motion.div
                      key={w.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/[0.03] border border-emerald-500/10 hover:border-emerald-500/20 rounded-2xl p-5 sm:p-6 transition-all duration-300 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="p-1.5 rounded-lg bg-emerald-500/15">
                              <Heart className="w-4 h-4 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">{w.eventName}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                            {w.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {w.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-accent-primary" />
                              {new Date(w.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditWork(w)} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-text-secondary transition-all">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteWork(w.id)} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-400 text-text-secondary transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {w.description && (
                        <p className="text-sm text-text-secondary leading-relaxed border-t border-white/5 pt-3">{w.description}</p>
                      )}

                      {/* Contributions */}
                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Voluntários & Contribuições</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {w.contributions.map(c => {
                            const volunteer = mentors.find(m => m.id === c.username);
                            return (
                              <div key={c.username} className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 mt-0.5">
                                  {(volunteer?.name || c.username).charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white">{volunteer?.name || c.username}</p>
                                  {c.contribution && (
                                    <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{c.contribution}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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

      {/* ═══════════════ MODAL: ADD / EDIT PERSON ═══════════════ */}
      <AnimatePresence>
        {personModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPersonModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#16192a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-accent-primary" />
                  {editingMentor ? 'Editar Pessoa' : 'Adicionar Pessoa'}
                </h3>
                <button onClick={() => setPersonModalOpen(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePerson} className="space-y-4">
                {/* Role Selector */}
                <div>
                  <label className="text-xs text-text-secondary mb-2 block font-bold">Esta pessoa é... *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'mentor', label: 'Mentor', icon: GraduationCap, color: 'text-accent-primary border-accent-primary bg-accent-primary/10' },
                      { value: 'volunteer', label: 'Voluntário', icon: Heart, color: 'text-emerald-400 border-emerald-500 bg-emerald-500/10' },
                      { value: 'both', label: 'Ambos', icon: Star, color: 'text-amber-400 border-amber-500 bg-amber-500/10' },
                    ].map(opt => {
                      const Icon = opt.icon;
                      const active = mentorRole === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMentorRole(opt.value as any)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                            active ? opt.color : 'border-white/10 text-text-muted hover:text-white bg-white/[0.02]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block font-bold">Nome *</label>
                  <input value={mentorName} onChange={e => setMentorName(e.target.value)}
                    placeholder="Ex: Alexandre Santos" required
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block font-bold">Área de Especialidade / Atuação *</label>
                  <input value={mentorArea} onChange={e => setMentorArea(e.target.value)}
                    placeholder="Ex: Automação / Organização de Eventos" required
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block font-bold">Organização / Instituição (Opcional)</label>
                  <input value={mentorOrg} onChange={e => setMentorOrg(e.target.value)}
                    placeholder="Ex: SENAI, Bosch, UTFPR"
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-bold shadow-glow-primary hover:opacity-95 transition-all">
                    Confirmar
                  </button>
                  <button type="button" onClick={() => setPersonModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-sm hover:text-white transition-all">
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════ MODAL: REGISTER / EDIT MENTORSHIP RECORD ═══════════════ */}
      <AnimatePresence>
        {recordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRecordModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-[#16192a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 z-10 space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent-primary" />
                  {editingRecord ? 'Editar Registro de Mentoria' : 'Registrar Sessão de Mentoria'}
                </h3>
                <button onClick={() => setRecordModalOpen(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRecord} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mentor Selector */}
                  <div className="relative">
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Mentor *</label>
                    <button type="button" onClick={() => setMentorDropdownOpen(v => !v)}
                      className="w-full flex items-center justify-between gap-2 bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white hover:border-white/20 transition-all"
                    >
                      <span className={selectedMentorObj ? 'text-white' : 'text-white/40'}>
                        {selectedMentorObj ? selectedMentorObj.name : 'Selecionar Mentor'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${mentorDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {mentorDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="absolute z-50 top-full mt-1 w-full bg-[#1b1f35] border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-48 custom-scrollbar"
                        >
                          {mentorPersons.length === 0 ? (
                            <div className="p-3 text-xs text-text-muted text-center">Nenhum mentor cadastrado</div>
                          ) : (
                            mentorPersons.filter(m => m.active).map(m => (
                              <button key={m.id} type="button"
                                onClick={() => { setRecMentorId(m.id); setMentorDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${recMentorId === m.id ? 'text-white bg-accent-primary/20 font-bold' : 'text-white/80'}`}
                              >
                                {m.name}
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Data da Mentoria *</label>
                    <input type="date" value={recDate} required onChange={e => setRecDate(e.target.value)}
                      className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/60 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Modality */}
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Modalidade *</label>
                    <div className="flex bg-[#1b1f35] p-1 rounded-xl border border-white/10">
                      {[{ v: 'presential', label: 'Presencial', Icon: MapPin }, { v: 'online', label: 'Online', Icon: Video }].map(({ v, label, Icon }) => (
                        <button key={v} type="button" onClick={() => setRecType(v as any)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${recType === v ? 'bg-accent-primary text-white shadow-glow-primary' : 'text-text-secondary hover:text-white'}`}
                        >
                          <Icon className="w-3.5 h-3.5" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Area */}
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Área Específica *</label>
                    <input value={recArea} onChange={e => setRecArea(e.target.value)}
                      placeholder="Ex: Programação de Odometria" required
                      className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all"
                    />
                  </div>
                </div>

                {/* Location for presential */}
                <AnimatePresence>
                  {recType === 'presential' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-3">
                      <div>
                        <label className="text-xs text-text-secondary mb-1.5 block font-bold">Local Presencial</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'our_lab', label: '🏫 Nosso Laboratório' },
                            { value: 'visited_them', label: '🚗 Visitamos o Mentor' },
                            { value: 'other', label: '📌 Outro' }
                          ].map(opt => (
                            <button key={opt.value} type="button" onClick={() => setRecLocationType(opt.value as any)}
                              className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${recLocationType === opt.value ? 'bg-accent-primary/10 border-accent-primary text-accent-primary' : 'bg-[#1b1f35] border-white/5 text-text-secondary hover:text-white'}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {recLocationType !== 'our_lab' && (
                        <input value={recLocationName} onChange={e => setRecLocationName(e.target.value)}
                          placeholder={recLocationType === 'visited_them' ? 'Ex: UTFPR Bloco G' : 'Ex: Faculdade X'}
                          required
                          className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/60 transition-all"
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Participants */}
                <div className="space-y-1.5">
                  <label className="text-xs text-text-secondary block font-bold">Membros Participantes *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-[#1b1f35] rounded-xl border border-white/10 custom-scrollbar">
                    {members.map(m => {
                      const selected = recParticipants.includes(m.username);
                      return (
                        <button key={m.username} type="button" onClick={() => toggleParticipant(m.username)}
                          className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${selected ? 'bg-accent-primary/10 border-accent-primary text-accent-primary' : 'bg-white/[0.02] border-transparent hover:bg-white/5 text-text-secondary'}`}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${selected ? 'bg-accent-primary border-accent-primary' : 'border-white/20'}`}>
                            {selected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-xs font-medium truncate">{m.displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block font-bold">Vantagens Obtidas / Notas</label>
                  <textarea value={recAdvantages} onChange={e => setRecAdvantages(e.target.value)}
                    placeholder="Quais ganhos e aprendizados a equipe obteve?"
                    rows={3}
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-bold shadow-glow-primary hover:opacity-95 transition-all">
                    Confirmar Registro
                  </button>
                  <button type="button" onClick={() => setRecordModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-sm hover:text-white transition-all">
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════ MODAL: VOLUNTEER WORK ═══════════════ */}
      <AnimatePresence>
        {workModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setWorkModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-[#16192a] border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden p-6 z-10 space-y-5 my-8"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-emerald-400" />
                  {editingWork ? 'Editar Trabalho Voluntário' : 'Registrar Trabalho Voluntário'}
                </h3>
                <button onClick={() => setWorkModalOpen(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveWork} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Nome do Evento *</label>
                    <input value={workEventName} onChange={e => setWorkEventName(e.target.value)}
                      placeholder="Ex: Feira de Ciências Municipal" required
                      className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Local / Onde foi</label>
                    <input value={workLocation} onChange={e => setWorkLocation(e.target.value)}
                      placeholder="Ex: Ginásio Municipal, SESI Blumenau"
                      className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/60 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block font-bold">Data *</label>
                  <input type="date" value={workDate} required onChange={e => setWorkDate(e.target.value)}
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1.5 block font-bold">Descrição Geral do Trabalho</label>
                  <textarea value={workDescription} onChange={e => setWorkDescription(e.target.value)}
                    placeholder="Descreva brevemente o que a equipe fez neste evento..."
                    rows={2}
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/60 transition-all resize-none"
                  />
                </div>

                {/* Volunteers selection + individual contributions */}
                <div className="space-y-3">
                  <label className="text-xs text-text-secondary block font-bold">Voluntários Participantes *</label>
                  <p className="text-[10px] text-text-muted -mt-2">Selecione os membros e descreva o que cada um fez.</p>

                  {/* Volunteer checklist */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-[#1b1f35] rounded-xl border border-white/10 custom-scrollbar">
                    {volunteerPersons.length === 0 ? (
                      <div className="p-3 text-xs text-text-muted text-center col-span-full">Nenhum voluntário cadastrado</div>
                    ) : (
                      volunteerPersons.map(m => {
                        const selected = !!workContributions.find(c => c.username === m.id);
                        return (
                          <button key={m.id} type="button" onClick={() => toggleWorkMember(m.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${selected ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/[0.02] border-transparent hover:bg-white/5 text-text-secondary'}`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                              {selected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="text-xs font-medium truncate">{m.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Individual contribution fields */}
                  {workContributions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">O que cada voluntário fez:</p>
                      {workContributions.map(c => {
                        const volunteer = volunteerPersons.find(m => m.id === c.username);
                        return (
                          <div key={c.username} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                              {(volunteer?.name || c.username).charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-white w-24 shrink-0 truncate">{volunteer?.name || c.username}</span>
                            <input
                              value={c.contribution}
                              onChange={e => updateContribution(c.username, e.target.value)}
                              placeholder="O que esta pessoa fez..."
                              className="flex-1 bg-[#1b1f35] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold hover:opacity-95 transition-all">
                    Confirmar Registro
                  </button>
                  <button type="button" onClick={() => setWorkModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-sm hover:text-white transition-all">
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
