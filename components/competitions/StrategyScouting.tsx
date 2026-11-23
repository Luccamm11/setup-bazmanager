import React, { useState, useMemo } from 'react';
import {
  Users, ClipboardList, Trophy, Calculator, Map, Plus, Search,
  Trash2, Edit3, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown,
  Bot, X, Sparkles, Wifi, WifiOff, Star, BarChart2, Shield, Radio
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import type {
  CompetitionData,
  CompetitionEvent,
  DrivetrainType,
  MatchScoutEntry,
  PickListItem,
  ScoutedTeamPit,
  TacticalBoardPlay,
  BioBuzzAIUpdateNote,
  BioBuzzAIChatMessage,
  FtcLiveMatch,
  UserRole,
} from '../../types';
import {
  BIOBUZZ_SCORING,
  calculateScoutEntryScore,
  simulateBioBuzzAllianceScore,
} from '../../data/bioBuzzManual';
import TacticalFieldBoard from './TacticalFieldBoard';
import BioBuzzAIAgent from './BioBuzzAIAgent';
import LiveArenaDashboard from './LiveArenaDashboard';

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
}

type SubTab = 'live' | 'pit' | 'match' | 'picklist' | 'simulator' | 'tactical';

const DRIVETRAINS: DrivetrainType[] = ['Mecanum', 'Swerve', 'Tank', 'Omni/X-Drive', 'Outro'];

const ROLE_LABELS: Record<ScoutedTeamPit['teleopRolePreference'], string> = {
  scorer_hive: 'Ciclos na Hive (Tips)',
  flower_control: 'Controle de Flowers',
  pollen_feeder: 'Coleta / Alimentação Pollen',
  defense_hybrid: 'Defesa / Híbrido',
};

