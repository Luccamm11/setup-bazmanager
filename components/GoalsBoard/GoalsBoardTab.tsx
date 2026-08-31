import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Banknote, BookOpen, Users, Smartphone, Plus, RefreshCw,
  Edit3, Check, X, History, Sparkles, AlertCircle, ArrowUpRight,
  TrendingUp, Calendar, ChevronRight, Award, FileText, Info, ShieldAlert,
  Search, Filter
} from 'lucide-react';
import { GoalsBoardData, GoalsBoardMonth, GoalsBoardCategory, GoalsBoardColumn, GoalCellLog, UserRole } from '../../types';
import { INITIAL_GOALS_BOARD_DATA } from '../../data/initialGoalsData';

interface GoalsBoardTabProps {
  currentUser: string;
  userRole: UserRole;
}

// ─── Helpers de Formatação ───────────────────────────────────────────────────

function formatValue(value: number | null | undefined, type: 'currency' | 'hours' | 'number', unit?: string): string {
  if (value === null || value === undefined) return '-';
  if (type === 'currency') {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  if (type === 'hours') {
    return `${value.toLocaleString('pt-BR')}${unit || 'h'}`;
  }
  return value.toLocaleString('pt-BR');
}

function parseFormattedNumber(val: string): number | null {
  if (!val || val.trim() === '' || val.trim() === '-') return null;
  // Substitui R$, espaços e converte pontuação pt-BR
  const clean = val.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

const CATEGORY_THEMES = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    headerBg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40',
    subHeaderBg: 'bg-emerald-950/40 text-emerald-200 border-emerald-500/20',
    pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    text: 'text-emerald-400',
    icon: Banknote,
    progress: 'from-emerald-500 to-teal-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    headerBg: 'bg-amber-600/20 text-amber-300 border-amber-500/40',
    subHeaderBg: 'bg-amber-950/40 text-amber-200 border-amber-500/20',
    pill: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    text: 'text-amber-400',
    icon: BookOpen,
    progress: 'from-amber-500 to-yellow-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    headerBg: 'bg-purple-600/20 text-purple-300 border-purple-500/40',
    subHeaderBg: 'bg-purple-950/40 text-purple-200 border-purple-500/20',
    pill: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    text: 'text-purple-400',
    icon: Users,
    progress: 'from-purple-500 to-pink-500',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    headerBg: 'bg-blue-600/20 text-blue-300 border-blue-500/40',
    subHeaderBg: 'bg-blue-950/40 text-blue-200 border-blue-500/20',
    pill: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    text: 'text-blue-400',
    icon: Smartphone,
    progress: 'from-blue-500 to-cyan-400',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    headerBg: 'bg-rose-600/20 text-rose-300 border-rose-500/40',
    subHeaderBg: 'bg-rose-950/40 text-rose-200 border-rose-500/20',
    pill: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    text: 'text-rose-400',
    icon: Award,
    progress: 'from-rose-500 to-red-400',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    headerBg: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40',
    subHeaderBg: 'bg-cyan-950/40 text-cyan-200 border-cyan-500/20',
    pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    text: 'text-cyan-400',
    icon: Sparkles,
    progress: 'from-cyan-500 to-blue-400',
  },
};

