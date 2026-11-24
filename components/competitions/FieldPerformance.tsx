import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Trophy, Zap, BatteryCharging, Activity, CheckCircle2,
  AlertTriangle, Wrench, Clock, Flame, Radio, ArrowUpRight,
  ShieldCheck, TrendingUp, Sparkles, RefreshCw, ChevronDown, ChevronUp,
  Info, Layers, Gauge, Target, Cpu, Calendar, MapPin, Award
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area, Cell
} from 'recharts';
import type { CompetitionEvent, MatchRecord, FtcLiveMatch, FtcLiveTeamRanking, UserRole } from '../../types';

interface FieldPerformanceProps {
  event: CompetitionEvent;
  currentUser: string;
  userRole: UserRole;
  isLiveSyncing?: boolean;
  liveSyncError?: string | null;
  onSyncLiveEvent?: (customCode?: string) => Promise<void>;
  onNavigateToModule?: (module: 'checklists' | 'strategy' | 'ai' | 'awards') => void;
}

const BAZINGA_TEAM_NUMBER = 21083;

export const FieldPerformance: React.FC<FieldPerformanceProps> = ({
  event,
  currentUser,
  userRole,
  isLiveSyncing = false,
  liveSyncError = null,
  onSyncLiveEvent,
  onNavigateToModule,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'telemetry'>('overview');
  const [roundFilter, setRoundFilter] = useState<'all' | 'qual' | 'playoff'>('all');
  const [expandedMatchId, setExpandedMatchId] = useState<string | number | null>(null);

  const live = event.strategyScouting?.liveSync;
  const isLiveNow = Boolean(live && (live.ongoing || (live.started && !live.finished)));
  const isFinished = Boolean(live?.finished);

  // 1. Dados Oficiais da Bazinga 21083
  const bazingaRank: FtcLiveTeamRanking | undefined = useMemo(() => {
    return live?.rankings?.find(r => r.teamNumber === BAZINGA_TEAM_NUMBER);
  }, [live?.rankings]);

  // Partidas oficiais da Bazinga no FTCScout
  const liveMatches = useMemo(() => {
    if (!live?.matches) return [];
    return live.matches.filter(
      m => m.redTeams.includes(BAZINGA_TEAM_NUMBER) || m.blueTeams.includes(BAZINGA_TEAM_NUMBER)
    );
  }, [live?.matches]);

  // Partidas internas registradas no Checklist de Partidas
  const internalMatches = useMemo(() => {
    return event.matchesChecklist?.matches || [];
  }, [event.matchesChecklist?.matches]);

  // 2. Junção Inteligente Híbrida (FTC Live Oficial + Telemetria de Pit)
  const unifiedMatches = useMemo(() => {
    // Se tiver partidas oficiais no FTCScout
    if (liveMatches.length > 0) {
      return liveMatches.map((lm, idx) => {
        const isRed = lm.redTeams.includes(BAZINGA_TEAM_NUMBER);
        const allianceColor: 'red' | 'blue' = isRed ? 'red' : 'blue';
        const partnerNumber = isRed
          ? lm.redTeams.find(t => t !== BAZINGA_TEAM_NUMBER)
          : lm.blueTeams.find(t => t !== BAZINGA_TEAM_NUMBER);
        const opponents = isRed ? lm.blueTeams : lm.redTeams;

        const myScore = isRed ? (lm.redScore ?? 0) : (lm.blueScore ?? 0);
        const oppScore = isRed ? (lm.blueScore ?? 0) : (lm.redScore ?? 0);
        const myAuto = isRed ? (lm.redAuto ?? 0) : (lm.blueAuto ?? 0);
        const oppAuto = isRed ? (lm.blueAuto ?? 0) : (lm.redAuto ?? 0);
        const myTeleop = Math.max(0, myScore - myAuto);

        let outcome: 'win' | 'loss' | 'tie' | 'pending' = 'pending';
        if (lm.hasBeenPlayed) {
          if (myScore > oppScore) outcome = 'win';
          else if (myScore < oppScore) outcome = 'loss';
          else outcome = 'tie';
        }

        // Tenta cruzar com registro de checklist interno
        const internal = internalMatches.find(im => {
          const numOnlyIm = im.matchNumber.replace(/\D/g, '');
          return numOnlyIm === lm.matchNum.toString() || im.matchNumber.toLowerCase().includes(`q${lm.matchNum}`);
        }) || (internalMatches[idx] ?? null);

        // Extrai telemetria de bateria
        const parseVoltage = (str?: string) => {
          if (!str) return null;
          const clean = str.replace(/[^\d.,]/g, '').replace(',', '.');
          const num = parseFloat(clean);
          return isNaN(num) ? null : num;
        };

        const preV = internal ? parseVoltage(internal.preMatch?.batteryVoltage) : null;
        const postV = internal ? parseVoltage(internal.postMatch?.postBatteryVoltage) : null;
        const dropV = preV !== null && postV !== null ? Number((preV - postV).toFixed(2)) : null;

        return {
          id: `ftc-${lm.id}`,
          matchNumber: `Q${lm.matchNum}`,
          description: lm.description || `Quals ${lm.matchNum}`,
          level: lm.tournamentLevel,
          hasBeenPlayed: lm.hasBeenPlayed,
          allianceColor,
          partnerNumber,
          opponents,
          myScore,
          oppScore,
          myAuto,
          myTeleop,
          oppAuto,
          outcome,
          rpSwarm: isRed ? lm.redSwarmRp : lm.blueSwarmRp,
          rpPollinator: isRed ? (lm.redPollinator1Rp || lm.redPollinator2Rp) : (lm.bluePollinator1Rp || lm.bluePollinator2Rp),
          // Dados de Pit correlacionados
          internalId: internal?.id,
          preVoltage: preV,
          postVoltage: postV,
          dropVoltage: dropV,
          robotCondition: internal?.postMatch?.robotCondition || null,
          urgentMaintenance: internal?.postMatch?.urgentPitMaintenance || false,
          motorsTempOk: internal?.postMatch?.motorsTempOk ?? null,
          breakagesReport: internal?.postMatch?.breakagesReport || '',
          notes: internal?.postMatch?.notes || internal?.preMatch?.notes || '',
        };
      });
    }

    // Fallback: se não tiver liveSync ou estiver offline, usa os dados manuais do Checklist
    return internalMatches.map((im, idx) => {
      const parseVoltage = (str?: string) => {
        if (!str) return null;
        const clean = str.replace(/[^\d.,]/g, '').replace(',', '.');
        const num = parseFloat(clean);
        return isNaN(num) ? null : num;
      };

      const preV = parseVoltage(im.preMatch?.batteryVoltage);
      const postV = parseVoltage(im.postMatch?.postBatteryVoltage);
      const dropV = preV !== null && postV !== null ? Number((preV - postV).toFixed(2)) : null;

      return {
        id: im.id,
        matchNumber: im.matchNumber || `M${idx + 1}`,
        description: `Partida ${im.matchNumber}`,
        level: im.roundType.toUpperCase(),
        hasBeenPlayed: Boolean(im.postMatch?.completed),
        allianceColor: im.allianceColor || 'blue',
        partnerNumber: undefined,
        opponents: [],
        myScore: 0,
        oppScore: 0,
        myAuto: 0,
        myTeleop: 0,
        oppAuto: 0,
        outcome: 'pending' as const,
        rpSwarm: undefined,
        rpPollinator: undefined,
        internalId: im.id,
        preVoltage: preV,
        postVoltage: postV,
        dropVoltage: dropV,
        robotCondition: im.postMatch?.robotCondition || null,
        urgentMaintenance: im.postMatch?.urgentPitMaintenance || false,
        motorsTempOk: im.postMatch?.motorsTempOk ?? null,
        breakagesReport: im.postMatch?.breakagesReport || '',
        notes: im.postMatch?.notes || im.preMatch?.notes || '',
      };
    });
  }, [liveMatches, internalMatches]);

  // 3. Métricas Consolidadas de Performance
  const metrics = useMemo(() => {
    const playedMatches = unifiedMatches.filter(m => m.hasBeenPlayed);
    const wins = playedMatches.filter(m => m.outcome === 'win').length;
    const losses = playedMatches.filter(m => m.outcome === 'loss').length;
    const ties = playedMatches.filter(m => m.outcome === 'tie').length;
    const winRate = playedMatches.length > 0 ? Math.round((wins / playedMatches.length) * 100) : 0;

    // Pontuações
    const scores = playedMatches.map(m => m.myScore).filter(s => s > 0);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';
    const highScore = scores.length > 0 ? Math.max(...scores) : 0;

    const autos = playedMatches.map(m => m.myAuto).filter(s => s > 0);
    const avgAuto = autos.length > 0 ? (autos.reduce((a, b) => a + b, 0) / autos.length).toFixed(1) : '0.0';

    const teleops = playedMatches.map(m => m.myTeleop).filter(s => s > 0);
    const avgTeleop = teleops.length > 0 ? (teleops.reduce((a, b) => a + b, 0) / teleops.length).toFixed(1) : '0.0';

    // Telemetria elétrica
    const drops = unifiedMatches.map(m => m.dropVoltage).filter((d): d is number => d !== null);
    const avgDrop = drops.length > 0 ? (drops.reduce((a, b) => a + b, 0) / drops.length).toFixed(2) : '0.00';
    const maxDrop = drops.length > 0 ? Math.max(...drops).toFixed(2) : '0.00';

    // Confiabilidade de hardware
    const trackedConditions = unifiedMatches.filter(m => m.robotCondition !== null);
    const perfectCount = trackedConditions.filter(m => m.robotCondition === 'perfect').length;
    const minorCount = trackedConditions.filter(m => m.robotCondition === 'minor_issue').length;
    const damagedCount = trackedConditions.filter(m => m.robotCondition === 'damaged').length;
    const reliabilityRate = trackedConditions.length > 0
      ? Math.round((perfectCount / trackedConditions.length) * 100)
      : 100;
    const urgentCount = unifiedMatches.filter(m => m.urgentMaintenance).length;

    return {
      playedCount: playedMatches.length,
      totalCount: unifiedMatches.length,
      wins: bazingaRank?.wins ?? wins,
      losses: bazingaRank?.losses ?? losses,
      ties: bazingaRank?.ties ?? ties,
      winRate,
      avgScore,
      highScore,
      avgAuto,
      avgTeleop,
      avgDrop,
      maxDrop,
      trackedBatteryCount: drops.length,
      reliabilityRate,
      perfectCount,
      minorCount,
      damagedCount,
      urgentCount,
      rank: bazingaRank?.rank,
      totalTeams: live?.rankings?.length || 0,
      rp: bazingaRank?.rp ?? 0,
      tb1: bazingaRank?.tb1 ?? 0,
      oprTotal: bazingaRank?.oprTotal?.toFixed(1) ?? '—',
      oprAuto: bazingaRank?.oprAuto?.toFixed(1) ?? '—',
      oprTeleop: bazingaRank?.oprTeleop?.toFixed(1) ?? '—',
    };
  }, [unifiedMatches, bazingaRank, live?.rankings]);

  // 4. Dados para Gráficos
  const scoreChartData = useMemo(() => {
    return unifiedMatches
      .filter(m => m.hasBeenPlayed && m.myScore > 0)
      .map((m, idx) => ({
        match: m.matchNumber || `M${idx + 1}`,
        total: m.myScore,
        auto: m.myAuto,
        teleop: m.myTeleop,
        oppTotal: m.oppScore,
        outcome: m.outcome,
      }));
  }, [unifiedMatches]);

  const batteryChartData = useMemo(() => {
    return unifiedMatches
      .filter(m => m.preVoltage !== null && m.postVoltage !== null)
      .map((m, idx) => ({
        match: m.matchNumber || `M${idx + 1}`,
        pre: m.preVoltage,
        post: m.postVoltage,
        drop: m.dropVoltage,
        condition: m.robotCondition,
      }));
  }, [unifiedMatches]);

  const filteredMatches = useMemo(() => {
    if (roundFilter === 'all') return unifiedMatches;
    if (roundFilter === 'qual') {
      return unifiedMatches.filter(m => m.level?.toLowerCase().includes('qual') || m.matchNumber.startsWith('Q'));
    }
    return unifiedMatches.filter(m => !m.level?.toLowerCase().includes('qual') && !m.matchNumber.startsWith('Q'));
  }, [unifiedMatches, roundFilter]);

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────────────────
          HEADER / TELEMETRIA & STATUS
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary/40 border border-white/5 p-5 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-600/20 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <BarChart3 size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-black text-white">Desempenho em Pista</h3>
              {isLiveNow ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  AO VIVO
                </span>
              ) : isFinished ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black uppercase">
                  Finalizado
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase">
                  Telemetry Ready
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/40 text-cyan-300 font-mono font-bold border border-cyan-500/20">
                Team #{BAZINGA_TEAM_NUMBER}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Análise tática integrada: pontuações oficiais FIRST, saúde operacional e telemetria elétrica de arena.
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {onSyncLiveEvent && (
            <button
              onClick={() => onSyncLiveEvent()}
              disabled={isLiveSyncing}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs uppercase tracking-wider transition-all"
              title="Atualizar dados oficiais da arena via FTCScout"
            >
              <RefreshCw size={14} className={isLiveSyncing ? 'animate-spin' : ''} />
              <span>{isLiveSyncing ? 'Sincronizando...' : 'Sync FTCScout'}</span>
            </button>
          )}

          {onNavigateToModule && (
            <button
              onClick={() => onNavigateToModule('checklists')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-text-secondary hover:text-white font-bold text-xs transition-all"
            >
              <span>Ir aos Checklists</span>
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      </div>

      {liveSyncError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{liveSyncError}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          CARDS DE KPI SUPERIORES (4 BLOCOS)
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Classificação Oficial & Recorde */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/20 to-primary/60 border border-blue-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Classificação Oficial</span>
            <Trophy size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {metrics.rank ? `#${metrics.rank}` : '—'}
            </span>
            {metrics.totalTeams > 0 && (
              <span className="text-xs font-bold text-text-muted">de {metrics.totalTeams} equipes</span>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 font-bold">
              <span className="text-emerald-400">{metrics.wins}V</span>
              <span className="text-text-muted">-</span>
              <span className="text-rose-400">{metrics.losses}D</span>
              {metrics.ties > 0 && (
                <>
                  <span className="text-text-muted">-</span>
                  <span className="text-amber-400">{metrics.ties}E</span>
                </>
              )}
            </div>
            <span className="font-bold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
              {metrics.winRate}% Vitórias
            </span>
          </div>
        </div>

        {/* Card 2: Pontuação Média da Aliança */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/20 to-primary/60 border border-amber-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Pontuação Média</span>
            <Flame size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{metrics.avgScore}</span>
            <span className="text-xs font-bold text-text-muted">pts / partida</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Auto:</span>
              <span className="font-black text-amber-300">{metrics.avgAuto}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Recorde:</span>
              <span className="font-black text-emerald-400">{metrics.highScore} pts</span>
            </div>
          </div>
        </div>

        {/* Card 3: Métricas Avançadas & OPR */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/20 to-primary/60 border border-cyan-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Potencial (OPR)</span>
            <Gauge size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{metrics.oprTotal}</span>
            <span className="text-xs font-bold text-text-muted">OPR Geral</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">OPR Auto:</span>
              <span className="font-bold text-cyan-300">{metrics.oprAuto}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">RP Total:</span>
              <span className="font-bold text-blue-300">{metrics.rp} pts</span>
            </div>
          </div>
        </div>

        {/* Card 4: Confiabilidade & Telemetria Elétrica */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/20 to-primary/60 border border-emerald-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Saúde do Robô</span>
            <ShieldCheck size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{metrics.reliabilityRate}%</span>
            <span className="text-xs font-bold text-text-muted">Íntegro</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-text-muted">
              <BatteryCharging size={14} className="text-emerald-400" />
              <span>Consumo Médio:</span>
            </div>
            <span className="font-bold text-emerald-300">
              {metrics.avgDrop} V
            </span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          ABAS DE VISUALIZAÇÃO INTERNA DO MÓDULO
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity size={15} />
            <span>Gráficos & Análise</span>
          </button>

          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'matches'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-black'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={15} />
            <span>Feed Integrado de Partidas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-blue-200">
              {unifiedMatches.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'telemetry'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 font-black'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <BatteryCharging size={15} />
            <span>Telemetria Elétrica & Pit</span>
          </button>
        </div>

        {/* Filtro de Tipo de Round */}
        {activeTab === 'matches' && (
          <div className="flex items-center gap-1 bg-black/40 border border-white/5 p-1 rounded-xl text-xs">
            <button
              onClick={() => setRoundFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                roundFilter === 'all' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setRoundFilter('qual')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                roundFilter === 'qual' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              Qualificatórias
            </button>
            <button
              onClick={() => setRoundFilter('playoff')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                roundFilter === 'playoff' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              Playoffs
            </button>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          ABA 1: GRÁFICOS & ANÁLISE GERAL
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {scoreChartData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico 1: Evolução de Pontuações */}
              <div className="p-5 rounded-2xl bg-primary/40 border border-white/5 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <TrendingUp size={18} className="text-emerald-400" />
                      <span>Evolução de Pontuação por Match</span>
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Histórico dos pontos conquistados pela aliança da Bazinga
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    Média: {metrics.avgScore} pts
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scoreChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="match" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Area type="monotone" dataKey="total" name="Total Aliança" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#totalGrad)" />
                      <Line type="monotone" dataKey="oppTotal" name="Placar Oponente" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Breakdown por Fase (Auto vs Teleop) */}
              <div className="p-5 rounded-2xl bg-primary/40 border border-white/5 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Target size={18} className="text-amber-400" />
                      <span>Fases do Jogo: Autônomo vs Teleop</span>
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Composição da pontuação entre período autônomo e controlado
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Auto
                    </span>
                    <span className="flex items-center gap-1 text-blue-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Teleop
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="match" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="auto" name="Autônomo" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
                      <Bar dataKey="teleop" name="Teleop / Endgame" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-primary/40 border border-white/5 text-center space-y-3">
              <Activity size={36} className="mx-auto text-emerald-400/50" />
              <h4 className="text-base font-bold text-white">Nenhum match com pontuação sincronizada ainda</h4>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Assim que as partidas oficiais da Bazinga começarem na arena e forem sincronizadas via FTCScout, os gráficos de evolução de pontuação e divisão de fases serão desenhados automaticamente aqui.
              </p>
              {onSyncLiveEvent && (
                <button
                  onClick={() => onSyncLiveEvent()}
                  disabled={isLiveSyncing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-all"
                >
                  <RefreshCw size={14} className={isLiveSyncing ? 'animate-spin' : ''} />
                  <span>Sincronizar Arena Agora</span>
                </button>
              )}
            </div>
          )}

          {/* Destaques Táticos e Insights Rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                <Sparkles size={14} />
                <span>Consistência de Autônomo</span>
              </div>
              <p className="text-sm font-bold text-white">
                Média de {metrics.avgAuto} pontos por partida
              </p>
              <p className="text-[11px] text-text-muted">
                Rotinas de autônomo executadas e validadas pela pontuação oficial do torneio.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-1">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase">
                <Target size={14} />
                <span>Eficiência de Aliança</span>
              </div>
              <p className="text-sm font-bold text-white">
                Taxa de vitórias em {metrics.winRate}%
              </p>
              <p className="text-[11px] text-text-muted">
                Calculado sobre {metrics.playedCount} partidas concluídas da Bazinga no torneio.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase">
                <Cpu size={14} />
                <span>Confiabilidade Mecânica</span>
              </div>
              <p className="text-sm font-bold text-white">
                {metrics.reliabilityRate}% partidas sem avarias
              </p>
              <p className="text-[11px] text-text-muted">
                {metrics.perfectCount} íntegras • {metrics.minorCount} pequenos ajustes • {metrics.damagedCount} críticas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ABA 2: FEED INTEGRADO DE PARTIDAS (OFICIAL + PIT TELEMETRY)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <div className="p-8 rounded-2xl bg-primary/40 border border-white/5 text-center text-text-muted space-y-2">
              <Layers size={32} className="mx-auto opacity-40 text-blue-400" />
              <p className="text-sm font-bold text-white">Nenhuma partida encontrada para este filtro.</p>
              <p className="text-xs">Registre partidas no Checklist de Partidas ou aguarde a geração da tabela oficial no FTCScout.</p>
            </div>
          ) : (
            filteredMatches.map(match => {
              const isExpanded = expandedMatchId === match.id;
              const hasPitData = match.preVoltage !== null || match.robotCondition !== null || match.breakagesReport || match.notes;

              return (
                <div
                  key={match.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    match.outcome === 'win'
                      ? 'bg-gradient-to-r from-emerald-950/25 via-primary/50 to-primary/30 border-emerald-500/30'
                      : match.outcome === 'loss'
                      ? 'bg-gradient-to-r from-rose-950/25 via-primary/50 to-primary/30 border-rose-500/25'
                      : 'bg-primary/40 border-white/5'
                  }`}
                >
                  {/* Cabeçalho do Card da Partida */}
                  <div
                    onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 ${
                        match.allianceColor === 'red'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {match.matchNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">
                            {match.description}
                          </span>
                          {match.hasBeenPlayed ? (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                              match.outcome === 'win'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : match.outcome === 'loss'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {match.outcome === 'win' ? 'Vitória' : match.outcome === 'loss' ? 'Derrota' : 'Empate'}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-text-muted font-bold uppercase">
                              Agendada
                            </span>
                          )}

                          {match.partnerNumber && (
                            <span className="text-xs text-text-muted">
                              Parceiro: <strong className="text-white">#{match.partnerNumber}</strong>
                            </span>
                          )}
                        </div>

                        {match.opponents.length > 0 && (
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Oponentes: {match.opponents.map(o => `#${o}`).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Placar & Mini Telemetria */}
                    <div className="flex items-center gap-4 justify-between md:justify-end">
                      {match.hasBeenPlayed && (
                        <div className="text-right">
                          <div className="text-lg font-black text-white">
                            <span className={match.outcome === 'win' ? 'text-emerald-400' : 'text-white'}>
                              {match.myScore}
                            </span>
                            <span className="text-text-muted mx-1">x</span>
                            <span className={match.outcome === 'loss' ? 'text-rose-400' : 'text-text-muted'}>
                              {match.oppScore}
                            </span>
                          </div>
                          <div className="text-[10px] text-text-muted">
                            Auto: {match.myAuto} | Teleop: {match.myTeleop}
                          </div>
                        </div>
                      )}

                      {/* Pill de Telemetria de Bateria / Pit */}
                      {match.dropVoltage !== null && (
                        <div className="hidden sm:flex flex-col items-end text-xs px-2.5 py-1 rounded-lg bg-black/30 border border-white/5">
                          <span className="text-[10px] text-text-muted flex items-center gap-1">
                            <BatteryCharging size={12} className="text-cyan-400" />
                            Drop V
                          </span>
                          <span className="font-black text-cyan-300">{match.dropVoltage} V</span>
                        </div>
                      )}

                      {match.robotCondition && (
                        <div className={`hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-bold ${
                          match.robotCondition === 'perfect'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : match.robotCondition === 'minor_issue'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        }`}>
                          <CheckCircle2 size={13} />
                          <span>
                            {match.robotCondition === 'perfect' ? '100% Íntegro' : match.robotCondition === 'minor_issue' ? 'Ajuste' : 'Avaria'}
                          </span>
                        </div>
                      )}

                      <button className="text-text-muted hover:text-white p-1">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Detalhes Expandidos (Painel Híbrido Completo) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20 p-4 sm:p-6 space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Coluna 1: Dados Oficiais de Arena */}
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                              <Trophy size={14} />
                              <span>Estatísticas da Partida (Oficial)</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                                <span className="text-text-muted block text-[10px]">Autônomo Aliança</span>
                                <span className="text-base font-black text-amber-400">{match.myAuto} pts</span>
                              </div>
                              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                                <span className="text-text-muted block text-[10px]">Teleop & Endgame</span>
                                <span className="text-base font-black text-blue-400">{match.myTeleop} pts</span>
                              </div>
                            </div>

                            {(match.rpSwarm !== undefined || match.rpPollinator !== undefined) && (
                              <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-xs">
                                <span className="text-text-muted">Ranking Points Bônus:</span>
                                {match.rpSwarm && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                    +1 RP Swarm
                                  </span>
                                )}
                                {match.rpPollinator && (
                                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                                    +1 RP Pollinator
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Coluna 2: Telemetria de Pit & Checklist Interno */}
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                              <Wrench size={14} />
                              <span>Telemetria de Pit & Saúde do Robô</span>
                            </div>

                            {hasPitData ? (
                              <div className="space-y-3 text-xs">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                                    <span className="text-text-muted block text-[10px]">Pré-Match</span>
                                    <span className="font-bold text-white">{match.preVoltage ? `${match.preVoltage}V` : '—'}</span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                                    <span className="text-text-muted block text-[10px]">Pós-Match</span>
                                    <span className="font-bold text-white">{match.postVoltage ? `${match.postVoltage}V` : '—'}</span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                                    <span className="text-text-muted block text-[10px]">Queda (Drop)</span>
                                    <span className="font-black text-cyan-300">{match.dropVoltage ? `${match.dropVoltage}V` : '—'}</span>
                                  </div>
                                </div>

                                {match.breakagesReport && (
                                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                                    <div className="font-bold mb-0.5 flex items-center gap-1">
                                      <AlertTriangle size={12} />
                                      <span>Avaria Relatada:</span>
                                    </div>
                                    <p className="text-[11px]">{match.breakagesReport}</p>
                                  </div>
                                )}

                                {match.notes && (
                                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-text-secondary text-xs">
                                    <div className="font-bold text-white mb-0.5">Notas da Equipe:</div>
                                    <p className="text-[11px]">{match.notes}</p>
                                  </div>
                                )}

                                {match.urgentMaintenance && (
                                  <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
                                    <AlertTriangle size={14} />
                                    <span>Manutenção de emergência acionada no Pit após esta partida!</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-text-muted text-xs">
                                <p>Nenhum checklist de pré/pós match registrado para esta partida ainda.</p>
                                {onNavigateToModule && (
                                  <button
                                    onClick={() => onNavigateToModule('checklists')}
                                    className="mt-2 text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1"
                                  >
                                    <span>Preencher Checklist</span>
                                    <ArrowUpRight size={12} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ABA 3: TELEMETRIA ELÉTRICA & SAÚDE DE PIT
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {batteryChartData.length > 0 ? (
            <div className="p-5 rounded-2xl bg-primary/40 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <BatteryCharging size={18} className="text-cyan-400" />
                    <span>Telemetria de Tensão por Match</span>
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Comparativo da tensão inicial (Pré-Match) vs tensão final (Pós-Match)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Tensão Inicial (V)
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> Tensão Final (V)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={batteryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="match" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis domain={[10, 15]} stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="pre" name="Tensão Inicial (V)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="post" name="Tensão Final (V)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-primary/40 border border-white/5 text-center space-y-2">
              <BatteryCharging size={36} className="mx-auto text-cyan-400/50" />
              <h4 className="text-base font-bold text-white">Nenhuma medição de bateria registrada</h4>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                No módulo de Checklists de Partidas, preencha a tensão da bateria no Pré-Match (ex: 13.8V) e Pós-Match (ex: 12.1V) para alimentar a curva de consumo elétrico da arena.
              </p>
              {onNavigateToModule && (
                <button
                  onClick={() => onNavigateToModule('checklists')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all mt-2"
                >
                  <span>Abrir Checklists</span>
                  <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Cards Diagnóstico de Baterias e Motores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-primary/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase">
                <span>Consumo Médio por Partida</span>
                <BatteryCharging size={16} className="text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">{metrics.avgDrop} V</div>
              <p className="text-xs text-text-secondary">
                Diferença típica de potencial consumida durante os 2:30 de round oficial.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-primary/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase">
                <span>Maior Queda Registrada</span>
                <Flame size={16} className="text-rose-400" />
              </div>
              <div className="text-2xl font-black text-white">{metrics.maxDrop} V</div>
              <p className="text-xs text-text-secondary">
                Pico de esforço elétrico dos motores e mecanismos registrado no evento.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-primary/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase">
                <span>Partidas Monitoradas</span>
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{metrics.trackedBatteryCount}</div>
              <p className="text-xs text-text-secondary">
                Rounds com telemetria de entrada e saída conferida pela equipe de Pit.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldPerformance;
