import React from 'react';
import { JournalEntry, Quest } from '../types';
import { BookText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestCard from './QuestCard';

interface JournalProps {
  journalEntries: JournalEntry[];
  quests: Quest[];
  onCompleteQuest: (questId: string) => void;
  currentDate: Date;
}

const Journal: React.FC<JournalProps> = ({ journalEntries, quests, onCompleteQuest, currentDate }) => {
  const sortedEntries = [...journalEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
        className="space-y-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
      <div className="text-center group">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 drop-shadow-md group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">Diário & AARs</h2>
        <p className="text-text-secondary">Reflexões sobre encontros passados e planos para crescimento futuro.</p>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <AnimatePresence>
        {sortedEntries.length > 0 ? sortedEntries.map(entry => {
          const checklistQuests = entry.generatedChecklistQuestIds
            .map(id => quests.find(q => q.id === id))
            .filter((q): q is Quest => !!q);

          return (
            <motion.div 
                key={entry.id} 
                variants={itemVariants}
                layout
                className="bg-primary/40 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/5 shadow-glass hover:shadow-[0_8px_30_rgba(88,166,255,0.15)] hover:border-accent-primary/30 transition-all duration-300"
            >
              <div className="border-b border-white/10 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2 sm:gap-0">
                  <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-accent-primary shadow-sm">
                          <BookText size={20} />
                      </div>
                      AAR: {entry.majorGoalTitle}
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-widest text-text-muted bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 shrink-0">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap font-medium text-[15px]">{entry.reflectionText}</p>
              </div>
              <div>
                <h4 className="text-lg font-black text-white mb-4 tracking-tight">Sequência de Melhoria</h4>
                {checklistQuests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {checklistQuests.map(quest => (
                      <QuestCard key={quest.id} quest={quest} onComplete={onCompleteQuest} currentDate={currentDate} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                      <p className="text-sm text-text-muted font-bold tracking-wide italic">Todas as melhorias sequenciais foram concluídas.</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        }) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 px-6 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center backdrop-blur-sm max-w-2xl mx-auto"
          >
            <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-accent-primary/20 blur-xl rounded-full"></div>
                <BookText className="w-16 h-16 text-text-muted relative z-10" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Arquivos Vazios</h3>
            <p className="text-text-secondary max-w-sm mx-auto leading-relaxed">Seu diário ainda não possui registros. Use o terminal do Sistema para registrar seu After Action Report após completar metas principais.</p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Journal;
