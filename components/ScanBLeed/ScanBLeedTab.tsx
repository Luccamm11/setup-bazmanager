import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, Camera, Upload, RefreshCw, CheckCircle2, AlertCircle,
  FileText, Users, Calendar, Clock, UserPlus, ZoomIn, ZoomOut, Maximize2,
  Sparkles, ArrowRight, Eye, Check, X, ShieldAlert, BookOpen, GraduationCap, ChevronRight
} from 'lucide-react';
import { UserRole } from '../../types';
import { scanBLeedForm, ScanBLeedResponse } from '../../services/geminiService';

interface ScanBLeedTabProps {
  currentUser: string;
  userRole: UserRole;
  onNavigate?: (view: any) => void;
}

const INPUT_CLS = 'w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-accent-primary text-sm transition-all';
const TEXTAREA_CLS = 'w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-accent-primary text-sm transition-all resize-none';
const LABEL_CLS = 'block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5';

export default function ScanBLeedTab({ currentUser, userRole, onNavigate }: ScanBLeedTabProps) {
  // State: Upload & Scanner
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Available Data
  const [availableMembers, setAvailableMembers] = useState<string[]>([]);
  const [existingMentors, setExistingMentors] = useState<{ id: string; name: string; area?: string; org?: string }[]>([]);
  
  // API Key
  const [apiKey] = useState<string>(() => import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('googleAiApiKey') || '');

  // Extracted Data / Editable Form State
  const [formType, setFormType] = useState<'mentorias' | 'evolucao_coletiva' | 'desenvolvimento_autonomo'>('mentorias');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workloadHours, setWorkloadHours] = useState<number | string>(2);
  const [participants, setParticipants] = useState<string[]>([]);

  // Mentoria Fields
  const [mentorName, setMentorName] = useState('');
  const [mentorArea, setMentorArea] = useState('');
  const [mentorOrg, setMentorOrg] = useState('');
  const [isNewMentorPrompt, setIsNewMentorPrompt] = useState(false);
  const [createMentorChecked, setCreateMentorChecked] = useState(true);
  const [objectives, setObjectives] = useState('');
  const [solutions, setSolutions] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  // Evolução Coletiva Fields
  const [invitedTeam, setInvitedTeam] = useState('');
  const [meetingObjectives, setMeetingObjectives] = useState('');
  const [solutionsFound, setSolutionsFound] = useState('');

  // Desenvolvimento Autônomo Fields
  const [courseName, setCourseName] = useState('');
  const [courseObjectives, setCourseObjectives] = useState('');
  const [courseSyllabus, setCourseSyllabus] = useState('');
  const [keyLearnings, setKeyLearnings] = useState('');

  // Submission & Success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{ type: string; title: string; viewTarget: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch Members & Mentors ───────────────────────────────────────────────
  const fetchMetadata = useCallback(async () => {
    try {
      const [membersRes, mentorsRes] = await Promise.all([
        fetch(`/api/members?requester=${encodeURIComponent(currentUser)}`).then(r => r.json()),
        fetch('/api/mentors').then(r => r.json()),
      ]);

      if (membersRes.success && Array.isArray(membersRes.members)) {
        setAvailableMembers(membersRes.members.map((m: any) => m.username || m.name));
      } else {
        setAvailableMembers(['Jonas', 'Ramon', 'Lucca', 'Clarice', 'Ana Clara', 'Bernardo', 'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende', 'Sara Galdino']);
      }

      if (mentorsRes.success && Array.isArray(mentorsRes.mentors)) {
        setExistingMentors(mentorsRes.mentors.map((m: any) => ({
          id: m.id,
          name: m.name,
          area: m.area,
          org: m.organization
        })));
      }
    } catch (err) {
      console.error('Error fetching scan metadata:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // ─── File Selection & OCR Trigger ──────────────────────────────────────────
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const resultBase64 = e.target?.result as string;
      setImageSrc(resultBase64);
      setZoomLevel(1);
      processImageWithGemini(resultBase64);
    };
    reader.readAsDataURL(file);
  };

  const processImageWithGemini = async (base64Img: string) => {
    setIsScanning(true);
    setScanError(null);
    setSubmitSuccess(null);

    try {
      const result = await scanBLeedForm(apiKey, base64Img, existingMentors, availableMembers);

      if (!result) throw new Error('Não foi possível ler as informações do formulário.');

      // Preencher campos
      setFormType(result.formType);
      if (result.date) setDate(result.date);
      if (result.workloadHours) setWorkloadHours(result.workloadHours);
      if (result.participants && result.participants.length > 0) {
        setParticipants(result.participants);
      } else if (currentUser) {
        setParticipants([currentUser]);
      }

      if (result.formType === 'mentorias') {
        const mName = result.mentorName || '';
        setMentorName(mName);
        setObjectives(result.objectives || '');
        setSolutions(result.solutions || '');
        setNextSteps(result.nextSteps || '');

        // Verificar se mentor já existe
        const mentorExists = existingMentors.some(m => m.name.toLowerCase() === mName.trim().toLowerCase());
        if (mName && !mentorExists) {
          setIsNewMentorPrompt(true);
          setCreateMentorChecked(true);
          setMentorArea(result.objectives ? 'Mentoria B-LEED' : 'Técnica');
        } else {
          setIsNewMentorPrompt(false);
        }
      } else if (result.formType === 'evolucao_coletiva') {
        setIsNewMentorPrompt(false);
        setInvitedTeam(result.invitedTeam || '');
        setMeetingObjectives(result.meetingObjectives || '');
        setSolutionsFound(result.solutionsFound || '');
        setNextSteps(result.nextSteps || '');
      } else if (result.formType === 'desenvolvimento_autonomo') {
        setIsNewMentorPrompt(false);
        setCourseName(result.courseName || '');
        setCourseObjectives(result.courseObjectives || '');
        setCourseSyllabus(result.courseSyllabus || '');
        setKeyLearnings(result.keyLearnings || '');
      }
    } catch (err: any) {
      console.error('Scan processing error:', err);
      setScanError(err.message || 'Erro ao processar o formulário com a IA. Você pode preencher os campos manualmente.');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleParticipant = (member: string) => {
    setParticipants(prev =>
      prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member]
    );
  };

  // ─── Salvar Registro no Sistema ────────────────────────────────────────────
  const handleSaveToSystem = async () => {
    if (!date) { alert('Informe a data do formulário.'); return; }
    if (participants.length === 0) { alert('Selecione pelo menos um membro participante.'); return; }

    setIsSubmitting(true);

    try {
      if (formType === 'mentorias') {
        if (!mentorName.trim()) { alert('Informe o nome do mentor.'); setIsSubmitting(false); return; }
        if (!objectives.trim() || !solutions.trim() || !nextSteps.trim()) {
          alert('Preencha os objetivos, soluções e próximos passos da mentoria.');
          setIsSubmitting(false);
          return;
        }

        // Se o usuário confirmou criação de novo mentor antes de salvar
        let finalMentorId: string | undefined = undefined;
        const foundExisting = existingMentors.find(m => m.name.toLowerCase() === mentorName.trim().toLowerCase());
        if (foundExisting) {
          finalMentorId = foundExisting.id;
        }

        const payload = {
          action: 'addRecord',
          mentorId: finalMentorId,
          mentorName: mentorName.trim(),
          date,
          workloadHours: Number(workloadHours) || 2,
          area: mentorArea.trim() || 'Mentoria B-LEED',
          participants,
          objectives: objectives.trim(),
          solutions: solutions.trim(),
          nextSteps: nextSteps.trim(),
          imageLinks: [],
          createdBy: currentUser,
        };

        const res = await fetch('/api/mentors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Erro ao salvar mentoria.');

        // Atualizar lista de mentores locais
        fetchMetadata();

        setSubmitSuccess({
          type: 'Mentorias Estratégicas',
          title: `Mentoria com ${mentorName.trim()}`,
          viewTarget: 'mentor_management'
        });
      } else if (formType === 'evolucao_coletiva') {
        if (!invitedTeam.trim()) { alert('Informe o nome da equipe convidada.'); setIsSubmitting(false); return; }
        if (!meetingObjectives.trim() || !solutionsFound.trim() || !nextSteps.trim()) {
          alert('Preencha os objetivos, soluções e próximos passos da reunião.');
          setIsSubmitting(false);
          return;
        }

        const payloadForm = {
          type: 'collective_evolution',
          date,
          workloadHours: Number(workloadHours) || 2,
          invitedTeam: invitedTeam.trim(),
          participants,
          meetingObjectives: meetingObjectives.trim(),
          solutionsFound: solutionsFound.trim(),
          nextSteps: nextSteps.trim(),
        };

        const res = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser,
            form: payloadForm,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Erro ao salvar formulário.');

        setSubmitSuccess({
          type: 'Evolução Coletiva',
          title: `Reunião com ${invitedTeam.trim()}`,
          viewTarget: 'forms'
        });
      } else if (formType === 'desenvolvimento_autonomo') {
        if (!courseName.trim()) { alert('Informe o nome do curso.'); setIsSubmitting(false); return; }
        if (!courseObjectives.trim() || !courseSyllabus.trim() || !keyLearnings.trim()) {
          alert('Preencha os objetivos, ementa e principais pontos aprendidos.');
          setIsSubmitting(false);
          return;
        }

        const payloadForm = {
          type: 'autonomous_dev',
          date,
          workloadHours: Number(workloadHours) || 2,
          courseName: courseName.trim(),
          participants,
          courseObjectives: courseObjectives.trim(),
          courseSyllabus: courseSyllabus.trim(),
          keyLearnings: keyLearnings.trim(),
        };

        const res = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser,
            form: payloadForm,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Erro ao salvar formulário.');

        setSubmitSuccess({
          type: 'Desenvolvimento Autônomo',
          title: courseName.trim(),
          viewTarget: 'forms'
        });
      }
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar formulário no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    setImageSrc(null);
    setIsScanning(false);
    setScanError(null);
    setSubmitSuccess(null);
    setIsNewMentorPrompt(false);
    setDate(new Date().toISOString().split('T')[0]);
    setWorkloadHours(2);
    setParticipants(currentUser ? [currentUser] : []);
    setMentorName(''); setMentorArea(''); setMentorOrg('');
    setObjectives(''); setSolutions(''); setNextSteps('');
    setInvitedTeam(''); setMeetingObjectives(''); setSolutionsFound('');
    setCourseName(''); setCourseObjectives(''); setCourseSyllabus(''); setKeyLearnings('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-glow-primary">
              <ScanLine className="w-7 h-7 text-white" />
            </div>
            Scan B-Leed
          </h1>
          <p className="text-text-secondary text-sm mt-1.5">
            Tire uma foto ou faça upload da sua ficha impressa B-Leed para preenchimento e cadastro automático com IA.
          </p>
        </div>

        {imageSrc && (
          <button
            onClick={resetAll}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Escanear Outro
          </button>
        )}
      </div>

      {/* ═══════════════ UPLOAD & SCAN DROPZONE (Quando sem imagem) ═══════════════ */}
      {!imageSrc && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="md:col-span-2">
            <div
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className="relative border-2 border-dashed border-white/15 hover:border-accent-primary/60 rounded-3xl p-10 text-center bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center min-h-[380px] group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary mb-4 group-hover:scale-110 transition-transform shadow-glow-primary">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Arraste a foto da folha B-Leed aqui</h3>
              <p className="text-text-secondary text-xs max-w-md mb-6">
                Compatível com fotos de formulários de <strong>Mentorias Estratégicas</strong>, <strong>Evolução Coletiva</strong> e <strong>Desenvolvimento Autônomo</strong>.
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="px-5 py-2.5 rounded-xl bg-accent-primary hover:opacity-90 text-white font-bold text-xs shadow-glow-primary transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Selecionar Arquivo
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-emerald-400" /> Tirar Foto com a Câmera
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
          </div>

          {/* Card Explicativo com os 3 Formulários */}
          <div className="space-y-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Formulários Suportados:
              </h3>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <GraduationCap className="w-4 h-4" /> 1. Mentorias Estratégicas
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Detecta mentor, objetivos, soluções e próximos passos. Cria o mentor automaticamente se não existir.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Users className="w-4 h-4" /> 2. Evolução Coletiva
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Detecta equipe convidada, objetivos da reunião e ações para o repositório de formulários.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                    <BookOpen className="w-4 h-4" /> 3. Desenvolvimento Autônomo
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Extrai nome do curso, ementa, objetivos e aprendizados dos membros.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TELA DE REVISÃO E PROCESSAMENTO ═══════════════ */}
      {imageSrc && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Imagem Original com Controles de Zoom */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-[#121525] border border-white/10 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-white/70 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-accent-primary" /> Imagem Escaneada
                </span>
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.2))}
                    className="p-1 rounded hover:bg-white/10 text-white/80"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-white/60 px-1">
                    {(zoomLevel * 100).toFixed(0)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                    className="p-1 rounded hover:bg-white/10 text-white/80"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1 rounded hover:bg-white/10 text-white/80"
                    title="Reset Zoom"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Box da Foto com Scroll e Zoom */}
              <div className="relative w-full h-[520px] bg-black/60 rounded-xl overflow-auto flex items-start justify-center p-2 border border-white/5 custom-scrollbar">
                <img
                  src={imageSrc}
                  alt="Formulário B-Leed"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out' }}
                  className="max-w-full rounded shadow-lg object-contain"
                />

                {isScanning && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-accent-primary/20 border-t-accent-primary animate-spin" />
                      <ScanLine className="w-8 h-8 text-accent-primary absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-black text-white">Analisando Caligrafia...</p>
                      <p className="text-xs text-text-secondary max-w-xs">
                        Gemini Vision identificando formulário e extraindo textos
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Formulário Interativo de Revisão e Correção */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#16192a] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">
              {/* Seletor do Tipo de Formulário com Badge Inteligente */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-accent-primary block mb-0.5">
                    Conferência e Correção
                  </span>
                  <h2 className="text-lg font-black text-white">Campos Identificados</h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary font-bold">Tipo:</span>
                  <select
                    value={formType}
                    onChange={(e) => {
                      setFormType(e.target.value as any);
                      setIsNewMentorPrompt(false);
                    }}
                    className="bg-[#1b1f35] border border-white/15 text-white font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-accent-primary"
                  >
                    <option value="mentorias">Mentorias Estratégicas</option>
                    <option value="evolucao_coletiva">Evolução Coletiva</option>
                    <option value="desenvolvimento_autonomo">Desenvolvimento Autônomo</option>
                  </select>
                </div>
              </div>

              {scanError && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Alerta de Novo Mentor Detectado (se aplicável) */}
              {formType === 'mentorias' && isNewMentorPrompt && mentorName && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-blue-500/15 to-indigo-500/15 border border-blue-500/30 space-y-2.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        Novo Mentor Identificado: <span className="text-blue-300">"{mentorName}"</span>
                      </h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Este mentor ainda não consta no cadastro da equipe. Deseja criar o perfil dele automaticamente ao salvar?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                      <input
                        type="checkbox"
                        checked={createMentorChecked}
                        onChange={(e) => setCreateMentorChecked(e.target.checked)}
                        className="rounded bg-black/40 border-white/20 text-blue-500 focus:ring-0 w-4 h-4"
                      />
                      <span>Criar perfil de mentor no sistema</span>
                    </label>

                    {createMentorChecked && (
                      <input
                        type="text"
                        value={mentorArea}
                        onChange={(e) => setMentorArea(e.target.value)}
                        placeholder="Área de atuação (ex: Mecânica, Robótica)"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-blue-400"
                      />
                    )}
                  </div>
                </motion.div>
              )}

              {/* ─── Campos Gerais: Data e Carga Horária ─── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Data do Formulário *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Carga Horária (h) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={workloadHours}
                    onChange={(e) => setWorkloadHours(e.target.value)}
                    placeholder="Ex: 2"
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              {/* ─── Campos Específicos por Tipo ─── */}
              {formType === 'mentorias' && (
                <div className="space-y-4">
                  <div>
                    <label className={LABEL_CLS}>Mentor Convidado *</label>
                    <input
                      type="text"
                      value={mentorName}
                      onChange={(e) => {
                        setMentorName(e.target.value);
                        const exists = existingMentors.some(m => m.name.toLowerCase() === e.target.value.trim().toLowerCase());
                        setIsNewMentorPrompt(!exists && e.target.value.trim().length > 0);
                      }}
                      placeholder="Ex: Alexandre Santos"
                      className={INPUT_CLS}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-blue-400 uppercase tracking-wider mb-1.5">
                      🎯 Objetivos da Mentoria *
                    </label>
                    <textarea
                      rows={2}
                      value={objectives}
                      onChange={(e) => setObjectives(e.target.value)}
                      placeholder="Objetivos definidos para a mentoria..."
                      className={TEXTAREA_CLS}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-emerald-400 uppercase tracking-wider mb-1.5">
                      💡 Soluções Encontradas *
                    </label>
                    <textarea
                      rows={2}
                      value={solutions}
                      onChange={(e) => setSolutions(e.target.value)}
                      placeholder="Soluções e orientações transmitidas pelo mentor..."
                      className={TEXTAREA_CLS}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-amber-400 uppercase tracking-wider mb-1.5">
                      🚀 Próximos Passos *
                    </label>
                    <textarea
                      rows={2}
                      value={nextSteps}
                      onChange={(e) => setNextSteps(e.target.value)}
                      placeholder="Próximas ações que a equipe executará..."
                      className={TEXTAREA_CLS}
                    />
                  </div>
                </div>
              )}

              {formType === 'evolucao_coletiva' && (
                <div className="space-y-4">
                  <div>
                    <label className={LABEL_CLS}>Equipe Convidada / Parceira *</label>
                    <input
                      type="text"
                      value={invitedTeam}
                      onChange={(e) => setInvitedTeam(e.target.value)}
                      placeholder="Ex: Equipe Stark 12345"
                      className={INPUT_CLS}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-blue-400 uppercase tracking-wider mb-1.5">
                      🎯 Objetivos da Reunião *
                    </label>
                    <textarea
                      rows={2}
                      value={meetingObjectives}
                      onChange={(e) => setMeetingObjectives(e.target.value)}
                      placeholder="Objetivos da reunião com a outra equipe..."
                      className={TEXTAREA_CLS}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-emerald-400 uppercase tracking-wider mb-1.5">
                      💡 Soluções Encontradas *
                    </label>
                    <textarea
                      rows={2}
                      value={solutionsFound}
                      onChange={(e) => setSolutionsFound(e.target.value)}
                      placeholder="Soluções, ideias e sinergias desenvolvidas..."
                      className={TEXTAREA_CLS}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-amber-400 uppercase tracking-wider mb-1.5">
                      🚀 Próximos Passos *
                    </label>
                    <textarea
                      rows={2}
                      value={nextSteps}
                      onChange={(e) => setNextSteps(e.target.value)}
                      placeholder="Ações e próximos contatos acordados..."
                      className={TEXTAREA_CLS}
                    />
                  </div>
                </div>
              )}

              {formType === 'desenvolvimento_autonomo' && (
                <div className="space-y-4">
                  <div>
                    <label className={LABEL_CLS}>Nome do Curso / Formação *</label>
                    <input
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Ex: Curso de Java para FTC e Odometria"
                      className={INPUT_CLS}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-blue-400 uppercase tracking-wider mb-1.5">
                      🎯 Objetivos do Curso *
                    </label>
                    <textarea
                      rows={2}
                      value={courseObjectives}
                      onChange={(e) => setCourseObjectives(e.target.value)}
                      placeholder="O que o curso visa capacitar..."
                      className={TEXTAREA_CLS}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-purple-400 uppercase tracking-wider mb-1.5">
                      📚 Ementa do Curso *
                    </label>
                    <textarea
                      rows={2}
                      value={courseSyllabus}
                      onChange={(e) => setCourseSyllabus(e.target.value)}
                      placeholder="Tópicos e módulos estudados..."
                      className={TEXTAREA_CLS}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-emerald-400 uppercase tracking-wider mb-1.5">
                      💡 Principais Pontos Aprendidos *
                    </label>
                    <textarea
                      rows={2}
                      value={keyLearnings}
                      onChange={(e) => setKeyLearnings(e.target.value)}
                      placeholder="Lições e conhecimentos adquiridos..."
                      className={TEXTAREA_CLS}
                    />
                  </div>
                </div>
              )}

              {/* ─── Membros Participantes ─── */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLS}>Membros Participantes * ({participants.length})</label>
                  <span className="text-[10px] text-text-muted">Clique para alternar presença</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-black/20 border border-white/10 custom-scrollbar">
                  {availableMembers.map((member) => {
                    const isSelected = participants.includes(member);
                    return (
                      <button
                        key={member}
                        type="button"
                        onClick={() => toggleParticipant(member)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/40 font-bold'
                            : 'bg-white/5 text-text-muted border-white/5 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded flex items-center justify-center border ${isSelected ? 'bg-accent-primary border-accent-primary' : 'border-white/20'}`}>
                          {isSelected && <Check className="w-2 h-2 text-white" />}
                        </div>
                        {member}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={resetAll}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white font-bold text-xs transition-all"
                >
                  Cancelar Scan
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || isScanning}
                  onClick={handleSaveToSystem}
                  className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-bold text-sm shadow-glow-primary hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando Registro...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Confirmar e Adicionar ao Sistema</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL DE SUCESSO ═══════════════ */}
      <AnimatePresence>
        {submitSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#16192a] border border-emerald-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl z-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-glow-green">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
                  {submitSuccess.type} Cadastrado!
                </span>
                <h3 className="text-xl font-black text-white">{submitSuccess.title}</h3>
                <p className="text-xs text-text-secondary">
                  Os dados foram salvos no banco de dados e sincronizados com a equipe.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {onNavigate && (
                  <button
                    onClick={() => {
                      onNavigate(submitSuccess.viewTarget);
                    }}
                    className="w-full py-2.5 rounded-xl bg-accent-primary hover:opacity-90 text-white font-bold text-xs shadow-glow-primary transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Ver na aba correspondente</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={resetAll}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all"
                >
                  Escanear Novo Formulário
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