const TIER_STYLES: Record<PickListItem['tier'], string> = {
  S: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  A: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  B: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  C: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  'Do Not Pick': 'bg-red-500/20 text-red-300 border-red-500/40',
};

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
}) => {
  const isTech = userRole === 'technician' || ['Jonas', 'Ramon'].includes(currentUser);
  const hub = event.strategyScouting || {
    teams: [],
    matchScouts: [],
    pickList: [],
    tacticalPlays: [],
    aiTeamUpdates: [],
    aiChatHistory: [],
  };

  const [subTab, setSubTab] = useState<SubTab>('live');
  const [searchTerm, setSearchTerm] = useState('');
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

  // ─── Match Scouting Modal State ───────────────────────────────────────────
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [msTeamNumber, setMsTeamNumber] = useState('');
  const [msMatchNumber, setMsMatchNumber] = useState('');
  const [msAlliance, setMsAlliance] = useState<'red' | 'blue'>('red');
  const [msAutoLeave, setMsAutoLeave] = useState(true);
  const [msAutoScored, setMsAutoScored] = useState(0);
  const [msAutoTips, setMsAutoTips] = useState(0);
  const [msAutoPark, setMsAutoPark] = useState(false);
  const [msTeleopTips, setMsTeleopTips] = useState(1);
  const [msCellsRem, setMsCellsRem] = useState(0);
  const [msBottomNectar, setMsBottomNectar] = useState(0);
  const [msOwnedFlowers, setMsOwnedFlowers] = useState(0);
  const [msOwnedElements, setMsOwnedElements] = useState(0);
  const [msEndgamePark, setMsEndgamePark] = useState(true);
  const [msMinorFouls, setMsMinorFouls] = useState(0);
  const [msMajorFouls, setMsMajorFouls] = useState(0);
  const [msBroken, setMsBroken] = useState(false);
  const [msDriverSkill, setMsDriverSkill] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [msDefense, setMsDefense] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [msNotes, setMsNotes] = useState('');

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
          text: `Dados encontrados no FTCScout!${json.team.opr?.total ? ` OPR: ${json.team.opr.total}` : ''}`,
        });
      } else {
        setPitSource('manual');
        setLookupMsg({
          type: 'fallback',
          text: json.message || 'Não encontrado no FTCScout ou offline — preencha os dados manualmente abaixo.',
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

  // ─── Match Scout Save ─────────────────────────────────────────────────────
  const previewMatchScore = useMemo(() => {
    return calculateScoutEntryScore({
      teamNumber: parseInt(msTeamNumber || '0', 10),
      matchNumber: msMatchNumber,
      allianceColor: msAlliance,
      autoLeftZone: msAutoLeave,
      autoPollenNectarScored: msAutoScored,
      autoHiveTips: msAutoTips,
      autoParked: msAutoPark,
      teleopHiveTips: msTeleopTips,
      teleopCellsRemaining: msCellsRem,
      teleopFlowersBottomNectar: msBottomNectar,
      teleopFlowersOwned: msOwnedFlowers,
      teleopFlowerElementsCount: msOwnedElements,
      endgameParked: msEndgamePark,
      minorFouls: msMinorFouls,
      majorFouls: msMajorFouls,
      robotDisabledOrBroken: msBroken,
      driverSkillRating: msDriverSkill,
      defenseRating: msDefense,
      notes: msNotes,
    });
  }, [
    msTeamNumber, msMatchNumber, msAlliance, msAutoLeave, msAutoScored, msAutoTips,
    msAutoPark, msTeleopTips, msCellsRem, msBottomNectar, msOwnedFlowers,
    msOwnedElements, msEndgamePark, msMinorFouls, msMajorFouls, msBroken,
    msDriverSkill, msDefense, msNotes,
  ]);

  const handleSaveMatchScout = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(msTeamNumber.trim(), 10);
    if (isNaN(num) || num <= 0 || !msMatchNumber.trim()) return;

    const entry: MatchScoutEntry = {
      id: `mscout-${Date.now()}`,
      teamNumber: num,
      matchNumber: msMatchNumber.trim(),
      allianceColor: msAlliance,
      autoLeftZone: msAutoLeave,
      autoPollenNectarScored: msAutoScored,
      autoHiveTips: msAutoTips,
      autoParked: msAutoPark,
      teleopHiveTips: msTeleopTips,
      teleopCellsRemaining: msCellsRem,
      teleopFlowersBottomNectar: msBottomNectar,
      teleopFlowersOwned: msOwnedFlowers,
      teleopFlowerElementsCount: msOwnedElements,
      endgameParked: msEndgamePark,
      minorFouls: msMinorFouls,
      majorFouls: msMajorFouls,
      robotDisabledOrBroken: msBroken,
      driverSkillRating: msDriverSkill,
      defenseRating: msDefense,
      calculatedContributionScore: previewMatchScore,
      notes: msNotes.trim() || undefined,
      scoutedBy: currentUser,
      timestamp: new Date().toISOString(),
    };

    await onServerSync('add_match_scout', entry);
    setIsMatchModalOpen(false);
    setMsNotes('');
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

  return (
    <div className="space-y-5">
      {/* Sub-navegação & Acesso Rápido IA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-primary/40 border border-white/10 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'live', label: `Ao Vivo (${hub.liveSync?.eventCode || 'API'})`, icon: Radio },
            { id: 'pit', label: `Pit Scouting (${hub.teams.length})`, icon: Users },
            { id: 'match', label: `Match Scouting (${hub.matchScouts.length})`, icon: ClipboardList },
            { id: 'picklist', label: `Ranking & Pick List`, icon: Trophy },
            { id: 'simulator', label: `Simulador BIOBUZZ™`, icon: Calculator },
            { id: 'tactical', label: `Quadro Tático`, icon: Map },
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
          <span>Consultar IA Estrategista BIOBUZZ™</span>
        </button>
      </div>

      {/* Drawer Opcional da IA dentro de Strategy */}
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
          SUB-TAB 0: AO VIVO — PLACAR, RANKING & SYNC AUTOMÁTICO FTCSCOUT
      ════════════════════════════════════════════════════════════════════════ */}
      {subTab === 'live' && (
        <LiveArenaDashboard
          event={event}
          isTech={isTech}
          isSyncing={isLiveSyncing}
          syncError={liveSyncError}
          onSyncNow={code => (onSyncLiveEvent ? onSyncLiveEvent(code) : Promise.resolve())}
          onUpdateLiveConfig={cfg => (onUpdateLiveConfig ? onUpdateLiveConfig(cfg) : Promise.resolve())}
          onAskAIAboutMatch={(m: FtcLiveMatch) => {
            if (onOpenFullAI) onOpenFullAI();
            else setShowAIDrawer(true);
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 1: PIT SCOUTING & EQUIPES
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
              <span>Adicionar Equipe (Pit)</span>
            </button>
          </div>

          {filteredPitTeams.length === 0 ? (
            <div className="bg-primary/40 border border-white/10 rounded-2xl p-10 text-center space-y-3">
              <Users size={36} className="mx-auto text-amber-400 opacity-80" />
              <h4 className="text-base font-black text-white">Nenhuma equipe mapeada no Pit Scouting ainda</h4>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Cadastre as equipes do torneio tentando a busca automática no FTCScout ou manualmente em segundos para liberar recomendações da IA e montagem de Pick List.
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

                  {/* Badges de Capacidade BIOBUZZ */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                    {team.usesAprilTags && (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">AprilTags ✓</span>
                    )}
                    {team.canTipHive && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25">Hive Tip ✓</span>
                    )}
                    {team.canScoreFlowers && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">Flowers ✓</span>
                    )}
                    {team.ftcScoutOpr?.total !== undefined && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/25">
                        OPR {team.ftcScoutOpr.total}
                      </span>
                    )}
                    {team.maxCapacity > BIOBUZZ_SCORING.POSSESSION_LIMIT && (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                        <AlertTriangle size={10} /> Cap {team.maxCapacity} (&gt; G407!)
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
                        <span className="text-emerald-400 font-bold block">Fortes</span>
                        <p className="text-text-secondary line-clamp-2">{team.strengths || '-'}</p>
                      </div>
                      <div className="bg-orange-500/5 border border-orange-500/15 rounded-lg p-2">
                        <span className="text-orange-400 font-bold block">Riscos / Fracos</span>
                        <p className="text-text-secondary line-clamp-2">{team.weaknesses || '-'}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-text-muted">
                    <span>Scout: {team.scoutedBy}</span>
                    <button
                      onClick={() => {
                        setMsTeamNumber(String(team.teamNumber));
                        setIsMatchModalOpen(true);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold"
                    >
                      + Registrar Partida
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 2: MATCH SCOUTING (ARENA)
      ════════════════════════════════════════════════════════════════════════ */}
      {subTab === 'match' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white">Avaliação de Partidas na Arena (BIOBUZZ™)</h3>
              <p className="text-xs text-text-secondary">
                Registre ações reais em Auto, TeleOp, Hive Tips, Flowers e faltas para calcular a contribuição real de cada robô.
              </p>
            </div>
            <button
              onClick={() => setIsMatchModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider shrink-0"
            >
              <Plus size={15} />
              <span>Registrar Match Scout</span>
            </button>
          </div>

          {teamSummaries.length > 0 && (
            <div className="bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 size={14} />
                Média de Pontos Contribuídos por Equipe
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamSummaries.slice(0, 12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="teamNumber" stroke="#94a3b8" fontSize={11} tickFormatter={v => `#${v}`} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="avgScore" name="Média Pts" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="avgAuto" name="Média Auto" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {hub.matchScouts.length === 0 ? (
            <div className="bg-primary/40 border border-white/10 rounded-2xl p-8 text-center text-xs text-text-secondary">
              Nenhuma partida avaliada ainda. Clique em <strong className="text-cyan-300">Registrar Match Scout</strong> direto da arquibancada!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hub.matchScouts.map(m => (
                <div key={m.id} className="bg-primary/40 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-black text-[11px] ${m.allianceColor === 'red' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        #{m.teamNumber} • {m.matchNumber}
                      </span>
                      {m.robotDisabledOrBroken && (
                        <span className="px-2 py-0.5 rounded bg-red-600/25 text-red-300 text-[10px] font-bold">
                          Quebrou/Parou
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-300 text-sm">{m.calculatedContributionScore} pts</span>
                      {isTech && (
                        <button
                          onClick={() => onServerSync('delete_match_scout', { scoutId: m.id })}
                          className="p-1 text-text-muted hover:text-red-400"
                          title="Excluir registro (técnicos)"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-[11px] text-center bg-black/30 rounded-lg p-2">
                    <div>
                      <span className="text-text-muted block">Auto Tip</span>
                      <strong className="text-cyan-300">{m.autoHiveTips}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted block">Tele Tip</span>
                      <strong className="text-amber-300">{m.teleopHiveTips}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted block">Flowers</span>
                      <strong className="text-emerald-300">{m.teleopFlowersOwned} ({m.teleopFlowerElementsCount} el.)</strong>
                    </div>
                    <div>
                      <span className="text-text-muted block">Faltas</span>
                      <strong className={m.minorFouls + m.majorFouls > 0 ? 'text-red-400' : 'text-white'}>
                        {m.minorFouls}m / {m.majorFouls}M
                      </strong>
                    </div>
                  </div>
                  {m.notes && <p className="text-text-secondary italic">"{m.notes}"</p>}
                  <p className="text-[10px] text-text-muted">Scout: {m.scoutedBy} • Driver: {m.driverSkillRating}/5</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 3: RANKING & PICK LIST OFICIAL
      ════════════════════════════════════════════════════════════════════════ */}
      {subTab === 'picklist' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Ranking Automático de Dados */}
          <div className="xl:col-span-7 bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Ranking Geral do Scouting</h3>
            {teamSummaries.length === 0 ? (
              <p className="text-xs text-text-muted py-6 text-center">Adicione equipes no Pit ou Match Scouting para gerar o ranking.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-text-muted uppercase text-[10px]">
                      <th className="py-2 pr-2">Equipe</th>
                      <th className="py-2 px-2">Média Pts</th>
                      <th className="py-2 px-2">Hive Tips</th>
                      <th className="py-2 px-2">Confiab.</th>
                      <th className="py-2 px-2">Faltas</th>
                      {isTech && <th className="py-2 pl-2 text-right">Pick List</th>}
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
                              <option value="S">Tier S</option>
                              <option value="A">Tier A</option>
                              <option value="B">Tier B</option>
                              <option value="C">Tier C</option>
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

          {/* Pick List Oficial Curada por Técnicos */}
          <div className="xl:col-span-5 bg-primary/40 border border-amber-500/25 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={15} />
                Pick List Oficial (Alliance Selection)
              </h3>
              {!isTech && <span className="text-[10px] text-text-muted">Curadoria dos Técnicos</span>}
            </div>

            {hub.pickList.length === 0 ? (
              <p className="text-xs text-text-secondary py-8 text-center">
                {isTech
                  ? 'Use o seletor na tabela ao lado para promover equipes para a Pick List Oficial.'
                  : 'Os técnicos ainda estão montando a Pick List Oficial deste torneio.'}
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
                          <span className={`px-2 py-0.5 rounded-md border font-black text-[10px] ${TIER_STYLES[p.tier]}`}>
                            {p.tier}
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
          SUB-TAB 4: SIMULADOR 2v2 BIOBUZZ™
      ════════════════════════════════════════════════════════════════════════ */}
      {subTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Simulador de Aliança 2v2 (Tabela 10-2 & 10-3)</h3>
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
                { key: 'autoLeaveCount', label: 'Auto Leave (3 pts cada)', max: 2 },
                { key: 'autoParkCount', label: 'Auto Park (5 pts cada)', max: 2 },
                { key: 'autoHiveTips', label: 'Auto Hive Tips (20 pts)', max: 4 },
                { key: 'teleopHiveTips', label: 'TeleOp Hive Tips (20 pts)', max: 12 },
                { key: 'cellsRemaining', label: 'Restante na Cell ao Fim (2 pts)', max: 20 },
                { key: 'flowersBottomNectar', label: 'Flower Bottom Nectar (5 pts)', max: 4 },
                { key: 'ownedFlowersElements', label: 'Elementos em Flowers Próprias (2 pts)', max: 30 },
                { key: 'endgameParkCount', label: 'Endgame Park (5 pts cada)', max: 2 },
                { key: 'opponentMinorFouls', label: 'Minor Fouls do Adversário (+5 pts)', max: 10 },
                { key: 'opponentMajorFouls', label: 'Major Fouls do Adversário (+20 pts)', max: 5 },
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

          {/* Resultado Simulação & Ranking Points */}
          <div className="lg:col-span-5 bg-gradient-to-br from-amber-500/10 via-primary/60 to-cyan-500/10 border border-amber-500/25 rounded-2xl p-5 space-y-4">
            <div className="text-center border-b border-white/10 pb-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-300">Pontuação Projetada da Aliança</span>
              <div className="text-5xl font-black text-white mt-1">{simResult.totalScore} <span className="text-lg text-text-muted">pts</span></div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-black/35 rounded-xl p-2.5 border border-white/5">
                <span className="text-text-muted block">Auto</span>
                <strong className="text-cyan-300 text-base">{simResult.autoTotal}</strong>
              </div>
              <div className="bg-black/35 rounded-xl p-2.5 border border-white/5">
                <span className="text-text-muted block">TeleOp</span>
                <strong className="text-amber-300 text-base">{simResult.teleopTotal}</strong>
              </div>
              <div className="bg-black/35 rounded-xl p-2.5 border border-white/5">
                <span className="text-text-muted block">Faltas Adv.</span>
                <strong className="text-emerald-300 text-base">+{simResult.penaltyPts}</strong>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Ranking Points Bônus ({simResult.bonusRps}/3 garantidos)
              </h4>

              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${simResult.swarmRp ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300' : 'bg-black/30 border-white/10 text-text-muted'}`}>
                <div>
                  <strong className="block">SWARM RP (+1 RP)</strong>
                  <span className="text-[11px]">Leave + Park: {simResult.swarmPoints} / 16 pts necessários</span>
                </div>
                {simResult.swarmRp ? <CheckCircle2 size={18} /> : <span>—</span>}
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${simResult.pollinator1Rp ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300' : 'bg-black/30 border-white/10 text-text-muted'}`}>
                <div>
                  <strong className="block">POLLINATOR 1 RP (+1 RP)</strong>
                  <span className="text-[11px]">Hive Tips: {simResult.totalHiveTips} / 4 tips necessários</span>
                </div>
                {simResult.pollinator1Rp ? <CheckCircle2 size={18} /> : <span>—</span>}
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${simResult.pollinator2Rp ? 'bg-amber-500/15 border-amber-500/35 text-amber-300' : 'bg-black/30 border-white/10 text-text-muted'}`}>
                <div>
                  <strong className="block">POLLINATOR 2 RP (+1 RP)</strong>
                  <span className="text-[11px]">Hive Tips: {simResult.totalHiveTips} / 7 tips necessários</span>
                </div>
                {simResult.pollinator2Rp ? <CheckCircle2 size={18} /> : <span>—</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 5: QUADRO TÁTICO (WHITEBOARD)
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
          MODAL: ADICIONAR / EDITAR EQUIPE NO PIT SCOUTING (COM FTCSCOUT FALLBACK)
      ════════════════════════════════════════════════════════════════════════ */}
      {isPitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleSavePitTeam}
            className="bg-[#0e1422] border border-white/15 rounded-2xl p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">
                {editingPitId ? `Editar Equipe #${pitTeamNumber}` : 'Cadastrar Equipe — Pit Scouting BIOBUZZ™'}
              </h3>
              <button type="button" onClick={() => setIsPitModalOpen(false)} className="text-text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Busca FTCScout + Fallback Manual */}
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
                  <span>{lookupLoading ? 'Buscando FTCScout...' : 'Buscar no FTCScout (Auto)'}</span>
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
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Drivetrain</label>
                <select
                  value={pitDrivetrain}
                  onChange={e => setPitDrivetrain(e.target.value as DrivetrainType)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  {DRIVETRAINS.map(d => <option key={d} value={d} className="bg-primary">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Papel Principal no TeleOp</label>
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
                { label: 'Lê AprilTags (Hive)', val: pitAprilTags, set: setPitAprilTags },
                { label: 'Pontua Pollen', val: pitPollen, set: setPitPollen },
                { label: 'Pontua Nectar', val: pitNectar, set: setPitNectar },
                { label: 'Faz Hive Tip', val: pitHiveTip, set: setPitHiveTip },
                { label: 'Domina Flowers (60s)', val: pitFlowers, set: setPitFlowers },
                { label: 'Park Endgame Estável', val: pitEndgamePark, set: setPitEndgamePark },
              ].map(cb => (
                <label key={cb.label} className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg p-2 cursor-pointer">
                  <input type="checkbox" checked={cb.val} onChange={e => cb.set(e.target.checked)} className="accent-amber-500" />
                  <span className="text-text-secondary">{cb.label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Capacidade Max (Regra G407 = 4)</label>
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
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Consistência do Autônomo (1-5)</label>
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
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Descrição da Rotina Autônoma (30s)</label>
                <input
                  type="text"
                  value={pitAutoDesc}
                  onChange={e => setPitAutoDesc(e.target.value)}
                  placeholder="Ex: Sai do Park, lança 3 Pollen na Hive (1 Tip) + estaciona..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-emerald-400 uppercase block mb-1">Pontos Fortes</label>
                  <textarea rows={2} value={pitStrengths} onChange={e => setPitStrengths(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white resize-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-orange-400 uppercase block mb-1">Fraquezas / Riscos</label>
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
          MODAL: REGISTRAR MATCH SCOUTING (ARENA)
      ════════════════════════════════════════════════════════════════════════ */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleSaveMatchScout}
            className="bg-[#0e1422] border border-white/15 rounded-2xl p-5 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Registrar Match Scouting (BIOBUZZ™)</h3>
                <span className="text-amber-300 font-bold">Contribuição Estimada: {previewMatchScore} pts</span>
              </div>
              <button type="button" onClick={() => setIsMatchModalOpen(false)} className="text-text-muted hover:text-white"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-text-muted font-bold block mb-1">Nº Equipe *</label>
                <input type="number" required value={msTeamNumber} onChange={e => setMsTeamNumber(e.target.value)} placeholder="21083" className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-2 text-white font-bold" />
              </div>
              <div>
                <label className="text-[11px] text-text-muted font-bold block mb-1">Partida *</label>
                <input type="text" required value={msMatchNumber} onChange={e => setMsMatchNumber(e.target.value)} placeholder="Q-12" className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-2 text-white font-bold" />
              </div>
              <div>
                <label className="text-[11px] text-text-muted font-bold block mb-1">Aliança</label>
                <select value={msAlliance} onChange={e => setMsAlliance(e.target.value as 'red' | 'blue')} className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-2 text-white font-bold">
                  <option value="red" className="bg-primary">Vermelha</option>
                  <option value="blue" className="bg-primary">Azul</option>
                </select>
              </div>
            </div>

            {/* Auto */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 space-y-2">
              <span className="font-black text-cyan-300 uppercase text-[11px]">Autônomo (30s)</span>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={msAutoLeave} onChange={e => setMsAutoLeave(e.target.checked)} className="accent-cyan-500" />
                  <span>Leave (3 pts)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={msAutoPark} onChange={e => setMsAutoPark(e.target.checked)} className="accent-cyan-500" />
                  <span>Auto Park (5 pts)</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-text-muted block">Auto Hive Tips (20 pts)</label>
                  <input type="number" min={0} max={5} value={msAutoTips} onChange={e => setMsAutoTips(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block">Esferas lançadas no Auto</label>
                  <input type="number" min={0} max={20} value={msAutoScored} onChange={e => setMsAutoScored(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-white" />
                </div>
              </div>
            </div>

            {/* TeleOp + Endgame */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-2">
              <span className="font-black text-amber-300 uppercase text-[11px]">TeleOp (2m) & Endgame Flowers</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-text-muted block">Tele Hive Tips (20)</label>
                  <input type="number" min={0} max={15} value={msTeleopTips} onChange={e => setMsTeleopTips(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block">Cells Fim (2)</label>
                  <input type="number" min={0} max={20} value={msCellsRem} onChange={e => setMsCellsRem(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block">Bottom Nectar (5)</label>
                  <input type="number" min={0} max={4} value={msBottomNectar} onChange={e => setMsBottomNectar(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block">El. Flower Própria (2)</label>
                  <input type="number" min={0} max={25} value={msOwnedElements} onChange={e => setMsOwnedElements(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={msEndgamePark} onChange={e => setMsEndgamePark(e.target.checked)} className="accent-amber-500" />
                  <span>Endgame Park (5 pts)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-text-muted">Flowers Dominadas:</span>
                  <input type="number" min={0} max={4} value={msOwnedFlowers} onChange={e => setMsOwnedFlowers(Number(e.target.value))} className="w-14 bg-black/50 border border-white/10 rounded px-2 py-1 text-white" />
                </div>
              </div>
            </div>

            {/* Faltas & Confiabilidade */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/30 p-3 rounded-xl border border-white/5">
              <div>
                <label className="text-[10px] text-text-muted block">Minor Fouls (+5)</label>
                <input type="number" min={0} max={10} value={msMinorFouls} onChange={e => setMsMinorFouls(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-white" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted block">Major Fouls (+20)</label>
                <input type="number" min={0} max={5} value={msMajorFouls} onChange={e => setMsMajorFouls(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-white" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted block">Driver (1-5)</label>
                <select value={msDriverSkill} onChange={e => setMsDriverSkill(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)} className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-white">
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer pt-4">
                <input type="checkbox" checked={msBroken} onChange={e => setMsBroken(e.target.checked)} className="accent-red-500" />
                <span className="text-red-300 font-bold">Quebrou/Parou</span>
              </label>
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Observações do Scout</label>
              <input type="text" value={msNotes} onChange={e => setMsNotes(e.target.value)} placeholder="Ciclo rápido, travou no campo, ótima defesa..." className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button type="button" onClick={() => setIsMatchModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/5 text-text-secondary font-bold">Cancelar</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase">Salvar Match Scout</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StrategyScouting;
