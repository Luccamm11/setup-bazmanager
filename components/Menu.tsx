import React from 'react';
import { Store, Landmark, BarChart2, BookOpen, Award, Terminal } from 'lucide-react';

type View = 'store' | 'staking' | 'system_log' | 'analytics' | 'story_log' | 'badges';

interface MenuProps {
  onNavigate: (view: View) => void;
}

const Menu: React.FC<MenuProps> = ({ onNavigate }) => {
  // FIX: Explicitly typed the array to ensure item.view is of type `View`, not `string`.
  const menuItems: { view: View, label: string, icon: React.ElementType, description: string }[] = [
    { view: 'store', label: 'Store', icon: Store, description: 'Acquire buffs and rewards.' },
    { view: 'staking', label: 'Staking', icon: Landmark, description: 'Stake credits for passive boosts.' },
    { view: 'analytics', label: 'Analytics', icon: BarChart2, description: 'Track your progress.' },
    { view: 'story_log', label: 'Story Log', icon: BookOpen, description: 'Review your journey.' },
    { view: 'badges', label: 'Badges', icon: Award, description: 'View your achievements.' },
    { view: 'system_log', label: 'System Log', icon: Terminal, description: 'See system messages.' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">System Menu</h2>
        <p className="text-text-secondary mt-1">Access additional features and logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className="bg-primary p-6 rounded-lg border border-border-color text-left hover:bg-border-color/50 hover:border-accent-primary transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <Icon className="w-8 h-8 text-accent-primary" />
                <div>
                  <h3 className="text-xl font-bold text-text-primary">{item.label}</h3>
                  <p className="text-sm text-text-secondary">{item.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Menu;
