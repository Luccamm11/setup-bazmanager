import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Move, PenTool, Undo2, Trash2, RotateCcw, Save, Download,
  FolderOpen, CheckCircle2, Plus, Sparkles, Eye
} from 'lucide-react';
import type { TacticalBoardPlay, TacticalPath, TacticalToken } from '../../types';

interface TacticalFieldBoardProps {
  plays: TacticalBoardPlay[];
  currentUser: string;
  isTech: boolean;
  onSavePlay: (play: TacticalBoardPlay) => Promise<void>;
  onDeletePlay: (playId: string) => Promise<void>;
}

const DEFAULT_TOKENS: TacticalToken[] = [
  { id: 'r1', kind: 'robot_red_1', label: 'R1', x: 12, y: 24 },
  { id: 'r2', kind: 'robot_red_2', label: 'R2', x: 12, y: 76 },
  { id: 'b1', kind: 'robot_blue_1', label: 'B1', x: 88, y: 24 },
  { id: 'b2', kind: 'robot_blue_2', label: 'B2', x: 88, y: 76 },
  { id: 'p1', kind: 'pollen', label: 'P', x: 50, y: 28 },
  { id: 'p2', kind: 'pollen', label: 'P', x: 50, y: 42 },
  { id: 'p3', kind: 'pollen', label: 'P', x: 50, y: 58 },
  { id: 'p4', kind: 'pollen', label: 'P', x: 50, y: 72 },
  { id: 'nr1', kind: 'nectar_red', label: 'N', x: 24, y: 50 },
  { id: 'nb1', kind: 'nectar_blue', label: 'N', x: 76, y: 50 },
];

