import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Check, X, Sparkles, BookOpen, Users, GraduationCap, 
  Calendar, Clock, UserCheck, AlertCircle, Copy, MessageSquare,
  Plus, Trash2, Zap, ShieldCheck
} from 'lucide-react';
import { Realm, ActivityEvaluation, MemberSkillScore, UserRole, EvidenceType } from '../types';
import { SKILL_REALMS } from '../constants';
import { useTranslation } from 'react-i18next';

interface ActivityEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  activityTitle: string;
  activityType: 'autonomous_dev' | 'collective_evolution' | 'mentorship';
  activityDate: string;
  workloadOrDuration?: string | number;
  participants: string[];
  initialEvaluation?: ActivityEvaluation;
  userRole: UserRole;
  currentUser: string;
  onSaveEvaluation: (evaluation: ActivityEvaluation) => Promise<void>;
}

// Realm metadata configuration (strictly respecting Purple Ban: uses indigo/slate/emerald/rose/amber/blue/orange/cyan)
const REALM_UI_MAP: Record<Realm, { label: string; color: string; border: string; bg: string }> = {
  [Realm.TechnicalWriting]: { label: 'Escrita Técnica', color: 'text-slate-300', border: 'border-slate-500/30', bg: 'bg-slate-500/10' },
  [Realm.Networking]:       { label: 'Networking', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  [Realm.Oratory]:          { label: 'Oratória', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
  [Realm.Planning]:         { label: 'Planejamento', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  [Realm.Creativity]:       { label: 'Criatividade', color: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10' },
  [Realm.Programming]:      { label: 'Programação', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  [Realm.Engineering]:      { label: 'Engenharia', color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
  [Realm.FirstCulture]:     { label: 'Cultura FIRST', color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' },
};

// Canonical Level & Points Criteria (from Team Missions)
export const LEVEL_POINTS: Record<number, { label: string; description: string; points: number }> = {
  1: { label: 'Nível 1', description: 'Contato Inicial (2 Pts Base)', points: 2 },
  2: { label: 'Nível 2', description: 'Aprendizagem Guiada (5 Pts Base)', points: 5 },
  3: { label: 'Nível 3', description: 'Aplicação Prática (10 Pts Base)', points: 10 },
  4: { label: 'Nível 4', description: 'Dev. Avançado (15 Pts Base)', points: 15 },
  5: { label: 'Nível 5', description: 'Especialista/Liderança (25 Pts Base)', points: 25 },
};

// Canonical Evidence Multipliers (from Team Missions)
export const EVIDENCE_MULTIPLIERS: Record<EvidenceType, { label: string; multiplier: number }> = {
  conclusion: { label: 'Apenas conclusão', multiplier: 1.0 },
  certificate: { label: 'Certificado', multiplier: 1.2 },
  practical_application: { label: 'Aplicação prática', multiplier: 1.5 },
  practical_presentation: { label: 'Prática + Apresentação', multiplier: 2.0 },
};

export interface CompetencyWeight {
  realm: Realm;
  percentage: number;
}

export interface MemberEvaluationState {
  username: string;
  missionLevel: number;
  evidenceType: EvidenceType;
  competencyWeights: CompetencyWeight[];
  feedback: string;
}

export default function ActivityEvaluationModal({
  isOpen,
  onClose,
  activityId,
  activityTitle,
  activityType,
  activityDate,
  workloadOrDuration,
  participants,
  initialEvaluation,
  userRole,
  currentUser,
  onSaveEvaluation,
}: ActivityEvaluationModalProps) {
  const { t } = useTranslation(['common']);
  const isTechnician = userRole === 'technician' || ['Jonas', 'Ramon'].includes(currentUser);

  const [memberCriteria, setMemberCriteria] = useState<Record<string, MemberEvaluationState>>({});
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Initialize evaluation criteria per participant
  useEffect(() => {
    if (!isOpen) return;

    const safeParticipants = participants.length > 0 ? participants : [currentUser];
    const newCriteriaMap: Record<string, MemberEvaluationState> = {};

    safeParticipants.forEach(username => {
      const existing = initialEvaluation?.memberScores?.[username];

      if (existing && existing.missionLevel && existing.evidenceType && existing.competencyWeights) {
        newCriteriaMap[username] = {
          username,
          missionLevel: existing.missionLevel,
          evidenceType: existing.evidenceType,
          competencyWeights: existing.competencyWeights.map(w => ({ ...w })),
          feedback: existing.feedback || '',
        };
      } else if (existing && existing.realmScores && Object.keys(existing.realmScores).length > 0) {
        // Legacy evaluation backward-compatibility: convert raw realmScores to proportional weights
        const nonZeroRealms = Object.entries(existing.realmScores).filter(([_, pts]) => (pts || 0) > 0) as [Realm, number][];
        const sumPoints = nonZeroRealms.reduce((acc, [_, p]) => acc + p, 0);

        let weights: CompetencyWeight[] = [];
        if (sumPoints > 0) {
          weights = nonZeroRealms.map(([r, pts]) => ({
            realm: r,
            percentage: Math.round((pts / sumPoints) * 100),
          }));
          const totalPct = weights.reduce((s, w) => s + w.percentage, 0);
          if (weights.length > 0 && totalPct !== 100) {
            weights[0].percentage += (100 - totalPct);
          }
        } else {
          weights = [{ realm: Realm.Engineering, percentage: 100 }];
        }

        newCriteriaMap[username] = {
          username,
          missionLevel: existing.totalXp >= 25 ? 5 : (existing.totalXp >= 15 ? 4 : (existing.totalXp >= 10 ? 3 : (existing.totalXp >= 5 ? 2 : 1))),
          evidenceType: 'conclusion',
          competencyWeights: weights,
          feedback: existing.feedback || '',
        };
      } else {
        // Default new criteria
        const defaultRealm = activityType === 'autonomous_dev' 
          ? Realm.Programming 
          : (activityType === 'mentorship' ? Realm.Planning : Realm.Engineering);

        newCriteriaMap[username] = {
          username,
          missionLevel: 3,
          evidenceType: 'conclusion',
          competencyWeights: [{ realm: defaultRealm, percentage: 100 }],
          feedback: '',
        };
      }
    });

    setMemberCriteria(newCriteriaMap);
    setSelectedMember(safeParticipants[0] || '');
    setGeneralNotes(initialEvaluation?.generalNotes || '');
    setErrorMsg(null);
    setCopiedSuccess(false);
  }, [isOpen, initialEvaluation, participants, currentUser, activityType]);

  if (!isOpen) return null;

  const currentMemberState = memberCriteria[selectedMember] || {
    username: selectedMember,
    missionLevel: 3,
    evidenceType: 'conclusion' as EvidenceType,
    competencyWeights: [{ realm: Realm.Engineering, percentage: 100 }],
    feedback: '',
  };

  // Compute calculated score details for any member state
  const computeScore = (state: MemberEvaluationState) => {
    const base = LEVEL_POINTS[state.missionLevel]?.points || 10;
    const mult = EVIDENCE_MULTIPLIERS[state.evidenceType]?.multiplier || 1.0;
    const gross = base * mult;

    const realmScores: Partial<Record<Realm, number>> = {};
    state.competencyWeights.forEach(w => {
      realmScores[w.realm] = Math.round(gross * (w.percentage / 100));
    });

    const totalXp = (Object.values(realmScores) as number[]).reduce((sum, v) => sum + (v || 0), 0);
    const totalPercentage = state.competencyWeights.reduce((sum, w) => sum + (w.percentage || 0), 0);

    return { base, mult, gross, realmScores, totalXp, totalPercentage };
  };

  const currentComputed = computeScore(currentMemberState);

  // Grand total XP across all participants
  const grandTotalXp = Object.values(memberCriteria).reduce((acc, curr) => {
    return acc + computeScore(curr).totalXp;
  }, 0);

  // Field updates for the current active member
  const handleLevelChange = (level: number) => {
    setMemberCriteria(prev => ({
      ...prev,
      [selectedMember]: {
        ...prev[selectedMember],
        missionLevel: level,
      },
    }));
  };

  const handleEvidenceChange = (evidenceType: EvidenceType) => {
    setMemberCriteria(prev => ({
      ...prev,
      [selectedMember]: {
        ...prev[selectedMember],
        evidenceType,
      },
    }));
  };

  const handleAddCompetency = () => {
    const usedRealms = currentMemberState.competencyWeights.map(w => w.realm);
    const available = SKILL_REALMS.find(r => !usedRealms.includes(r));
    if (available) {
      setMemberCriteria(prev => ({
        ...prev,
        [selectedMember]: {
          ...prev[selectedMember],
          competencyWeights: [...prev[selectedMember].competencyWeights, { realm: available, percentage: 0 }],
        },
      }));
    }
  };

  const handleRemoveCompetency = (index: number) => {
    if (currentMemberState.competencyWeights.length <= 1) return;
    setMemberCriteria(prev => ({
      ...prev,
      [selectedMember]: {
        ...prev[selectedMember],
        competencyWeights: prev[selectedMember].competencyWeights.filter((_, i) => i !== index),
      },
    }));
  };

  const handleWeightChange = (index: number, field: 'realm' | 'percentage', value: string | number) => {
    setMemberCriteria(prev => ({
      ...prev,
      [selectedMember]: {
        ...prev[selectedMember],
        competencyWeights: prev[selectedMember].competencyWeights.map((w, i) => {
          if (i !== index) return w;
          if (field === 'realm') return { ...w, realm: value as Realm };
          return { ...w, percentage: Math.max(0, Math.min(100, Number(value) || 0)) };
        }),
      },
    }));
  };

  const handleFeedbackChange = (feedback: string) => {
    setMemberCriteria(prev => ({
      ...prev,
      [selectedMember]: {
        ...prev[selectedMember],
        feedback,
      },
    }));
  };

  // Replicate current member's criteria (Level, Evidence, Weights) to ALL participants
  const handleReplicateToAll = () => {
    if (!selectedMember || !memberCriteria[selectedMember]) return;
    const current = memberCriteria[selectedMember];

    setMemberCriteria(prev => {
      const updated: Record<string, MemberEvaluationState> = {};
      Object.keys(prev).forEach(user => {
        updated[user] = {
          ...prev[user],
          missionLevel: current.missionLevel,
          evidenceType: current.evidenceType,
          competencyWeights: current.competencyWeights.map(w => ({ ...w })),
          // individual feedback is preserved
        };
      });
      return updated;
    });

    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Save handler with full validation
  const handleSave = async () => {
    if (!isTechnician) return;

    // Validate that every participant has weights totaling 100%
    for (const [username, state] of Object.entries(memberCriteria)) {
      const sum = state.competencyWeights.reduce((s, w) => s + (w.percentage || 0), 0);
      if (sum !== 100) {
        setErrorMsg(`A soma das porcentagens de ${username} deve ser exatamente 100% (atual: ${sum}%).`);
        setSelectedMember(username);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const memberScores: Record<string, MemberSkillScore> = {};

      Object.entries(memberCriteria).forEach(([username, state]) => {
        const computed = computeScore(state);
        memberScores[username] = {
          username,
          realmScores: computed.realmScores,
          totalXp: computed.totalXp,
          feedback: state.feedback.trim() || undefined,
          missionLevel: state.missionLevel,
          evidenceType: state.evidenceType,
          evidenceMultiplier: computed.mult,
          competencyWeights: state.competencyWeights,
        };
      });

      const evalPayload: ActivityEvaluation = {
        id: initialEvaluation?.id || `eval-${Date.now()}`,
        evaluatedBy: currentUser,
        evaluatedAt: new Date().toISOString(),
        memberScores,
        generalNotes: generalNotes.trim() || undefined,
      };

      await onSaveEvaluation(evalPayload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar avaliação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeBadge = () => {
    if (activityType === 'autonomous_dev') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <BookOpen className="w-3.5 h-3.5" /> Desenv. Autônomo
        </span>
      );
    }
    if (activityType === 'collective_evolution') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Users className="w-3.5 h-3.5" /> Evolução Coletiva
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <GraduationCap className="w-3.5 h-3.5" /> Mentoria
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-primary border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl my-6 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-primary/95 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-primary/10 border border-accent-primary/20 rounded-xl text-accent-primary">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white">
                  {isTechnician ? 'Avaliação por Critérios & Multiplicadores' : 'Detalhes da Avaliação'}
                </h2>
                {typeBadge()}
              </div>
              <p className="text-xs text-white/50 truncate max-w-lg mt-0.5">{activityTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}

          {/* Activity Meta Summary */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 text-white/60">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-accent-primary" /> {activityDate}</span>
              {workloadOrDuration && (
                <span className="flex items-center gap-1.5 font-bold text-white/80">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> {workloadOrDuration}
                </span>
              )}
              <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-emerald-400" /> {participants.length} participante(s)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 uppercase font-black tracking-wider text-[10px]">Total XP Distribuído:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-sm">
                +{grandTotalXp} XP
              </span>
            </div>
          </div>

          {/* Participants Navigation Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider">
                Membros Participantes ({participants.length})
              </label>
              {isTechnician && participants.length > 1 && (
                <button
                  type="button"
                  onClick={handleReplicateToAll}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shadow-sm ${
                    copiedSuccess 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border-accent-primary/30'
                  }`}
                  title="Copia o nível, evidência e percentuais de competência selecionados para todos os outros membros"
                >
                  {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSuccess ? 'Critérios replicados para todos!' : 'Replicar critérios para todos os membros'}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 p-1.5 bg-black/30 rounded-xl border border-white/10">
              {participants.map(username => {
                const isSelected = selectedMember === username;
                const state = memberCriteria[username];
                const xp = state ? computeScore(state).totalXp : 0;
                return (
                  <button
                    key={username}
                    type="button"
                    onClick={() => setSelectedMember(username)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{username}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                      xp > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/10 text-white/40'
                    }`}>
                      +{xp} XP
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Member Evaluation Panel */}
          {selectedMember && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-5">
              {/* Member Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
                    {selectedMember.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Avaliação de {selectedMember}</h3>
                    <p className="text-[11px] text-white/40">Defina o nível de desafio, tipo de comprovação e pesos por reino</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">XP deste membro:</span>
                  <span className="text-base font-black text-emerald-400">+{currentComputed.totalXp} XP</span>
                </div>
              </div>

              {isTechnician ? (
                <>
                  {/* Selectors: Level & Evidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mission Level */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Dificuldade / Nível de Aprendizado
                      </label>
                      <select
                        value={currentMemberState.missionLevel}
                        onChange={e => handleLevelChange(Number(e.target.value))}
                        className="w-full bg-background border border-white/15 rounded-xl py-2.5 px-3 text-white text-xs focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary transition-all cursor-pointer"
                      >
                        {Object.entries(LEVEL_POINTS).map(([lvl, info]) => (
                          <option key={lvl} value={lvl} className="bg-background text-white">
                            {info.label} - {info.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Evidence Type */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Tipo de Evidência / Comprovação
                      </label>
                      <select
                        value={currentMemberState.evidenceType}
                        onChange={e => handleEvidenceChange(e.target.value as EvidenceType)}
                        className="w-full bg-background border border-white/15 rounded-xl py-2.5 px-3 text-white text-xs focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary transition-all cursor-pointer"
                      >
                        {Object.entries(EVIDENCE_MULTIPLIERS).map(([type, info]) => (
                          <option key={type} value={type} className="bg-background text-white">
                            {info.label} ({info.multiplier.toFixed(1)}x)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Calculated Points Preview Card */}
                  <div className="p-3.5 rounded-xl bg-accent-primary/5 border border-accent-primary/20 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">Pontuação Bruta Calculada</span>
                        <span className="text-[10px] text-zinc-400">
                          {currentComputed.base} Pts Base × {currentComputed.mult.toFixed(1)}x Multiplicador
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-white">{currentComputed.gross} Pontos Brutos</span>
                      <span className="block text-[10px] text-emerald-400 font-bold">
                        Total atribuído: +{currentComputed.totalXp} XP
                      </span>
                    </div>
                  </div>

                  {/* Competency Weights Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        Competências Impactadas
                        <span className={`ml-1 font-black ${currentComputed.totalPercentage === 100 ? 'text-green-400' : 'text-rose-400'}`}>
                          ({currentComputed.totalPercentage}% / 100%)
                        </span>
                      </label>
                      {currentMemberState.competencyWeights.length < SKILL_REALMS.length && (
                        <button
                          type="button"
                          onClick={handleAddCompetency}
                          className="flex items-center gap-1 text-[10px] font-bold text-accent-primary hover:text-accent-primary/80 transition-colors uppercase tracking-wider"
                        >
                          <Plus className="w-3 h-3" /> Adicionar Competência
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {currentMemberState.competencyWeights.map((w, index) => {
                        const cfg = REALM_UI_MAP[w.realm];
                        const ptsForRealm = currentComputed.realmScores[w.realm] || 0;

                        return (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/10">
                            {/* Realm Selector */}
                            <select
                              value={w.realm}
                              onChange={e => handleWeightChange(index, 'realm', e.target.value)}
                              className="flex-1 bg-transparent border-0 text-white text-xs font-bold focus:outline-none cursor-pointer"
                            >
                              {SKILL_REALMS.map(r => (
                                <option
                                  key={r}
                                  value={r}
                                  disabled={currentMemberState.competencyWeights.some((w2, i2) => i2 !== index && w2.realm === r)}
                                  className="bg-background text-white"
                                >
                                  {REALM_UI_MAP[r]?.label || r}
                                </option>
                              ))}
                            </select>

                            {/* Calculated Realm XP pill */}
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.color} whitespace-nowrap`}>
                              +{ptsForRealm} XP
                            </span>

                            {/* Percentage input */}
                            <div className="relative w-20">
                              <input
                                type="number"
                                value={w.percentage}
                                onChange={e => handleWeightChange(index, 'percentage', e.target.value)}
                                min="0"
                                max="100"
                                className="w-full bg-white/5 border border-white/15 rounded-lg py-1.5 px-2 text-white text-xs font-black text-right pr-6 focus:outline-none focus:border-accent-primary"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">%</span>
                            </div>

                            {/* Delete button if more than 1 */}
                            {currentMemberState.competencyWeights.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCompetency(index)}
                                className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Individual Feedback */}
                  <div>
                    <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-blue-400" /> Feedback Individual para {selectedMember} (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={currentMemberState.feedback}
                      onChange={e => handleFeedbackChange(e.target.value)}
                      placeholder={`Comentário específico para ${selectedMember}...`}
                      className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </>
              ) : (
                /* View Mode for Students / Members */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Dificuldade Atribuída</span>
                      <span className="font-bold text-white">
                        {LEVEL_POINTS[currentMemberState.missionLevel]?.label || `Nível ${currentMemberState.missionLevel}`}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        {LEVEL_POINTS[currentMemberState.missionLevel]?.description}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Comprovação Avaliada</span>
                      <span className="font-bold text-white">
                        {EVIDENCE_MULTIPLIERS[currentMemberState.evidenceType]?.label || currentMemberState.evidenceType}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                        Multiplicador {EVIDENCE_MULTIPLIERS[currentMemberState.evidenceType]?.multiplier.toFixed(1)}x
                      </span>
                    </div>
                  </div>

                  {/* Skills/Realms List */}
                  <div>
                    <span className="text-[10px] font-bold text-white/40 uppercase block mb-2">XP por Competência Conquistado</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentMemberState.competencyWeights.map(w => {
                        const cfg = REALM_UI_MAP[w.realm];
                        const pts = currentComputed.realmScores[w.realm] || 0;
                        return (
                          <div key={w.realm} className={`p-2.5 rounded-xl border flex items-center justify-between ${cfg.bg} ${cfg.border}`}>
                            <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label} ({w.percentage}%)</span>
                            <span className="text-xs font-black text-white">+{pts} XP</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback display */}
                  {currentMemberState.feedback && (
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                      <span className="font-bold text-blue-400 block mb-1">Feedback do Técnico:</span>
                      <p className="text-white/80 leading-relaxed">{currentMemberState.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* General Notes */}
          {isTechnician ? (
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Anotações Gerais da Avaliação (Opcional)
              </label>
              <textarea
                rows={2}
                value={generalNotes}
                onChange={e => setGeneralNotes(e.target.value)}
                placeholder="Observações do técnico sobre o desempenho geral da equipe nesta atividade..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          ) : generalNotes ? (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1">
              <span className="font-bold text-text-secondary block">Observações Gerais do Avaliador:</span>
              <p className="text-white/80">{generalNotes}</p>
            </div>
          ) : null}

          {/* Evaluation Info (if already evaluated) */}
          {initialEvaluation && (
            <div className="text-[11px] text-white/40 flex items-center justify-between border-t border-white/5 pt-3">
              <span>Avaliado por: <strong className="text-white/60">{initialEvaluation.evaluatedBy}</strong></span>
              <span>Em: {new Date(initialEvaluation.evaluatedAt).toLocaleString('pt-BR')}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/10 flex items-center justify-between sticky bottom-0 bg-primary/95 backdrop-blur-xl z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold text-xs transition-all"
          >
            Fechar
          </button>

          {isTechnician && (
            <button
              type="button"
              disabled={isSubmitting || currentComputed.totalPercentage !== 100}
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-glow-primary disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando Avaliação...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Salvar Avaliação & Conceder XP (+{grandTotalXp} XP)
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
