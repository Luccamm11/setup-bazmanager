import React, { useState } from 'react';
import { User, Realm } from '../types';
import { ALL_MEMBERS } from '../data/members';
import { Shield } from 'lucide-react';

interface InitialLevelsFormProps {
  user: User;
  selectedMemberUsername: string;
  onMemberChange: (username: string) => void;
  onConfirmInitialLevels: () => void;
  onAdjustRealmLevel: (realm: string, level: number) => void;
  onUnlockInitialLevels: () => void;
  currentUser: string;
}

const InitialLevelsForm: React.FC<InitialLevelsFormProps> = ({
  user,
  selectedMemberUsername,
  onMemberChange,
  onConfirmInitialLevels,
  onAdjustRealmLevel,
  onUnlockInitialLevels,
}) => {
  const [selectedRealm, setSelectedRealm] = useState<string>(Realm.Planning);
  const [level, setLevel] = useState<number>(5);

  const handleApply = () => {
    onAdjustRealmLevel(selectedRealm, level);
  };

  return (
    <div className="space-y-6 max-w-md mx-auto pb-12 bg-primary/40 p-6 rounded-2xl border border-white/5 shadow-glass backdrop-blur-xl mt-8">
      <div className="text-center">
        <h2 className="text-xl font-black mb-2 flex items-center justify-center gap-2">
          <Shield className="w-6 h-6 text-amber-500" />
          Ajuste Rápido de Níveis
        </h2>
        <p className="text-text-secondary text-xs">
          Selecione o reino e defina o nível para todas as habilidades dele.
        </p>
      </div>

      {/* 1. Member Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest font-black text-text-muted">Competidor</label>
        <select
          value={selectedMemberUsername}
          onChange={(e) => onMemberChange(e.target.value)}
          className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary cursor-pointer w-full"
        >
          {ALL_MEMBERS.filter(m => m.role === 'member').map(m => (
            <option key={m.username} value={m.username}>
              {m.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Realm Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest font-black text-text-muted">Selecione o Reino</label>
        <select
          value={selectedRealm}
          onChange={(e) => setSelectedRealm(e.target.value)}
          className="bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary cursor-pointer w-full"
        >
          {Object.values(Realm).map((realm) => (
            <option key={realm} value={realm}>
              {realm}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Level Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-[10px] uppercase tracking-widest font-black text-text-muted">Definir Nível</label>
          <span className="font-black text-lg text-amber-400">Nível {level}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={level}
          onChange={(e) => setLevel(parseInt(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-[9px] text-text-muted">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {/* 4. Actions */}
      <div className="pt-4 flex flex-col gap-3">
        <button
          onClick={handleApply}
          type="button"
          className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-2.5 rounded-xl transition-all uppercase text-xs"
        >
          1. Aplicar Nível {level} ao Reino {selectedRealm}
        </button>

        <div className="h-px bg-white/5 my-1"></div>

        <button
          onClick={onConfirmInitialLevels}
          type="button"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-black font-black py-3 rounded-xl transition-all shadow-lg uppercase text-xs tracking-wider"
        >
          2. Salvar e Travar Níveis de {user.name}
        </button>

        {user.initialLevelsSet && (
          <button
            onClick={onUnlockInitialLevels}
            type="button"
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 font-bold py-2 rounded-xl transition-all uppercase text-xs"
          >
            🔓 Destravar Edição
          </button>
        )}
      </div>
    </div>
  );
};

export default InitialLevelsForm;
