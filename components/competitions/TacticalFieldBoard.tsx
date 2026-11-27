import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Move, PenTool, Ruler, Undo2, Trash2, RotateCcw, Save, Download,
  FolderOpen, CheckCircle2, Plus, Sparkles, Eye, Maximize2, Minimize2,
  Info, Users, Calendar, Crosshair, RotateCw, ArrowUpRight, Flower2,
  Hand, Zap
} from 'lucide-react';
import type {
  BioBuzzBallType,
  FtcLiveMatch,
  FtcLiveTeamRanking,
  ScoutedTeamPit,
  TacticalBoardPlay,
  TacticalPath,
  TacticalToken,
} from '../../types';

interface TacticalFieldBoardProps {
  plays: TacticalBoardPlay[];
  currentUser: string;
  isTech: boolean;
  onSavePlay: (play: TacticalBoardPlay) => Promise<void>;
  onDeletePlay: (playId: string) => Promise<void>;
  scoutedTeams?: ScoutedTeamPit[];
  liveRankings?: FtcLiveTeamRanking[];
  liveMatches?: FtcLiveMatch[];
}

// Escala oficial BIOBUZZ™ (Seção 9): 144" × 144" (365,75 cm × 365,75 cm)
// SVG viewBox = 720 × 720 → 1 polegada = 5 px | 1 placa (24") = 120 px | 1% = 7.2 px
const FIELD_INCHES = 144;
const INCH_TO_CM = 2.54;
const SVG_SIZE = 720;
const PX_PER_INCH = SVG_SIZE / FIELD_INCHES; // 5 px/in
const MAX_CARGO_G407 = 4;

type FlowerId = 'FL-1' | 'FL-2' | 'FL-3' | 'FL-4';

interface FlowerMeta {
  id: FlowerId;
  name: string;
  wallLabel: string;
  xNorm: number; // 0..100
  yNorm: number; // 0..100
  ejectDx: number; // direção para dentro da arena ao ejetar bola
  ejectDy: number;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'middle' | 'end';
}

const FLOWERS_META: FlowerMeta[] = [
  {
    id: 'FL-1',
    name: 'FL-1 (Parede Red)',
    wallLabel: 'A2/A3',
    xNorm: 2.5,
    yNorm: 66.67,
    ejectDx: 7.5,
    ejectDy: 0,
    labelX: 44,
    labelY: 462,
    anchor: 'start',
  },
  {
    id: 'FL-2',
    name: 'FL-2 (Parede Scoring)',
    wallLabel: 'B6/C6',
    xNorm: 33.33,
    yNorm: 2.5,
    ejectDx: 0,
    ejectDy: 7.5,
    labelX: 240,
    labelY: 50,
    anchor: 'middle',
  },
  {
    id: 'FL-3',
    name: 'FL-3 (Parede Blue)',
    wallLabel: 'F4/F5',
    xNorm: 97.5,
    yNorm: 33.33,
    ejectDx: -7.5,
    ejectDy: 0,
    labelX: 676,
    labelY: 222,
    anchor: 'end',
  },
  {
    id: 'FL-4',
    name: 'FL-4 (Parede Audience)',
    wallLabel: 'D1/E1',
    xNorm: 66.67,
    yNorm: 97.5,
    ejectDx: 0,
    ejectDy: -7.5,
    labelX: 480,
    labelY: 678,
    anchor: 'middle',
  },
];

const DEFAULT_FLOWER_STACKS: Record<FlowerId, BioBuzzBallType[]> = {
  'FL-1': ['pollen', 'pollen', 'pollen', 'pollen'],
  'FL-2': ['pollen', 'pollen', 'pollen', 'pollen'],
  'FL-3': ['pollen', 'pollen', 'pollen', 'pollen'],
  'FL-4': ['pollen', 'pollen', 'pollen', 'pollen'],
};

const DEFAULT_TOKENS: TacticalToken[] = [
  // Robôs 18" × 18" alinhados às paredes das alianças com frente (heading) apontada para o centro
  { id: 'r1', kind: 'robot_red_1', label: 'R1', x: 7.5, y: 41.5, heading: 0, cargo: [] },
  { id: 'r2', kind: 'robot_red_2', label: 'R2', x: 7.5, y: 83.5, heading: 0, cargo: [] },
  { id: 'b1', kind: 'robot_blue_1', label: 'B1', x: 92.5, y: 16.5, heading: 180, cargo: [] },
  { id: 'b2', kind: 'robot_blue_2', label: 'B2', x: 92.5, y: 58.5, heading: 180, cargo: [] },
  // 4 Pollen iniciais alinhados dentro do Red Garden (Tile A1 - 23" × 2")
  { id: 'pg-r1', kind: 'pollen', label: 'P', x: 3.0, y: 98.0 },
  { id: 'pg-r2', kind: 'pollen', label: 'P', x: 6.2, y: 98.0 },
  { id: 'pg-r3', kind: 'pollen', label: 'P', x: 9.4, y: 98.0 },
  { id: 'pg-r4', kind: 'pollen', label: 'P', x: 12.6, y: 98.0 },
  // 4 Pollen iniciais alinhados dentro do Blue Garden (Tile F6 - 23" × 2")
  { id: 'pg-b1', kind: 'pollen', label: 'P', x: 87.4, y: 2.0 },
  { id: 'pg-b2', kind: 'pollen', label: 'P', x: 90.6, y: 2.0 },
  { id: 'pg-b3', kind: 'pollen', label: 'P', x: 93.8, y: 2.0 },
  { id: 'pg-b4', kind: 'pollen', label: 'P', x: 97.0, y: 2.0 },
  // 3 Nectar iniciais perfeitamente alinhados na célula ativa da Red Hive e 3 na Blue Hive
  { id: 'nr1', kind: 'nectar_red', label: 'N', x: 37.8, y: 59.5 },
  { id: 'nr2', kind: 'nectar_red', label: 'N', x: 41.4, y: 59.5 },
  { id: 'nr3', kind: 'nectar_red', label: 'N', x: 45.0, y: 59.5 },
  { id: 'nb1', kind: 'nectar_blue', label: 'N', x: 55.0, y: 40.5 },
  { id: 'nb2', kind: 'nectar_blue', label: 'N', x: 58.6, y: 40.5 },
  { id: 'nb3', kind: 'nectar_blue', label: 'N', x: 62.2, y: 40.5 },
];

const PHASE_COLORS: Record<'auto' | 'teleop' | 'endgame', { stroke: string; label: string; short: string; badgeClass: string }> = {
  auto: { stroke: '#06b6d4', label: 'Autônomo (30s)', short: 'Auto', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  teleop: { stroke: '#f59e0b', label: 'TeleOp (2m)', short: 'TeleOp', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  endgame: { stroke: '#f97316', label: 'Endgame (60s)', short: 'Endgame', badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
};

const BALL_STYLE: Record<BioBuzzBallType, { fill: string; text: string; short: string; label: string }> = {
  pollen: { fill: '#eab308', text: '#0f172a', short: 'P', label: 'Pollen' },
  nectar_red: { fill: '#ef4444', text: '#ffffff', short: 'N', label: 'Nectar Vermelho' },
  nectar_blue: { fill: '#3b82f6', text: '#ffffff', short: 'N', label: 'Nectar Azul' },
};

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];

function getTileName(normX: number, normY: number): string {
  const colIdx = Math.max(0, Math.min(5, Math.floor((normX / 100) * 6)));
  const rowFromTop = Math.max(0, Math.min(5, Math.floor((normY / 100) * 6)));
  return `${COLS[colIdx]}${6 - rowFromTop}`;
}

function getFlowerOwner(stack: BioBuzzBallType[]): 'red' | 'blue' | 'none' {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i] === 'nectar_red') return 'red';
    if (stack[i] === 'nectar_blue') return 'blue';
  }
  return 'none';
}

function getFlowerBottomBonus(stack: BioBuzzBallType[]): 'red' | 'blue' | 'none' {
  for (let i = 0; i < stack.length; i++) {
    if (stack[i] === 'nectar_red') return 'red';
    if (stack[i] === 'nectar_blue') return 'blue';
  }
  return 'none';
}

function cloneDefaultStacks(): Record<FlowerId, BioBuzzBallType[]> {
  return {
    'FL-1': [...DEFAULT_FLOWER_STACKS['FL-1']],
    'FL-2': [...DEFAULT_FLOWER_STACKS['FL-2']],
    'FL-3': [...DEFAULT_FLOWER_STACKS['FL-3']],
    'FL-4': [...DEFAULT_FLOWER_STACKS['FL-4']],
  };
}

