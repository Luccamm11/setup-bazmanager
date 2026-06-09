import React from 'react';
import { User, Realm } from '../types';
import { ALL_MEMBERS } from '../data/members';
import { 
  Shield, 
  Users, 
  BookText, 
  Mic2, 
  ClipboardList, 
  Zap, 
  Code, 
  Hammer, 
  Globe, 
  Trophy 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InitialLevelsFormProps {
  user: User;
  selectedMemberUsername: string;
  onMemberChange: (username: string) => void;
  onConfirmInitialLevels: () => void;
  onAdjustRealmLevel: (realm: string, level: number) => void;
  onUnlockInitialLevels: () => void;
  currentUser: string;
}

const realmConfig = {
  [Realm.TechnicalWriting]: { icon: <BookText className="w-5 h-5" />,  color: "text-slate-400", borderClass: "border-slate-500/20", bgClass: "bg-slate-500/5", accentColor: "accent-slate-400" },
  [Realm.Networking]:       { icon: <Users className="w-5 h-5" />,     color: "text-emerald-400", borderClass: "border-emerald-500/20", bgClass: "bg-emerald-500/5", accentColor: "accent-emerald-400" },
  [Realm.Oratory]:          { icon: <Mic2 className="w-5 h-5" />,      color: "text-rose-400", borderClass: "border-rose-500/20", bgClass: "bg-rose-500/5", accentColor: "accent-rose-400" },
  [Realm.Planning]:         { icon: <ClipboardList className="w-5 h-5" />, color: "text-amber-400", borderClass: "border-amber-500/20", bgClass: "bg-amber-500/5", accentColor: "accent-amber-400" },
  [Realm.Creativity]:       { icon: <Zap className="w-5 h-5" />,       color: "text-violet-400", borderClass: "border-violet-500/20", bgClass: "bg-violet-500/5", accentColor: "accent-violet-400" },
  [Realm.Programming]:      { icon: <Code className="w-5 h-5" />,      color: "text-blue-400", borderClass: "border-blue-500/20", bgClass: "bg-blue-500/5", accentColor: "accent-blue-400" },
  [Realm.Engineering]:      { icon: <Hammer className="w-5 h-5" />,    color: "text-orange-400", borderClass: "border-orange-500/20", bgClass: "bg-orange-500/5", accentColor: "accent-orange-400" },
  [Realm.FirstCulture]:     { icon: <Globe className="w-5 h-5" />,     color: "text-cyan-400", borderClass: "border-cyan-500/20", bgClass: "bg-cyan-500/5", accentColor: "accent-cyan-400" },
};

const InitialLevelsForm: React.FC<InitialLevelsFormProps> = ({
  user,
  selectedMemberUsername,
  onMemberChange,
  onConfirmInitialLevels,
  onAdjustRealmLevel,
  onUnlockInitialLevels,
}) => {
  const { t } = useTranslation(['common', 'constants']);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header section with pulsating status banner */}
      <div className="bg-primary/40 p-6 rounded-3xl border border-white/5 shadow-glass backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-400 animate-pulse">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Ajuste de Níveis Iniciais
            </h2>
            <p className="text-text-secondary text-xs mt-1">
              Defina os níveis de partida para o competidor antes de iniciar o progresso regular.
            </p>
          </div>
        </div>

        {/* Competitor Selector inside banner */}
        <div className="flex flex-col gap-1.5 w-full md:w-64">
          <label className="text-[10px] uppercase tracking-widest font-black text-text-muted flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" /> Competidor Selecionado
          </label>
          <select
            value={selectedMemberUsername}
            onChange={(e) => onMemberChange(e.target.value)}
            className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary cursor-pointer w-full transition-all duration-300"
          >
            {ALL_MEMBERS.filter(m => m.role === 'member').map(m => (
              <option key={m.username} value={m.username}>
                {m.displayName} ({m.awardFocus || 'Geral'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview stats: Overall Level (Ovr) card */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6 rounded-3xl border border-amber-500/20 shadow-glass flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Desempenho de Partida</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">Nível Geral Estimado (OVR)</h3>
          <p className="text-xs text-text-secondary mt-1">
            Calculado automaticamente a partir da média dos níveis definidos para os 8 reinos.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-black/40 px-6 py-4 rounded-2xl border border-white/5 shadow-inner">
          <div className="text-center">
            <div className="text-4xl font-black text-amber-400 tracking-tighter">{user.level_overall}</div>
            <div className="text-[9px] uppercase tracking-widest font-bold text-text-muted">Nível Médio</div>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="text-left">
            <div className="text-sm font-bold text-white uppercase tracking-wider">{user.rank ? t(`constants:ranks.${user.rank}`, user.rank) : 'Novato'}</div>
            <div className="text-[9px] uppercase tracking-widest font-bold text-text-muted">Rank Atual</div>
          </div>
        </div>
      </div>

      {/* Grid of the 8 Realms with individual sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(Realm).map((realm) => {
          const config = realmConfig[realm] || realmConfig[Realm.Planning];
          const levelVal = user.stats[realm] || 0;
          
          return (
            <div 
              key={realm} 
              className={`p-6 rounded-3xl border ${config.borderClass} ${config.bgClass} backdrop-blur-sm transition-all duration-300 hover:border-white/10 flex flex-col justify-between gap-4`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-white/5 rounded-xl border border-white/10 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white capitalize">
                      {t(`realm.${realm}`)}
                    </h4>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                      Reino
                    </p>
                  </div>
                </div>

                <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5">
                  <span className="text-[10px] text-text-secondary font-bold">Nível</span>
                  <span className={`text-base font-black ${config.color}`}>{levelVal}</span>
                </div>
              </div>

              {/* Slider for this Realm */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={levelVal}
                  onChange={(e) => onAdjustRealmLevel(realm, parseInt(e.target.value))}
                  disabled={user.initialLevelsSet}
                  className={`w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer ${config.accentColor} disabled:opacity-40 disabled:cursor-not-allowed`}
                />
                <div className="flex justify-between text-[9px] text-text-muted font-mono">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main actions panel */}
      <div className="bg-primary/20 p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-4 text-center">
        {user.initialLevelsSet ? (
          <div className="space-y-4">
            <div className="text-accent-green font-bold text-sm flex items-center justify-center gap-2">
              ✓ Níveis Iniciais de {user.name} foram travados com sucesso!
            </div>
            <button
              onClick={onUnlockInitialLevels}
              type="button"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 font-bold px-6 py-2.5 rounded-xl transition-all uppercase text-xs tracking-wider"
            >
              🔓 Destravar Edição para Ajustes
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-4">
            <p className="text-xs text-text-secondary">
              Ajuste os níveis dos reinos acima. Depois de salvar, o competidor começará a ganhar XP e realizar missões a partir dessas marcas.
            </p>
            <button
              onClick={onConfirmInitialLevels}
              type="button"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-black font-black py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] uppercase text-xs tracking-widest"
            >
              Confirmar e Bloquear Níveis Iniciais de {user.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitialLevelsForm;
