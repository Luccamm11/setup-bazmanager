import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Zap, Trash2, Plus, ShieldCheck, AlertCircle } from 'lucide-react';
import type { FiveW2HPlan, RealmXpReward, EvidenceType } from '../../types';
import { Realm } from '../../types';
import { SKILL_REALMS } from '../../constants';
import { REALM_LABELS, REALM_COLORS } from './types';

interface Props {
  plan: FiveW2HPlan;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (realmRewards: RealmXpReward[], creditReward: number, note: string) => void;
}

// Canonical Level & Points Criteria (from Team Missions)
const LEVEL_POINTS: Record<number, { label: string; description: string; points: number }> = {
  1: { label: 'Nível 1', description: 'Contato Inicial (2 Pts Base)', points: 2 },
  2: { label: 'Nível 2', description: 'Aprendizagem Guiada (5 Pts Base)', points: 5 },
  3: { label: 'Nível 3', description: 'Aplicação Prática (10 Pts Base)', points: 10 },
  4: { label: 'Nível 4', description: 'Dev. Avançado (15 Pts Base)', points: 15 },
  5: { label: 'Nível 5', description: 'Especialista/Liderança (25 Pts Base)', points: 25 },
};

// Canonical Evidence Multipliers (from Team Missions)
const EVIDENCE_MULTIPLIERS: Record<EvidenceType, { label: string; multiplier: number }> = {
  conclusion: { label: 'Apenas conclusão', multiplier: 1.0 },
  certificate: { label: 'Certificado', multiplier: 1.2 },
  practical_application: { label: 'Aplicação prática', multiplier: 1.5 },
  practical_presentation: { label: 'Prática + Apresentação', multiplier: 2.0 },
};

interface CompetencyWeight {
  realm: Realm;
  percentage: number;
}

