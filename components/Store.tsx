import React from 'react';
import { StoreItem } from '../types';
import { DollarSign, ShoppingCart, Zap, Shield, Gift, RefreshCw, ChevronsUp, PlusCircle, Edit, Trash2 } from 'lucide-react';

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
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || 'Utility';
    if (!acc[category]) {
        acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<StoreItem['category'], StoreItem[]>);
  
  const categoryOrder: StoreItem['category'][] = ['Reward', 'Buff', 'Utility'];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">System Store</h2>
        <p className="text-text-secondary mt-1">Acquire buffs, utilities, and real-world rewards.</p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
            <div className="inline-flex items-center space-x-2 bg-accent-green/10 text-accent-green font-semibold px-4 py-2 rounded-full">
                <DollarSign className="w-5 h-5" />
                <span>{userCredits} Credits Available</span>
            </div>
             <button onClick={onAddItem} className="flex items-center space-x-2 bg-accent-green hover:bg-accent-green-hover text-white font-semibold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                <PlusCircle size={18} />
                <span>Create Item with AI</span>
            </button>
        </div>
      </div>

      {categoryOrder.map(category => {
        const categoryItems = itemsByCategory[category];
        if (!categoryItems || categoryItems.length === 0) return null;

        return (
            <div key={category}>
                <h3 className="text-xl sm:text-2xl font-semibold text-text-secondary mb-4 border-b-2 border-border-color pb-2 capitalize">{category}s</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryItems.map(item => {
                    const canAfford = userCredits >= item.cost;
                    return (
                        <div key={item.id} className="relative group bg-primary p-6 rounded-lg border border-border-color flex flex-col justify-between">
                        {item.isGenerated && (
                             <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEditItem(item)} className="p-1.5 bg-border-color hover:bg-accent-primary rounded-full text-white"><Edit size={12} /></button>
                                <button onClick={() => onDeleteItem(item.id)} className="p-1.5 bg-border-color hover:bg-accent-red rounded-full text-white"><Trash2 size={12} /></button>
                            </div>
                        )}
                        <div>
                            <div className="flex items-start space-x-4">
                            <div className="bg-background p-3 rounded-lg">
                                {itemIcons[item.effect.type] || itemIcons['DEFAULT']}
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-text-primary">{item.name}</h3>
                                <div className="flex items-center space-x-1 text-accent-green font-semibold mt-1">
                                <DollarSign className="w-4 h-4" />
                                <span>{item.cost} Credits</span>
                                </div>
                            </div>
                            </div>
                            <p className="text-text-secondary mt-4 text-sm">{item.description}</p>
                        </div>
                        <button 
                            onClick={() => onBuyItem(item)}
                            disabled={!canAfford}
                            className={`w-full mt-6 py-2 px-4 rounded-lg font-bold transition-colors ${
                            canAfford 
                            ? 'bg-accent-primary text-white hover:bg-opacity-80' 
                            : 'bg-border-color text-text-muted cursor-not-allowed'
                            }`}
                        >
                            {canAfford ? 'Acquire' : 'Insufficient Credits'}
                        </button>
                        </div>
                    )
                    })}
                </div>
            </div>
        )
      })}
    </div>
  );
};

export default Store;