import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Move, PenTool, Ruler, Undo2, Trash2, RotateCcw, Save, Download,
  FolderOpen, CheckCircle2, Plus, Sparkles, Eye, Maximize2, Info
} from 'lucide-react';
import type { TacticalBoardPlay, TacticalPath, TacticalToken } from '../../types';

interface TacticalFieldBoardProps {
  plays: TacticalBoardPlay[];
  currentUser: string;
  isTech: boolean;
  onSavePlay: (play: TacticalBoardPlay) => Promise<void>;
  onDeletePlay: (playId: string) => Promise<void>;
}

// Escala oficial BIOBUZZ™ (Seção 9): 144" × 144" (365,75 cm × 365,75 cm)
// SVG viewBox = 720 × 720 → 1 polegada = 5 px | 1 placa (24") = 120 px | 1% = 7.2 px
const FIELD_INCHES = 144;
const INCH_TO_CM = 2.54;
const SVG_SIZE = 720;
const PX_PER_INCH = SVG_SIZE / FIELD_INCHES; // 5 px/in

// Posições iniciais oficiais (coordenadas normalizadas 0..100%)
// Colunas A-F (esq -> dir), Linhas 1-6 (Plateia embaixo -> Scoring em cima)
const DEFAULT_TOKENS: TacticalToken[] = [
  // Robôs 18" × 18" alinhados às paredes das alianças
  { id: 'r1', kind: 'robot_red_1', label: 'R1', x: 7.5, y: 42 },
  { id: 'r2', kind: 'robot_red_2', label: 'R2', x: 7.5, y: 74 },
  { id: 'b1', kind: 'robot_blue_1', label: 'B1', x: 92.5, y: 26 },
  { id: 'b2', kind: 'robot_blue_2', label: 'B2', x: 92.5, y: 58 },
  // 4 Pollen iniciais no Red Garden (Tile A1 - borda Audience)
  { id: 'pg-r1', kind: 'pollen', label: 'P', x: 3.5, y: 97.5 },
  { id: 'pg-r2', kind: 'pollen', label: 'P', x: 6.5, y: 97.5 },
  { id: 'pg-r3', kind: 'pollen', label: 'P', x: 9.5, y: 97.5 },
  { id: 'pg-r4', kind: 'pollen', label: 'P', x: 12.5, y: 97.5 },
  // 4 Pollen iniciais no Blue Garden (Tile F6 - borda Scoring)
  { id: 'pg-b1', kind: 'pollen', label: 'P', x: 87.5, y: 2.5 },
  { id: 'pg-b2', kind: 'pollen', label: 'P', x: 90.5, y: 2.5 },
  { id: 'pg-b3', kind: 'pollen', label: 'P', x: 93.5, y: 2.5 },
  { id: 'pg-b4', kind: 'pollen', label: 'P', x: 96.5, y: 2.5 },
  // Nectar iniciais na Hive Central (3 Red / 3 Blue)
  { id: 'nr1', kind: 'nectar_red', label: 'N', x: 42, y: 46 },
  { id: 'nr2', kind: 'nectar_red', label: 'N', x: 42, y: 50 },
  { id: 'nr3', kind: 'nectar_red', label: 'N', x: 42, y: 54 },
  { id: 'nb1', kind: 'nectar_blue', label: 'N', x: 58, y: 46 },
  { id: 'nb2', kind: 'nectar_blue', label: 'N', x: 58, y: 50 },
  { id: 'nb3', kind: 'nectar_blue', label: 'N', x: 58, y: 54 },
];