const ReviewModal: React.FC<Props> = ({ plan, isOpen, onClose, onSubmit }) => {
  const [missionLevel, setMissionLevel] = useState<number>(plan.missionLevel || 3);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>(plan.evidenceType || 'conclusion');
  
  // Initialize weights: default to Planning 100% or previous weights
  const [weights, setWeights] = useState<CompetencyWeight[]>(() => {
    if (plan.competencyWeights && plan.competencyWeights.length > 0) {
      return plan.competencyWeights.map(w => ({ ...w }));
    }
    if (plan.realmRewards && plan.realmRewards.length > 0) {
      const sum = plan.realmRewards.reduce((s, r) => s + (r.xp || 0), 0);
      if (sum > 0) {
        const generated = plan.realmRewards.map(r => ({
          realm: r.realm,
          percentage: Math.round((r.xp / sum) * 100),
        }));
        const total = generated.reduce((s, w) => s + w.percentage, 0);
        if (total !== 100 && generated.length > 0) {
          generated[0].percentage += (100 - total);
        }
        return generated;
      }
    }
    return [{ realm: Realm.Planning, percentage: 100 }];
  });

  const [note, setNote] = useState(plan.reviewNote || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time calculation
  const basePoints = LEVEL_POINTS[missionLevel]?.points || 10;
  const multiplier = EVIDENCE_MULTIPLIERS[evidenceType]?.multiplier || 1.0;
  const grossPoints = basePoints * multiplier;

  const totalPercentage = weights.reduce((sum, w) => sum + (w.percentage || 0), 0);

  const calculatedRewards: RealmXpReward[] = weights.map(w => ({
    realm: w.realm,
    xp: Math.round(grossPoints * (w.percentage / 100)),
  }));

  const grandTotalXp = calculatedRewards.reduce((sum, r) => sum + r.xp, 0);

  const addCompetency = () => {
    const usedRealms = weights.map(w => w.realm);
    const available = SKILL_REALMS.find(r => !usedRealms.includes(r));
    if (available) {
      setWeights(prev => [...prev, { realm: available, percentage: 0 }]);
    }
  };

  const removeCompetency = (idx: number) => {
    if (weights.length <= 1) return;
    setWeights(prev => prev.filter((_, i) => i !== idx));
  };

  const updateWeight = (idx: number, field: 'realm' | 'percentage', value: any) => {
    setWeights(prev => prev.map((w, i) => {
      if (i !== idx) return w;
      if (field === 'realm') return { ...w, realm: value as Realm };
      return { ...w, percentage: Math.max(0, Math.min(100, Number(value) || 0)) };
    }));
  };

  const handleSubmit = () => {
    if (totalPercentage !== 100) {
      setErrorMsg(`A soma das porcentagens deve ser exatamente 100% (atual: ${totalPercentage}%).`);
      return;
    }

    const validRewards = calculatedRewards.filter(r => r.xp > 0);
    // User requested removing credits: passing 0 credits
    onSubmit(validRewards, 0, note);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[#0d0f14] border border-orange-500/25 rounded-2xl w-full max-w-lg shadow-2xl my-6 flex flex-col max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.93, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                <Star className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Avaliar Plano 5W2H</h3>
                <p className="text-xs text-text-muted truncate max-w-[280px]">{plan.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            {/* Criteria: Level & Evidence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Dificuldade / Nível
                </label>
                <select
                  value={missionLevel}
                  onChange={e => setMissionLevel(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
                >
                  {Object.entries(LEVEL_POINTS).map(([lvl, info]) => (
                    <option key={lvl} value={lvl} className="bg-black text-white">
                      {info.label} - {info.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Tipo de Comprovação
                </label>
                <select
                  value={evidenceType}
                  onChange={e => setEvidenceType(e.target.value as EvidenceType)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
                >
                  {Object.entries(EVIDENCE_MULTIPLIERS).map(([type, info]) => (
                    <option key={type} value={type} className="bg-black text-white">
                      {info.label} ({info.multiplier.toFixed(1)}x)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculated Preview Card */}
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Pontuação Calculada</span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  {basePoints} Pts Base × {multiplier.toFixed(1)}x Multiplicador
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-orange-400">{grossPoints} Pontos</span>
                <span className="block text-[10px] text-emerald-400 font-bold">
                  Total XP: +{grandTotalXp} XP
                </span>
              </div>
            </div>

            {/* Competency Weights */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Competências Impactadas
                  <span className={`ml-1 font-black ${totalPercentage === 100 ? 'text-green-400' : 'text-rose-400'}`}>
                    ({totalPercentage}% / 100%)
                  </span>
                </label>
                {weights.length < SKILL_REALMS.length && (
                  <button
                    type="button"
                    onClick={addCompetency}
                    className="flex items-center gap-1 text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-colors uppercase tracking-wider"
                  >
                    <Plus className="w-3 h-3" /> Adicionar Reino
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {weights.map((w, idx) => {
                  const ptsForRealm = calculatedRewards[idx]?.xp || 0;
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/10">
                      <select
                        value={w.realm}
                        onChange={e => updateWeight(idx, 'realm', e.target.value)}
                        className="flex-1 bg-transparent border-0 text-white text-xs font-bold focus:outline-none cursor-pointer"
                      >
                        {SKILL_REALMS.map(r => (
                          <option
                            key={r}
                            value={r}
                            disabled={weights.some((w2, i2) => i2 !== idx && w2.realm === r)}
                            className="bg-black text-white"
                          >
                            {REALM_LABELS[r]}
                          </option>
                        ))}
                      </select>

                      <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-emerald-300 whitespace-nowrap">
                        +{ptsForRealm} XP
                      </span>

                      <div className="relative w-20">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={w.percentage}
                          onChange={e => updateWeight(idx, 'percentage', e.target.value)}
                          className="w-full bg-white/5 border border-white/15 rounded-lg py-1 px-2 text-white text-xs font-black text-right pr-6 focus:outline-none focus:border-orange-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">%</span>
                      </div>

                      {weights.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCompetency(idx)}
                          className="p-1.5 text-text-muted hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note / Feedback */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Nota / Feedback do Técnico (opcional)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ex: Bom planejamento! Detalhe mais os recursos na execução..."
                className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-text-secondary font-bold hover:bg-white/5 transition-all text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={totalPercentage !== 100}
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.2)] text-xs disabled:opacity-50 cursor-pointer"
            >
              <Star className="w-4 h-4" /> Aprovar & Conceder XP (+{grandTotalXp} XP)
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
