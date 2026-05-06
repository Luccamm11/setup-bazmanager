import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, RefreshCw, ChevronDown, User, Users,
  Zap, Coins, Star, Edit2, Trash2, CheckCircle,
  Clock, PlayCircle, Bell, FileText
} from 'lucide-react';
import type { FiveW2HPlan, RealmXpReward } from '../../types';
import { MEMBER_USERNAMES, TECHNICIAN_USERNAMES, getMemberByUsername } from '../../data/members';
import { STATUS_META, REALM_LABELS, REALM_COLORS, FIVE_W2H_FIELDS } from './types';
import PlanModal from './PlanModal';
import ReviewModal from './ReviewModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanDraft = Omit<FiveW2HPlan, 'id' | 'createdBy' | 'status' | 'createdAt' | 'updatedAt' | 'realmRewards' | 'creditReward' | 'reviewedBy' | 'reviewedAt' | 'reviewNote'>;

interface Props {
  currentUser: string;
  userRole: 'member' | 'technician';
}

const isTech = (username: string) => TECHNICIAN_USERNAMES.includes(username);

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface CardProps {
  plan: FiveW2HPlan;
  currentUser: string;
  isTechnician: boolean;
  onEdit: (plan: FiveW2HPlan) => void;
  onDelete: (id: string) => void;
  onReview: (plan: FiveW2HPlan) => void;
  onStatusChange: (id: string, status: FiveW2HPlan['status']) => void;
}

const STATUS_NEXT: Record<FiveW2HPlan['status'], FiveW2HPlan['status'] | null> = {
  pending_review: null,
  approved: 'in_progress',
  in_progress: 'done',
  done: null,
};

const STATUS_ACTION_LABEL: Record<string, string> = {
  approved: 'Iniciar',
  in_progress: 'Concluir',
};