const PHASE_COLORS: Record<'auto' | 'teleop' | 'endgame', { stroke: string; label: string; badgeClass: string }> = {
  auto: { stroke: '#06b6d4', label: 'Autônomo (30s)', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  teleop: { stroke: '#f59e0b', label: 'TeleOp (2m)', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  endgame: { stroke: '#f97316', label: 'Endgame (60s)', badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
};

const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];

function getTileName(normX: number, normY: number): string {
  const colIdx = Math.max(0, Math.min(5, Math.floor((normX / 100) * 6)));
  const rowFromTop = Math.max(0, Math.min(5, Math.floor((normY / 100) * 6)));
  const rowNum = 6 - rowFromTop; // Row 6 = Scoring (top), Row 1 = Audience (bottom)
  return `${COLS[colIdx]}${rowNum}`;
}

export const TacticalFieldBoard: React.FC<TacticalFieldBoardProps> = ({
  plays,
  currentUser,
  isTech,
  onSavePlay,
  onDeletePlay,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(plays[0]?.id || null);
  const [title, setTitle] = useState(plays[0]?.title || 'Plano Tático Oficial - BIOBUZZ™');
  const [matchNumber, setMatchNumber] = useState(plays[0]?.matchNumber || '');
  const [allianceSide, setAllianceSide] = useState<'red' | 'blue'>(plays[0]?.allianceSide || 'red');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'auto' | 'teleop' | 'endgame'>('all');
  const [notes, setNotes] = useState(plays[0]?.notes || '');

  const [tool, setTool] = useState<'move' | 'draw' | 'ruler'>('move');
  const [drawPhase, setDrawPhase] = useState<'auto' | 'teleop' | 'endgame'>('auto');
  const [unit, setUnit] = useState<'in' | 'cm'>('cm');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showAprilTags, setShowAprilTags] = useState(true);

  const [tokens, setTokens] = useState<TacticalToken[]>(() =>
    plays[0]?.tokens?.length ? plays[0].tokens : DEFAULT_TOKENS.map(t => ({ ...t }))
  );
  const [paths, setPaths] = useState<TacticalPath[]>(() => plays[0]?.paths || []);

  // Interaction states
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<TacticalPath | null>(null);
  const [rulerLine, setRulerLine] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const loadPlayIntoBoard = useCallback((play: TacticalBoardPlay) => {
    setSelectedPlayId(play.id);
    setTitle(play.title);
    setMatchNumber(play.matchNumber || '');
    setAllianceSide(play.allianceSide);
    setNotes(play.notes || '');
    setTokens(play.tokens?.length ? play.tokens.map(t => ({ ...t })) : DEFAULT_TOKENS.map(t => ({ ...t })));
    setPaths(play.paths ? play.paths.map(p => ({ ...p, points: [...p.points] })) : []);
  }, []);

  useEffect(() => {
    if (selectedPlayId) {
      const updated = plays.find(p => p.id === selectedPlayId);
      if (!updated && plays.length > 0) {
        loadPlayIntoBoard(plays[0]);
      }
    }
  }, [plays, selectedPlayId, loadPlayIntoBoard]);

  // Normalized 0..100% field coordinates
  const getNormalizedCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 50, y: 50 };
    const rect = svg.getBoundingClientRect();
    const x = Math.max(0.5, Math.min(99.5, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0.5, Math.min(99.5, ((clientY - rect.top) / rect.height) * 100));
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  }, []);

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (tool === 'draw') {
      e.preventDefault();
      svgRef.current?.setPointerCapture(e.pointerId);
      const pt = getNormalizedCoords(e.clientX, e.clientY);
      setActivePath({
        id: `path-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        color: PHASE_COLORS[drawPhase].stroke,
        width: 1.3,
        phase: drawPhase,
        points: [pt],
      });
    } else if (tool === 'ruler') {
      e.preventDefault();
      svgRef.current?.setPointerCapture(e.pointerId);
      const pt = getNormalizedCoords(e.clientX, e.clientY);
      setRulerLine({ start: pt, end: pt });
      setIsMeasuring(true);
    }
  };

  const handleTokenPointerDown = (e: React.PointerEvent<SVGGElement>, tokenId: string) => {
    if (tool !== 'move') return;
    e.stopPropagation();
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    setDraggingTokenId(tokenId);
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = getNormalizedCoords(e.clientX, e.clientY);
    setHoverPos(pt);

    if (draggingTokenId) {
      setTokens(prev => prev.map(t => (t.id === draggingTokenId ? { ...t, x: pt.x, y: pt.y } : t)));
      return;
    }

    if (isMeasuring && rulerLine) {
      setRulerLine(prev => (prev ? { ...prev, end: pt } : null));
      return;
    }

    if (activePath) {
      setActivePath(prev => {
        if (!prev) return null;
        const last = prev.points[prev.points.length - 1];
        const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
        if (dist < 0.65) return prev;
        return { ...prev, points: [...prev.points, pt] };
      });
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (svgRef.current?.hasPointerCapture(e.pointerId)) {
      svgRef.current.releasePointerCapture(e.pointerId);
    }
    if (draggingTokenId) setDraggingTokenId(null);
    if (isMeasuring) setIsMeasuring(false);
    if (activePath) {
      if (activePath.points.length >= 2) {
        setPaths(prev => [...prev, activePath]);
      }
      setActivePath(null);
    }
  };

  const handleUndoPath = () => setPaths(prev => prev.slice(0, -1));
  const handleClearPaths = () => {
    setPaths([]);
    setRulerLine(null);
  };
  const handleResetTokens = () => setTokens(DEFAULT_TOKENS.map(t => ({ ...t })));

  const handleNewPlay = () => {
    setSelectedPlayId(null);
    setTitle(`Estratégia BIOBUZZ ${plays.length + 1}`);
    setMatchNumber('');
    setNotes('');
    setTokens(DEFAULT_TOKENS.map(t => ({ ...t })));
    setPaths([]);
    setRulerLine(null);
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
        notes,
        updatedBy: currentUser,
        updatedAt: new Date().toISOString(),
      };
      await onSavePlay(payload);
      setSelectedPlayId(id);
      setSaveToast('Jogada salva!');
      setTimeout(() => setSaveToast(null), 2500);
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
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'arena-biobuzz'}.png`;
        link.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const visiblePaths = [
    ...paths.filter(p => phaseFilter === 'all' || p.phase === phaseFilter),
    ...(activePath ? [activePath] : []),
  ];

  const toPx = (norm: number) => norm * (SVG_SIZE / 100);
  const toPolylinePoints = (pts: Array<{ x: number; y: number }>) =>
    pts.map(p => `${toPx(p.x)},${toPx(p.y)}`).join(' ');

  const fmtLen = (inches: number) =>
    unit === 'in' ? `${inches.toFixed(1)}"` : `${(inches * INCH_TO_CM).toFixed(1)} cm`;

  // Ruler distance calculation
  const rulerMetrics = rulerLine
    ? (() => {
        const dxIn = ((rulerLine.end.x - rulerLine.start.x) / 100) * FIELD_INCHES;
        const dyIn = ((rulerLine.end.y - rulerLine.start.y) / 100) * FIELD_INCHES;
        const distIn = Math.hypot(dxIn, dyIn);
        return {
          distIn,
          distCm: distIn * INCH_TO_CM,
          tiles: distIn / 24,
          midX: toPx((rulerLine.start.x + rulerLine.end.x) / 2),
          midY: toPx((rulerLine.start.y + rulerLine.end.y) / 2),
        };
      })()
    : null;

  // Dimensões exatas da Hive Central em px (49.46" × 38.95" @ 5 px/in)
  const hiveW = 49.46 * PX_PER_INCH; // 247.3 px
  const hiveH = 38.95 * PX_PER_INCH; // 194.75 px
  const hiveX = SVG_SIZE / 2 - hiveW / 2; // 236.35
  const hiveY = SVG_SIZE / 2 - hiveH / 2; // 262.625

  // Dimensões exatas Loading Zones (23" × 11" @ 5 px/in → 115 px × 55 px)
  const loadAlongWall = 23 * PX_PER_INCH; // 115 px
  const loadDepth = 11 * PX_PER_INCH; // 55 px

  // Dimensões exatas Gardens (23" × 2" @ 5 px/in → 115 px × 10 px)
  const gardenLen = 23 * PX_PER_INCH; // 115 px
  const gardenWidth = 2 * PX_PER_INCH; // 10 px

  // Robô FTC 18" × 18" @ 5 px/in → 90 px × 90 px
  const robotPx = 18 * PX_PER_INCH; // 90 px

  return (
    <div className="space-y-4">
      {/* Barra Superior de Jogadas Salvas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-primary/40 border border-white/10 rounded-xl p-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <FolderOpen size={16} className="text-amber-400 shrink-0" />
          <select
            value={selectedPlayId || '__new__'}
            onChange={e => {
              const found = plays.find(p => p.id === e.target.value);
              if (found) loadPlayIntoBoard(found);
            }}
            className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-white border border-white/10 transition-all"
          >
            <Plus size={14} />
            <span>Nova</span>
          </button>

          {isTech && selectedPlayId && (
            <button
              onClick={() => onDeletePlay(selectedPlayId)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/20 transition-all"
            >
              <Trash2 size={14} />
              <span>Excluir</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {saveToast && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              <CheckCircle2 size={13} />
              {saveToast}
            </span>
          )}
          <button
            onClick={handleExportPng}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 transition-all"
          >
            <Download size={14} />
            <span>Exportar PNG</span>
          </button>
          <button
            onClick={handleSaveCurrentPlay}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-60"
          >
            <Save size={14} />
            <span>{saving ? 'Salvando...' : 'Salvar Jogada'}</span>
          </button>
        </div>
      </div>

      {/* Área Principal: Arena CAD 1:1 + Painel Lateral */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Arena SVG BIOBUZZ (144" × 144" = 365,75 cm × 365,75 cm) */}
        <div className="xl:col-span-8 bg-[#0b101b] border border-white/10 rounded-2xl p-3 sm:p-4 space-y-3">
          {/* Toolbar de Ferramentas */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setTool('move')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tool === 'move' ? 'bg-blue-600 text-white shadow-glow-primary' : 'bg-white/5 text-text-secondary hover:text-white'
                }`}
              >
                <Move size={14} />
                <span>Arrastar</span>
              </button>

              <button
                onClick={() => setTool('draw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tool === 'draw' ? 'bg-amber-500 text-black' : 'bg-white/5 text-text-secondary hover:text-white'
                }`}
              >
                <PenTool size={14} />
                <span>Desenhar Rota</span>
              </button>

              <button
                onClick={() => setTool('ruler')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tool === 'ruler' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-text-secondary hover:text-white'
                }`}
                title="Arraste no campo para medir distâncias reais (in / cm / tiles)"
              >
                <Ruler size={14} />
                <span>Régua CAD</span>
              </button>
            </div>

            {tool === 'draw' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['auto', 'teleop', 'endgame'] as const).map(ph => (
                  <button
                    key={ph}
                    onClick={() => setDrawPhase(ph)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      drawPhase === ph ? PHASE_COLORS[ph].badgeClass : 'bg-white/5 text-text-muted border-white/10 hover:text-white'
                    }`}
                  >
                    {PHASE_COLORS[ph].label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setUnit(u => (u === 'cm' ? 'in' : 'cm'))}
                className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-black text-cyan-300 border border-cyan-500/25 transition-all"
                title="Alternar Polegadas (in) / Centímetros (cm)"
              >
                {unit === 'cm' ? 'CM' : 'POL (in)'}
              </button>
              <button
                onClick={() => setShowDimensions(v => !v)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                  showDimensions ? 'bg-amber-500/15 text-amber-300 border-amber-500/35' : 'bg-white/5 text-text-muted border-white/10'
                }`}
              >
                Cotas
              </button>
              <button
                onClick={() => setShowAprilTags(v => !v)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                  showAprilTags ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35' : 'bg-white/5 text-text-muted border-white/10'
                }`}
              >
                Tags
              </button>
              <button
                onClick={handleUndoPath}
                disabled={paths.length === 0}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white disabled:opacity-40"
                title="Desfazer último traço"
              >
                <Undo2 size={15} />
              </button>
              <button
                onClick={handleClearPaths}
                disabled={paths.length === 0 && !rulerLine}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-text-secondary hover:text-red-400 disabled:opacity-40"
                title="Limpar rotas e régua"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={handleResetTokens}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-amber-300"
                title="Resetar robôs e peças para posição inicial oficial"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* Filtro de Fase & Orientação da Arena */}
          <div className="flex items-center justify-between gap-2 text-[11px] flex-wrap">
            <div className="flex items-center gap-1.5">
              <Eye size={13} className="text-text-muted" />
              <span className="text-text-muted font-semibold">Rotas:</span>
              {(['all', 'auto', 'teleop', 'endgame'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setPhaseFilter(f)}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    phaseFilter === f ? 'bg-white/15 text-white' : 'text-text-muted hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Todas' : PHASE_COLORS[f].label}
                </button>
              ))}
            </div>
            <span className="text-cyan-300/90 font-semibold">
              Escala Real 1:1 — 144" × 144" (365,75 cm) • Robôs em escala 18" × 18"
            </span>
          </div>

          {/* Rótulo Parede Superior (Scoring Side) */}
          <div className="max-w-[660px] mx-auto">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted px-2 pb-1">
              <span className="text-red-400">◀ Lado Aliança Vermelha (A–C)</span>
              <span className="text-white/70">▲ Lado Mesa / Juízes (Scoring Side • Linha 6) ▲</span>
              <span className="text-blue-400">Lado Aliança Azul (D–F) ▶</span>
            </div>

            {/* Canvas SVG 720×720 = 144"×144" Exato */}
            <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-white/20 bg-[#0f1624] shadow-2xl select-none">
              <svg
                ref={svgRef}
                viewBox="0 0 720 720"
                className={`w-full h-full touch-none ${
                  tool === 'draw' || tool === 'ruler' ? 'cursor-crosshair' : 'cursor-grab'
                }`}
                onPointerDown={handleSvgPointerDown}
                onPointerMove={handleSvgPointerMove}
                onPointerUp={handleSvgPointerUp}
                onPointerCancel={handleSvgPointerUp}
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

                {/* 36 Placas EVA 6×6 (24" × 24" cada = 120×120 px) */}
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
                          stroke={isRedSide ? 'rgba(239, 68, 68, 0.14)' : 'rgba(59, 130, 246, 0.14)'}
                          strokeWidth="1"
                        />
                        <text
                          x={colIdx * 120 + 8}
                          y={rowIdx * 120 + 18}
                          fill="rgba(148, 163, 184, 0.35)"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {tileId}
                        </text>
                      </g>
                    );
                  })
                )}

                {/* Linha Divisória Central (72" / 182,88 cm) */}
                <line x1="360" y1="0" x2="360" y2="720" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" strokeDasharray="8 6" />

                {/* ─── RED LOADING ZONE / PARK (Tile A5: 23" × 11" = 115 × 55 px) ─── */}
                <g>
                  <rect
                    x="0"
                    y={120 + 2.5}
                    width={loadDepth}
                    height={loadAlongWall}
                    fill="rgba(239, 68, 68, 0.20)"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                  />
                  <text x="27" y="176" textAnchor="middle" fill="#fecaca" fontSize="9.5" fontWeight="900">RED</text>
                  <text x="27" y="188" textAnchor="middle" fill="#fca5a5" fontSize="8.5" fontWeight="bold">LOADING</text>
                  <text x="27" y="199" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold">/ PARK</text>
                  {showDimensions && (
                    <text x="61" y="184" fill="#fca5a5" fontSize="9" fontWeight="bold">
                      {unit === 'in' ? '23"×11"' : '58×28cm'}
                    </text>
                  )}
                </g>

                {/* ─── BLUE LOADING ZONE / PARK (Tile F2: 23" × 11" = 115 × 55 px) ─── */}
                <g>
                  <rect
                    x={SVG_SIZE - loadDepth}
                    y={480 + 2.5}
                    width={loadDepth}
                    height={loadAlongWall}
                    fill="rgba(59, 130, 246, 0.20)"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                  />
                  <text x={SVG_SIZE - 27} y="536" textAnchor="middle" fill="#bfdbfe" fontSize="9.5" fontWeight="900">BLUE</text>
                  <text x={SVG_SIZE - 27} y="548" textAnchor="middle" fill="#93c5fd" fontSize="8.5" fontWeight="bold">LOADING</text>
                  <text x={SVG_SIZE - 27} y="559" textAnchor="middle" fill="#93c5fd" fontSize="8" fontWeight="bold">/ PARK</text>
                  {showDimensions && (
                    <text x={SVG_SIZE - 61} y="544" textAnchor="end" fill="#93c5fd" fontSize="9" fontWeight="bold">
                      {unit === 'in' ? '23"×11"' : '58×28cm'}
                    </text>
                  )}
                </g>

                {/* ─── RED GARDEN (Tile A1: 23" × 2" = 115 × 10 px, borda Audience) ─── */}
                <g>
                  <rect
                    x="2.5"
                    y={SVG_SIZE - gardenWidth}
                    width={gardenLen}
                    height={gardenWidth}
                    fill="rgba(239, 68, 68, 0.45)"
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                  <text x="60" y={SVG_SIZE - 16} textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="900">
                    RED GARDEN (A1 • 4 Pollen)
                  </text>
                </g>

                {/* ─── BLUE GARDEN (Tile F6: 23" × 2" = 115 × 10 px, borda Scoring) ─── */}
                <g>
                  <rect
                    x={SVG_SIZE - gardenLen - 2.5}
                    y="0"
                    width={gardenLen}
                    height={gardenWidth}
                    fill="rgba(59, 130, 246, 0.45)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <text x={SVG_SIZE - 60} y="24" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="900">
                    BLUE GARDEN (F6 • 4 Pollen)
                  </text>
                </g>

                {/* ─── 4 FLOWERS NO PERÍMETRO (1 por parede, a 2 placas = 48" do canto) ─── */}
                {[
                  { id: 'FL-1', x: 14, y: 480, labelX: 46, labelY: 484, anchor: 'start', pos: 'Parede A2/A3' },
                  { id: 'FL-2', x: 240, y: 14, labelX: 240, labelY: 44, anchor: 'middle', pos: 'Parede B6/C6' },
                  { id: 'FL-3', x: 706, y: 240, labelX: 674, labelY: 244, anchor: 'end', pos: 'Parede F4/F5' },
                  { id: 'FL-4', x: 480, y: 706, labelX: 480, labelY: 680, anchor: 'middle', pos: 'Parede D1/E1' },
                ].map(fl => (
                  <g key={fl.id}>
                    {/* Anel de piso / Estrutura da Flower (Ø 4" abertura topo = 20px) */}
                    <circle cx={fl.x} cy={fl.y} r="20" fill="rgba(16, 185, 129, 0.22)" stroke="#10b981" strokeWidth="2.5" />
                    <circle cx={fl.x} cy={fl.y} r="10" fill="rgba(234, 179, 8, 0.35)" stroke="#eab308" strokeWidth="1.8" />
                    <text x={fl.x} y={fl.y + 3.5} textAnchor="middle" fill="#ecfdf5" fontSize="8.5" fontWeight="900">
                      {fl.id}
                    </text>
                    <text x={fl.labelX} y={fl.labelY} textAnchor={fl.anchor as any} fill="#6ee7b7" fontSize="9" fontWeight="bold">
                      FLOWER {showDimensions ? (unit === 'in' ? '(Ø4" H:21.5")' : '(Ø10cm H:55cm)') : ''}
                    </text>
                  </g>
                ))}

                {/* ─── HIVE CENTRAL (Placas C3, C4, D3, D4 • 49.46" × 38.95" EXATO) ─── */}
                <g>
                  {/* Base estrutural oficial da Hive */}
                  <rect
                    x={hiveX}
                    y={hiveY}
                    width={hiveW}
                    height={hiveH}
                    rx="10"
                    fill="rgba(15, 23, 42, 0.88)"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />

                  {/* Red HIVE (Metade Esquerda — 2 Células) */}
                  <rect
                    x={hiveX + 8}
                    y={hiveY + 10}
                    width={hiveW / 2 - 14}
                    height={hiveH / 2 - 14}
                    rx="6"
                    fill="rgba(239, 68, 68, 0.22)"
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                  <rect
                    x={hiveX + 8}
                    y={SVG_SIZE / 2 + 4}
                    width={hiveW / 2 - 14}
                    height={hiveH / 2 - 14}
                    rx="6"
                    fill="rgba(239, 68, 68, 0.22)"
                    stroke="#ef4444"
                    strokeWidth="2"
                  />

                  {/* Blue HIVE (Metade Direita — 2 Células) */}
                  <rect
                    x={SVG_SIZE / 2 + 6}
                    y={hiveY + 10}
                    width={hiveW / 2 - 14}
                    height={hiveH / 2 - 14}
                    rx="6"
                    fill="rgba(59, 130, 246, 0.22)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <rect
                    x={SVG_SIZE / 2 + 6}
                    y={SVG_SIZE / 2 + 4}
                    width={hiveW / 2 - 14}
                    height={hiveH / 2 - 14}
                    rx="6"
                    fill="rgba(59, 130, 246, 0.22)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />

                  {/* Eixo de Pivô Central (Altura 43.95" / 111.65 cm) */}
                  <line x1={SVG_SIZE / 2} y1={hiveY + 4} x2={SVG_SIZE / 2} y2={hiveY + hiveH - 4} stroke="#f59e0b" strokeWidth="3" />
                  <circle cx={SVG_SIZE / 2} cy={SVG_SIZE / 2} r="6" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />

                  {/* Rótulos das Células & Clusters AprilTag 36h11 */}
                  <text x={hiveX + 62} y={hiveY + 34} textAnchor="middle" fill="#fecaca" fontSize="10" fontWeight="900">RED CELL (SCORING)</text>
                  {showAprilTags && (
                    <text x={hiveX + 62} y={hiveY + 50} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">Tags 0,1,2,3</text>
                  )}

                  <text x={hiveX + 62} y={SVG_SIZE / 2 + 34} textAnchor="middle" fill="#fecaca" fontSize="10" fontWeight="900">RED CELL (AUDIENCE)</text>
                  {showAprilTags && (
                    <text x={hiveX + 62} y={SVG_SIZE / 2 + 50} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">Tags 4,5,6,7</text>
                  )}

                  <text x={SVG_SIZE / 2 + 62} y={hiveY + 34} textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="900">BLUE CELL (SCORING)</text>
                  {showAprilTags && (
                    <text x={SVG_SIZE / 2 + 62} y={hiveY + 50} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">Tags 42,43,44,45</text>
                  )}

                  <text x={SVG_SIZE / 2 + 62} y={SVG_SIZE / 2 + 34} textAnchor="middle" fill="#bfdbfe" fontSize="10" fontWeight="900">BLUE CELL (AUDIENCE)</text>
                  {showAprilTags && (
                    <text x={SVG_SIZE / 2 + 62} y={SVG_SIZE / 2 + 50} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">Tags 38,39,40,41</text>
                  )}

                  {/* Cotas CAD da Hive Central */}
                  {showDimensions && (
                    <g>
                      <line x1={hiveX} y1={hiveY - 12} x2={hiveX + hiveW} y2={hiveY - 12} stroke="#f59e0b" strokeWidth="1.2" />
                      <line x1={hiveX} y1={hiveY - 17} x2={hiveX} y2={hiveY - 7} stroke="#f59e0b" strokeWidth="1.2" />
                      <line x1={hiveX + hiveW} y1={hiveY - 17} x2={hiveX + hiveW} y2={hiveY - 7} stroke="#f59e0b" strokeWidth="1.2" />
                      <rect x={SVG_SIZE / 2 - 58} y={hiveY - 22} width="116" height="16" rx="4" fill="#0f172a" />
                      <text x={SVG_SIZE / 2} y={hiveY - 11} textAnchor="middle" fill="#fcd34d" fontSize="9.5" fontWeight="bold">
                        HIVE: {fmtLen(49.46)} × {fmtLen(38.95)}
                      </text>
                      <text x={SVG_SIZE / 2} y={hiveY + hiveH + 14} textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">
                        Pivô H: {fmtLen(43.95)} • Placas C3–D4
                      </text>
                    </g>
                  )}
                </g>

                {/* Cota de 1 Placa (24" / 60,95 cm) no canto superior esquerdo */}
                {showDimensions && (
                  <g>
                    <line x1="120" y1="36" x2="240" y2="36" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" />
                    <text x="180" y="31" textAnchor="middle" fill="#7dd3fc" fontSize="9" fontWeight="bold">
                      1 Placa = {unit === 'in' ? '24"' : '60,95 cm'}
                    </text>
                  </g>
                )}

                {/* Rotas Táticas Desenhadas */}
                {visiblePaths.map(p => (
                  <polyline
                    key={p.id}
                    fill="none"
                    stroke={p.color}
                    strokeWidth={p.width * 3.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.92}
                    points={toPolylinePoints(p.points)}
                    markerEnd={`url(#arrow-${p.phase})`}
                  />
                ))}

                {/* Régua CAD Interativa */}
                {rulerLine && rulerMetrics && (
                  <g>
                    <line
                      x1={toPx(rulerLine.start.x)}
                      y1={toPx(rulerLine.start.y)}
                      x2={toPx(rulerLine.end.x)}
                      y2={toPx(rulerLine.end.y)}
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />
                    <circle cx={toPx(rulerLine.start.x)} cy={toPx(rulerLine.start.y)} r="5" fill="#10b981" />
                    <circle cx={toPx(rulerLine.end.x)} cy={toPx(rulerLine.end.y)} r="5" fill="#10b981" />
                    <rect
                      x={rulerMetrics.midX - 78}
                      y={rulerMetrics.midY - 26}
                      width="156"
                      height="22"
                      rx="6"
                      fill="#064e3b"
                      stroke="#34d399"
                      strokeWidth="1.5"
                    />
                    <text x={rulerMetrics.midX} y={rulerMetrics.midY - 12} textAnchor="middle" fill="#ecfdf5" fontSize="10.5" fontWeight="900">
                      {rulerMetrics.distIn.toFixed(1)}" • {rulerMetrics.distCm.toFixed(0)} cm ({rulerMetrics.tiles.toFixed(2)} pl.)
                    </text>
                  </g>
                )}

                {/* Robôs (Escala Real 18"×18" = 90×90 px) e Elementos (Pollen Ø2.8"=14px / Nectar Ø3.6"=18px) */}
                {tokens.map(tok => {
                  const cx = toPx(tok.x);
                  const cy = toPx(tok.y);
                  const isRobot = tok.kind.startsWith('robot_');
                  const isRed = tok.kind.includes('red');

                  if (isRobot) {
                    const half = robotPx / 2; // 45px = 9"
                    return (
                      <g
                        key={tok.id}
                        transform={`translate(${cx}, ${cy})`}
                        onPointerDown={e => handleTokenPointerDown(e, tok.id)}
                        className={tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                      >
                        {/* Caixa de escala real 18" × 18" */}
                        <rect
                          x={-half}
                          y={-half}
                          width={robotPx}
                          height={robotPx}
                          rx="10"
                          fill={isRed ? 'rgba(220, 38, 38, 0.30)' : 'rgba(37, 99, 235, 0.30)'}
                          stroke={isRed ? '#ef4444' : '#3b82f6'}
                          strokeWidth="2.5"
                          strokeDasharray="5 3"
                        />
                        {/* Núcleo sólido identificável do robô */}
                        <rect
                          x="-22"
                          y="-22"
                          width="44"
                          height="44"
                          rx="8"
                          fill={isRed ? '#dc2626' : '#2563eb'}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text y="5" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="900">
                          {tok.label}
                        </text>
                        {showDimensions && (
                          <text y={half - 5} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="8.5" fontWeight="bold">
                            {unit === 'in' ? '18"×18"' : '45,7cm'}
                          </text>
                        )}
                      </g>
                    );
                  }

                  const isPollen = tok.kind === 'pollen';
                  // Escala real: Pollen Ø 2.8" -> r = 7px (usamos r=8.5 para toque fácil); Nectar Ø 3.6" -> r = 9px (usamos r=10.5)
                  const radius = isPollen ? 8.5 : 10.5;
                  const fillColor = isPollen ? '#eab308' : tok.kind === 'nectar_red' ? '#f87171' : '#60a5fa';

                  return (
                    <g
                      key={tok.id}
                      transform={`translate(${cx}, ${cy})`}
                      onPointerDown={e => handleTokenPointerDown(e, tok.id)}
                      className={tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                    >
                      <circle r={radius} fill={fillColor} stroke="#0f172a" strokeWidth="1.8" />
                      <text y="3.5" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontWeight="900">
                        {tok.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Rótulo Parede Inferior (Audience Side) + Telemetria do Cursor */}
            <div className="flex flex-wrap items-center justify-between text-[10px] font-bold px-2 pt-1.5 gap-2">
              <span className="text-white/70 uppercase tracking-widest">▼ Lado da Plateia (Audience Side • Linha 1) ▼</span>
              {hoverPos ? (
                <span className="text-emerald-300 font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-500/25">
                  Placa {getTileName(hoverPos.x, hoverPos.y)} • X: {fmtLen((hoverPos.x / 100) * FIELD_INCHES)} | Y: {fmtLen(((100 - hoverPos.y) / 100) * FIELD_INCHES)}
                </span>
              ) : (
                <span className="text-text-muted">Passe o mouse ou use a Régua CAD para medir distâncias</span>
              )}
            </div>
          </div>
        </div>

        {/* Painel Direito: Metadados + Ficha Técnica Oficial da Arena BIOBUZZ™ */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" />
              Configuração da Jogada
            </h4>

            <div>
              <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Nome da Estratégia / Plano</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Quali 14 - Auto Red A1 + 7 Tips"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Partida</label>
                <input
                  type="text"
                  value={matchNumber}
                  onChange={e => setMatchNumber(e.target.value)}
                  placeholder="Ex: Q-14"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Aliança Bazinga!</label>
                <select
                  value={allianceSide}
                  onChange={e => setAllianceSide(e.target.value as 'red' | 'blue')}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="red" className="bg-primary">Vermelha (A–C)</option>
                  <option value="blue" className="bg-primary">Azul (D–F)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Briefing / Divisão de Funções</label>
              <textarea
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: R1 coleta 4 Pollen do Red Garden (A1), alinha via AprilTags 4-7 e lança na Red Cell. Nos últimos 60s domina FL-1 e FL-4 + Park em A5..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          </div>

          {/* Especificações Oficiais Seção 9 - Arena BIOBUZZ™ */}
          <div className="bg-primary/40 border border-cyan-500/20 rounded-2xl p-4 space-y-2.5 text-xs">
            <h5 className="font-black text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Maximize2 size={13} />
              Medidas Oficiais da Arena (Seção 9)
            </h5>
            <div className="space-y-1.5 text-[11px] text-text-secondary">
              <p>• <strong className="text-white">Campo Interno:</strong> 144" × 144" (365,75 × 365,75 cm) • 36 placas de 24" (60,95 cm)</p>
              <p>• <strong className="text-amber-300">Hive Central (C3–D4):</strong> 49,46" × 38,95" (125,65 × 98,95 cm) • Pivô a 43,95" (111,65 cm)</p>
              <p>• <strong className="text-emerald-300">4 Flowers (Perímetro):</strong> Topo Ø 4,0" (10,15 cm) a 21,5" (54,6 cm) de altura • Backstop 1,25" • Coleta inf. 3,55"×3,57" • 4 Pollen iniciais cada</p>
              <p>• <strong className="text-white">Loading / Park (A5 & F2):</strong> 23" × 11" (58,40 × 27,95 cm)</p>
              <p>• <strong className="text-white">Gardens (A1 & F6):</strong> 23" × 2" (58,40 × 5,10 cm) • 4 Pollen iniciais cada</p>
              <p>• <strong className="text-white">Esferas:</strong> Pollen Ø 2,8" (7,1 cm) | Nectar Ø 3,6" (9,1 cm)</p>
              <p>• <strong className="text-cyan-300">AprilTags (36h11 • 3,25"):</strong> Red [0–3, 4–7] | Blue [38–41, 42–45] sob as células da Hive</p>
            </div>
            <div className="pt-2 border-t border-white/10 text-[10px] text-text-muted flex items-start gap-1.5">
              <Info size={12} className="shrink-0 mt-0.5 text-amber-400" />
              <span>Tolerância geral do manual FIRST: ±1" (±2,5 cm). Use a ferramenta <strong>Régua CAD</strong> para medir distâncias exatas de disparo e autônomo.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TacticalFieldBoard;
