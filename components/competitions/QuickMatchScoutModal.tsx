import React, { useState, useEffect } from 'react';
import {
  X, Check, AlertTriangle, Minus, Plus, ArrowRight,
  Save, Sparkles, CheckCircle2, RefreshCw
} from 'lucide-react';
import type {
  FtcLiveMatch,
  MatchScoutEntry,
} from '../../types';
import { calculateScoutEntryScore } from '../../data/bioBuzzManual';

export type MatchSlotKey = 'red1' | 'red2' | 'blue1' | 'blue2';

export interface QuickScoutDraft {
  id?: string;
  teamNumber: string;
  allianceColor: 'red' | 'blue';
  autoLeftZone: boolean;
  autoPollenNectarScored: number;
  autoHiveTips: number;
  autoParked: boolean;
  teleopHiveTips: number;
  teleopCellsRemaining: number;
  teleopFlowersBottomNectar: number;
  teleopFlowersOwned: number;
  teleopFlowerElementsCount: number;
  endgameParked: boolean;
  minorFouls: number;
  majorFouls: number;
  robotDisabledOrBroken: boolean;
  driverSkillRating: 1 | 2 | 3 | 4 | 5;
  defenseRating: 1 | 2 | 3 | 4 | 5;
  notes: string;
  dirty?: boolean;
}

export interface QuickMatchInitialContext {
  matchNumber: string;
  activeSlot?: MatchSlotKey;
  slots?: Partial<Record<MatchSlotKey, number>>;
  editEntry?: MatchScoutEntry;
}

interface QuickMatchScoutModalProps {
  isOpen: boolean;
  initialContext: QuickMatchInitialContext | null;
  existingScouts: MatchScoutEntry[];
  liveMatches: FtcLiveMatch[];
  knownTeams: Array<{ teamNumber: number; teamName: string }>;
  onClose: () => void;
  onSaveEntry: (entry: MatchScoutEntry) => Promise<void>;
}

const SLOT_META: Array<{ key: MatchSlotKey; label: string; short: string; alliance: 'red' | 'blue' }> = [
  { key: 'red1', label: 'Vermelha 1', short: 'V1', alliance: 'red' },
  { key: 'red2', label: 'Vermelha 2', short: 'V2', alliance: 'red' },
  { key: 'blue1', label: 'Azul 1', short: 'A1', alliance: 'blue' },
  { key: 'blue2', label: 'Azul 2', short: 'A2', alliance: 'blue' },
];

const QUICK_NOTE_CHIPS = [
  'Ciclo rápido',
  'Ótimo autônomo',
  'Boa defesa',
  'Travou / lento',
  'Caiu conexão',
  'Errou lançamentos',
];

function createEmptyDraft(alliance: 'red' | 'blue', teamNumber = ''): QuickScoutDraft {
  return {
    teamNumber,
    allianceColor: alliance,
    autoLeftZone: true,
    autoPollenNectarScored: 0,
    autoHiveTips: 0,
    autoParked: false,
    teleopHiveTips: 0,
    teleopCellsRemaining: 0,
    teleopFlowersBottomNectar: 0,
    teleopFlowersOwned: 0,
    teleopFlowerElementsCount: 0,
    endgameParked: true,
    minorFouls: 0,
    majorFouls: 0,
    robotDisabledOrBroken: false,
    driverSkillRating: 4,
    defenseRating: 3,
    notes: '',
    dirty: false,
  };
}

function entryToDraft(entry: MatchScoutEntry): QuickScoutDraft {
  return {
    id: entry.id,
    teamNumber: String(entry.teamNumber),
    allianceColor: entry.allianceColor,
    autoLeftZone: entry.autoLeftZone,
    autoPollenNectarScored: entry.autoPollenNectarScored,
    autoHiveTips: entry.autoHiveTips,
    autoParked: entry.autoParked,
    teleopHiveTips: entry.teleopHiveTips,
    teleopCellsRemaining: entry.teleopCellsRemaining,
    teleopFlowersBottomNectar: entry.teleopFlowersBottomNectar,
    teleopFlowersOwned: entry.teleopFlowersOwned,
    teleopFlowerElementsCount: entry.teleopFlowerElementsCount,
    endgameParked: entry.endgameParked,
    minorFouls: entry.minorFouls,
    majorFouls: entry.majorFouls,
    robotDisabledOrBroken: entry.robotDisabledOrBroken,
    driverSkillRating: entry.driverSkillRating,
    defenseRating: entry.defenseRating,
    notes: entry.notes || '',
    dirty: false,
  };
}

