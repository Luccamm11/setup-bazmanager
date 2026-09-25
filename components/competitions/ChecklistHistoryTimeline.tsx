import React, { useState, useMemo } from 'react';
import {
  History, Search, Filter, CheckCircle2, Circle, Edit3, Plus,
  Trash2, User, Clock, ShieldCheck, PlaneTakeoff, PlaneLanding,
  Hotel, Calendar, ArrowRight, Tag
} from 'lucide-react';
import { ChecklistAuditLog } from '../../types';

interface ChecklistHistoryTimelineProps {
  logs: ChecklistAuditLog[];
}

export const ChecklistHistoryTimeline: React.FC<ChecklistHistoryTimelineProps> = ({ logs }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchType = filterType === 'all' || log.checklistType === filterType;
      const matchSearch =
        log.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [logs, filterType, searchTerm]);

  // Estatísticas do Histórico
  const stats = useMemo(() => {
    const total = logs.length;
    const checks = logs.filter(l => l.action === 'checked').length;
    const edits = logs.filter(l => l.action === 'updated' || l.action === 'created').length;
    
    // Usuário mais ativo
    const userCounts: Record<string, number> = {};
    logs.forEach(l => {
      userCounts[l.username] = (userCounts[l.username] || 0) + 1;
    });
    const topUser = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      checks,
      edits,
      topUserName: topUser ? topUser[0] : 'Nenhum',
      topUserCount: topUser ? topUser[1] : 0,
    };
  }, [logs]);

  const getLogTypeBadge = (type: ChecklistAuditLog['checklistType']) => {
    switch (type) {
      case 'travel_departure':
        return { label: 'Viagem: Ida', icon: PlaneTakeoff, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
      case 'travel_return':
        return { label: 'Viagem: Volta', icon: PlaneLanding, color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20' };
      case 'hotel_departure':
        return { label: 'Saída Hotel', icon: Hotel, color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' };
      case 'match_pre':
        return { label: 'Pré-Match', icon: ShieldCheck, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
      case 'match_post':
        return { label: 'Pós-Match', icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      default:
        return { label: 'Geral', icon: Tag, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    }
  };

  const getActionBadge = (action: ChecklistAuditLog['action']) => {
    switch (action) {
      case 'checked':
        return { text: 'Conferiu / Marcou', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/15' };
      case 'unchecked':
        return { text: 'Desmarcou', icon: Circle, color: 'text-amber-400 bg-amber-500/15' };
      case 'created':
        return { text: 'Adicionou item', icon: Plus, color: 'text-blue-400 bg-blue-500/15' };
      case 'updated':
        return { text: 'Editou item', icon: Edit3, color: 'text-cyan-300 bg-cyan-500/15' };
      case 'deleted':
        return { text: 'Excluiu item', icon: Trash2, color: 'text-red-400 bg-red-500/15' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas do Histórico */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-primary/40 border border-white/5">
          <span className="text-[10px] font-black uppercase text-text-muted tracking-wider block mb-1">Total de Ações</span>
          <span className="text-2xl font-black text-white">{stats.total}</span>
        </div>
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
          <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block mb-1">Itens Conferidos</span>
          <span className="text-2xl font-black text-emerald-300">{stats.checks}</span>
        </div>
        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20">
          <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block mb-1">Criações & Edições</span>
          <span className="text-2xl font-black text-blue-300">{stats.edits}</span>
        </div>
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
          <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider block mb-1">Membro Mais Ativo</span>
          <span className="text-sm font-black text-cyan-300 truncate block">
            {stats.topUserName} ({stats.topUserCount})
          </span>
        </div>
      </div>

      {/* Controles: Busca e Filtros */}
      <div className="p-4 rounded-xl bg-primary/40 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por item ou membro..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-glow-primary'
                : 'bg-white/5 text-text-secondary hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('travel_departure')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              filterType === 'travel_departure'
                ? 'bg-blue-600 text-white shadow-glow-primary'
                : 'bg-white/5 text-text-secondary hover:text-white'
            }`}
          >
            Viagem Ida
          </button>
          <button
            onClick={() => setFilterType('travel_return')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              filterType === 'travel_return'
                ? 'bg-cyan-600 text-white shadow-glow-primary'
                : 'bg-white/5 text-text-secondary hover:text-white'
            }`}
          >
            Viagem Volta
          </button>
          <button
            onClick={() => setFilterType('hotel_departure')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              filterType === 'hotel_departure'
                ? 'bg-amber-600 text-white shadow-glow-primary'
                : 'bg-white/5 text-text-secondary hover:text-white'
            }`}
          >
            Hotel
          </button>
          <button
            onClick={() => setFilterType('match_pre')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              filterType === 'match_pre'
                ? 'bg-orange-600 text-white shadow-glow-primary'
                : 'bg-white/5 text-text-secondary hover:text-white'
            }`}
          >
            Pré-Match
          </button>
          <button
            onClick={() => setFilterType('match_post')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              filterType === 'match_post'
                ? 'bg-emerald-600 text-white shadow-glow-primary'
                : 'bg-white/5 text-text-secondary hover:text-white'
            }`}
          >
            Pós-Match
          </button>
        </div>
      </div>

      {/* Timeline de Registros */}
      <div className="space-y-3">
        {filteredLogs.map(log => {
          const typeBadge = getLogTypeBadge(log.checklistType);
          const actionBadge = getActionBadge(log.action);
          const TypeIcon = typeBadge.icon;
          const ActionIcon = actionBadge.icon;

          return (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-primary/40 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${typeBadge.color}`}>
                  <TypeIcon size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">{log.itemName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${actionBadge.color}`}>
                      <ActionIcon size={11} />
                      <span>{actionBadge.text}</span>
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${typeBadge.color}`}>
                      {typeBadge.label}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-xs text-text-secondary mt-1">{log.details}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-text-muted shrink-0 pl-11 sm:pl-0">
                <div className="flex items-center gap-1">
                  <User size={12} className="text-blue-400" />
                  <span className="text-text-secondary font-medium">{log.username}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>
                    {new Date(log.timestamp).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 p-6 text-text-muted">
            <History size={36} className="mx-auto mb-2 opacity-40 text-blue-400" />
            <p className="text-sm">Nenhum registro de checklist encontrado para os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistHistoryTimeline;
