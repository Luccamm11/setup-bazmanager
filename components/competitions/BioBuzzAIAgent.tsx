import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Sparkles, BookOpen, ShieldAlert, Plus, Trash2,
  RefreshCw, ChevronDown, ChevronUp, Cpu, Layers
} from 'lucide-react';
import type {
  BioBuzzAIChatMessage,
  BioBuzzAIUpdateNote,
  CompetitionEvent,
} from '../../types';
import { BIOBUZZ_SCORING, BIOBUZZ_RP_THRESHOLDS } from '../../data/bioBuzzManual';

interface BioBuzzAIAgentProps {
  event: CompetitionEvent;
  currentUser: string;
  isTech: boolean;
  onSaveTeamUpdates: (updates: BioBuzzAIUpdateNote[]) => Promise<void>;
  onSaveChatHistory: (messages: BioBuzzAIChatMessage[]) => Promise<void>;
  compact?: boolean;
}

const QUICK_PROMPTS = [
  {
    label: 'Sugerir Melhor Aliança',
    prompt: 'Com base nos dados atuais de Pit e Match Scouting deste torneio, quais equipes formam a melhor aliança com a Bazinga! 73 (#21083) para maximizar Hive Tips e Ranking Points?',
  },
  {
    label: 'Plano para 3 RPs Bônus',
    prompt: 'Monte um roteiro prático de partida no BIOBUZZ™ para garantirmos Swarm RP (16+ pts Leave+Park) e Pollinator 1 & 2 RPs (4 e 7 Hive Tips) sem correr risco de faltas.',
  },
  {
    label: 'Regras G407 & Penalidades',
    prompt: 'Resuma os principais cuidados com o limite de posse G407 (4 elementos), pinning (3s/2ft), Minor Fouls (+5) e Major Fouls (+20) para os nossos drivers e coach.',
  },
  {
    label: 'Estratégia Endgame Flowers',
    prompt: 'Nos últimos 60 segundos do TeleOp no BIOBUZZ™, quando vale mais a pena focar em Flower Ownership + Bottom Nectar vs continuar buscando Hive Tips?',
  },
];

// Renderizador leve de negrito e quebras de linha para respostas da IA
function renderFormattedLine(line: string, idx: number) {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  const rendered = parts.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={pIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={pIdx} className="px-1 py-0.5 rounded bg-black/50 text-amber-300 font-mono text-[11px]">{part.slice(1, -1)}</code>;
    }
    return <React.Fragment key={pIdx}>{part}</React.Fragment>;
  });

  if (line.startsWith('### ')) {
    return <h4 key={idx} className="text-sm font-black text-amber-300 mt-2 mb-1">{line.replace('### ', '')}</h4>;
  }
  if (line.startsWith('## ')) {
    return <h3 key={idx} className="text-base font-black text-cyan-300 mt-2 mb-1">{line.replace('## ', '')}</h3>;
  }
  if (!line.trim()) {
    return <div key={idx} className="h-1.5" />;
  }
  return <p key={idx} className="leading-relaxed">{rendered}</p>;
}

function FormattedAIContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5 text-xs sm:text-sm text-text-secondary">
      {lines.map((line, i) => {
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        if (isBullet) {
          const clean = line.trim().slice(2);
          const parts = clean.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
          return (
            <div key={i} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-amber-400 font-bold shrink-0">•</span>
              <span className="flex-1 leading-relaxed">
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
                  }
                  if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={pIdx} className="px-1 py-0.5 rounded bg-black/50 text-amber-300 font-mono text-[11px]">{part.slice(1, -1)}</code>;
                  }
                  return <React.Fragment key={pIdx}>{part}</React.Fragment>;
                })}
              </span>
            </div>
          );
        }
        return renderFormattedLine(line, i);
      })}
    </div>
  );
}

