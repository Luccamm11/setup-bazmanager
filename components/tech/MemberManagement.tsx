import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, UserX, Edit3, Check, X, RefreshCw,
  Users, AlertTriangle, ChevronDown, Award, Search,
} from 'lucide-react';

interface MemberEntry {
  username: string;
  displayName: string;
  awardFocus: string | null;
  active: boolean;
}

interface MemberManagementProps {
  currentUser: string;
}

const AWARD_OPTIONS = [
  { value: 'Sustentabilidade',   label: '🌱 Sustentabilidade' },
  { value: 'PensamentoCriativo', label: '💡 Pensamento Criativo' },
  { value: 'Conexao',            label: '🤝 Conexão' },
  { value: 'Alcance',            label: '📢 Alcance' },
  { value: 'Controle',           label: '🤖 Controle' },
  { value: 'Inovacao',           label: '🚀 Inovação' },
  { value: 'Design',             label: '🔧 Design Industrial' },
];

const AWARD_LABEL: Record<string, string> = Object.fromEntries(
  AWARD_OPTIONS.map(o => [o.value, o.label])
);

// ─── Inline Edit Form ────────────────────────────────────────────────────────

interface EditFormProps {
  member: MemberEntry;
  onSave: (data: Partial<MemberEntry>) => Promise<void>;
  onCancel: () => void;
}

const EditForm: React.FC<EditFormProps> = ({ member, onSave, onCancel }) => {
  const [displayName, setDisplayName] = useState(member.displayName);
  const [awardFocus, setAwardFocus] = useState(member.awardFocus || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ displayName, awardFocus: awardFocus || null });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 pt-3 border-t border-white/10 space-y-3"
    >
      <div>
        <label className="text-xs text-text-secondary mb-1 block">Nome de exibição</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary/60"
        />
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-1 block">Foco de Prêmio</label>
        <div className="relative">
          <select
            value={awardFocus}
            onChange={e => setAwardFocus(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-accent-primary/60 pr-8"
          >
            <option value="">— Nenhum —</option>
            {AWARD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold hover:bg-green-500/30 transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary text-sm hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Member Card ─────────────────────────────────────────────────────────────

interface MemberCardProps {
  member: MemberEntry;
  currentUser: string;
  onEdit: (data: Partial<MemberEntry>) => Promise<void>;
  onToggleActive: (active: boolean) => Promise<void>;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, currentUser, onEdit, onToggleActive }) => {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative p-4 rounded-xl border transition-all duration-300 ${
        member.active
          ? 'bg-white/[0.03] border-white/10 hover:border-white/20'
          : 'bg-red-500/5 border-red-500/20 opacity-60'
      }`}
    >
      {!member.active && (
        <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold uppercase tracking-wider">
          Inativo
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary/30 to-accent-tertiary/30 flex items-center justify-center shrink-0 text-white font-bold text-sm border border-white/10">
          {member.displayName.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{member.displayName}</span>
            <span className="text-xs text-text-muted">@{member.username}</span>
          </div>
          {member.awardFocus && (
            <div className="flex items-center gap-1 mt-1">
              <Award className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-300">{AWARD_LABEL[member.awardFocus] || member.awardFocus}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 shrink-0">
          {member.active && (
            <button
              onClick={() => setEditing(v => !v)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-text-secondary transition-all"
              title="Editar"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {member.active ? (
            confirming ? (
              <div className="flex gap-1">
                <button
                  onClick={async () => { await onToggleActive(false); setConfirming(false); }}
                  className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all"
                  title="Confirmar inativação"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-text-secondary transition-all"
                title="Inativar membro"
              >
                <UserX className="w-3.5 h-3.5" />
              </button>
            )
          ) : (
            <button
              onClick={() => onToggleActive(true)}
              className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all"
              title="Reativar membro"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <EditForm
            member={member}
            onSave={async data => { await onEdit(data); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Add Member Form ──────────────────────────────────────────────────────────

interface AddMemberFormProps {
  currentUser: string;
  onAdded: () => void;
}

const AddMemberForm: React.FC<AddMemberFormProps> = ({ currentUser, onAdded }) => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [awardFocus, setAwardFocus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!username.trim() || !displayName.trim()) {
      setError('Preencha o username e o nome de exibição.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester: currentUser, username: username.trim(), displayName: displayName.trim(), awardFocus: awardFocus || null }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setUsername(''); setDisplayName(''); setAwardFocus('');
      setOpen(false);
      onAdded();
    } catch (e: any) {
      setError(e.message || 'Erro ao adicionar membro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary/20 to-accent-tertiary/20 border border-accent-primary/30 text-accent-primary font-bold text-sm hover:from-accent-primary/30 hover:to-accent-tertiary/30 transition-all"
      >
        <UserPlus className="w-4 h-4" />
        Adicionar Membro
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Novo Membro</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Username (login)</label>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Ex: Maria"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/60"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Nome de exibição</label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Ex: Maria Souza"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/60"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Foco de Prêmio</label>
                <div className="relative">
                  <select
                    value={awardFocus}
                    onChange={e => setAwardFocus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-accent-primary/60 pr-8"
                  >
                    <option value="">— Nenhum —</option>
                    {AWARD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                </div>
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> {error}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent-primary/20 border border-accent-primary/30 text-accent-primary text-sm font-bold hover:bg-accent-primary/30 transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirmar
                </button>
                <button
                  onClick={() => { setOpen(false); setError(null); }}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary text-sm hover:text-white transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MemberManagement: React.FC<MemberManagementProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/members?requester=${encodeURIComponent(currentUser)}&includeInactive=true`);
      const data = await res.json();
      if (data.success) setMembers(data.members);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleEdit = async (username: string, data: Partial<MemberEntry>) => {
    await fetch('/api/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester: currentUser, username, ...data }),
    });
    await fetchMembers();
  };

  const handleToggleActive = async (username: string, active: boolean) => {
    await fetch('/api/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester: currentUser, username, active }),
    });
    await fetchMembers();
  };

  const filtered = members.filter(m => {
    if (!showInactive && !m.active) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.username.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount = members.filter(m => m.active).length;
  const inactiveCount = members.filter(m => !m.active).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-accent-primary" />
            Gerenciar Membros
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            <span className="text-green-400 font-bold">{activeCount}</span> ativos
            {inactiveCount > 0 && (
              <> · <span className="text-red-400 font-bold">{inactiveCount}</span> inativos</>
            )}
          </p>
        </div>
        <button
          onClick={fetchMembers}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-text-secondary hover:text-white transition-all"
          title="Atualizar lista"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Add Member */}
      <AddMemberForm currentUser={currentUser} onAdded={fetchMembers} />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar membro…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/40"
          />
        </div>
        <button
          onClick={() => setShowInactive(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all ${
            showInactive
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'bg-white/5 border-white/10 text-text-secondary hover:text-white'
          }`}
        >
          <UserX className="w-4 h-4" />
          {showInactive ? 'Ocultar inativos' : 'Ver inativos'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-text-secondary">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Carregando membros…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Nenhum membro encontrado.
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(member => (
              <MemberCard
                key={member.username}
                member={member}
                currentUser={currentUser}
                onEdit={data => handleEdit(member.username, data)}
                onToggleActive={active => handleToggleActive(member.username, active)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default MemberManagement;
