import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Coins, Zap, Trash2, Plus } from 'lucide-react';
import type { FiveW2HPlan, RealmXpReward } from '../../types';
import { Realm } from '../../types';
import { SKILL_REALMS } from '../../constants';
import { REALM_LABELS, REALM_COLORS } from './types';

interface Props {
  plan: FiveW2HPlan;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (realmRewards: RealmXpReward[], creditReward: number, note: string) => void;
}

const ReviewModal: React.FC<Props> = ({ plan, isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation(['common']);
  const [rewards, setRewards] = useState<RealmXpReward[]>(
    plan.realmRewards.length > 0 ? plan.realmRewards : [{ realm: Realm.Planning, xp: 50 }]
  );
  const [creditReward, setCreditReward] = useState(plan.creditReward || 0);
  const [note, setNote] = useState(plan.reviewNote || '');

  if (!isOpen) return null;

  const addRealm = () => {
    const unused = SKILL_REALMS.find(r => !rewards.some(rw => rw.realm === r));
    if (unused) setRewards(prev => [...prev, { realm: unused, xp: 25 }]);
  };

  const updateRealm = (idx: number, realm: Realm) =>
    setRewards(prev => prev.map((r, i) => i === idx ? { ...r, realm } : r));

  const updateXp = (idx: number, xp: number) =>
    setRewards(prev => prev.map((r, i) => i === idx ? { ...r, xp } : r));

  const removeRealm = (idx: number) =>
    setRewards(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    const validRewards = rewards.filter(r => r.xp > 0);
    onSubmit(validRewards, creditReward, note);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[#0d0f14] border border-orange-500/20 rounded-2xl w-full max-w-lg shadow-2xl"
          initial={{ scale: 0.93, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                <Star className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Avaliar Plano</h3>
                <p className="text-xs text-text-muted truncate max-w-[280px]">{plan.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Realm XP rewards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Reinos & XP
                </label>
                <button
                  onClick={addRealm}
                  disabled={rewards.length >= SKILL_REALMS.length}
                  className="flex items-center gap-1 text-xs text-accent-primary hover:opacity-80 transition-opacity disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar reino
                </button>
              </div>

              <div className="space-y-2">
                {rewards.map((reward, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {/* Realm selector */}
                    <select
                      value={reward.realm}
                      onChange={e => updateRealm(idx, e.target.value as Realm)}
                      className="flex-1 bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:border-accent-primary appearance-none"
                    >
                      {SKILL_REALMS.map(r => (
                        <option key={r} value={r}>{t(`common:realm.${r}`)}</option>
                      ))}
                    </select>

                    {/* XP input */}
                    <div className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 w-24">
                      <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={reward.xp}
                        onChange={e => updateXp(idx, Number(e.target.value))}
                        className="w-full bg-transparent text-white text-xs focus:outline-none text-right"
                      />
                      <span className="text-text-muted text-xs">XP</span>
                    </div>

                    <button onClick={() => removeRealm(idx)} className="p-1.5 text-text-muted hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Credits */}
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-yellow-400" /> Créditos de recompensa
              </label>
              <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5">
                <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
                <input
                  type="number"
                  min={0}
                  value={creditReward}
                  onChange={e => setCreditReward(Number(e.target.value))}
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                Nota / Feedback (opcional)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ex: Bom planejamento! Detalhe mais o 'como'."
                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-accent-primary resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-text-secondary font-bold hover:bg-white/5 transition-all text-sm">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.2)] text-sm"
            >
              <Star className="w-4 h-4" /> Aprovar & Salvar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