export const TacticalFieldBoard: React.FC<TacticalFieldBoardProps> = ({
  plays,
  currentUser,
  isTech,
  onSavePlay,
  onDeletePlay,
  scoutedTeams = [],
  liveRankings = [],
  liveMatches = [],
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Refs síncronas (garantem desenho perfeito sem perder traço no tablet)
  const activePathRef = useRef<TacticalPath | null>(null);
  const draggingTokenRef = useRef<string | null>(null);
  const rulerRef = useRef<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const flowerCooldownRef = useRef<Record<string, number>>({});

  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(plays[0]?.id || null);
  const [title, setTitle] = useState(plays[0]?.title || 'Plano Tático Oficial - BIOBUZZ™');
  const [matchNumber, setMatchNumber] = useState(plays[0]?.matchNumber || '');
  const [allianceSide, setAllianceSide] = useState<'red' | 'blue'>(plays[0]?.allianceSide || 'red');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'auto' | 'teleop' | 'endgame'>('all');
  const [notes, setNotes] = useState(plays[0]?.notes || '');

  const [tool, setTool] = useState<'move' | 'draw' | 'pickup' | 'ruler'>('move');
  const [drawPhase, setDrawPhase] = useState<'auto' | 'teleop' | 'endgame'>('auto');
  const [unit, setUnit] = useState<'in' | 'cm'>('cm');
  const [showDimensions, setShowDimensions] = useState(false);
  const [showAprilTags, setShowAprilTags] = useState(true);
  const [tabletFullscreen, setTabletFullscreen] = useState(false);
  const [autoEjectOnPass, setAutoEjectOnPass] = useState(true);

  const [selectedRobotId, setSelectedRobotId] = useState<string>('r1');
  const [selectedFlowerId, setSelectedFlowerId] = useState<FlowerId>('FL-1');

  const [tokens, setTokens] = useState<TacticalToken[]>(() =>
    plays[0]?.tokens?.length
      ? plays[0].tokens.map(t => ({
          ...t,
          heading: t.heading ?? (t.kind.includes('blue') ? 180 : 0),
          cargo: t.cargo ? [...t.cargo] : [],
        }))
      : DEFAULT_TOKENS.map(t => ({ ...t, cargo: t.cargo ? [...t.cargo] : undefined }))
  );
  const [paths, setPaths] = useState<TacticalPath[]>(() => plays[0]?.paths || []);
  const [flowerStacks, setFlowerStacks] = useState<Record<FlowerId, BioBuzzBallType[]>>(() => {
    const saved = plays[0]?.flowerStacks;
    if (saved) {
      return {
        'FL-1': [...(saved['FL-1'] || DEFAULT_FLOWER_STACKS['FL-1'])],
        'FL-2': [...(saved['FL-2'] || DEFAULT_FLOWER_STACKS['FL-2'])],
        'FL-3': [...(saved['FL-3'] || DEFAULT_FLOWER_STACKS['FL-3'])],
        'FL-4': [...(saved['FL-4'] || DEFAULT_FLOWER_STACKS['FL-4'])],
      };
    }
    return cloneDefaultStacks();
  });

  const [activePathRender, setActivePathRender] = useState<TacticalPath | null>(null);
  const [rulerRender, setRulerRender] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg(prev => (prev === msg ? null : prev));
    }, 2400);
  }, []);

  const tournamentTeams = useMemo(() => {
    const map = new Map<number, { teamNumber: number; teamName: string }>();
    liveRankings.forEach(r => map.set(r.teamNumber, { teamNumber: r.teamNumber, teamName: r.teamName }));
    scoutedTeams.forEach(t => {
      if (!map.has(t.teamNumber)) {
        map.set(t.teamNumber, { teamNumber: t.teamNumber, teamName: t.teamName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.teamNumber - b.teamNumber);
  }, [liveRankings, scoutedTeams]);

  const robotTokens = useMemo(() => tokens.filter(t => t.kind.startsWith('robot_')), [tokens]);
  const selectedRobot = useMemo(
    () => robotTokens.find(r => r.id === selectedRobotId) || robotTokens[0],
    [robotTokens, selectedRobotId]
  );

  // Detecta Flower próxima ao robô selecionado (dentro de ~20" = 14% do campo)
  const nearbyFlower = useMemo(() => {
    if (!selectedRobot) return null;
    for (const fl of FLOWERS_META) {
      const dist = Math.hypot(selectedRobot.x - fl.xNorm, selectedRobot.y - fl.yNorm);
      if (dist <= 15.5) return fl;
    }
    return null;
  }, [selectedRobot]);

  const loadPlayIntoBoard = useCallback((play: TacticalBoardPlay) => {
    setSelectedPlayId(play.id);
    setTitle(play.title);
    setMatchNumber(play.matchNumber || '');
    setAllianceSide(play.allianceSide);
    setNotes(play.notes || '');
    setTokens(
      play.tokens?.length
        ? play.tokens.map(t => ({
            ...t,
            heading: t.heading ?? (t.kind.includes('blue') ? 180 : 0),
            cargo: t.cargo ? [...t.cargo] : [],
          }))
        : DEFAULT_TOKENS.map(t => ({ ...t, cargo: t.cargo ? [...t.cargo] : undefined }))
    );
    setPaths(play.paths ? play.paths.map(p => ({ ...p, points: [...p.points] })) : []);
    if (play.flowerStacks) {
      setFlowerStacks({
        'FL-1': [...(play.flowerStacks['FL-1'] || DEFAULT_FLOWER_STACKS['FL-1'])],
        'FL-2': [...(play.flowerStacks['FL-2'] || DEFAULT_FLOWER_STACKS['FL-2'])],
        'FL-3': [...(play.flowerStacks['FL-3'] || DEFAULT_FLOWER_STACKS['FL-3'])],
        'FL-4': [...(play.flowerStacks['FL-4'] || DEFAULT_FLOWER_STACKS['FL-4'])],
      });
    } else {
      setFlowerStacks(cloneDefaultStacks());
    }
  }, []);

  useEffect(() => {
    if (selectedPlayId) {
      const updated = plays.find(p => p.id === selectedPlayId);
      if (!updated && plays.length > 0) {
        loadPlayIntoBoard(plays[0]);
      }
    }
  }, [plays, selectedPlayId, loadPlayIntoBoard]);

  // ─── Ações de Bolas nos Robôs e nas Flowers ───────────────────────────────
  const handleAddBallToRobot = (ball: BioBuzzBallType) => {
    if (!selectedRobot) return;
    const cargo = selectedRobot.cargo || [];
    if (cargo.length >= MAX_CARGO_G407) {
      showToast(`Limite G407 atingido! ${selectedRobot.label} já carrega 4 bolas.`);
      return;
    }
    setTokens(prev =>
      prev.map(t => (t.id === selectedRobot.id ? { ...t, cargo: [...(t.cargo || []), ball] } : t))
    );
    showToast(`+1 ${BALL_STYLE[ball].label} adicionado em ${selectedRobot.label}`);
  };

  const handleRotateRobot = (deltaDeg: number) => {
    if (!selectedRobot) return;
    setTokens(prev =>
      prev.map(t =>
        t.id === selectedRobot.id ? { ...t, heading: (((t.heading ?? 0) + deltaDeg) % 360 + 360) % 360 } : t
      )
    );
  };

  // Lançar / soltar bola na frente do robô para posicionar
  const handleLaunchBallFromRobot = (specificIndex?: number) => {
    if (!selectedRobot) return;
    const cargo = selectedRobot.cargo || [];
    if (cargo.length === 0) {
      showToast(`${selectedRobot.label} não tem bolas para lançar.`);
      return;
    }
    const idx = specificIndex !== undefined ? specificIndex : cargo.length - 1;
    const ball = cargo[idx];
    const nextCargo = cargo.filter((_, i) => i !== idx);

    const rad = ((selectedRobot.heading ?? 0) * Math.PI) / 180;
    // ~14.5" na frente do centro do robô (10% do campo)
    const jitter = (Math.random() - 0.5) * 2.2;
    const spawnX = Math.max(3, Math.min(97, Number((selectedRobot.x + Math.cos(rad) * 10.5 + jitter).toFixed(2))));
    const spawnY = Math.max(3, Math.min(97, Number((selectedRobot.y + Math.sin(rad) * 10.5 + jitter).toFixed(2))));

    const newBallToken: TacticalToken = {
      id: `ball-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      kind: ball,
      label: BALL_STYLE[ball].short,
      x: spawnX,
      y: spawnY,
    };

    setTokens(prev => [
      ...prev.map(t => (t.id === selectedRobot.id ? { ...t, cargo: nextCargo } : t)),
      newBallToken,
    ]);
    showToast(`${selectedRobot.label} lançou 1 ${BALL_STYLE[ball].label} à frente!`);
  };

  // Pegar bola da arena e colocar no robô (por ID ou a bola solta mais próxima)
  const handlePickupArenaBall = useCallback((ballTokenId?: string) => {
    if (!selectedRobot) return;
    const cargo = selectedRobot.cargo || [];
    if (cargo.length >= MAX_CARGO_G407) {
      showToast(`${selectedRobot.label} cheio (4/4 — Regra G407).`);
      return;
    }

    const looseBalls = tokens.filter(
      t => t.kind === 'pollen' || t.kind === 'nectar_red' || t.kind === 'nectar_blue'
    );
    if (looseBalls.length === 0) {
      showToast('Nenhuma bola solta na arena para coletar.');
      return;
    }

    let target = ballTokenId ? looseBalls.find(b => b.id === ballTokenId) : undefined;
    if (!target) {
      // Encontra a bola mais próxima do robô selecionado
      target = looseBalls.reduce((best, cur) => {
        const dCur = Math.hypot(cur.x - selectedRobot.x, cur.y - selectedRobot.y);
        const dBest = Math.hypot(best.x - selectedRobot.x, best.y - selectedRobot.y);
        return dCur < dBest ? cur : best;
      });
    }

    if (!target) return;
    const ballType = target.kind as BioBuzzBallType;
    const targetId = target.id;

    setTokens(prev =>
      prev
        .filter(t => t.id !== targetId)
        .map(t => (t.id === selectedRobot.id ? { ...t, cargo: [...(t.cargo || []), ballType] } : t))
    );
    showToast(`${selectedRobot.label} coletou 1 ${BALL_STYLE[ballType].label} da arena!`);
  }, [selectedRobot, tokens, showToast]);

  // Depositar bola do robô no topo da Flower
  const handleDepositRobotBallToFlower = (flowerId: FlowerId) => {
    if (!selectedRobot) return;
    const cargo = selectedRobot.cargo || [];
    if (cargo.length === 0) {
      showToast(`${selectedRobot.label} está vazio — adicione ou colete uma bola primeiro.`);
      return;
    }
    const ball = cargo[cargo.length - 1];
    const nextCargo = cargo.slice(0, -1);

    setTokens(prev => prev.map(t => (t.id === selectedRobot.id ? { ...t, cargo: nextCargo } : t)));
    setFlowerStacks(prev => ({
      ...prev,
      [flowerId]: [...(prev[flowerId] || []), ball],
    }));
    showToast(`${selectedRobot.label} colocou ${BALL_STYLE[ball].label} na ${flowerId}!`);
  };

  // Colocar bola diretamente na Flower (manual)
  const handleAddBallDirectToFlower = (flowerId: FlowerId, ball: BioBuzzBallType) => {
    setFlowerStacks(prev => ({
      ...prev,
      [flowerId]: [...(prev[flowerId] || []), ball],
    }));
    showToast(`+1 ${BALL_STYLE[ball].label} posicionado na ${flowerId}`);
  };

  // Tirar bola da Flower (abertura inferior) -> a bola sai ao lado da Flower na arena!
  const handleEjectBallFromFlower = useCallback((flowerId: FlowerId, fromEnd: 'bottom' | 'top' = 'bottom') => {
    const fl = FLOWERS_META.find(f => f.id === flowerId);
    if (!fl) return;

    setFlowerStacks(prev => {
      const stack = prev[flowerId] || [];
      if (stack.length === 0) {
        showToast(`${flowerId} já está vazia.`);
        return prev;
      }
      const ball = fromEnd === 'bottom' ? stack[0] : stack[stack.length - 1];
      const nextStack = fromEnd === 'bottom' ? stack.slice(1) : stack.slice(0, -1);

      // Posiciona a bola ejetada logo ao lado da Flower (com leve deslocamento para não empilhar uma sobre a outra)
      const offsetSpread = (stack.length - 2.5) * 2.2;
      const sideX = fl.ejectDx !== 0 ? fl.xNorm + fl.ejectDx : fl.xNorm + offsetSpread;
      const sideY = fl.ejectDy !== 0 ? fl.yNorm + fl.ejectDy : fl.yNorm + offsetSpread;

      const ejectedToken: TacticalToken = {
        id: `ejected-${flowerId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        kind: ball,
        label: BALL_STYLE[ball].short,
        x: Math.max(4, Math.min(96, Number(sideX.toFixed(2)))),
        y: Math.max(4, Math.min(96, Number(sideY.toFixed(2)))),
      };

      setTokens(curr => [...curr, ejectedToken]);
      showToast(`1 ${BALL_STYLE[ball].label} saiu ao lado da ${flowerId}!`);

      return { ...prev, [flowerId]: nextStack };
    });
  }, [showToast]);

  // Renomear robô ou carregar partida oficial
  const handleRenameRobot = (robotId: string, newLabel: string) => {
    setTokens(prev => prev.map(t => (t.id === robotId ? { ...t, label: newLabel } : t)));
  };

  const handleSelectOfficialMatch = (matchIdStr: string) => {
    if (!matchIdStr) return;
    const match = liveMatches.find(m => String(m.id) === matchIdStr);
    if (!match) return;

    const r1Label = match.redTeams[0] ? `#${match.redTeams[0]}` : 'R1';
    const r2Label = match.redTeams[1] ? `#${match.redTeams[1]}` : 'R2';
    const b1Label = match.blueTeams[0] ? `#${match.blueTeams[0]}` : 'B1';
    const b2Label = match.blueTeams[1] ? `#${match.blueTeams[1]}` : 'B2';

    setTokens(prev =>
      prev.map(t => {
        if (t.kind === 'robot_red_1') return { ...t, label: r1Label };
        if (t.kind === 'robot_red_2') return { ...t, label: r2Label };
        if (t.kind === 'robot_blue_1') return { ...t, label: b1Label };
        if (t.kind === 'robot_blue_2') return { ...t, label: b2Label };
        return t;
      })
    );

    setMatchNumber(match.description);
    setTitle(`Estratégia ${match.description} (${r1Label}/${r2Label} vs ${b1Label}/${b2Label})`);
    if (match.blueTeams.includes(21083)) setAllianceSide('blue');
    else if (match.redTeams.includes(21083)) setAllianceSide('red');
    showToast(`Robôs preenchidos para ${match.description}!`);
  };

  // ─── Pointer Events (SVG Touch-Perfect) ───────────────────────────────────
  const getNormalizedCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 50, y: 50 };
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgPt = pt.matrixTransform(ctm.inverse());
      return {
        x: Number(Math.max(0.5, Math.min(99.5, (svgPt.x / SVG_SIZE) * 100)).toFixed(2)),
        y: Number(Math.max(0.5, Math.min(99.5, (svgPt.y / SVG_SIZE) * 100)).toFixed(2)),
      };
    }
    const rect = svg.getBoundingClientRect();
    return {
      x: Number(Math.max(0.5, Math.min(99.5, ((clientX - rect.left) / rect.width) * 100)).toFixed(2)),
      y: Number(Math.max(0.5, Math.min(99.5, ((clientY - rect.top) / rect.height) * 100)).toFixed(2)),
    };
  }, []);

  const commitActivePath = useCallback((finalPt?: { x: number; y: number }) => {
    const current = activePathRef.current;
    if (!current) return;
    const pts = [...current.points];
    if (finalPt) {
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(finalPt.x - last.x, finalPt.y - last.y) >= 0.25) {
        pts.push(finalPt);
      }
    }
    activePathRef.current = null;
    setActivePathRender(null);
    if (pts.length >= 2) {
      setPaths(prev => [...prev, { ...current, points: pts }]);
    }
  }, []);

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;

    if (tool === 'draw') {
      e.preventDefault();
      activePointerIdRef.current = e.pointerId;
      try { svgRef.current?.setPointerCapture(e.pointerId); } catch {}
      if (phaseFilter !== 'all' && phaseFilter !== drawPhase) setPhaseFilter('all');

      const pt = getNormalizedCoords(e.clientX, e.clientY);
      const newPath: TacticalPath = {
        id: `path-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        color: PHASE_COLORS[drawPhase].stroke,
        width: 1.35,
        phase: drawPhase,
        points: [pt],
      };
      activePathRef.current = newPath;
      setActivePathRender(newPath);
    } else if (tool === 'ruler') {
      e.preventDefault();
      activePointerIdRef.current = e.pointerId;
      try { svgRef.current?.setPointerCapture(e.pointerId); } catch {}
      const pt = getNormalizedCoords(e.clientX, e.clientY);
      const line = { start: pt, end: pt };
      rulerRef.current = line;
      setRulerRender(line);
    }
  };

  const handleTokenPointerDown = (e: React.PointerEvent<SVGGElement>, tok: TacticalToken) => {
    const isRobot = tok.kind.startsWith('robot_');

    // No modo "Coletar Toque": tocar numa bola coloca no robô selecionado; tocar num robô seleciona ele
    if (tool === 'pickup') {
      e.stopPropagation();
      e.preventDefault();
      if (isRobot) {
        setSelectedRobotId(tok.id);
        showToast(`Robô ${tok.label} selecionado`);
      } else {
        handlePickupArenaBall(tok.id);
      }
      return;
    }

    if (tool !== 'move') return;
    e.stopPropagation();
    e.preventDefault();
    if (isRobot) setSelectedRobotId(tok.id);

    activePointerIdRef.current = e.pointerId;
    try { svgRef.current?.setPointerCapture(e.pointerId); } catch {}
    draggingTokenRef.current = tok.id;
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = getNormalizedCoords(e.clientX, e.clientY);
    setHoverPos(pt);

    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;

    if (draggingTokenRef.current) {
      e.preventDefault();
      const targetId = draggingTokenRef.current;
      const isRobotDragged = targetId === 'r1' || targetId === 'r2' || targetId === 'b1' || targetId === 'b2';

      setTokens(prev => prev.map(t => (t.id === targetId ? { ...t, x: pt.x, y: pt.y } : t)));

      // Auto-Ejetar bola da Flower quando o robô passa encostado na Flower (com cooldown de 900ms por Flower)
      if (isRobotDragged && autoEjectOnPass) {
        const now = Date.now();
        for (const fl of FLOWERS_META) {
          const dist = Math.hypot(pt.x - fl.xNorm, pt.y - fl.yNorm);
          const lastPop = flowerCooldownRef.current[fl.id] || 0;
          if (dist <= 11.5 && now - lastPop > 900) {
            flowerCooldownRef.current[fl.id] = now;
            setSelectedFlowerId(fl.id);
            handleEjectBallFromFlower(fl.id, 'bottom');
            break;
          }
        }
      }
      return;
    }

    if (rulerRef.current && tool === 'ruler' && activePointerIdRef.current === e.pointerId) {
      e.preventDefault();
      const updated = { ...rulerRef.current, end: pt };
      rulerRef.current = updated;
      setRulerRender(updated);
      return;
    }

    if (activePathRef.current) {
      e.preventDefault();
      const last = activePathRef.current.points[activePathRef.current.points.length - 1];
      if (Math.hypot(pt.x - last.x, pt.y - last.y) >= 0.45) {
        const updated: TacticalPath = {
          ...activePathRef.current,
          points: [...activePathRef.current.points, pt],
        };
        activePathRef.current = updated;
        setActivePathRender(updated);
      }
    }
  };

  const handleSvgPointerEnd = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;
    try {
      if (svgRef.current?.hasPointerCapture(e.pointerId)) {
        svgRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const endPt = getNormalizedCoords(e.clientX, e.clientY);
    activePointerIdRef.current = null;
    draggingTokenRef.current = null;
    if (activePathRef.current) commitActivePath(endPt);
  };

  const handleUndoPath = () => setPaths(prev => prev.slice(0, -1));
  const handleClearPaths = () => {
    setPaths([]);
    activePathRef.current = null;
    setActivePathRender(null);
    rulerRef.current = null;
    setRulerRender(null);
  };

  const handleResetArena = () => {
    const currentLabels = new Map(tokens.map(t => [t.id, t.label]));
    setTokens(
      DEFAULT_TOKENS.map(t => ({
        ...t,
        label: currentLabels.get(t.id) || t.label,
        cargo: t.cargo ? [] : undefined,
      }))
    );
    setFlowerStacks(cloneDefaultStacks());
    showToast('Arena, bolas e Flowers resetadas para o início da partida!');
  };

  const handleNewPlay = () => {
    setSelectedPlayId(null);
    setTitle(`Estratégia BIOBUZZ ${plays.length + 1}`);
    setMatchNumber('');
    setNotes('');
    setTokens(DEFAULT_TOKENS.map(t => ({ ...t, cargo: t.cargo ? [] : undefined })));
    setFlowerStacks(cloneDefaultStacks());
    setPaths([]);
    rulerRef.current = null;
    setRulerRender(null);
  };

  const handleSaveCurrentPlay = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const id = selectedPlayId || `play-${Date.now()}`;
      const payload: TacticalBoardPlay = {
        id,
        title: title.trim(),
        matchNumber: matchNumber.trim() || undefined,
        allianceSide,
        phaseFilter,
        tokens,
        paths,
        flowerStacks,
        notes,
        updatedBy: currentUser,
        updatedAt: new Date().toISOString(),
      };
      await onSavePlay(payload);
      setSelectedPlayId(id);
      showToast('Jogada salva!');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1440;
      canvas.height = 1440;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'arena-biobuzz'}.png`;
        link.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const visiblePaths = [
    ...paths.filter(p => phaseFilter === 'all' || p.phase === phaseFilter),
    ...(activePathRender ? [activePathRender] : []),
  ];

  const toPx = (norm: number) => norm * (SVG_SIZE / 100);
  const toPolylinePoints = (pts: Array<{ x: number; y: number }>) =>
    pts.map(p => `${toPx(p.x)},${toPx(p.y)}`).join(' ');
  const fmtLen = (inches: number) =>
    unit === 'in' ? `${inches.toFixed(1)}"` : `${(inches * INCH_TO_CM).toFixed(1)} cm`;

  const rulerMetrics = rulerRender
    ? (() => {
        const dxIn = ((rulerRender.end.x - rulerRender.start.x) / 100) * FIELD_INCHES;
        const dyIn = ((rulerRender.end.y - rulerRender.start.y) / 100) * FIELD_INCHES;
        const distIn = Math.hypot(dxIn, dyIn);
        return {
          distIn,
          distCm: distIn * INCH_TO_CM,
          tiles: distIn / 24,
          midX: toPx((rulerRender.start.x + rulerRender.end.x) / 2),
          midY: toPx((rulerRender.start.y + rulerRender.end.y) / 2),
        };
      })()
    : null;

  const hiveW = 49.46 * PX_PER_INCH;
  const hiveH = 38.95 * PX_PER_INCH;
  const hiveX = SVG_SIZE / 2 - hiveW / 2;
  const hiveY = SVG_SIZE / 2 - hiveH / 2;
  const loadAlongWall = 23 * PX_PER_INCH;
  const loadDepth = 11 * PX_PER_INCH;
  const gardenLen = 23 * PX_PER_INCH;
  const gardenWidth = 2 * PX_PER_INCH;
  const robotPx = 18 * PX_PER_INCH;

  const activeFlowerStack = flowerStacks[selectedFlowerId] || [];
  const activeFlowerOwner = getFlowerOwner(activeFlowerStack);
  const activeFlowerBottom = getFlowerBottomBonus(activeFlowerStack);

  const containerClass = tabletFullscreen
    ? 'fixed inset-0 z-50 bg-[#070b14] p-3 sm:p-4 overflow-y-auto overscroll-none space-y-3'
    : 'space-y-4';

  return (
    <div className={containerClass}>
      {/* Barra Superior */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-primary/50 border border-white/10 rounded-xl p-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <FolderOpen size={16} className="text-amber-400 shrink-0" />
          <select
            value={selectedPlayId || '__new__'}
            onChange={e => {
              const found = plays.find(p => p.id === e.target.value);
              if (found) loadPlayIntoBoard(found);
            }}
            className="min-h-[40px] bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
          >
            {!selectedPlayId && <option value="__new__">-- Nova Jogada (Não salva) --</option>}
            {plays.map(p => (
              <option key={p.id} value={p.id} className="bg-primary text-white">
                {p.title} {p.matchNumber ? `(Match ${p.matchNumber})` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handleNewPlay}
            className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-white border border-white/10"
          >
            <Plus size={15} />
            <span>Nova</span>
          </button>

          {isTech && selectedPlayId && (
            <button
              onClick={() => onDeletePlay(selectedPlayId)}
              className="min-h-[40px] flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/20"
            >
              <Trash2 size={14} />
              <span>Excluir</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {toastMsg && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/35">
              <CheckCircle2 size={14} />
              {toastMsg}
            </span>
          )}
          <button
            onClick={() => setTabletFullscreen(v => !v)}
            className={`min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              tabletFullscreen
                ? 'bg-cyan-500 text-black border-cyan-400'
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/35'
            }`}
          >
            {tabletFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{tabletFullscreen ? 'Sair Tela Cheia' : 'Modo Tablet'}</span>
          </button>
          <button
            onClick={handleExportPng}
            className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10"
          >
            <Download size={14} />
            <span>PNG</span>
          </button>
          <button
            onClick={handleSaveCurrentPlay}
            disabled={saving}
            className="min-h-[40px] flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider disabled:opacity-60"
          >
            <Save size={14} />
            <span>{saving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </div>

      {/* Área Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Coluna Arena */}
        <div className="lg:col-span-8 bg-[#0b101b] border border-white/10 rounded-2xl p-3 sm:p-4 space-y-3">
          {/* Toolbar Touch-Friendly */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setTool('move')}
                className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  tool === 'move' ? 'bg-blue-600 text-white shadow-glow-primary' : 'bg-white/5 text-text-secondary hover:text-white'
                }`}
              >
                <Move size={15} />
                <span>Arrastar</span>
              </button>

              <button
                onClick={() => setTool('draw')}
                className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  tool === 'draw' ? 'bg-amber-500 text-black shadow-lg' : 'bg-white/5 text-text-secondary hover:text-white'
                }`}
              >
                <PenTool size={15} />
                <span>Desenhar Rota</span>
              </button>

              <button
                onClick={() => setTool('pickup')}
                className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  tool === 'pickup' ? 'bg-emerald-500 text-black shadow-lg' : 'bg-white/5 text-text-secondary hover:text-white'
                }`}
                title="Toque em qualquer bola na arena para coletá-la no robô selecionado"
              >
                <Hand size={15} />
                <span>Coletar Bola</span>
              </button>

              <button
                onClick={() => setTool('ruler')}
                className={`min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  tool === 'ruler' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-text-secondary hover:text-white'
                }`}
              >
                <Ruler size={15} />
                <span>Régua</span>
              </button>
            </div>

            {tool === 'draw' && (
              <div className="flex items-center gap-1.5">
                {(['auto', 'teleop', 'endgame'] as const).map(ph => (
                  <button
                    key={ph}
                    onClick={() => {
                      setDrawPhase(ph);
                      if (phaseFilter !== 'all' && phaseFilter !== ph) setPhaseFilter('all');
                    }}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      drawPhase === ph ? PHASE_COLORS[ph].badgeClass : 'bg-white/5 text-text-muted border-white/10 hover:text-white'
                    }`}
                  >
                    {PHASE_COLORS[ph].short}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setShowDimensions(v => !v)}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold border ${
                  showDimensions ? 'bg-amber-500/15 text-amber-300 border-amber-500/35' : 'bg-white/5 text-text-muted border-white/10'
                }`}
              >
                Cotas
              </button>
              <button
                onClick={() => setShowAprilTags(v => !v)}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold border ${
                  showAprilTags ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35' : 'bg-white/5 text-text-muted border-white/10'
                }`}
              >
                Tags
              </button>
              <button
                onClick={() => setUnit(u => (u === 'cm' ? 'in' : 'cm'))}
                className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-white/5 text-xs font-black text-cyan-300 border border-cyan-500/25"
              >
                {unit === 'cm' ? 'CM' : 'POL'}
              </button>
              <button
                onClick={handleUndoPath}
                disabled={paths.length === 0}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white disabled:opacity-40"
                title="Desfazer traço"
              >
                <Undo2 size={16} />
              </button>
              <button
                onClick={handleClearPaths}
                disabled={paths.length === 0 && !rulerRender}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 text-text-secondary hover:text-red-400 disabled:opacity-40"
                title="Limpar rotas"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={handleResetArena}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-amber-300"
                title="Arrumar arena (resetar bolas, Flowers e robôs)"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Barra Rápida de Controle do Robô Selecionado (Bolas, Lançar, Coletar, Girar) */}
          {selectedRobot && (
            <div className="bg-black/45 border border-amber-500/25 rounded-xl p-2.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Seletor rápido de robô */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase text-text-muted">Robô Ativo:</span>
                  {robotTokens.map(rt => {
                    const isRed = rt.kind.includes('red');
                    const isActive = rt.id === selectedRobot.id;
                    const count = rt.cargo?.length || 0;
                    return (
                      <button
                        key={rt.id}
                        onClick={() => setSelectedRobotId(rt.id)}
                        className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-black border transition-all flex items-center gap-1.5 ${
                          isActive
                            ? isRed
                              ? 'bg-red-600 text-white border-amber-300 shadow'
                              : 'bg-blue-600 text-white border-amber-300 shadow'
                            : 'bg-white/5 text-text-secondary border-white/10 hover:text-white'
                        }`}
                      >
                        <span>{rt.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-amber-300">{count}/4</span>
                      </button>
                    );
                  })}
                </div>

                {/* Girar frente do robô + Auto-Ejetar Flower */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleRotateRobot(-45)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10"
                    title="Girar frente do robô 45° anti-horário"
                  >
                    ↺ 45°
                  </button>
                  <button
                    onClick={() => handleRotateRobot(45)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 flex items-center gap-1"
                    title="Girar frente do robô 45° horário"
                  >
                    <RotateCw size={12} /> 45°
                  </button>
                  <button
                    onClick={() => setAutoEjectOnPass(v => !v)}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 ${
                      autoEjectOnPass
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-white/5 text-text-muted border-white/10'
                    }`}
                    title="Quando ligado, passar um robô encostado em uma Flower solta uma bola ao lado dela automaticamente"
                  >
                    <Zap size={12} />
                    <span>Auto-Tirar Flor: {autoEjectOnPass ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Ações de Bolas do Robô */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
                <button
                  onClick={() => handleAddBallToRobot('pollen')}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 border border-yellow-500/35 text-xs font-bold"
                >
                  + Pollen
                </button>
                <button
                  onClick={() => handleAddBallToRobot('nectar_red')}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/35 text-xs font-bold"
                >
                  + Nectar V
                </button>
                <button
                  onClick={() => handleAddBallToRobot('nectar_blue')}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/35 text-xs font-bold"
                >
                  + Nectar A
                </button>

                <span className="w-px h-5 bg-white/15 mx-0.5 hidden sm:inline-block" />

                <button
                  onClick={() => handleLaunchBallFromRobot()}
                  disabled={(selectedRobot.cargo?.length || 0) === 0}
                  className="min-h-[36px] flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs disabled:opacity-40"
                  title="Solta a bola na frente da direção do robô para você posicionar na arena"
                >
                  <ArrowUpRight size={14} />
                  <span>Lançar na Frente</span>
                </button>

                <button
                  onClick={() => handlePickupArenaBall()}
                  disabled={(selectedRobot.cargo?.length || 0) >= MAX_CARGO_G407}
                  className="min-h-[36px] flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-40"
                  title="Pega a bola solta mais próxima do robô na arena e coloca dentro dele"
                >
                  <Crosshair size={13} />
                  <span>Pegar Bola Próxima</span>
                </button>

                {/* Ação contextual imediata quando o robô está perto de uma Flower! */}
                {nearbyFlower && (
                  <div className="flex items-center gap-1.5 ml-auto bg-emerald-500/15 border border-emerald-400/40 rounded-lg px-2 py-1">
                    <Flower2 size={13} className="text-emerald-300" />
                    <span className="text-[11px] font-black text-emerald-200">{nearbyFlower.id}:</span>
                    <button
                      onClick={() => handleDepositRobotBallToFlower(nearbyFlower.id)}
                      disabled={(selectedRobot.cargo?.length || 0) === 0}
                      className="px-2 py-0.5 rounded bg-emerald-500 text-black font-black text-[11px] disabled:opacity-40"
                    >
                      Colocar
                    </button>
                    <button
                      onClick={() => handleEjectBallFromFlower(nearbyFlower.id, 'bottom')}
                      disabled={(flowerStacks[nearbyFlower.id]?.length || 0) === 0}
                      className="px-2 py-0.5 rounded bg-orange-500 text-black font-black text-[11px] disabled:opacity-40"
                    >
                      Tirar p/ Lado
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campo SVG Organizado e Limpo */}
          <div className={tabletFullscreen ? 'max-w-[780px] mx-auto' : 'max-w-[660px] mx-auto'}>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted px-2 pb-1">
              <span className="text-red-400">◀ Vermelha (A–C)</span>
              <span className="text-white/70">▲ Lado da Mesa (Scoring • Linha 6) ▲</span>
              <span className="text-blue-400">Azul (D–F) ▶</span>
            </div>

            <div
              className="w-full aspect-square rounded-xl overflow-hidden border-2 border-white/20 bg-[#0f1624] shadow-2xl select-none overscroll-none"
              style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
              onContextMenu={e => e.preventDefault()}
            >
              <svg
                ref={svgRef}
                viewBox="0 0 720 720"
                style={{ touchAction: 'none' }}
                className={`w-full h-full touch-none ${
                  tool === 'draw' || tool === 'ruler' ? 'cursor-crosshair' : tool === 'pickup' ? 'cursor-pointer' : 'cursor-grab'
                }`}
                onPointerDown={handleSvgPointerDown}
                onPointerMove={handleSvgPointerMove}
                onPointerUp={handleSvgPointerEnd}
                onPointerCancel={handleSvgPointerEnd}
                onPointerLeave={() => setHoverPos(null)}
              >
                <defs>
                  <marker id="arrow-auto" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
                  </marker>
                  <marker id="arrow-teleop" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                  </marker>
                  <marker id="arrow-endgame" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f97316" />
                  </marker>
                </defs>

                {/* 36 Placas EVA 6×6 */}
                {[0, 1, 2, 3, 4, 5].map(rowIdx =>
                  [0, 1, 2, 3, 4, 5].map(colIdx => {
                    const rowNum = 6 - rowIdx;
                    const tileId = `${COLS[colIdx]}${rowNum}`;
                    const isRedSide = colIdx < 3;
                    return (
                      <g key={tileId}>
                        <rect
                          x={colIdx * 120}
                          y={rowIdx * 120}
                          width="120"
                          height="120"
                          fill={(rowIdx + colIdx) % 2 === 0 ? '#182132' : '#141c2b'}
                          stroke={isRedSide ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)'}
                          strokeWidth="1"
                        />
                        <text
                          x={colIdx * 120 + 7}
                          y={rowIdx * 120 + 16}
                          fill="rgba(148, 163, 184, 0.28)"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {tileId}
                        </text>
                      </g>
                    );
                  })
                )}

                {/* Linha Central */}
                <line x1="360" y1="0" x2="360" y2="720" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" strokeDasharray="8 6" />

                {/* Red Loading Zone / Park (A5: 23" × 11") */}
                <g>
                  <rect x="0" y={122.5} width={loadDepth} height={loadAlongWall} fill="rgba(239, 68, 68, 0.18)" stroke="#ef4444" strokeWidth="2.2" />
                  <text x="27" y="175" textAnchor="middle" fill="#fecaca" fontSize="8.5" fontWeight="900">VERM.</text>
                  <text x="27" y="187" textAnchor="middle" fill="#fca5a5" fontSize="7.5" fontWeight="bold">ESTAC.</text>
                </g>

                {/* Blue Loading Zone / Park (F2: 23" × 11") */}
                <g>
                  <rect x={SVG_SIZE - loadDepth} y={482.5} width={loadDepth} height={loadAlongWall} fill="rgba(59, 130, 246, 0.18)" stroke="#3b82f6" strokeWidth="2.2" />
                  <text x={SVG_SIZE - 27} y="535" textAnchor="middle" fill="#bfdbfe" fontSize="8.5" fontWeight="900">AZUL</text>
                  <text x={SVG_SIZE - 27} y="547" textAnchor="middle" fill="#93c5fd" fontSize="7.5" fontWeight="bold">ESTAC.</text>
                </g>

                {/* Red Garden (A1: 23" × 2") & Blue Garden (F6: 23" × 2") */}
                <g>
                  <rect x="2.5" y={SVG_SIZE - gardenWidth - 4} width={gardenLen} height={gardenWidth + 4} rx="3" fill="rgba(239, 68, 68, 0.30)" stroke="#ef4444" strokeWidth="1.8" />
                  <text x="60" y={SVG_SIZE - 22} textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold">JARDIM VERM.</text>
                </g>
                <g>
                  <rect x={SVG_SIZE - gardenLen - 2.5} y="0" width={gardenLen} height={gardenWidth + 4} rx="3" fill="rgba(59, 130, 246, 0.30)" stroke="#3b82f6" strokeWidth="1.8" />
                  <text x={SVG_SIZE - 60} y="28" textAnchor="middle" fill="#93c5fd" fontSize="8" fontWeight="bold">JARDIM AZUL</text>
                </g>

                {/* 4 Flowers no Perímetro (Clicáveis — mostram pilha real de bolas + cor do Ownership!) */}
                {FLOWERS_META.map(fl => {
                  const fx = toPx(fl.xNorm);
                  const fy = toPx(fl.yNorm);
                  const stack = flowerStacks[fl.id] || [];
                  const owner = getFlowerOwner(stack);
                  const isSelectedFl = selectedFlowerId === fl.id;
                  const ringColor = owner === 'red' ? '#ef4444' : owner === 'blue' ? '#3b82f6' : '#10b981';

                  return (
                    <g
                      key={fl.id}
                      onPointerDown={e => {
                        e.stopPropagation();
                        setSelectedFlowerId(fl.id);
                      }}
                      className="cursor-pointer"
                    >
                      <circle cx={fx} cy={fy} r="28" fill="transparent" />
                      <circle
                        cx={fx}
                        cy={fy}
                        r="22"
                        fill={owner === 'red' ? 'rgba(239, 68, 68, 0.25)' : owner === 'blue' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.22)'}
                        stroke={isSelectedFl ? '#fbbf24' : ringColor}
                        strokeWidth={isSelectedFl ? 3.5 : 2.5}
                      />
                      <circle cx={fx} cy={fy} r="11" fill="#0f172a" stroke={ringColor} strokeWidth="1.5" />
                      <text x={fx} y={fy + 3.5} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
                        {stack.length}
                      </text>

                      {/* Mini pontos representando as bolas dentro da Flower (Base → Topo) */}
                      <g transform={`translate(${fl.labelX}, ${fl.labelY})`}>
                        <text textAnchor={fl.anchor} fill={isSelectedFl ? '#fcd34d' : '#6ee7b7'} fontSize="9.5" fontWeight="900">
                          {fl.id}
                        </text>
                        {stack.slice(-6).map((b, bIdx) => {
                          const startOffset = fl.anchor === 'start' ? 0 : fl.anchor === 'end' ? -(stack.slice(-6).length * 9) + 4 : -((stack.slice(-6).length - 1) * 4.5);
                          return (
                            <circle
                              key={bIdx}
                              cx={startOffset + bIdx * 9}
                              cy={10}
                              r="3.8"
                              fill={BALL_STYLE[b].fill}
                              stroke="#0f172a"
                              strokeWidth="1"
                            />
                          );
                        })}
                      </g>
                    </g>
                  );
                })}

                {/* Hive Central Organizada (Placas C3–D4 • 49.46" × 38.95") */}
                <g>
                  <rect x={hiveX} y={hiveY} width={hiveW} height={hiveH} rx="10" fill="rgba(12, 18, 32, 0.92)" stroke="#f59e0b" strokeWidth="2.5" />

                  {/* 4 Células (2 Red Esq, 2 Blue Dir) */}
                  <rect x={hiveX + 8} y={hiveY + 10} width={hiveW / 2 - 14} height={hiveH / 2 - 14} rx="6" fill="rgba(239, 68, 68, 0.16)" stroke="#ef4444" strokeWidth="1.8" />
                  <rect x={hiveX + 8} y={SVG_SIZE / 2 + 4} width={hiveW / 2 - 14} height={hiveH / 2 - 14} rx="6" fill="rgba(239, 68, 68, 0.24)" stroke="#ef4444" strokeWidth="2" />
                  <rect x={SVG_SIZE / 2 + 6} y={hiveY + 10} width={hiveW / 2 - 14} height={hiveH / 2 - 14} rx="6" fill="rgba(59, 130, 246, 0.24)" stroke="#3b82f6" strokeWidth="2" />
                  <rect x={SVG_SIZE / 2 + 6} y={SVG_SIZE / 2 + 4} width={hiveW / 2 - 14} height={hiveH / 2 - 14} rx="6" fill="rgba(59, 130, 246, 0.16)" stroke="#3b82f6" strokeWidth="1.8" />

                  {/* Pivô Central */}
                  <line x1={SVG_SIZE / 2} y1={hiveY + 4} x2={SVG_SIZE / 2} y2={hiveY + hiveH - 4} stroke="#f59e0b" strokeWidth="2.8" />
                  <circle cx={SVG_SIZE / 2} cy={SVG_SIZE / 2} r="5.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />

                  {/* Rótulos Limpos no Topo de cada Célula (sem sobrepor as esferas Nectar) */}
                  <text x={hiveX + 62} y={hiveY + 28} textAnchor="middle" fill="#fecaca" fontSize="8.5" fontWeight="900">RED SCORING</text>
                  {showAprilTags && <text x={hiveX + 62} y={hiveY + 41} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="8" fontWeight="bold">Tags 0–3</text>}

                  <text x={hiveX + 62} y={SVG_SIZE / 2 + 20} textAnchor="middle" fill="#fecaca" fontSize="8.5" fontWeight="900">RED AUDIENCE</text>
                  {showAprilTags && <text x={hiveX + 62} y={SVG_SIZE / 2 + 32} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="8" fontWeight="bold">Tags 4–7</text>}

                  <text x={SVG_SIZE / 2 + 62} y={hiveY + 24} textAnchor="middle" fill="#bfdbfe" fontSize="8.5" fontWeight="900">BLUE SCORING</text>
                  {showAprilTags && <text x={SVG_SIZE / 2 + 62} y={hiveY + 36} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="8" fontWeight="bold">Tags 42–45</text>}

                  <text x={SVG_SIZE / 2 + 62} y={SVG_SIZE / 2 + 28} textAnchor="middle" fill="#bfdbfe" fontSize="8.5" fontWeight="900">BLUE AUDIENCE</text>
                  {showAprilTags && <text x={SVG_SIZE / 2 + 62} y={SVG_SIZE / 2 + 41} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="8" fontWeight="bold">Tags 38–41</text>}

                  {showDimensions && (
                    <g>
                      <line x1={hiveX} y1={hiveY - 12} x2={hiveX + hiveW} y2={hiveY - 12} stroke="#f59e0b" strokeWidth="1.2" />
                      <rect x={SVG_SIZE / 2 - 58} y={hiveY - 22} width="116" height="16" rx="4" fill="#0f172a" />
                      <text x={SVG_SIZE / 2} y={hiveY - 11} textAnchor="middle" fill="#fcd34d" fontSize="9.5" fontWeight="bold">
                        HIVE: {fmtLen(49.46)} × {fmtLen(38.95)}
                      </text>
                    </g>
                  )}
                </g>

                {/* Rotas Táticas */}
                {visiblePaths.map(p => (
                  <polyline
                    key={p.id}
                    fill="none"
                    stroke={p.color}
                    strokeWidth={p.width * 4.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.95}
                    points={toPolylinePoints(p.points)}
                    markerEnd={`url(#arrow-${p.phase})`}
                  />
                ))}

                {/* Régua CAD */}
                {rulerRender && rulerMetrics && (
                  <g>
                    <line
                      x1={toPx(rulerRender.start.x)}
                      y1={toPx(rulerRender.start.y)}
                      x2={toPx(rulerRender.end.x)}
                      y2={toPx(rulerRender.end.y)}
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />
                    <circle cx={toPx(rulerRender.start.x)} cy={toPx(rulerRender.start.y)} r="6" fill="#10b981" />
                    <circle cx={toPx(rulerRender.end.x)} cy={toPx(rulerRender.end.y)} r="6" fill="#10b981" />
                    <rect x={rulerMetrics.midX - 80} y={rulerMetrics.midY - 26} width="160" height="22" rx="6" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
                    <text x={rulerMetrics.midX} y={rulerMetrics.midY - 12} textAnchor="middle" fill="#ecfdf5" fontSize="10.5" fontWeight="900">
                      {rulerMetrics.distIn.toFixed(1)}" • {rulerMetrics.distCm.toFixed(0)} cm ({rulerMetrics.tiles.toFixed(2)} pl.)
                    </text>
                  </g>
                )}

                {/* Bolas Soltas na Arena (renderizadas primeiro para não ficarem presas atrás dos rótulos) */}
                {tokens
                  .filter(t => !t.kind.startsWith('robot_'))
                  .map(tok => {
                    const cx = toPx(tok.x);
                    const cy = toPx(tok.y);
                    const isPollen = tok.kind === 'pollen';
                    const radius = isPollen ? 8.5 : 10.5;
                    const style = BALL_STYLE[(tok.kind as BioBuzzBallType) || 'pollen'] || BALL_STYLE.pollen;

                    return (
                      <g
                        key={tok.id}
                        transform={`translate(${cx}, ${cy})`}
                        onPointerDown={e => handleTokenPointerDown(e, tok)}
                        className={tool === 'move' ? 'cursor-grab active:cursor-grabbing' : tool === 'pickup' ? 'cursor-pointer' : 'pointer-events-none'}
                      >
                        <circle r="19" fill="transparent" />
                        <circle r={radius} fill={style.fill} stroke="#0f172a" strokeWidth="1.8" />
                        <text y="3.2" textAnchor="middle" fill={style.text} fontSize="8" fontWeight="900">{tok.label}</text>
                      </g>
                    );
                  })}

                {/* Robôs (Escala 18"×18" com Seta de Frente + Bolas Carregadas no Chassi) */}
                {robotTokens.map(tok => {
                  const cx = toPx(tok.x);
                  const cy = toPx(tok.y);
                  const isRed = tok.kind.includes('red');
                  const isSelected = tok.id === selectedRobot?.id;
                  const half = robotPx / 2;
                  const heading = tok.heading ?? (isRed ? 0 : 180);
                  const cargo = tok.cargo || [];
                  const displayLabel = tok.label || 'R';
                  const fontSize = displayLabel.length > 5 ? 11 : displayLabel.length > 3 ? 12.5 : 14.5;

                  return (
                    <g
                      key={tok.id}
                      transform={`translate(${cx}, ${cy})`}
                      onPointerDown={e => handleTokenPointerDown(e, tok)}
                      className={tool === 'move' ? 'cursor-grab active:cursor-grabbing' : tool === 'pickup' ? 'cursor-pointer' : 'pointer-events-none'}
                    >
                      {/* Caixa 18" × 18" + Seta indicadora da frente do robô */}
                      <g transform={`rotate(${heading})`}>
                        <rect
                          x={-half}
                          y={-half}
                          width={robotPx}
                          height={robotPx}
                          rx="10"
                          fill={isRed ? 'rgba(220, 38, 38, 0.28)' : 'rgba(37, 99, 235, 0.28)'}
                          stroke={isSelected ? '#fbbf24' : isRed ? '#ef4444' : '#3b82f6'}
                          strokeWidth={isSelected ? 3.5 : 2.2}
                          strokeDasharray={isSelected ? undefined : '5 3'}
                        />
                        {/* Triângulo frontal mostrando para onde o robô vai lançar a bola */}
                        <polygon points={`${half + 10},0 ${half - 4},-8 ${half - 4},8`} fill="#fbbf24" stroke="#0f172a" strokeWidth="1.5" />
                      </g>

                      {/* Placa de identificação sempre reta para fácil leitura */}
                      <rect
                        x="-33"
                        y="-22"
                        width="66"
                        height="30"
                        rx="7"
                        fill={isRed ? '#dc2626' : '#2563eb'}
                        stroke="#ffffff"
                        strokeWidth="1.8"
                      />
                      <text y="-3" textAnchor="middle" fill="#ffffff" fontSize={fontSize} fontWeight="900">
                        {displayLabel.slice(0, 8)}
                      </text>

                      {/* Bolas carregadas dentro do robô (até 4 — G407) */}
                      <g transform="translate(0, 22)">
                        {cargo.map((ball, bIdx) => {
                          const offset = (bIdx - (cargo.length - 1) / 2) * 15;
                          return (
                            <circle
                              key={bIdx}
                              cx={offset}
                              cy={0}
                              r="6.2"
                              fill={BALL_STYLE[ball].fill}
                              stroke="#0f172a"
                              strokeWidth="1.6"
                            />
                          );
                        })}
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[10px] font-bold px-2 pt-1.5 gap-2">
              <span className="text-white/70 uppercase tracking-widest">▼ Lado da Plateia (Audience • Linha 1) ▼</span>
              {hoverPos ? (
                <span className="text-emerald-300 font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-500/25">
                  Placa {getTileName(hoverPos.x, hoverPos.y)} • X: {fmtLen((hoverPos.x / 100) * FIELD_INCHES)} | Y: {fmtLen(((100 - hoverPos.y) / 100) * FIELD_INCHES)}
                </span>
              ) : (
                <span className="text-text-muted">Toque em um robô ou Flower para gerenciar bolas</span>
              )}
            </div>
          </div>
        </div>

        {/* Painel Direito: Controle de Flowers, Robôs/Partida e Briefing */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Controle de Flowers (Posicionar & Tirar Bola) */}
          <div className="bg-primary/40 border border-emerald-500/25 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flower2 size={15} />
                Controle de Flores (Endgame)
              </h4>
              <span className="text-[10px] font-bold text-text-muted">{activeFlowerStack.length} bolas</span>
            </div>

            {/* Seletor das 4 Flowers */}
            <div className="grid grid-cols-4 gap-1.5">
              {FLOWERS_META.map(fl => {
                const st = flowerStacks[fl.id] || [];
                const own = getFlowerOwner(st);
                const active = selectedFlowerId === fl.id;
                return (
                  <button
                    key={fl.id}
                    onClick={() => setSelectedFlowerId(fl.id)}
                    className={`min-h-[38px] rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center ${
                      active
                        ? 'bg-emerald-500 text-black border-amber-300'
                        : own === 'red'
                        ? 'bg-red-500/15 text-red-200 border-red-500/30'
                        : own === 'blue'
                        ? 'bg-blue-500/15 text-blue-200 border-blue-500/30'
                        : 'bg-white/5 text-text-secondary border-white/10'
                    }`}
                  >
                    <span>{fl.id}</span>
                    <span className="text-[9px] opacity-80">{st.length}b</span>
                  </button>
                );
              })}
            </div>

            {/* Pilha atual da Flower selecionada */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted font-bold">Pilha Base → Topo:</span>
                <span className="font-black">
                  {activeFlowerOwner === 'red' ? (
                    <span className="text-red-400">Dono: Vermelha ({activeFlowerStack.length * 2} pts)</span>
                  ) : activeFlowerOwner === 'blue' ? (
                    <span className="text-blue-400">Dono: Azul ({activeFlowerStack.length * 2} pts)</span>
                  ) : (
                    <span className="text-text-muted">Sem Domínio (Ownership)</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap min-h-[26px]">
                {activeFlowerStack.length === 0 ? (
                  <span className="text-[11px] text-text-muted italic">Flower vazia</span>
                ) : (
                  activeFlowerStack.map((b, idx) => (
                    <span
                      key={idx}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border border-black/60 shadow"
                      style={{ backgroundColor: BALL_STYLE[b].fill, color: BALL_STYLE[b].text }}
                      title={idx === 0 ? `Base: ${BALL_STYLE[b].label}` : idx === activeFlowerStack.length - 1 ? `Topo: ${BALL_STYLE[b].label}` : BALL_STYLE[b].label}
                    >
                      {BALL_STYLE[b].short}
                    </span>
                  ))
                )}
              </div>

              {activeFlowerBottom !== 'none' && (
                <p className="text-[10px] text-amber-300 font-semibold">
                  Nectar na Base (Bottom Nectar • +5 pts): Aliança {activeFlowerBottom === 'red' ? 'Vermelha' : 'Azul'}
                </p>
              )}
            </div>

            {/* Botões de Ação na Flower */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleDepositRobotBallToFlower(selectedFlowerId)}
                  disabled={!selectedRobot || (selectedRobot.cargo?.length || 0) === 0}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs disabled:opacity-40"
                >
                  Do Robô → {selectedFlowerId}
                </button>
                <button
                  onClick={() => handleEjectBallFromFlower(selectedFlowerId, 'bottom')}
                  disabled={activeFlowerStack.length === 0}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs disabled:opacity-40"
                  title="Retira a bola de baixo da Flower e solta ao lado dela na arena"
                >
                  Tirar Bola p/ Lado
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  onClick={() => handleAddBallDirectToFlower(selectedFlowerId, 'pollen')}
                  className="min-h-[34px] rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-200 border border-yellow-500/30 font-bold"
                >
                  + Pollen
                </button>
                <button
                  onClick={() => handleAddBallDirectToFlower(selectedFlowerId, 'nectar_red')}
                  className="min-h-[34px] rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/30 font-bold"
                >
                  + Nectar V
                </button>
                <button
                  onClick={() => handleAddBallDirectToFlower(selectedFlowerId, 'nectar_blue')}
                  className="min-h-[34px] rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-200 border border-blue-500/30 font-bold"
                >
                  + Nectar A
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Partida Oficial & Renomear Robôs */}
          <div className="bg-primary/40 border border-amber-500/25 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={15} />
              Robôs em Campo & Partida Oficial
            </h4>

            {liveMatches.length > 0 && (
              <div className="bg-black/40 border border-cyan-500/25 rounded-xl p-2.5 space-y-1.5">
                <label className="text-[10px] font-black text-cyan-300 uppercase flex items-center gap-1">
                  <Calendar size={12} />
                  Carregar Partida (Renomeia Tudo Automático)
                </label>
                <select
                  defaultValue=""
                  onChange={e => handleSelectOfficialMatch(e.target.value)}
                  className="w-full min-h-[38px] bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white"
                >
                  <option value="">-- Selecionar partida oficial --</option>
                  {liveMatches.map(m => (
                    <option key={m.id} value={m.id} className="bg-primary text-white">
                      {m.description}: Vermelha [{m.redTeams.join(',')}] vs Azul [{m.blueTeams.join(',')}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              {robotTokens.map(rt => {
                const isRed = rt.kind.includes('red');
                const slotName =
                  rt.kind === 'robot_red_1' ? 'Verm. 1' :
                  rt.kind === 'robot_red_2' ? 'Verm. 2' :
                  rt.kind === 'robot_blue_1' ? 'Azul 1' : 'Azul 2';
                return (
                  <div
                    key={rt.id}
                    className={`p-2 rounded-xl border flex items-center gap-2 ${
                      isRed ? 'bg-red-500/10 border-red-500/25' : 'bg-blue-500/10 border-blue-500/25'
                    }`}
                  >
                    <span className={`text-[10px] font-black uppercase w-10 shrink-0 ${isRed ? 'text-red-300' : 'text-blue-300'}`}>
                      {slotName}
                    </span>
                    <input
                      type="text"
                      maxLength={8}
                      value={rt.label}
                      onChange={e => handleRenameRobot(rt.id, e.target.value)}
                      className="w-20 min-h-[34px] bg-black/50 border border-white/15 rounded-lg px-2 py-1 text-xs font-black text-white"
                    />
                    {tournamentTeams.length > 0 && (
                      <select
                        value=""
                        onChange={e => {
                          if (e.target.value) handleRenameRobot(rt.id, `#${e.target.value}`);
                        }}
                        className="flex-1 min-w-0 min-h-[34px] bg-black/50 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-bold text-text-secondary"
                      >
                        <option value="">Equipe...</option>
                        {tournamentTeams.map(tm => (
                          <option key={tm.teamNumber} value={tm.teamNumber} className="bg-primary text-white">
                            #{tm.teamNumber} {tm.teamName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Briefing */}
          <div className="bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              Briefing da Jogada
            </h4>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nome da estratégia"
              className="w-full min-h-[38px] bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
            />
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anotações da estratégia..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white resize-none"
            />
          </div>

          {!tabletFullscreen && (
            <div className="bg-primary/40 border border-cyan-500/20 rounded-2xl p-3.5 space-y-1 text-[11px] text-text-secondary">
              <h5 className="font-black text-cyan-300 uppercase flex items-center gap-1">
                <Info size={13} /> Medidas Oficiais Seção 9
              </h5>
              <p>• Campo: 144"×144" (365,75 cm) | Placas: 24"</p>
              <p>• Hive (C3–D4): 49,46"×38,95" | Pivô: 43,95"</p>
              <p>• 4 Flowers: 4 Pollen iniciais | Gardens A1/F6: 4 Pollen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TacticalFieldBoard;
