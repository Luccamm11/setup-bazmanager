import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Save, Users, User, Link2, Image, AlertCircle } from 'lucide-react';
import type { FiveW2HPlan, RealmXpReward } from '../../types';
import { Realm } from '../../types';
import { SKILL_REALMS } from '../../constants';
import { MEMBER_USERNAMES } from '../../data/members';
import { REALM_LABELS, REALM_COLORS, FIVE_W2H_FIELDS } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanDraft = Omit<FiveW2HPlan, 'id' | 'createdBy' | 'status' | 'createdAt' | 'updatedAt' | 'realmRewards' | 'creditReward' | 'reviewedBy' | 'reviewedAt' | 'reviewNote'>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: PlanDraft) => void;
  planToEdit?: FiveW2HPlan | null;
  currentUser: string;
  isTechnician: boolean;
}

// ─── Empty draft ──────────────────────────────────────────────────────────────

const emptyDraft = (): PlanDraft => ({
  title: '',
  what: '', why: '', who: '', where: '', when: '', how: '', howMuch: '',
  isGroup: false,
  assignedTo: [],
  imageLinks: [],
});

// ─── Component ────────────────────────────────────────────────────────────────

const PlanModal: React.FC<Props> = ({ isOpen, onClose, onSave, planToEdit, currentUser, isTechnician }) => {
  const [draft, setDraft] = useState<PlanDraft>(emptyDraft());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (planToEdit) {
      const { id, createdBy, status, createdAt, updatedAt, realmRewards, creditReward, reviewedBy, reviewedAt, reviewNote, ...rest } = planToEdit;
      setDraft(rest);
    } else {
      setDraft(emptyDraft());
    }
    setErrors({});
  }, [planToEdit, isOpen]);

  if (!isOpen) return null;

  const set = (field: keyof PlanDraft, value: any) =>
    setDraft(prev => ({ ...prev, [field]: value }));

  const toggleMember = (username: string) => {
    setDraft(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(username)
        ? prev.assignedTo.filter(u => u !== username)
        : [...prev.assignedTo, username],
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!draft.title.trim()) errs.title = 'Título é obrigatório';
    if (!draft.what.trim())  errs.what  = 'Campo obrigatório';
    if (!draft.why.trim())   errs.why   = 'Campo obrigatório';
    if (!draft.how.trim())   errs.how   = 'Campo obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(draft);
    onClose();
  };

  // Members that can be assigned (all except current user for technicians, all members for members)
  const assignableMembers = isTechnician
    ? MEMBER_USERNAMES
    : MEMBER_USERNAMES.filter(u => u !== currentUser);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/70 backdrop-blur-sm overflow-y-auto"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[#0d0f14] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl mb-10"
          initial={{ scale: 0.93, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-primary/15 border border-accent-primary/25 flex items-center justify-center">
                <Plus className="w-4 h-4 text-accent-primary" />
              </div>
              <h3 className="font-black text-white text-lg">
                {planToEdit ? 'Editar Plano 5W2H' : 'Novo Plano 5W2H'}
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">Título do plano *</label>
              <input
                type="text"
                value={draft.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ex: Documentar sistema de intake"
                className={`w-full bg-black/30 border rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none transition-colors ${errors.title ? 'border-red-500/60' : 'border-white/10 focus:border-accent-primary'}`}
              />
              {errors.title && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
            </div>

            {/* 5W2H Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIVE_W2H_FIELDS.map(field => (
                <div key={field.key} className={field.key === 'how' || field.key === 'howMuch' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                    {field.label} {(field.key === 'what' || field.key === 'why' || field.key === 'how') && '*'}
                  </label>
                  {field.key === 'how' || field.key === 'howMuch' ? (
                    <textarea
                      rows={2}
                      value={draft[field.key as keyof PlanDraft] as string}
                      onChange={e => set(field.key as keyof PlanDraft, e.target.value)}
                      placeholder={field.placeholder}
                      className={`w-full bg-black/30 border rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none transition-colors resize-none ${errors[field.key] ? 'border-red-500/60' : 'border-white/10 focus:border-accent-primary'}`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={draft[field.key as keyof PlanDraft] as string}
                      onChange={e => set(field.key as keyof PlanDraft, e.target.value)}
                      placeholder={field.placeholder}
                      className={`w-full bg-black/30 border rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none transition-colors ${errors[field.key] ? 'border-red-500/60' : 'border-white/10 focus:border-accent-primary'}`}
                    />
                  )}
                  {errors[field.key] && <p className="text-red-400 text-xs mt-1">{errors[field.key]}</p>}
                </div>
              ))}
            </div>

            {/* Group / Assign */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <label className="block text-xs font-black text-text-muted uppercase tracking-widest">Atribuir a</label>
                <button
                  onClick={() => set('isGroup', false)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${!draft.isGroup ? 'bg-accent-primary/15 border-accent-primary/30 text-accent-primary' : 'border-white/10 text-text-muted hover:text-white'}`}
                >
                  <User className="w-3.5 h-3.5" /> Só eu
                </button>
                <button
                  onClick={() => set('isGroup', true)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${draft.isGroup ? 'bg-accent-primary/15 border-accent-primary/30 text-accent-primary' : 'border-white/10 text-text-muted hover:text-white'}`}
                >
                  <Users className="w-3.5 h-3.5" /> Grupo
                </button>
              </div>

              {draft.isGroup && (
                <div className="flex flex-wrap gap-2">
                  {assignableMembers.map(username => (
                    <button
                      key={username}
                      onClick={() => toggleMember(username)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${draft.assignedTo.includes(username) ? 'bg-accent-primary/15 border-accent-primary/30 text-accent-primary' : 'border-white/10 text-text-muted hover:text-white'}`}
                    >
                      {username}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Image Links */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" /> Links de Imagens
                </label>
                <button
                  type="button"
                  onClick={() => set('imageLinks', [...(draft.imageLinks || []), ''])}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-accent-primary/10 border border-accent-primary/25 text-accent-primary font-bold hover:bg-accent-primary/20 transition-all"
                >
                  <Plus className="w-3 h-3" /> Adicionar link
                </button>
              </div>

              {(draft.imageLinks || []).length === 0 && (
                <p className="text-[11px] text-text-muted italic">Nenhum link adicionado ainda.</p>
              )}

              <div className="space-y-2">
                {(draft.imageLinks || []).map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-black/30 border border-white/10 overflow-hidden">
                      {link && link.startsWith('http') ? (
                        <img src={link} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Link2 className="w-3 h-3 text-text-muted" />
                        </div>
                      )}
                    </div>
                    <input
                      type="url"
                      value={link}
                      onChange={e => {
                        const updated = [...(draft.imageLinks || [])];
                        updated[idx] = e.target.value;
                        set('imageLinks', updated);
                      }}
                      placeholder="https://drive.google.com/..."
                      className="flex-1 bg-black/30 border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-accent-primary transition-colors placeholder:text-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (draft.imageLinks || []).filter((_, i) => i !== idx);
                        set('imageLinks', updated);
                      }}
                      className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-text-secondary font-bold hover:bg-white/5 transition-all text-sm">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl bg-accent-primary text-white font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.2)] text-sm"
            >
              <Save className="w-4 h-4" />
              {planToEdit ? 'Salvar alterações' : 'Criar plano'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PlanModal;