export const BioBuzzAIAgent: React.FC<BioBuzzAIAgentProps> = ({
  event,
  currentUser,
  isTech,
  onSaveTeamUpdates,
  onSaveChatHistory,
  compact = false,
}) => {
  const hub = event.strategyScouting;
  const messages = hub?.aiChatHistory || [];
  const teamUpdates = hub?.aiTeamUpdates || [];

  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [showManualCheatSheet, setShowManualCheatSheet] = useState(false);
  const [showUpdatesPanel, setShowUpdatesPanel] = useState(false);

  // Technician custom Team Updates state
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [savingUpdate, setSavingUpdate] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, asking]);

  const sendQuestion = async (questionText: string) => {
    const clean = questionText.trim();
    if (!clean || asking) return;

    const userMsg: BioBuzzAIChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: clean,
      timestamp: new Date().toISOString(),
      author: currentUser,
    };

    const optimisticMsgs = [...messages, userMsg];
    setInput('');
    setAsking(true);

    try {
      await onSaveChatHistory(optimisticMsgs);

      const res = await fetch('/api/biobuzz-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'biobuzz_ai',
          eventId: event.id,
          question: clean,
          history: optimisticMsgs.slice(-6),
        }),
      });

      const json = await res.json();
      const answerText =
        json?.answer ||
        json?.error ||
        'Não foi possível obter resposta no momento. Tente novamente.';

      const aiMsg: BioBuzzAIChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: answerText,
        timestamp: new Date().toISOString(),
        author: 'Estrategista BIOBUZZ™ IA',
      };

      await onSaveChatHistory([...optimisticMsgs, aiMsg]);
    } catch (err) {
      console.error('BioBuzz AI request error:', err);
      const errMsg: BioBuzzAIChatMessage = {
        id: `msg-${Date.now()}-e`,
        role: 'assistant',
        content: 'Erro de conexão ao consultar o agente de IA. Verifique sua internet ou tente novamente.',
        timestamp: new Date().toISOString(),
        author: 'Sistema',
      };
      await onSaveChatHistory([...optimisticMsgs, errMsg]);
    } finally {
      setAsking(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!isTech || !updateTitle.trim() || !updateContent.trim()) return;
    setSavingUpdate(true);
    try {
      const next: BioBuzzAIUpdateNote[] = [
        {
          id: `upd-${Date.now()}`,
          title: updateTitle.trim(),
          content: updateContent.trim(),
          addedBy: currentUser,
          addedAt: new Date().toISOString(),
        },
        ...teamUpdates,
      ];
      await onSaveTeamUpdates(next);
      setUpdateTitle('');
      setUpdateContent('');
    } finally {
      setSavingUpdate(false);
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!isTech) return;
    await onSaveTeamUpdates(teamUpdates.filter(u => u.id !== id));
  };

  const handleClearChat = async () => {
    if (!isTech) return;
    if (confirm('Limpar histórico do chat com a IA deste torneio?')) {
      await onSaveChatHistory([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header do Agente BIOBUZZ™ */}
      <div className="bg-gradient-to-r from-amber-500/10 via-primary/70 to-cyan-500/10 border border-amber-500/25 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/35 text-amber-300 shrink-0">
            <Bot size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white">Agente IA Estrategista BIOBUZZ™</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black uppercase">
                Manual 2026–2027 Treinado
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Especialista nas regras FIRST Inspires (BIOBUZZ™) conectado ao vivo com{' '}
              <strong className="text-amber-300">{hub?.teams?.length || 0} equipes</strong> e{' '}
              <strong className="text-cyan-300">{hub?.matchScouts?.length || 0} partidas</strong> do Scouting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowManualCheatSheet(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-cyan-300 border border-cyan-500/20 transition-all"
          >
            <BookOpen size={14} />
            <span>Tabela Oficial</span>
            {showManualCheatSheet ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            onClick={() => setShowUpdatesPanel(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-amber-300 border border-amber-500/20 transition-all"
          >
            <Layers size={14} />
            <span>Team Updates ({teamUpdates.length})</span>
            {showUpdatesPanel ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {isTech && messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-text-muted hover:text-red-400 border border-white/10 transition-all"
              title="Limpar conversa"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cheat Sheet Oficial Tabela 10-2 e 10-3 (Colapsável) */}
      {showManualCheatSheet && (
        <div className="bg-primary/50 border border-cyan-500/25 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1.5">
            <h4 className="font-black text-cyan-300 uppercase tracking-wider text-[11px]">Tabela 10-2: Pontos BIOBUZZ™</h4>
            <p className="text-text-secondary">• Leave (Auto): <strong className="text-white">{BIOBUZZ_SCORING.AUTO_LEAVE} pts</strong></p>
            <p className="text-text-secondary">• Park (Auto / TeleOp): <strong className="text-white">{BIOBUZZ_SCORING.PARK} pts</strong></p>
            <p className="text-text-secondary">• Hive Tip (Auto / TeleOp): <strong className="text-amber-300">{BIOBUZZ_SCORING.HIVE_TIP} pts</strong></p>
            <p className="text-text-secondary">• Elemento restante na Cell: <strong className="text-white">{BIOBUZZ_SCORING.CELL_REMAINING} pts</strong></p>
            <p className="text-text-secondary">• Flower Bottom Nectar: <strong className="text-white">{BIOBUZZ_SCORING.FLOWER_BOTTOM_NECTAR} pts</strong></p>
            <p className="text-text-secondary">• Flower Ownership: <strong className="text-emerald-300">{BIOBUZZ_SCORING.FLOWER_OWNED_PER_ELEMENT} pts / elemento</strong></p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-black text-amber-300 uppercase tracking-wider text-[11px]">Tabela 10-3: Ranking Points</h4>
            <p className="text-text-secondary">• <strong className="text-white">Swarm RP:</strong> &ge; {BIOBUZZ_RP_THRESHOLDS.SWARM_RP_AUTO_LEAVE_AND_PARK_POINTS} pts em Auto Leave + Park</p>
            <p className="text-text-secondary">• <strong className="text-white">Pollinator 1 RP:</strong> &ge; {BIOBUZZ_RP_THRESHOLDS.POLLINATOR_1_HIVE_TIPS} Hive Tips</p>
            <p className="text-text-secondary">• <strong className="text-white">Pollinator 2 RP:</strong> &ge; {BIOBUZZ_RP_THRESHOLDS.POLLINATOR_2_HIVE_TIPS} Hive Tips</p>
            <p className="text-text-muted text-[11px] pt-1">Match: 30s Auto + 8s Transição + 2min TeleOp (Flowers nos últimos 60s).</p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-black text-orange-300 uppercase tracking-wider text-[11px]">Regras Críticas & Faltas</h4>
            <p className="text-text-secondary">• Posse Máxima (G407): <strong className="text-white">{BIOBUZZ_SCORING.POSSESSION_LIMIT} esferas</strong></p>
            <p className="text-text-secondary">• Pinning máximo: <strong className="text-white">3 segundos</strong> (recuar 2 ft)</p>
            <p className="text-text-secondary">• Minor Foul: <strong className="text-orange-300">+{BIOBUZZ_SCORING.MINOR_FOUL_TO_OPPONENT} pts</strong> ao adversário</p>
            <p className="text-text-secondary">• Major Foul: <strong className="text-red-400">+{BIOBUZZ_SCORING.MAJOR_FOUL_TO_OPPONENT} pts</strong> ao adversário</p>
            <p className="text-text-secondary">• Cubo inicial: <strong className="text-white">18" × 18" × 18"</strong></p>
          </div>
        </div>
      )}

      {/* Painel de Team Updates / Regras Extras (Técnicos gerenciam) */}
      {showUpdatesPanel && (
        <div className="bg-primary/50 border border-amber-500/25 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} />
              Team Updates & Regras Extras Injetadas na IA
            </h4>
            {!isTech && (
              <span className="text-[10px] text-text-muted">Apenas técnicos editam a base de regras</span>
            )}
          </div>

          {isTech && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-black/30 p-3 rounded-xl border border-white/5">
              <input
                type="text"
                value={updateTitle}
                onChange={e => setUpdateTitle(e.target.value)}
                placeholder="Título (ex: Team Update 05 - Limite Championship)"
                className="sm:col-span-4 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <input
                type="text"
                value={updateContent}
                onChange={e => setUpdateContent(e.target.value)}
                placeholder="Regra ou atualização para treinar o contexto da IA..."
                className="sm:col-span-6 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleAddUpdate}
                disabled={savingUpdate || !updateTitle.trim() || !updateContent.trim()}
                className="sm:col-span-2 flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-lg px-3 py-2 disabled:opacity-50 transition-all"
              >
                <Plus size={14} />
                <span>Treinar</span>
              </button>
            </div>
          )}

          {teamUpdates.length === 0 ? (
            <p className="text-xs text-text-muted">Nenhum Team Update extra adicionado ainda. A IA está usando o Manual Base BIOBUZZ™ 2026–2027.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {teamUpdates.map(u => (
                <div key={u.id} className="flex items-start justify-between gap-2 bg-black/30 border border-white/5 rounded-xl p-2.5 text-xs">
                  <div>
                    <p className="font-bold text-white">{u.title}</p>
                    <p className="text-text-secondary mt-0.5">{u.content}</p>
                    <p className="text-[10px] text-text-muted mt-1">Adicionado por {u.addedBy}</p>
                  </div>
                  {isTech && (
                    <button
                      onClick={() => handleDeleteUpdate(u.id)}
                      className="p-1 text-text-muted hover:text-red-400"
                      title="Remover nota"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ações Rápidas */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1">
          <Sparkles size={12} className="text-amber-400" />
          Perguntas Rápidas:
        </span>
        {QUICK_PROMPTS.map(qp => (
          <button
            key={qp.label}
            disabled={asking}
            onClick={() => sendQuestion(qp.prompt)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/15 text-xs font-bold text-text-secondary hover:text-amber-200 border border-white/10 hover:border-amber-500/30 transition-all disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Área de Mensagens do Chat */}
      <div className={`bg-[#090e18] border border-white/10 rounded-2xl p-4 overflow-y-auto space-y-3 ${compact ? 'h-[360px]' : 'h-[460px]'}`}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Cpu size={32} />
            </div>
            <h4 className="text-base font-black text-white">Copiloto Estrategista BIOBUZZ™ Pronto</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Pergunte qualquer regra do manual FIRST® BIOBUZZ™ (Tabela 10-2, Swarm/Pollinator RPs, G407, Flowers, Hive Tips) ou peça análises táticas com base nas equipes que vocês já registraram no Scouting!
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 border ${
                    isUser
                      ? 'bg-blue-600/20 border-blue-500/30 text-white'
                      : 'bg-primary/70 border-amber-500/25 text-text-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1 text-[10px] font-bold uppercase tracking-wider">
                    <span className={isUser ? 'text-blue-300' : 'text-amber-300'}>
                      {isUser ? msg.author || currentUser : 'Estrategista IA • BIOBUZZ™'}
                    </span>
                    <span className="text-text-muted">
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {isUser ? (
                    <p className="text-xs sm:text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <FormattedAIContent text={msg.content} />
                  )}
                </div>
              </div>
            );
          })
        )}

        {asking && (
          <div className="flex justify-start">
            <div className="bg-primary/70 border border-amber-500/25 rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-amber-300">
              <RefreshCw size={14} className="animate-spin" />
              <span>Consultando Manual BIOBUZZ™ e dados de Scouting...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input de Mensagem */}
      <form
        onSubmit={e => {
          e.preventDefault();
          sendQuestion(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={asking}
          placeholder="Pergunte sobre regras do BIOBUZZ™, estratégia de partida, Pick List ou pontuação..."
          className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={asking || !input.trim()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider disabled:opacity-50 transition-all shrink-0"
        >
          <Send size={15} />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  );
};

export default BioBuzzAIAgent;
