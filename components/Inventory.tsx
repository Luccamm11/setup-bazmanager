import React from 'react';
import { InventoryItem, StoreItem } from '../types';
import { ShoppingCart, Zap, Shield, Briefcase, RefreshCw, ChevronsUp, Gift, PlayCircle } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">Inventory</h2>
        <p className="text-text-secondary mt-1">Your acquired items and utilities.</p>
      </div>

      {populatedInventory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {populatedInventory.map(item => (
            <div key={item.id} className="bg-primary p-6 rounded-lg border border-border-color flex flex-col">
              <div className="flex items-start space-x-4">
                <div className="bg-background p-3 rounded-lg">
                  {itemIcons[item.effect.type] || itemIcons['DEFAULT']}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary">{item.name}</h3>
                  <div className="flex items-center text-sm font-semibold text-text-primary bg-border-color/50 px-2 py-1 rounded-full mt-2 w-fit">
                    Quantity: <span className="ml-1.5 text-white">{item.quantity}</span>
                  </div>
                </div>
              </div>
              <p className="text-text-secondary mt-4 text-sm flex-grow">{item.description}</p>
              {(item.category === 'Buff' || item.category === 'Utility') && (
                 <button 
                    onClick={() => onUseItem(item.id)}
                    className="w-full mt-4 flex items-center justify-center space-x-2 bg-accent-green hover:bg-accent-green-hover text-white font-bold py-2 px-4 rounded transition-transform transform hover:scale-105"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Activate</span>
                  </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 bg-primary rounded-lg border border-border-color">
          <Briefcase className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <p className="text-lg text-text-secondary">Your inventory is empty.</p>
          <p className="text-text-muted mt-2">Visit the Store to acquire items and buffs.</p>
        </div>
      )}
    </div>
  );
};

export default Inventory;