const PHASE_COLORS: Record<'auto' | 'teleop' | 'endgame', { stroke: string; label: string; badgeClass: string }> = {
  auto: { stroke: '#06b6d4', label: 'Autônomo (30s)', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  teleop: { stroke: '#f59e0b', label: 'TeleOp', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  endgame: { stroke: '#f97316', label: 'Endgame / Flowers', badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
};

export const TacticalFieldBoard: React.FC<TacticalFieldBoardProps> = ({
  plays,
  currentUser,
  isTech,
  onSavePlay,
  onDeletePlay,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(plays[0]?.id || null);
  const [title, setTitle] = useState(plays[0]?.title || 'Plano Tático Principal - BIOBUZZ™');
  const [matchNumber, setMatchNumber] = useState(plays[0]?.matchNumber || '');
  const [allianceSide, setAllianceSide] = useState<'red' | 'blue'>(plays[0]?.allianceSide || 'red');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'auto' | 'teleop' | 'endgame'>('all');
  const [notes, setNotes] = useState(plays[0]?.notes || '');

  const [tool, setTool] = useState<'move' | 'draw'>('move');
  const [drawPhase, setDrawPhase] = useState<'auto' | 'teleop' | 'endgame'>('auto');
  const [tokens, setTokens] = useState<TacticalToken[]>(() =>
    plays[0]?.tokens?.length ? plays[0].tokens : DEFAULT_TOKENS.map(t => ({ ...t }))
  );
  const [paths, setPaths] = useState<TacticalPath[]>(() => plays[0]?.paths || []);

  // Interaction state
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<TacticalPath | null>(null);
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

  // Convert pointer client coordinates to normalized 0..100 SVG field space
  const getNormalizedCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 50, y: 50 };
    const rect = svg.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  }, []);

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (tool !== 'draw') return;
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    const pt = getNormalizedCoords(e.clientX, e.clientY);
    setActivePath({
      id: `path-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      color: PHASE_COLORS[drawPhase].stroke,
      width: 1.4,
      phase: drawPhase,
      points: [pt],
    });
  };

  const handleTokenPointerDown = (e: React.PointerEvent<SVGGElement>, tokenId: string) => {
    if (tool !== 'move') return;
    e.stopPropagation();
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    setDraggingTokenId(tokenId);
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingTokenId) {
      const pt = getNormalizedCoords(e.clientX, e.clientY);
      setTokens(prev => prev.map(t => (t.id === draggingTokenId ? { ...t, x: pt.x, y: pt.y } : t)));
      return;
    }

    if (activePath) {
      const pt = getNormalizedCoords(e.clientX, e.clientY);
      setActivePath(prev => {
        if (!prev) return null;
        const last = prev.points[prev.points.length - 1];
        const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
        if (dist < 0.7) return prev; // smooth minimal delta threshold
        return { ...prev, points: [...prev.points, pt] };
      });
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (svgRef.current?.hasPointerCapture(e.pointerId)) {
      svgRef.current.releasePointerCapture(e.pointerId);
    }
    if (draggingTokenId) {
      setDraggingTokenId(null);
    }
    if (activePath) {
      if (activePath.points.length >= 2) {
        setPaths(prev => [...prev, activePath]);
      }
      setActivePath(null);
    }
  };

  const handleUndoPath = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const handleClearPaths = () => {
    setPaths([]);
  };

  const handleResetTokens = () => {
    setTokens(DEFAULT_TOKENS.map(t => ({ ...t })));
  };

  const handleNewPlay = () => {
    setSelectedPlayId(null);
    setTitle(`Nova Estratégia ${plays.length + 1}`);
    setMatchNumber('');
    setNotes('');
    setTokens(DEFAULT_TOKENS.map(t => ({ ...t })));
    setPaths([]);
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
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'tatica-biobuzz'}.png`;
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

  const toPolylinePoints = (pts: Array<{ x: number; y: number }>) =>
    pts.map(p => `${p.x * 6},${p.y * 6}`).join(' ');

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

      {/* Área Principal: Campo Interativo + Painel Lateral */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Campo SVG BIOBUZZ (12ft x 12ft = 6x6 tiles) */}
        <div className="xl:col-span-8 bg-[#0b101b] border border-white/10 rounded-2xl p-3 sm:p-4 space-y-3">
          {/* Toolbar de Desenho e Peças */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setTool('move')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tool === 'move'
                    ? 'bg-blue-600 text-white shadow-glow-primary'
                    : 'bg-white/5 text-text-secondary hover:text-white'
                }`}
              >
                <Move size={14} />
                <span>Arrastar Robôs/Peças</span>
              </button>

              <button
                onClick={() => setTool('draw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tool === 'draw'
                    ? 'bg-amber-500 text-black'
                    : 'bg-white/5 text-text-secondary hover:text-white'
                }`}
              >
                <PenTool size={14} />
                <span>Desenhar Rota</span>
              </button>
            </div>

            {tool === 'draw' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['auto', 'teleop', 'endgame'] as const).map(ph => (
                  <button
                    key={ph}
                    onClick={() => setDrawPhase(ph)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      drawPhase === ph
                        ? PHASE_COLORS[ph].badgeClass
                        : 'bg-white/5 text-text-muted border-white/10 hover:text-white'
                    }`}
                  >
                    {PHASE_COLORS[ph].label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUndoPath}
                disabled={paths.length === 0}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white disabled:opacity-40 transition-all"
                title="Desfazer último traço"
              >
                <Undo2 size={15} />
              </button>
              <button
                onClick={handleClearPaths}
                disabled={paths.length === 0}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-text-secondary hover:text-red-400 disabled:opacity-40 transition-all"
                title="Limpar todas as rotas"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={handleResetTokens}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-amber-300 transition-all"
                title="Resetar posições iniciais"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* Filtro Visual de Fase */}
          <div className="flex items-center justify-between gap-2 text-[11px] flex-wrap">
            <div className="flex items-center gap-1.5">
              <Eye size={13} className="text-text-muted" />
              <span className="text-text-muted font-semibold">Exibir Rotas:</span>
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
            <span className="text-text-muted">
              Campo Oficial 12ft × 12ft (Grade 6×6) • Arraste ou desenhe direto no campo
            </span>
          </div>

          {/* Canvas SVG 1:1 Responsivo com touch-action none */}
          <div className="w-full max-w-[620px] mx-auto aspect-square rounded-xl overflow-hidden border-2 border-white/15 bg-[#121926] shadow-2xl select-none">
            <svg
              ref={svgRef}
              viewBox="0 0 600 600"
              className={`w-full h-full touch-none ${tool === 'draw' ? 'cursor-crosshair' : 'cursor-grab'}`}
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handleSvgPointerMove}
              onPointerUp={handleSvgPointerUp}
              onPointerCancel={handleSvgPointerUp}
            >
              <defs>
                {/* Setas direcionais por fase */}
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

              {/* Fundo Tapetes EVA 6x6 */}
              <rect x="0" y="0" width="600" height="600" fill="#171f2e" />
              {[0, 1, 2, 3, 4, 5].map(row =>
                [0, 1, 2, 3, 4, 5].map(col => (
                  <rect
                    key={`tile-${row}-${col}`}
                    x={col * 100}
                    y={row * 100}
                    width="100"
                    height="100"
                    fill={(row + col) % 2 === 0 ? '#1b2436' : '#161e2d'}
                    stroke="#28354e"
                    strokeWidth="1"
                  />
                ))
              )}

              {/* Rótulos das Colunas (A-F) e Linhas (1-6) */}
              {['A', 'B', 'C', 'D', 'E', 'F'].map((lbl, idx) => (
                <text key={lbl} x={idx * 100 + 50} y="16" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                  {lbl}
                </text>
              ))}
              {['1', '2', '3', '4', '5', '6'].map((lbl, idx) => (
                <text key={lbl} x="12" y={idx * 100 + 54} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                  {lbl}
                </text>
              ))}

              {/* Zonas de Aliança & Park (Vermelha Esq / Azul Dir) */}
              <rect x="0" y="0" width="100" height="200" fill="rgba(239, 68, 68, 0.10)" stroke="rgba(239, 68, 68, 0.45)" strokeWidth="2" strokeDasharray="6 4" />
              <text x="50" y="34" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="bold">RED START/PARK</text>

              <rect x="0" y="400" width="100" height="200" fill="rgba(239, 68, 68, 0.10)" stroke="rgba(239, 68, 68, 0.45)" strokeWidth="2" strokeDasharray="6 4" />
              <text x="50" y="582" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="bold">RED START/PARK</text>

              <rect x="500" y="0" width="100" height="200" fill="rgba(59, 130, 246, 0.10)" stroke="rgba(59, 130, 246, 0.45)" strokeWidth="2" strokeDasharray="6 4" />
              <text x="550" y="34" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold">BLUE START/PARK</text>

              <rect x="500" y="400" width="100" height="200" fill="rgba(59, 130, 246, 0.10)" stroke="rgba(59, 130, 246, 0.45)" strokeWidth="2" strokeDasharray="6 4" />
              <text x="550" y="582" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold">BLUE START/PARK</text>

              {/* Hives (Colmeias) com AprilTags */}
              <g transform="translate(46, 300)">
                <polygon points="-38,-48 34,-48 34,48 -38,48" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="3" rx="6" />
                <text x="-2" y="-6" textAnchor="middle" fill="#fecaca" fontSize="12" fontWeight="900">HIVE</text>
                <text x="-2" y="10" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="bold">RED</text>
                <rect x="18" y="-16" width="16" height="32" fill="#ffffff" stroke="#111827" strokeWidth="1.5" rx="2" />
                <text x="26" y="4" textAnchor="middle" fill="#111827" fontSize="7" fontWeight="bold" transform="rotate(-90 26 4)">TAG</text>
              </g>

              <g transform="translate(554, 300)">
                <polygon points="-34,-48 38,-48 38,48 -34,48" fill="rgba(59, 130, 246, 0.25)" stroke="#3b82f6" strokeWidth="3" rx="6" />
                <text x="2" y="-6" textAnchor="middle" fill="#bfdbfe" fontSize="12" fontWeight="900">HIVE</text>
                <text x="2" y="10" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="bold">BLUE</text>
                <rect x="-34" y="-16" width="16" height="32" fill="#ffffff" stroke="#111827" strokeWidth="1.5" rx="2" />
                <text x="-26" y="4" textAnchor="middle" fill="#111827" fontSize="7" fontWeight="bold" transform="rotate(-90 -26 4)">TAG</text>
              </g>

              {/* 4 Flowers (Simétricas - Endgame Scoring & Pollen Origem) */}
              {[
                { id: 'F1', x: 200, y: 150 },
                { id: 'F2', x: 400, y: 150 },
                { id: 'F3', x: 200, y: 450 },
                { id: 'F4', x: 400, y: 450 },
              ].map(fl => (
                <g key={fl.id} transform={`translate(${fl.x}, ${fl.y})`}>
                  <circle r="34" fill="rgba(16, 185, 129, 0.14)" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 3" />
                  <circle r="15" fill="rgba(245, 158, 11, 0.22)" stroke="#f59e0b" strokeWidth="2" />
                  <text y="4" textAnchor="middle" fill="#ecfdf5" fontSize="11" fontWeight="900">{fl.id}</text>
                  <text y="48" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontWeight="bold">FLOWER</text>
                </g>
              ))}

              {/* Linha Central */}
              <line x1="300" y1="0" x2="300" y2="600" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="8 8" />

              {/* Rotas Desenhadas */}
              {visiblePaths.map(p => (
                <polyline
                  key={p.id}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={p.width * 3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.92}
                  points={toPolylinePoints(p.points)}
                  markerEnd={`url(#arrow-${p.phase})`}
                />
              ))}

              {/* Peças & Robôs Arrastáveis */}
              {tokens.map(tok => {
                const cx = tok.x * 6;
                const cy = tok.y * 6;
                const isRobot = tok.kind.startsWith('robot_');
                const isRed = tok.kind.includes('red');

                if (isRobot) {
                  return (
                    <g
                      key={tok.id}
                      transform={`translate(${cx}, ${cy})`}
                      onPointerDown={e => handleTokenPointerDown(e, tok.id)}
                      className={tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                    >
                      <rect
                        x="-20"
                        y="-20"
                        width="40"
                        height="40"
                        rx="8"
                        fill={isRed ? '#dc2626' : '#2563eb'}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />
                      <text y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">
                        {tok.label}
                      </text>
                    </g>
                  );
                }

                const fillColor =
                  tok.kind === 'pollen' ? '#eab308' : tok.kind === 'nectar_red' ? '#f87171' : '#60a5fa';

                return (
                  <g
                    key={tok.id}
                    transform={`translate(${cx}, ${cy})`}
                    onPointerDown={e => handleTokenPointerDown(e, tok.id)}
                    className={tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
                  >
                    <circle r="13" fill={fillColor} stroke="#0f172a" strokeWidth="2" />
                    <text y="4" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="900">
                      {tok.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Painel Direito: Metadados, Legenda BIOBUZZ e Anotações */}
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
                placeholder="Ex: Quali 14 - Foco 7 Hive Tips"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Partida (Opcional)</label>
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
                  <option value="red" className="bg-primary">Vermelha (Red)</option>
                  <option value="blue" className="bg-primary">Azul (Blue)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">Briefing / Divisão de Funções</label>
              <textarea
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Descreva quem faz qual Flower nos últimos 60s, posição inicial do Auto com AprilTag, e quem busca Swarm RP..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          </div>

          <div className="bg-primary/40 border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs">
            <h5 className="font-black text-white uppercase tracking-wider text-[11px]">Legenda Tática BIOBUZZ™</h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-red-600 border border-white inline-block" />
                <span className="text-text-secondary">Robôs Vermelhos (R1/R2)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-blue-600 border border-white inline-block" />
                <span className="text-text-secondary">Robôs Azuis (B1/B2)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 inline-block" />
                <span className="text-text-secondary">Pollen (Compartilhado)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/40 border border-emerald-400 inline-block" />
                <span className="text-text-secondary">Flowers (Endgame 60s)</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 space-y-1 text-[11px] text-text-muted">
              <p><span className="text-cyan-400 font-bold">● Ciano:</span> Rota Autônoma (30s) + Leave</p>
              <p><span className="text-amber-400 font-bold">● Âmbar:</span> Ciclos de TeleOp / Hive Tip</p>
              <p><span className="text-orange-400 font-bold">● Laranja:</span> Endgame / Flower Ownership & Park</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TacticalFieldBoard;
