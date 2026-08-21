import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TeamMission, Realm } from '../types';
import { ALL_MEMBERS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Trophy, Zap, Trash2, CheckCircle, Clock, Shield, RefreshCw, Target, Crown, Star, Pencil, RotateCcw, AlertTriangle, X, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RESET_XP_PASSWORD = '021083';

interface MemberProgress {
  username: string;
  name: string;
  level: number;
  rank: string;
  xpTotal: number;
  questsCompleted: number;
  bossQuestsCompleted: number;
  stats: { [key: string]: number };
  streak: number;
}

interface ResetXpModalProps {
  member: MemberProgress;
  requester: string;
  onClose: () => void;
  onSuccess: (username: string) => void;
}

const ResetXpModal: React.FC<ResetXpModalProps> = ({ member, requester, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const isPasswordCorrect = password === RESET_XP_PASSWORD;

  const handleConfirm = async () => {
    if (!isPasswordCorrect || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/members?action=reset-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester, targetMember: member.username }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(member.username);
      } else {
        setError(data.error || 'Erro desconhecido ao resetar XP.');
      }
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-zinc-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl shadow-red-500/10"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm">Resetar XP</h3>
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider">Ação irreversível</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-5">
          <p className="text-zinc-300 text-xs leading-relaxed">
            Isso irá zerar o <span className="text-red-400 font-bold">XP total, nível e stats</span> de{' '}
            <span className="text-white font-black">{member.name}</span>.
            Quests, créditos, badges e outros dados <span className="text-green-400 font-bold">serão mantidos</span>.
          </p>
        </div>

        {/* Password input */}
        <div className="mb-5">
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Senha de confirmação
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              placeholder="Digite a senha..."
              className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-zinc-700 outline-none transition-all ${
                password.length > 0
                  ? isPasswordCorrect
                    ? 'border-green-500/50 focus:border-green-500'
                    : 'border-red-500/40 focus:border-red-500/60'
                  : 'border-white/10 focus:border-white/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password.length > 0 && !isPasswordCorrect && (
            <p className="text-red-400 text-[10px] mt-1.5 font-semibold">Senha incorreta</p>
          )}
          {isPasswordCorrect && (
            <p className="text-green-400 text-[10px] mt-1.5 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Senha correta
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-xs font-bold hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isPasswordCorrect || isLoading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-500/20 transition-all hover:shadow-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Resetando...
              </span>
            ) : (
              'Confirmar Reset'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface TechDashboardProps {
  currentUser: string;
  missions: TeamMission[];
  onCreateMission: () => void;
  onEditMission: (mission: TeamMission) => void;
  onDeleteMission: (missionId: string) => void;
  onRefreshMissions: () => void;
  isMissionsLoading: boolean;
}

const RANK_LABELS: { [key: string]: string } = {
  e_rank: 'E-Rank',
  d_rank: 'D-Rank',
  c_rank: 'C-Rank',
  b_rank: 'B-Rank',
  a_rank: 'A-Rank',
  s_rank: 'S-Rank',
};

const RANK_COLORS: { [key: string]: string } = {
  e_rank: 'from-zinc-500 to-zinc-600',
  d_rank: 'from-green-500 to-emerald-600',
  c_rank: 'from-blue-500 to-cyan-600',
  b_rank: 'from-purple-500 to-violet-600',
  a_rank: 'from-orange-500 to-red-600',
  s_rank: 'from-yellow-500 to-amber-500',
};

const TechDashboard: React.FC<TechDashboardProps> = ({
  currentUser,
  missions,
  onCreateMission,
  onEditMission,
  onDeleteMission,
  onRefreshMissions,
  isMissionsLoading,
}) => {
  const { t } = useTranslation(['dashboard']);
  const [membersProgress, setMembersProgress] = useState<MemberProgress[]>([]);
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'missions' | 'members'>('missions');
  const [missionFilter, setMissionFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [resetXpTarget, setResetXpTarget] = useState<MemberProgress | null>(null);
  const [resetSuccessMap, setResetSuccessMap] = useState<Record<string, boolean>>({});

  const fetchProgress = useCallback(async () => {
    setIsProgressLoading(true);
    try {
      const res = await fetch(`/api/members?action=progress&username=${currentUser}`);
      const data = await res.json();
      if (data.success) {
        setMembersProgress(data.members);
      }
    } catch (err) {
      console.error('Error fetching team progress:', err);
    } finally {
      setIsProgressLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const now = new Date();

  const filteredMissions = missions.filter(m => {
    if (missionFilter === 'active') {
      return new Date(m.deadline) > now && m.completedBy.length < getMissionTotalMembers(m);
    }
    if (missionFilter === 'completed') {
      return m.completedBy.length >= getMissionTotalMembers(m);
    }
    return true;
  });

  function getMissionTotalMembers(m: TeamMission): number {
    return m.assignedTo.length === 0 ? membersProgress.length : m.assignedTo.length;
  }

  const totalXp = (mission: TeamMission) => mission.realmRewards.reduce((s, r) => s + r.xp, 0);

  const getMemberCompletionForMission = (mission: TeamMission) => {
    const assignedMembers = mission.assignedTo.length === 0 
      ? membersProgress.map(m => m.username) 
      : mission.assignedTo;
    return {
      total: assignedMembers.length,
      completed: mission.completedBy.length,
      members: assignedMembers.map(m => ({
        name: m,
        completed: mission.completedBy.includes(m),
      })),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">{t('dashboard:tech.title')}</h2>
              <p className="text-xs text-text-secondary">{t('dashboard:tech.subtitle')}</p>
            </div>
          </div>
        </div>
        <button
          onClick={onCreateMission}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" /> {t('dashboard:tech.create_mission')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('dashboard:tech.stats.members'), value: membersProgress.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: t('dashboard:tech.stats.active_missions'), value: missions.filter(m => new Date(m.deadline) > now).length, icon: Target, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: t('dashboard:tech.stats.completed'), value: missions.reduce((s, m) => s + m.completedBy.length, 0), icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: t('dashboard:tech.stats.total_missions'), value: missions.length, icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-4"
          >
            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-2xl">
        {(['missions', 'members'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all ${
              activeTab === tab
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            {tab === 'missions' ? t('dashboard:tech.tabs.missions') : t('dashboard:tech.tabs.members')}
          </button>
        ))}
      </div>

      {/* Missions Tab */}
      {activeTab === 'missions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['all', 'active', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setMissionFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    missionFilter === f
                      ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {f === 'all' ? t('dashboard:tech.filters.all') : f === 'active' ? t('dashboard:tech.filters.active') : t('dashboard:tech.filters.completed')}
                </button>
              ))}
            </div>
            <button
              onClick={onRefreshMissions}
              disabled={isMissionsLoading}
              className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isMissionsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {filteredMissions.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
              <Target className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-text-secondary text-sm">{t('dashboard:tech.no_missions')}</p>
              <button onClick={onCreateMission} className="mt-3 text-accent-primary text-xs font-bold hover:underline">
                {t('dashboard:tech.create_first')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMissions.map((mission, idx) => {
                const completion = getMemberCompletionForMission(mission);
                const isExpired = new Date(mission.deadline) <= now;
                const progressPercent = Math.round((completion.completed / completion.total) * 100);

                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`bg-white/[0.03] border rounded-2xl p-5 transition-all ${isExpired ? 'border-red-500/20 opacity-70' : 'border-white/10'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-bold truncate">{mission.title}</h4>
                          {isExpired && <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">{t('dashboard:tech.expired_mission')}</span>}
                        </div>
                        {mission.description && (
                          <p className="text-text-secondary text-xs mt-1 line-clamp-1">{mission.description}</p>
                        )}

                        {/* XP Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {mission.realmRewards.map(rr => (
                            <span key={rr.realm} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-zinc-400">
                              {rr.realm} +{rr.xp}
                            </span>
                          ))}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                            <span>{t('dashboard:tech.completed_by', { completed: completion.completed, total: completion.total })}</span>
                            <span className="font-bold">{progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Member Status */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {completion.members.map(m => (
                            <span
                              key={m.name}
                              className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${
                                m.completed
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                  : 'bg-white/5 text-zinc-500 border-white/5'
                              }`}
                            >
                              {m.completed && <span className="mr-1">✓</span>}
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Edit / Delete / Meta */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex gap-1">
                          <button
                            onClick={() => onEditMission(mission)}
                            title="Editar missão"
                            className="p-2 text-zinc-600 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-500/10"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t('dashboard:tech.delete_confirm', { title: mission.title }))) {
                                onDeleteMission(mission.id);
                              }
                            }}
                            className="p-2 text-zinc-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-zinc-600 font-bold">{totalXp(mission)} XP</p>
                          <p className="text-[9px] text-zinc-600 flex items-center gap-0.5 justify-end">
                            <Clock className="w-3 h-3" />
                            {new Date(mission.deadline).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">{t('dashboard:tech.members_progress_subtitle')}</p>
            <button
              onClick={fetchProgress}
              disabled={isProgressLoading}
              className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isProgressLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isProgressLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-white/10 border-t-accent-primary rounded-full animate-spin mx-auto" />
              <p className="text-xs text-zinc-500 mt-3">{t('dashboard:tech.loading_data')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {membersProgress
                .sort((a, b) => b.level - a.level)
                .map((member, idx) => {
                  const memberMissions = missions.filter(m =>
                    m.assignedTo.length === 0 || m.assignedTo.includes(member.username)
                  );
                  const completedCount = memberMissions.filter(m => m.completedBy.includes(member.username)).length;
                  const wasReset = resetSuccessMap[member.username];

                  return (
                    <motion.div
                      key={member.username}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.05] transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${RANK_COLORS[member.rank] || RANK_COLORS.e_rank} flex items-center justify-center shadow-lg font-black text-white text-lg shrink-0`}>
                          {member.name[0]}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className="text-white font-bold truncate">{member.name}</h4>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 font-bold shrink-0">
                                {RANK_LABELS[member.rank] || member.rank}
                              </span>
                              {wasReset && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-bold border border-green-500/20 shrink-0">
                                  XP Resetado ✓
                                </span>
                              )}
                            </div>

                            {/* Reset XP button */}
                            <button
                              onClick={() => setResetXpTarget(member)}
                              title="Resetar XP deste membro"
                              className="shrink-0 p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Crown className="w-3 h-3 text-yellow-500" /> Lv. {member.level}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-blue-400" /> {member.questsCompleted} quests
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-orange-400" /> {member.streak}🔥
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Team Mission Progress */}
                      {memberMissions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-zinc-500 font-bold">Missões da equipe</span>
                            <span className="text-white font-bold">{completedCount}/{memberMissions.length}</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-gradient-to-r from-accent-primary to-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${memberMissions.length > 0 ? (completedCount / memberMissions.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {Object.entries(member.stats).map(([realm, value]) => (
                          <span key={realm} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-zinc-500">
                            {realm}: {value}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Reset XP Modal */}
      <AnimatePresence>
        {resetXpTarget && (
          <ResetXpModal
            member={resetXpTarget}
            requester={currentUser}
            onClose={() => setResetXpTarget(null)}
            onSuccess={(username) => {
              setResetXpTarget(null);
              setResetSuccessMap(prev => ({ ...prev, [username]: true }));
              // Refresh after a short delay so the badge shows first
              setTimeout(() => fetchProgress(), 1500);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TechDashboard;

