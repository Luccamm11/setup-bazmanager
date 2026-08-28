import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, Search, BookOpen, Users, Clock,
  Calendar, ExternalLink, Award, FileText, AlertCircle,
  Trash2, Edit3, Eye, Copy, Check, X, UserCheck, Sparkles
} from 'lucide-react';
import { FormRecord, AutonomousDevForm, CollectiveEvolutionForm, FormType, UserRole, ActivityEvaluation } from '../../types';
import ActivityEvaluationModal from '../ActivityEvaluationModal';

// ─── Classe de input reutilizável (padrão do projeto) ────────────────────────
const INPUT_CLS = 'w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 text-sm transition-all';
const TEXTAREA_CLS = 'w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 text-sm transition-all resize-none';
const LABEL_CLS = 'block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5';

interface FormsTabProps {
  currentUser: string;
  userRole: UserRole;
}

export default function FormsTab({ currentUser, userRole }: FormsTabProps) {
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMembers, setAvailableMembers] = useState<string[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | FormType>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  // Modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<FormRecord | null>(null);
  const [detailForm, setDetailForm] = useState<FormRecord | null>(null);
  const [evaluatingForm, setEvaluatingForm] = useState<FormRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formType, setFormType] = useState<FormType>('autonomous_dev');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formWorkload, setFormWorkload] = useState<number | string>(2);
  const [formParticipants, setFormParticipants] = useState<string[]>([]);

  // Desenvolvimento Autônomo
  const [formCourseName, setFormCourseName] = useState('');
  const [formCourseUrl, setFormCourseUrl] = useState('');
  const [formCertificateUrl, setFormCertificateUrl] = useState('');
  const [formCourseObjectives, setFormCourseObjectives] = useState('');
  const [formCourseSyllabus, setFormCourseSyllabus] = useState('');
  const [formKeyLearnings, setFormKeyLearnings] = useState('');

  // Evolução Coletiva
  const [formInvitedTeam, setFormInvitedTeam] = useState('');
  const [formMeetingObjectives, setFormMeetingObjectives] = useState('');
  const [formSolutionsFound, setFormSolutionsFound] = useState('');
  const [formNextSteps, setFormNextSteps] = useState('');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isTech = userRole === 'technician' || ['Jonas', 'Ramon'].includes(currentUser);

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  const fetchForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forms');
      const data = await res.json();
      if (data.success) {
        setForms(data.forms || []);
      } else {
        throw new Error(data.error || 'Erro ao buscar formulários.');
      }

      const memRes = await fetch(`/api/members?requester=${encodeURIComponent(currentUser)}`);
      const memData = await memRes.json();
      if (memData.success && Array.isArray(memData.members)) {
        setAvailableMembers(memData.members.map((m: any) => m.username || m.name));
      } else {
        setAvailableMembers(['Jonas', 'Ramon', 'Lucca', 'Clarice', 'Ana Clara', 'Bernardo', 'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende', 'Sara Galdino']);
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchForms(); }, [fetchForms]);

  // ─── Reset ─────────────────────────────────────────────────────────────────
  const resetFormState = () => {
    setFormType('autonomous_dev');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormWorkload(2);
    setFormParticipants(currentUser ? [currentUser] : []);
    setFormCourseName(''); setFormCourseUrl(''); setFormCertificateUrl('');
    setFormCourseObjectives(''); setFormCourseSyllabus(''); setFormKeyLearnings('');
    setFormInvitedTeam(''); setFormMeetingObjectives(''); setFormSolutionsFound(''); setFormNextSteps('');
    setFormError(null); setEditingForm(null);
  };

  const openCreateModal = () => { resetFormState(); setCreateModalOpen(true); };

  const handleSaveEvaluation = async (evaluation: ActivityEvaluation) => {
    if (!evaluatingForm) return;
    const res = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evaluateForm',
        username: currentUser,
        formId: evaluatingForm.id,
        evaluation,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setForms(prev => prev.map(f => f.id === evaluatingForm.id ? { ...f, evaluation: data.evaluation } : f));
      setEvaluatingForm(null);
    } else {
      throw new Error(data.error || 'Falha ao salvar avaliação.');
    }
  };

  const openEditModal = (item: FormRecord) => {
    setEditingForm(item);
    setFormType(item.type);
    setFormDate(item.date);
    setFormWorkload(item.workloadHours);
    setFormParticipants(item.participants);
    setFormError(null);
    if (item.type === 'autonomous_dev') {
      setFormCourseName(item.courseName);
      setFormCourseUrl(item.courseUrl || '');
      setFormCertificateUrl(item.certificateUrl || '');
      setFormCourseObjectives(item.courseObjectives);
      setFormCourseSyllabus(item.courseSyllabus);
      setFormKeyLearnings(item.keyLearnings);
    } else {
      setFormInvitedTeam(item.invitedTeam);
      setFormMeetingObjectives(item.meetingObjectives);
      setFormSolutionsFound(item.solutionsFound);
      setFormNextSteps(item.nextSteps);
    }
    setCreateModalOpen(true);
  };

  const toggleParticipant = (member: string) => {
    setFormParticipants(prev =>
      prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member]
    );
  };

  // ─── Salvar ─────────────────────────────────────────────────────────────────
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formDate) { setFormError('Informe a data.'); return; }
    if (Number(formWorkload) <= 0) { setFormError('Carga horária deve ser > 0.'); return; }
    if (formParticipants.length === 0) { setFormError('Selecione ao menos um membro.'); return; }

    let payloadForm: any = {
      type: formType, date: formDate,
      workloadHours: Number(formWorkload),
      participants: formParticipants,
    };

    if (formType === 'autonomous_dev') {
      if (!formCourseName.trim()) { setFormError('Informe o nome do curso.'); return; }
      if (!formCourseObjectives.trim()) { setFormError('Informe os objetivos do curso.'); return; }
      if (!formCourseSyllabus.trim()) { setFormError('Informe a ementa do curso.'); return; }
      if (!formKeyLearnings.trim()) { setFormError('Informe os principais pontos aprendidos.'); return; }
      payloadForm = { ...payloadForm, courseName: formCourseName.trim(), courseUrl: formCourseUrl.trim() || undefined, certificateUrl: formCertificateUrl.trim() || undefined, courseObjectives: formCourseObjectives.trim(), courseSyllabus: formCourseSyllabus.trim(), keyLearnings: formKeyLearnings.trim() };
    } else {
      if (!formInvitedTeam.trim()) { setFormError('Informe a equipe convidada.'); return; }
      if (!formMeetingObjectives.trim()) { setFormError('Informe os objetivos da reunião.'); return; }
      if (!formSolutionsFound.trim()) { setFormError('Informe as soluções encontradas.'); return; }
      if (!formNextSteps.trim()) { setFormError('Informe os próximos passos.'); return; }
      payloadForm = { ...payloadForm, invitedTeam: formInvitedTeam.trim(), meetingObjectives: formMeetingObjectives.trim(), solutionsFound: formSolutionsFound.trim(), nextSteps: formNextSteps.trim() };
    }

    setFormSubmitting(true);
    try {
      const res = editingForm
        ? await fetch('/api/forms', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: currentUser, formId: editingForm.id, form: payloadForm }) })
        : await fetch('/api/forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: currentUser, form: payloadForm }) });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao salvar.');

      await fetchForms();
      setCreateModalOpen(false);
      resetFormState();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ─── Excluir ────────────────────────────────────────────────────────────────
  const handleDeleteForm = async (formId: string) => {
    try {
      const res = await fetch('/api/forms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, formId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setForms(prev => prev.filter(f => f.id !== formId));
      if (detailForm?.id === formId) setDetailForm(null);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // ─── Copiar Resumo ──────────────────────────────────────────────────────────
  const handleCopySummary = (item: FormRecord) => {
    let txt = '';
    if (item.type === 'autonomous_dev') {
      txt = `📚 Desenvolvimento Autônomo: ${item.courseName}\n📅 ${item.date} | ⏱ ${item.workloadHours}h\n👥 ${item.participants.join(', ')}\n` +
        (item.courseUrl ? `🔗 Curso: ${item.courseUrl}\n` : '') +
        (item.certificateUrl ? `📜 Certificado: ${item.certificateUrl}\n` : '') +
        `\n🎯 Objetivos:\n${item.courseObjectives}\n\n📖 Ementa:\n${item.courseSyllabus}\n\n💡 Aprendizados:\n${item.keyLearnings}`;
    } else {
      txt = `🤝 Evolução Coletiva com ${item.invitedTeam}\n📅 ${item.date} | ⏱ ${item.workloadHours}h\n👥 ${item.participants.join(', ')}\n\n🎯 Objetivos:\n${item.meetingObjectives}\n\n🧩 Soluções:\n${item.solutionsFound}\n\n🚀 Próximos Passos:\n${item.nextSteps}`;
    }
    navigator.clipboard.writeText(txt);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // ─── Métricas ───────────────────────────────────────────────────────────────
  const totalHours = forms.reduce((acc, f) => acc + (Number(f.workloadHours) || 0), 0);
  const autoDevForms = forms.filter(f => f.type === 'autonomous_dev') as AutonomousDevForm[];
  const collectiveForms = forms.filter(f => f.type === 'collective_evolution') as CollectiveEvolutionForm[];
  const uniqueTeamsCount = new Set(collectiveForms.map(f => f.invitedTeam.toLowerCase().trim())).size;

  // ─── Filtros ─────────────────────────────────────────────────────────────────
  const filteredForms = forms.filter(form => {
    if (selectedType !== 'all' && form.type !== selectedType) return false;
    if (selectedMember !== 'all' && !form.participants.includes(selectedMember)) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const inP = form.participants.some(p => p.toLowerCase().includes(q));
      if (form.type === 'autonomous_dev') {
        return inP || form.courseName.toLowerCase().includes(q) || form.courseObjectives.toLowerCase().includes(q) || form.courseSyllabus.toLowerCase().includes(q) || form.keyLearnings.toLowerCase().includes(q);
      } else {
        return inP || form.invitedTeam.toLowerCase().includes(q) || form.meetingObjectives.toLowerCase().includes(q) || form.solutionsFound.toLowerCase().includes(q) || form.nextSteps.toLowerCase().includes(q);
      }
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4">

      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-500/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              Registro de Formulários
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold uppercase tracking-wider">B-LEED</span>
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Documentação de desenvolvimento <em className="text-blue-400 not-italic">autônomo</em> e conexões de evolução <em className="text-amber-400 not-italic">coletiva</em> com outras equipes.
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Formulário
        </button>
      </div>

      {/* ─── Métricas ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Carga Horária Total', value: `${totalHours.toFixed(1)}h`, sub: 'registradas', icon: <Clock className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Desenv. Autônomo', value: autoDevForms.length, sub: 'cursos', icon: <BookOpen className="w-5 h-5" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
          { label: 'Evolução Coletiva', value: collectiveForms.length, sub: 'reuniões', icon: <Users className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Equipes Parceiras', value: uniqueTeamsCount, sub: 'conectadas', icon: <Sparkles className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((m, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">{m.label}</p>
              <p className={`text-2xl sm:text-3xl font-black mt-1 ${m.color}`}>{m.value} <span className="text-xs font-normal text-white/40">{m.sub}</span></p>
            </div>
            <div className={`p-3 rounded-xl border ${m.bg} ${m.color}`}>{m.icon}</div>
          </div>
        ))}
      </div>

      {/* ─── Filtros ─── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Busca */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por curso, equipe, membro..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tipo */}
        <div className="flex bg-black/30 rounded-xl border border-white/10 p-1 gap-1">
          {([
            { key: 'all', label: `Todos (${forms.length})` },
            { key: 'autonomous_dev', label: `Autônomo (${autoDevForms.length})` },
            { key: 'collective_evolution', label: `Coletiva (${collectiveForms.length})` },
          ] as { key: 'all' | FormType; label: string }[]).map(opt => (
            <button
              key={opt.key}
              onClick={() => setSelectedType(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedType === opt.key
                  ? opt.key === 'autonomous_dev' ? 'bg-blue-600 text-white'
                  : opt.key === 'collective_evolution' ? 'bg-amber-500 text-white'
                  : 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Membro */}
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
        >
          <option value="all">Todos os Membros</option>
          {availableMembers.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* ─── Lista ─── */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Carregando formulários do Supabase...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
          <p className="font-semibold">{error}</p>
          <button onClick={fetchForms} className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 font-bold hover:bg-rose-500/30 text-xs">Tentar Novamente</button>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl space-y-4">
          <div className="p-4 inline-block rounded-full bg-white/5">
            <FileText className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhum formulário encontrado</h3>
          <p className="text-xs text-white/40">{searchTerm || selectedType !== 'all' ? 'Nenhum resultado para os filtros aplicados.' : 'Comece registrando o primeiro formulário!'}</p>
          <button onClick={openCreateModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all">
            <Plus className="w-4 h-4" /> Criar Formulário
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence>
            {filteredForms.map(item => {
              const isAuto = item.type === 'autonomous_dev';
              const canEdit = isTech || item.createdBy === currentUser;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isAuto
                      ? 'bg-blue-950/20 border-blue-500/20 hover:border-blue-500/40'
                      : 'bg-amber-950/20 border-amber-500/20 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    {/* Badge + meta */}
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${isAuto ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                        {isAuto ? <BookOpen className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                        {isAuto ? 'Desenv. Autônomo' : 'Evolução Coletiva'}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {/* Botão Avaliar / Badge de Avaliação */}
                        {item.evaluation ? (
                          <button
                            onClick={() => setEvaluatingForm(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
                            title="Ver ou Editar Avaliação"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>+{(Object.values(item.evaluation.memberScores) as { totalXp?: number }[]).reduce((s, m) => s + (m.totalXp || 0), 0)} XP</span>
                            {isTech && <span className="text-[10px] font-bold text-white/60 hover:text-white ml-0.5">• Avaliar</span>}
                          </button>
                        ) : isTech ? (
                          <button
                            onClick={() => setEvaluatingForm(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/40 px-2.5 py-1 rounded-lg border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer shadow-sm animate-pulse"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Avaliar
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                            Pendente
                          </span>
                        )}

                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{item.date}</span>
                          <span className="flex items-center gap-1 font-bold text-white/60"><Clock className="w-3 h-3 text-blue-400" />{item.workloadHours}h</span>
                        </div>
                      </div>
                    </div>

                    {/* Título */}
                    <h3 className="text-lg font-bold text-white leading-snug line-clamp-2 mb-2">
                      {isAuto ? (item as AutonomousDevForm).courseName : `Reunião c/ ${(item as CollectiveEvolutionForm).invitedTeam}`}
                    </h3>

                    {/* Links rápidos */}
                    {isAuto && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(item as AutonomousDevForm).courseUrl && (
                          <a href={(item as AutonomousDevForm).courseUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/20 transition-all">
                            <ExternalLink className="w-3 h-3" /> Curso
                          </a>
                        )}
                        {(item as AutonomousDevForm).certificateUrl && (
                          <a href={(item as AutonomousDevForm).certificateUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/20 transition-all">
                            <Award className="w-3 h-3" /> Certificado
                          </a>
                        )}
                      </div>
                    )}

                    {/* Preview de conteúdo */}
                    <div className="space-y-1.5 text-xs text-white/50">
                      {isAuto ? (
                        <>
                          <p className="line-clamp-2"><span className="text-white/70 font-semibold">Ementa: </span>{(item as AutonomousDevForm).courseSyllabus}</p>
                          <p className="line-clamp-2"><span className="text-white/70 font-semibold">Aprendizados: </span>{(item as AutonomousDevForm).keyLearnings}</p>
                        </>
                      ) : (
                        <>
                          <p className="line-clamp-2"><span className="text-white/70 font-semibold">Objetivos: </span>{(item as CollectiveEvolutionForm).meetingObjectives}</p>
                          <p className="line-clamp-2"><span className="text-white/70 font-semibold">Soluções: </span>{(item as CollectiveEvolutionForm).solutionsFound}</p>
                        </>
                      )}
                    </div>

                    {/* Participantes */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1.5 items-center">
                      <UserCheck className="w-3 h-3 text-white/30 mr-1" />
                      {item.participants.map(p => (
                        <span key={p} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">{p}</span>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleCopySummary(item)} title="Copiar resumo Markdown"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      {canEdit && (
                        <>
                          <button onClick={() => openEditModal(item)} title="Editar"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirmId(item.id)} title="Excluir"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                    <button onClick={() => setDetailForm(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-blue-500/20 text-white hover:text-blue-300 border border-white/10 hover:border-blue-500/30 text-xs font-bold transition-all">
                      <Eye className="w-3.5 h-3.5" /> Ver Detalhes
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Modal de Criação / Edição ─── */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-8 flex flex-col max-h-[90vh]"
            >
              {/* Header do Modal */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-primary/95 backdrop-blur-xl z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{editingForm ? 'Editar Formulário' : 'Novo Registro de Formulário'}</h2>
                    <p className="text-xs text-white/40">Preencha os campos para documentar a atividade no Supabase.</p>
                  </div>
                </div>
                <button onClick={() => setCreateModalOpen(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto flex-1 space-y-5">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                  </div>
                )}

                {/* Tipo (só na criação) */}
                {!editingForm && (
                  <div className="grid grid-cols-2 gap-2 p-1 bg-black/30 rounded-xl border border-white/10">
                    <button type="button" onClick={() => setFormType('autonomous_dev')}
                      className={`py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${formType === 'autonomous_dev' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}>
                      <BookOpen className="w-4 h-4" /> Desenvolvimento Autônomo
                    </button>
                    <button type="button" onClick={() => setFormType('collective_evolution')}
                      className={`py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${formType === 'collective_evolution' ? 'bg-amber-500 text-white' : 'text-white/50 hover:text-white'}`}>
                      <Users className="w-4 h-4" /> Evolução Coletiva
                    </button>
                  </div>
                )}

                {/* Data + Carga Horária */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLS}>Data da Atividade *</label>
                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Carga Horária (horas) *</label>
                    <input type="number" step="0.5" min="0.5" value={formWorkload} onChange={e => setFormWorkload(e.target.value)} required placeholder="Ex: 4" className={INPUT_CLS} />
                  </div>
                </div>

                {/* Participantes */}
                <div>
                  <label className={LABEL_CLS}>Membros Participantes * ({formParticipants.length} selecionado{formParticipants.length !== 1 ? 's' : ''})</label>
                  <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {availableMembers.map(member => {
                      const sel = formParticipants.includes(member);
                      return (
                        <button key={member} type="button" onClick={() => toggleParticipant(member)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${sel ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/30'}`}>
                          {sel ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-50" />} {member}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─── Campos Desenvolvimento Autônomo ─── */}
                {formType === 'autonomous_dev' && (
                  <div className="space-y-4 pt-2 border-t border-white/10">
                    <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Detalhes do Curso / Capacitação
                    </h4>
                    <div>
                      <label className={LABEL_CLS}>Nome do Curso *</label>
                      <input type="text" value={formCourseName} onChange={e => setFormCourseName(e.target.value)} placeholder="Ex: Visão Computacional com OpenCV" required className={INPUT_CLS} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL_CLS}>Link do Curso (Opcional)</label>
                        <input type="url" value={formCourseUrl} onChange={e => setFormCourseUrl(e.target.value)} placeholder="https://..." className={INPUT_CLS} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Link do Certificado (Opcional)</label>
                        <input type="url" value={formCertificateUrl} onChange={e => setFormCertificateUrl(e.target.value)} placeholder="https://drive.google.com/..." className={INPUT_CLS} />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Objetivos do Curso *</label>
                      <textarea rows={3} value={formCourseObjectives} onChange={e => setFormCourseObjectives(e.target.value)} placeholder="Metas e objetivos de aprendizado..." required className={TEXTAREA_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Ementa do Curso *</label>
                      <textarea rows={3} value={formCourseSyllabus} onChange={e => setFormCourseSyllabus(e.target.value)} placeholder="Módulos, tópicos e matérias abordadas..." required className={TEXTAREA_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Principais Pontos Aprendidos *</label>
                      <textarea rows={3} value={formKeyLearnings} onChange={e => setFormKeyLearnings(e.target.value)} placeholder="O que foi mais valioso e como será aplicado?" required className={TEXTAREA_CLS} />
                    </div>
                  </div>
                )}

                {/* ─── Campos Evolução Coletiva ─── */}
                {formType === 'collective_evolution' && (
                  <div className="space-y-4 pt-2 border-t border-white/10">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> Detalhes da Reunião
                    </h4>
                    <div>
                      <label className={LABEL_CLS}>Equipe Convidada / Parceira *</label>
                      <input type="text" value={formInvitedTeam} onChange={e => setFormInvitedTeam(e.target.value)} placeholder="Ex: Equipe 17740 - Robonáticos" required className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Objetivos da Reunião *</label>
                      <textarea rows={3} value={formMeetingObjectives} onChange={e => setFormMeetingObjectives(e.target.value)} placeholder="O que foi planejado e o que seria discutido?" required className={TEXTAREA_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Soluções Encontradas *</label>
                      <textarea rows={3} value={formSolutionsFound} onChange={e => setFormSolutionsFound(e.target.value)} placeholder="Ideias e soluções identificadas durante a reunião..." required className={TEXTAREA_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Próximos Passos *</label>
                      <textarea rows={3} value={formNextSteps} onChange={e => setFormNextSteps(e.target.value)} placeholder="Ações práticas, prazos ou novos encontros..." required className={TEXTAREA_CLS} />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={formSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2">
                    {formSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando...</>
                    ) : (
                      <><Check className="w-4 h-4" />{editingForm ? 'Salvar Alterações' : 'Registrar Formulário'}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal de Detalhes ─── */}
      <AnimatePresence>
        {detailForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl my-8 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4 sticky top-0 bg-primary/95 backdrop-blur-xl z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 ${detailForm.type === 'autonomous_dev' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                      {detailForm.type === 'autonomous_dev' ? <><BookOpen className="w-3.5 h-3.5" /> Desenvolvimento Autônomo</> : <><Users className="w-3.5 h-3.5" /> Evolução Coletiva</>}
                    </span>
                    <span className="text-xs text-white/40 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{detailForm.date}</span>
                    <span className="text-xs text-white/40 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-400" />{detailForm.workloadHours}h</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {detailForm.type === 'autonomous_dev'
                      ? (detailForm as AutonomousDevForm).courseName
                      : `Reunião c/ ${(detailForm as CollectiveEvolutionForm).invitedTeam}`}
                  </h2>
                  <p className="text-xs text-white/30 mt-1">
                    Registrado por <span className="text-white/60 font-semibold">{detailForm.createdBy}</span> em {new Date(detailForm.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button onClick={() => setDetailForm(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
                {/* Participantes */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-blue-400" /> Participantes</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailForm.participants.map(p => (
                      <span key={p} className="text-xs font-bold px-3 py-1 rounded-lg bg-white/5 text-white border border-white/10">{p}</span>
                    ))}
                  </div>
                </div>

                {/* Links (Autônomo) */}
                {detailForm.type === 'autonomous_dev' && ((detailForm as AutonomousDevForm).courseUrl || (detailForm as AutonomousDevForm).certificateUrl) && (
                  <div className="flex flex-wrap gap-3">
                    {(detailForm as AutonomousDevForm).courseUrl && (
                      <a href={(detailForm as AutonomousDevForm).courseUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold hover:bg-blue-500/20 transition-all text-xs">
                        <ExternalLink className="w-4 h-4" /> Acessar Plataforma / Curso
                      </a>
                    )}
                    {(detailForm as AutonomousDevForm).certificateUrl && (
                      <a href={(detailForm as AutonomousDevForm).certificateUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all text-xs">
                        <Award className="w-4 h-4" /> Visualizar Certificado
                      </a>
                    )}
                  </div>
                )}

                {/* Seções de Conteúdo */}
                {detailForm.type === 'autonomous_dev' && (
                  <div className="space-y-4">
                    {[
                      { label: '🎯 Objetivos do Curso', content: (detailForm as AutonomousDevForm).courseObjectives },
                      { label: '📖 Ementa', content: (detailForm as AutonomousDevForm).courseSyllabus },
                      { label: '💡 Principais Pontos Aprendidos', content: (detailForm as AutonomousDevForm).keyLearnings },
                    ].map(section => (
                      <div key={section.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">{section.label}</h4>
                        <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{section.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {detailForm.type === 'collective_evolution' && (
                  <div className="space-y-4">
                    {[
                      { label: '🎯 Objetivos da Reunião', content: (detailForm as CollectiveEvolutionForm).meetingObjectives },
                      { label: '🧩 Soluções Encontradas', content: (detailForm as CollectiveEvolutionForm).solutionsFound },
                      { label: '🚀 Próximos Passos', content: (detailForm as CollectiveEvolutionForm).nextSteps },
                    ].map(section => (
                      <div key={section.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">{section.label}</h4>
                        <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{section.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between gap-3">
                <button onClick={() => handleCopySummary(detailForm)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-all">
                  {copiedId === detailForm.id ? <><Check className="w-4 h-4 text-emerald-400" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar Resumo (Markdown)</>}
                </button>
                <div className="flex gap-2">
                  {(isTech || detailForm.createdBy === currentUser) && (
                    <button onClick={() => { const t = detailForm; setDetailForm(null); openEditModal(t); }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all">
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                  )}
                  <button onClick={() => setDetailForm(null)}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all">
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal Confirmação de Exclusão ─── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400"><Trash2 className="w-5 h-5" /></div>
                <h3 className="text-lg font-bold text-white">Confirmar Exclusão</h3>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Tem certeza que deseja excluir este formulário permanentemente do Supabase? Essa ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all">
                  Cancelar
                </button>
                <button onClick={() => handleDeleteForm(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20">
                  Excluir Definitivamente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal de Avaliação de Habilidades & XP ─── */}
      {evaluatingForm && (
        <ActivityEvaluationModal
          isOpen={!!evaluatingForm}
          onClose={() => setEvaluatingForm(null)}
          activityId={evaluatingForm.id}
          activityTitle={
            evaluatingForm.type === 'autonomous_dev'
              ? (evaluatingForm as AutonomousDevForm).courseName
              : `Reunião c/ ${(evaluatingForm as CollectiveEvolutionForm).invitedTeam}`
          }
          activityType={evaluatingForm.type}
          activityDate={evaluatingForm.date}
          workloadOrDuration={`${evaluatingForm.workloadHours}h`}
          participants={evaluatingForm.participants}
          initialEvaluation={evaluatingForm.evaluation}
          userRole={userRole}
          currentUser={currentUser}
          onSaveEvaluation={handleSaveEvaluation}
        />
      )}
    </div>
  );
}
