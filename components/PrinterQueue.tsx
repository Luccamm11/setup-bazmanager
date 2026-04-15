import React, { useState, useEffect, useCallback } from 'react';
import { PrinterQueueItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, CheckCircle, Clock, Plus, Trash2, Send, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrinterQueueProps {
  currentUser: string;
}

const PrinterQueue: React.FC<PrinterQueueProps> = ({ currentUser }) => {
  const [queue, setQueue] = useState<PrinterQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filename, setFilename] = useState('');
  const { t } = useTranslation(['common']);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/printer-queue');
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue);
      }
    } catch (err) {
      console.error('Failed to fetch printer queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename.trim()) return;

    try {
      const res = await fetch('/api/printer-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: filename.trim(), userName: currentUser }),
      });
      const data = await res.json();
      if (data.success) {
        setFilename('');
        fetchQueue();
      }
    } catch (err) {
      console.error('Failed to add to queue:', err);
    }
  };

  const handleComplete = async (itemId: string) => {
    try {
      const res = await fetch('/api/printer-queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', itemId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchQueue();
      }
    } catch (err) {
      console.error('Failed to complete print:', err);
    }
  };

  const currentPrint = queue.find(item => item.status === 'printing');
  const pendingItems = queue.filter(item => item.status === 'pending');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
             <Printer className="w-8 h-8 text-accent-primary shadow-glow-primary" />
             {t('printer:title', 'Fila de Impressão 3D')}
          </h2>
          <p className="text-sm text-text-secondary mt-1">{t('printer:desc', 'Gerencie a ordem de uso das nossas impressoras para as peças da Bazinga!.')}</p>
        </div>
        <button 
           onClick={fetchQueue}
           disabled={isLoading}
           className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-text-secondary hover:text-white transition-all disabled:opacity-50"
        >
          {isLoading ? t('states:syncing') : t('buttons:refresh', 'Atualizar Fila')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form & Current */}
        <div className="lg:col-span-2 space-y-8">
          {/* Add Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-glass relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full mix-blend-screen filter blur-[40px] pointer-events-none"></div>
            
            <h3 className="text-xs font-black text-accent-primary uppercase tracking-[0.2em] mb-4 relative z-10">{t('printer:add_to_queue', 'Entrar na Fila')}</h3>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 relative z-10">
              <input 
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder={t('printer:filename_placeholder', 'Ex: Suporte_Bazinga_v2.stl')}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all font-medium text-sm"
              />
              <button 
                type="submit"
                disabled={!filename.trim()}
                className="bg-accent-primary hover:bg-accent-primary/90 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg hover:shadow-accent-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                <Plus size={18} />
                {t('printer:confirm', 'Confirmar')}
              </button>
            </form>
            <div className="flex items-center gap-2 mt-4 text-[10px] text-text-muted bg-white/5 p-2 rounded-lg border border-white/5 relative z-10">
                <Send className="w-3 h-3 text-accent-primary shadow-glow-primary" />
                <span>{t('printer:instruction', 'Instrução: Envie o arquivo para o Jonas no WhatsApp e insira o nome acima.')}</span>
            </div>
          </motion.div>

          {/* Current Printing Section */}
          <div className="space-y-4">
             <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2 flex items-center justify-between">
                <span>{t('printer:printing_now', 'Impressão em Curso')}</span>
                {currentPrint && <span className="flex h-2 w-2 relative self-center"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
             </h3>
             
             <AnimatePresence mode="wait">
               {currentPrint ? (
                 <motion.div 
                   key={currentPrint.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.05 }}
                   className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 rounded-3xl p-8 group shadow-glow-green"
                 >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full mix-blend-screen filter blur-[40px] pointer-events-none group-hover:bg-green-500/20 transition-all"></div>
                   
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                     <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 shadow-lg group-hover:scale-110 transition-transform duration-500">
                         <Printer className="w-8 h-8" />
                       </div>
                       <div>
                         <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1 opacity-80">{t('printer:printing_now', 'Imprimindo Agora')}</p>
                         <h4 className="text-2xl font-black text-white leading-tight">{currentPrint.filename}</h4>
                         <p className="text-sm text-text-secondary mt-1 font-medium">{t('printer:responsible', 'Responsável')}: <span className="text-white">{currentPrint.userName === currentUser ? t('common:you', 'Você') : currentPrint.userName}</span></p>
                       </div>
                     </div>
                     
                     <button
                       onClick={() => handleComplete(currentPrint.id)}
                       className="px-8 py-4 bg-green-500 hover:bg-green-400 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:shadow-green-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                     >
                       <CheckCircle size={20} />
                       {t('printer:finish', 'Finalizar')}
                     </button>
                   </div>
                 </motion.div>
               ) : (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="py-16 px-6 bg-white/[0.03] border border-dashed border-white/10 rounded-3xl text-center flex flex-col items-center justify-center"
                 >
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-text-muted opacity-30" />
                    </div>
                    <p className="text-text-secondary font-bold text-lg">{t('printer:standby', 'Impressora em Standby')}</p>
                    <p className="text-text-muted text-xs mt-1 max-w-xs mx-auto px-4 italic">{t('printer:standby_desc', 'Nenhum projeto está sendo impresso no momento. Entre na fila e peça o OK do Jonas!')}</p>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Waitlist */}
        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">
              {t('printer:next_in_queue', 'Próximos na Fila')} ({pendingItems.length})
           </h3>
           <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
             <AnimatePresence>
               {pendingItems.map((item, index) => (
                 <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                   transition={{ delay: index * 0.05 }}
                   className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-all"
                 >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted group-hover:text-accent-primary transition-colors shrink-0">
                        <span className="font-black text-xs">#{index + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-white font-bold text-sm truncate">{item.filename}</h5>
                        <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider">{item.userName === currentUser ? t('common:you', 'Você') : item.userName}</p>
                      </div>
                    </div>
                    {item.userName === currentUser && (
                      <button 
                        onClick={() => handleComplete(item.id)}
                        title={t('buttons:delete')}
                        className="p-2 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all transition-colors"
                      >
                         <Trash2 size={16} />
                      </button>
                    )}
                 </motion.div>
               ))}
             </AnimatePresence>

             {pendingItems.length === 0 && (
               <div className="text-center py-10 px-4 bg-white/2 rounded-2xl border border-white/5 border-dashed">
                 <p className="text-text-muted text-xs italic font-medium opacity-50">{t('printer:empty_queue', 'Nenhum pedido pendente.')}</p>
               </div>
             )}
           </div>

           {/* Tip Section */}
           <div className="bg-accent-tertiary/10 border border-accent-tertiary/20 rounded-2xl p-4 flex gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-accent-tertiary/5 rounded-full filter blur-[20px] pointer-events-none"></div>
              <AlertCircle className="w-5 h-5 text-accent-tertiary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-accent-tertiary uppercase tracking-widest leading-none mb-1.5">{t('printer:tip_title', 'Dica B-LEED')}</p>
                <p className="text-[10px] text-text-secondary mt-1 leading-relaxed antialiased">
                    {t('printer:tip_desc', 'O item Prioridade 3D na Loja permite pular para o topo da fila instantaneamente!')}
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PrinterQueue;
