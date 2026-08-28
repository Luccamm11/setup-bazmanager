import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Check, X, Sparkles, BookOpen, Users, GraduationCap, 
  Calendar, Clock, UserCheck, AlertCircle, Copy, Sliders, MessageSquare
} from 'lucide-react';
import { Realm, ActivityEvaluation, MemberSkillScore, UserRole } from '../types';
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

// Realm metadata configuration (no purple/violet)
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

  // Evaluation form state
  const [memberScores, setMemberScores] = useState<Record<string, MemberSkillScore>>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Batch preset state (for applying same points across participants)
  const [batchRealms, setBatchRealms] = useState<Partial<Record<Realm, number>>>({
    [Realm.Programming]: 0,
    [Realm.Engineering]: 0,
    [Realm.Planning]: 0,
    [Realm.Networking]: 0,
    [Realm.TechnicalWriting]: 0,
    [Realm.FirstCulture]: 0,
    [Realm.Creativity]: 0,
    [Realm.Oratory]: 0,
  });

  // Initialize or reset state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const initialMap: Record<string, MemberSkillScore> = {};
    const safeParticipants = participants.length > 0 ? participants : [currentUser];

    safeParticipants.forEach(username => {
      const existing = initialEvaluation?.memberScores?.[username];
      if (existing) {
        initialMap[username] = {
          username,
          realmScores: { ...existing.realmScores },
          totalXp: existing.totalXp || 0,
          feedback: existing.feedback || '',
        };
      } else {
        initialMap[username] = {
          username,
          realmScores: {},
          totalXp: 0,
          feedback: '',
        };
      }
    });

    setMemberScores(initialMap);
    setSelectedMember(safeParticipants[0] || '');
    setGeneralNotes(initialEvaluation?.generalNotes || '');
    setErrorMsg(null);
  }, [isOpen, initialEvaluation, participants, currentUser]);

  if (!isOpen) return null;

  // Helpers
  const handleScoreChange = (username: string, realm: Realm, value: number) => {
    const safeVal = Math.max(0, Math.min(500, isNaN(value) ? 0 : value));

    setMemberScores(prev => {
      const current = prev[username] || { username, realmScores: {}, totalXp: 0 };
      const updatedRealmScores = { ...current.realmScores, [realm]: safeVal };
      
      const newTotalXp = (Object.values(updatedRealmScores) as number[]).reduce((sum: number, v: number) => sum + (Number(v) || 0), 0);

      return {
        ...prev,
        [username]: {
          ...current,
          realmScores: updatedRealmScores,
          totalXp: newTotalXp,
        },
      };
    });
  };

  const handleFeedbackChange = (username: string, feedback: string) => {
    setMemberScores(prev => ({
      ...prev,
      [username]: {
        ...(prev[username] || { username, realmScores: {}, totalXp: 0 }),
        feedback,
      },
    }));
  };

  const applyBatchToAll = () => {
    const nonZeroBatch = (Object.entries(batchRealms) as [Realm, number | undefined][]).reduce((acc, [realm, val]) => {
      if (val != null && val > 0) acc[realm] = val;
      return acc;
    }, {} as Partial<Record<Realm, number>>);

    const batchTotal = (Object.values(nonZeroBatch) as number[]).reduce((sum: number, v: number) => sum + (v || 0), 0);

    setMemberScores(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(username => {
        updated[username] = {
          ...updated[username],
          realmScores: { ...nonZeroBatch },
          totalXp: batchTotal,
        };
      });
      return updated;
    });
  };

  const handleSave = async () => {
    if (!isTechnician) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
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

  const currentMemberScore = memberScores[selectedMember] || { username: selectedMember, realmScores: {}, totalXp: 0 };
  const grandTotalXp = (Object.values(memberScores) as MemberSkillScore[]).reduce((sum: number, m: MemberSkillScore) => sum + (m.totalXp || 0), 0);

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
        className="bg-primary border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl my-8 flex flex-col max-h-[90vh] overflow-hidden"
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
                  {isTechnician ? 'Avaliação de Habilidades & XP' : 'Detalhes da Avaliação'}
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
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
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
              <span className="text-white/40 uppercase font-black tracking-wider text-[10px]">Total XP Atribuído:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-sm">
                +{grandTotalXp} XP
              </span>
            </div>
          </div>

          {/* Batch Tool for Technicians */}
          {isTechnician && participants.length > 1 && (
            <div className="p-4 rounded-xl bg-accent-primary/5 border border-accent-primary/20 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black text-accent-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Distribuição Rápida em Lote (Aplicar a Todos)
                </span>
                <button
                  type="button"
                  onClick={applyBatchToAll}
                  className="px-3 py-1.5 rounded-lg bg-accent-primary text-white font-bold text-xs hover:opacity-90 transition-all flex items-center gap-1 shadow-glow-primary"
                >
                  <Copy className="w-3.5 h-3.5" /> Aplicar a todos os {participants.length} membros
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {SKILL_REALMS.map(realm => {
                  const cfg = REALM_UI_MAP[realm];
                  return (
                    <div key={`batch-${realm}`} className={`p-2 rounded-lg border ${cfg.bg} ${cfg.border} flex items-center justify-between gap-2`}>
                      <span className={`text-[11px] font-bold ${cfg.color} truncate`}>{cfg.label}</span>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        step="5"
                        value={batchRealms[realm] || 0}
                        onChange={e => setBatchRealms(prev => ({ ...prev, [realm]: parseInt(e.target.value) || 0 }))}
                        className="w-14 px-1.5 py-1 text-center font-bold text-xs bg-black/40 border border-white/10 rounded text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Participants Navigation Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider">
              Membros Participantes ({participants.length})
            </label>
            <div className="flex flex-wrap gap-2 p-1.5 bg-black/30 rounded-xl border border-white/10">
              {participants.map(username => {
                const score = memberScores[username];
                const isSelected = selectedMember === username;
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
                      (score?.totalXp || 0) > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/10 text-white/40'
                    }`}>
                      +{(score?.totalXp || 0)} XP
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Member Evaluation Panel */}
          {selectedMember && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
                    {selectedMember.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Pontuação de {selectedMember}</h3>
                    <p className="text-[11px] text-white/40">Defina os pontos de XP para cada habilidade/reino</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">XP deste membro:</span>
                  <span className="text-base font-black text-emerald-400">+{currentMemberScore.totalXp} XP</span>
                </div>
              </div>

              {/* Skills/Realms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SKILL_REALMS.map(realm => {
                  const cfg = REALM_UI_MAP[realm];
                  const currentVal = currentMemberScore.realmScores[realm] || 0;

                  return (
                    <div
                      key={realm}
                      className={`p-3 rounded-xl border transition-all ${cfg.bg} ${cfg.border} flex flex-col justify-between gap-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                        {currentVal > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/10 text-white">
                            +{currentVal}
                          </span>
                        )}
                      </div>

                      {isTechnician ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="range"
                            min="0"
                            max="200"
                            step="5"
                            value={currentVal}
                            onChange={e => handleScoreChange(selectedMember, realm, parseInt(e.target.value) || 0)}
                            className="flex-1 accent-blue-500 cursor-pointer h-1.5 bg-black/40 rounded-lg"
                          />
                          <input
                            type="number"
                            min="0"
                            max="500"
                            step="5"
                            value={currentVal}
                            onChange={e => handleScoreChange(selectedMember, realm, parseInt(e.target.value) || 0)}
                            className="w-14 px-2 py-1 text-center text-xs font-black bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-white/70">+{currentVal} XP</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Member Feedback */}
              {isTechnician ? (
                <div>
                  <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-blue-400" /> Feedback Individual para {selectedMember} (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={currentMemberScore.feedback || ''}
                    onChange={e => handleFeedbackChange(selectedMember, e.target.value)}
                    placeholder={`Comentário específico para ${selectedMember}...`}
                    className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              ) : currentMemberScore.feedback ? (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/80">
                  <span className="font-bold text-blue-400 block mb-1">Feedback do Técnico:</span>
                  <p>{currentMemberScore.feedback}</p>
                </div>
              ) : null}
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
              <span className="font-bold text-text-secondary block">Observações do Avaliador:</span>
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
              disabled={isSubmitting}
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-glow-primary disabled:opacity-50"
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
