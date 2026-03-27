import React from 'react';
import { Store as LucideStore, Landmark, BarChart2, BookOpen, Award, Terminal, BookText, Timer, Dna, BotMessageSquare, Users, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserRole } from '../types';

type View = 'store' | 'staking' | 'system_log' | 'analytics' | 'story_log' | 'badges' | 'journal' | 'timer' | 'system_mechanics' | 'chatbot' | 'team_missions' | 'tech_dashboard';

interface MenuProps {
  onNavigate: (view: View) => void;
  userRole: UserRole;
}

const Menu: React.FC<MenuProps> = ({ onNavigate, userRole }) => {
  const { t } = useTranslation('common');

  const menuItems: { view: View; label: string; desc: string; icon: React.ElementType; techOnly?: boolean }[] = [
    { view: 'team_missions',    label: 'Missões da Equipe',  desc: 'Missões atribuídas pelos técnicos', icon: Users },
    ...(userRole === 'technician' ? [
      { view: 'tech_dashboard' as View, label: 'Painel do Técnico', desc: 'Gerencie missões e membros', icon: Shield, techOnly: true },
    ] : []),
    { view: 'timer',            label: t('nav.timer'),            desc: t('nav.timer'),            icon: Timer },
    { view: 'chatbot',          label: t('nav.chatbot'),          desc: t('nav.chatbot'),          icon: BotMessageSquare },
    { view: 'system_mechanics', label: t('nav.system_mechanics'), desc: t('nav.system_mechanics'), icon: Dna },
    { view: 'store',            label: t('nav.store'),            desc: t('nav.store'),            icon: LucideStore },
    { view: 'staking',          label: t('nav.staking'),          desc: t('nav.staking'),          icon: Landmark },
    { view: 'analytics',        label: t('nav.analytics'),        desc: t('nav.analytics'),        icon: BarChart2 },
    { view: 'story_log',        label: t('nav.story_log'),        desc: t('nav.story_log'),        icon: BookOpen },
    { view: 'badges',           label: t('nav.badges'),           desc: t('nav.badges'),           icon: Award },
    { view: 'journal',          label: t('nav.journal'),          desc: t('nav.journal'),          icon: BookText },
    { view: 'system_log',       label: t('nav.system_log'),       desc: t('nav.system_log'),       icon: Terminal },
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
          const isTechItem = item.techOnly;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`p-6 rounded-lg border text-left transition-all duration-200 ${
                isTechItem
                  ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 hover:border-orange-500/40 hover:from-orange-500/15 hover:to-red-500/15'
                  : item.view === 'team_missions'
                  ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40 hover:from-blue-500/15 hover:to-cyan-500/15'
                  : 'bg-primary border-border-color hover:bg-border-color/50 hover:border-accent-primary'
              }`}
            >
              <div className="flex items-center space-x-4">
                <Icon className={`w-8 h-8 ${isTechItem ? 'text-orange-400' : item.view === 'team_missions' ? 'text-blue-400' : 'text-accent-primary'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-text-primary">{item.label}</h3>
                    {isTechItem && (
                      <span className="text-[8px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-black uppercase tracking-wider">Técnico</span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">{item.desc}</p>
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