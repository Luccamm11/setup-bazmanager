import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PrinterQueueItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Printer, 
    CheckCircle, 
    Clock, 
    Plus, 
    Trash2, 
    Send, 
    AlertCircle, 
    History, 
    BarChart3, 
    Dna, 
    Box, 
    Layers,
    Palette,
    Timer,
    Star,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    TrendingUp,
    ChevronRight,
    Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell,
    AreaChart,
    Area
} from 'recharts';

interface PrinterQueueProps {
  currentUser: string;
}

const PrinterQueue: React.FC<PrinterQueueProps> = ({ currentUser }) => {
  const [queue, setQueue] = useState<PrinterQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'stats' | 'history'>('queue');
  
  // Form State
  const [formData, setFormData] = useState({
      filename: '',
      materialType: 'PLA' as 'ABS' | 'PLA' | 'TPU' | 'PETG',
      materialQuantity: '',
      color: '',
      brand: '',
      estimatedTime: ''
  });

  // Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState({
      quality: 8,
      hasProblem: false,
      problemDescription: ''
  });

  const { t } = useTranslation(['common']);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/printer-queue');
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue || []);
      }
    } catch (err) {
      console.error('Failed to fetch printer queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.filename.trim()) return;

    try {
      const res = await fetch('/api/printer-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...formData, 
            userName: currentUser,
            materialQuantity: Number(formData.materialQuantity) || 0
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormData({
            filename: '',
            materialType: 'PLA',
            materialQuantity: '',
            color: '',
            brand: '',
            estimatedTime: ''
        });
        fetchQueue();
      }
    } catch (err) {
      console.error('Failed to add to queue:', err);
    }
  };

  const handleCompleteRequest = (itemId: string) => {
      setShowFeedbackModal(itemId);
  };

  const handleFinalize = async () => {
    if (!showFeedbackModal) return;

    try {
      const res = await fetch('/api/printer-queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'complete', 
            itemId: showFeedbackModal,
            ...feedbackData
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowFeedbackModal(null);
        setFeedbackData({ quality: 8, hasProblem: false, problemDescription: '' });
        fetchQueue();
      }
    } catch (err) {
      console.error('Failed to finalize print:', err);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este item da fila?')) return;
    try {
      const res = await fetch('/api/printer-queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', itemId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchQueue();
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // Mapped Data
  const activeItems = useMemo(() => queue.filter(item => item.status !== 'completed'), [queue]);
  const historyItems = useMemo(() => queue.filter(item => item.status === 'completed').sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime()), [queue]);
  const currentPrint = useMemo(() => activeItems.find(item => item.status === 'printing'), [activeItems]);
  const pendingItems = useMemo(() => activeItems.filter(item => item.status === 'pending'), [activeItems]);

  // Stats Calculations
  const stats = useMemo(() => {
    const materialUsage = { PLA: 0, ABS: 0, TPU: 0, PETG: 0 };
    const brandRatings: Record<string, { total: number, count: number }> = {};
    const dailyUsage: Record<string, number> = {};
    const problems: any[] = [];

    historyItems.forEach(item => {
        if (item.materialType) materialUsage[item.materialType] += item.materialQuantity || 0;
        
        if (item.brand) {
            if (!brandRatings[item.brand]) brandRatings[item.brand] = { total: 0, count: 0 };
            brandRatings[item.brand].total += item.quality || 0;
            brandRatings[item.brand].count += 1;
        }

        const date = item.completedAt ? item.completedAt.split('T')[0] : '';
        if (date) {
            dailyUsage[date] = (dailyUsage[date] || 0) + (item.materialQuantity || 0);
        }

        if (item.hasProblem) {
            problems.push({
                filename: item.filename,
                problem: item.problemDescription,
                date: date
            });
        }
    });

    const brandList = Object.entries(brandRatings).map(([name, data]) => ({
        name,
        avgQuality: (data.total / data.count).toFixed(1),
        count: data.count
    })).sort((a, b) => Number(b.avgQuality) - Number(a.avgQuality));

    const chartUsage = Object.entries(dailyUsage).map(([date, amount]) => ({
        date: date.split('-').slice(1).reverse().join('/'),
        amount
    })).slice(-7); // Last 7 days

    const materialPieData = Object.entries(materialUsage).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

    return { materialUsage, brandList, chartUsage, materialPieData, problems };
  }, [historyItems]);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10 px-4 sm:px-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-accent-primary/10 rounded-2xl text-accent-primary shadow-glow-primary">
                <Printer size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">Lab 3D Fila</h2>
              <p className="text-sm text-text-secondary font-medium tracking-wide">Gestão de Material e Performance da Bazinga! 73</p>
            </div>
          </div>
        </div>
        
        {/* Tabs Control */}
        <div className="flex p-1.5 bg-primary/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-glass w-fit">
            <button 
                onClick={() => setActiveTab('queue')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'queue' ? 'bg-accent-primary text-white shadow-glow-primary' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
            >
                <Clock size={14} /> Fila Ativa
            </button>
            <button 
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-accent-secondary text-white shadow-glow-secondary' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
            >
                <BarChart3 size={14} /> Estatísticas
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-accent-tertiary text-white shadow-glow-tertiary' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
            >
                <History size={14} /> Histórico
            </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'queue' && (
            <motion.div 
                key="queue"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Left Column: Form & Form */}
                <div className="lg:col-span-2 space-y-8">
                    {/* ENTRAR NA FILA FORM */}
                    <div className="bg-primary/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-glass relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-accent-primary/5 rounded-full filter blur-[50px] pointer-events-none group-hover:bg-accent-primary/10 transition-all duration-700"></div>
                        
                        <h3 className="text-sm font-black text-accent-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <Plus size={18} className="p-1 bg-accent-primary/20 rounded-md" /> 
                            Novo Pedido de Impressão
                        </h3>
                        
                        <form onSubmit={handleAdd} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Nome do Arquivo (.stl / .gcode)</label>
                                    <input 
                                        type="text"
                                        required
                                        value={formData.filename}
                                        onChange={e => setFormData({...formData, filename: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-all font-medium"
                                        placeholder="Ex: Intake_Mechanism_v1.stl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Material</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['PLA', 'ABS', 'TPU', 'PETG'].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setFormData({...formData, materialType: m as any})}
                                                className={`py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border ${formData.materialType === m ? 'bg-accent-primary border-accent-primary text-white shadow-glow-primary' : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-1"><Layers size={10} /> Quantidade (g)</label>
                                    <input 
                                        type="number"
                                        required
                                        value={formData.materialQuantity}
                                        onChange={e => setFormData({...formData, materialQuantity: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-accent-primary transition-all font-bold"
                                        placeholder="0g"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-1"><Palette size={10} /> Cor</label>
                                    <input 
                                        type="text"
                                        required
                                        value={formData.color}
                                        onChange={e => setFormData({...formData, color: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-accent-primary transition-all font-medium"
                                        placeholder="Ex: Azul Bazinga"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-1"><Dna size={10} /> Marca</label>
                                    <input 
                                        type="text"
                                        required
                                        value={formData.brand}
                                        onChange={e => setFormData({...formData, brand: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-accent-primary transition-all font-medium"
                                        placeholder="Ex: 3D Lab"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-1"><Timer size={10} /> Tempo Est.</label>
                                    <input 
                                        type="text"
                                        required
                                        value={formData.estimatedTime}
                                        onChange={e => setFormData({...formData, estimatedTime: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-accent-primary transition-all font-medium"
                                        placeholder="Ex: 2h 45m"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-[0.3em] transition-all shadow-xl hover:shadow-accent-primary/20 active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <Send size={20} />
                                Enviar para a Fila
                            </button>
                        </form>
                    </div>

                    {/* CURRENT PRINT */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Impressão em Curso
                            </h3>
                        </div>

                        <AnimatePresence mode="wait">
                            {currentPrint ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 rounded-[2.5rem] p-8 shadow-glow-green relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full filter blur-[50px] pointer-events-none"></div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                        <div className="flex items-start gap-6">
                                            <div className="p-5 bg-green-500/20 rounded-3xl text-green-400 shadow-xl border border-green-500/30 group-hover:rotate-12 transition-all duration-500">
                                                <Printer size={40} />
                                            </div>
                                            <div>
                                                <h4 className="text-3xl font-black text-white leading-none mb-2">{currentPrint.filename}</h4>
                                                <div className="flex flex-wrap gap-4 text-xs font-bold text-text-secondary">
                                                    <span className="flex items-center gap-1.5"><Box size={14} className="text-green-400" /> {currentPrint.materialQuantity}g {currentPrint.materialType}</span>
                                                    <span className="flex items-center gap-1.5"><Palette size={14} className="text-green-400" /> {currentPrint.color}</span>
                                                    <span className="flex items-center gap-1.5"><Timer size={14} className="text-green-400" /> {currentPrint.estimatedTime}</span>
                                                </div>
                                                <p className="mt-4 text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                                                    RESPONSÁVEL: <span className="text-white bg-green-500/20 px-3 py-1 rounded-full border border-green-500/20">{currentPrint.userName}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => handleCompleteRequest(currentPrint.id)}
                                            className="px-8 py-5 bg-green-500 hover:bg-green-400 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:shadow-green-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0"
                                        >
                                            <CheckCircle2 size={20} />
                                            Finalizar Peça
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="py-20 px-6 bg-white/[0.03] border-2 border-dashed border-white/5 rounded-[2.5rem] text-center flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                                        <Clock className="w-10 h-10 text-text-muted opacity-20" />
                                    </div>
                                    <p className="text-text-secondary font-black text-xl uppercase tracking-widest">{t('printer:standby', 'Impressora em Standby')}</p>
                                    <p className="text-text-muted text-xs mt-2 max-w-xs mx-auto italic">Aguardando o próximo projeto de engenharia da Bazinga!...</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column: Waitlist */}
                <div className="space-y-6">
                    <div className="bg-primary/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-glass space-y-4">
                        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] px-2">Próximos Projetos ({pendingItems.length})</h3>
                        
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence>
                                {pendingItems.map((item, idx) => (
                                    <motion.div 
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] transition-all group cursor-default"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[8px] font-black text-accent-primary uppercase tracking-widest bg-accent-primary/10 px-2 py-0.5 rounded-full">#{idx + 1} na fila</span>
                                            {item.userName === currentUser && (
                                                <button onClick={() => handleDelete(item.id)} className="p-1 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <h5 className="text-white font-black text-sm mb-1 truncate">{item.filename}</h5>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex gap-2">
                                                <span className="text-[8px] font-black text-text-muted border border-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{item.materialType}</span>
                                                <span className="text-[8px] font-black text-text-muted border border-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{item.materialQuantity}g</span>
                                            </div>
                                            <span className="text-[9px] font-black text-white/50 uppercase italic">{item.userName}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {pendingItems.length === 0 && (
                                <div className="text-center py-10 opacity-40">
                                    <p className="text-xs font-bold text-text-muted italic">Fila vazia. Seja o próximo!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dica do Jonas */}
                    <div className="bg-gradient-to-br from-accent-tertiary/10 to-accent-primary/5 border border-accent-tertiary/20 p-6 rounded-[2rem] relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:rotate-12 transition-all duration-500">
                            <Printer size={100} />
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <AlertCircle className="w-6 h-6 text-accent-tertiary shrink-0" />
                            <div>
                                <h4 className="text-[10px] font-black text-accent-tertiary uppercase tracking-widest mb-1">Dica de Engenharia</h4>
                                <p className="text-xs text-text-secondary leading-relaxed font-medium">Lembre de conferir o nivelamento da mesa antes de dar o OK inicial.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}

        {activeTab === 'stats' && (
            <motion.div 
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
            >
                {/* Stats Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-primary/40 p-6 rounded-3xl border border-white/10 shadow-glass flex items-center gap-5">
                        <div className="p-4 bg-accent-primary/10 rounded-2xl text-accent-primary"><Layers size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Gasto (Membro)</p>
                            <h4 className="text-2xl font-black text-white">{Object.values(stats.materialUsage).reduce((a, b) => a + b, 0)}g</h4>
                        </div>
                    </div>
                    <div className="bg-primary/40 p-6 rounded-3xl border border-white/10 shadow-glass flex items-center gap-5">
                        <div className="p-4 bg-accent-secondary/10 rounded-2xl text-accent-secondary"><Box size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Material Favorito</p>
                            <h4 className="text-2xl font-black text-white">{stats.materialPieData.sort((a, b) => b.value - a.value)[0]?.name || '---'}</h4>
                        </div>
                    </div>
                    <div className="bg-primary/40 p-6 rounded-3xl border border-white/10 shadow-glass flex items-center gap-5">
                        <div className="p-4 bg-accent-tertiary/10 rounded-2xl text-accent-tertiary"><Star size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Melhor Marca</p>
                            <h4 className="text-2xl font-black text-white px-2 truncate">{stats.brandList[0]?.name || '---'}</h4>
                        </div>
                    </div>
                    <div className="bg-primary/40 p-6 rounded-3xl border border-white/10 shadow-glass flex items-center gap-5">
                        <div className="p-4 bg-accent-red/10 rounded-2xl text-accent-red"><AlertTriangle size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Taxa de Falha</p>
                            <h4 className="text-2xl font-black text-white">{(historyItems.length ? (stats.problems.length / historyItems.length * 100).toFixed(1) : 0)}%</h4>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Material Usage Over Time */}
                    <div className="lg:col-span-2 bg-primary/40 p-8 rounded-[2.5rem] border border-white/10 shadow-glass h-[400px]">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                            <TrendingUp size={20} className="text-accent-primary" /> Uso de Material (Últimos dias)
                        </h3>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartUsage}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} fontWeight="900" />
                                    <YAxis stroke="#ffffff40" fontSize={10} fontWeight="900" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #ffffff10', fontSize: '12px' }}
                                        itemStyle={{ color: '#3b82f6' }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Material Pie */}
                    <div className="bg-primary/40 p-8 rounded-[2.5rem] border border-white/10 shadow-glass h-[400px]">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">Distribuição</h3>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.materialPieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.materialPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #ffffff10' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4">
                            {stats.materialPieData.map((d, index) => (
                                <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-black uppercase text-text-muted">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    {d.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Brands Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-primary/40 p-8 rounded-[2.5rem] border border-white/10 shadow-glass">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3 italic">
                             Análise de Marcas (Custo x Qualidade)
                        </h3>
                        <div className="space-y-4">
                            {stats.brandList.map((brand, idx) => (
                                <div key={brand.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-accent-tertiary">#{idx + 1}</div>
                                        <div>
                                            <p className="text-sm font-black text-white">{brand.name}</p>
                                            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">{brand.count} impressões</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-accent-tertiary">
                                            <Star size={14} className="fill-accent-tertiary" />
                                            <span className="text-lg font-black">{brand.avgQuality}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {stats.brandList.length === 0 && <p className="text-center py-10 text-xs text-text-muted italic">Dados insuficientes para análise de mercado.</p>}
                        </div>
                    </div>

                    <div className="bg-primary/40 p-8 rounded-[2.5rem] border border-white/10 shadow-glass">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3 text-accent-red">
                             Log de Problemas & Falhas
                        </h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {stats.problems.map((p, i) => (
                                <div key={i} className="p-4 bg-accent-red/5 border border-accent-red/20 rounded-2xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="text-xs font-black text-white uppercase tracking-wider">{p.filename}</h5>
                                        <span className="text-[8px] font-black text-accent-red uppercase tracking-widest bg-accent-red/10 px-2 py-0.5 rounded-full">{p.date}</span>
                                    </div>
                                    <p className="text-xs text-text-secondary line-clamp-2 italic">" {p.problem} "</p>
                                </div>
                            ))}
                            {stats.problems.length === 0 && <p className="text-center py-10 text-xs text-text-muted italic">Nenhum problema crítico registrado pela equipe.</p>}
                        </div>
                    </div>
                </div>
            </motion.div>
        )}

        {activeTab === 'history' && (
            <motion.div 
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {historyItems.map(item => (
                        <div key={item.id} className="bg-primary/40 p-6 rounded-3xl border border-white/5 hover:border-white/20 transition-all group overflow-hidden relative">
                             {/* Badge de Qualidade */}
                             <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/5 rotate-12 flex items-end justify-start p-3">
                                 <span className="text-xl font-black text-white/20 group-hover:text-accent-primary transition-colors">{item.quality}/10</span>
                             </div>

                             <div className="flex gap-4 items-start mb-6">
                                 <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-text-muted group-hover:text-accent-primary transition-colors">
                                     <Printer size={24} />
                                 </div>
                                 <div className="min-w-0">
                                     <h5 className="font-black text-white truncate text-lg leading-tight">{item.filename}</h5>
                                     <p className="text-[10px] text-text-muted uppercase tracking-widest">{item.userName} • {new Date(item.completedAt || '').toLocaleDateString('pt-BR')}</p>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                 <div className="p-3 bg-white/5 rounded-xl">
                                     <p className="text-[8px] font-black text-text-muted uppercase tracking-wider flex items-center gap-1"><Layers size={10} /> Material</p>
                                     <p className="text-[10px] font-black text-white">{item.materialQuantity}g {item.materialType}</p>
                                 </div>
                                 <div className="p-3 bg-white/5 rounded-xl">
                                     <p className="text-[8px] font-black text-text-muted uppercase tracking-wider flex items-center gap-1"><Palette size={10} /> Cor</p>
                                     <p className="text-[10px] font-black text-white">{item.color}</p>
                                 </div>
                                 <div className="p-3 bg-white/5 rounded-xl">
                                     <p className="text-[8px] font-black text-text-muted uppercase tracking-wider flex items-center gap-1"><Dna size={10} /> Marca</p>
                                     <p className="text-[10px] font-black text-white truncate">{item.brand}</p>
                                 </div>
                                 <div className="p-3 bg-white/5 rounded-xl">
                                     <p className="text-[8px] font-black text-text-muted uppercase tracking-wider flex items-center gap-1"><Timer size={10} /> Duração</p>
                                     <p className="text-[10px] font-black text-white">{item.estimatedTime}</p>
                                 </div>
                             </div>

                             {item.hasProblem && (
                                 <div className="mt-4 p-3 bg-accent-red/10 border border-accent-red/20 rounded-xl flex gap-3">
                                     <AlertTriangle className="text-accent-red shrink-0" size={14} />
                                     <p className="text-[10px] text-accent-red font-medium line-clamp-2 italic">{item.problemDescription}</p>
                                 </div>
                             )}
                        </div>
                    ))}
                    {historyItems.length === 0 && <div className="col-span-full py-20 text-center text-text-muted italic opacity-50">Nenhum registro no histórico de impressão.</div>}
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* FEEDBACK MODAL */}
      <AnimatePresence>
          {showFeedbackModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-primary border border-white/10 rounded-[3rem] p-10 max-w-lg w-full shadow-2xl space-y-8 relative overflow-hidden"
                  >
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary" />
                      
                      <div className="text-center space-y-2">
                          <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Avaliar Impressão</h3>
                          <p className="text-text-secondary text-sm font-medium">Como ficou a peça final? Seus dados ajudam a equipe Bazinga! a escolher os melhores materiais.</p>
                      </div>

                      <div className="space-y-6">
                            {/* Quality Slider (0-10) */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-text-muted uppercase tracking-widest flex justify-between">
                                    <span>Qualidade Final</span>
                                    <span className="text-accent-primary">{feedbackData.quality}/10</span>
                                </label>
                                <div className="flex gap-2">
                                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                        <button 
                                            key={num}
                                            onClick={() => setFeedbackData({...feedbackData, quality: num})}
                                            className={`flex-1 h-10 rounded-lg text-xs font-black transition-all border ${feedbackData.quality === num ? 'bg-accent-primary border-accent-primary text-white shadow-glow-primary' : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10'}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Problem Toggle */}
                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-[1.5rem]">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className={feedbackData.hasProblem ? "text-accent-red" : "text-text-muted"} size={20} />
                                    <span className="text-sm font-bold text-white">Ocorreu algum problema?</span>
                                </div>
                                <button 
                                    onClick={() => setFeedbackData({...feedbackData, hasProblem: !feedbackData.hasProblem})}
                                    className={`w-14 h-8 rounded-full transition-all relative ${feedbackData.hasProblem ? 'bg-accent-red' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${feedbackData.hasProblem ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Problem Description */}
                            <AnimatePresence>
                                {feedbackData.hasProblem && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2 overflow-hidden"
                                    >
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Descreva o problema e a solução</label>
                                        <textarea 
                                            value={feedbackData.problemDescription}
                                            onChange={e => setFeedbackData({...feedbackData, problemDescription: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-accent-red transition-all h-24 scrollbar-none"
                                            placeholder="Ex: Warping no canto esquerdo. Resolvido aumentando temperaturá da mesa para 60ºC."
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                      </div>

                      <div className="flex gap-4">
                          <button 
                            onClick={() => setShowFeedbackModal(null)}
                            className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-text-muted hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                          >
                              Cancelar
                          </button>
                          <button 
                            onClick={handleFinalize}
                            className="flex-[2] py-4 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-glow-primary active:scale-[0.98]"
                          >
                              Salvar e Finalizar
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default PrinterQueue;
