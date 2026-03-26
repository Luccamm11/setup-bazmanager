import React from 'react';
import { StoreItem } from '../types';
import { DollarSign, ShoppingCart, Zap, Shield, Gift, RefreshCw, ChevronsUp, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface StoreProps {
  items: StoreItem[];
  onBuyItem: (item: StoreItem) => void;
  userCredits: number;
  onAddItem: () => void;
  onEditItem: (item: StoreItem) => void;
  onDeleteItem: (itemId: string) => void;
}

const itemIcons: { [key: string]: React.ReactNode } = {
    'XP_BOOST': <Zap className="w-8 h-8 text-accent-secondary" />,
    'STREAK_SAVER': <Shield className="w-8 h-8 text-accent-primary" />,
    'QUEST_REROLL': <RefreshCw className="w-8 h-8 text-accent-green" />,
    'INSTANT_STREAK': <ChevronsUp className="w-8 h-8 text-accent-secondary" />,
    'REAL_WORLD_REWARD': <Gift className="w-8 h-8 text-accent-tertiary" />,
    'DEFAULT': <ShoppingCart className="w-8 h-8 text-text-secondary" />
};

const Store: React.FC<StoreProps> = ({ items, onBuyItem, userCredits, onAddItem, onEditItem, onDeleteItem }) => {
  const { t } = useTranslation('store');

  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || 'Utility';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<StoreItem['category'], StoreItem[]>);
  
  const categoryOrder: StoreItem['category'][] = ['Reward', 'Buff', 'Utility'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="text-center group">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 drop-shadow-md group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">{t('store')}</h2>
        <p className="text-text-secondary">{t('store_subtitle')}</p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
            <div className="inline-flex items-center space-x-2 bg-accent-green/10 border border-accent-green/20 text-accent-green font-black px-6 py-2.5 rounded-xl shadow-glow-green">
                <DollarSign className="w-5 h-5" />
                <span>{userCredits} CR</span>
            </div>
             <button onClick={onAddItem} className="flex items-center space-x-2 bg-gradient-to-r from-accent-tertiary to-purple-500 hover:from-purple-500 hover:to-accent-tertiary text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-glow-tertiary hover:shadow-glow-primary active:scale-95 border border-white/10">
                <PlusCircle size={18} />
                <span>{t('add_store_item')}</span>
            </button>
        </div>
      </div>

      {categoryOrder.map(category => {
        const categoryItems = itemsByCategory[category];
        if (!categoryItems || categoryItems.length === 0) return null;

        return (
            <motion.div variants={itemVariants} key={category} className="bg-white/[0.02] p-6 sm:p-8 rounded-3xl border border-white/5 shadow-glass">
                <h3 className="text-2xl font-black text-text-primary mb-6 flex items-center gap-4 capitalize">
                    {t(`category.${category}`)}
                    <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryItems.map(item => {
                    const canAfford = userCredits >= item.cost;
                    return (
                        <motion.div 
                            key={item.id} 
                            className={`relative group bg-primary/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 flex flex-col justify-between transition-all duration-300 shadow-sm ${canAfford ? 'hover:shadow-[0_8px_30px_rgba(34,197,94,0.15)] hover:border-accent-green/30' : 'opacity-80 grayscale-[0.2]'}`}
                            whileHover={canAfford ? { y: -5, scale: 1.02 } : {}}
                        >
                        {item.isGenerated && (
                             <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button onClick={() => onEditItem(item)} className="p-2 bg-black/40 hover:bg-accent-primary rounded-xl text-white backdrop-blur-sm border border-white/5"><Edit size={14} /></button>
                                <button onClick={() => onDeleteItem(item.id)} className="p-2 bg-black/40 hover:bg-accent-red rounded-xl text-white backdrop-blur-sm border border-white/5"><Trash2 size={14} /></button>
                            </div>
                        )}
                        <div className="relative z-0">
                            <div className="flex items-start space-x-4">
                            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform duration-300">
                                {itemIcons[item.effect.type] || itemIcons['DEFAULT']}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-text-primary tracking-tight leading-tight mb-1">{item.name}</h3>
                                <div className="flex items-center space-x-1 text-accent-green font-black bg-accent-green/10 inline-flex px-2 py-0.5 rounded-lg border border-accent-green/20">
                                <DollarSign className="w-4 h-4" />
                                <span>{item.cost} CR</span>
                                </div>
                            </div>
                            </div>
                            <p className="text-text-secondary mt-5 text-sm leading-relaxed">{item.description}</p>
                        </div>
                        <button 
                            onClick={() => onBuyItem(item)}
                            disabled={!canAfford}
                            className={`w-full mt-6 py-3 px-4 rounded-xl font-black tracking-wide transition-all z-10 relative ${
                            canAfford 
                            ? 'bg-white/5 text-white hover:bg-accent-primary hover:text-white border border-white/10 hover:border-accent-primary hover:shadow-glow-primary' 
                            : 'bg-black/20 text-text-muted border border-white/5 cursor-not-allowed'
                            }`}
                        >
                            {canAfford ? t('buy') : t('insufficient_credits')}
                        </button>
                        </motion.div>
                    )
                    })}
                </div>
            </motion.div>
        )
      })}
    </motion.div>
  );
};

export default Store;