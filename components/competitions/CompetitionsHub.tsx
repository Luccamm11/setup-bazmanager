import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, ClipboardCheck, Users, BarChart3, Award, Calendar,
  MapPin, Plus, RefreshCw, ChevronRight, AlertCircle, ArrowLeft,
  Sparkles, CheckCircle2, ShieldCheck, PlaneTakeoff, Info, Trash2, X
} from 'lucide-react';
import { CompetitionData, CompetitionEvent, UserRole } from '../../types';
import { INITIAL_COMPETITIONS_DATA } from '../../data/initialCompetitionsData';
import CompetitionChecklists from './CompetitionChecklists';

interface CompetitionsHubProps {
  currentUser: string;
  userRole: UserRole;
}

export const CompetitionsHub: React.FC<CompetitionsHubProps> = ({
  currentUser,
  userRole,
}) => {
  const [data, setData] = useState<CompetitionData>(INITIAL_COMPETITIONS_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vista ativa: 'hub' (estilo Aba Mais com os cards) ou 'checklist' (módulo de checklists)
  const [activeModule, setActiveModule] = useState<'hub' | 'checklists'>('checklists');

  // Modal Novo Evento
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventStartDate, setNewEventStartDate] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  // ─── Fetch Dados ───────────────────────────────────────────────────────────
  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crud?type=competitions');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Erro ao carregar dados de competições.');
      }
    } catch (err: any) {
      console.error('Fetch Competitions error:', err);
      setError(err.message || 'Falha ao buscar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // Evento Ativo
  const activeEvent = useMemo(() => {
    if (!data.events || data.events.length === 0) return null;
    return data.events.find(e => e.id === data.activeEventId) || data.events[0];
  }, [data.events, data.activeEventId]);

  // Salvar Evento Atualizado
  const handleUpdateEvent = async (updatedEvent: CompetitionEvent) => {
    // Atualização otimista local
    const nextEvents = data.events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    const nextData: CompetitionData = {
      ...data,
      events: nextEvents,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser,
    };
    setData(nextData);

    try {
      const res = await fetch('/api/crud?type=competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_event',
          username: currentUser,
          payload: updatedEvent,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to sync event update to backend:', err);
    }
  };

  // Mudar Evento Ativo
  const handleSelectEvent = async (eventId: string) => {
    setData(prev => ({ ...prev, activeEventId: eventId }));
    try {
      await fetch('/api/crud?type=competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_active_event',
          username: currentUser,
          eventId,
        }),
      });
    } catch (err) {
      console.error('Failed to set active event:', err);
    }
  };

  // Criar Novo Evento
  const handleCreateEvent = async () => {
    if (!newEventName.trim()) return;

    const newEvent: CompetitionEvent = {
      id: `event-${Date.now()}`,
      name: newEventName.trim(),
      location: newEventLocation.trim() || 'Arena de Competição',
      startDate: newEventStartDate || new Date().toISOString().split('T')[0],
      endDate: newEventEndDate || new Date().toISOString().split('T')[0],
      status: 'upcoming',
      description: newEventDesc.trim() || undefined,
      createdAt: new Date().toISOString(),
      createdBy: currentUser,
      updatedAt: new Date().toISOString(),
      travelChecklist: {
        departureCategories: [
          'Robô & Mecânica',
          'Eletrônica & Baterias',
          'Ferramentas & Fixação',
          'Estrutura do Pit',
          'Documentação & Equipe',
        ],
        departureItems: [
          {
            id: `dep-${Date.now()}-1`,
            name: 'Robô Principal de Competição',
            category: 'Robô & Mecânica',
            quantity: 1,
            packed: false,
          },
          {
            id: `dep-${Date.now()}-2`,
            name: 'Bumpers Oficiais Azul e Vermelho',
            category: 'Robô & Mecânica',
            quantity: 2,
            packed: false,
          },
          {
            id: `dep-${Date.now()}-3`,
            name: 'Baterias 12V testadas e rotuladas',
            category: 'Eletrônica & Baterias',
            quantity: 4,
            packed: false,
          },
          {
            id: `dep-${Date.now()}-4`,
            name: 'Caixa de Ferramentas Principal',
            category: 'Ferramentas & Fixação',
            quantity: 1,
            packed: false,
          },
        ],
        returnItems: [],
      },
      matchesChecklist: {
        hotelDepartureChecklist: [
          {
            id: `hotel-${Date.now()}-1`,
            task: 'Robô no carrinho de transporte',
            category: 'Transporte Arena',
            completed: false,
          },
          {
            id: `hotel-${Date.now()}-2`,
            task: 'Baterias cheias carregadas',
            category: 'Transporte Arena',
            completed: false,
          },
          {
            id: `hotel-${Date.now()}-3`,
            task: 'Óculos de proteção da equipe',
            category: 'Segurança & Acesso',
            completed: false,
          },
        ],
        matches: [],
      },
    };

    const nextEvents = [newEvent, ...data.events];
    const nextData: CompetitionData = {
      ...data,
      events: nextEvents,
      activeEventId: newEvent.id,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser,
    };
    setData(nextData);

    try {
      await fetch('/api/crud?type=competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_event',
          username: currentUser,
          payload: newEvent,
        }),
      });
    } catch (err) {
      console.error('Failed to create event:', err);
    }

    setNewEventName('');
    setNewEventLocation('');
    setNewEventStartDate('');
    setNewEventEndDate('');
    setNewEventDesc('');
    setIsNewEventModalOpen(false);
  };

  // Excluir Evento
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta competição e todos os seus checklists?')) return;

    const nextEvents = data.events.filter(e => e.id !== eventId);
    const nextActive = nextEvents.length > 0 ? nextEvents[0].id : null;
    setData(prev => ({
      ...prev,
      events: nextEvents,
      activeEventId: nextActive,
    }));

    try {
      await fetch('/api/crud?type=competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_event',
          username: currentUser,
          eventId,
        }),
      });
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  // Métricas do Evento Ativo
  const activeStats = useMemo(() => {
    if (!activeEvent) return { depTotal: 0, depPacked: 0, matchesCount: 0 };
    const depTotal = activeEvent.travelChecklist.departureItems.length;
    const depPacked = activeEvent.travelChecklist.departureItems.filter(i => i.packed).length;
    const matchesCount = activeEvent.matchesChecklist.matches.length;
    return { depTotal, depPacked, matchesCount };
  }, [activeEvent]);

  return (
    <div className="space-y-6">
      {/* Header da Aba Competições */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-primary/40 border border-white/5 p-6 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 text-amber-400 shadow-glow-primary">
            <Trophy size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">Competições</h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-black uppercase tracking-wider border border-blue-500/30">
                Oficial FIRST
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Hub estratégico de viagens, inspeções técnicas de arena e acompanhamento de torneios.
            </p>
          </div>
        </div>

        {/* Seletor de Competição & Botão Novo Evento */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {data.events.length > 0 && (
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl flex-1 lg:flex-initial">
              <Calendar size={14} className="text-amber-400 shrink-0" />
              <select
                value={activeEvent?.id || ''}
                onChange={e => handleSelectEvent(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                {data.events.map(ev => (
                  <option key={ev.id} value={ev.id} className="bg-primary text-white">
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setIsNewEventModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-glow-primary shrink-0"
          >
            <Plus size={14} />
            <span>Novo Torneio</span>
          </button>

          <button
            onClick={fetchCompetitions}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/5 transition-all"
            title="Atualizar dados do servidor"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Banner Resumo do Evento Ativo */}
      {activeEvent && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/20 via-primary/50 to-orange-950/20 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 text-amber-400">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{activeEvent.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                  {activeEvent.status === 'upcoming' ? 'Próxima' : activeEvent.status === 'ongoing' ? 'Em Andamento' : 'Concluída'}
                </span>
              </h3>
              <p className="text-xs text-text-secondary">
                {activeEvent.location} {activeEvent.startDate ? `• ${activeEvent.startDate}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/5">
              <span className="text-text-muted">Itens Ida: </span>
              <span className="font-bold text-blue-400">{activeStats.depPacked}/{activeStats.depTotal}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-black/30 border border-white/5">
              <span className="text-text-muted">Partidas: </span>
              <span className="font-bold text-orange-400">{activeStats.matchesCount}</span>
            </div>
            {userRole === 'technician' && data.events.length > 1 && (
              <button
                onClick={() => handleDeleteEvent(activeEvent.id)}
                className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Excluir este evento"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navegação entre Módulos da Aba Competições (Estilo Aba Mais) */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveModule('checklists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeModule === 'checklists'
              ? 'bg-blue-600 text-white shadow-glow-primary'
              : 'text-text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          <ClipboardCheck size={16} />
          <span>Checklists de Viagem & Partida</span>
        </button>

        <button
          onClick={() => setActiveModule('hub')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeModule === 'hub'
              ? 'bg-blue-600 text-white shadow-glow-primary'
              : 'text-text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          <Trophy size={16} />
          <span>Módulos de Competição</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          VISTA 1: CHECKLISTS DE VIAGEM & PARTIDA (Módulo Ativo)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeModule === 'checklists' && activeEvent && (
        <CompetitionChecklists
          event={activeEvent}
          currentUser={currentUser}
          userRole={userRole}
          onUpdateEvent={handleUpdateEvent}
        />
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          VISTA 2: GRID DE MÓDULOS DE COMPETIÇÃO (Estilo Aba Mais)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeModule === 'hub' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Checklists (Ativo) */}
            <div
              onClick={() => setActiveModule('checklists')}
              className="p-6 rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 hover:border-blue-400 hover:from-blue-500/15 cursor-pointer transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                  <ClipboardCheck className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                      Checklists de Viagem & Partida
                    </h3>
                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-black uppercase tracking-wider">
                      Ativo
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    Checklist de ida, retorno com itens ganhos, saída do hotel e inspeções pré/pós-match do robô.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Estratégia & Scouting (Próximo Módulo) */}
            <div className="p-6 rounded-xl border border-white/5 bg-primary/40 opacity-70 hover:opacity-90 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-white/5 text-orange-400">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">Estratégia & Scouting</h3>
                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/10 text-text-muted font-black uppercase tracking-wider">
                      Em Breve
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    Mapeamento de alianças, pontos fortes das outras equipes e planejamento tático da arena.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Histórico de Prêmios & B-Leed */}
            <div className="p-6 rounded-xl border border-white/5 bg-primary/40 opacity-70 hover:opacity-90 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-white/5 text-amber-400">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">Prêmios & Avaliações</h3>
                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/10 text-text-muted font-black uppercase tracking-wider">
                      Em Breve
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    Feedback dos juízes, apresentações de sala e registro de troféus e premiações da equipe.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4: Desempenho & Estatísticas de Pista */}
            <div className="p-6 rounded-xl border border-white/5 bg-primary/40 opacity-70 hover:opacity-90 transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-white/5 text-cyan-400">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">Desempenho em Pista</h3>
                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/10 text-text-muted font-black uppercase tracking-wider">
                      Em Breve
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    Médias de pontuação no autônomo, teleoperado, ranking oficial e histórico de matches.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          MODAL: CRIAR NOVO EVENTO / TORNEIO
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isNewEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-primary/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-white">Cadastrar Nova Competição</h3>
                <button
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Nome do Torneio / Evento *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Torneio Regional FIRST 2026..."
                    value={newEventName}
                    onChange={e => setNewEventName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Local / Ginásio / Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Centro de Convenções Ulysses Guimarães, Brasília..."
                    value={newEventLocation}
                    onChange={e => setNewEventLocation(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={newEventStartDate}
                      onChange={e => setNewEventStartDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={newEventEndDate}
                      onChange={e => setNewEventEndDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Descrição / Informações Adicionais
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Etapa regional classificatória para o nacional..."
                    value={newEventDesc}
                    onChange={e => setNewEventDesc(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-xs font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateEvent}
                  disabled={!newEventName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-glow-primary"
                >
                  Criar Evento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompetitionsHub;
