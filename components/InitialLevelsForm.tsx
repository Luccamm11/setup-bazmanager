import React from 'react';
import { User, Skill, Realm } from '../types';
import { BookText, Users, Shield, Award, Mic2, ClipboardList, Code, Hammer, Globe, Zap, ArrowRight } from 'lucide-react';
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
  const isLocked = !!user.initialLevelsSet;

  // Group skills by realm
  const skillsByRealm = Object.values(user.skill_tree).reduce((acc: Record<Realm, Skill[]>, skill: Skill) => {
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight flex items-center justify-center gap-2">
          <Shield className="w-7 h-7 text-amber-500 animate-pulse" />
          Ajuste de Níveis Iniciais
        </h2>
        <p className="text-text-secondary text-sm">
          Defina o ponto de partida de cada competidor antes de iniciar as missões de XP.
        </p>
      </div>

      {/* Selector and Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Selector Card */}
        <div className="p-5 rounded-2xl border border-white/5 bg-primary/40 backdrop-blur-xl shadow-glass flex flex-col gap-3">
          <label className="text-[10px] uppercase tracking-widest font-black text-text-muted flex items-center gap-1.5 justify-center">
            <Users className="w-3.5 h-3.5 text-accent-primary" /> Competidor Selecionado
          </label>
          <select
            value={selectedMemberUsername}
            onChange={(e) => onMemberChange(e.target.value)}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary transition-all cursor-pointer"
          >
            {ALL_MEMBERS.filter(m => m.role === 'member').map(m => (
              <option key={m.username} value={m.username}>
                {m.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Status / Actions Card */}
        <div className="md:col-span-2">
          {isLocked ? (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl shadow-glass flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                  🔒 Níveis Bloqueados
                </h4>
                <p className="text-xs text-text-secondary mt-1">
                  Os níveis iniciais de <strong className="text-white">{user.name}</strong> estão consolidados e prontos para o fluxo de XP.
                </p>
              </div>
              <button
                onClick={onUnlockInitialLevels}
                type="button"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-amber-400 hover:text-amber-300 font-black text-xs uppercase tracking-wider py-2 px-5 rounded-xl transition-all duration-300 active:scale-95 shrink-0"
              >
                🔓 Destravar Ajuste
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 backdrop-blur-xl shadow-glass flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                  ⚠️ Ajuste Ativo
                </h4>
                <p className="text-xs text-text-secondary mt-1">
                  Ajuste os níveis abaixo e clique no botão para travar a árvore de <strong className="text-white">{user.name}</strong>.
                </p>
              </div>
              <button
                onClick={onConfirmInitialLevels}
                type="button"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shrink-0"
              >
                ✓ Confirmar Níveis
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left/Middle: Skills list categorized by Realm */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(skillsByRealm).map(([realm, skills]) => {
            const config = realmConfig[realm as Realm];
            if (skills.length === 0) return null;
            return (
              <div key={realm} className="p-5 rounded-2xl border border-white/5 bg-primary/20 backdrop-blur-xl shadow-glass space-y-4">
                {/* Realm Header */}
                <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/5 ${config?.color || 'text-white'}`}>
                  <div className={`p-1.5 rounded-lg ${config?.bg || 'bg-white/5'} border ${config?.border || 'border-white/10'}`}>
                    {config?.icon}
                  </div>
                  {realm}
                </h3>

                {/* Skills inside this Realm */}
                <div className="divide-y divide-white/[0.03]">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <h4 className="text-sm font-bold text-text-primary">{skill.name}</h4>
                        <p className="text-[10px] text-text-muted mt-0.5">ID: {skill.id}</p>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => onAdjustInitialSkillLevel(skill.id, -1)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm text-text-secondary hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-black text-sm bg-white/5 border border-white/10 text-white rounded-lg py-1">
                          {skill.level}
                        </span>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => onAdjustInitialSkillLevel(skill.id, 1)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm text-text-secondary hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-300 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
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

        {/* Right: Realm Bulk adjustments */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl shadow-glass flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Ajuste em Bloco</h4>
                <p className="text-[9px] text-text-muted mt-0.5">Preencher reino inteiro de uma vez</p>
              </div>
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
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/10 transition-all"
                  >
                    <div className={`flex items-center gap-2 min-w-0 ${config?.color || 'text-white'}`}>
                      <div className="p-1 bg-white/5 rounded-md border border-white/10 shrink-0">
                        {config?.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{realm}</p>
                        <p className="text-[9px] text-text-muted">{skillCount} skill{skillCount > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => onAdjustRealmLevel(realm, currentLevel - 1)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-black text-xs bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-lg py-0.5">
                        {currentLevel}
                      </span>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => onAdjustRealmLevel(realm, currentLevel + 1)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-300 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-text-muted text-center pt-1 leading-relaxed">
              * O ajuste em bloco preenche <strong className="text-amber-400">todas</strong> as habilidades do reino selecionado com o nível escolhido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialLevelsForm;
