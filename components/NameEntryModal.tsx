import React, { useState } from 'react';
import { UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface NameEntryModalProps {
  onSave: (name: string) => void;
}

const NameEntryModal: React.FC<NameEntryModalProps> = ({ onSave }) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-primary/80 border border-white/10 rounded-2xl p-8 w-full max-w-md text-center shadow-glass relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary via-accent-tertiary to-accent-primary animate-pulse-slow" />
        
        <div className="w-20 h-20 mx-auto bg-accent-primary/10 rounded-full flex items-center justify-center mb-6 border border-accent-primary/20 shadow-glow-primary">
          <UserCircle className="w-12 h-12 text-accent-primary" />
        </div>
        
        <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">Welcome, Awakened</h1>
        <p className="text-text-secondary mb-8 font-medium">
          Identify yourself to initialize the Level-Up system. How shall the world know you?
        </p>
        
        <div className="space-y-4">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Enter your name"
            className="w-full bg-background/50 text-white rounded-xl py-4 px-6 border border-white/5 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 text-center text-xl font-bold placeholder:text-text-muted transition-all"
          />
          
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full bg-gradient-to-r from-accent-primary to-accent-tertiary text-white font-black py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale shadow-glow-primary"
          >
            <span className="uppercase tracking-widest text-lg">Start Your Journey</span>
          </button>
        </div>
        
        <p className="text-xs text-text-muted mt-6 font-medium italic">
          "The first step towards greatness is choosing your name."
        </p>
      </motion.div>
    </div>
  );
};

export default NameEntryModal;