export default function GoalsBoardTab({ currentUser, userRole }: GoalsBoardTabProps) {
  const [boardData, setBoardData] = useState<GoalsBoardData>(INITIAL_GOALS_BOARD_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filtro de Categoria
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais de Edição
  const [editingCell, setEditingCell] = useState<{
    monthId: string;
    monthName: string;
    columnId: string;
    columnLabel: string;
    categoryTitle: string;
    fieldType: 'realizado' | 'previsto';
    columnType: 'currency' | 'hours' | 'number';
    currentValue: number | null;
    targetValue: number;
    unit?: string;
  } | null>(null);

  const [cellInputValue, setCellInputValue] = useState<string>('');
  const [cellNote, setCellNote] = useState<string>('');
  const [cellLogs, setCellLogs] = useState<GoalCellLog[]>([]);

  // Modal para Adicionar Mês
  const [addMonthModalOpen, setAddMonthModalOpen] = useState(false);
  const [newMonthName, setNewMonthName] = useState('');

  // Modal de Confirmação de Reset
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const isTech = userRole === 'technician' || ['Jonas', 'Ramon'].includes(currentUser);

  // ─── Fetch Dados ───────────────────────────────────────────────────────────
  const fetchBoardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/goals-board');
      const json = await res.json();
      if (json.success && json.data) {
        setBoardData(json.data);
      } else {
        throw new Error(json.error || 'Erro ao carregar o quadro de metas.');
      }
    } catch (err: any) {
      console.error('Fetch Goals Board error:', err);
      setError(err.message || 'Falha ao buscar dados do servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // Limpa toast após 3.5s
  useEffect(() => {
    if (successToast) {
      const t = setTimeout(() => setSuccessToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [successToast]);

  // ─── Salvar Célula ─────────────────────────────────────────────────────────
  const handleSaveCell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell) return;

    setSaving(true);
    setError(null);

    const parsedNumber = parseFormattedNumber(cellInputValue);

    try {
      const res = await fetch('/api/goals-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateCell',
          username: currentUser,
          updateCell: {
            monthId: editingCell.monthId,
            columnId: editingCell.columnId,
            fieldType: editingCell.fieldType,
            value: parsedNumber,
            note: cellNote,
          },
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setBoardData(json.data);
        setSuccessToast(`Meta ${editingCell.fieldType === 'realizado' ? 'realizada' : 'prevista'} atualizada com sucesso!`);
        setEditingCell(null);
      } else {
        throw new Error(json.error || 'Erro ao salvar alteração.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha na requisição.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Abrir Modal de Edição de Célula ───────────────────────────────────────
  const handleOpenEditCell = (
    month: GoalsBoardMonth,
    category: GoalsBoardCategory,
    column: GoalsBoardColumn,
    fieldType: 'realizado' | 'previsto'
  ) => {
    // Se for 'previsto' e não for técnico, bloqueia
    if (fieldType === 'previsto' && !isTech) {
      return;
    }

    const val = fieldType === 'realizado' ? month.realizado[column.id] : month.previsto[column.id];
    const logs = (month.logs && month.logs[column.id]) || [];

    setEditingCell({
      monthId: month.id,
      monthName: month.name,
      columnId: column.id,
      columnLabel: column.label,
      categoryTitle: category.title,
      fieldType,
      columnType: column.type,
      currentValue: val ?? null,
      targetValue: column.targetValue,
      unit: column.unit,
    });

    setCellInputValue(val !== null && val !== undefined ? String(val) : '');
    setCellNote('');
    setCellLogs(logs);
  };

  // ─── Adicionar Novo Mês ────────────────────────────────────────────────────
  const handleAddMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthName.trim()) return;

    setSaving(true);
    setError(null);

    const monthId = newMonthName.trim().toLowerCase().replace(/\s+/g, '_');
    const newMonth: GoalsBoardMonth = {
      id: monthId,
      name: newMonthName.trim(),
      previsto: {},
      realizado: {},
      logs: {},
    };

    const updatedData: GoalsBoardData = {
      ...boardData,
      months: [...boardData.months, newMonth],
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser,
    };

    try {
      const res = await fetch('/api/goals-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          data: updatedData,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setBoardData(json.data);
        setSuccessToast(`Mês "${newMonthName.trim()}" adicionado com sucesso!`);
        setNewMonthName('');
        setAddMonthModalOpen(false);
      } else {
        throw new Error(json.error || 'Erro ao adicionar mês.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao adicionar mês.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Resetar para o Padrão ─────────────────────────────────────────────────
  const handleResetToDefault = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/goals-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser,
          resetToDefault: true,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setBoardData(json.data);
        setSuccessToast('Quadro de metas restaurado para o padrão Biobuzz!');
        setResetConfirmOpen(false);
      } else {
        throw new Error(json.error || 'Erro ao resetar quadro.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao resetar.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Cálculos dos Totais Realizados ─────────────────────────────────────────
  const totalsByColumn = useMemo(() => {
    const totals: Record<string, number> = {};

    boardData.categories.forEach(cat => {
      cat.columns.forEach(col => {
        let sum = 0;
        boardData.months.forEach(month => {
          const val = month.realizado[col.id];
          if (val !== null && val !== undefined && !isNaN(val)) {
            sum += Number(val);
          }
        });
        totals[col.id] = sum;
      });
    });

    return totals;
  }, [boardData]);

  // Cálculos por Categoria Macro (Meta vs Realizado)
  const categoryProgress = useMemo(() => {
    return boardData.categories.map(cat => {
      let realizedSum = 0;
      let targetSum = 0;

      cat.columns.forEach(col => {
        realizedSum += totalsByColumn[col.id] || 0;
        targetSum += col.targetValue || 0;
      });

      // Se a categoria tiver macroTargetValue definido diretamente
      const finalTarget = cat.macroTargetValue || targetSum || 1;
      const percentage = Math.min(Math.round((realizedSum / finalTarget) * 100), 100);

      return {
        category: cat,
        realizedSum,
        finalTarget,
        percentage,
      };
    });
  }, [boardData, totalsByColumn]);

  // Todas as colunas filtradas
  const filteredCategories = useMemo(() => {
    if (selectedCategoryFilter === 'all') {
      return boardData.categories;
    }
    return boardData.categories.filter(c => c.id === selectedCategoryFilter);
  }, [boardData, selectedCategoryFilter]);

  const allFilteredColumns = useMemo(() => {
    return filteredCategories.flatMap(cat => cat.columns);
  }, [filteredCategories]);

  return (
    <div className="space-y-8 pb-16">
      {/* ─── Banner Superior Estilo Biobuzz & FIRST Tech Challenge ─────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Título */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-[2px] shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent">
                  B
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Quadro de Metas – {boardData.teamName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {boardData.season || '2026'}
                </span>
              </div>
              <p className="text-sm sm:text-base text-emerald-200/70 mt-1 flex items-center gap-2">
                <span>Planejamento, acompanhamento e execução da temporada</span>
                <span className="text-emerald-500">•</span>
                <span className="text-emerald-400 font-semibold">{boardData.subtitle || 'FIRST TECH CHALLENGE'}</span>
              </p>
            </div>
          </div>

          {/* Badge FIRST & Ações Rápidas */}
          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="hidden sm:flex flex-col items-end px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-right">
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">Temporada Oficial</span>
              <span className="text-xs font-bold text-white tracking-wide">FIRST Tech Challenge</span>
            </div>

            <button
              onClick={fetchBoardData}
              disabled={loading}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all flex items-center gap-2 text-xs font-bold"
              title="Atualizar dados"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-400' : ''} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Feedback Toasts ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold">{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-400/60 hover:text-emerald-300">
              <X size={16} />
            </button>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-300">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Cartões de Metas Macro (Top Cards) ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryProgress.map(({ category, realizedSum, finalTarget, percentage }) => {
          const theme = CATEGORY_THEMES[category.color] || CATEGORY_THEMES.emerald;
          const IconComp = theme.icon;

          return (
            <motion.div
              key={category.id}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`p-5 rounded-2xl border ${theme.border} ${theme.bg} backdrop-blur-md relative overflow-hidden flex flex-col justify-between shadow-lg`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black tracking-wider uppercase text-white/50 block mb-1">
                    Meta Macro
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {category.title}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl bg-black/40 border ${theme.border} shrink-0`}>
                  <IconComp className={`w-6 h-6 ${theme.text}`} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {category.macroTargetText}
                  </span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${theme.pill}`}>
                    {percentage}%
                  </span>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-r ${theme.progress} rounded-full`}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-white/60 font-medium">
                  <span>Realizado: <strong>{formatValue(realizedSum, category.columns[0]?.type || 'number', category.columns[0]?.unit)}</strong></span>
                  <span>Alvo: {category.macroTargetText}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Barra de Filtros & Ações ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-primary/60 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
        {/* Filtro por Categoria */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategoryFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Todas as Áreas
          </button>
          {boardData.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategoryFilter === cat.id
                  ? 'bg-white text-slate-950 shadow-md font-extrabold'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className={`w-2 h-2 rounded-full bg-${cat.color}-400`} />
              {cat.title}
            </button>
          ))}
        </div>

        {/* Botões Técnicos / Utilitários */}
        <div className="flex items-center gap-2 shrink-0">
          {isTech && (
            <>
              <button
                onClick={() => setAddMonthModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Adicionar Mês</span>
              </button>

              <button
                onClick={() => setResetConfirmOpen(true)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-xs font-bold transition-all"
                title="Restaurar padrão inicial"
              >
                Resetar Padrão
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Tabela Principal do Quadro de Metas ─────────────────────────────── */}
      <div className="relative rounded-2xl border border-white/10 bg-primary/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            {/* Header Nível 1: Macro Categorias */}
            <thead>
              <tr className="border-b border-white/10">
                <th
                  rowSpan={2}
                  className="p-4 bg-slate-950/80 text-white font-black text-xs uppercase tracking-wider sticky left-0 z-30 w-32 border-r border-white/10 backdrop-blur-md"
                >
                  Mês
                </th>
                <th
                  rowSpan={2}
                  className="p-4 bg-slate-950/80 text-white font-black text-xs uppercase tracking-wider sticky left-32 z-30 w-28 border-r border-white/10 backdrop-blur-md text-center"
                >
                  Status
                </th>

                {filteredCategories.map(cat => {
                  const theme = CATEGORY_THEMES[cat.color] || CATEGORY_THEMES.emerald;
                  return (
                    <th
                      key={cat.id}
                      colSpan={cat.columns.length}
                      className={`p-3 text-center font-black text-sm uppercase tracking-wide border-r border-white/10 ${theme.headerBg}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>{cat.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 border border-white/10 font-bold">
                          {cat.macroTargetText}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>

              {/* Header Nível 2: Subcolunas de Metas */}
              <tr className="border-b border-white/15">
                {filteredCategories.map(cat =>
                  cat.columns.map(col => {
                    const theme = CATEGORY_THEMES[cat.color] || CATEGORY_THEMES.emerald;
                    return (
                      <th
                        key={col.id}
                        className={`p-3 text-center text-xs font-bold border-r border-white/10 min-w-[130px] ${theme.subHeaderBg}`}
                      >
                        <div className="font-extrabold text-white">{col.label}</div>
                        <div className="text-[11px] opacity-80 mt-0.5">({col.targetText})</div>
                      </th>
                    );
                  })
                )}
              </tr>
            </thead>

            {/* Linhas dos Meses (Previsto & Realizado) */}
            <tbody className="divide-y divide-white/5">
              {boardData.months.map(month => {
                return (
                  <React.Fragment key={month.id}>
                    {/* Linha: PREVISTO */}
                    <tr className="bg-white/[0.015] hover:bg-white/[0.04] transition-colors group">
                      <td
                        rowSpan={2}
                        className="p-4 font-black text-sm text-white sticky left-0 z-20 bg-slate-950/90 border-r border-b border-white/10 backdrop-blur-md"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-emerald-400" />
                          <span>{month.name}</span>
                        </div>
                      </td>

                      <td className="p-2.5 text-center text-[11px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/5 border-r border-white/10 sticky left-32 z-20 backdrop-blur-md">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                          Previsto
                        </span>
                      </td>

                      {filteredCategories.map(cat =>
                        cat.columns.map(col => {
                          const val = month.previsto[col.id];
                          const formatted = formatValue(val, col.type, col.unit);

                          return (
                            <td
                              key={`prev-${month.id}-${col.id}`}
                              onClick={() => isTech && handleOpenEditCell(month, cat, col, 'previsto')}
                              className={`p-3 text-center text-xs font-semibold text-white/70 border-r border-white/10 ${
                                isTech ? 'cursor-pointer hover:bg-blue-500/10 hover:text-white transition-colors' : ''
                              }`}
                              title={isTech ? 'Clique para editar meta prevista (Técnicos)' : 'Meta prevista planejada'}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span>{formatted}</span>
                                {isTech && (
                                  <Edit3 size={11} className="opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity text-blue-400" />
                                )}
                              </div>
                            </td>
                          );
                        })
                      )}
                    </tr>

                    {/* Linha: REALIZADO */}
                    <tr className="bg-emerald-950/[0.08] hover:bg-emerald-950/[0.18] transition-colors group/real border-b border-white/15">
                      <td className="p-2.5 text-center text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/5 border-r border-white/10 sticky left-32 z-20 backdrop-blur-md">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                          Realizado
                        </span>
                      </td>

                      {filteredCategories.map(cat =>
                        cat.columns.map(col => {
                          const valRealizado = month.realizado[col.id];
                          const valPrevisto = month.previsto[col.id];
                          const formatted = formatValue(valRealizado, col.type, col.unit);
                          const isMet = valRealizado !== null && valRealizado !== undefined && valPrevisto !== null && valPrevisto !== undefined && valRealizado >= valPrevisto;
                          const hasLogs = month.logs && month.logs[col.id] && month.logs[col.id].length > 0;

                          return (
                            <td
                              key={`real-${month.id}-${col.id}`}
                              onClick={() => handleOpenEditCell(month, cat, col, 'realizado')}
                              className="p-3 text-center text-xs font-bold text-white border-r border-white/10 cursor-pointer hover:bg-emerald-500/20 hover:ring-1 hover:ring-emerald-400/50 transition-all relative group"
                              title="Clique para marcar / preencher valor realizado"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span className={valRealizado !== null && valRealizado !== undefined ? 'text-emerald-300 font-extrabold' : 'text-white/30 font-medium'}>
                                  {formatted}
                                </span>
                                {isMet && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                                )}
                                {hasLogs && (
                                  <span className="w-1 h-1 rounded-full bg-blue-400" title="Possui histórico de notas" />
                                )}
                                <Edit3 size={11} className="opacity-0 group-hover:opacity-60 text-emerald-400 transition-opacity" />
                              </div>
                            </td>
                          );
                        })
                      )}
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* ─── Linha Final: TOTAL REALIZADO ───────────────────────────── */}
              <tr className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 font-black text-white border-t-2 border-emerald-500/40">
                <td
                  colSpan={2}
                  className="p-4 text-center font-black text-sm uppercase tracking-wider text-emerald-300 sticky left-0 z-20 bg-slate-950 border-r border-white/15 backdrop-blur-md"
                >
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp size={18} className="text-emerald-400" />
                    <span>Total Realizado</span>
                  </div>
                </td>

                {filteredCategories.map(cat =>
                  cat.columns.map(col => {
                    const totalSum = totalsByColumn[col.id] || 0;
                    const formatted = formatValue(totalSum, col.type, col.unit);
                    const target = col.targetValue || 1;
                    const pct = Math.min(Math.round((totalSum / target) * 100), 100);

                    return (
                      <td
                        key={`total-${col.id}`}
                        className="p-3.5 text-center text-xs font-black border-r border-white/10 bg-black/20"
                      >
                        <div className="text-sm font-extrabold text-emerald-300">
                          {formatted}
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-white/60 font-semibold">
                          <span>{pct}%</span>
                          <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal de Edição de Célula (Marcar Meta / Realizado) ─────────────── */}
      <AnimatePresence>
        {editingCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/15 p-6 sm:p-8 shadow-2xl text-white space-y-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                    {editingCell.categoryTitle} • Mês de {editingCell.monthName}
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    {editingCell.fieldType === 'realizado' ? 'Marcar / Atualizar Realizado' : 'Editar Meta Prevista'}
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    Indicador: <strong>{editingCell.columnLabel}</strong> (Alvo da temporada: {editingCell.targetValue.toLocaleString('pt-BR')}{editingCell.unit || ''})
                  </p>
                </div>

                <button
                  onClick={() => setEditingCell(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCell} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                    Valor {editingCell.fieldType === 'realizado' ? 'Realizado no Mês' : 'Previsto Planejado'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cellInputValue}
                      onChange={e => setCellInputValue(e.target.value)}
                      placeholder={editingCell.columnType === 'currency' ? 'Ex: 500 ou 500,00' : 'Ex: 10'}
                      autoFocus
                      className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-bold text-lg placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                    {editingCell.unit && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40">
                        {editingCell.unit}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/40 mt-1.5">
                    Deixe em branco ou digite "-" para desmarcar.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                    Observação / Detalhe (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={cellNote}
                    onChange={e => setCellNote(e.target.value)}
                    placeholder="Ex: Fechado patrocínio com a empresa X ou rifa vendida pelo time..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-all resize-none"
                  />
                </div>

                {/* Histórico de Atualizações Recentes na Célula */}
                {cellLogs.length > 0 && (
                  <div className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 uppercase tracking-wider">
                      <History size={12} />
                      <span>Histórico de Atualizações</span>
                    </div>
                    {cellLogs.slice(0, 4).map(log => (
                      <div key={log.id} className="text-xs text-white/70 border-b border-white/5 pb-1 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between text-[11px]">
                          <strong className="text-emerald-300">{log.username}</strong>
                          <span className="text-white/40">{new Date(log.timestamp).toLocaleDateString('pt-BR')} {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-white/80">
                          Valor: <span className="font-bold">{log.newValue !== null ? log.newValue : '-'}</span>
                          {log.note && <span className="text-white/50 italic ml-2">"{log.note}"</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingCell(null)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Salvar Alteração</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal para Adicionar Mês (Técnicos) ────────────────────────────── */}
      <AnimatePresence>
        {addMonthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 p-6 sm:p-8 shadow-2xl text-white space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Adicionar Novo Mês</h3>
                <button onClick={() => setAddMonthModalOpen(false)} className="p-2 text-white/60 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddMonth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                    Nome do Mês
                  </label>
                  <input
                    type="text"
                    value={newMonthName}
                    onChange={e => setNewMonthName(e.target.value)}
                    placeholder="Ex: Novembro ou Dezembro"
                    autoFocus
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white font-bold placeholder-white/30 focus:outline-none focus:border-blue-400 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddMonthModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !newMonthName.trim()}
                    className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-black"
                  >
                    {saving ? 'Adicionando...' : 'Adicionar Mês'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal de Confirmação de Reset ─────────────────────────────────── */}
      <AnimatePresence>
        {resetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-red-500/30 p-6 sm:p-8 shadow-2xl text-white space-y-5"
            >
              <div className="flex items-center gap-3 text-red-400">
                <ShieldAlert size={28} />
                <h3 className="text-lg font-black text-white">Restaurar Padrão Biobuzz?</h3>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                Esta ação irá restaurar o quadro para a configuração original da imagem (Maio a Outubro com os valores padrão pré-carregados).
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-black"
                >
                  {saving ? 'Restaurando...' : 'Sim, Restaurar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