const PlanCard: React.FC<CardProps> = ({ plan, currentUser, isTechnician, onEdit, onDelete, onReview, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const statusMeta = STATUS_META[plan.status];
  const canEdit = isTechnician || plan.createdBy === currentUser;
  const nextStatus = STATUS_NEXT[plan.status];
  const canAdvance = canEdit && nextStatus !== null && plan.status !== 'pending_review';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`bg-white/[0.03] border rounded-2xl overflow-hidden transition-colors ${
        plan.status === 'pending_review' ? 'border-amber-500/25' : 'border-white/5 hover:border-white/10'
      }`}
    >
      {/* Pending review banner */}
      {plan.status === 'pending_review' && isTechnician && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Bell className="w-3.5 h-3.5" /> Aguardando sua avaliação
          </div>
          <button
            onClick={() => onReview(plan)}
            className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-black px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <Star className="w-3 h-3" /> Avaliar
          </button>
        </div>
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
              {plan.isGroup && (
                <span className="text-[10px] font-bold text-text-muted bg-white/5 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" /> Grupo
                </span>
              )}
            </div>
            <h4 className="font-black text-white text-sm leading-snug truncate">{plan.title}</h4>
            <p className="text-text-muted text-xs mt-0.5">por {plan.createdBy} · {new Date(plan.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canEdit && (
              <button onClick={() => onEdit(plan)} className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {canEdit && (
              <button onClick={() => onDelete(plan.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setExpanded(p => !p)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary: what + why */}
        <p className="text-text-secondary text-xs leading-relaxed line-clamp-2">{plan.what}</p>

        {/* Expand */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/5">
                {FIVE_W2H_FIELDS.map(field => {
                  const val = (plan as any)[field.key];
                  if (!val) return null;
                  return (
                    <div key={field.key} className={field.key === 'how' || field.key === 'howMuch' ? 'sm:col-span-2' : ''}>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{field.label}</p>
                      <p className="text-text-secondary text-xs leading-relaxed">{val}</p>
                    </div>
                  );
                })}
              </div>

              {/* XP rewards */}
              {plan.realmRewards.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Recompensas</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.realmRewards.map(rw => (
                      <span key={rw.realm} className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${REALM_COLORS[rw.realm]}`}>
                        <Zap className="w-3 h-3" /> {REALM_LABELS[rw.realm]}: +{rw.xp} XP
                      </span>
                    ))}
                    {plan.creditReward > 0 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg border bg-yellow-500/10 text-yellow-400 border-yellow-500/20 flex items-center gap-1.5">
                        <Coins className="w-3 h-3" /> +{plan.creditReward} créditos
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Review note */}
              {plan.reviewNote && (
                <div className="mt-3 bg-orange-500/5 border border-orange-500/15 rounded-xl px-3 py-2">
                  <p className="text-[10px] font-black text-orange-400/70 uppercase tracking-widest mb-1">Feedback do técnico</p>
                  <p className="text-xs text-text-secondary">{plan.reviewNote}</p>
                </div>
              )}

              {/* Advance status */}
              {canAdvance && nextStatus && (
                <button
                  onClick={() => onStatusChange(plan.id, nextStatus)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-text-secondary hover:text-white text-xs font-bold transition-all"
                >
                  {nextStatus === 'in_progress' ? <PlayCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  {STATUS_ACTION_LABEL[plan.status]}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Main Board ───────────────────────────────────────────────────────────────

const FiveW2HBoard: React.FC<Props> = ({ currentUser, userRole }) => {
  const [plans, setPlans] = useState<FiveW2HPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetMember, setTargetMember] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FiveW2HPlan | null>(null);
  const [reviewingPlan, setReviewingPlan] = useState<FiveW2HPlan | null>(null);
  const isTechnician = userRole === 'technician';

  // Who are we viewing?
  const viewUser = isTechnician && targetMember ? targetMember : currentUser;

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const url = isTechnician && targetMember
        ? `/api/5w2h?username=${currentUser}&target=${targetMember}`
        : `/api/5w2h?username=${currentUser}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setPlans(data.plans);
    } catch (e) {
      console.error('5W2H fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isTechnician, targetMember]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleSavePlan = async (draft: PlanDraft) => {
    if (editingPlan) {
      await fetch('/api/5w2h', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, planId: editingPlan.id, action: 'edit', updates: draft }),
      });
    } else {
      const planPayload = {
        ...draft,
        assignedTo: draft.isGroup ? draft.assignedTo : (isTechnician && targetMember ? [targetMember] : []),
      };
      await fetch('/api/5w2h', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, plan: planPayload }),
      });
    }
    setEditingPlan(null);
    fetchPlans();
  };

  const handleDelete = async (planId: string) => {
    await fetch('/api/5w2h', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser, planId }),
    });
    fetchPlans();
  };

  const handleReview = async (realmRewards: RealmXpReward[], creditReward: number, note: string) => {
    if (!reviewingPlan) return;
    await fetch('/api/5w2h', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser,
        planId: reviewingPlan.id,
        action: 'review',
        updates: { realmRewards, creditReward, reviewNote: note },
      }),
    });
    setReviewingPlan(null);
    fetchPlans();
  };

  const handleStatusChange = async (planId: string, status: FiveW2HPlan['status']) => {
    await fetch('/api/5w2h', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser, planId, action: 'status', updates: { status } }),
    });
    fetchPlans();
  };

  const pendingReviewCount = plans.filter(p => p.status === 'pending_review').length;

  const filtered = plans.filter(p => filterStatus === 'all' || p.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-accent-primary" />
            <h2 className="text-3xl font-black tracking-tight">5W2H</h2>
          </div>
          <p className="text-text-secondary text-sm">Quadro de planejamento individual e em grupo</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingReviewCount > 0 && isTechnician && (
            <span className="bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" /> {pendingReviewCount} para avaliar
            </span>
          )}
          <button onClick={fetchPlans} className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-text-muted hover:text-white transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setEditingPlan(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-accent-primary hover:opacity-90 text-white font-black px-4 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] text-sm"
          >
            <Plus className="w-4 h-4" /> Novo Plano
          </button>
        </div>
      </div>

      {/* Technician: member selector */}
      {isTechnician && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
          <p className="text-xs font-black text-text-muted uppercase tracking-widest mr-2">Ver quadro de:</p>
          <button
            onClick={() => setTargetMember('')}
            className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${!targetMember ? 'bg-accent-primary/15 border-accent-primary/30 text-accent-primary' : 'border-white/10 text-text-muted hover:text-white'}`}
          >
            Todos
          </button>
          {MEMBER_USERNAMES.map(u => (
            <button
              key={u}
              onClick={() => setTargetMember(u)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${targetMember === u ? 'bg-accent-primary/15 border-accent-primary/30 text-accent-primary' : 'border-white/10 text-text-muted hover:text-white'}`}
            >
              {u}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'pending_review', 'approved', 'in_progress', 'done'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-bold whitespace-nowrap transition-all ${filterStatus === s ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-text-muted hover:text-white hover:border-white/10'}`}
          >
            {s === 'all' ? 'Todos' : STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-text-muted animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-3">
          <FileText className="w-12 h-12 opacity-20" />
          <p className="font-semibold">Nenhum plano encontrado</p>
          <p className="text-xs opacity-60">Crie seu primeiro plano 5W2H!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentUser={currentUser}
                isTechnician={isTechnician}
                onEdit={p => { setEditingPlan(p); setShowModal(true); }}
                onDelete={handleDelete}
                onReview={p => setReviewingPlan(p)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <PlanModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPlan(null); }}
        onSave={handleSavePlan}
        planToEdit={editingPlan}
        currentUser={currentUser}
        isTechnician={isTechnician}
      />

      {reviewingPlan && (
        <ReviewModal
          plan={reviewingPlan}
          isOpen={!!reviewingPlan}
          onClose={() => setReviewingPlan(null)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
};

export default FiveW2HBoard;
