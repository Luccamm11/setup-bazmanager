import React, { useState } from 'react';
import {
  Radio, RefreshCw, Trophy, Calendar, Bot, CheckCircle2,
  Clock, ExternalLink, Settings2, Zap, Shield, Users
} from 'lucide-react';
import type { CompetitionEvent, FtcLiveMatch } from '../../types';

interface LiveArenaDashboardProps {
  event: CompetitionEvent;
  isTech: boolean;
  isSyncing: boolean;
  syncError: string | null;
  onSyncNow: (customCode?: string) => Promise<void>;
  onUpdateLiveConfig: (cfg: { ftcEventCode?: string; ftcSeason?: number; autoSyncEnabled?: boolean }) => Promise<void>;
  onAskAIAboutMatch?: (match: FtcLiveMatch) => void;
}

export const LiveArenaDashboard: React.FC<LiveArenaDashboardProps> = ({
  event,
  isTech,
  isSyncing,
  syncError,
  onSyncNow,
  onUpdateLiveConfig,
  onAskAIAboutMatch,
}) => {
  const live = event.strategyScouting?.liveSync;
  const autoSyncEnabled = event.autoSyncEnabled !== false;

  const [matchFilter, setMatchFilter] = useState<'bazinga' | 'all'>('bazinga');
  const [showConfig, setShowConfig] = useState(false);
  const [codeInput, setCodeInput] = useState(event.ftcEventCode || live?.eventCode || 'BRBHQ');
  const [seasonInput, setSeasonInput] = useState(event.ftcSeason || live?.season || 2026);

  const bazingaRank = live?.rankings.find(r => r.teamNumber === 21083);
  const bazingaMatches = (live?.matches || []).filter(
    m => m.redTeams.includes(21083) || m.blueTeams.includes(21083)
  );
  const nextBazingaMatch = bazingaMatches.find(m => !m.hasBeenPlayed);

  const displayedMatches = matchFilter === 'bazinga' ? bazingaMatches : (live?.matches || []);

  const isLiveNow = Boolean(live && (live.ongoing || (live.started && !live.finished)));
  const isFinished = Boolean(live?.finished);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = codeInput.trim().toUpperCase();
    await onUpdateLiveConfig({
      ftcEventCode: clean,
      ftcSeason: Number(seasonInput) || 2026,
      autoSyncEnabled,
    });
    setShowConfig(false);
    await onSyncNow(clean);
  };

  return (
    <div className="space-y-4">
      {/* Banner de Telemetria Real-Time */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-primary/70 to-cyan-500/10 border border-emerald-500/25 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              isLiveNow
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}>
              <Radio size={22} className={isLiveNow ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white">
                  {live?.eventName || event.name}
                </h3>
                {isLiveNow ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 font-black uppercase tracking-wider">
                    ● AO VIVO (Sync 30s)
                  </span>
                ) : isFinished ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black uppercase">
                    Finalizado
                  </span>
                ) : (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black uppercase">
                    Aguardando Início • Auto-Sync Ativo
                  </span>
                )}
                {(event.ftcEventCode || live?.eventCode) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/50 text-cyan-300 font-mono font-bold border border-cyan-500/25">
                    {event.ftcEventCode || live?.eventCode} • {event.ftcSeason || live?.season || 2026}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Integração automática com <strong>FTCScout / FIRST Live</strong>. Assim que a competição começar, ranking, OPR, placares e horários atualizam sozinhos em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => onSyncNow()}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-60"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
            </button>

            <button
              onClick={() => onUpdateLiveConfig({ autoSyncEnabled: !autoSyncEnabled })}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                autoSyncEnabled
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                  : 'bg-white/5 text-text-muted border-white/10'
              }`}
            >
              Auto-Sync: {autoSyncEnabled ? 'ON' : 'OFF'}
            </button>

            {isTech && (
              <button
                onClick={() => setShowConfig(v => !v)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-white/10"
                title="Configurar código oficial do evento FTC"
              >
                <Settings2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Barra de metadados da última sincronização */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-text-muted">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Users size={12} className="text-amber-400" />
              <strong className="text-white">{live?.rankings.length || 0}</strong> equipes oficiais sincronizadas
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} className="text-cyan-400" />
              <strong className="text-white">{live?.matches.length || 0}</strong> partidas no cronograma
            </span>
            {live?.start && (
              <span>Datas: <strong className="text-white">{live.start}</strong> a <strong className="text-white">{live.end}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {live?.liveStreamURL && (
              <a
                href={live.liveStreamURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-cyan-300 hover:underline font-bold"
              >
                <ExternalLink size={12} />
                Transmissão Oficial
              </a>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {live?.lastSyncedAt
                ? `Atualizado às ${new Date(live.lastSyncedAt).toLocaleTimeString('pt-BR')}`
                : 'Aguardando primeira sincronização'}
            </span>
          </div>
        </div>

        {syncError && (
          <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
            {syncError}
          </div>
        )}

        {/* Configuração de Código do Evento (Técnicos) */}
        {showConfig && isTech && (
          <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-black/40 p-3 rounded-xl border border-white/10 text-xs">
            <div className="sm:col-span-5">
              <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Código Oficial FTC (ex: BRBHQ)</label>
              <input
                type="text"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                placeholder="BRBHQ"
                className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 text-white font-mono uppercase"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Temporada</label>
              <input
                type="number"
                value={seasonInput}
                onChange={e => setSeasonInput(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div className="sm:col-span-4 flex items-end gap-2">
              <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg px-3 py-1.5 uppercase">
                Vincular & Sincronizar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowConfig(false);
                  await onUpdateLiveConfig({ ftcEventCode: '' });
                  await onSyncNow('');
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-bold"
                title="Detectar evento da Bazinga! 73 (#21083) automaticamente"
              >
                Auto #21083
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Painel Destaque: Bazinga! 73 (#21083) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-primary/40 border border-amber-500/25 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} />
              BAZINGA! 73 (#21083) — Status Oficial
            </h4>
            {bazingaRank?.rank && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40">
                Rank #{bazingaRank.rank}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-black/35 rounded-xl p-2 border border-white/5">
              <span className="text-[10px] text-text-muted block">W-L-T</span>
              <strong className="text-white">
                {bazingaRank?.wins ?? 0}-{bazingaRank?.losses ?? 0}-{bazingaRank?.ties ?? 0}
              </strong>
            </div>
            <div className="bg-black/35 rounded-xl p-2 border border-white/5">
              <span className="text-[10px] text-text-muted block">RP Médio</span>
              <strong className="text-emerald-300">{bazingaRank?.rp ?? '—'}</strong>
            </div>
            <div className="bg-black/35 rounded-xl p-2 border border-white/5">
              <span className="text-[10px] text-text-muted block">OPR Total</span>
              <strong className="text-amber-300">{bazingaRank?.oprTotal ?? '—'}</strong>
            </div>
            <div className="bg-black/35 rounded-xl p-2 border border-white/5">
              <span className="text-[10px] text-text-muted block">Tips OPR</span>
              <strong className="text-cyan-300">{bazingaRank?.oprTips ?? '—'}</strong>
            </div>
          </div>
        </div>

        {/* Próxima Partida da Bazinga! */}
        <div className="lg:col-span-7 bg-primary/40 border border-cyan-500/25 rounded-2xl p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={14} />
              Próxima Partida da Bazinga! 73
            </h4>
            {nextBazingaMatch?.scheduledStartTime && (
              <span className="text-[11px] font-bold text-text-secondary">
                Prevista: {new Date(nextBazingaMatch.scheduledStartTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {nextBazingaMatch ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-black text-white px-2.5 py-1 rounded-lg bg-white/10">
                  {nextBazingaMatch.description}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-200 border border-red-500/30 font-bold">
                  Red: {nextBazingaMatch.redTeams.map(t => `#${t}`).join(' + ')}
                </span>
                <span className="text-text-muted font-black">VS</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-200 border border-blue-500/30 font-bold">
                  Blue: {nextBazingaMatch.blueTeams.map(t => `#${t}`).join(' + ')}
                </span>
              </div>
              {onAskAIAboutMatch && (
                <button
                  onClick={() => onAskAIAboutMatch(nextBazingaMatch)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shrink-0"
                >
                  <Bot size={14} />
                  <span>Estratégia IA</span>
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-text-secondary">
              {live && live.matches.length === 0
                ? 'A tabela oficial de partidas ainda não foi publicada pela mesa da FIRST. Assim que sair, aparecerá aqui automaticamente!'
                : 'Nenhuma partida pendente no momento.'}
            </p>
          )}
        </div>
      </div>

      {/* Grid Inferior: Ranking Oficial + Tabela de Partidas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Ranking Oficial */}
        <div className="xl:col-span-6 bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-3">
          <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy size={15} className="text-amber-400" />
            Ranking & Equipes Oficiais ({live?.rankings.length || 0})
          </h4>

          {!live || live.rankings.length === 0 ? (
            <p className="text-xs text-text-muted py-6 text-center">
              Clique em <strong>Sincronizar Agora</strong> para importar automaticamente as equipes registradas no torneio oficial.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-[#0d1424]">
                  <tr className="border-b border-white/10 text-text-muted uppercase text-[10px]">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 px-2">Equipe</th>
                    <th className="py-2 px-2">W-L-T</th>
                    <th className="py-2 px-2">RP</th>
                    <th className="py-2 pl-2 text-right">OPR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {live.rankings.map(r => {
                    const isBazinga = r.teamNumber === 21083;
                    return (
                      <tr key={r.teamNumber} className={isBazinga ? 'bg-amber-500/15' : 'hover:bg-white/5'}>
                        <td className="py-2 pr-2 font-black text-text-muted">{r.rank ?? '—'}</td>
                        <td className="py-2 px-2">
                          <div className={`font-bold ${isBazinga ? 'text-amber-300' : 'text-white'}`}>
                            #{r.teamNumber} {r.teamName}
                          </div>
                          {r.cityState && <div className="text-[10px] text-text-muted">{r.cityState}</div>}
                        </td>
                        <td className="py-2 px-2 text-text-secondary font-mono">
                          {r.wins !== undefined ? `${r.wins}-${r.losses}-${r.ties}` : '—'}
                        </td>
                        <td className="py-2 px-2 font-bold text-emerald-300">{r.rp ?? '—'}</td>
                        <td className="py-2 pl-2 text-right font-black text-cyan-300">{r.oprTotal ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Placar & Cronograma de Partidas */}
        <div className="xl:col-span-6 bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar size={15} className="text-cyan-400" />
              Partidas Ao Vivo ({displayedMatches.length})
            </h4>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg text-[11px] font-bold">
              <button
                onClick={() => setMatchFilter('bazinga')}
                className={`px-2.5 py-1 rounded-md ${matchFilter === 'bazinga' ? 'bg-amber-500 text-black' : 'text-text-muted hover:text-white'}`}
              >
                Bazinga! #21083
              </button>
              <button
                onClick={() => setMatchFilter('all')}
                className={`px-2.5 py-1 rounded-md ${matchFilter === 'all' ? 'bg-cyan-600 text-white' : 'text-text-muted hover:text-white'}`}
              >
                Todas ({live?.matches.length || 0})
              </button>
            </div>
          </div>

          {displayedMatches.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-xs text-text-secondary">
              <CheckCircle2 size={28} className="mx-auto text-emerald-400 opacity-75" />
              <p className="font-bold text-white">Aguardando liberação das chaves da competição</p>
              <p className="text-text-muted max-w-sm mx-auto">
                O sistema está monitorando automaticamente o evento <strong>{event.ftcEventCode || live?.eventCode || 'BRBHQ'}</strong>. Quando a FIRST gerar os confrontos e iniciar os jogos, todos os placares aparecerão aqui em tempo real!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {displayedMatches.map(m => (
                <div key={m.id} className="bg-black/35 border border-white/10 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white">{m.description}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.hasBeenPlayed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-text-muted'
                    }`}>
                      {m.hasBeenPlayed ? 'Finalizada' : m.scheduledStartTime ? new Date(m.scheduledStartTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agendada'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-2 flex items-center justify-between">
                      <span className="text-red-200 font-bold">{m.redTeams.map(t => `#${t}`).join(' • ')}</span>
                      <strong className="text-white text-sm">{m.redScore ?? '—'}</strong>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-2 flex items-center justify-between">
                      <span className="text-blue-200 font-bold">{m.blueTeams.map(t => `#${t}`).join(' • ')}</span>
                      <strong className="text-white text-sm">{m.blueScore ?? '—'}</strong>
                    </div>
                  </div>
                  {m.hasBeenPlayed && (
                    <div className="flex items-center justify-between text-[10px] text-text-muted pt-0.5">
                      <span>Red Tips: <strong className="text-red-300">{m.redTips ?? 0}</strong> {m.redSwarmRp ? '• Swarm✓' : ''} {m.redPollinator1Rp ? '• P1✓' : ''} {m.redPollinator2Rp ? '• P2✓' : ''}</span>
                      <span>Blue Tips: <strong className="text-blue-300">{m.blueTips ?? 0}</strong> {m.blueSwarmRp ? '• Swarm✓' : ''} {m.bluePollinator1Rp ? '• P1✓' : ''} {m.bluePollinator2Rp ? '• P2✓' : ''}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveArenaDashboard;
