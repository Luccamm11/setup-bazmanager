import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, GraduationCap, Calendar, MapPin, Video, Award, 
  Trash2, Edit, Check, X, ChevronDown, Plus, Search, Building, 
  AlertTriangle, RefreshCw, Clock, ArrowRight, UserCheck, Heart,
  Star, FileText, ChevronRight, Link2, Image, Sparkles
} from 'lucide-react';
import { Mentor, MentorshipRecord, VolunteerWork, VolunteerContribution, UserRole, ActivityEvaluation } from '../types';
import ActivityEvaluationModal from './ActivityEvaluationModal';

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

  const isTech = userRole === 'technician' || ['Jonas', 'Ramon'].includes(currentUser);

  // State
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [records, setRecords] = useState<MentorshipRecord[]>([]);
  const [volunteerWorks, setVolunteerWorks] = useState<VolunteerWork[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evaluation modal
  const [evaluatingRecord, setEvaluatingRecord] = useState<MentorshipRecord | null>(null);

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
  const [recMentorName, setRecMentorName] = useState('');
  const [recDate, setRecDate] = useState('');
  const [recWorkloadHours, setRecWorkloadHours] = useState<number | ''>(2);
  const [recArea, setRecArea] = useState('');
  const [recParticipants, setRecParticipants] = useState<string[]>([]);
  const [recObjectives, setRecObjectives] = useState('');
  const [recSolutions, setRecSolutions] = useState('');
  const [recNextSteps, setRecNextSteps] = useState('');
  const [recImageLinks, setRecImageLinks] = useState<string[]>([]);
  const [mentorDropdownOpen, setMentorDropdownOpen] = useState(false);

  // ─── Volunteer Work modal ──────────────────────────────────────────────────
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<VolunteerWork | null>(null);
  const [workEventName, setWorkEventName] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [workDate, setWorkDate] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  // contributions: list of { username, contribution, durationHours }
  const [workContributions, setWorkContributions] = useState<VolunteerContribution[]>([]);
  const [workImageLinks, setWorkImageLinks] = useState<string[]>([]);

  // Hover states for pie charts
  const [hoveredPieIndex, setHoveredPieIndex] = useState<{ chart: 'mentor' | 'volunteer'; index: number } | null>(null);

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
    const resolvedMentor = mentors.find(m => m.id === recMentorId);
    const resolvedName = recMentorName.trim() || (resolvedMentor ? resolvedMentor.name : '');
    
    if (!resolvedName || !recDate || recParticipants.length === 0 || !recObjectives.trim() || !recSolutions.trim() || !recNextSteps.trim()) {
      alert('Preencha todos os campos do formulário B-Leed (Mentor, Data, Participantes, Objetivos, Soluções e Próximos Passos).');
      return;
    }
    try {
      const payload = {
        action: editingRecord ? 'editRecord' : 'addRecord',
        id: editingRecord?.id,
        mentorId: recMentorId || undefined,
        mentorName: resolvedName,
        date: recDate,
        workloadHours: Number(recWorkloadHours) || 2,
        area: recArea || resolvedMentor?.area || 'Geral',
        participants: recParticipants,
        objectives: recObjectives.trim(),
        solutions: recSolutions.trim(),
        nextSteps: recNextSteps.trim(),
        imageLinks: recImageLinks,
        createdBy: currentUser,
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
      setRecMentorId(''); setRecMentorName(''); setRecDate('');
      setRecWorkloadHours(2); setRecArea(''); setRecParticipants([]);
      setRecObjectives(''); setRecSolutions(''); setRecNextSteps('');
      setRecImageLinks([]);
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

  const handleSaveEvaluation = async (evaluation: ActivityEvaluation) => {
    if (!evaluatingRecord) return;
    const res = await fetch('/api/mentors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evaluateRecord',
        username: currentUser,
        recordId: evaluatingRecord.id,
        evaluation,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setRecords(prev => prev.map(r => r.id === evaluatingRecord.id ? { ...r, evaluation: data.evaluation } : r));
      setEvaluatingRecord(null);
    } else {
      throw new Error(data.error || 'Falha ao salvar avaliação.');
    }
  };

  const openEditRecord = (rec: MentorshipRecord) => {
    setEditingRecord(rec);
    setRecMentorId(rec.mentorId || '');
    setRecMentorName(rec.mentorName || '');
    setRecDate(rec.date);
    setRecWorkloadHours(rec.workloadHours || 2);
    setRecArea(rec.area || '');
    setRecParticipants(rec.participants || []);
    setRecObjectives(rec.objectives || '');
    setRecSolutions(rec.solutions || '');
    setRecNextSteps(rec.nextSteps || '');
    setRecImageLinks(rec.imageLinks || []);
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
        imageLinks: workImageLinks,
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
      setWorkImageLinks([]);
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

  const toggleWorkMember = (id: string) => {
    setWorkContributions(prev => {
      if (prev.find(c => c.username === id)) {
        return prev.filter(c => c.username !== id);
      }
      return [...prev, { username: id, contribution: '', durationHours: 1 }];
    });
  };

  const updateContribution = (username: string, text: string) => {
    setWorkContributions(prev =>
      prev.map(c => c.username === username ? { ...c, contribution: text } : c)
    );
  };

  const updateDurationHours = (username: string, value: number) => {
    setWorkContributions(prev =>
      prev.map(c => c.username === username ? { ...c, durationHours: value } : c)
    );
  };

  const openEditWork = (w: VolunteerWork) => {
    setEditingWork(w);
    setWorkEventName(w.eventName);
    setWorkLocation(w.location);
    setWorkDate(w.date);
    setWorkDescription(w.description);
    setWorkContributions(w.contributions);
    setWorkImageLinks(w.imageLinks || []);
    setWorkModalOpen(true);
  };


  // ─── Filters ───────────────────────────────────────────────────────────────
  const filteredMentors = mentors.filter(m =>
    m.name.toLowerCase().includes(mentorSearch.toLowerCase()) ||
    m.area.toLowerCase().includes(mentorSearch.toLowerCase()) ||
    (m.organization && m.organization.toLowerCase().includes(mentorSearch.toLowerCase()))
  );

  const filteredRecords = records.filter(r => {
    const mentor = mentors.find(m => m.id === r.mentorId);
    const mName = (r.mentorName || mentor?.name || '').toLowerCase();
    const q = recordSearch.toLowerCase();
    return (
      mName.includes(q) ||
      (r.objectives && r.objectives.toLowerCase().includes(q)) ||
      (r.solutions && r.solutions.toLowerCase().includes(q)) ||
      (r.nextSteps && r.nextSteps.toLowerCase().includes(q)) ||
      (r.area && r.area.toLowerCase().includes(q))
    );
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
            Gerencie mentores, voluntários e formulários oficiais de mentorias e ações da equipe.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0 flex-wrap">
          {[
            { key: 'records', label: 'Mentorias (B-Leed)', icon: Calendar },
            { key: 'people', label: 'Mentores Cadastrados', icon: Users },
            { key: 'volunteer_works', label: 'Trabalhos Voluntários', icon: Heart },
            { key: 'statistics', label: 'Estatísticas', icon: Star },
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
          {/* ═══════════════ TAB: SESSIONS (MENTORIAS B-LEED) ═══════════════ */}
          {activeTab === 'records' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    value={recordSearch}
                    onChange={e => setRecordSearch(e.target.value)}
                    placeholder="Pesquisar por mentor, objetivos ou soluções..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/60 placeholder:text-white/20 transition-all"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingRecord(null);
                    setRecMentorId(''); setRecMentorName(''); setRecDate(new Date().toISOString().split('T')[0]);
                    setRecWorkloadHours(2); setRecArea(''); setRecParticipants([]);
                    setRecObjectives(''); setRecSolutions(''); setRecNextSteps('');
                    setRecImageLinks([]);
                    setRecordModalOpen(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary border border-accent-primary/30 text-white font-bold text-sm hover:opacity-90 transition-all shadow-glow-primary shrink-0"
                >
                  <Plus className="w-4 h-4" /> Registrar Mentoria Estratégica
                </button>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <Calendar className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-60" />
                  <p className="text-white font-bold">Nenhuma mentoria encontrada</p>
                  <p className="text-text-secondary text-xs mt-1">Registre uma mentoria ou faça um scan da folha B-Leed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {filteredRecords.map(rec => {
                    const mentor = mentors.find(m => m.id === rec.mentorId);
                    const displayName = rec.mentorName || mentor?.name || 'Mentor Convidado';
                    const workload = rec.workloadHours || 2;

                    return (
                      <motion.div
                        key={rec.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-5 sm:p-6 transition-all duration-300 space-y-4"
                      >
                        {/* Header do Card B-Leed */}
                        <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-white/5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black uppercase tracking-wider">
                                B - LEED • Mentorias Estratégicas
                              </span>
                              <h3 className="text-lg font-black text-white">{displayName}</h3>
                              {mentor && <RoleBadge role={mentor.role} />}
                              {mentor?.organization && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/10">
                                  {mentor.organization}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap mt-1">
                              <span className="flex items-center gap-1.5 font-medium text-white/80">
                                <Calendar className="w-3.5 h-3.5 text-accent-primary" />
                                {new Date(rec.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] bg-accent-primary/15 text-accent-primary border border-accent-primary/25 px-2.5 py-0.5 rounded-full font-bold">
                                <Clock className="w-3 h-3" /> {workload}h Carga Horária
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Botão Avaliar / Status de Avaliação */}
                            {rec.evaluation ? (
                              <button
                                onClick={() => setEvaluatingRecord(rec)}
                                className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
                                title="Ver ou Editar Avaliação"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>+{(Object.values(rec.evaluation.memberScores) as { totalXp?: number }[]).reduce((s, m) => s + (m.totalXp || 0), 0)} XP</span>
                                {isTech && <span className="text-[10px] font-bold text-white/60 hover:text-white ml-0.5">• Avaliar</span>}
                              </button>
                            ) : isTech ? (
                              <button
                                onClick={() => setEvaluatingRecord(rec)}
                                className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/40 px-3 py-1.5 rounded-lg border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer shadow-sm animate-pulse"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                Avaliar
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-1 rounded border border-white/10">
                                Pendente Avaliação
                              </span>
                            )}

                            <button onClick={() => openEditRecord(rec)} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-text-secondary transition-all" title="Editar">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteRecord(rec.id)} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:text-red-400 text-text-secondary transition-all" title="Excluir">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Membros Participantes */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Membros Participantes</span>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.participants && rec.participants.map(username => {
                              const mbr = members.find(m => m.username === username);
                              return (
                                <span key={username} className="text-[11px] px-2.5 py-0.5 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-medium">
                                  {mbr ? mbr.displayName : username}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3 Blocos Oficiais B-Leed */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                          <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                            <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider block">
                              🎯 Objetivos da Mentoria:
                            </span>
                            <p className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap">
                              {rec.objectives || 'Não especificado.'}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block">
                              💡 Soluções Encontradas:
                            </span>
                            <p className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap">
                              {rec.solutions || 'Não especificado.'}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                            <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">
                              🚀 Próximos Passos:
                            </span>
                            <p className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap">
                              {rec.nextSteps || 'Não especificado.'}
                            </p>
                          </div>
                        </div>

                        {rec.imageLinks && rec.imageLinks.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-white/5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
                              <Image className="w-3 h-3" /> Evidências / Fotos Anexadas
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {rec.imageLinks.map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative group w-14 h-14 rounded-xl overflow-hidden border border-white/10 hover:border-accent-primary transition-all block shrink-0"
                                >
                                  <img src={link} alt={`img-${idx + 1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Link2 className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </a>
                              ))}
                            </div>
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

                      {w.imageLinks && w.imageLinks.length > 0 && (
                        <div className="space-y-1.5 border-t border-white/5 pt-3">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
                            <Image className="w-3 h-3" /> Imagens / Evidências
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {w.imageLinks.map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative group w-14 h-14 rounded-xl overflow-hidden border border-emerald-500/20 hover:border-emerald-500/50 transition-all block shrink-0"
                              >
                                <img src={link} alt={`img-${idx + 1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Link2 className="w-3.5 h-3.5 text-white" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contributions */}
                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Voluntários & Contribuições</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {w.contributions.map(c => {
                            const volunteer = mentors.find(m => m.id === c.username);
                            return (
                              <div key={c.username} className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 justify-between">
                                <div className="flex gap-2 min-w-0">
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
                                {c.durationHours && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25 shrink-0 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> {c.durationHours}h
                                  </span>
                                )}
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

          {/* ═══════════════ TAB: STATISTICS ═══════════════ */}
          {activeTab === 'statistics' && (() => {
            // Colors for slices
            const COLORS = [
              '#58A6FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
              '#EC4899', '#06B6D4', '#F43F5E', '#14B8A6', '#84CC16'
            ];

            // 1. Mentorship statistics (aggr by mentor name/id)
            const mentorStats = mentors.filter(m => m.role === 'mentor' || m.role === 'both').map(m => {
              const hours = records
                .filter(r => r.mentorId === m.id || (r.mentorName && r.mentorName.toLowerCase() === m.name.toLowerCase()))
                .reduce((acc, curr) => acc + (curr.workloadHours || (curr.durationMinutes ? curr.durationMinutes / 60 : 2)), 0);
              return { name: m.name, hours, id: m.id };
            }).filter(item => item.hours > 0).sort((a, b) => b.hours - a.hours);

            const totalMentorHours = mentorStats.reduce((acc, curr) => acc + curr.hours, 0);

            // 2. Volunteer statistics (aggr by volunteer id)
            const volunteerStats = volunteerPersons.map(v => {
              let hours = 0;
              volunteerWorks.forEach(w => {
                const c = w.contributions.find(cObj => cObj.username === v.id);
                if (c) hours += (c.durationHours || 0);
              });
              return { name: v.name, hours, id: v.id };
            }).filter(item => item.hours > 0).sort((a, b) => b.hours - a.hours);

            const totalVolunteerHours = volunteerStats.reduce((acc, curr) => acc + curr.hours, 0);

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Mentorship Chart */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-6">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <GraduationCap className="text-accent-primary w-5 h-5" /> Mentoria (Carga Horária Total)
                  </h3>
                  {totalMentorHours === 0 ? (
                    <div className="text-center py-16 text-text-secondary italic">Nenhum dado de mentoria registrado.</div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                      <div className="relative w-40 h-40">
                        <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                          {(() => {
                            let currentOffset = 0;
                            return mentorStats.map((item, idx) => {
                              const pct = (item.hours / totalMentorHours) * 100;
                              const color = COLORS[idx % COLORS.length];
                              const strokeDash = `${pct} ${100 - pct}`;
                              const strokeOffset = 100 - currentOffset + 25;
                              currentOffset += pct;
                              const isHovered = hoveredPieIndex?.chart === 'mentor' && hoveredPieIndex.index === idx;

                              return (
                                <circle
                                  key={item.id}
                                  cx="21" cy="21" r="15.91549430918954"
                                  fill="transparent"
                                  stroke={color}
                                  strokeWidth={isHovered ? 4.5 : 3.5}
                                  strokeDasharray={strokeDash}
                                  strokeDashoffset={strokeOffset}
                                  className="transition-all duration-200 cursor-pointer"
                                  onMouseEnter={() => setHoveredPieIndex({ chart: 'mentor', index: idx })}
                                  onMouseLeave={() => setHoveredPieIndex(null)}
                                />
                              );
                            });
                          })()}
                        </svg>
                        {hoveredPieIndex?.chart === 'mentor' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#16192a]/95 rounded-full p-2 border border-white/5 text-center pointer-events-none">
                            <span className="text-[10px] font-bold text-accent-primary uppercase truncate max-w-full">
                              {mentorStats[hoveredPieIndex.index].name}
                            </span>
                            <span className="text-xs font-black text-white">
                              {mentorStats[hoveredPieIndex.index].hours}h
                            </span>
                            <span className="text-[9px] text-text-muted">
                              {((mentorStats[hoveredPieIndex.index].hours / totalMentorHours) * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 flex-1 w-full">
                        {mentorStats.map((item, idx) => {
                          const color = COLORS[idx % COLORS.length];
                          const isHovered = hoveredPieIndex?.chart === 'mentor' && hoveredPieIndex.index === idx;
                          return (
                            <div 
                              key={item.id} 
                              className={`flex items-center gap-2 p-1.5 rounded-lg transition-all ${isHovered ? 'bg-white/5 scale-[1.02]' : ''}`}
                              onMouseEnter={() => setHoveredPieIndex({ chart: 'mentor', index: idx })}
                              onMouseLeave={() => setHoveredPieIndex(null)}
                            >
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-xs text-text-secondary truncate max-w-[120px] font-medium" title={item.name}>{item.name}</span>
                              <span className="text-xs font-bold text-white ml-auto">{item.hours}h ({((item.hours / totalMentorHours) * 100).toFixed(0)}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Volunteer Chart */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-6">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Heart className="text-emerald-400 w-5 h-5" /> Trabalho Voluntário (Horas Totais)
                  </h3>
                  {totalVolunteerHours === 0 ? (
                    <div className="text-center py-16 text-text-secondary italic">Nenhum trabalho voluntário com duração registrada.</div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                      <div className="relative w-40 h-40">
                        <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                          {(() => {
                            let currentOffset = 0;
                            return volunteerStats.map((item, idx) => {
                              const pct = (item.hours / totalVolunteerHours) * 100;
                              const color = COLORS[idx % COLORS.length];
                              const strokeDash = `${pct} ${100 - pct}`;
                              const strokeOffset = 100 - currentOffset + 25;
                              currentOffset += pct;
                              const isHovered = hoveredPieIndex?.chart === 'volunteer' && hoveredPieIndex.index === idx;

                              return (
                                <circle
                                  key={item.id}
                                  cx="21" cy="21" r="15.91549430918954"
                                  fill="transparent"
                                  stroke={color}
                                  strokeWidth={isHovered ? 4.5 : 3.5}
                                  strokeDasharray={strokeDash}
                                  strokeDashoffset={strokeOffset}
                                  className="transition-all duration-200 cursor-pointer"
                                  onMouseEnter={() => setHoveredPieIndex({ chart: 'volunteer', index: idx })}
                                  onMouseLeave={() => setHoveredPieIndex(null)}
                                />
                              );
                            });
                          })()}
                        </svg>
                        {hoveredPieIndex?.chart === 'volunteer' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#16192a]/95 rounded-full p-2 border border-white/5 text-center pointer-events-none">
                            <span className="text-[10px] font-bold text-emerald-400 truncate max-w-full uppercase">
                              {volunteerStats[hoveredPieIndex.index].name}
                            </span>
                            <span className="text-xs font-black text-white">
                              {volunteerStats[hoveredPieIndex.index].hours}h
                            </span>
                            <span className="text-[9px] text-text-muted">
                              {((volunteerStats[hoveredPieIndex.index].hours / totalVolunteerHours) * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 flex-1 w-full">
                        {volunteerStats.map((item, idx) => {
                          const color = COLORS[idx % COLORS.length];
                          const isHovered = hoveredPieIndex?.chart === 'volunteer' && hoveredPieIndex.index === idx;
                          return (
                            <div 
                              key={item.id} 
                              className={`flex items-center gap-2 p-1.5 rounded-lg transition-all ${isHovered ? 'bg-white/5 scale-[1.02]' : ''}`}
                              onMouseEnter={() => setHoveredPieIndex({ chart: 'volunteer', index: idx })}
                              onMouseLeave={() => setHoveredPieIndex(null)}
                            >
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-xs text-text-secondary truncate max-w-[120px] font-medium" title={item.name}>{item.name}</span>
                              <span className="text-xs font-bold text-white ml-auto">{item.hours}h ({((item.hours / totalVolunteerHours) * 100).toFixed(0)}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
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
                  {editingRecord ? 'Editar Mentoria Estratégica (B-Leed)' : 'Registrar Mentoria Estratégica (B-Leed)'}
                </h3>
                <button onClick={() => setRecordModalOpen(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRecord} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Mentor Selector / Name */}
                  <div className="sm:col-span-2 relative">
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Mentor Convidado *</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          value={recMentorName}
                          onChange={e => {
                            setRecMentorName(e.target.value);
                            const found = mentors.find(m => m.name.toLowerCase() === e.target.value.trim().toLowerCase());
                            setRecMentorId(found ? found.id : '');
                          }}
                          placeholder="Digite ou selecione o nome do mentor..."
                          required
                          className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/60 transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setMentorDropdownOpen(v => !v)}
                        className="px-3 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white text-xs font-bold flex items-center gap-1 shrink-0"
                        title="Ver lista de mentores cadastrados"
                      >
                        <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${mentorDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {mentorDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute z-50 top-full mt-1 w-full bg-[#1b1f35] border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-48 custom-scrollbar"
                        >
                          {mentorPersons.length === 0 ? (
                            <div className="p-3 text-xs text-text-muted text-center">Nenhum mentor cadastrado</div>
                          ) : (
                            mentorPersons.filter(m => m.active).map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setRecMentorId(m.id);
                                  setRecMentorName(m.name);
                                  if (m.area && !recArea) setRecArea(m.area);
                                  setMentorDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${recMentorId === m.id ? 'text-white bg-accent-primary/20 font-bold' : 'text-white/80'}`}
                              >
                                {m.name} {m.organization ? `(${m.organization})` : ''}
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Carga Horária */}
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Carga Horária (h) *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={recWorkloadHours}
                      required
                      onChange={e => setRecWorkloadHours(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ex: 2"
                      className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/60 transition-all placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date */}
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Data *</label>
                    <input
                      type="date"
                      value={recDate}
                      required
                      onChange={e => setRecDate(e.target.value)}
                      className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/60 transition-all"
                    />
                  </div>

                  {/* Area / Especialidade */}
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block font-bold">Área / Especialidade</label>
                    <input
                      value={recArea}
                      onChange={e => setRecArea(e.target.value)}
                      placeholder="Ex: Mecânica, Programação, Portfólio"
                      className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all"
                    />
                  </div>
                </div>

                {/* Participants */}
                <div className="space-y-1.5">
                  <label className="text-xs text-text-secondary block font-bold">Membros Participantes *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-[#1b1f35] rounded-xl border border-white/10 custom-scrollbar">
                    {members.map(m => {
                      const selected = recParticipants.includes(m.username);
                      return (
                        <button
                          key={m.username}
                          type="button"
                          onClick={() => toggleParticipant(m.username)}
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

                {/* 3 Blocos B-Leed */}
                <div>
                  <label className="text-xs text-blue-400 mb-1.5 block font-bold uppercase tracking-wider">
                    🎯 Objetivos da Mentoria *
                  </label>
                  <textarea
                    value={recObjectives}
                    required
                    onChange={e => setRecObjectives(e.target.value)}
                    placeholder="Quais eram os objetivos desta sessão de mentoria?"
                    rows={2}
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-emerald-400 mb-1.5 block font-bold uppercase tracking-wider">
                    💡 Soluções Encontradas *
                  </label>
                  <textarea
                    value={recSolutions}
                    required
                    onChange={e => setRecSolutions(e.target.value)}
                    placeholder="Quais soluções, técnicas ou orientações foram desenvolvidas?"
                    rows={2}
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-amber-400 mb-1.5 block font-bold uppercase tracking-wider">
                    🚀 Próximos Passos *
                  </label>
                  <textarea
                    value={recNextSteps}
                    required
                    onChange={e => setRecNextSteps(e.target.value)}
                    placeholder="Quais os próximos passos definidos para a equipe aplicar?"
                    rows={2}
                    className="w-full bg-[#1b1f35] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-primary/60 transition-all resize-none"
                  />
                </div>

                {/* Image Links - Mentoria */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary font-bold flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5" /> Links de Imagens / Evidências (Opcional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setRecImageLinks(prev => [...prev, ''])}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-accent-primary/10 border border-accent-primary/25 text-accent-primary font-bold hover:bg-accent-primary/20 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recImageLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={link}
                          onChange={e => {
                            const updated = [...recImageLinks];
                            updated[idx] = e.target.value;
                            setRecImageLinks(updated);
                          }}
                          placeholder="https://drive.google.com/..."
                          className="flex-1 bg-[#1b1f35] border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-accent-primary/60 transition-all placeholder:text-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => setRecImageLinks(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-bold shadow-glow-primary hover:opacity-95 transition-all">
                    Confirmar Registro B-Leed
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
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={c.durationHours || ''}
                                required
                                onChange={e => updateDurationHours(c.username, e.target.value ? Number(e.target.value) : 0)}
                                placeholder="Horas"
                                className="w-16 bg-[#1b1f35] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all text-center font-bold"
                              />
                              <span className="text-[10px] text-text-muted">h</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Image Links - Trabalho Voluntário */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary font-bold flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5" /> Links de Imagens / Evidências
                    </label>
                    <button
                      type="button"
                      onClick={() => setWorkImageLinks(prev => [...prev, ''])}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>
                  {workImageLinks.length === 0 && (
                    <p className="text-[11px] text-text-muted italic">Nenhum link adicionado ainda.</p>
                  )}
                  <div className="space-y-2">
                    {workImageLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#1b1f35] border border-white/10 overflow-hidden">
                          {link && link.startsWith('http') ? (
                            <img src={link} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Link2 className="w-3 h-3 text-text-muted" />
                            </div>
                          )}
                        </div>
                        <input
                          type="url"
                          value={link}
                          onChange={e => {
                            const updated = [...workImageLinks];
                            updated[idx] = e.target.value;
                            setWorkImageLinks(updated);
                          }}
                          placeholder="https://drive.google.com/..."
                          className="flex-1 bg-[#1b1f35] border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-emerald-500/60 transition-all placeholder:text-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => setWorkImageLinks(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
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

      {/* ─── Modal de Avaliação de Habilidades & XP ─── */}
      {evaluatingRecord && (
        <ActivityEvaluationModal
          isOpen={!!evaluatingRecord}
          onClose={() => setEvaluatingRecord(null)}
          activityId={evaluatingRecord.id}
          activityTitle={`Mentoria com ${mentors.find(m => m.id === evaluatingRecord.mentorId)?.name || 'Mentor'} (${evaluatingRecord.area})`}
          activityType="mentorship"
          activityDate={evaluatingRecord.date}
          workloadOrDuration={evaluatingRecord.durationMinutes ? `${evaluatingRecord.durationMinutes} min` : undefined}
          participants={evaluatingRecord.participants}
          initialEvaluation={evaluatingRecord.evaluation}
          userRole={userRole}
          currentUser={currentUser}
          onSaveEvaluation={handleSaveEvaluation}
        />
      )}
    </div>
  );
}
