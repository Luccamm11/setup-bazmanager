// components/competitions/AwardsEvaluations.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Award, Timer, Play, Pause, RotateCcw, Plus, CheckCircle2,
  Circle, Clock, Users, Star, MessageSquare, AlertTriangle, ShieldCheck,
  Trash2, Edit3, Save, Sparkles, X, FileText, Check, ChevronRight,
  Volume2, VolumeX, FastForward, Info
} from 'lucide-react';
import {
  CompetitionEvent, CompetitionAwardItem, CompetitionAwardStatus,
  PitchTopicItem, PitchPracticeSession, FormalJudgingSession,
  PitInterviewLog, JudgeRubricScore, UserRole
} from '../../types';
import { ALL_MEMBERS } from '../../data/members';
import { CANONICAL_FTC_AWARDS, DEFAULT_PITCH_TOPICS, DEFAULT_JUDGE_RUBRICS, createDefaultAwardsEvaluationsHub } from '../../data/initialAwardsEvaluationsData';

interface AwardsEvaluationsProps {
  event: CompetitionEvent;
  currentUser: string;
  userRole: UserRole;
  onServerSync: (action: string, payload: any) => Promise<void>;
}

export const AwardsEvaluations: React.FC<AwardsEvaluationsProps> = ({
  event,
  currentUser,
  userRole,
  onServerSync,
}) => {
  const isTech = userRole === 'technician' || ['Jonas', 'Ramon'].includes(currentUser);

  // Sub-abas internas do módulo
  const [activeSubTab, setActiveSubTab] = useState<'awards' | 'pitch' | 'formal' | 'pit'>('awards');

  // Inicialização segura dos dados de Prêmios & Avaliações
  const hub = useMemo(() => {
    if (event.awardsEvaluations && event.awardsEvaluations.awards?.length > 0) {
      return event.awardsEvaluations;
    }
    return createDefaultAwardsEvaluationsHub();
  }, [event.awardsEvaluations]);

  // ───────────────────────────────────────────────────────────────────────────
  // 1. ABA: PRÊMIOS & CONQUISTAS (AWARDS TRACKER)
  // ───────────────────────────────────────────────────────────────────────────
  const [awardStatusFilter, setAwardStatusFilter] = useState<string>('all');
  const [awardSearchQuery, setAwardSearchQuery] = useState('');
  const [editingAward, setEditingAward] = useState<CompetitionAwardItem | null>(null);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [isXpAwardModalOpen, setIsXpAwardModalOpen] = useState(false);
  const [selectedAwardForXp, setSelectedAwardForXp] = useState<CompetitionAwardItem | null>(null);
  const [xpCustomAmount, setXpCustomAmount] = useState<number>(100);
  const [xpSelectedRecipients, setXpSelectedRecipients] = useState<string[]>([]);
  const [isGrantingXp, setIsGrantingXp] = useState(false);

  // Filtro de Prêmios
  const filteredAwards = useMemo(() => {
    return hub.awards.filter(award => {
      const matchStatus = awardStatusFilter === 'all' || award.status === awardStatusFilter;
      const matchSearch =
        award.name.toLowerCase().includes(awardSearchQuery.toLowerCase()) ||
        award.description.toLowerCase().includes(awardSearchQuery.toLowerCase()) ||
        (award.awardedTo || []).some(m => m.toLowerCase().includes(awardSearchQuery.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [hub.awards, awardStatusFilter, awardSearchQuery]);

  // Estatísticas de Prêmios
  const awardStats = useMemo(() => {
    const total = hub.awards.length;
    const winners = hub.awards.filter(a => a.status === 'winner').length;
    const finalists = hub.awards.filter(a => a.status === 'finalist_2nd' || a.status === 'finalist_3rd').length;
    const nominated = hub.awards.filter(a => a.status === 'nominated').length;
    const inContention = hub.awards.filter(a => a.status === 'in_contention').length;
    return { total, winners, finalists, nominated, inContention };
  }, [hub.awards]);

  const handleUpdateAwardStatus = async (award: CompetitionAwardItem, status: CompetitionAwardStatus) => {
    const updated = {
      ...award,
      status,
      updatedBy: currentUser,
      updatedAt: new Date().toISOString(),
    };
    await onServerSync('upsert_award', updated);
  };

  const handleSaveAwardModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAward || !editingAward.name.trim()) return;
    await onServerSync('upsert_award', editingAward);
    setIsAwardModalOpen(false);
    setEditingAward(null);
  };

  const handleDeleteAward = async (awardId: string) => {
    if (!isTech) return;
    if (confirm('Tem certeza que deseja excluir este prêmio?')) {
      await onServerSync('delete_award', { awardId });
    }
  };

  const handleOpenGrantXp = (award: CompetitionAwardItem) => {
    setSelectedAwardForXp(award);
    setXpCustomAmount(award.xpValue || 100);
    // Padrão: membros atribuídos ao prêmio ou todos os membros
    const defaultRecipients = award.awardedTo && award.awardedTo.length > 0
      ? award.awardedTo
      : ALL_MEMBERS.map(m => m.username);
    setXpSelectedRecipients(defaultRecipients);
    setIsXpAwardModalOpen(true);
  };

  const handleConfirmGrantXp = async () => {
    if (!isTech || !selectedAwardForXp) return;
    setIsGrantingXp(true);
    try {
      await onServerSync('award_competition_xp', {
        awardId: selectedAwardForXp.id,
        recipients: xpSelectedRecipients,
        xpAmount: xpCustomAmount,
      });
      setIsXpAwardModalOpen(false);
      setSelectedAwardForXp(null);
    } catch (err) {
      console.error('Error granting competition XP:', err);
    } finally {
      setIsGrantingXp(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 2. ABA: SIMULADOR DE PITCH & CHECKLIST DE FALAS
  // ───────────────────────────────────────────────────────────────────────────
  const [pitchPhase, setPitchPhase] = useState<'pitch' | 'qa'>('pitch');
  const [timeRemaining, setTimeRemaining] = useState<number>(hub.pitchPractice.pitchDurationSeconds || 300);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState<boolean>(false);
  const [editingTopic, setEditingTopic] = useState<PitchTopicItem | null>(null);

  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Se terminou a fase de pitch, transita automaticamente para QA se desejado
            if (pitchPhase === 'pitch') {
              setPitchPhase('qa');
              return hub.pitchPractice.qaDurationSeconds || 300;
            } else {
              setTimerRunning(false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, pitchPhase, hub.pitchPractice.pitchDurationSeconds, hub.pitchPractice.qaDurationSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPauseTimer = () => {
    setTimerRunning(prev => !prev);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimeRemaining(pitchPhase === 'pitch' ? (hub.pitchPractice.pitchDurationSeconds || 300) : (hub.pitchPractice.qaDurationSeconds || 300));
  };

  const handleSwitchPhase = (phase: 'pitch' | 'qa') => {
    setTimerRunning(false);
    setPitchPhase(phase);
    setTimeRemaining(phase === 'pitch' ? (hub.pitchPractice.pitchDurationSeconds || 300) : (hub.pitchPractice.qaDurationSeconds || 300));
  };

  const handleToggleTopic = async (topicId: string) => {
    const updatedTopics = hub.pitchPractice.topics.map(t =>
      t.id === topicId ? { ...t, completed: !t.completed } : t
    );
    await onServerSync('save_pitch_practice', {
      ...hub.pitchPractice,
      topics: updatedTopics,
    });
  };

  const handleClearTopicChecks = async () => {
    const clearedTopics = hub.pitchPractice.topics.map(t => ({ ...t, completed: false }));
    await onServerSync('save_pitch_practice', {
      ...hub.pitchPractice,
      topics: clearedTopics,
    });
  };

  const handleSaveTopicModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !editingTopic.title.trim()) return;

    let updatedTopics = [...hub.pitchPractice.topics];
    const idx = updatedTopics.findIndex(t => t.id === editingTopic.id);
    if (idx >= 0) {
      updatedTopics[idx] = editingTopic;
    } else {
      updatedTopics.push({
        ...editingTopic,
        id: `pt-${Date.now()}`,
        order: updatedTopics.length + 1,
        completed: false,
      });
    }

    await onServerSync('save_pitch_practice', {
      ...hub.pitchPractice,
      topics: updatedTopics,
    });
    setIsNewTopicModalOpen(false);
    setEditingTopic(null);
  };

  const handleDeleteTopic = async (topicId: string) => {
    const updatedTopics = hub.pitchPractice.topics.filter(t => t.id !== topicId);
    await onServerSync('save_pitch_practice', {
      ...hub.pitchPractice,
      topics: updatedTopics,
    });
  };

  const handleSaveRehearsalLog = async () => {
    const completedCount = hub.pitchPractice.topics.filter(t => t.completed).length;
    const totalCount = hub.pitchPractice.topics.length;
    const newLog = {
      id: `reh-${Date.now()}`,
      date: new Date().toISOString(),
      durationSeconds: (pitchPhase === 'pitch' ? hub.pitchPractice.pitchDurationSeconds : hub.pitchPractice.qaDurationSeconds) - timeRemaining,
      completedTopicsCount: completedCount,
      totalTopicsCount: totalCount,
      conductedBy: currentUser,
      notes: `Ensaio ${pitchPhase === 'pitch' ? 'Apresentação' : 'Q&A'}: ${completedCount}/${totalCount} tópicos cobertos.`,
    };
    const history = [newLog, ...(hub.pitchPractice.rehearsalsHistory || [])];
    await onServerSync('save_pitch_practice', {
      ...hub.pitchPractice,
      rehearsalsHistory: history,
      lastRehearsalAt: new Date().toISOString(),
    });
    alert('Rodada de ensaio gravada com sucesso no histórico!');
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 3. ABA: SALA DOS JUÍZES / FORMAL JUDGING
  // ───────────────────────────────────────────────────────────────────────────
  const [formalSession, setFormalSession] = useState<FormalJudgingSession>(hub.formalJudging);
  const [newQuestionInput, setNewQuestionInput] = useState('');
  const [newActionItemInput, setNewActionItemInput] = useState('');
  const [isSavingFormal, setIsSavingFormal] = useState(false);

  useEffect(() => {
    setFormalSession(hub.formalJudging);
  }, [hub.formalJudging]);

  const handleUpdateRubric = (index: number, score: number) => {
    const levels: JudgeRubricScore['level'][] = ['beginning', 'developing', 'developing', 'accomplished', 'exemplary'];
    const updatedRubrics = [...formalSession.rubrics];
    updatedRubrics[index] = {
      ...updatedRubrics[index],
      score,
      level: levels[Math.max(0, score - 1)] || 'accomplished',
    };
    setFormalSession(prev => ({ ...prev, rubrics: updatedRubrics }));
  };

  const handleSaveFormalSession = async () => {
    setIsSavingFormal(true);
    try {
      await onServerSync('save_formal_judging', formalSession);
    } finally {
      setIsSavingFormal(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestionInput.trim()) return;
    setFormalSession(prev => ({
      ...prev,
      questionsReceived: [...prev.questionsReceived, newQuestionInput.trim()],
    }));
    setNewQuestionInput('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setFormalSession(prev => ({
      ...prev,
      questionsReceived: prev.questionsReceived.filter((_, i) => i !== idx),
    }));
  };

  const handleAddActionItem = () => {
    if (!newActionItemInput.trim()) return;
    setFormalSession(prev => ({
      ...prev,
      immediateActionItems: [...prev.immediateActionItems, newActionItemInput.trim()],
    }));
    setNewActionItemInput('');
  };

  const handleRemoveActionItem = (idx: number) => {
    setFormalSession(prev => ({
      ...prev,
      immediateActionItems: prev.immediateActionItems.filter((_, i) => i !== idx),
    }));
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 4. ABA: ENTREVISTAS NO PIT (PIT INTERVIEWS)
  // ───────────────────────────────────────────────────────────────────────────
  const [isNewInterviewModalOpen, setIsNewInterviewModalOpen] = useState(false);
  const [newInterviewArea, setNewInterviewArea] = useState<PitInterviewLog['judgeArea']>('engineering');
  const [newInterviewJudgeNames, setNewInterviewJudgeNames] = useState('');
  const [newInterviewResponders, setNewInterviewResponders] = useState<string[]>([]);
  const [newInterviewQuestions, setNewInterviewQuestions] = useState('');
  const [newInterviewFeedback, setNewInterviewFeedback] = useState('');
  const [newInterviewImpression, setNewInterviewImpression] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [newInterviewFollowUp, setNewInterviewFollowUp] = useState('');

  const handleSavePitInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterviewQuestions.trim() && !newInterviewFeedback.trim()) return;

    const payload: Omit<PitInterviewLog, 'id' | 'loggedBy'> = {
      timestamp: new Date().toISOString(),
      judgeArea: newInterviewArea,
      judgeNames: newInterviewJudgeNames.trim() || undefined,
      teamResponders: newInterviewResponders,
      questionsAsked: newInterviewQuestions.trim(),
      feedbackGiven: newInterviewFeedback.trim(),
      impressionRating: newInterviewImpression,
      followUpRequired: newInterviewFollowUp.trim() || undefined,
    };

    await onServerSync('add_pit_interview', payload);
    setIsNewInterviewModalOpen(false);
    setNewInterviewJudgeNames('');
    setNewInterviewResponders([]);
    setNewInterviewQuestions('');
    setNewInterviewFeedback('');
    setNewInterviewImpression(4);
    setNewInterviewFollowUp('');
  };

  const handleDeletePitInterview = async (interviewId: string) => {
    if (confirm('Deseja excluir este registro de entrevista?')) {
      await onServerSync('delete_pit_interview', { interviewId });
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── NAVEGAÇÃO DE SUB-ABAS ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-primary/40 border border-white/5 p-4 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveSubTab('awards')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
              activeSubTab === 'awards'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy size={15} />
            <span>Prêmios Oficiais ({hub.awards.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pitch')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
              activeSubTab === 'pitch'
                ? 'bg-blue-600 text-white shadow-glow-primary'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <Timer size={15} />
            <span>Simulador & Checklist de Fala</span>
          </button>

          <button
            onClick={() => setActiveSubTab('formal')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
              activeSubTab === 'formal'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText size={15} />
            <span>Sala dos Juízes</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
              activeSubTab === 'pit'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={15} />
            <span>Entrevistas no Pit ({hub.pitInterviews.length})</span>
          </button>
        </div>

        {/* Status rápido do torneio */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="text-text-muted">Torneio:</span>
          <span className="font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
            {event.name}
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          VISTA 1: PRÊMIOS OFICIAIS & TROFÉUS (AWARDS TRACKER)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'awards' && (
        <div className="space-y-6">
          {/* Métricas dos Prêmios */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-primary/40 border border-emerald-500/20 flex flex-col justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy size={14} /> Conquistados (1º)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white mt-2">{awardStats.winners}</span>
            </div>

            <div className="p-4 rounded-xl bg-primary/40 border border-blue-500/20 flex flex-col justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} /> Finalistas (2º / 3º)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white mt-2">{awardStats.finalists}</span>
            </div>

            <div className="p-4 rounded-xl bg-primary/40 border border-cyan-500/20 flex flex-col justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Star size={14} /> Indicados
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white mt-2">{awardStats.nominated}</span>
            </div>

            <div className="p-4 rounded-xl bg-primary/40 border border-amber-500/20 flex flex-col justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> Em Disputa
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white mt-2">{awardStats.inContention}</span>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'winner', label: '🏆 Campeão' },
                { id: 'finalist_2nd', label: '🥈 2º Lugar' },
                { id: 'finalist_3rd', label: '🥉 3º Lugar' },
                { id: 'nominated', label: '⭐ Indicado' },
                { id: 'in_contention', label: '🎯 Em Disputa' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAwardStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    awardStatusFilter === f.id
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-text-muted hover:text-white bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar prêmio ou responsável..."
                value={awardSearchQuery}
                onChange={e => setAwardSearchQuery(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50 w-full sm:w-60"
              />

              <button
                onClick={() => {
                  setEditingAward({
                    id: `award-custom-${Date.now()}`,
                    name: '',
                    category: 'custom',
                    description: '',
                    officialFtc: false,
                    status: 'in_contention',
                    xpValue: 80,
                    xpAwarded: false,
                    awardedTo: [],
                    notes: '',
                  });
                  setIsAwardModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow-md"
              >
                <Plus size={14} />
                <span>Novo Prêmio</span>
              </button>
            </div>
          </div>

          {/* Grid de Cards de Prêmios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAwards.map(award => {
              const isWinner = award.status === 'winner';
              const isFinalist = award.status === 'finalist_2nd' || award.status === 'finalist_3rd';
              const isNominated = award.status === 'nominated';

              return (
                <div
                  key={award.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                    isWinner
                      ? 'bg-gradient-to-br from-amber-500/15 via-emerald-950/20 to-black/40 border-amber-500/40 shadow-glow-primary'
                      : isFinalist
                      ? 'bg-gradient-to-br from-blue-500/10 to-black/40 border-blue-500/30'
                      : isNominated
                      ? 'bg-gradient-to-br from-cyan-500/10 to-black/40 border-cyan-500/30'
                      : 'bg-primary/40 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Topo do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2.5 rounded-xl ${
                            isWinner
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : isFinalist
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-white/5 text-text-muted'
                          }`}
                        >
                          <Trophy size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-black text-white text-base leading-tight">{award.name}</h4>
                            {award.officialFtc && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase tracking-wider border border-blue-500/30">
                                FTC
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-text-muted uppercase tracking-wider">
                            Categoria: {award.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingAward(award);
                            setIsAwardModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5"
                          title="Editar Detalhes"
                        >
                          <Edit3 size={13} />
                        </button>
                        {isTech && (
                          <button
                            onClick={() => handleDeleteAward(award.id)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10"
                            title="Excluir Prêmio"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                      {award.description}
                    </p>

                    {/* Membros responsáveis */}
                    {award.awardedTo && award.awardedTo.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-text-muted font-bold">Defesa:</span>
                        {award.awardedTo.map(m => (
                          <span
                            key={m}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/5 font-semibold"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Anotações / Estratégia de conquista */}
                    {award.notes && (
                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px] text-text-muted italic">
                        "{award.notes}"
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Card: Status & Concessão de XP */}
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        Status Oficial:
                      </span>
                      <select
                        value={award.status}
                        onChange={e => handleUpdateAwardStatus(award, e.target.value as CompetitionAwardStatus)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer border ${
                          isWinner
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isFinalist
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : isNominated
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-black/40 text-text-secondary border-white/10'
                        }`}
                      >
                        <option value="in_contention" className="bg-primary text-white">🎯 Em Disputa</option>
                        <option value="nominated" className="bg-primary text-white">⭐ Indicado / Sala</option>
                        <option value="winner" className="bg-primary text-emerald-400">🏆 1º Lugar / Campeão</option>
                        <option value="finalist_2nd" className="bg-primary text-blue-400">🥈 2º Lugar / Finalista</option>
                        <option value="finalist_3rd" className="bg-primary text-amber-400">🥉 3º Lugar</option>
                        <option value="not_targeted" className="bg-primary text-text-muted">⚪ Não Alvo</option>
                      </select>
                    </div>

                    {/* Botão de Concessão de XP Oficial (somente quando houver mérito ou técnico decidir) */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles size={12} />
                        <span>+{award.xpValue || 100} XP</span>
                      </div>

                      {award.xpAwarded ? (
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <CheckCircle2 size={11} /> Concedido por {award.xpAwardedBy}
                        </span>
                      ) : isTech ? (
                        <button
                          onClick={() => handleOpenGrantXp(award)}
                          className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md flex items-center gap-1"
                        >
                          <Trophy size={11} /> Conceder XP
                        </button>
                      ) : (
                        <span className="text-[10px] text-text-muted italic">
                          Aguardando liberação do técnico
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          VISTA 2: SIMULADOR DE APRESENTAÇÃO & CHECKLIST DE FALAS
      ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'pitch' && (
        <div className="space-y-6">
          {/* Cronômetro Oficial FIRST (5 min pitch / 5 min Q&A) */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/30 via-primary/50 to-amber-950/20 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-black uppercase tracking-wider border border-blue-500/30">
                  {pitchPhase === 'pitch' ? 'Fase 1: Apresentação Ininterrupta' : 'Fase 2: Perguntas dos Juízes (Q&A)'}
                </span>
                <span className="text-xs text-text-muted">Regra Oficial FIRST (5 min + 5 min)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Simulador de Apresentação de Sala
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary max-w-xl">
                Pratique o ensaio da fala cronometrada com a equipe e vá ticando os tópicos dinamicamente durante o ensaio para garantir que nenhum detalhe de engenharia fique de fora!
              </p>
            </div>

            {/* Display do Timer Digital */}
            <div className="flex flex-col items-center gap-3">
              <div
                className={`text-5xl sm:text-6xl font-mono font-black tracking-tight px-6 py-3 rounded-2xl border transition-all ${
                  timeRemaining <= 60
                    ? 'text-red-400 bg-red-500/20 border-red-500/40 animate-pulse'
                    : timeRemaining <= 120
                    ? 'text-amber-400 bg-amber-500/20 border-amber-500/40'
                    : 'text-white bg-black/50 border-white/15'
                }`}
              >
                {formatTimer(timeRemaining)}
              </div>

              {/* Botões do Cronômetro */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartPauseTimer}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-glow-primary ${
                    timerRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                  <span>{timerRunning ? 'Pausar' : 'Iniciar Ensaio'}</span>
                </button>

                <button
                  onClick={handleResetTimer}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/5 transition-all"
                  title="Reiniciar cronômetro"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  onClick={() => handleSwitchPhase(pitchPhase === 'pitch' ? 'qa' : 'pitch')}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-white/5 text-xs font-bold transition-all"
                  title="Alternar entre Pitch e Q&A"
                >
                  <FastForward size={14} />
                  <span>{pitchPhase === 'pitch' ? 'Ir para Q&A' : 'Voltar ao Pitch'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Checklist de Tópicos de Fala */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Roteiro de Falas & Checklist de Tópicos</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-amber-400 font-bold">
                    {hub.pitchPractice.topics.filter(t => t.completed).length} / {hub.pitchPractice.topics.length} Falados
                  </span>
                </h4>
                <p className="text-xs text-text-secondary">
                  Clique no checkbox conforme o orador cobrir o tópico durante a fala.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearTopicChecks}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white text-xs font-bold border border-white/5 transition-all"
                >
                  Limpar Seleções
                </button>

                <button
                  onClick={handleSaveRehearsalLog}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-primary"
                >
                  Gravar Rodada
                </button>

                <button
                  onClick={() => {
                    setEditingTopic({
                      id: `pt-${Date.now()}`,
                      title: '',
                      speaker: ALL_MEMBERS[0]?.username || '',
                      targetDurationSeconds: 45,
                      completed: false,
                      notes: '',
                      order: hub.pitchPractice.topics.length + 1,
                    });
                    setIsNewTopicModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  <Plus size={14} />
                  <span>Novo Tópico</span>
                </button>
              </div>
            </div>

            {/* Lista dos Tópicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hub.pitchPractice.topics.map((topic, idx) => (
                <div
                  key={topic.id}
                  onClick={() => handleToggleTopic(topic.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    topic.completed
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100 shadow-sm'
                      : 'bg-primary/40 border-white/5 hover:border-white/15 text-white'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {topic.completed ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Circle size={20} className="text-text-muted hover:text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-bold truncate ${topic.completed ? 'line-through text-text-muted' : 'text-white'}`}>
                        {topic.title}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {topic.speaker && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                            {topic.speaker}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted font-mono">
                          ~{topic.targetDurationSeconds}s
                        </span>
                      </div>
                    </div>

                    {topic.notes && (
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                        {topic.notes}
                      </p>
                    )}
                  </div>

                  {/* Ações do Tópico */}
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTopic(topic);
                        setIsNewTopicModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                      title="Editar tópico"
                      aria-label="Editar tópico"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Excluir tópico"
                      aria-label="Excluir tópico"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Histórico dos Ensaios */}
            {hub.pitchPractice.rehearsalsHistory && hub.pitchPractice.rehearsalsHistory.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-text-muted">
                  Histórico de Ensaios Realizados
                </h5>
                <div className="space-y-2">
                  {hub.pitchPractice.rehearsalsHistory.slice(0, 5).map(reh => (
                    <div key={reh.id} className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{new Date(reh.date).toLocaleDateString('pt-BR')} às {new Date(reh.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <p className="text-text-muted mt-0.5">{reh.notes}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                          {reh.completedTopicsCount}/{reh.totalTopicsCount} Tópicos
                        </span>
                        <span className="text-text-muted font-mono">{reh.durationSeconds}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          VISTA 3: SALA DOS JUÍZES / FORMAL JUDGING
      ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'formal' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-xl font-black text-white">Sessão Formal na Sala dos Juízes</h3>
              <p className="text-xs text-text-secondary">
                Registro de horário, rubricas oficiais de avaliação da banca e anotações imediatas das perguntas e feedbacks.
              </p>
            </div>

            <button
              onClick={handleSaveFormalSession}
              disabled={isSavingFormal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-glow-primary"
            >
              <Save size={14} />
              <span>{isSavingFormal ? 'Salvando...' : 'Salvar Avaliação'}</span>
            </button>
          </div>

          {/* Dados da Sala */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-primary/40 border border-white/5">
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                Horário Agendado
              </label>
              <input
                type="text"
                placeholder="Ex: 09:30 - Sala 4"
                value={formalSession.scheduledTime || ''}
                onChange={e => setFormalSession(prev => ({ ...prev, scheduledTime: e.target.value }))}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                Sala / Painel
              </label>
              <input
                type="text"
                placeholder="Ex: Sala A3 - Juízes de Engenharia"
                value={formalSession.roomNumber || ''}
                onChange={e => setFormalSession(prev => ({ ...prev, roomNumber: e.target.value }))}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                Nomes dos Juízes
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos (Eng.), Marina (Design)..."
                value={formalSession.judgesNames || ''}
                onChange={e => setFormalSession(prev => ({ ...prev, judgesNames: e.target.value }))}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Rubricas Oficiais de Avaliação (1 a 5 estrelas) */}
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-text-muted">
              Autoavaliação das Rubricas Oficiais FIRST
            </h4>

            <div className="space-y-3">
              {formalSession.rubrics.map((rubric, idx) => (
                <div key={rubric.category} className="p-4 rounded-xl bg-primary/40 border border-white/5 space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <span className="font-bold text-sm text-white">{rubric.label}</span>
                      <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold uppercase">
                        {rubric.level}
                      </span>
                    </div>

                    {/* Classificação por estrelas (1 a 5) */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => handleUpdateRubric(idx, star)}
                          className={`p-1 transition-all ${
                            star <= rubric.score ? 'text-amber-400 scale-110' : 'text-white/20 hover:text-white/40'
                          }`}
                        >
                          <Star size={18} fill={star <= rubric.score ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-400 font-mono ml-1">{rubric.score}/5</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Comentários sobre o desempenho neste critério..."
                    value={rubric.notes || ''}
                    onChange={e => {
                      const updated = [...formalSession.rubrics];
                      updated[idx].notes = e.target.value;
                      setFormalSession(prev => ({ ...prev, rubrics: updated }));
                    }}
                    className="bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-text-secondary w-full focus:outline-none focus:border-white/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Perguntas Feitas pelos Juízes */}
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-text-muted">
              Perguntas Feitas pela Banca na Sala
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: Como o robô lida com perda de odometria no autônomo?"
                value={newQuestionInput}
                onChange={e => setNewQuestionInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddQuestion(); }}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white flex-1 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={handleAddQuestion}
                className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Adicionar Pergunta
              </button>
            </div>

            <div className="space-y-2">
              {formalSession.questionsReceived.map((q, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-white flex items-center gap-2">
                    <MessageSquare size={13} className="text-cyan-400 shrink-0" />
                    <span>{q}</span>
                  </span>
                  <button
                    onClick={() => handleRemoveQuestion(idx)}
                    className="p-1 rounded text-text-muted hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pontos Fortes & Melhorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Pontos Elogiados pela Banca
              </label>
              <textarea
                rows={4}
                placeholder="Anote aqui os mecanismos, projetos sociais ou partes do portfólio que os juízes mais gostaram..."
                value={formalSession.strongPoints || ''}
                onChange={e => setFormalSession(prev => ({ ...prev, strongPoints: e.target.value }))}
                className="bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white w-full focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} /> Dúvidas e Pontos de Atenção
              </label>
              <textarea
                rows={4}
                placeholder="O que os juízes questionaram ou acharam que faltou esclarecer melhor?"
                value={formalSession.improvementPoints || ''}
                onChange={e => setFormalSession(prev => ({ ...prev, improvementPoints: e.target.value }))}
                className="bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white w-full focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>
          </div>

          {/* Ações Imediatas para o Pit */}
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-text-muted">
              Ações Imediatas para o Pit (Antes das Visitas)
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: Deixar o portfólio aberto na página 7 para mostrar o teste do intake..."
                value={newActionItemInput}
                onChange={e => setNewActionItemInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddActionItem(); }}
                className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white flex-1 focus:outline-none focus:border-amber-500/50"
              />
              <button
                onClick={handleAddActionItem}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all"
              >
                Adicionar Ação
              </button>
            </div>

            <div className="space-y-2">
              {formalSession.immediateActionItems.map((action, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-amber-200 flex items-center gap-2">
                    <ChevronRight size={13} className="text-amber-400 shrink-0" />
                    <span>{action}</span>
                  </span>
                  <button
                    onClick={() => handleRemoveActionItem(idx)}
                    className="p-1 rounded text-text-muted hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          VISTA 4: ENTREVISTAS NO PIT (PIT INTERVIEWS)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'pit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-xl font-black text-white">Entrevistas e Visitas dos Juízes no Pit</h3>
              <p className="text-xs text-text-secondary">
                Registre cada visita que os juízes fizerem à nossa bancada, com as perguntas feitas, membros que atenderam e o nível de entusiasmo percebido.
              </p>
            </div>

            <button
              onClick={() => setIsNewInterviewModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-glow-primary"
            >
              <Plus size={14} />
              <span>Registrar Visita no Pit</span>
            </button>
          </div>

          {/* Lista de Visitas Registradas */}
          {hub.pitInterviews.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-primary/20 border border-white/5 text-text-muted space-y-2">
              <Users size={32} className="mx-auto text-text-muted/60" />
              <p className="text-sm font-bold text-white">Nenhuma visita de juiz registrada ainda no Pit.</p>
              <p className="text-xs">Quando um juiz se aproximar da bancada, anote rapidamente as perguntas para alinharmos as próximas defesas!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hub.pitInterviews.map(interview => (
                <div key={interview.id} className="p-5 rounded-2xl bg-primary/40 border border-white/5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider">
                          {interview.judgeArea}
                        </span>
                        <span className="text-xs text-text-muted">
                          {new Date(interview.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm mt-1">
                        {interview.judgeNames ? `Juízes: ${interview.judgeNames}` : 'Visita dos Juízes'}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: interview.impressionRating }).map((_, i) => (
                          <Star key={i} size={13} fill="currentColor" />
                        ))}
                      </div>
                      <button
                        onClick={() => handleDeletePitInterview(interview.id)}
                        className="p-1 rounded text-text-muted hover:text-red-400"
                        title="Excluir registro"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Membros que atenderam */}
                  {interview.teamResponders && interview.teamResponders.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-text-muted font-bold">Atendido por:</span>
                      {interview.teamResponders.map(m => (
                        <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-secondary font-semibold">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Perguntas e Feedbacks */}
                  <div className="space-y-1.5 text-xs">
                    {interview.questionsAsked && (
                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-text-muted font-bold block mb-0.5">Perguntas feitas:</span>
                        <p className="text-white leading-relaxed">{interview.questionsAsked}</p>
                      </div>
                    )}

                    {interview.feedbackGiven && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                        <span className="text-emerald-400 font-bold block mb-0.5">Feedback recebido:</span>
                        <p className="text-emerald-100 leading-relaxed">{interview.feedbackGiven}</p>
                      </div>
                    )}

                    {interview.followUpRequired && (
                      <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
                        <span className="text-amber-400 font-bold block mb-0.5">Follow-up necessário:</span>
                        <p className="text-amber-200 leading-relaxed">{interview.followUpRequired}</p>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-text-muted pt-1 border-t border-white/5">
                    Registrado por <span className="text-white font-bold">{interview.loggedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: NOVO / EDITAR PRÊMIO
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAwardModalOpen && editingAward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white">
                  {editingAward.id.includes('custom') ? 'Cadastrar Prêmio Personalizado' : 'Editar Detalhes do Prêmio'}
                </h3>
                <button
                  onClick={() => setIsAwardModalOpen(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAwardModal} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Nome do Prêmio *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAward.name}
                    onChange={e => setEditingAward({ ...editingAward, name: e.target.value })}
                    placeholder="Ex: Prêmio Conexão Comunitária..."
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Descrição & Critérios Oficiais
                  </label>
                  <textarea
                    rows={3}
                    value={editingAward.description}
                    onChange={e => setEditingAward({ ...editingAward, description: e.target.value })}
                    placeholder="Descreva o que os juízes avaliam neste prêmio..."
                    className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white w-full focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Valor em XP
                    </label>
                    <input
                      type="number"
                      value={editingAward.xpValue || 80}
                      onChange={e => setEditingAward({ ...editingAward, xpValue: Number(e.target.value) || 80 })}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Status do Prêmio
                    </label>
                    <select
                      value={editingAward.status}
                      onChange={e => setEditingAward({ ...editingAward, status: e.target.value as CompetitionAwardStatus })}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="in_contention">🎯 Em Disputa</option>
                      <option value="nominated">⭐ Indicado / Sala</option>
                      <option value="winner">🏆 1º Lugar / Campeão</option>
                      <option value="finalist_2nd">🥈 2º Lugar / Finalista</option>
                      <option value="finalist_3rd">🥉 3º Lugar</option>
                      <option value="not_targeted">⚪ Não Alvo</option>
                    </select>
                  </div>
                </div>

                {/* Seleção de Membros Responsáveis */}
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Membros Responsáveis pela Defesa
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-black/30 border border-white/5">
                    {ALL_MEMBERS.map(member => {
                      const isSelected = (editingAward.awardedTo || []).includes(member.username);
                      return (
                        <button
                          key={member.username}
                          type="button"
                          onClick={() => {
                            const current = editingAward.awardedTo || [];
                            const next = isSelected
                              ? current.filter(u => u !== member.username)
                              : [...current, member.username];
                            setEditingAward({ ...editingAward, awardedTo: next });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-black shadow-md'
                              : 'bg-white/5 text-text-muted hover:text-white'
                          }`}
                        >
                          {member.displayName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Anotações Estratégicas
                  </label>
                  <textarea
                    rows={2}
                    value={editingAward.notes || ''}
                    onChange={e => setEditingAward({ ...editingAward, notes: e.target.value })}
                    placeholder="Estratégia específica para conquistar esse prêmio..."
                    className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white w-full focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAwardModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-md"
                  >
                    Salvar Prêmio
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: CONCEDER XP OFICIAL (SOMENTE TÉCNICOS)
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isXpAwardModalOpen && selectedAwardForXp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Conceder XP de Competição</h3>
                    <p className="text-xs text-text-secondary">{selectedAwardForXp.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsXpAwardModalOpen(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Quantidade de XP por Membro
                  </label>
                  <input
                    type="number"
                    value={xpCustomAmount}
                    onChange={e => setXpCustomAmount(Number(e.target.value) || 0)}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-emerald-400 w-full focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Membros Beneficiados ({xpSelectedRecipients.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (xpSelectedRecipients.length === ALL_MEMBERS.length) {
                          setXpSelectedRecipients([]);
                        } else {
                          setXpSelectedRecipients(ALL_MEMBERS.map(m => m.username));
                        }
                      }}
                      className="text-[10px] text-emerald-400 font-bold hover:underline"
                    >
                      {xpSelectedRecipients.length === ALL_MEMBERS.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-black/30 border border-white/5">
                    {ALL_MEMBERS.map(m => {
                      const isSelected = xpSelectedRecipients.includes(m.username);
                      return (
                        <button
                          key={m.username}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setXpSelectedRecipients(prev => prev.filter(u => u !== m.username));
                            } else {
                              setXpSelectedRecipients(prev => [...prev, m.username]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white/5 text-text-muted hover:text-white'
                          }`}
                        >
                          {m.displayName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                  <span className="font-bold block mb-1">Atenção Técnica:</span>
                  Ao confirmar, o sistema creditará +{xpCustomAmount} XP diretamente para os {xpSelectedRecipients.length} membros selecionados, atualizando seus níveis e enviando uma notificação no app.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsXpAwardModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isGrantingXp || xpSelectedRecipients.length === 0}
                    onClick={handleConfirmGrantXp}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-glow-primary"
                  >
                    {isGrantingXp ? 'Creditando XP...' : `Oficializar +${xpCustomAmount} XP`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: NOVO / EDITAR TÓPICO DE FALA (PITCH)
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isNewTopicModalOpen && editingTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white">
                  Tópico do Roteiro de Fala
                </h3>
                <button
                  onClick={() => setIsNewTopicModalOpen(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTopicModal} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Título / Tema da Fala *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTopic.title}
                    onChange={e => setEditingTopic({ ...editingTopic, title: e.target.value })}
                    placeholder="Ex: 3. Mecanismo de Coleta e CAD..."
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Membro Orador
                    </label>
                    <select
                      value={editingTopic.speaker || ''}
                      onChange={e => setEditingTopic({ ...editingTopic, speaker: e.target.value })}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="">(Equipe)</option>
                      {ALL_MEMBERS.map(m => (
                        <option key={m.username} value={m.displayName} className="bg-primary text-white">
                          {m.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Tempo Estimado (segundos)
                    </label>
                    <input
                      type="number"
                      value={editingTopic.targetDurationSeconds}
                      onChange={e => setEditingTopic({ ...editingTopic, targetDurationSeconds: Number(e.target.value) || 45 })}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Pontos Obrigatórios da Fala (Revisão)
                  </label>
                  <textarea
                    rows={3}
                    value={editingTopic.notes || ''}
                    onChange={e => setEditingTopic({ ...editingTopic, notes: e.target.value })}
                    placeholder="Quais detalhes técnicos ou lições aprendidas o orador deve obrigatoriamente citar?"
                    className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white w-full focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsNewTopicModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-glow-primary"
                  >
                    Salvar Tópico
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: REGISTRAR VISITA NO PIT
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isNewInterviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white">Registrar Visita dos Juízes no Pit</h3>
                <button
                  onClick={() => setIsNewInterviewModalOpen(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePitInterview} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Área Inspecionada
                    </label>
                    <select
                      value={newInterviewArea}
                      onChange={e => setNewInterviewArea(e.target.value as PitInterviewLog['judgeArea'])}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="engineering">Mecânica & Engenharia</option>
                      <option value="control">Controle & Autônomo</option>
                      <option value="connect">Conexão & Impacto</option>
                      <option value="motivate">Cultura & Motivação</option>
                      <option value="general">Inspeção Geral / Diversos</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Entusiasmo dos Juízes (1 a 5)
                    </label>
                    <div className="flex items-center gap-1 pt-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewInterviewImpression(star as 1 | 2 | 3 | 4 | 5)}
                          className={`p-1 transition-all ${
                            star <= newInterviewImpression ? 'text-amber-400' : 'text-white/20'
                          }`}
                        >
                          <Star size={18} fill={star <= newInterviewImpression ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Nomes / Destaque dos Juízes
                  </label>
                  <input
                    type="text"
                    value={newInterviewJudgeNames}
                    onChange={e => setNewInterviewJudgeNames(e.target.value)}
                    placeholder="Ex: Juiz com colete amarelo e crachá de Software..."
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Membros que responderam */}
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Membros que Atenderam os Juízes
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-black/30 border border-white/5">
                    {ALL_MEMBERS.map(m => {
                      const isSelected = newInterviewResponders.includes(m.displayName);
                      return (
                        <button
                          key={m.username}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewInterviewResponders(prev => prev.filter(name => name !== m.displayName));
                            } else {
                              setNewInterviewResponders(prev => [...prev, m.displayName]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white/5 text-text-muted hover:text-white'
                          }`}
                        >
                          {m.displayName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Perguntas Feitas pelos Juízes *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={newInterviewQuestions}
                    onChange={e => setNewInterviewQuestions(e.target.value)}
                    placeholder="O que eles pediram para ver ou explicar no robô/portfólio?"
                    className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white w-full focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Feedback / Reações dos Juízes
                  </label>
                  <textarea
                    rows={2}
                    value={newInterviewFeedback}
                    onChange={e => setNewInterviewFeedback(e.target.value)}
                    placeholder="O que eles elogiaram ou sugeriram durante a conversa?"
                    className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white w-full focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Follow-Up Necessário
                  </label>
                  <input
                    type="text"
                    value={newInterviewFollowUp}
                    onChange={e => setNewInterviewFollowUp(e.target.value)}
                    placeholder="Ex: Levar amostra do filamento na sala de juízes às 14h..."
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsNewInterviewModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-glow-primary"
                  >
                    Salvar Visita
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

export default AwardsEvaluations;
