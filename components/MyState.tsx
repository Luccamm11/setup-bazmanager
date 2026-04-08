import React, { useState } from 'react';
import { UserState } from '../types';
import { User, Save } from 'lucide-react';

interface MyStateProps {
  initialState: UserState;
  onSave: (newState: UserState) => void;
}

const StateTextarea: React.FC<{ label: string; sublabel?: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number; placeholder: string; }> = ({ label, sublabel, value, onChange, rows = 2, placeholder }) => (
  <div>
    <label className="block text-md font-semibold text-text-primary mb-1">
      {label}
      {sublabel && <span className="text-sm font-normal text-text-secondary ml-2">{sublabel}</span>}
    </label>
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm custom-scrollbar"
    />
  </div>
);

const MyState: React.FC<MyStateProps> = ({ initialState, onSave }) => {
  const [state, setState] = useState(initialState);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof UserState) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prevState => ({ ...prevState, [field]: e.target.value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(state);
    setHasChanges(false);
  };

  return (
    <div>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #30363D;
            border-radius: 20px;
            border: 3px solid #161B22;
          }
        `}</style>
        <div className="flex items-center space-x-3 mb-2">
            <User className="w-6 h-6 text-text-secondary" />
            <h2 className="text-xl font-semibold text-text-primary">Perfil B-LEAD</h2>
        </div>
        <p className="text-sm text-text-secondary mb-6 ml-9">Defina sua função e metas dentro da equipe Bazinga! para que a IA gere recomendações alinhadas ao seu desenvolvimento.</p>
        
        <div className="space-y-6">
            <div>
              <label className="block text-md font-semibold text-text-primary mb-1">Foco em Prêmios (FTC)</label>
              <select
                value={state.awardFocus || ''}
                onChange={(e) => { setState(s => ({ ...s, awardFocus: e.target.value })); setHasChanges(true); }}
                className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm"
              >
                <option value="">Nenhum em particular</option>
                <option value="Inspire">Inspire Award (Geral/Excelência)</option>
                <option value="Think">Think Award (Documentação/Notebook)</option>
                <option value="Connect">Connect Award (Networking/Comunidade)</option>
                <option value="Innovate">Innovate Award (Inovador/Engenharia)</option>
                <option value="Control">Control Award (Programação/Sensores)</option>
                <option value="Design">Design Award (Industrial Design/CAD)</option>
                <option value="Motivate">Motivate Award (Cultura/Equipe)</option>
              </select>
            </div>
            <StateTextarea 
                label="Função Principal / B-LEAD"
                value={state.coreMission}
                onChange={handleChange('coreMission')}
                rows={3}
                placeholder="Qual sua responsabilidade principal na equipe?"
            />
             <StateTextarea 
                label="Objetivo da Temporada"
                sublabel="(Prêmio Foco & Longo Prazo)"
                value={state.longTermGoals}
                onChange={handleChange('longTermGoals')}
                placeholder="O que você quer dominar até a competição?"
            />
            <StateTextarea 
                label="Metas de Especialização"
                sublabel="(Curto/Médio Prazo)"
                value={state.shortTermGoals}
                onChange={handleChange('shortTermGoals')}
                placeholder="O que você está focando em aprender/fazer agora?"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StateTextarea 
                    label="Entregas Urgentes"
                    value={state.emergencyGoals}
                    onChange={handleChange('emergencyGoals')}
                    placeholder="Entregas críticas do momento."
                />
                <StateTextarea 
                    label="Expansão de Habilidades"
                    value={state.sideQuests}
                    onChange={handleChange('sideQuests')}
                    placeholder="Áreas secundárias que você tem interesse em ajudar."
                />
            </div>
        </div>

        <div className="flex justify-end mt-6">
            <button 
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center space-x-2 text-sm font-semibold px-4 py-2 rounded-lg bg-border-color text-text-primary hover:bg-opacity-80 disabled:bg-border-color/50 disabled:text-text-muted disabled:cursor-not-allowed"
            >
                <Save size={16}/>
                <span>Salvar Perfil (B-LEAD)</span>
            </button>
        </div>
    </div>
  );
};

export default MyState;