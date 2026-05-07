import React from 'react';
import { TeamMission, Realm } from '../types';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Zap, Coins, Users, AlertTriangle } from 'lucide-react';

interface TeamMissionsProps {
  missions: TeamMission[];
  currentUser: string;
  onCompleteMission: (missionId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const REALM_COLORS: { [key in Realm]?: string } = {
  [Realm.TechnicalWriting]: 'from-slate-500 to-slate-700',
  [Realm.Networking]: 'from-emerald-500 to-teal-500',
  [Realm.Oratory]: 'from-rose-500 to-pink-600',
  [Realm.Planning]: 'from-amber-500 to-orange-600',
  [Realm.Creativity]: 'from-violet-500 to-purple-600',
  [Realm.Programming]: 'from-blue-500 to-indigo-600',
  [Realm.Engineering]: 'from-orange-500 to-red-600',
  [Realm.FirstCulture]: 'from-cyan-500 to-sky-600',
  [Realm.Meta]: 'from-zinc-500 to-slate-500',
};

const REALM_BG_COLORS: { [key in Realm]?: string } = {
  [Realm.TechnicalWriting]: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  [Realm.Networking]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  [Realm.Oratory]: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  [Realm.Planning]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  [Realm.Creativity]: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  [Realm.Programming]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [Realm.Engineering]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  [Realm.FirstCulture]: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  [Realm.Meta]: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const TeamMissions: React.FC<TeamMissionsProps> = ({ missions, currentUser, onCompleteMission, onRefresh, isLoading }) => {
  const now = new Date();

  const myMissions = missions.filter(m =>
    m.assignedTo.length === 0 || m.assignedTo.includes(currentUser)
  );

  const activeMissions = myMissions.filter(m => !m.completedBy.includes(currentUser) && new Date(m.deadline) > now);
  const completedMissions = myMissions.filter(m => m.completedBy.includes(currentUser));
  const expiredMissions = myMissions.filter(m => !m.completedBy.includes(currentUser) && new Date(m.deadline) <= now);

  const totalXp = (mission: TeamMission) => mission.realmRewards.reduce((s, r) => s + r.xp, 0);

  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - now.getTime();
    if (diff <= 0) return 'Expirada';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Missões da Equipe</h2>
          <p className="text-sm text-text-secondary mt-1">Missões atribuídas pelos técnicos</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-text-secondary hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
        >
          {isLoading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      {/* Active Missions */}
      {activeMissions.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
            Ativas ({activeMissions.length})
          </h3>
          {activeMissions.map((mission, idx) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.05] transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-base truncate">{mission.title}</h4>
                  {mission.description && (
                    <p className="text-text-secondary text-xs mt-1 line-clamp-2">{mission.description}</p>
                  )}

                  {/* Realm XP Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {mission.realmRewards.map(rr => (
                      <span key={rr.realm} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${REALM_BG_COLORS[rr.realm] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                        {rr.realm} +{rr.xp} XP
                      </span>
                    ))}
                    {mission.credit_reward > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        <Coins className="w-3 h-3" /> +{mission.credit_reward}
                      </span>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {getTimeRemaining(mission.deadline)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {totalXp(mission)} XP total
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> Por {mission.createdBy}
                    </span>
                  </div>
                </div>

                {/* Complete Button */}
                <button
                  onClick={() => onCompleteMission(mission.id)}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-green-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  Completar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-text-secondary text-sm font-medium">Nenhuma missão ativa no momento</p>
          <p className="text-zinc-600 text-xs mt-1">Os técnicos ainda não atribuíram missões</p>
        </div>
      )}

      {/* Completed Missions */}
      {completedMissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
            Completadas ({completedMissions.length})
          </h3>
          {completedMissions.map(mission => (
            <div key={mission.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 opacity-60">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white/70 font-bold text-sm truncate">{mission.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {mission.realmRewards.map(rr => (
                      <span key={rr.realm} className="text-[10px] text-zinc-500 font-bold">{rr.realm} +{rr.xp}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expired Missions */}
      {expiredMissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
            Expiradas ({expiredMissions.length})
          </h3>
          {expiredMissions.map(mission => (
            <div key={mission.id} className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 opacity-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <h4 className="text-white/50 font-bold text-sm truncate">{mission.title}</h4>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamMissions;
