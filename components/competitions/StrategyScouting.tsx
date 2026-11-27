import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, ClipboardList, Trophy, Calculator, Map as MapIcon, Plus, Search,
  Trash2, Edit3, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown,
  Bot, X, Sparkles, Wifi, WifiOff, Star, BarChart2, Shield, Radio,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import type {
  CompetitionEvent,
  DrivetrainType,
  MatchScoutEntry,
  PickListItem,
  ScoutedTeamPit,
  TacticalBoardPlay,
  FtcLiveMatch,
  UserRole,
} from '../../types';
import {
  BIOBUZZ_SCORING,
  simulateBioBuzzAllianceScore,
} from '../../data/bioBuzzManual';
import TacticalFieldBoard from './TacticalFieldBoard';
import BioBuzzAIAgent from './BioBuzzAIAgent';
import LiveArenaDashboard from './LiveArenaDashboard';
import QuickMatchScoutModal, {
  type MatchSlotKey,
  type QuickMatchInitialContext,
} from './QuickMatchScoutModal';

interface StrategyScoutingProps {
  event: CompetitionEvent;
  currentUser: string;
  userRole: UserRole;
  onServerSync: (action: string, payload: any) => Promise<void>;
  onOpenFullAI?: () => void;
  isLiveSyncing?: boolean;
  liveSyncError?: string | null;
  onSyncLiveEvent?: (customCode?: string) => Promise<void>;
  onUpdateLiveConfig?: (cfg: { ftcEventCode?: string; ftcSeason?: number; autoSyncEnabled?: boolean }) => Promise<void>;
  initialMatchToScout?: FtcLiveMatch | null;
  onClearInitialMatchToScout?: () => void;
}

type SubTab = 'live' | 'match' | 'pit' | 'picklist' | 'simulator' | 'tactical';

const DRIVETRAINS: DrivetrainType[] = ['Mecanum', 'Swerve', 'Tank', 'Omni/X-Drive', 'Outro'];

const ROLE_LABELS: Record<ScoutedTeamPit['teleopRolePreference'], string> = {
  scorer_hive: 'Pontuador na Colmeia (Hive Tips)',
  flower_control: 'Controle de Flores (Flowers)',
  pollen_feeder: 'Coleta e Entrega de Pollen',
  defense_hybrid: 'Defesa / Misto (Híbrido)',
};

const TIER_LABELS: Record<PickListItem['tier'], string> = {
  S: 'Nível S (Prioridade)',
  A: 'Nível A (Muito Forte)',
  B: 'Nível B (Boa Opção)',
  C: 'Nível C (Reserva)',
  'Do Not Pick': 'Evitar',
};

const TIER_STYLES: Record<PickListItem['tier'], string> = {
  S: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  A: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  B: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  C: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  'Do Not Pick': 'bg-red-500/20 text-red-300 border-red-500/40',
};

function buildInitialContextFromLiveMatch(
  m: FtcLiveMatch,
  activeSlot: MatchSlotKey = 'red1'
): QuickMatchInitialContext {
  return {
    matchNumber: m.description || `Qualif ${m.matchNum}`,
    activeSlot,
    slots: {
      red1: m.redTeams?.[0],
      red2: m.redTeams?.[1],
      blue1: m.blueTeams?.[0],
      blue2: m.blueTeams?.[1],
    },
  };
}

