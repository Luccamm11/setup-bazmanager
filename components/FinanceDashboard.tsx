import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  Trash2, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Tag
} from 'lucide-react';

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

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ userRole }) => {
  const { t } = useTranslation(['analytics']);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);

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
        setTransactions(data.finance);
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
    if (!confirm(t('analytics:finance.delete_confirm'))) return;
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
      setCategory('');
      setActualReturn('');
      setStatus('open');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTx(null);
  };

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
        expense += tx.amount; // Initial investment is an expense
        if (tx.status === 'closed' && tx.actualReturn !== undefined) {
          income += tx.actualReturn; // Return is an income
          invProfit += (tx.actualReturn - tx.amount);
        } else if (tx.status === 'open' && tx.actualReturn !== undefined) {
           // If open but has some return already (partial)
           income += tx.actualReturn;
           invProfit += (tx.actualReturn - tx.amount);
        } else {
           invProfit -= tx.amount; // If closed with no return, or open with no return yet
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-white">{t('analytics:finance.loading')}</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-8 h-8 text-accent-primary" />
            {t('analytics:finance.title')}
          </h2>
          <p className="text-text-secondary mt-1">{t('analytics:finance.subtitle')}</p>
        </div>
        {canEdit && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-secondary text-white font-bold rounded-xl transition-colors shadow-glow-primary"
          >
            <Plus size={20} />
            {t('analytics:finance.new_record')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-text-secondary font-semibold">{t('analytics:finance.balance')}</h3>
          </div>
          <p className={`text-3xl font-black ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(balance)}
          </p>
        </div>

        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-text-secondary font-semibold">{t('analytics:finance.income')}</h3>
          </div>
          <p className="text-3xl font-black text-white">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-text-secondary font-semibold">{t('analytics:finance.expense')}</h3>
          </div>
          <p className="text-3xl font-black text-white">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        <div className="bg-surface/50 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-text-secondary font-semibold">{t('analytics:finance.investments')}</h3>
          </div>
          <p className={`text-3xl font-black ${investmentsProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(investmentsProfit)}
          </p>
        </div>
      </div>

      <div className="bg-surface/30 border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-sm font-semibold text-text-secondary">
                <th className="p-4 whitespace-nowrap">{t('analytics:finance.table.date')}</th>
                <th className="p-4 whitespace-nowrap">{t('analytics:finance.table.description')}</th>
                <th className="p-4 whitespace-nowrap">{t('analytics:finance.table.category')}</th>
                <th className="p-4 whitespace-nowrap">{t('analytics:finance.table.type')}</th>
                <th className="p-4 whitespace-nowrap text-right">{t('analytics:finance.table.amount')}</th>
                <th className="p-4 whitespace-nowrap text-right">{t('analytics:finance.table.return')}</th>
                <th className="p-4 whitespace-nowrap text-right">{t('analytics:finance.table.profit')}</th>
                {canEdit && <th className="p-4 whitespace-nowrap text-center">{t('analytics:finance.table.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="p-8 text-center text-text-secondary">
                    {t('analytics:finance.table.no_records')}
                  </td>
                </tr>
              ) : (
                transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => {
                  const isIncome = tx.type === 'income';
                  const isInvestment = tx.type === 'investment';
                  const isExpense = tx.type === 'expense';
                  
                  const profit = isInvestment 
                    ? ((tx.actualReturn || 0) - tx.amount) 
                    : (isIncome ? tx.amount : -tx.amount);

                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-white/80 whitespace-nowrap text-sm">
                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-white font-medium">
                        {tx.description}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-white/5 rounded-md text-xs text-text-secondary border border-white/10">
                          {tx.category}
                        </span>
                      </td>
                      <td className="p-4">
                        {isIncome && <span className="text-green-400 text-sm font-bold bg-green-400/10 px-2 py-1 rounded">{t('analytics:finance.types.income')}</span>}
                        {isExpense && <span className="text-red-400 text-sm font-bold bg-red-400/10 px-2 py-1 rounded">{t('analytics:finance.types.expense')}</span>}
                        {isInvestment && (
                          <span className={`text-sm font-bold px-2 py-1 rounded ${tx.status === 'closed' ? 'text-purple-400 bg-purple-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                            {t('analytics:finance.types.investment_short')}: {tx.status === 'closed' ? t('analytics:finance.status.closed') : t('analytics:finance.status.open')}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-medium text-white/80">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="p-4 text-right">
                        {isInvestment ? (
                          <span className="font-medium text-white">
                            {tx.actualReturn !== undefined ? formatCurrency(tx.actualReturn) : '-'}
                          </span>
                        ) : (
                          <span className="text-white/20">-</span>
                        )}
                      </td>
                      <td className={`p-4 text-right font-bold ${profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-white/50'}`}>
                        {profit > 0 ? '+' : ''}{formatCurrency(profit)}
                      </td>
                      {canEdit && (
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => openModal(tx)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-xs font-bold"
                              >
                                {t('analytics:finance.table.edit')}
                              </button>
                            <button 
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              {editingTx ? t('analytics:finance.edit_record') : t('analytics:finance.new_record')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    {t('analytics:finance.form.type')}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary transition-colors appearance-none"
                    required
                  >
                    <option value="income">{t('analytics:finance.types.income')}s</option>
                    <option value="expense">{t('analytics:finance.types.expense')}s</option>
                    <option value="investment">{t('analytics:finance.types.investment')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    {t('analytics:finance.form.date')}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  {t('analytics:finance.form.description')}
                </label>
                <input
                  type="text"
                  placeholder={t('analytics:finance.form.description_placeholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    {t('analytics:finance.form.category')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('analytics:finance.form.category_placeholder')}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    {t('analytics:finance.form.value')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary transition-colors"
                    required
                  />
                </div>
              </div>

              {type === 'investment' && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-4">
                  <h4 className="text-purple-400 font-semibold text-sm">{t('analytics:finance.form.investment_details')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                        {t('analytics:finance.form.investment_status')}
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'open' | 'closed')}
                        className="w-full bg-black/40 border border-purple-500/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-400 transition-colors appearance-none"
                      >
                        <option value="open">{t('analytics:finance.status.open')} ({t('analytics:finance.status.in_progress')})</option>
                        <option value="closed">{t('analytics:finance.status.closed')} ({t('analytics:finance.status.completed')})</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
                        {t('analytics:finance.form.investment_return')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t('analytics:finance.form.investment_return_placeholder')}
                        value={actualReturn}
                        onChange={(e) => setActualReturn(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-400 transition-colors"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-purple-300/70">
                    {t('analytics:finance.form.investment_hint')}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                >
                  {t('analytics:finance.form.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accent-primary hover:bg-accent-secondary text-white rounded-xl transition-colors font-bold shadow-glow-primary"
                >
                  {t('analytics:finance.form.save')}
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
