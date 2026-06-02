import React from 'react';
import { User, Skill, Realm } from '../types';
import { BookText, Users, Shield, Award, Mic2, ClipboardList, Code, Hammer, Globe, Zap } from 'lucide-react';
import { ALL_MEMBERS } from '../data/members';

interface InitialLevelsFormProps {
  user: User;
  selectedMemberUsername: string;
  onMemberChange: (username: string) => void;
  onConfirmInitialLevels: () => void;
  onAdjustInitialSkillLevel: (skillId: string, delta: number) => void;
  onAdjustRealmLevel: (realm: string, level: number) => void;
  onUnlockInitialLevels: () => void;
  currentUser: string;
}

const realmConfig = {
  [Realm.TechnicalWriting]: { icon: <BookText size={18} />,    color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  [Realm.Networking]:       { icon: <Users size={18} />,       color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  [Realm.Oratory]:          { icon: <Mic2 size={18} />,        color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  [Realm.Planning]:         { icon: <ClipboardList size={18} />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  [Realm.Creativity]:       { icon: <Zap size={18} />,         color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  [Realm.Programming]:      { icon: <Code size={18} />,        color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  [Realm.Engineering]:      { icon: <Hammer size={18} />,      color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  [Realm.FirstCulture]:     { icon: <Globe size={18} />,       color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
};

const InitialLevelsForm: React.FC<InitialLevelsFormProps> = ({
  user,
  selectedMemberUsername,
  onMemberChange,
  onConfirmInitialLevels,
  onAdjustInitialSkillLevel,
  onAdjustRealmLevel,
  onUnlockInitialLevels,
  currentUser,
}) => {
  // Group skills by realm
  const skillsByRealm = Object.values(user.skill_tree || {}).reduce((acc: Record<Realm, Skill[]>, skill: Skill) => {
    const realm = skill.realm || Realm.Planning;
    if (!acc[realm]) acc[realm] = [];
    acc[realm].push(skill);
    return acc;
  }, {} as Record<Realm, Skill[]>);

  // Compute average level per realm
  const realmAverageLevels = Object.values(Realm).reduce((acc, realm) => {
    const skills = skillsByRealm[realm as Realm] || [];
    if (skills.length === 0) { acc[realm] = 1; return acc; }
    const avg = Math.round(skills.reduce((s, sk) => s + sk.level, 0) / skills.length);
    acc[realm] = avg;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight flex items-center justify-center gap-2">
          <Shield className="w-7 h-7 text-amber-500" />
          Configurar Níveis de Partida
        </h2>
        <p className="text-text-secondary text-sm">
          Ajuste os níveis iniciais das habilidades de cada competidor.
        </p>
      </div>

      {/* Control bar */}
      <div className="p-4 rounded-2xl border border-white/5 bg-primary/40 backdrop-blur-xl shadow-glass flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-text-secondary whitespace-nowrap">Competidor:</span>
          <select
            value={selectedMemberUsername}
            onChange={(e) => onMemberChange(e.target.value)}
            className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-primary cursor-pointer w-full md:w-48"
          >
            {ALL_MEMBERS.filter(m => m.role === 'member').map(m => (
              <option key={m.username} value={m.username}>
                {m.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">Status Atual:</span>
          {user.initialLevelsSet ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
              🔒 Definido
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold uppercase tracking-wider text-[10px] animate-pulse">
              🔓 Em Aberto
            </span>
          )}
        </div>

        {/* Save button */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          {user.initialLevelsSet && (
            <button
              onClick={onUnlockInitialLevels}
              type="button"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 font-bold text-xs uppercase py-2 px-4 rounded-xl transition-all"
            >
              🔓 Destravar Edição
            </button>
          )}
          <button
            onClick={onConfirmInitialLevels}
            type="button"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
          >
            ✓ Salvar e Travar Níveis
          </button>
        </div>
      </div>

      {/* Grid of skills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left/Middle: Skills list */}
        <div className="md:col-span-2 space-y-6">
          {Object.entries(skillsByRealm).map(([realm, skills]) => {
            const config = realmConfig[realm as Realm];
            if (skills.length === 0) return null;
            return (
              <div key={realm} className="p-5 rounded-2xl border border-white/5 bg-primary/20 backdrop-blur-xl shadow-glass space-y-4">
                <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/5 ${config?.color || 'text-white'}`}>
                  {config?.icon}
                  {realm}
                </h3>

                <div className="divide-y divide-white/[0.03]">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <div>
                        <h4 className="text-sm font-bold text-text-primary">{skill.name}</h4>
                      </div>

                      {/* Controls (Always active) */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAdjustInitialSkillLevel(skill.id, -1)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm text-text-secondary hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 active:scale-90 transition-all"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-black text-sm bg-white/5 border border-white/10 text-white rounded-lg py-1">
                          {skill.level}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAdjustInitialSkillLevel(skill.id, 1)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm text-text-secondary hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-300 active:scale-90 transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right side: bulk adjustment */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl shadow-glass flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Ajuste por Reino</h4>
            </div>

            <div className="flex flex-col gap-2">
              {Object.values(Realm).map((realm) => {
                const config = realmConfig[realm as Realm];
                const currentLevel = realmAverageLevels[realm] ?? 1;
                const skillCount = (skillsByRealm[realm as Realm] || []).length;
                if (skillCount === 0) return null;
                return (
                  <div
                    key={realm}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/10 transition-all"
                  >
                    <div className={`flex items-center gap-2 min-w-0 ${config?.color || 'text-white'}`}>
                      <div className="shrink-0">{config?.icon}</div>
                      <p className="text-xs font-bold truncate">{realm}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onAdjustRealmLevel(realm, currentLevel - 1)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 active:scale-90 transition-all"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-black text-xs bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-lg py-0.5">
                        {currentLevel}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAdjustRealmLevel(realm, currentLevel + 1)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-300 active:scale-90 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialLevelsForm;
