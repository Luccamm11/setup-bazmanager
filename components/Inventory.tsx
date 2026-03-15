import React from 'react';
import { InventoryItem, StoreItem } from '../types';
import { ShoppingCart, Zap, Shield, Briefcase, RefreshCw, ChevronsUp, Gift, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InventoryProps {
  inventory: InventoryItem[];
  storeItems: StoreItem[];
  onUseItem: (itemId: string) => void;
}

const itemIcons: { [key: string]: React.ReactNode } = {
    'XP_BOOST': <Zap className="w-8 h-8 text-accent-secondary" />,
    'STREAK_SAVER': <Shield className="w-8 h-8 text-accent-primary" />,
    'QUEST_REROLL': <RefreshCw className="w-8 h-8 text-accent-green" />,
    'INSTANT_STREAK': <ChevronsUp className="w-8 h-8 text-accent-secondary" />,
    'REAL_WORLD_REWARD': <Gift className="w-8 h-8 text-accent-tertiary" />,
    'DEFAULT': <ShoppingCart className="w-8 h-8 text-text-secondary" />
};

const Inventory: React.FC<InventoryProps> = ({ inventory, storeItems, onUseItem }) => {
  const storeItemsMap = new Map<string, StoreItem>(storeItems.map(item => [item.id, item]));

  const populatedInventory = inventory.reduce(
    (acc: (StoreItem & { quantity: number })[], invItem) => {
      const storeItem = storeItemsMap.get(invItem.itemId);
      if (storeItem) {
        acc.push({ ...storeItem, quantity: invItem.quantity });
      }
      return acc;
    },
    [] as (StoreItem & { quantity: number })[]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 drop-shadow-md group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">Inventory</h2>
        <p className="text-text-secondary">Your acquired items and utilities.</p>
      </div>

      <AnimatePresence>
      {populatedInventory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {populatedInventory.map(item => (
            <motion.div 
              variants={itemVariants} 
              key={item.id} 
              className="bg-primary/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-white/10 transition-all duration-300"
              whileHover={{ y: -5 }}
              layout
            >
              <div className="flex items-start space-x-4">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  {itemIcons[item.effect.type] || itemIcons['DEFAULT']}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary tracking-tight">{item.name}</h3>
                  <div className="flex items-center text-xs font-bold uppercase tracking-widest text-text-secondary bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 mt-2 w-fit">
                    Qty <span className="ml-2 text-white text-sm">{item.quantity}</span>
                  </div>
                </div>
              </div>
              <p className="text-text-secondary mt-5 text-sm flex-grow leading-relaxed">{item.description}</p>
              {(item.category === 'Buff' || item.category === 'Utility') && (
                 <button 
                    onClick={() => onUseItem(item.id)}
                    className="w-full mt-6 flex items-center justify-center space-x-2 bg-gradient-to-r from-accent-primary to-blue-500 hover:from-blue-500 hover:to-accent-primary text-white font-black tracking-wide py-3 px-4 rounded-xl transition-all shadow-glow-primary hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-white/10 active:scale-95"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Activate Sequence</span>
                  </button>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-24 px-6 bg-white/5 rounded-3xl border border-dashed border-white/10 max-w-2xl mx-auto backdrop-blur-sm"
        >
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-accent-tertiary/20 blur-xl rounded-full"></div>
            <Briefcase className="w-20 h-20 text-text-muted relative z-10" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Vault Empty</h3>
          <p className="text-text-secondary max-w-sm mx-auto leading-relaxed">Your inventory is currently empty. Visit the System Store to acquire buffs, utilities, and rewards using your credits.</p>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Inventory;