function normalizeMatchKey(val?: string): string {
  return (val || '').trim().toLowerCase();
}

function StepCounter({
  label,
  hint,
  value,
  min = 0,
  max = 30,
  accent = 'amber',
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  accent?: 'cyan' | 'amber' | 'emerald' | 'red';
  onChange: (next: number) => void;
}) {
  const accentText =
    accent === 'cyan'
      ? 'text-cyan-300'
      : accent === 'emerald'
      ? 'text-emerald-300'
      : accent === 'red'
      ? 'text-red-300'
      : 'text-amber-300';

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-xs font-bold text-white leading-tight">{label}</div>
        {hint && <div className="text-[10px] text-text-muted mt-0.5">{hint}</div>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center disabled:opacity-30 transition-all"
          aria-label={`Diminuir ${label}`}
        >
          <Minus size={18} />
        </button>
        <span className={`w-9 text-center text-lg font-black tabular-nums ${accentText}`}>
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center disabled:opacity-30 transition-all"
          aria-label={`Aumentar ${label}`}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

export const QuickMatchScoutModal: React.FC<QuickMatchScoutModalProps> = ({
  isOpen,
  initialContext,
  existingScouts,
  liveMatches,
  knownTeams,
  onClose,
  onSaveEntry,
}) => {
  const [matchNumber, setMatchNumber] = useState('');
  const [activeSlot, setActiveSlot] = useState<MatchSlotKey>('red1');
  const [drafts, setDrafts] = useState<Record<MatchSlotKey, QuickScoutDraft>>({
    red1: createEmptyDraft('red'),
    red2: createEmptyDraft('red'),
    blue1: createEmptyDraft('blue'),
    blue2: createEmptyDraft('blue'),
  });
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const buildSlotsForMatch = (
    mNum: string,
    seedSlots?: Partial<Record<MatchSlotKey, number>>,
    explicitEdit?: MatchScoutEntry
  ): { nextDrafts: Record<MatchSlotKey, QuickScoutDraft>; chosenSlot: MatchSlotKey } => {
    const key = normalizeMatchKey(mNum);
    const savedInMatch = key
      ? existingScouts.filter(s => normalizeMatchKey(s.matchNumber) === key)
      : [];

    const liveMatch = liveMatches.find(
      lm =>
        normalizeMatchKey(lm.description) === key ||
        normalizeMatchKey(`Q-${lm.matchNum}`) === key ||
        normalizeMatchKey(String(lm.matchNum)) === key
    );

    const redTeams = [
      seedSlots?.red1 ?? liveMatch?.redTeams?.[0],
      seedSlots?.red2 ?? liveMatch?.redTeams?.[1],
    ];
    const blueTeams = [
      seedSlots?.blue1 ?? liveMatch?.blueTeams?.[0],
      seedSlots?.blue2 ?? liveMatch?.blueTeams?.[1],
    ];

    const savedRed = savedInMatch.filter(s => s.allianceColor === 'red');
    const savedBlue = savedInMatch.filter(s => s.allianceColor === 'blue');

    const resolveSlot = (
      alliance: 'red' | 'blue',
      idx: 0 | 1,
      seededNum?: number
    ): QuickScoutDraft => {
      if (explicitEdit && explicitEdit.allianceColor === alliance && seededNum === explicitEdit.teamNumber) {
        return entryToDraft(explicitEdit);
      }
      if (seededNum) {
        const matchSaved = savedInMatch.find(s => s.teamNumber === seededNum);
        return matchSaved ? entryToDraft(matchSaved) : createEmptyDraft(alliance, String(seededNum));
      }
      const fallbackSaved = alliance === 'red' ? savedRed[idx] : savedBlue[idx];
      if (fallbackSaved) {
        return entryToDraft(fallbackSaved);
      }
      return createEmptyDraft(alliance);
    };

    const nextDrafts: Record<MatchSlotKey, QuickScoutDraft> = {
      red1: resolveSlot('red', 0, redTeams[0]),
      red2: resolveSlot('red', 1, redTeams[1]),
      blue1: resolveSlot('blue', 0, blueTeams[0]),
      blue2: resolveSlot('blue', 1, blueTeams[1]),
    };

    let chosenSlot: MatchSlotKey = 'red1';
    if (explicitEdit) {
      const found = (Object.keys(nextDrafts) as MatchSlotKey[]).find(
        k => nextDrafts[k].id === explicitEdit.id || nextDrafts[k].teamNumber === String(explicitEdit.teamNumber)
      );
      if (found) chosenSlot = found;
    }

    return { nextDrafts, chosenSlot };
  };

  useEffect(() => {
    if (!isOpen) return;
    const mNum = initialContext?.matchNumber || '';
    setMatchNumber(mNum);
    setFeedbackMsg(null);
    const { nextDrafts, chosenSlot } = buildSlotsForMatch(
      mNum,
      initialContext?.slots,
      initialContext?.editEntry
    );
    setDrafts(nextDrafts);
    setActiveSlot(initialContext?.activeSlot || chosenSlot);
  }, [isOpen, initialContext]);

  if (!isOpen) return null;

  const activeDraft = drafts[activeSlot];

  const updateActiveDraft = (patch: Partial<QuickScoutDraft>) => {
    setDrafts(prev => ({
      ...prev,
      [activeSlot]: {
        ...prev[activeSlot],
        ...patch,
        dirty: true,
      },
    }));
  };

  const handleLoadLiveMatch = (matchIdStr: string) => {
    const lm = liveMatches.find(m => String(m.id) === matchIdStr);
    if (!lm) return;
    const mLabel = lm.description || `Qualif ${lm.matchNum}`;
    setMatchNumber(mLabel);
    const { nextDrafts } = buildSlotsForMatch(mLabel, {
      red1: lm.redTeams?.[0],
      red2: lm.redTeams?.[1],
      blue1: lm.blueTeams?.[0],
      blue2: lm.blueTeams?.[1],
    });
    setDrafts(nextDrafts);
    setActiveSlot('red1');
    setFeedbackMsg(`Equipes da partida "${mLabel}" carregadas!`);
  };

  const handleQuickChangeTeamNumber = (newTeamStr: string) => {
    const cleanNum = parseInt(newTeamStr.trim(), 10);
    const key = normalizeMatchKey(matchNumber);
    // If there is already a saved scout for this team in this match, keep current ID if matching or load saved values if not dirty yet
    const alreadySaved =
      !isNaN(cleanNum) && key
        ? existingScouts.find(
            s => normalizeMatchKey(s.matchNumber) === key && s.teamNumber === cleanNum
          )
        : undefined;

    if (alreadySaved && !activeDraft.dirty) {
      setDrafts(prev => ({
        ...prev,
        [activeSlot]: entryToDraft(alreadySaved),
      }));
      return;
    }

    updateActiveDraft({
      teamNumber: newTeamStr,
      id: alreadySaved?.id ?? (activeDraft.id && activeDraft.teamNumber === newTeamStr ? activeDraft.id : undefined),
    });
  };

  const getTeamName = (numStr: string) => {
    const n = parseInt(numStr, 10);
    if (isNaN(n)) return '';
    return knownTeams.find(t => t.teamNumber === n)?.teamName || '';
  };

  const computeScore = (d: QuickScoutDraft) =>
    calculateScoutEntryScore({
      teamNumber: parseInt(d.teamNumber || '0', 10),
      matchNumber,
      allianceColor: d.allianceColor,
      autoLeftZone: d.autoLeftZone,
      autoPollenNectarScored: d.autoPollenNectarScored,
      autoHiveTips: d.autoHiveTips,
      autoParked: d.autoParked,
      teleopHiveTips: d.teleopHiveTips,
      teleopCellsRemaining: d.teleopCellsRemaining,
      teleopFlowersBottomNectar: d.teleopFlowersBottomNectar,
      teleopFlowersOwned: d.teleopFlowersOwned,
      teleopFlowerElementsCount: d.teleopFlowerElementsCount,
      endgameParked: d.endgameParked,
      minorFouls: d.minorFouls,
      majorFouls: d.majorFouls,
      robotDisabledOrBroken: d.robotDisabledOrBroken,
      driverSkillRating: d.driverSkillRating,
      defenseRating: d.defenseRating,
      notes: d.notes,
    });

  const activeScore = computeScore(activeDraft);

  const saveCurrentSlot = async (): Promise<boolean> => {
    const num = parseInt(activeDraft.teamNumber.trim(), 10);
    if (!matchNumber.trim()) {
      setFeedbackMsg('Informe o número da partida no topo.');
      return false;
    }
    if (isNaN(num) || num <= 0) {
      setFeedbackMsg('Informe o número da equipe antes de salvar.');
      return false;
    }

    setSaving(true);
    setFeedbackMsg(null);
    try {
      const entryId = activeDraft.id || `mscout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const entry: MatchScoutEntry = {
        id: entryId,
        teamNumber: num,
        matchNumber: matchNumber.trim(),
        allianceColor: activeDraft.allianceColor,
        autoLeftZone: activeDraft.autoLeftZone,
        autoPollenNectarScored: activeDraft.autoPollenNectarScored,
        autoHiveTips: activeDraft.autoHiveTips,
        autoParked: activeDraft.autoParked,
        teleopHiveTips: activeDraft.teleopHiveTips,
        teleopCellsRemaining: activeDraft.teleopCellsRemaining,
        teleopFlowersBottomNectar: activeDraft.teleopFlowersBottomNectar,
        teleopFlowersOwned: activeDraft.teleopFlowersOwned,
        teleopFlowerElementsCount: activeDraft.teleopFlowerElementsCount,
        endgameParked: activeDraft.endgameParked,
        minorFouls: activeDraft.minorFouls,
        majorFouls: activeDraft.majorFouls,
        robotDisabledOrBroken: activeDraft.robotDisabledOrBroken,
        driverSkillRating: activeDraft.driverSkillRating,
        defenseRating: activeDraft.defenseRating,
        calculatedContributionScore: activeScore,
        notes: activeDraft.notes.trim() || undefined,
        scoutedBy: '',
        timestamp: new Date().toISOString(),
      };

      await onSaveEntry(entry);
      setDrafts(prev => ({
        ...prev,
        [activeSlot]: {
          ...prev[activeSlot],
          id: entryId,
          dirty: false,
        },
      }));
      setFeedbackMsg(`Equipe #${num} salva na partida ${matchNumber.trim()}!`);
      return true;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    const ok = await saveCurrentSlot();
    if (!ok) return;
    const order: MatchSlotKey[] = ['red1', 'red2', 'blue1', 'blue2'];
    const nextIdx = (order.indexOf(activeSlot) + 1) % order.length;
    setActiveSlot(order[nextIdx]);
  };

  const handleSaveAndClose = async () => {
    const ok = await saveCurrentSlot();
    if (ok) onClose();
  };

  const toggleNoteChip = (chip: string) => {
    const current = activeDraft.notes.trim();
    if (current.includes(chip)) {
      const cleaned = current
        .split('•')
        .map(s => s.trim())
        .filter(s => s && s !== chip)
        .join(' • ');
      updateActiveDraft({ notes: cleaned });
    } else {
      updateActiveDraft({ notes: current ? `${current} • ${chip}` : chip });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0b111e] border border-white/15 rounded-2xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho Fixo */}
        <div className="p-4 border-b border-white/10 bg-[#0f172a] flex items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              Avaliação Rápida na Partida
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35 text-xs font-black">
                {activeScore} pts
              </span>
            </h3>
            <p className="text-[11px] text-text-secondary">
              Toque nos botões durante o jogo e alterne entre as 4 equipes sem fechar a tela.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white flex items-center justify-center shrink-0"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo Rolável */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Passo 1: Qual é a Partida + Seletor das 4 Equipes */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <label className="text-[10px] font-black text-text-muted uppercase block mb-1">
                  Partida *
                </label>
                <input
                  type="text"
                  value={matchNumber}
                  onChange={e => setMatchNumber(e.target.value)}
                  placeholder="Ex: Q-12 ou Qualif 12"
                  className="w-full min-h-[42px] bg-[#0f172a] border border-white/15 rounded-xl px-3 text-sm font-black text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {liveMatches.length > 0 && (
                <div className="sm:col-span-7">
                  <label className="text-[10px] font-black text-cyan-300 uppercase block mb-1">
                    Ou puxar do Cronograma Ao Vivo (preenche as 4 equipes)
                  </label>
                  <select
                    value=""
                    onChange={e => handleLoadLiveMatch(e.target.value)}
                    className="w-full min-h-[42px] bg-[#0f172a] border border-cyan-500/30 rounded-xl px-3 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="">Selecionar partida oficial...</option>
                    {liveMatches.map(lm => (
                      <option key={lm.id} value={String(lm.id)} className="bg-[#0f172a]">
                        {lm.description || `Qualif ${lm.matchNum}`} — Vermelha [{(lm.redTeams || []).join(', ')}] vs Azul [{(lm.blueTeams || []).join(', ')}]
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 4 Botões Rápidos de Troca de Equipe na Partida */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-text-muted uppercase">
                  Alternar equipe nesta partida (1 toque)
                </span>
                <span className="text-[10px] text-text-muted">
                  Rascunhos ficam guardados ao trocar
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SLOT_META.map(slot => {
                  const d = drafts[slot.key];
                  const isActive = activeSlot === slot.key;
                  const isRed = d.allianceColor === 'red';
                  const isSaved = Boolean(d.id) && !d.dirty;
                  const pts = computeScore(d);

                  return (
                    <button
                      key={slot.key}
                      type="button"
                      onClick={() => {
                        setActiveSlot(slot.key);
                        setFeedbackMsg(null);
                      }}
                      className={`min-h-[54px] rounded-xl px-2.5 py-2 border text-left transition-all flex flex-col justify-between ${
                        isActive
                          ? isRed
                            ? 'bg-red-600/30 border-amber-400 ring-2 ring-amber-400/50 text-white shadow-lg'
                            : 'bg-blue-600/30 border-amber-400 ring-2 ring-amber-400/50 text-white shadow-lg'
                          : isRed
                          ? 'bg-red-500/10 border-red-500/25 text-red-100 hover:bg-red-500/20'
                          : 'bg-blue-500/10 border-blue-500/25 text-blue-100 hover:bg-blue-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className={`text-[10px] font-black uppercase ${isRed ? 'text-red-300' : 'text-blue-300'}`}>
                          {slot.label}
                        </span>
                        {isSaved ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 font-black">
                            ✓ {pts}p
                          </span>
                        ) : d.dirty ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 font-black">
                            ● {pts}p
                          </span>
                        ) : null}
                      </div>
                      <div className="text-sm font-black truncate w-full mt-0.5">
                        {d.teamNumber ? `#${d.teamNumber}` : 'Escolher nº'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Barra de Troca Prática da Equipe Ativa (sem perder os cliques) */}
            <div className="bg-[#0f172a] border border-white/10 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[11px] font-black text-amber-300 shrink-0">
                  Avaliando agora:
                </span>
                <input
                  type="number"
                  value={activeDraft.teamNumber}
                  onChange={e => handleQuickChangeTeamNumber(e.target.value)}
                  placeholder="Nº Equipe"
                  className="w-28 min-h-[40px] bg-black/50 border border-white/20 rounded-xl px-3 text-sm font-black text-white focus:outline-none focus:border-amber-400"
                />
                {knownTeams.length > 0 && (
                  <select
                    value={activeDraft.teamNumber}
                    onChange={e => handleQuickChangeTeamNumber(e.target.value)}
                    className="flex-1 min-w-0 min-h-[40px] bg-black/50 border border-white/15 rounded-xl px-2.5 text-xs font-bold text-text-secondary"
                  >
                    <option value="">Trocar por equipe da lista...</option>
                    {knownTeams.map(t => (
                      <option key={t.teamNumber} value={String(t.teamNumber)} className="bg-[#0f172a] text-white">
                        #{t.teamNumber} — {t.teamName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => updateActiveDraft({ allianceColor: 'red' })}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-black border transition-all ${
                    activeDraft.allianceColor === 'red'
                      ? 'bg-red-600 text-white border-red-400'
                      : 'bg-white/5 text-text-muted border-white/10'
                  }`}
                >
                  Vermelha
                </button>
                <button
                  type="button"
                  onClick={() => updateActiveDraft({ allianceColor: 'blue' })}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-black border transition-all ${
                    activeDraft.allianceColor === 'blue'
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-white/5 text-text-muted border-white/10'
                  }`}
                >
                  Azul
                </button>
              </div>
            </div>

            {getTeamName(activeDraft.teamNumber) && (
              <div className="text-[11px] font-bold text-cyan-300 px-1">
                Equipe selecionada: #{activeDraft.teamNumber} — {getTeamName(activeDraft.teamNumber)}
              </div>
            )}
          </div>

          {/* Passo 2: Autônomo (30s) */}
          <div className="bg-cyan-500/5 border border-cyan-500/25 rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                1. Início Automático (Autônomo • 30s)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateActiveDraft({ autoLeftZone: !activeDraft.autoLeftZone })}
                className={`min-h-[48px] px-3.5 py-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                  activeDraft.autoLeftZone
                    ? 'bg-cyan-500/25 border-cyan-400 text-white'
                    : 'bg-black/35 border-white/10 text-text-secondary'
                }`}
              >
                <div>
                  <span className="text-xs font-black block">Saiu da Zona Inicial (Leave)</span>
                  <span className="text-[10px] opacity-80">+3 pontos</span>
                </div>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${activeDraft.autoLeftZone ? 'bg-cyan-400 text-black' : 'bg-white/10 text-text-muted'}`}>
                  {activeDraft.autoLeftZone ? <Check size={16} /> : '—'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => updateActiveDraft({ autoParked: !activeDraft.autoParked })}
                className={`min-h-[48px] px-3.5 py-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                  activeDraft.autoParked
                    ? 'bg-cyan-500/25 border-cyan-400 text-white'
                    : 'bg-black/35 border-white/10 text-text-secondary'
                }`}
              >
                <div>
                  <span className="text-xs font-black block">Estacionou no Autônomo (Park)</span>
                  <span className="text-[10px] opacity-80">+5 pontos</span>
                </div>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${activeDraft.autoParked ? 'bg-cyan-400 text-black' : 'bg-white/10 text-text-muted'}`}>
                  {activeDraft.autoParked ? <Check size={16} /> : '—'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <StepCounter
                label="Tombadas na Colmeia (Hive Tips)"
                hint="20 pts cada no Autônomo"
                value={activeDraft.autoHiveTips}
                max={6}
                accent="cyan"
                onChange={v => updateActiveDraft({ autoHiveTips: v })}
              />
              <StepCounter
                label="Bolas Lançadas no Autônomo"
                hint="Pollen ou Nectar acertados"
                value={activeDraft.autoPollenNectarScored}
                max={20}
                accent="cyan"
                onChange={v => updateActiveDraft({ autoPollenNectarScored: v })}
              />
            </div>
          </div>

          {/* Passo 3: TeleOperado & Final */}
          <div className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-3 space-y-2.5">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
              2. Durante a Partida (TeleOp • 2m) & Final
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <StepCounter
                label="Tombadas na Colmeia (Hive Tips)"
                hint="20 pts cada no TeleOp"
                value={activeDraft.teleopHiveTips}
                max={15}
                accent="amber"
                onChange={v => updateActiveDraft({ teleopHiveTips: v })}
              />
              <StepCounter
                label="Flores Dominadas (Flowers)"
                hint="Quantas flores terminou no topo (0–4)"
                value={activeDraft.teleopFlowersOwned}
                max={4}
                accent="emerald"
                onChange={v => updateActiveDraft({ teleopFlowersOwned: v })}
              />
              <StepCounter
                label="Bolas nas Flores Dominadas"
                hint="2 pts por bola na flor dominada"
                value={activeDraft.teleopFlowerElementsCount}
                max={25}
                accent="emerald"
                onChange={v => updateActiveDraft({ teleopFlowerElementsCount: v })}
              />
              <StepCounter
                label="Nectar na Base da Flor (Bottom)"
                hint="5 pts por flor com Nectar embaixo"
                value={activeDraft.teleopFlowersBottomNectar}
                max={4}
                accent="amber"
                onChange={v => updateActiveDraft({ teleopFlowersBottomNectar: v })}
              />
              <StepCounter
                label="Bolas que o Robô Acertou"
                hint="Acertos durante o TeleOp (+2 pts cada)"
                value={activeDraft.teleopCellsRemaining}
                max={40}
                accent="amber"
                onChange={v => updateActiveDraft({ teleopCellsRemaining: v })}
              />

              <button
                type="button"
                onClick={() => updateActiveDraft({ endgameParked: !activeDraft.endgameParked })}
                className={`min-h-[54px] px-3.5 py-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                  activeDraft.endgameParked
                    ? 'bg-amber-500/25 border-amber-400 text-white'
                    : 'bg-black/35 border-white/10 text-text-secondary'
                }`}
              >
                <div>
                  <span className="text-xs font-black block">Estacionou no Final (Endgame Park)</span>
                  <span className="text-[10px] opacity-80">+5 pontos no fim da partida</span>
                </div>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${activeDraft.endgameParked ? 'bg-amber-400 text-black' : 'bg-white/10 text-text-muted'}`}>
                  {activeDraft.endgameParked ? <Check size={16} /> : '—'}
                </span>
              </button>
            </div>
          </div>

          {/* Passo 4: Problemas, Faltas & Nota Rápida */}
          <div className="bg-black/35 border border-white/10 rounded-2xl p-3 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              3. Faltas, Problemas & Impressão Rápida
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateActiveDraft({ robotDisabledOrBroken: !activeDraft.robotDisabledOrBroken })}
                className={`min-h-[52px] px-3 py-2 rounded-xl border flex items-center justify-between transition-all ${
                  activeDraft.robotDisabledOrBroken
                    ? 'bg-red-600/30 border-red-400 text-red-200'
                    : 'bg-black/40 border-white/10 text-text-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className={activeDraft.robotDisabledOrBroken ? 'text-red-300' : 'text-text-muted'} />
                  <span className="text-xs font-black">Robô Quebrou / Parou</span>
                </div>
                <span className="text-xs font-black">{activeDraft.robotDisabledOrBroken ? 'SIM' : 'NÃO'}</span>
              </button>

              <StepCounter
                label="Faltas Leves (Minor)"
                hint="+5 pts p/ adversário"
                value={activeDraft.minorFouls}
                max={10}
                accent="red"
                onChange={v => updateActiveDraft({ minorFouls: v })}
              />
              <StepCounter
                label="Faltas Graves (Major)"
                hint="+20 pts p/ adversário"
                value={activeDraft.majorFouls}
                max={5}
                accent="red"
                onChange={v => updateActiveDraft({ majorFouls: v })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-bold text-text-muted block mb-1.5">
                  Habilidade do Piloto (Driver): <strong className="text-amber-300">{activeDraft.driverSkillRating}/5</strong>
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateActiveDraft({ driverSkillRating: n })}
                      className={`min-h-[42px] rounded-xl font-black text-sm border transition-all ${
                        activeDraft.driverSkillRating === n
                          ? 'bg-amber-500 text-black border-amber-300'
                          : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-text-muted block mb-1.5">
                  Eficiência na Defesa: <strong className="text-cyan-300">{activeDraft.defenseRating}/5</strong>
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateActiveDraft({ defenseRating: n })}
                      className={`min-h-[42px] rounded-xl font-black text-sm border transition-all ${
                        activeDraft.defenseRating === n
                          ? 'bg-cyan-500 text-black border-cyan-300'
                          : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_NOTE_CHIPS.map(chip => {
                  const selected = activeDraft.notes.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleNoteChip(chip)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                        selected
                          ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50'
                          : 'bg-white/5 text-text-secondary border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {chip}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={activeDraft.notes}
                onChange={e => updateActiveDraft({ notes: e.target.value })}
                placeholder="Observação rápida (opcional)..."
                className="w-full min-h-[40px] bg-black/50 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Rodapé Fixo com Ações Rápidas */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#0f172a] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="text-xs min-h-[20px]">
            {feedbackMsg ? (
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                {feedbackMsg}
              </span>
            ) : (
              <span className="text-text-muted">
                {activeDraft.teamNumber
                  ? `Salvando para Equipe #${activeDraft.teamNumber} (${activeDraft.allianceColor === 'red' ? 'Vermelha' : 'Azul'})`
                  : 'Escolha ou digite o número da equipe'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary"
            >
              Fechar
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={saveCurrentSlot}
              className="min-h-[42px] flex items-center gap-1.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase disabled:opacity-50"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Salvar Equipe</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAndNext}
              className="min-h-[42px] flex items-center gap-1.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase disabled:opacity-50"
            >
              <span>Salvar e Próxima</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAndClose}
              className="min-h-[42px] flex items-center gap-1.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>Salvar e Sair</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickMatchScoutModal;
