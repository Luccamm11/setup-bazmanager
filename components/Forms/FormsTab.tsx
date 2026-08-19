import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, Search, Filter, BookOpen, Users, Clock,
  Calendar, ExternalLink, Award, FileText, CheckCircle2, AlertCircle,
  Trash2, Edit3, Eye, Copy, Check, X, ChevronRight, Sparkles,
  Layers, ArrowRight, UserCheck, Shield, HelpCircle
} from 'lucide-react';
import { FormRecord, AutonomousDevForm, CollectiveEvolutionForm, FormType, UserRole } from '../../types';

interface FormsTabProps {
  currentUser: string;
  userRole: UserRole;
}

export default function FormsTab({ currentUser, userRole }: FormsTabProps) {
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMembers, setAvailableMembers] = useState<string[]>([]);

  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | FormType>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  // Modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<FormRecord | null>(null);
  const [detailForm, setDetailForm] = useState<FormRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formType, setFormType] = useState<FormType>('autonomous_dev');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formWorkload, setFormWorkload] = useState<number | string>(2);
  const [formParticipants, setFormParticipants] = useState<string[]>([]);
  
  // Campos - Desenvolvimento Autônomo
  const [formCourseName, setFormCourseName] = useState('');
  const [formCourseUrl, setFormCourseUrl] = useState('');
  const [formCertificateUrl, setFormCertificateUrl] = useState('');
  const [formCourseObjectives, setFormCourseObjectives] = useState('');
  const [formCourseSyllabus, setFormCourseSyllabus] = useState('');
  const [formKeyLearnings, setFormKeyLearnings] = useState('');

  // Campos - Evolução Coletiva
  const [formInvitedTeam, setFormInvitedTeam] = useState('');
  const [formMeetingObjectives, setFormMeetingObjectives] = useState('');
  const [formSolutionsFound, setFormSolutionsFound] = useState('');
  const [formNextSteps, setFormNextSteps] = useState('');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isTech = userRole === 'technician' || ['Jonas', 'Ramon'].includes(currentUser);

  // ─── Carregar Formulários e Membros ─────────────────────────────────────────
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

      // Membros para seleção
      const memRes = await fetch(`/api/members?requester=${encodeURIComponent(currentUser)}`);
      const memData = await memRes.json();
      if (memData.success && Array.isArray(memData.members)) {
        setAvailableMembers(memData.members.map((m: any) => m.username || m.name));
      } else {
        // Fallback
        setAvailableMembers(['Jonas', 'Ramon', 'Lucca', 'Clarice', 'Ana Clara', 'Bernardo', 'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende', 'Sara Galdino']);
      }
    } catch (err: any) {
      console.error('Forms fetch error:', err);
      setError(err.message || 'Erro de conexão ao carregar formulários.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // ─── Resetar Form ───────────────────────────────────────────────────────────
  const resetFormState = () => {
    setFormType('autonomous_dev');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormWorkload(2);
    setFormParticipants(currentUser ? [currentUser] : []);
    setFormCourseName('');
    setFormCourseUrl('');
    setFormCertificateUrl('');
    setFormCourseObjectives('');
    setFormCourseSyllabus('');
    setFormKeyLearnings('');
    setFormInvitedTeam('');
    setFormMeetingObjectives('');
    setFormSolutionsFound('');
    setFormNextSteps('');
    setFormError(null);
    setEditingForm(null);
  };

  const openCreateModal = () => {
    resetFormState();
    setCreateModalOpen(true);
  };

  const openEditModal = (item: FormRecord) => {
    setEditingForm(item);
    setFormType(item.type);
    setFormDate(item.date || new Date().toISOString().split('T')[0]);
    setFormWorkload(item.workloadHours || 0);
    setFormParticipants(item.participants || []);
    setFormError(null);

    if (item.type === 'autonomous_dev') {
      setFormCourseName(item.courseName || '');
      setFormCourseUrl(item.courseUrl || '');
      setFormCertificateUrl(item.certificateUrl || '');
      setFormCourseObjectives(item.courseObjectives || '');
      setFormCourseSyllabus(item.courseSyllabus || '');
      setFormKeyLearnings(item.keyLearnings || '');
    } else {
      setFormInvitedTeam(item.invitedTeam || '');
      setFormMeetingObjectives(item.meetingObjectives || '');
      setFormSolutionsFound(item.solutionsFound || '');
      setFormNextSteps(item.nextSteps || '');
    }

    setCreateModalOpen(true);
  };

  // ─── Toggle Membro Participante ─────────────────────────────────────────────
  const toggleParticipant = (member: string) => {
    setFormParticipants(prev =>
      prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member]
    );
  };

  // ─── Salvar Formulário (Criar / Editar) ──────────────────────────────────────
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formDate) {
      setFormError('Por favor, informe a data do registro.');
      return;
    }

    if (Number(formWorkload) <= 0) {
      setFormError('A carga horária deve ser maior que 0 horas.');
      return;
    }

    if (formParticipants.length === 0) {
      setFormError('Selecione pelo menos um membro participante.');
      return;
    }

    let payloadForm: any = {
      type: formType,
      date: formDate,
      workloadHours: Number(formWorkload),
      participants: formParticipants,
    };

    if (formType === 'autonomous_dev') {
      if (!formCourseName.trim()) {
        setFormError('Informe o nome do curso.');
        return;
      }
      if (!formCourseObjectives.trim()) {
        setFormError('Informe os objetivos do curso.');
        return;
      }
      if (!formCourseSyllabus.trim()) {
        setFormError('Informe a ementa do curso.');
        return;
      }
      if (!formKeyLearnings.trim()) {
        setFormError('Informe os principais pontos aprendidos.');
        return;
      }

      payloadForm = {
        ...payloadForm,
        courseName: formCourseName.trim(),
        courseUrl: formCourseUrl.trim() || undefined,
        certificateUrl: formCertificateUrl.trim() || undefined,
        courseObjectives: formCourseObjectives.trim(),
        courseSyllabus: formCourseSyllabus.trim(),
        keyLearnings: formKeyLearnings.trim(),
      };
    } else {
      if (!formInvitedTeam.trim()) {
        setFormError('Informe o nome da equipe convidada/parceira.');
        return;
      }
      if (!formMeetingObjectives.trim()) {
        setFormError('Informe os objetivos da reunião.');
        return;
      }
      if (!formSolutionsFound.trim()) {
        setFormError('Informe as soluções encontradas.');
        return;
      }
      if (!formNextSteps.trim()) {
        setFormError('Informe os próximos passos definidos.');
        return;
      }

      payloadForm = {
        ...payloadForm,
        invitedTeam: formInvitedTeam.trim(),
        meetingObjectives: formMeetingObjectives.trim(),
        solutionsFound: formSolutionsFound.trim(),
        nextSteps: formNextSteps.trim(),
      };
    }

    setFormSubmitting(true);
    try {
      let res: Response;

      if (editingForm) {
        // Atualização
        res = await fetch('/api/forms', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser,
            formId: editingForm.id,
            form: payloadForm,
          }),
        });
      } else {
        // Criação
        res = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser,
            form: payloadForm,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao salvar formulário.');
      }

      await fetchForms();
      setCreateModalOpen(false);
      resetFormState();
    } catch (err: any) {
      console.error('Error saving form:', err);
      setFormError(err.message || 'Erro ao persistir os dados no Supabase.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // ─── Excluir Formulário ─────────────────────────────────────────────────────
  const handleDeleteForm = async (formId: string) => {
    try {
      const res = await fetch('/api/forms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          formId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao excluir formulário.');
      }

      setForms(prev => prev.filter(f => f.id !== formId));
      if (detailForm?.id === formId) {
        setDetailForm(null);
      }
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // ─── Copiar Resumo Estruturado ──────────────────────────────────────────────
  const handleCopySummary = (item: FormRecord) => {
    let summaryText = '';
    if (item.type === 'autonomous_dev') {
      summaryText = `📚 **Desenvolvimento Autônomo: ${item.courseName}**\n` +
        `📅 Data: ${item.date} | ⏱ Carga Horária: ${item.workloadHours}h\n` +
        `👥 Participantes: ${item.participants.join(', ')}\n` +
        (item.courseUrl ? `🔗 Link do Curso: ${item.courseUrl}\n` : '') +
        (item.certificateUrl ? `📜 Certificado: ${item.certificateUrl}\n` : '') +
        `\n🎯 **Objetivos do Curso:**\n${item.courseObjectives}\n` +
        `\n📖 **Ementa:**\n${item.courseSyllabus}\n` +
        `\n💡 **Principais Pontos Aprendidos:**\n${item.keyLearnings}\n`;
    } else {
      summaryText = `🤝 **Evolução Coletiva: Reunião com ${item.invitedTeam}**\n` +
        `📅 Data: ${item.date} | ⏱ Duração: ${item.workloadHours}h\n` +
        `👥 Participantes: ${item.participants.join(', ')}\n` +
        `\n🎯 **Objetivos da Reunião:**\n${item.meetingObjectives}\n` +
        `\n🧩 **Soluções Encontradas:**\n${item.solutionsFound}\n` +
        `\n🚀 **Próximos Passos:**\n${item.nextSteps}\n`;
    }

    navigator.clipboard.writeText(summaryText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // ─── Métricas Calculadas ────────────────────────────────────────────────────
  const totalHours = forms.reduce((acc, f) => acc + (Number(f.workloadHours) || 0), 0);
  const autoDevForms = forms.filter(f => f.type === 'autonomous_dev') as AutonomousDevForm[];
  const collectiveForms = forms.filter(f => f.type === 'collective_evolution') as CollectiveEvolutionForm[];
  
  const uniqueTeamsCount = new Set(collectiveForms.map(f => f.invitedTeam.toLowerCase().trim()).filter(Boolean)).size;
  const uniqueMembersCount = new Set(forms.flatMap(f => f.participants)).size;

  // ─── Filtragem ──────────────────────────────────────────────────────────────
  const filteredForms = forms.filter(form => {
    // Filtro por tipo
    if (selectedType !== 'all' && form.type !== selectedType) {
      return false;
    }

    // Filtro por membro
    if (selectedMember !== 'all' && !form.participants.includes(selectedMember)) {
      return false;
    }

    // Busca textual
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const inParticipants = form.participants.some(p => p.toLowerCase().includes(q));
      const inDate = form.date.includes(q);

      if (form.type === 'autonomous_dev') {
        const inCourse = form.courseName.toLowerCase().includes(q);
        const inObjectives = form.courseObjectives.toLowerCase().includes(q);
        const inSyllabus = form.courseSyllabus.toLowerCase().includes(q);
        const inLearnings = form.keyLearnings.toLowerCase().includes(q);
        return inParticipants || inDate || inCourse || inObjectives || inSyllabus || inLearnings;
      } else {
        const inTeam = form.invitedTeam.toLowerCase().includes(q);
        const inObjectives = form.meetingObjectives.toLowerCase().includes(q);
        const inSolutions = form.solutionsFound.toLowerCase().includes(q);
        const inSteps = form.nextSteps.toLowerCase().includes(q);
        return inParticipants || inDate || inTeam || inObjectives || inSolutions || inSteps;
      }
    }

    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* ─── Header do Módulo ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-primary via-primary/95 to-border-color/30 p-6 rounded-2xl border border-border-color shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary shadow-inner">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-2.5">
              Registro de Formulários
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/30 font-bold uppercase tracking-wider">
                B-LEED
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Documentação estruturada de desenvolvimento autônomo e conexões de evolução coletiva com outras equipes.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-primary text-primary font-bold shadow-lg shadow-accent-primary/20 hover:bg-accent-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Formulário</span>
        </button>
      </div>

      {/* ─── Cards de Estatísticas ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary/80 p-5 rounded-xl border border-border-color flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Carga Horária Total</p>
            <p className="text-2xl sm:text-3xl font-black text-text-primary mt-1">{totalHours.toFixed(1)} <span className="text-sm font-normal text-text-secondary">horas</span></p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-primary/80 p-5 rounded-xl border border-border-color flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Desenv. Autônomo</p>
            <p className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">{autoDevForms.length} <span className="text-sm font-normal text-text-secondary">cursos</span></p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-primary/80 p-5 rounded-xl border border-border-color flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Evolução Coletiva</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{collectiveForms.length} <span className="text-sm font-normal text-text-secondary">reuniões</span></p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-primary/80 p-5 rounded-xl border border-border-color flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Equipes Conectadas</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{uniqueTeamsCount} <span className="text-sm font-normal text-text-secondary">parceiras</span></p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── Barra de Filtros e Pesquisa ─── */}
      <div className="bg-primary/60 p-4 rounded-xl border border-border-color flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por curso, equipe convidada, membro, palavras-chave..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-dark border border-border-color text-text-primary placeholder:text-text-secondary/60 text-sm focus:outline-none focus:border-accent-primary transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Tipo */}
          <div className="flex items-center bg-background-dark p-1 rounded-lg border border-border-color">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                selectedType === 'all'
                  ? 'bg-accent-primary text-primary shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Todos ({forms.length})
            </button>
            <button
              onClick={() => setSelectedType('autonomous_dev')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedType === 'autonomous_dev'
                  ? 'bg-blue-500 text-white shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Autônomo ({autoDevForms.length})
            </button>
            <button
              onClick={() => setSelectedType('collective_evolution')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedType === 'collective_evolution'
                  ? 'bg-amber-500 text-white shadow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Coletiva ({collectiveForms.length})
            </button>
          </div>

          {/* Filtro por Membro */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background-dark border border-border-color text-text-primary text-xs font-medium focus:outline-none focus:border-accent-primary"
          >
            <option value="all">Todos os Membros</option>
            {availableMembers.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Lista de Registros / Cards ─── */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm font-medium">Carregando formulários do Supabase...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchForms}
            className="px-4 py-2 rounded-lg bg-rose-500/20 text-rose-300 font-bold hover:bg-rose-500/30 transition-all text-xs"
          >
            Tentar Novamente
          </button>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="py-16 text-center bg-primary/40 rounded-2xl border border-dashed border-border-color space-y-4">
          <div className="p-4 rounded-full bg-border-color/40 text-text-secondary inline-block">
            <FileText className="w-10 h-10 opacity-60" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-text-primary">Nenhum formulário encontrado</h3>
            <p className="text-xs text-text-secondary mt-1">
              {searchTerm || selectedType !== 'all' || selectedMember !== 'all'
                ? 'Nenhum resultado corresponde aos filtros aplicados.'
                : 'Nenhum formulário foi cadastrado ainda. Comece registrando o primeiro!'}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-primary font-bold text-xs shadow-md hover:bg-accent-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar Formulário
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence>
            {filteredForms.map((item) => {
              const isAuto = item.type === 'autonomous_dev';
              const canEdit = isTech || item.createdBy === currentUser;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                    isAuto
                      ? 'bg-gradient-to-br from-primary via-primary to-blue-950/20 border-blue-500/20 hover:border-blue-500/40'
                      : 'bg-gradient-to-br from-primary via-primary to-amber-950/20 border-amber-500/20 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                            isAuto
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {isAuto ? <BookOpen className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                          {isAuto ? 'Desenv. Autônomo' : 'Evolução Coletiva'}
                        </span>
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-text-secondary bg-background-dark/80 px-2 py-1 rounded-md border border-border-color">
                        <Clock className="w-3.5 h-3.5 text-accent-primary" />
                        <span>{item.workloadHours}h</span>
                      </div>
                    </div>

                    {/* Título Principal */}
                    <h3 className="text-lg font-bold text-text-primary leading-snug line-clamp-2">
                      {isAuto ? (item as AutonomousDevForm).courseName : `Reunião c/ ${(item as CollectiveEvolutionForm).invitedTeam}`}
                    </h3>

                    {/* Links rápidos para Desenvolvimento Autônomo */}
                    {isAuto && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(item as AutonomousDevForm).courseUrl && (
                          <a
                            href={(item as AutonomousDevForm).courseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 hover:underline bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Curso
                          </a>
                        )}
                        {(item as AutonomousDevForm).certificateUrl && (
                          <a
                            href={(item as AutonomousDevForm).certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                          >
                            <Award className="w-3 h-3" />
                            Certificado
                          </a>
                        )}
                      </div>
                    )}

                    {/* Destaque de Conteúdo */}
                    <div className="mt-3.5 space-y-2 text-xs">
                      {isAuto ? (
                        <>
                          <p className="text-text-secondary line-clamp-2">
                            <span className="font-semibold text-text-primary">Ementa: </span>
                            {(item as AutonomousDevForm).courseSyllabus}
                          </p>
                          <p className="text-text-secondary line-clamp-2">
                            <span className="font-semibold text-text-primary">Principais Aprendizados: </span>
                            {(item as AutonomousDevForm).keyLearnings}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-text-secondary line-clamp-2">
                            <span className="font-semibold text-text-primary">Objetivos: </span>
                            {(item as CollectiveEvolutionForm).meetingObjectives}
                          </p>
                          <p className="text-text-secondary line-clamp-2">
                            <span className="font-semibold text-text-primary">Soluções: </span>
                            {(item as CollectiveEvolutionForm).solutionsFound}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Participantes */}
                    <div className="mt-4 pt-3 border-t border-border-color/60 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-text-secondary font-medium mr-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Participantes:
                      </span>
                      {item.participants.map(p => (
                        <span
                          key={p}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-border-color/50 text-text-primary border border-border-color"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rodapé e Ações do Card */}
                  <div className="mt-5 pt-3 border-t border-border-color flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopySummary(item)}
                        title="Copiar resumo estruturado"
                        className="p-1.5 rounded-lg bg-background-dark hover:bg-border-color text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>

                      {canEdit && (
                        <>
                          <button
                            onClick={() => openEditModal(item)}
                            title="Editar formulário"
                            className="p-1.5 rounded-lg bg-background-dark hover:bg-border-color text-text-secondary hover:text-text-primary transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            title="Excluir formulário"
                            className="p-1.5 rounded-lg bg-background-dark hover:bg-rose-500/20 text-text-secondary hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => setDetailForm(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background-dark hover:bg-border-color text-xs font-bold text-text-primary transition-colors border border-border-color"
                    >
                      <Eye className="w-3.5 h-3.5 text-accent-primary" />
                      <span>Ver Detalhes</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-primary border border-border-color rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]"
            >
              {/* Top Modal Header */}
              <div className="p-6 border-b border-border-color bg-background-dark/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      {editingForm ? 'Editar Formulário' : 'Novo Registro de Formulário'}
                    </h2>
                    <p className="text-xs text-text-secondary">
                      Preencha os campos abaixo para documentar a atividade no Supabase.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-border-color text-text-secondary hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-6 flex-1">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Seleção do Tipo de Formulário (se não estiver editando) */}
                {!editingForm && (
                  <div className="grid grid-cols-2 gap-3 p-1 bg-background-dark rounded-xl border border-border-color">
                    <button
                      type="button"
                      onClick={() => setFormType('autonomous_dev')}
                      className={`py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        formType === 'autonomous_dev'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Desenvolvimento Autônomo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('collective_evolution')}
                      className={`py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        formType === 'collective_evolution'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Evolução Coletiva</span>
                    </button>
                  </div>
                )}

                {/* Campos Comuns: Data e Carga Horária */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                      Data da Atividade *
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                      Carga Horária (em horas) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={formWorkload}
                      onChange={(e) => setFormWorkload(e.target.value)}
                      required
                      placeholder="Ex: 4"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                </div>

                {/* Membros Participantes (Multi-select) */}
                <div>
                  <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                    Membros Participantes * ({formParticipants.length} selecionado{formParticipants.length !== 1 ? 's' : ''})
                  </label>
                  <div className="p-3 rounded-xl bg-background-dark border border-border-color flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                    {availableMembers.map((member) => {
                      const selected = formParticipants.includes(member);
                      return (
                        <button
                          key={member}
                          type="button"
                          onClick={() => toggleParticipant(member)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                            selected
                              ? 'bg-accent-primary/20 text-accent-primary border-accent-primary font-bold'
                              : 'bg-primary border-border-color text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {selected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-50" />}
                          {member}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─── Campos Específicos: Desenvolvimento Autônomo ─── */}
                {formType === 'autonomous_dev' && (
                  <div className="space-y-4 pt-2 border-t border-border-color">
                    <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Detalhes do Curso / Capacitação
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                        Nome do Curso *
                      </label>
                      <input
                        type="text"
                        value={formCourseName}
                        onChange={(e) => setFormCourseName(e.target.value)}
                        placeholder="Ex: Curso Avançado de Visão Computacional com OpenCV"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                          Link do Curso / Plataforma (Opcional)
                        </label>
                        <input
                          type="url"
                          value={formCourseUrl}
                          onChange={(e) => setFormCourseUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                          Link do Certificado (Opcional)
                        </label>
                        <input
                          type="url"
                          value={formCertificateUrl}
                          onChange={(e) => setFormCertificateUrl(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                        Objetivos do Curso *
                      </label>
                      <textarea
                        rows={3}
                        value={formCourseObjectives}
                        onChange={(e) => setFormCourseObjectives(e.target.value)}
                        placeholder="Quais eram as metas e metas de aprendizado desse curso?"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                        Ementa do Curso *
                      </label>
                      <textarea
                        rows={3}
                        value={formCourseSyllabus}
                        onChange={(e) => setFormCourseSyllabus(e.target.value)}
                        placeholder="Módulos, tópicos abordados e matérias estudadas..."
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                        Principais Pontos Aprendidos *
                      </label>
                      <textarea
                        rows={3}
                        value={formKeyLearnings}
                        onChange={(e) => setFormKeyLearnings(e.target.value)}
                        placeholder="O que de mais valioso foi aprendido e como será aplicado na equipe?"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* ─── Campos Específicos: Evolução Coletiva ─── */}
                {formType === 'collective_evolution' && (
                  <div className="space-y-4 pt-2 border-t border-border-color">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> Detalhes da Reunião / Conexão
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                        Equipe Convidada / Parceira *
                      </label>
                      <input
                        type="text"
                        value={formInvitedTeam}
                        onChange={(e) => setFormInvitedTeam(e.target.value)}
                        placeholder="Ex: Equipe 17740 - Robonáticos"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                        Objetivos da Reunião *
                      </label>
                      <textarea
                        rows={3}
                        value={formMeetingObjectives}
                        onChange={(e) => setFormMeetingObjectives(e.target.value)}
                        placeholder="O que foi planejado para alinhar ou discutir nessa reunião?"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                        Soluções Encontradas *
                      </label>
                      <textarea
                        rows={3}
                        value={formSolutionsFound}
                        onChange={(e) => setFormSolutionsFound(e.target.value)}
                        placeholder="Ideias, soluções técnicas ou de gestão identificadas durante a reunião..."
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                        Próximos Passos *
                      </label>
                      <textarea
                        rows={3}
                        value={formNextSteps}
                        onChange={(e) => setFormNextSteps(e.target.value)}
                        placeholder="Ações práticas, prazos ou novos encontros combinados..."
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background-dark border border-border-color text-text-primary text-sm focus:outline-none focus:border-accent-primary resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Footer do Modal */}
                <div className="pt-4 border-t border-border-color flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-background-dark hover:bg-border-color text-text-secondary text-sm font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-accent-primary text-primary text-sm font-bold shadow-lg shadow-accent-primary/20 hover:bg-accent-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {formSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Salvando no Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingForm ? 'Salvar Alterações' : 'Registrar Formulário'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal de Visualização Detalhada ─── */}
      <AnimatePresence>
        {detailForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-primary border border-border-color rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]"
            >
              {/* Header do Detalhe */}
              <div className="p-6 border-b border-border-color bg-background-dark/50 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                        detailForm.type === 'autonomous_dev'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {detailForm.type === 'autonomous_dev' ? <BookOpen className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                      {detailForm.type === 'autonomous_dev' ? 'Desenvolvimento Autônomo' : 'Evolução Coletiva'}
                    </span>
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {detailForm.date}
                    </span>
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-accent-primary" />
                      {detailForm.workloadHours} horas
                    </span>
                  </div>

                  <h2 className="text-2xl font-extrabold text-text-primary">
                    {detailForm.type === 'autonomous_dev'
                      ? (detailForm as AutonomousDevForm).courseName
                      : `Reunião c/ ${(detailForm as CollectiveEvolutionForm).invitedTeam}`}
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Registrado por <span className="font-semibold text-text-primary">{detailForm.createdBy}</span> em {new Date(detailForm.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <button
                  onClick={() => setDetailForm(null)}
                  className="p-2 rounded-lg hover:bg-border-color text-text-secondary hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo dos Detalhes */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                {/* Membros */}
                <div className="p-4 rounded-xl bg-background-dark/60 border border-border-color">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-accent-primary" />
                    Membros Participantes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailForm.participants.map(p => (
                      <span
                        key={p}
                        className="text-xs font-bold px-3 py-1 rounded-lg bg-primary text-text-primary border border-border-color shadow-sm"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Seção Autônomo */}
                {detailForm.type === 'autonomous_dev' && (
                  <>
                    {/* Links */}
                    {((detailForm as AutonomousDevForm).courseUrl || (detailForm as AutonomousDevForm).certificateUrl) && (
                      <div className="flex flex-wrap gap-3">
                        {(detailForm as AutonomousDevForm).courseUrl && (
                          <a
                            href={(detailForm as AutonomousDevForm).courseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold hover:bg-blue-500/20 transition-all text-xs"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Acessar Plataforma / Curso
                          </a>
                        )}
                        {(detailForm as AutonomousDevForm).certificateUrl && (
                          <a
                            href={(detailForm as AutonomousDevForm).certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all text-xs"
                          >
                            <Award className="w-4 h-4" />
                            Visualizar Certificado
                          </a>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-primary border border-border-color space-y-1.5">
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">🎯 Objetivos do Curso</h4>
                        <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
                          {(detailForm as AutonomousDevForm).courseObjectives}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-primary border border-border-color space-y-1.5">
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">📖 Ementa</h4>
                        <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
                          {(detailForm as AutonomousDevForm).courseSyllabus}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-primary border border-border-color space-y-1.5">
                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">💡 Principais Pontos Aprendidos</h4>
                        <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
                          {(detailForm as AutonomousDevForm).keyLearnings}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Seção Coletiva */}
                {detailForm.type === 'collective_evolution' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-primary border border-border-color space-y-1.5">
                      <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">🎯 Objetivos da Reunião</h4>
                      <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
                        {(detailForm as CollectiveEvolutionForm).meetingObjectives}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-primary border border-border-color space-y-1.5">
                      <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">🧩 Soluções Encontradas</h4>
                      <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
                        {(detailForm as CollectiveEvolutionForm).solutionsFound}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-primary border border-border-color space-y-1.5">
                      <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">🚀 Próximos Passos</h4>
                      <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
                        {(detailForm as CollectiveEvolutionForm).nextSteps}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer do Detalhe */}
              <div className="p-4 border-t border-border-color bg-background-dark/40 flex items-center justify-between">
                <button
                  onClick={() => handleCopySummary(detailForm)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background-dark hover:bg-border-color text-text-primary text-xs font-bold border border-border-color transition-colors"
                >
                  {copiedId === detailForm.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId === detailForm.id ? 'Copiado para Área de Transferência!' : 'Copiar Resumo (Markdown)'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {(isTech || detailForm.createdBy === currentUser) && (
                    <button
                      onClick={() => {
                        const target = detailForm;
                        setDetailForm(null);
                        openEditModal(target);
                      }}
                      className="px-4 py-2 rounded-xl bg-background-dark hover:bg-border-color text-text-primary text-xs font-bold border border-border-color transition-colors flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  )}
                  <button
                    onClick={() => setDetailForm(null)}
                    className="px-5 py-2 rounded-xl bg-accent-primary text-primary text-xs font-bold hover:bg-accent-primary/90 transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal de Confirmação de Exclusão ─── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Confirmar Exclusão</h3>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                Tem certeza de que deseja remover este formulário? Esta ação removerá o registro do Supabase e não poderá ser desfeita.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-background-dark hover:bg-border-color text-text-secondary text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteForm(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                >
                  Sim, Excluir Registro
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
