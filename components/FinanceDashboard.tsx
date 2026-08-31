import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  Trash2, 
  Edit3,
  CheckCircle2,
  Calendar,
  Tag,
  Target,
  BarChart3,
  PieChart,
  Search,
  Filter,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Award,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export type TransactionType = 'income' | 'expense' | 'investment';

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  category: string;
  actualReturn?: number;
  status?: 'open' | 'closed';
}

interface FinanceDashboardProps {
  userRole: string;
}

// Categorias inspiradas na planilha oficial 01-Plano Financeiro Bazinga - 2026
const INCOME_CATEGORIES = [
  'Patrocínio',
  'Rifas',
  'Eventos',
  'Apoiadores',
  'Vendas',
  'Doações',
  'Saldo Temporada Anterior',
  'Outros Ganhos'
];

const EXPENSE_CATEGORIES = [
  'Licença de Software',
  'Insumos Robô - Mecânica',
  'Insumos Robô - Eletrônica',
  'Filamento 3D',
  'Equipamento',
  'Gráfica & Organização',
  'Comunicação Visual & Camisas',
  'Eventos & Alimentação',
  'Transporte & Uber',
  'Outras Despesas'
];

const INVESTMENT_CATEGORIES = [
  'Rifa / Arrecadação',
  'Venda de Produtos Bazinga',
  'Evento Beneficente',
  'Outros Investimentos'
];

// Metas Oficiais Biobuzz (Quadro de Metas)
interface GoalMonthData {
  monthName: string;
  monthIndex: number; // 4=Maio, 5=Junho, 6=Julho, 7=Agosto, 8=Setembro, 9=Outubro (0-indexed)
  previsto: {
    rifas: number;
    patrocinio: number;
    eventos: number;
  };
}

const BIOBUZZ_MONTHLY_GOALS: GoalMonthData[] = [
  { monthName: 'Maio', monthIndex: 4, previsto: { rifas: 0, patrocinio: 500, eventos: 0 } },
  { monthName: 'Junho', monthIndex: 5, previsto: { rifas: 3000, patrocinio: 500, eventos: 300 } },
  { monthName: 'Julho', monthIndex: 6, previsto: { rifas: 0, patrocinio: 0, eventos: 300 } },
  { monthName: 'Agosto', monthIndex: 7, previsto: { rifas: 0, patrocinio: 1000, eventos: 400 } },
  { monthName: 'Setembro', monthIndex: 8, previsto: { rifas: 0, patrocinio: 500, eventos: 0 } },
  { monthName: 'Outubro', monthIndex: 9, previsto: { rifas: 3000, patrocinio: 500, eventos: 2000 } }
];

const MACRO_GOALS = {
  total: 12000,
  rifas: 6000,
  patrocinio: 3000,
  eventos: 3000
};

