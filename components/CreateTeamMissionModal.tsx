import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Realm, Difficulty, RealmXpReward, TeamMission } from '../types';
import { ALL_MEMBERS } from '../constants';

interface CreateTeamMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mission: Omit<TeamMission, 'id' | 'createdBy' | 'completedBy' | 'createdAt'>) => void;
  missionToEdit?: TeamMission | null;
}

const CreateTeamMissionModal: React.FC<CreateTeamMissionModalProps> = ({ isOpen, onClose, onSave, missionToEdit }) => {
  const [title, setTitle] = useState(missionToEdit?.title || '');
  const [description, setDescription] = useState(missionToEdit?.description || '');
  const [difficulty, setDifficulty] = useState<Difficulty>(missionToEdit?.difficulty || Difficulty.Medium);
  const [duration, setDuration] = useState(missionToEdit?.duration_est_min || 30);
  const [credits, setCredits] = useState(missionToEdit?.credit_reward || 10);
  const [deadlineHours, setDeadlineHours] = useState(48);
  const [assignAll, setAssignAll] = useState(!missionToEdit || missionToEdit.assignedTo.length === 0);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(missionToEdit?.assignedTo || []);
  const [realmRewards, setRealmRewards] = useState<RealmXpReward[]>(
    missionToEdit?.realmRewards || [{ realm: Realm.Mind, xp: 20 }]
  );

  if (!isOpen) return null;

  const handleAddRealm = () => {
    const usedRealms = realmRewards.map(r => r.realm);
    const availableRealm = Object.values(Realm).find(r => !usedRealms.includes(r));
    if (availableRealm) {
      setRealmRewards(prev => [...prev, { realm: availableRealm, xp: 10 }]);
    }
  };

  const handleRemoveRealm = (index: number) => {
    if (realmRewards.length <= 1) return;
    setRealmRewards(prev => prev.filter((_, i) => i !== index));
  };

  const handleRealmChange = (index: number, field: 'realm' | 'xp', value: string | number) => {
    setRealmRewards(prev => prev.map((r, i) => {
      if (i !== index) return r;
      if (field === 'realm') return { ...r, realm: value as Realm };
      return { ...r, xp: Number(value) };
    }));
  };

  const toggleMember = (member: string) => {
    setSelectedMembers(prev =>
      prev.includes(member)
        ? prev.filter(m => m !== member)
        : [...prev, member]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + deadlineHours);

    onSave({
      title,
      description,
      realmRewards,
      credit_reward: Number(credits),
      difficulty,
      duration_est_min: Number(duration),
      deadline: deadline.toISOString(),
      assignedTo: assignAll ? [] : selectedMembers,
    });
    onClose();
  };

  const totalXp = realmRewards.reduce((sum, r) => sum + r.xp, 0);

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
            <p className="text-xs text-text-secondary">Defina os detalhes da missão para a equipe</p>
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
              placeholder="Ex: Completar tutorial de Python"
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

          {/* Multi-Realm XP */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
                XP por Reino <span className="text-accent-primary">({totalXp} XP total)</span>
              </label>
              {realmRewards.length < Object.values(Realm).length && (
                <button
                  type="button"
                  onClick={handleAddRealm}
                  className="flex items-center gap-1 text-[10px] font-bold text-accent-primary hover:text-accent-primary/80 transition-colors uppercase tracking-wider"
                >
                  <Plus className="w-3 h-3" /> Adicionar Reino
                </button>
              )}
            </div>
            <div className="space-y-2">
              {realmRewards.map((rr, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={rr.realm}
                    onChange={e => handleRealmChange(index, 'realm', e.target.value)}
                    className="flex-1 bg-background border border-border-color rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  >
                    {Object.values(Realm).map(r => (
                      <option key={r} value={r} disabled={realmRewards.some((rr2, i2) => i2 !== index && rr2.realm === r)}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <div className="relative w-24">
                    <input
                      type="number"
                      value={rr.xp}
                      onChange={e => handleRealmChange(index, 'xp', e.target.value)}
                      min="1"
                      className="w-full bg-background border border-border-color rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">XP</span>
                  </div>
                  {realmRewards.length > 1 && (
                    <button type="button" onClick={() => handleRemoveRealm(index)} className="text-red-400 hover:text-red-300 p-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty, Duration, Credits, Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1.5">Dificuldade</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as Difficulty)}
                className="w-full bg-background border border-border-color rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
              >
                {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
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
                {ALL_MEMBERS.map(member => (
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
              disabled={!title || realmRewards.length === 0 || (!assignAll && selectedMembers.length === 0)}
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
