import React from 'react';
import { StoryLogEntry } from '../types';
import { BookMarked } from 'lucide-react';
import { motion } from 'framer-motion';

interface StoryLogProps {
  entries: StoryLogEntry[];
}

const StoryLog: React.FC<StoryLogProps> = ({ entries }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <motion.div 
        className="space-y-10 max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
      <div className="text-center group">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 drop-shadow-md group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">Story Log</h2>
        <p className="text-text-secondary">Chronicles of your journey and past achievements.</p>
      </div>
      
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {entries.map((entry, index) => (
          <motion.div 
            key={entry.id} 
            variants={itemVariants}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
          >
            {/* Timeline Marker */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-accent-tertiary shadow-[0_0_15px_rgba(163,113,247,0.5)] md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shrink-0">
                <BookMarked className="w-4 h-4 text-white" />
            </div>
            
            {/* Content Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-primary/40 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/5 shadow-glass hover:shadow-[0_8px_30px_rgba(163,113,247,0.15)] hover:border-accent-tertiary/30 transition-all duration-300">
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4 gap-2 sm:gap-0">
                <h3 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight leading-tight group-hover:text-accent-tertiary transition-colors">{entry.title}</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 shrink-0">{entry.date}</span>
              </div>
              <p className="text-text-secondary leading-relaxed whitespace-pre-line font-medium text-[15px]">{entry.narrative}</p>
            </div>
          </motion.div>
        ))}
        {entries.length === 0 && (
             <motion.div 
                variants={itemVariants}
                className="text-center py-20 px-6 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 backdrop-blur-sm max-w-2xl mx-auto"
            >
                <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-accent-tertiary/20 blur-xl rounded-full"></div>
                    <BookMarked className="w-16 h-16 text-text-muted relative z-10" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">The Pages are Blank</h3>
                <p className="text-text-secondary max-w-sm mx-auto leading-relaxed">Your story is yet to be written. Complete major quests and a narrative of your week will appear here.</p>
            </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default StoryLog;