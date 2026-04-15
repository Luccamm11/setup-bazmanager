import React, { useState } from 'react';
import { UserRole } from '../types';
import { Bot, Download, Loader2, Sparkles, Database } from 'lucide-react';
import { generateJourney } from '../services/exportService';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface JourneyTabProps {
  username: string;
  userRole: UserRole;
}

const JourneyTab: React.FC<JourneyTabProps> = ({ username, userRole }) => {
  const { t } = useTranslation('common');
  const [isGeneratingSelf, setIsGeneratingSelf] = useState(false);
  const [isGeneratingTeam, setIsGeneratingTeam] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const handleGenerate = async (scope: 'individual' | 'team') => {
    if (scope === 'individual') setIsGeneratingSelf(true);
    else setIsGeneratingTeam(true);
    setErrorInfo(null);

    try {
      await generateJourney(username, scope);
    } catch (err: any) {
      setErrorInfo(err.message || 'Erro desconhecido ao gerar a jornada.');
    } finally {
      if (scope === 'individual') setIsGeneratingSelf(false);
      else setIsGeneratingTeam(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center group mb-10">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 drop-shadow-md transition-all">Jornada de Desenvolvimento</h2>
        <p className="text-text-secondary">Exporte seu progresso detalhado em Markdown, formatado pela IA para dashboards externos.</p>
      </div>

      {errorInfo && (
        <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red p-4 rounded-xl text-center font-bold">
          {errorInfo}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Painel Individual */}
        <motion.div 
          className="bg-primary/40 p-8 rounded-3xl border border-white/5 shadow-glass relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-secondary to-accent-primary"></div>
          <div>
            <div className="flex items-center gap-3 mb-4 text-accent-primary">
              <Bot size={28} />
              <h3 className="text-2xl font-black text-white">Minha Jornada</h3>
            </div>
            <p className="text-text-secondary mb-6 text-sm leading-relaxed">
              Recupera seu histórico de evolução (Árvore de Habilidades, XP ganho, e Missões Concluídas) guardado no banco de dados e gera um arquivo estritamente factual usando IA.
            </p>
          </div>
          
          <button
            onClick={() => handleGenerate('individual')}
            disabled={isGeneratingSelf || isGeneratingTeam}
            className="w-full relative group overflow-hidden bg-white/5 text-white font-bold py-3 px-6 rounded-xl border border-white/10 hover:border-accent-primary hover:bg-accent-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center space-x-2 relative z-10">
              {isGeneratingSelf ? <Loader2 size={18} className="animate-spin text-accent-primary" /> : <Download size={18} />}
              <span>{isGeneratingSelf ? 'Gerando Relatório MD...' : 'Gerar Minha Jornada (.md)'}</span>
            </div>
          </button>
        </motion.div>

        {/* Painel do Técnico */}
        {userRole === 'technician' && (
          <motion.div 
            className="bg-primary/40 p-8 rounded-3xl border border-orange-500/10 shadow-glass relative overflow-hidden flex flex-col justify-between"
          >
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
            <div>
              <div className="flex items-center gap-3 mb-4 text-orange-400">
                <Database size={28} />
                <h3 className="text-2xl font-black text-white">Jornada da Equipe</h3>
              </div>
              <p className="text-text-secondary mb-6 text-sm leading-relaxed">
                Agrega o desenvolvimento e XP de todos os 12 membros da equipe (B-LEED), exportando uma visão geral do crescimento técnico e do portfólio da robótica.
              </p>
            </div>
            
            <button
              onClick={() => handleGenerate('team')}
              disabled={isGeneratingSelf || isGeneratingTeam}
              className="w-full relative group overflow-hidden bg-orange-500/10 text-white font-bold py-3 px-6 rounded-xl border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2 relative z-10">
                {isGeneratingTeam ? <Loader2 size={18} className="animate-spin text-orange-400" /> : <Sparkles size={18} className="text-orange-400" />}
                <span className="text-orange-100">{isGeneratingTeam ? 'Analisando Equipe...' : 'Gerar Jornada Completa (.md)'}</span>
              </div>
            </button>
          </motion.div>
        )}
      </div>

      <div className="mt-8 bg-white/5 border border-dashed border-white/10 p-6 rounded-2xl text-text-secondary text-sm">
        <strong className="text-white">Aviso:</strong> A IA responsável pela geração (Gemini GenAI) foi instruída a rodar com Temperature 0. Isso significa que ela está restrita a formatar 100% dos dados reais do KV Store da Vercel. <u>A IA está terminantemente proibida de inventar ou deduzir eventos que não ocorreram na plataforma.</u>
      </div>
    </div>
  );
};

export default JourneyTab;