const ALL_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState<'predictions' | 'budget' | 'history'>('predictions');
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form State
  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('');
  const [actualReturn, setActualReturn] = useState<string>('');
  const [status, setStatus] = useState<'open' | 'closed'>('open');

  const canEdit = userRole === 'technician';

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/crud?type=finance');
      const data = await res.json();
      if (data.success && data.finance) {
        if (Array.isArray(data.finance)) {
          setTransactions(data.finance);
        } else if (data.finance.records && Array.isArray(data.finance.records)) {
          setTransactions(data.finance.records);
        }
      }
    } catch (err) {
      console.error('Failed to load finance records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTransactions = async (newTransactions: FinanceTransaction[]) => {
    try {
      await fetch('/api/crud?type=finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: newTransactions })
      });
      setTransactions(newTransactions);
    } catch (err) {
      console.error('Failed to save finance records:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !category) return;

    const newTx: FinanceTransaction = {
      id: editingTx ? editingTx.id : Math.random().toString(36).substring(2, 9),
      type,
      amount: parseFloat(amount),
      description,
      date,
      category,
      ...(type === 'investment' && {
        actualReturn: actualReturn ? parseFloat(actualReturn) : undefined,
        status
      })
    };

    let updatedTx;
    if (editingTx) {
      updatedTx = transactions.map(t => t.id === editingTx.id ? newTx : t);
    } else {
      updatedTx = [newTx, ...transactions];
    }

    saveTransactions(updatedTx);
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro financeiro?')) return;
    const updatedTx = transactions.filter(t => t.id !== id);
    saveTransactions(updatedTx);
  };

  const openModal = (tx?: FinanceTransaction) => {
    if (tx) {
      setEditingTx(tx);
      setType(tx.type);
      setAmount(tx.amount.toString());
      setDescription(tx.description);
      setDate(tx.date);
      setCategory(tx.category);
      setActualReturn(tx.actualReturn?.toString() || '');
      setStatus(tx.status || 'open');
    } else {
      setEditingTx(null);
      setType('income');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(INCOME_CATEGORIES[0]);
      setActualReturn('');
      setStatus('open');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTx(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // General Totals
  const { balance, totalIncome, totalExpense, investmentsProfit } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let invProfit = 0;

    transactions.forEach(tx => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else if (tx.type === 'expense') {
        expense += tx.amount;
      } else if (tx.type === 'investment') {
        expense += tx.amount;
        if (tx.status === 'closed' && tx.actualReturn !== undefined) {
          income += tx.actualReturn;
          invProfit += (tx.actualReturn - tx.amount);
        } else if (tx.status === 'open' && tx.actualReturn !== undefined) {
          income += tx.actualReturn;
          invProfit += (tx.actualReturn - tx.amount);
        } else {
          invProfit -= tx.amount;
        }
      }
    });

    return {
      balance: income - expense,
      totalIncome: income,
      totalExpense: expense,
      investmentsProfit: invProfit
    };
  }, [transactions]);

  // Calculations for Quadro de Metas / Previsões
  const goalsAnalysis = useMemo(() => {
    const monthlyRealized = BIOBUZZ_MONTHLY_GOALS.map(m => {
      let rifasReal = 0;
      let patReal = 0;
      let evReal = 0;

      transactions.forEach(tx => {
        if (!tx.date) return;
        const txDate = new Date(tx.date);
        const txMonth = txDate.getMonth(); // 0-indexed

        if (txMonth === m.monthIndex) {
          const cat = (tx.category || '').toLowerCase();
          const desc = (tx.description || '').toLowerCase();

          if (tx.type === 'income' || (tx.type === 'investment' && tx.actualReturn)) {
            const val = tx.type === 'income' ? tx.amount : (tx.actualReturn || 0);

            if (cat.includes('rifa') || desc.includes('rifa')) {
              rifasReal += val;
            } else if (cat.includes('patroc') || cat.includes('apoiador') || desc.includes('patroc')) {
              patReal += val;
            } else if (cat.includes('evento') || desc.includes('evento') || desc.includes('festa') || desc.includes('sorvete')) {
              evReal += val;
            }
          }
        }
      });

      const totalPrev = m.previsto.rifas + m.previsto.patrocinio + m.previsto.eventos;
      const totalReal = rifasReal + patReal + evReal;
      const pctMonth = totalPrev > 0 ? Math.min(100, Math.round((totalReal / totalPrev) * 100)) : (totalReal > 0 ? 100 : 0);

      return {
        ...m,
        realizado: {
          rifas: rifasReal,
          patrocinio: patReal,
          eventos: evReal,
          total: totalReal
        },
        totalPrevisto: totalPrev,
        percentage: pctMonth
      };
    });

    const totalRealizedRifas = monthlyRealized.reduce((sum, item) => sum + item.realizado.rifas, 0);
    const totalRealizedPatrocinio = monthlyRealized.reduce((sum, item) => sum + item.realizado.patrocinio, 0);
    const totalRealizedEventos = monthlyRealized.reduce((sum, item) => sum + item.realizado.eventos, 0);
    const totalRealizedMacro = totalRealizedRifas + totalRealizedPatrocinio + totalRealizedEventos;

    const macroPercentage = Math.min(100, Math.round((totalRealizedMacro / MACRO_GOALS.total) * 100));
    const rifasPercentage = Math.min(100, Math.round((totalRealizedRifas / MACRO_GOALS.rifas) * 100));
    const patPercentage = Math.min(100, Math.round((totalRealizedPatrocinio / MACRO_GOALS.patrocinio) * 100));
    const evPercentage = Math.min(100, Math.round((totalRealizedEventos / MACRO_GOALS.eventos) * 100));

    return {
      monthlyRealized,
      totalRealizedRifas,
      totalRealizedPatrocinio,
      totalRealizedEventos,
      totalRealizedMacro,
      macroPercentage,
      rifasPercentage,
      patPercentage,
      evPercentage
    };
  }, [transactions]);

  // Annual Budget Flow (Inspired by Orçamento Excel)
  const annualData = useMemo(() => {
    return ALL_MONTHS.map((monthName, index) => {
      let income = 0;
      let expense = 0;

      transactions.forEach(tx => {
        if (!tx.date) return;
        const d = new Date(tx.date);
        if (d.getMonth() === index) {
          if (tx.type === 'income') income += tx.amount;
          else if (tx.type === 'expense') expense += tx.amount;
          else if (tx.type === 'investment') {
            expense += tx.amount;
            if (tx.actualReturn) income += tx.actualReturn;
          }
        }
      });

      return {
        name: monthName.substring(0, 3),
        fullName: monthName,
        Receita: income,
        Despesa: expense,
        Saldo: income - expense
      };
    });
  }, [transactions]);

  // Categories Breakdown
  const categoryExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.type === 'expense' || tx.type === 'investment') {
        const cat = tx.category || 'Outros';
        map[cat] = (map[cat] || 0) + tx.amount;
      }
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Filtered transactions for the History table
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        if (filterType !== 'all' && tx.type !== filterType) return false;
        if (filterCategory !== 'all' && tx.category !== filterCategory) return false;
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase();
          return (
            (tx.description || '').toLowerCase().includes(q) ||
            (tx.category || '').toLowerCase().includes(q) ||
            tx.amount.toString().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCategory, searchTerm]);

  // Unique categories in dataset
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => { if (t.category) set.add(t.category); });
    return Array.from(set);
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-white space-y-4">
        <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-secondary font-medium tracking-wide">Carregando painel financeiro...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header with Title & Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface/40 p-5 sm:p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center text-accent-primary shadow-glow-primary">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Financeiro & Sustentabilidade
              </h2>
              <p className="text-text-secondary text-sm">
                Plano Financeiro Bazinga 2026 & Quadro de Metas Biobuzz
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & New Record Button */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('predictions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'predictions'
                  ? 'bg-accent-primary text-white shadow-glow-primary'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <Target size={16} />
              Previsões & Metas
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'budget'
                  ? 'bg-accent-primary text-white shadow-glow-primary'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <BarChart3 size={16} />
              Orçamento 2026
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-accent-primary text-white shadow-glow-primary'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <Layers size={16} />
              Histórico
            </button>
          </div>

          {canEdit && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent-green hover:bg-[#16a34a] text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95"
            >
              <Plus size={18} />
              <span>Novo Registro</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards (Always visible) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Saldo Atual</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${balance >= 0 ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
              <Wallet size={18} />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black ${balance >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {formatCurrency(balance)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
            <span>Saldo líquido consolidado em caixa</span>
          </div>
        </div>

        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Total Arrecadado</span>
            <div className="w-8 h-8 rounded-xl bg-accent-green/20 text-accent-green flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {formatCurrency(totalIncome)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-accent-green font-semibold">
            <ArrowUpRight size={14} />
            <span>Patrocínios, Rifas e Eventos</span>
          </div>
        </div>

        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Total Despesas</span>
            <div className="w-8 h-8 rounded-xl bg-accent-red/20 text-accent-red flex items-center justify-center">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {formatCurrency(totalExpense)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-accent-red font-semibold">
            <ArrowDownRight size={14} />
            <span>Peças, Softwares e Gráfica</span>
          </div>
        </div>

        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Meta Biobuzz</span>
            <div className="w-8 h-8 rounded-xl bg-accent-secondary/20 text-accent-secondary flex items-center justify-center">
              <Target size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {goalsAnalysis.macroPercentage}%
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-accent-secondary font-semibold">
            <ShieldCheck size={14} />
            <span>{formatCurrency(goalsAnalysis.totalRealizedMacro)} de R$ 12.000</span>
          </div>
        </div>
      </div>

      {/* TAB 1: PREVISÕES & QUADRO DE METAS (BIOBUZZ) */}
      {activeTab === 'predictions' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Banner - Sustentabilidade Financeira */}
          <div className="bg-gradient-to-r from-accent-primary/20 via-surface/60 to-accent-secondary/15 border border-accent-primary/30 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-primary/20 text-accent-primary border border-accent-primary/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                  <Award size={14} /> Quadro de Metas – Biobuzz
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  Sustentabilidade Financeira
                </h3>
                <p className="text-text-secondary text-sm mt-1">
                  Meta Macro Global da Temporada: <strong className="text-accent-primary font-bold">R$ 12.000,00</strong> distribuídos entre Rifas, Patrocínios e Eventos.
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-text-secondary">Arrecadado das Metas</div>
                <div className="text-3xl font-black text-white">
                  {formatCurrency(goalsAnalysis.totalRealizedMacro)}
                  <span className="text-xs text-text-muted font-normal ml-2">/ R$ 12.000,00</span>
                </div>
              </div>
            </div>

            {/* Macro Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-bold text-text-secondary">
                <span>Progresso da Meta Macro</span>
                <span className="text-accent-primary">{goalsAnalysis.macroPercentage}% Concluído</span>
              </div>
              <div className="h-4 w-full bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-700 shadow-glow-primary"
                  style={{ width: `${goalsAnalysis.macroPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3 Pillars Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pilar 1: Rifas */}
            <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold text-lg">
                    🎟️
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">Rifas</h4>
                    <span className="text-xs text-text-secondary">Meta: R$ 6.000,00</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-accent-primary">
                  {goalsAnalysis.rifasPercentage}%
                </span>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Realizado:</span>
                  <span className="font-black text-white">{formatCurrency(goalsAnalysis.totalRealizedRifas)}</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-primary rounded-full transition-all duration-500"
                    style={{ width: `${goalsAnalysis.rifasPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>Previsto Jun: R$ 3.000</span>
                  <span>Previsto Out: R$ 3.000</span>
                </div>
              </div>
            </div>

            {/* Pilar 2: Patrocínios */}
            <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-accent-green/20 text-accent-green flex items-center justify-center font-bold text-lg">
                    🤝
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">Patrocínio</h4>
                    <span className="text-xs text-text-secondary">Meta: R$ 3.000,00</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-accent-green">
                  {goalsAnalysis.patPercentage}%
                </span>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Realizado:</span>
                  <span className="font-black text-white">{formatCurrency(goalsAnalysis.totalRealizedPatrocinio)}</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-green rounded-full transition-all duration-500"
                    style={{ width: `${goalsAnalysis.patPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>Maio, Jun, Set, Out: R$ 500</span>
                  <span>Ago: R$ 1.000</span>
                </div>
              </div>
            </div>

            {/* Pilar 3: Eventos */}
            <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-accent-secondary/20 text-accent-secondary flex items-center justify-center font-bold text-lg">
                    🎪
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">Eventos</h4>
                    <span className="text-xs text-text-secondary">Meta: R$ 3.000,00</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-accent-secondary">
                  {goalsAnalysis.evPercentage}%
                </span>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Realizado:</span>
                  <span className="font-black text-white">{formatCurrency(goalsAnalysis.totalRealizedEventos)}</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-secondary rounded-full transition-all duration-500"
                    style={{ width: `${goalsAnalysis.evPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>Jun/Jul: R$ 300 | Ago: R$ 400</span>
                  <span>Out: R$ 2.000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Goals Matrix (Quadro de Metas - Biobuzz) */}
          <div className="bg-surface/30 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent-primary" />
                  Cronograma Mensal: Previsto vs Realizado
                </h4>
                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                  Acompanhamento mês a mês das metas de Sustentabilidade Financeira (Maio a Outubro)
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-accent-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-primary"></span> Previsto
                </span>
                <span className="flex items-center gap-1.5 text-accent-green ml-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-green"></span> Realizado
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-xs font-bold text-text-secondary uppercase tracking-wider">
                    <th className="p-4">Mês</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Rifas (6.000)</th>
                    <th className="p-4 text-right">Patrocínio (3.000)</th>
                    <th className="p-4 text-right">Eventos (3.000)</th>
                    <th className="p-4 text-right">Total do Mês</th>
                    <th className="p-4 text-center">Atingimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {goalsAnalysis.monthlyRealized.map((m) => (
                    <React.Fragment key={m.monthName}>
                      {/* Previsto Row */}
                      <tr className="bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                        <td rowSpan={2} className="p-4 font-black text-white border-r border-white/5 align-middle">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent-primary"></span>
                            {m.monthName}
                          </div>
                        </td>
                        <td className="p-3 text-xs font-bold text-accent-primary/90 bg-accent-primary/5">
                          Previsto
                        </td>
                        <td className="p-3 text-right font-medium text-white/70">
                          {m.previsto.rifas > 0 ? formatCurrency(m.previsto.rifas) : '-'}
                        </td>
                        <td className="p-3 text-right font-medium text-white/70">
                          {m.previsto.patrocinio > 0 ? formatCurrency(m.previsto.patrocinio) : '-'}
                        </td>
                        <td className="p-3 text-right font-medium text-white/70">
                          {m.previsto.eventos > 0 ? formatCurrency(m.previsto.eventos) : '-'}
                        </td>
                        <td className="p-3 text-right font-black text-accent-primary">
                          {formatCurrency(m.totalPrevisto)}
                        </td>
                        <td rowSpan={2} className="p-4 text-center border-l border-white/5 align-middle">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold ${
                            m.percentage >= 100 
                              ? 'bg-accent-green/20 text-accent-green border border-accent-green/30' 
                              : m.percentage > 0 
                              ? 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30' 
                              : 'bg-white/5 text-text-muted border border-white/10'
                          }`}>
                            {m.percentage}%
                          </span>
                        </td>
                      </tr>

                      {/* Realizado Row */}
                      <tr className="bg-white/[0.025] hover:bg-white/[0.04] border-b border-white/10 transition-colors">
                        <td className="p-3 text-xs font-bold text-accent-green bg-accent-green/5">
                          Realizado
                        </td>
                        <td className="p-3 text-right font-bold text-accent-green">
                          {m.realizado.rifas > 0 ? formatCurrency(m.realizado.rifas) : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-accent-green">
                          {m.realizado.patrocinio > 0 ? formatCurrency(m.realizado.patrocinio) : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-accent-green">
                          {m.realizado.eventos > 0 ? formatCurrency(m.realizado.eventos) : '-'}
                        </td>
                        <td className="p-3 text-right font-black text-accent-green">
                          {formatCurrency(m.realizado.total)}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-white/10 font-black text-white border-t-2 border-white/20">
                    <td colSpan={2} className="p-4 text-accent-secondary uppercase tracking-wider text-xs">
                      Total Realizado
                    </td>
                    <td className="p-4 text-right text-accent-primary">
                      {formatCurrency(goalsAnalysis.totalRealizedRifas)}
                    </td>
                    <td className="p-4 text-right text-accent-green">
                      {formatCurrency(goalsAnalysis.totalRealizedPatrocinio)}
                    </td>
                    <td className="p-4 text-right text-accent-secondary">
                      {formatCurrency(goalsAnalysis.totalRealizedEventos)}
                    </td>
                    <td className="p-4 text-right text-lg text-white">
                      {formatCurrency(goalsAnalysis.totalRealizedMacro)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 rounded-xl bg-accent-primary/20 text-accent-primary font-black text-xs">
                        {goalsAnalysis.macroPercentage}% da Meta
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: ORÇAMENTO 2026 (INSPIRADO NO EXCEL BAZINGA) */}
      {activeTab === 'budget' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Cash Flow Chart */}
          <div className="bg-surface/40 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent-primary" />
                  Fluxo de Caixa Mensal (Janeiro a Dezembro)
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Comparativo de Receitas vs Despesas registradas ao longo do ano
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={annualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '15px' }} />
                  <Bar dataKey="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown por Categorias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gastos por Categoria */}
            <div className="bg-surface/40 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
              <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-accent-secondary" />
                Despesas por Categoria (Orçamento)
              </h3>

              {categoryExpenses.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm">
                  Nenhuma despesa categorizada registrada.
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryExpenses.map((cat, idx) => {
                    const pct = totalExpense > 0 ? Math.round((cat.value / totalExpense) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1.5 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-white/90">{cat.name}</span>
                          <span className="font-black text-white">{formatCurrency(cat.value)} <span className="text-xs text-text-secondary font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Categorias Oficiais do Plano Bazinga */}
            <div className="bg-surface/40 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
              <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-accent-green" />
                Estrutura de Categorias (Plano Bazinga 2026)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                  <span className="font-bold text-accent-green uppercase tracking-wider block">Categorias de Receita</span>
                  <ul className="space-y-1 text-text-secondary">
                    {INCOME_CATEGORIES.map((c, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span> {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                  <span className="font-bold text-accent-red uppercase tracking-wider block">Categorias de Despesa</span>
                  <ul className="space-y-1 text-text-secondary">
                    {EXPENSE_CATEGORIES.map((c, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-red"></span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 3: HISTÓRICO DE TRANSAÇÕES */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-surface/30 p-4 rounded-2xl border border-white/5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por descrição, categoria ou valor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-primary transition-colors"
              >
                <option value="all">Todos os Tipos</option>
                <option value="income">Ganhos</option>
                <option value="expense">Gastos</option>
                <option value="investment">Investimentos</option>
              </select>

              {uniqueCategories.length > 0 && (
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-primary transition-colors"
                >
                  <option value="all">Todas as Categorias</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-surface/30 border border-white/5 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="p-4 whitespace-nowrap">Data</th>
                    <th className="p-4 whitespace-nowrap">Descrição</th>
                    <th className="p-4 whitespace-nowrap">Categoria</th>
                    <th className="p-4 whitespace-nowrap">Tipo</th>
                    <th className="p-4 whitespace-nowrap text-right">Valor</th>
                    <th className="p-4 whitespace-nowrap text-right">Retorno</th>
                    <th className="p-4 whitespace-nowrap text-right">Lucro/Prej</th>
                    {canEdit && <th className="p-4 whitespace-nowrap text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 8 : 7} className="p-10 text-center text-text-secondary text-sm">
                        Nenhum registro financeiro encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => {
                      const isIncome = tx.type === 'income';
                      const isInvestment = tx.type === 'investment';
                      const isExpense = tx.type === 'expense';
                      
                      const profit = isInvestment 
                        ? ((tx.actualReturn || 0) - tx.amount) 
                        : (isIncome ? tx.amount : -tx.amount);

                      return (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-4 text-white/80 whitespace-nowrap text-xs sm:text-sm">
                            {new Date(tx.date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-4 text-white font-medium text-sm">
                            {tx.description}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-white/5 rounded-lg text-xs text-text-secondary border border-white/10">
                              {tx.category}
                            </span>
                          </td>
                          <td className="p-4">
                            {isIncome && <span className="text-accent-green text-xs font-bold bg-accent-green/10 px-2.5 py-1 rounded-lg border border-accent-green/20">Ganho</span>}
                            {isExpense && <span className="text-accent-red text-xs font-bold bg-accent-red/10 px-2.5 py-1 rounded-lg border border-accent-red/20">Gasto</span>}
                            {isInvestment && (
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${tx.status === 'closed' ? 'text-accent-secondary bg-accent-secondary/10 border-accent-secondary/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'}`}>
                                Inv: {tx.status === 'closed' ? 'Fechado' : 'Aberto'}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right font-medium text-white/90 text-sm">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="p-4 text-right text-sm">
                            {isInvestment ? (
                              <span className="font-medium text-white">
                                {tx.actualReturn !== undefined ? formatCurrency(tx.actualReturn) : '-'}
                              </span>
                            ) : (
                              <span className="text-white/20">-</span>
                            )}
                          </td>
                          <td className={`p-4 text-right font-bold text-sm ${profit > 0 ? 'text-accent-green' : profit < 0 ? 'text-accent-red' : 'text-white/50'}`}>
                            {profit > 0 ? '+' : ''}{formatCurrency(profit)}
                          </td>
                          {canEdit && (
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openModal(tx)}
                                  className="p-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-colors"
                                  title="Editar Registro"
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(tx.id)}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                  title="Excluir Registro"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* CREATE / EDIT TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/95 border border-white/10 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-accent-primary" />
                {editingTx ? 'Editar Registro' : 'Novo Registro Financeiro'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-text-muted hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Tipo de Registro
                  </label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value as TransactionType;
                      setType(newType);
                      if (newType === 'income') setCategory(INCOME_CATEGORIES[0]);
                      else if (newType === 'expense') setCategory(EXPENSE_CATEGORIES[0]);
                      else setCategory(INVESTMENT_CATEGORIES[0]);
                    }}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-accent-primary transition-colors appearance-none"
                    required
                  >
                    <option value="income">Ganho / Receita</option>
                    <option value="expense">Gasto / Despesa</option>
                    <option value="investment">Investimento / Rifa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Data
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-accent-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Patrocínio Empresa X / Venda de Rifas Maio"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-accent-primary transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    placeholder="Selecione ou digite..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-accent-primary transition-colors"
                    required
                  />
                  <datalist id="category-suggestions">
                    {type === 'income' && INCOME_CATEGORIES.map(c => <option key={c} value={c} />)}
                    {type === 'expense' && EXPENSE_CATEGORIES.map(c => <option key={c} value={c} />)}
                    {type === 'investment' && INVESTMENT_CATEGORIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-accent-primary transition-colors"
                    required
                  />
                </div>
              </div>

              {type === 'investment' && (
                <div className="p-4 bg-accent-secondary/10 border border-accent-secondary/20 rounded-2xl space-y-3">
                  <h4 className="text-accent-secondary font-bold text-xs uppercase tracking-wider">
                    Detalhes do Investimento / Arrecadação
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'open' | 'closed')}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-accent-secondary"
                      >
                        <option value="open">Aberto (Em andamento)</option>
                        <option value="closed">Fechado (Concluído)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Retorno Obtido (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Opcional"
                        value={actualReturn}
                        onChange={(e) => setActualReturn(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-accent-secondary"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Informe o montante total obtido para calcular o lucro líquido gerado.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-accent-primary hover:bg-accent-secondary text-white rounded-xl transition-all text-sm font-bold shadow-glow-primary active:scale-95"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
