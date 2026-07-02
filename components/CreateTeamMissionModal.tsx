import React, { useState } from 'react';
import { X, Plus, Trash2, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Realm, Difficulty, RealmXpReward, TeamMission, EvidenceType } from '../types';
import { SKILL_REALMS } from '../constants';
import { useMembers } from '../hooks/useMembers';

interface CreateTeamMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mission: Omit<TeamMission, 'id' | 'createdBy' | 'completedBy' | 'createdAt'>) => void;
  missionToEdit?: TeamMission | null;
  currentUser: string;
}

const LEVEL_POINTS: Record<number, number> = {
  1: 2,
  2: 5,
  3: 10,
  4: 15,
  5: 25,
};

const EVIDENCE_MULTIPLIERS: Record<EvidenceType, number> = {
  conclusion: 1.0,
  certificate: 1.2,
  practical_application: 1.5,
  practical_presentation: 2.0,
};

interface CompetencyWeight {
  realm: Realm;
  percentage: number;
}

const CreateTeamMissionModal: React.FC<CreateTeamMissionModalProps> = ({ isOpen, onClose, onSave, missionToEdit, currentUser }) => {
  const { t } = useTranslation(['common']);
  const { members: dynamicMembers } = useMembers(currentUser);
  const [title, setTitle] = useState(missionToEdit?.title || '');
  const [description, setDescription] = useState(missionToEdit?.description || '');
  const [duration, setDuration] = useState(missionToEdit?.duration_est_min || 30);
  const [credits, setCredits] = useState(missionToEdit?.credit_reward || 10);
  const [deadlineHours, setDeadlineHours] = useState(48);
  const [assignAll, setAssignAll] = useState(!missionToEdit || missionToEdit.assignedTo.length === 0);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(missionToEdit?.assignedTo || []);

  // Dynamic math systems
  const [missionLevel, setMissionLevel] = useState<number>(missionToEdit?.missionLevel || 3);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>(missionToEdit?.evidenceType || 'conclusion');

  const initialWeights: CompetencyWeight[] = missionToEdit?.competencyWeights || [
    { realm: Realm.Engineering, percentage: 100 }
  ];
  const [weights, setWeights] = useState<CompetencyWeight[]>(initialWeights);

  if (!isOpen) return null;

  const handleAddCompetency = () => {
    const usedRealms = weights.map(w => w.realm);
    const availableRealm = SKILL_REALMS.find(r => !usedRealms.includes(r));
    if (availableRealm) {
      setWeights(prev => [...prev, { realm: availableRealm, percentage: 0 }]);
    }
  };

  const handleRemoveCompetency = (index: number) => {
    if (weights.length <= 1) return;
    setWeights(prev => prev.filter((_, i) => i !== index));
  };

  const handleWeightChange = (index: number, field: 'realm' | 'percentage', value: string | number) => {
    setWeights(prev => prev.map((w, i) => {
      if (i !== index) return w;
      if (field === 'realm') return { ...w, realm: value as Realm };
      return { ...w, percentage: Math.max(0, Math.min(100, Number(value))) };
    }));
  };

  const toggleMember = (member: string) => {
    setSelectedMembers(prev =>
      prev.includes(member)
        ? prev.filter(m => m !== member)
        : [...prev, member]
    );
  };

  const totalPercentage = weights.reduce((sum, w) => sum + w.percentage, 0);

  // Auto-calculated gross points
  const basePoints = LEVEL_POINTS[missionLevel] || 10;
  const multiplier = EVIDENCE_MULTIPLIERS[evidenceType] || 1.0;
  const grossPoints = basePoints * multiplier;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPercentage !== 100) {
      alert("A soma dos percentuais das competências deve ser exatamente 100%. Atual: " + totalPercentage + "%");
      return;
    }

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + deadlineHours);

    // Calculate final rewards dynamically based on weight percentages
    const finalRewards: RealmXpReward[] = weights.map(w => ({
      realm: w.realm,
      xp: Math.round(grossPoints * (w.percentage / 100)),
    }));

    onSave({
      title,
      description,
      realmRewards: finalRewards,
      credit_reward: Number(credits),
      difficulty: missionLevel >= 4 ? Difficulty.Hard : (missionLevel === 3 ? Difficulty.Medium : Difficulty.Easy),
      duration_est_min: Number(duration),
      deadline: deadline.toISOString(),
      assignedTo: assignAll ? [] : selectedMembers,
      missionLevel,
      evidenceType,
      evidenceMultiplier: multiplier,
      competencyWeights: weights,
    });
    // Note: the parent is responsible for closing/clearing the modal after save
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-primary rounded-2xl p-6 w-full max-w-lg relative border border-border-color max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{missionToEdit ? 'Editar Missão' : 'Criar Missão da Equipe'}</h2>
            <p className="text-xs text-text-secondary">Defina os detalhes da missão e o impacto de nivelamento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5">Título</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Ex: Desenvolver mecanismo de garra"
              className="w-full bg-background border border-border-color rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Descreva o objetivo desta missão..."
              className="w-full bg-background border border-border-color rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all resize-none"
            />
          </div>

          {/* Mission Level & Evidence Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5">Dificuldade (Nível)</label>
              <select
                value={missionLevel}
                onChange={e => setMissionLevel(Number(e.target.value))}
                className="w-full bg-background border border-border-color rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              >
                <option value={1}>Nível 1 - Contato Inicial (2 Pts Base)</option>
                <option value={2}>Nível 2 - Aprendizagem Guiada (5 Pts Base)</option>
                <option value={3}>Nível 3 - Aplicação Prática (10 Pts Base)</option>
                <option value={4}>Nível 4 - Dev. Avançado (15 Pts Base)</option>
                <option value={5}>Nível 5 - Especialista/Liderança (25 Pts Base)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5">Tipo de Evidência</label>
              <select
                value={evidenceType}
                onChange={e => setEvidenceType(e.target.value as EvidenceType)}
                className="w-full bg-background border border-border-color rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              >
                <option value="conclusion">Apenas conclusão (1.0x)</option>
                <option value="certificate">Certificado (1.2x)</option>
                <option value="practical_application">Aplicação prática (1.5x)</option>
                <option value="practical_presentation">Prática + Apresentação (2.0x)</option>
              </select>
            </div>
          </div>

          {/* Automatic Calculation Preview */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-400">Pontuação Bruta Calculada:</span>
            <div className="text-right">
              <span className="text-sm font-black text-white">{grossPoints} Pontos</span>
              <span className="block text-[9px] text-zinc-500 font-bold uppercase">{basePoints} Base x {multiplier} Mult.</span>
            </div>
          </div>

          {/* Competency Weights Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
                Competências Impactadas <span className={totalPercentage === 100 ? "text-green-400" : "text-red-400 font-black"}>({totalPercentage}% / 100%)</span>
              </label>
              {weights.length < Object.values(Realm).length && (
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
              {weights.map((w, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={w.realm}
                    onChange={e => handleWeightChange(index, 'realm', e.target.value)}
                    className="flex-1 bg-background border border-border-color rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  >
                    {SKILL_REALMS.map(r => (
                      <option key={r} value={r} disabled={weights.some((w2, i2) => i2 !== index && w2.realm === r)}>
                        {t(`common:realm.${r}`)}
                      </option>
                    ))}
                  </select>
                  <div className="relative w-24">
                    <input
                      type="number"
                      value={w.percentage}
                      onChange={e => handleWeightChange(index, 'percentage', e.target.value)}
                      min="0"
                      max="100"
                      className="w-full bg-background border border-border-color rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30 pr-8 text-right"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">%</span>
                  </div>
                  {weights.length > 1 && (
                    <button type="button" onClick={() => handleRemoveCompetency(index)} className="text-red-400 hover:text-red-300 p-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Duration, Credits, Deadline */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5">Duração (min)</label>
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min="1"
                className="w-full bg-background border border-border-color rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5">Créditos</label>
              <input type="number" value={credits} onChange={e => setCredits(Number(e.target.value))} min="0"
                className="w-full bg-background border border-border-color rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5">Prazo (horas)</label>
              <input type="number" value={deadlineHours} onChange={e => setDeadlineHours(Number(e.target.value))} min="1"
                className="w-full bg-background border border-border-color rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30" />
            </div>
          </div>

          {/* Member Assignment */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2">Atribuir Para</label>
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => setAssignAll(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${assignAll ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' : 'bg-background border border-border-color text-text-secondary hover:text-white'}`}
              >
                Toda a Equipe
              </button>
              <button
                type="button"
                onClick={() => setAssignAll(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!assignAll ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' : 'bg-background border border-border-color text-text-secondary hover:text-white'}`}
              >
                Membros Específicos
              </button>
            </div>
            {!assignAll && (
              <div className="flex flex-wrap gap-2">
                {dynamicMembers
                  .filter(m => m.role === 'member' && m.active)
                  .map(m => m.username)
                  .map(member => (
                    <button
                      key={member}
                      type="button"
                      onClick={() => toggleMember(member)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedMembers.includes(member)
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-background border border-border-color text-text-secondary hover:text-white hover:border-white/20'
                      }`}
                    >
                      {member}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-border-color/50 text-text-secondary hover:text-white font-bold text-sm transition-all">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title || weights.length === 0 || totalPercentage !== 100 || (!assignAll && selectedMembers.length === 0)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {missionToEdit ? 'Salvar Alterações' : 'Criar Missão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamMissionModal;