export const StrategyScouting: React.FC<StrategyScoutingProps> = ({
  event,
  currentUser,
  userRole,
  onServerSync,
  onOpenFullAI,
  isLiveSyncing = false,
  liveSyncError = null,
  onSyncLiveEvent,
  onUpdateLiveConfig,
  initialMatchToScout = null,
  onClearInitialMatchToScout,
}) => {
  const isTech = userRole === 'technician' || ['Jonas', 'Ramon'].includes(currentUser);
  const rawHub = event.strategyScouting;
  const hub = {
    teams: Array.isArray(rawHub?.teams) ? rawHub.teams : [],
    matchScouts: Array.isArray(rawHub?.matchScouts) ? rawHub.matchScouts : [],
    pickList: Array.isArray(rawHub?.pickList) ? rawHub.pickList : [],
    tacticalPlays: Array.isArray(rawHub?.tacticalPlays) ? rawHub.tacticalPlays : [],
    aiTeamUpdates: Array.isArray(rawHub?.aiTeamUpdates) ? rawHub.aiTeamUpdates : [],
    aiChatHistory: Array.isArray(rawHub?.aiChatHistory) ? rawHub.aiChatHistory : [],
    liveSync: rawHub?.liveSync,
  };

  const [subTab, setSubTab] = useState<SubTab>('match');
  const [searchTerm, setSearchTerm] = useState('');
  const [matchSearchTerm, setMatchSearchTerm] = useState('');
  const [showAIDrawer, setShowAIDrawer] = useState(false);

  // ─── Pit Scouting Modal State ─────────────────────────────────────────────
  const [isPitModalOpen, setIsPitModalOpen] = useState(false);
  const [pitTeamNumber, setPitTeamNumber] = useState('');
  const [pitTeamName, setPitTeamName] = useState('');
  const [pitCityState, setPitCityState] = useState('');
  const [pitSource, setPitSource] = useState<'manual' | 'ftcscout'>('manual');
  const [pitOpr, setPitOpr] = useState<ScoutedTeamPit['ftcScoutOpr']>(undefined);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<{ type: 'ok' | 'fallback'; text: string } | null>(null);

  const [pitDrivetrain, setPitDrivetrain] = useState<DrivetrainType>('Mecanum');
  const [pitSizingOk, setPitSizingOk] = useState(true);
  const [pitAprilTags, setPitAprilTags] = useState(true);
  const [pitPollen, setPitPollen] = useState(true);
  const [pitNectar, setPitNectar] = useState(true);
  const [pitHiveTip, setPitHiveTip] = useState(true);
  const [pitFlowers, setPitFlowers] = useState(true);
  const [pitMaxCap, setPitMaxCap] = useState(4);
  const [pitAutoDesc, setPitAutoDesc] = useState('');
  const [pitAutoCons, setPitAutoCons] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [pitRolePref, setPitRolePref] = useState<ScoutedTeamPit['teleopRolePreference']>('scorer_hive');
  const [pitEndgamePark, setPitEndgamePark] = useState(true);
  const [pitStrengths, setPitStrengths] = useState('');
  const [pitWeaknesses, setPitWeaknesses] = useState('');
  const [editingPitId, setEditingPitId] = useState<string | null>(null);

  // ─── Quick Match Scouting Modal State ─────────────────────────────────────
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [matchModalCtx, setMatchModalCtx] = useState<QuickMatchInitialContext | null>(null);

  useEffect(() => {
    if (initialMatchToScout) {
      setSubTab('match');
      setMatchModalCtx(buildInitialContextFromLiveMatch(initialMatchToScout));
      setIsMatchModalOpen(true);
      onClearInitialMatchToScout?.();
    }
  }, [initialMatchToScout, onClearInitialMatchToScout]);

  // ─── Simulador State ──────────────────────────────────────────────────────
  const [simTeamA, setSimTeamA] = useState<string>('');
  const [simTeamB, setSimTeamB] = useState<string>('');
  const [simInput, setSimInput] = useState({
    autoLeaveCount: 2,
    autoParkCount: 1,
    autoHiveTips: 1,
    teleopHiveTips: 4,
    cellsRemaining: 4,
    flowersBottomNectar: 2,
    ownedFlowersElements: 6,
    endgameParkCount: 2,
    opponentMinorFouls: 0,
    opponentMajorFouls: 0,
  });

  // ─── Known Teams for Quick Picker ─────────────────────────────────────────
  const knownTeamsList = useMemo(() => {
    const teamsByNum: Record<number, string> = {};
    (hub.liveSync?.rankings || []).forEach(r => {
      if (r && typeof r.teamNumber === 'number') teamsByNum[r.teamNumber] = r.teamName || `Equipe #${r.teamNumber}`;
    });
    hub.teams.forEach(t => {
      if (t && typeof t.teamNumber === 'number') teamsByNum[t.teamNumber] = t.teamName || `Equipe #${t.teamNumber}`;
    });
    hub.matchScouts.forEach(m => {
      if (m && typeof m.teamNumber === 'number' && !teamsByNum[m.teamNumber]) {
        teamsByNum[m.teamNumber] = `Equipe #${m.teamNumber}`;
      }
    });
    return Object.keys(teamsByNum)
      .map(k => ({ teamNumber: Number(k), teamName: teamsByNum[Number(k)] }))
      .sort((a, b) => a.teamNumber - b.teamNumber);
  }, [hub.teams, hub.matchScouts, hub.liveSync?.rankings]);

  // ─── Computed Analytics & Team Ranking ────────────────────────────────────
  const teamSummaries = useMemo(() => {
    const teamNumbersSet = new Set<number>();
    hub.teams.forEach(t => teamNumbersSet.add(t.teamNumber));
    hub.matchScouts.forEach(m => teamNumbersSet.add(m.teamNumber));

    return Array.from(teamNumbersSet).map(num => {
      const pit = hub.teams.find(t => t.teamNumber === num);
      const matches = hub.matchScouts.filter(m => m.teamNumber === num);
      const count = matches.length;

      const avgScore = count > 0
        ? matches.reduce((s, m) => s + m.calculatedContributionScore, 0) / count
        : 0;
      const avgAuto = count > 0
        ? matches.reduce((s, m) => s + (m.autoLeftZone ? 3 : 0) + (m.autoParked ? 5 : 0) + m.autoHiveTips * 20, 0) / count
        : 0;
      const avgTips = count > 0
        ? matches.reduce((s, m) => s + m.autoHiveTips + m.teleopHiveTips, 0) / count
        : 0;
      const avgFouls = count > 0
        ? matches.reduce((s, m) => s + m.minorFouls + m.majorFouls, 0) / count
        : 0;
      const avgDriver = count > 0
        ? matches.reduce((s, m) => s + m.driverSkillRating, 0) / count
        : pit?.autoConsistency || 3;
      const breaksCount = matches.filter(m => m.robotDisabledOrBroken).length;
      const reliabilityPct = count > 0 ? Math.round(((count - breaksCount) / count) * 100) : 100;

      const pick = hub.pickList.find(p => p.teamNumber === num);

      return {
        teamNumber: num,
        teamName: pit?.teamName || `Equipe #${num}`,
        pit,
        matchesCount: count,
        avgScore: Number(avgScore.toFixed(1)),
        avgAuto: Number(avgAuto.toFixed(1)),
        avgTips: Number(avgTips.toFixed(1)),
        avgFouls: Number(avgFouls.toFixed(1)),
        avgDriver: Number(avgDriver.toFixed(1)),
        reliabilityPct,
        pick,
      };
    }).sort((a, b) => b.avgScore - a.avgScore || (b.pit?.autoConsistency || 0) - (a.pit?.autoConsistency || 0));
  }, [hub.teams, hub.matchScouts, hub.pickList]);

  // ─── Match Groups (Agrupamento por Partida) ───────────────────────────────
  const matchGroups = useMemo(() => {
    interface MatchGroup {
      key: string;
      matchNumber: string;
      latestTs: string;
      entries: MatchScoutEntry[];
      liveMatch?: FtcLiveMatch;
    }

    const groupsByKey: Record<string, MatchGroup> = {};
    const liveList = hub.liveSync?.matches || [];

    hub.matchScouts.forEach(entry => {
      const mLabel = (entry.matchNumber || 'Sem nº').trim();
      const key = mLabel.toLowerCase();
      let g = groupsByKey[key];
      if (!g) {
        const liveMatch = liveList.find(
          lm =>
            (lm.description || '').trim().toLowerCase() === key ||
            `q-${lm.matchNum}` === key ||
            String(lm.matchNum) === key
        );
        g = {
          key,
          matchNumber: mLabel,
          latestTs: entry.timestamp || '',
          entries: [],
          liveMatch,
        };
        groupsByKey[key] = g;
      }
      g.entries.push(entry);
      if ((entry.timestamp || '') > (g.latestTs || '')) {
        g.latestTs = entry.timestamp || '';
      }
    });

    const q = matchSearchTerm.trim().toLowerCase();
    const list: MatchGroup[] = Object.keys(groupsByKey).map(k => groupsByKey[k]);
    return list
      .filter(g => {
        if (!q) return true;
        if (g.matchNumber.toLowerCase().includes(q)) return true;
        return g.entries.some(e => String(e.teamNumber).includes(q));
      })
      .sort((a, b) => b.latestTs.localeCompare(a.latestTs));
  }, [hub.matchScouts, hub.liveSync?.matches, matchSearchTerm]);

  const filteredPitTeams = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return hub.teams;
    return hub.teams.filter(
      t =>
        String(t.teamNumber).includes(q) ||
        t.teamName.toLowerCase().includes(q) ||
        (t.strengths || '').toLowerCase().includes(q)
    );
  }, [hub.teams, searchTerm]);

  // ─── Pit Modal Helpers ────────────────────────────────────────────────────
  const openNewPitModal = () => {
    setEditingPitId(null);
    setPitTeamNumber('');
    setPitTeamName('');
    setPitCityState('');
    setPitSource('manual');
    setPitOpr(undefined);
    setLookupMsg(null);
    setPitDrivetrain('Mecanum');
    setPitSizingOk(true);
    setPitAprilTags(true);
    setPitPollen(true);
    setPitNectar(true);
    setPitHiveTip(true);
    setPitFlowers(true);
    setPitMaxCap(4);
    setPitAutoDesc('');
    setPitAutoCons(3);
    setPitRolePref('scorer_hive');
    setPitEndgamePark(true);
    setPitStrengths('');
    setPitWeaknesses('');
    setIsPitModalOpen(true);
  };

  const openEditPitModal = (t: ScoutedTeamPit) => {
    setEditingPitId(t.id);
    setPitTeamNumber(String(t.teamNumber));
    setPitTeamName(t.teamName);
    setPitCityState(t.cityState || '');
    setPitSource(t.source || 'manual');
    setPitOpr(t.ftcScoutOpr);
    setLookupMsg(null);
    setPitDrivetrain(t.drivetrain);
    setPitSizingOk(t.robotDimensionsOk);
    setPitAprilTags(t.usesAprilTags);
    setPitPollen(t.canScorePollen);
    setPitNectar(t.canScoreNectar);
    setPitHiveTip(t.canTipHive);
    setPitFlowers(t.canScoreFlowers);
    setPitMaxCap(t.maxCapacity);
    setPitAutoDesc(t.autoRoutineDescription);
    setPitAutoCons(t.autoConsistency);
    setPitRolePref(t.teleopRolePreference);
    setPitEndgamePark(t.endgameParkConsistent);
    setPitStrengths(t.strengths);
    setPitWeaknesses(t.weaknesses);
    setIsPitModalOpen(true);
  };

  const handleFtcScoutLookup = async () => {
    const num = parseInt(pitTeamNumber.trim(), 10);
    if (isNaN(num) || num <= 0) {
      setLookupMsg({ type: 'fallback', text: 'Informe um número de equipe válido primeiro.' });
      return;
    }
    setLookupLoading(true);
    setLookupMsg(null);
    try {
      const res = await fetch(`/api/crud?type=competitions&lookupTeam=${num}`);
      const json = await res.json();
      if (json.success && json.team) {
        setPitTeamName(json.team.teamName || '');
        if (json.team.cityState) setPitCityState(json.team.cityState);
        if (json.team.opr) setPitOpr(json.team.opr);
        setPitSource('ftcscout');
        setLookupMsg({
          type: 'ok',
          text: `Dados encontrados no FTCScout!${json.team.opr?.total ? ` Força (OPR): ${json.team.opr.total}` : ''}`,
        });
      } else {
        setPitSource('manual');
        setLookupMsg({
          type: 'fallback',
          text: json.message || 'Não encontrado no FTCScout ou sem internet — preencha os dados manualmente abaixo.',
        });
      }
    } catch {
      setPitSource('manual');
      setLookupMsg({
        type: 'fallback',
        text: 'Busca automática indisponível no momento — prossiga com o cadastro manual rápido.',
      });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSavePitTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(pitTeamNumber.trim(), 10);
    if (isNaN(num) || num <= 0 || !pitTeamName.trim()) return;

    const payload: ScoutedTeamPit = {
      id: editingPitId || `team-${num}-${Date.now()}`,
      teamNumber: num,
      teamName: pitTeamName.trim(),
      cityState: pitCityState.trim() || undefined,
      source: pitSource,
      ftcScoutOpr: pitOpr,
      drivetrain: pitDrivetrain,
      robotDimensionsOk: pitSizingOk,
      usesAprilTags: pitAprilTags,
      canScorePollen: pitPollen,
      canScoreNectar: pitNectar,
      canTipHive: pitHiveTip,
      canScoreFlowers: pitFlowers,
      maxCapacity: pitMaxCap,
      autoRoutineDescription: pitAutoDesc.trim(),
      autoConsistency: pitAutoCons,
      teleopRolePreference: pitRolePref,
      endgameParkConsistent: pitEndgamePark,
      strengths: pitStrengths.trim(),
      weaknesses: pitWeaknesses.trim(),
      scoutedBy: currentUser,
      updatedAt: new Date().toISOString(),
    };

    await onServerSync('upsert_scout_team', payload);
    setIsPitModalOpen(false);
  };

  // ─── Quick Match Scouting Openers & Save ──────────────────────────────────
  const openNewMatchScout = (teamNumber?: number) => {
    setMatchModalCtx({
      matchNumber: '',
      activeSlot: 'red1',
      slots: teamNumber ? { red1: teamNumber } : undefined,
    });
    setIsMatchModalOpen(true);
  };

  const openMatchForLiveSchedule = (m: FtcLiveMatch, slot: MatchSlotKey = 'red1') => {
    setMatchModalCtx(buildInitialContextFromLiveMatch(m, slot));
    setIsMatchModalOpen(true);
  };

  const openMatchForGroup = (
    matchNumber: string,
    slot: MatchSlotKey,
    liveMatch?: FtcLiveMatch,
    editEntry?: MatchScoutEntry
  ) => {
    setMatchModalCtx({
      matchNumber,
      activeSlot: slot,
      slots: liveMatch
        ? {
            red1: liveMatch.redTeams?.[0],
            red2: liveMatch.redTeams?.[1],
            blue1: liveMatch.blueTeams?.[0],
            blue2: liveMatch.blueTeams?.[1],
          }
        : undefined,
      editEntry,
    });
    setIsMatchModalOpen(true);
  };

  const handleSaveQuickMatchEntry = async (entry: MatchScoutEntry) => {
    await onServerSync('add_match_scout', {
      ...entry,
      scoutedBy: currentUser,
    });
  };

  // ─── Pick List Curation (Tech Only) ───────────────────────────────────────
  const handleTogglePickList = async (teamNumber: number, tier: PickListItem['tier']) => {
    if (!isTech) return;
    const exists = hub.pickList.find(p => p.teamNumber === teamNumber);
    let nextList: PickListItem[];
    if (exists) {
      nextList = hub.pickList.map(p =>
        p.teamNumber === teamNumber ? { ...p, tier, updatedBy: currentUser, updatedAt: new Date().toISOString() } : p
      );
    } else {
      nextList = [
        ...hub.pickList,
        {
          teamNumber,
          tier,
          rankOrder: hub.pickList.length + 1,
          updatedBy: currentUser,
          updatedAt: new Date().toISOString(),
        },
      ];
    }
    await onServerSync('save_pick_list', nextList);
  };

  const handleMovePickOrder = async (teamNumber: number, dir: -1 | 1) => {
    if (!isTech) return;
    const sorted = [...hub.pickList].sort((a, b) => a.rankOrder - b.rankOrder);
    const idx = sorted.findIndex(p => p.teamNumber === teamNumber);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const temp = sorted[idx];
    sorted[idx] = sorted[swapIdx];
    sorted[swapIdx] = temp;
    const reindexed = sorted.map((item, i) => ({
      ...item,
      rankOrder: i + 1,
      updatedBy: currentUser,
      updatedAt: new Date().toISOString(),
    }));
    await onServerSync('save_pick_list', reindexed);
  };

  const handleRemoveFromPickList = async (teamNumber: number) => {
    if (!isTech) return;
    const filtered = hub.pickList
      .filter(p => p.teamNumber !== teamNumber)
      .sort((a, b) => a.rankOrder - b.rankOrder)
      .map((item, i) => ({ ...item, rankOrder: i + 1 }));
    await onServerSync('save_pick_list', filtered);
  };

  // ─── Simulator Auto-fill from Teams ───────────────────────────────────────
  const applyTeamsToSimulator = (numA: string, numB: string) => {
    setSimTeamA(numA);
    setSimTeamB(numB);
    const a = teamSummaries.find(t => String(t.teamNumber) === numA);
    const b = teamSummaries.find(t => String(t.teamNumber) === numB);
    if (!a && !b) return;
    const tipsSum = Math.round((a?.avgTips || 0) + (b?.avgTips || 0));
    setSimInput(prev => ({
      ...prev,
      autoLeaveCount: (a ? 1 : 0) + (b ? 1 : 0),
      autoParkCount: (a?.avgAuto || 0) >= 8 ? 1 : 0,
      autoHiveTips: Math.min(2, Math.floor(tipsSum / 4)),
      teleopHiveTips: Math.max(0, tipsSum - Math.min(2, Math.floor(tipsSum / 4))),
      endgameParkCount: (a?.pit?.endgameParkConsistent ? 1 : 0) + (b?.pit?.endgameParkConsistent ? 1 : 0),
    }));
  };

  const simResult = useMemo(() => simulateBioBuzzAllianceScore(simInput), [simInput]);

  const getTeamLabel = (num: number) => {
    const found = knownTeamsList.find(t => t.teamNumber === num);
    return found ? found.teamName : '';
  };

  return (
    <div className="space-y-5">
      {/* Sub-navegação em Português & Acesso Rápido IA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-primary/40 border border-white/10 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'match', label: `Avaliar Partidas (${matchGroups.length})`, icon: ClipboardList },
            { id: 'live', label: `Ao Vivo (${hub.liveSync?.eventCode || 'Torneio'})`, icon: Radio },
            { id: 'pit', label: `Equipes nos Pits (${hub.teams.length})`, icon: Users },
            { id: 'picklist', label: `Ranking & Escolha (Pick List)`, icon: Trophy },
            { id: 'simulator', label: `Simulador de Pontos`, icon: Calculator },
            { id: 'tactical', label: `Quadro Tático`, icon: MapIcon },
          ].map(tab => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as SubTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-amber-500 text-black shadow-lg'
                    : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => (onOpenFullAI ? onOpenFullAI() : setShowAIDrawer(v => !v))}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shrink-0"
        >
          <Bot size={15} />
          <span>Consultar IA Estrategista</span>
        </button>
      </div>

      {/* Drawer Opcional da IA */}
      {showAIDrawer && (
        <div className="bg-primary/90 border border-cyan-500/30 rounded-2xl p-4 relative">
          <button
            onClick={() => setShowAIDrawer(false)}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white"
          >
            <X size={16} />
          </button>
          <BioBuzzAIAgent
            event={event}
            currentUser={currentUser}
            isTech={isTech}
            onSaveTeamUpdates={upds => onServerSync('save_ai_team_updates', upds)}
            onSaveChatHistory={msgs => onServerSync('save_ai_chat', msgs)}
            compact
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 1: AVALIAR PARTIDAS (SCOUTING POR PARTIDA)
      ════════════════════════════════════════════════════════════════════════ */}
      {subTab === 'match' && (
        <div className="space-y-4">
          {/* Topo + Busca + Botão Principal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white">Avaliação por Partida (Scouting de Arena)</h3>
              <p className="text-xs text-text-secondary">
                Avalie os robôs direto durante a partida e alterne rapidamente entre as 4 equipes em campo.
              </p>
            </div>
            <button
              onClick={() => openNewMatchScout()}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider shrink-0 shadow-lg"
            >
              <Plus size={16} />
              <span>Avaliar Nova Partida</span>
            </button>
          </div>

          {/* Atalho Rápido de Partidas Sincronizadas do Torneio */}
          {(hub.liveSync?.matches?.length || 0) > 0 && (
            <div className="bg-primary/40 border border-cyan-500/25 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} />
                  Partidas do Torneio (toque para avaliar na hora)
                </span>
                <span className="text-[10px] text-text-muted">Preenche as 4 equipes automaticamente</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(hub.liveSync?.matches || []).slice(0, 14).map(lm => {
                  const mKey = (lm.description || `Qualif ${lm.matchNum}`).trim().toLowerCase();
                  const countSaved = hub.matchScouts.filter(
                    s => (s.matchNumber || '').trim().toLowerCase() === mKey
                  ).length;
                  const redList = lm.redTeams || [];
                  const blueList = lm.blueTeams || [];
                  const hasBazinga = redList.includes(21083) || blueList.includes(21083);

                  return (
                    <button
                      key={lm.id}
                      onClick={() => openMatchForLiveSchedule(lm)}
                      className={`shrink-0 px-3 py-2 rounded-xl border text-left transition-all ${
                        hasBazinga
                          ? 'bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/25'
                          : 'bg-black/40 border-white/10 hover:border-cyan-400/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-black text-white">
                        <span>{lm.description || `Q-${lm.matchNum}`}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded ${countSaved > 0 ? 'bg-emerald-500/25 text-emerald-300' : 'bg-white/10 text-text-muted'}`}>
                          {countSaved}/4
                        </span>
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5">
                        <span className="text-red-300">{redList.join(', ')}</span>
                        {' vs '}
                        <span className="text-blue-300">{blueList.join(', ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtro por Partida ou Equipe */}
          {hub.matchScouts.length > 0 && (
            <div className="relative max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={matchSearchTerm}
                onChange={e => setMatchSearchTerm(e.target.value)}
                placeholder="Filtrar por partida (ex: Q-12) ou nº da equipe..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Lista Agrupada por Partida */}
          {matchGroups.length === 0 ? (
            <div className="bg-primary/40 border border-white/10 rounded-2xl p-10 text-center space-y-3">
              <ClipboardList size={36} className="mx-auto text-amber-400 opacity-80" />
              <h4 className="text-base font-black text-white">
                {hub.matchScouts.length === 0
                  ? 'Nenhuma partida avaliada ainda'
                  : 'Nenhuma partida encontrada para esse filtro'}
              </h4>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Clique em <strong className="text-amber-300">Avaliar Nova Partida</strong> para marcar rapidamente o desempenho de qualquer equipe durante o jogo.
              </p>
              {hub.matchScouts.length === 0 && (
                <button
                  onClick={() => openNewMatchScout()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-black font-black text-xs uppercase"
                >
                  <Plus size={14} />
                  Avaliar Primeira Partida
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {matchGroups.map(group => {
                const redEntries = group.entries.filter(e => e.allianceColor === 'red');
                const blueEntries = group.entries.filter(e => e.allianceColor === 'blue');

                const renderTeamEntryCard = (m: MatchScoutEntry) => {
                  const tName = getTeamLabel(m.teamNumber);
                  return (
                    <div
                      key={m.id}
                      onClick={() =>
                        openMatchForGroup(
                          group.matchNumber,
                          m.allianceColor === 'red' ? 'red1' : 'blue1',
                          group.liveMatch,
                          m
                        )
                      }
                      className={`rounded-xl p-3 border cursor-pointer transition-all space-y-2 ${
                        m.allianceColor === 'red'
                          ? 'bg-red-500/10 border-red-500/25 hover:border-red-400/60'
                          : 'bg-blue-500/10 border-blue-500/25 hover:border-blue-400/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">#{m.teamNumber}</span>
                            {tName && <span className="text-xs text-text-secondary truncate">{tName}</span>}
                            {m.robotDisabledOrBroken && (
                              <span className="px-2 py-0.5 rounded bg-red-600/30 text-red-200 border border-red-500/40 text-[10px] font-black">
                                QUEBROU / PAROU
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-amber-300 text-sm">
                            {m.calculatedContributionScore} pts
                          </span>
                          {isTech && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                if (confirm(`Excluir avaliação da equipe #${m.teamNumber} na partida ${group.matchNumber}?`)) {
                                  onServerSync('delete_match_scout', { scoutId: m.id });
                                }
                              }}
                              className="p-1 text-text-muted hover:text-red-400"
                              title="Excluir avaliação (apenas técnicos)"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] bg-black/35 rounded-lg p-2">
                        <div>
                          <span className="text-text-muted block">Autônomo</span>
                          <strong className="text-cyan-300">
                            {m.autoLeftZone ? 'Saiu ✓' : 'Não saiu'} • {m.autoHiveTips} tomb.
                          </strong>
                        </div>
                        <div>
                          <span className="text-text-muted block">Colmeia (TeleOp)</span>
                          <strong className="text-amber-300">
                            {m.teleopHiveTips} tomb. • {m.teleopCellsRemaining} bolas
                          </strong>
                        </div>
                        <div>
                          <span className="text-text-muted block">Flores</span>
                          <strong className="text-emerald-300">
                            {m.teleopFlowersOwned} ({m.teleopFlowerElementsCount} bolas)
                          </strong>
                        </div>
                        <div>
                          <span className="text-text-muted block">Faltas / Piloto</span>
                          <strong className={m.minorFouls + m.majorFouls > 0 ? 'text-red-300' : 'text-white'}>
                            {m.minorFouls}L/{m.majorFouls}G • ★{m.driverSkillRating}
                          </strong>
                        </div>
                      </div>

                      {m.notes && (
                        <p className="text-[11px] text-text-secondary italic">"{m.notes}"</p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <span>Avaliado por: {m.scoutedBy || currentUser}</span>
                        <span className="text-cyan-300 font-bold">Toque para editar</span>
                      </div>
                    </div>
                  );
                };

                return (
                  <div
                    key={group.key}
                    className="bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-3"
                  >
                    {/* Cabeçalho da Partida */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/35 font-black text-sm">
                          Partida {group.matchNumber}
                        </span>
                        <span className="text-xs font-bold text-text-secondary">
                          {group.entries.length} {group.entries.length === 1 ? 'equipe avaliada' : 'equipes avaliadas'}
                        </span>
                        {group.liveMatch?.hasBeenPlayed && (
                          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-black/40 text-text-muted font-bold">
                            Placar Oficial: <strong className="text-red-300">{group.liveMatch.redScore ?? '-'}</strong> × <strong className="text-blue-300">{group.liveMatch.blueScore ?? '-'}</strong>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openMatchForGroup(group.matchNumber, 'red1', group.liveMatch, group.entries[0])}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-200 hover:text-black border border-cyan-500/35 font-black text-xs transition-all shrink-0"
                      >
                        Avaliar / Trocar Equipe nesta Partida
                      </button>
                    </div>

                    {/* Colunas Vermelha x Azul */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Aliança Vermelha */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-red-300 uppercase tracking-wider">
                            Aliança Vermelha ({redEntries.length})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              openMatchForGroup(
                                group.matchNumber,
                                redEntries.length === 0 ? 'red1' : 'red2',
                                group.liveMatch
                              )
                            }
                            className="text-[11px] font-bold text-red-300 hover:text-red-200"
                          >
                            + Avaliar Vermelha
                          </button>
                        </div>
                        {redEntries.length === 0 ? (
                          <button
                            type="button"
                            onClick={() => openMatchForGroup(group.matchNumber, 'red1', group.liveMatch)}
                            className="w-full py-5 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold text-red-300/80 transition-all"
                          >
                            + Avaliar equipe da Aliança Vermelha
                          </button>
                        ) : (
                          <div className="space-y-2">
                            {redEntries.map(renderTeamEntryCard)}
                          </div>
                        )}
                      </div>

                      {/* Aliança Azul */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-blue-300 uppercase tracking-wider">
                            Aliança Azul ({blueEntries.length})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              openMatchForGroup(
                                group.matchNumber,
                                blueEntries.length === 0 ? 'blue1' : 'blue2',
                                group.liveMatch
                              )
                            }
                            className="text-[11px] font-bold text-blue-300 hover:text-blue-200"
                          >
                            + Avaliar Azul
                          </button>
                        </div>
                        {blueEntries.length === 0 ? (
                          <button
                            type="button"
                            onClick={() => openMatchForGroup(group.matchNumber, 'blue1', group.liveMatch)}
                            className="w-full py-5 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-xs font-bold text-blue-300/80 transition-all"
                          >
                            + Avaliar equipe da Aliança Azul
                          </button>
                        ) : (
                          <div className="space-y-2">
                            {blueEntries.map(renderTeamEntryCard)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Gráfico Resumo por Equipe (abaixo das partidas) */}
          {teamSummaries.some(t => t.matchesCount > 0) && (
            <div className="bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 size={14} />
                Média de Pontos por Equipe nas Partidas Avaliadas
              </h4>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamSummaries.filter(t => t.matchesCount > 0).slice(0, 12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="teamNumber" stroke="#94a3b8" fontSize={11} tickFormatter={v => `#${v}`} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="avgScore" name="Média Total (pts)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="avgAuto" name="Média Autônomo" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 2: AO VIVO — PLACAR, RANKING & SINCRONIZAÇÃO FTCSCOUT
      ════════════════════════════════════════════════════════════════════════ */}
      {subTab === 'live' && (
        <LiveArenaDashboard
          event={event}
          isTech={isTech}
          isSyncing={isLiveSyncing}
          syncError={liveSyncError}
          onSyncNow={code => (onSyncLiveEvent ? onSyncLiveEvent(code) : Promise.resolve())}
          onUpdateLiveConfig={cfg => (onUpdateLiveConfig ? onUpdateLiveConfig(cfg) : Promise.resolve())}
          onAskAIAboutMatch={() => {
            if (onOpenFullAI) onOpenFullAI();
            else setShowAIDrawer(true);
          }}
          onScoutMatch={m => {
            setSubTab('match');
            openMatchForLiveSchedule(m);
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 3: EQUIPES NOS PITS (OFICINA)
      ════════════════════════════════════════════════════════════════════════ */}
      {subTab === 'pit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar equipe por número, nome ou ponto forte..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={openNewPitModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all shrink-0"
            >
              <Plus size={15} />
              <span>Cadastrar Equipe (Pit)</span>
            </button>
          </div>

          {filteredPitTeams.length === 0 ? (
            <div className="bg-primary/40 border border-white/10 rounded-2xl p-10 text-center space-y-3">
              <Users size={36} className="mx-auto text-amber-400 opacity-80" />
              <h4 className="text-base font-black text-white">Nenhuma equipe cadastrada nos Pits ainda</h4>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Cadastre as equipes do torneio usando a busca automática ou manualmente em segundos para ajudar na escolha de alianças e análise da IA.
              </p>
              <button
                onClick={openNewPitModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs uppercase"
              >
                <Plus size={14} />
                Cadastrar Primeira Equipe
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPitTeams.map(team => (
                <div
                  key={team.id}
                  className="bg-primary/40 border border-white/10 hover:border-amber-500/30 rounded-2xl p-4 space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          #{team.teamNumber}
                        </span>
                        <h4 className="font-bold text-white text-sm">{team.teamName}</h4>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">
                        {team.drivetrain} • {ROLE_LABELS[team.teleopRolePreference]}
                        {team.cityState ? ` • ${team.cityState}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditPitModal(team)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white"
                        title="Editar ficha técnica"
                      >
                        <Edit3 size={14} />
                      </button>
                      {isTech && (
                        <button
                          onClick={() => {
                            if (confirm(`Excluir equipe #${team.teamNumber} e seus registros?`)) {
                              onServerSync('delete_scout_team', { teamNumber: team.teamNumber });
                            }
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-text-muted hover:text-red-400"
                          title="Excluir equipe (apenas técnicos)"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                    {team.usesAprilTags && (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">Lê AprilTags ✓</span>
                    )}
                    {team.canTipHive && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25">Tomba Colmeia (Hive) ✓</span>
                    )}
                    {team.canScoreFlowers && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">Pontua Flores ✓</span>
                    )}
                    {team.ftcScoutOpr?.total !== undefined && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/25">
                        Força (OPR) {team.ftcScoutOpr.total}
                      </span>
                    )}
                    {team.maxCapacity > BIOBUZZ_SCORING.POSSESSION_LIMIT && (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                        <AlertTriangle size={10} /> Cap. {team.maxCapacity} (&gt; G407!)
                      </span>
                    )}
                  </div>

                  <div className="bg-black/30 rounded-xl p-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-bold text-[11px]">Autônomo ({team.autoConsistency}/5):</span>
                      <span className="text-amber-300 flex items-center gap-0.5">
                        {Array.from({ length: team.autoConsistency }).map((_, i) => (
                          <Star key={i} size={10} fill="currentColor" />
                        ))}
                      </span>
                    </div>
                    <p className="text-text-secondary text-[11px] line-clamp-2">
                      {team.autoRoutineDescription || 'Rotina autônoma não informada.'}
                    </p>
                  </div>

                  {(team.strengths || team.weaknesses) && (
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-2">
                        <span className="text-emerald-400 font-bold block">Pontos Fortes</span>
                        <p className="text-text-secondary line-clamp-2">{team.strengths || '-'}</p>
                      </div>
                      <div className="bg-orange-500/5 border border-orange-500/15 rounded-lg p-2">
                        <span className="text-orange-400 font-bold block">Riscos / Fracos</span>
                        <p className="text-text-secondary line-clamp-2">{team.weaknesses || '-'}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-text-muted">
                    <span>Avaliado por: {team.scoutedBy}</span>
                    <button
                      onClick={() => {
                        setSubTab('match');
                        openNewMatchScout(team.teamNumber);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold"
                    >
                      + Avaliar em Partida
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 4: RANKING & LISTA DE ESCOLHA (PICK LIST)
      ════════════════════════════════════════════════════════════════════════ */}
      {subTab === 'picklist' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-7 bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Ranking Geral das Equipes</h3>
            {teamSummaries.length === 0 ? (
              <p className="text-xs text-text-muted py-6 text-center">Avalie partidas ou cadastre equipes nos Pits para gerar o ranking.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-text-muted uppercase text-[10px]">
                      <th className="py-2 pr-2">Equipe</th>
                      <th className="py-2 px-2">Média Pts</th>
                      <th className="py-2 px-2">Tombadas (Tips)</th>
                      <th className="py-2 px-2">Confiabilidade</th>
                      <th className="py-2 px-2">Faltas</th>
                      {isTech && <th className="py-2 pl-2 text-right">Lista de Escolha</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {teamSummaries.map(row => (
                      <tr key={row.teamNumber} className="hover:bg-white/5">
                        <td className="py-2.5 pr-2">
                          <div className="font-bold text-white">#{row.teamNumber}</div>
                          <div className="text-[11px] text-text-muted truncate max-w-[140px]">{row.teamName}</div>
                        </td>
                        <td className="py-2.5 px-2 font-black text-amber-300">{row.avgScore}</td>
                        <td className="py-2.5 px-2 text-cyan-300 font-bold">{row.avgTips}</td>
                        <td className="py-2.5 px-2">
                          <span className={row.reliabilityPct >= 85 ? 'text-emerald-400 font-bold' : 'text-orange-400 font-bold'}>
                            {row.reliabilityPct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-text-secondary">{row.avgFouls}</td>
                        {isTech && (
                          <td className="py-2.5 pl-2 text-right">
                            <select
                              value={row.pick?.tier || ''}
                              onChange={e => {
                                const val = e.target.value as PickListItem['tier'];
                                if (val) handleTogglePickList(row.teamNumber, val);
                              }}
                              className="bg-black/50 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-bold text-white"
                            >
                              <option value="">+ Adicionar</option>
                              <option value="S">Nível S (Prioridade)</option>
                              <option value="A">Nível A (Muito Forte)</option>
                              <option value="B">Nível B (Boa Opção)</option>
                              <option value="C">Nível C (Reserva)</option>
                              <option value="Do Not Pick">Evitar</option>
                            </select>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="xl:col-span-5 bg-primary/40 border border-amber-500/25 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={15} />
                Lista de Escolha Oficial (Pick List)
              </h3>
              {!isTech && <span className="text-[10px] text-text-muted">Curadoria dos Técnicos</span>}
            </div>

            {hub.pickList.length === 0 ? (
              <p className="text-xs text-text-secondary py-8 text-center">
                {isTech
                  ? 'Use o seletor na tabela ao lado para montar a Lista de Escolha Oficial para as alianças.'
                  : 'Os técnicos ainda estão montando a Lista de Escolha Oficial deste torneio.'}
              </p>
            ) : (
              <div className="space-y-2">
                {[...hub.pickList]
                  .sort((a, b) => a.rankOrder - b.rankOrder)
                  .map((p, idx, arr) => {
                    const info = teamSummaries.find(s => s.teamNumber === p.teamNumber);
                    return (
                      <div key={p.teamNumber} className="flex items-center justify-between gap-2 bg-black/35 border border-white/10 rounded-xl p-2.5 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-black text-text-muted w-5">#{idx + 1}</span>
                          <span className={`px-2 py-0.5 rounded-md border font-black text-[10px] shrink-0 ${TIER_STYLES[p.tier]}`}>
                            {TIER_LABELS[p.tier]}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-white">#{p.teamNumber}</span>{' '}
                            <span className="text-text-secondary">{info?.teamName || ''}</span>
                          </div>
                        </div>

                        {isTech && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMovePickOrder(p.teamNumber, -1)}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              disabled={idx === arr.length - 1}
                              onClick={() => handleMovePickOrder(p.teamNumber, 1)}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              onClick={() => handleRemoveFromPickList(p.teamNumber)}
                              className="p-1 rounded bg-white/5 hover:bg-red-500/20 text-text-muted hover:text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 5: SIMULADOR DE PONTOS 2v2 BIOBUZZ™
      ════════════════════════════════════════════════════════════════════════ */}
      {subTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Simulador de Aliança (2 contra 2)</h3>
              {teamSummaries.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={simTeamA}
                    onChange={e => applyTeamsToSimulator(e.target.value, simTeamB)}
                    className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-white"
                  >
                    <option value="">Robô 1 (Média)</option>
                    {teamSummaries.map(s => (
                      <option key={s.teamNumber} value={s.teamNumber}>#{s.teamNumber}</option>
                    ))}
                  </select>
                  <span className="text-text-muted">+</span>
                  <select
                    value={simTeamB}
                    onChange={e => applyTeamsToSimulator(simTeamA, e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-white"
                  >
                    <option value="">Robô 2 (Média)</option>
                    {teamSummaries.map(s => (
                      <option key={s.teamNumber} value={s.teamNumber}>#{s.teamNumber}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { key: 'autoLeaveCount', label: 'Saída no Autônomo (Leave • 3 pts)', max: 2 },
                { key: 'autoParkCount', label: 'Estacionou no Autônomo (Park • 5 pts)', max: 2 },
                { key: 'autoHiveTips', label: 'Tombadas no Autônomo (Hive Tips • 20 pts)', max: 4 },
                { key: 'teleopHiveTips', label: 'Tombadas no TeleOp (Hive Tips • 20 pts)', max: 12 },
                { key: 'cellsRemaining', label: 'Bolas na Célula ao Fim (Cells • 2 pts)', max: 20 },
                { key: 'flowersBottomNectar', label: 'Nectar na Base da Flor (Bottom • 5 pts)', max: 4 },
                { key: 'ownedFlowersElements', label: 'Bolas em Flores Dominadas (2 pts)', max: 30 },
                { key: 'endgameParkCount', label: 'Estacionou no Final (Park • 5 pts)', max: 2 },
                { key: 'opponentMinorFouls', label: 'Faltas Leves do Adversário (+5 pts)', max: 10 },
                { key: 'opponentMajorFouls', label: 'Faltas Graves do Adversário (+20 pts)', max: 5 },
              ].map(field => (
                <div key={field.key} className="bg-black/35 border border-white/5 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-text-secondary">{field.label}</span>
                    <span className="text-amber-300">{(simInput as any)[field.key]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={field.max}
                    value={(simInput as any)[field.key]}
                    onChange={e => setSimInput(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-amber-500/10 via-primary/60 to-cyan-500/10 border border-amber-500/25 rounded-2xl p-5 space-y-4">
            <div className="text-center border-b border-white/10 pb-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-300">Pontuação Projetada da Aliança</span>
              <div className="text-5xl font-black text-white mt-1">{simResult.totalScore} <span className="text-lg text-text-muted">pts</span></div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-black/35 rounded-xl p-2.5 border border-white/5">
                <span className="text-text-muted block">Autônomo</span>
                <strong className="text-cyan-300 text-base">{simResult.autoTotal}</strong>
              </div>
              <div className="bg-black/35 rounded-xl p-2.5 border border-white/5">
                <span className="text-text-muted block">TeleOperado</span>
                <strong className="text-amber-300 text-base">{simResult.teleopTotal}</strong>
              </div>
              <div className="bg-black/35 rounded-xl p-2.5 border border-white/5">
                <span className="text-text-muted block">Faltas Adv.</span>
                <strong className="text-emerald-300 text-base">+{simResult.penaltyPts}</strong>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Pontos Bônus de Ranking — RPs ({simResult.bonusRps}/3 garantidos)
              </h4>

              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${simResult.swarmRp ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300' : 'bg-black/30 border-white/10 text-text-muted'}`}>
                <div>
                  <strong className="block">Bônus Enxame (Swarm RP • +1 RP)</strong>
                  <span className="text-[11px]">Saída + Estacionar: {simResult.swarmPoints} / 16 pts necessários</span>
                </div>
                {simResult.swarmRp ? <CheckCircle2 size={18} /> : <span>—</span>}
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${simResult.pollinator1Rp ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300' : 'bg-black/30 border-white/10 text-text-muted'}`}>
                <div>
                  <strong className="block">Bônus Polinizador 1 (Pollinator 1 • +1 RP)</strong>
                  <span className="text-[11px]">Tombadas na Colmeia: {simResult.totalHiveTips} / 4 necessárias</span>
                </div>
                {simResult.pollinator1Rp ? <CheckCircle2 size={18} /> : <span>—</span>}
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${simResult.pollinator2Rp ? 'bg-amber-500/15 border-amber-500/35 text-amber-300' : 'bg-black/30 border-white/10 text-text-muted'}`}>
                <div>
                  <strong className="block">Bônus Polinizador 2 (Pollinator 2 • +1 RP)</strong>
                  <span className="text-[11px]">Tombadas na Colmeia: {simResult.totalHiveTips} / 7 necessárias</span>
                </div>
                {simResult.pollinator2Rp ? <CheckCircle2 size={18} /> : <span>—</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 6: QUADRO TÁTICO
      ════════════════════════════════════════════════════════════════════════ */}
      {subTab === 'tactical' && (
        <TacticalFieldBoard
          plays={hub.tacticalPlays}
          currentUser={currentUser}
          isTech={isTech}
          onSavePlay={(play: TacticalBoardPlay) => onServerSync('upsert_tactical_play', play)}
          onDeletePlay={(playId: string) => onServerSync('delete_tactical_play', { playId })}
          scoutedTeams={hub.teams}
          liveRankings={hub.liveSync?.rankings || []}
          liveMatches={hub.liveSync?.matches || []}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CADASTRAR / EDITAR EQUIPE NOS PITS
      ════════════════════════════════════════════════════════════════════════ */}
      {isPitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleSavePitTeam}
            className="bg-[#0e1422] border border-white/15 rounded-2xl p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">
                {editingPitId ? `Editar Equipe #${pitTeamNumber}` : 'Cadastrar Equipe nos Pits (Oficina)'}
              </h3>
              <button type="button" onClick={() => setIsPitModalOpen(false)} className="text-text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  required
                  value={pitTeamNumber}
                  onChange={e => setPitTeamNumber(e.target.value)}
                  placeholder="Nº da Equipe (ex: 21083)"
                  className="sm:w-44 bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleFtcScoutLookup}
                  disabled={lookupLoading || !pitTeamNumber.trim()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs disabled:opacity-50"
                >
                  {lookupLoading ? <Sparkles size={14} className="animate-spin" /> : <Wifi size={14} />}
                  <span>{lookupLoading ? 'Buscando...' : 'Buscar Dados Online (FTCScout)'}</span>
                </button>
              </div>
              {lookupMsg && (
                <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${lookupMsg.type === 'ok' ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {lookupMsg.type === 'ok' ? <CheckCircle2 size={13} /> : <WifiOff size={13} />}
                  <span>{lookupMsg.text}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Nome da Equipe *</label>
                <input
                  type="text"
                  required
                  value={pitTeamName}
                  onChange={e => setPitTeamName(e.target.value)}
                  placeholder="Ex: Bazinga! 73"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Cidade / Estado</label>
                <input
                  type="text"
                  value={pitCityState}
                  onChange={e => setPitCityState(e.target.value)}
                  placeholder="Ex: Bauru, SP"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Tipo de Tração (Drivetrain)</label>
                <select
                  value={pitDrivetrain}
                  onChange={e => setPitDrivetrain(e.target.value as DrivetrainType)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  {DRIVETRAINS.map(d => <option key={d} value={d} className="bg-primary">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Função Principal no Jogo (TeleOp)</label>
                <select
                  value={pitRolePref}
                  onChange={e => setPitRolePref(e.target.value as ScoutedTeamPit['teleopRolePreference'])}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  {Object.entries(ROLE_LABELS).map(([k, lbl]) => (
                    <option key={k} value={k} className="bg-primary">{lbl}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { label: 'Lê AprilTags (Câmera)', val: pitAprilTags, set: setPitAprilTags },
                { label: 'Pontua Pollen (Amarela)', val: pitPollen, set: setPitPollen },
                { label: 'Pontua Nectar (Cor)', val: pitNectar, set: setPitNectar },
                { label: 'Tomba Colmeia (Hive Tip)', val: pitHiveTip, set: setPitHiveTip },
                { label: 'Pontua nas Flores (Flowers)', val: pitFlowers, set: setPitFlowers },
                { label: 'Estaciona no Final (Park)', val: pitEndgamePark, set: setPitEndgamePark },
              ].map(cb => (
                <label key={cb.label} className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg p-2 cursor-pointer">
                  <input type="checkbox" checked={cb.val} onChange={e => cb.set(e.target.checked)} className="accent-amber-500" />
                  <span className="text-text-secondary">{cb.label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Capacidade Máx. de Bolas (Limite G407 = 4)</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={pitMaxCap}
                  onChange={e => setPitMaxCap(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Confiança no Autônomo (1 a 5)</label>
                <select
                  value={pitAutoCons}
                  onChange={e => setPitAutoCons(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n} className="bg-primary">{n} / 5</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">O que faz no Autônomo (30s)</label>
                <input
                  type="text"
                  value={pitAutoDesc}
                  onChange={e => setPitAutoDesc(e.target.value)}
                  placeholder="Ex: Sai da zona, lança 3 Pollen na Colmeia (1 Tombada) e estaciona..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-emerald-400 uppercase block mb-1">Pontos Fortes</label>
                  <textarea rows={2} value={pitStrengths} onChange={e => setPitStrengths(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white resize-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-orange-400 uppercase block mb-1">Pontos Fracos / Riscos</label>
                  <textarea rows={2} value={pitWeaknesses} onChange={e => setPitWeaknesses(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white resize-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button type="button" onClick={() => setIsPitModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold text-text-secondary">Cancelar</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase">Salvar Equipe</button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: AVALIAÇÃO RÁPIDA POR PARTIDA (TROCA INSTANTÂNEA DE EQUIPE)
      ════════════════════════════════════════════════════════════════════════ */}
      <QuickMatchScoutModal
        isOpen={isMatchModalOpen}
        initialContext={matchModalCtx}
        existingScouts={hub.matchScouts}
        liveMatches={hub.liveSync?.matches || []}
        knownTeams={knownTeamsList}
        onClose={() => setIsMatchModalOpen(false)}
        onSaveEntry={handleSaveQuickMatchEntry}
      />
    </div>
  );
};

export default StrategyScouting;
