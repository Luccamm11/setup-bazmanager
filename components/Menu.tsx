import React from 'react';
import { Store as LucideStore, Landmark, BarChart2, BookOpen, Award, Terminal, BookText, Timer, Dna, BotMessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type View = 'store' | 'staking' | 'system_log' | 'analytics' | 'story_log' | 'badges' | 'journal' | 'timer' | 'system_mechanics' | 'chatbot';

interface MenuProps {
  onNavigate: (view: View) => void;
}

const Menu: React.FC<MenuProps> = ({ onNavigate }) => {
  const { t } = useTranslation('common');

  const menuItems: { view: View; labelKey: string; descKey: string; icon: React.ElementType }[] = [
    { view: 'timer',            labelKey: 'nav.timer',            descKey: 'nav.timer',            icon: Timer },
    { view: 'chatbot',          labelKey: 'nav.chatbot',          descKey: 'nav.chatbot',          icon: BotMessageSquare },
    { view: 'system_mechanics', labelKey: 'nav.system_mechanics', descKey: 'nav.system_mechanics', icon: Dna },
    { view: 'store',            labelKey: 'nav.store',            descKey: 'nav.store',            icon: LucideStore },
    { view: 'staking',          labelKey: 'nav.staking',          descKey: 'nav.staking',          icon: Landmark },
    { view: 'analytics',        labelKey: 'nav.analytics',        descKey: 'nav.analytics',        icon: BarChart2 },
    { view: 'story_log',        labelKey: 'nav.story_log',        descKey: 'nav.story_log',        icon: BookOpen },
    { view: 'badges',           labelKey: 'nav.badges',           descKey: 'nav.badges',           icon: Award },
    { view: 'journal',          labelKey: 'nav.journal',          descKey: 'nav.journal',          icon: BookText },
    { view: 'system_log',       labelKey: 'nav.system_log',       descKey: 'nav.system_log',       icon: Terminal },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">{t('nav.more')}</h2>
        <p className="text-text-secondary mt-1">{t('nav.more')}</p>
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
                  <h3 className="text-xl font-bold text-text-primary">{t(item.labelKey)}</h3>
                  <p className="text-sm text-text-secondary">{t(item.descKey)}</p>
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