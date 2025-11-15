import React from 'react';
import { User, Badge, MajorGoal } from '../types';
import { ICON_MAP } from '../constants';
import { PlusCircle, Edit, Trash2, Swords, Star, DollarSign } from 'lucide-react';

interface BadgesProps {
  user: User;
  allBadges: Badge[];
  onAddBadge: () => void;
  onEditBadge: (badge: Badge) => void;
  onDeleteBadge: (badgeId: string) => void;
}

const Badges: React.FC<BadgesProps> = ({ user, allBadges, onAddBadge, onEditBadge, onDeleteBadge }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">Badges & Achievements</h2>
        <p className="text-text-secondary mt-1">A record of your major accomplishments.</p>
         <div className="flex justify-center gap-4 mt-4">
            <button onClick={onAddBadge} className="flex items-center space-x-2 bg-accent-green hover:bg-accent-green-hover text-white font-semibold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                <PlusCircle size={18} />
                <span>New Badge</span>
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {allBadges.map(badge => {
          const isUnlocked = user.unlockedBadges.includes(badge.id);
          const Icon = ICON_MAP[badge.icon] || ICON_MAP.Award;
          const isCustom = badge.isGenerated;
          
          return (
            <div 
              key={badge.id} 
              className={`
                relative group bg-primary p-6 rounded-lg border border-border-color
                flex flex-col items-center justify-center text-center 
                transition-all duration-300
                ${isUnlocked ? 'border-accent-secondary/50' : 'opacity-60 grayscale'}
              `}
            >
              {isCustom && (
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditBadge(badge)} className="p-1.5 bg-border-color hover:bg-accent-primary rounded-full text-white"><Edit size={12} /></button>
                    <button onClick={() => onDeleteBadge(badge.id)} className="p-1.5 bg-border-color hover:bg-accent-red rounded-full text-white"><Trash2 size={12} /></button>
                </div>
              )}
              <div 
                className={`
                  w-20 h-20 rounded-full flex items-center justify-center mb-4
                  ${isUnlocked ? 'bg-accent-secondary/10' : 'bg-border-color/50'}
                `}
              >
                <Icon 
                  className={`w-10 h-10 ${isUnlocked ? 'text-accent-secondary' : 'text-text-muted'}`} 
                />
              </div>
              <h3 className={`font-bold text-lg ${isUnlocked ? 'text-text-primary' : 'text-text-secondary'}`}>
                {badge.name}
              </h3>
              <p className="text-xs text-text-secondary mt-1">{badge.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">Hall of Conquests</h2>
        {user.completedMajorGoals && user.completedMajorGoals.length > 0 ? (
            <div className="max-w-3xl mx-auto space-y-4">
                {user.completedMajorGoals.map(goal => (
                    <div key={goal.id} className="bg-primary p-4 rounded-lg border border-border-color flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <Swords className="w-8 h-8 text-accent-secondary flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-lg text-text-primary">{goal.title}</h4>
                                <p className="text-sm text-text-secondary">{goal.type}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm flex-shrink-0">
                            <div className="flex items-center space-x-1 text-accent-secondary font-semibold">
                                <Star size={16} /> <span>{goal.xp_reward.toLocaleString()} XP</span>
                            </div>
                            <div className="flex items-center space-x-1 text-accent-green font-semibold">
                                <DollarSign size={16} /> <span>{goal.credit_reward.toLocaleString()} CR</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-10 px-4 bg-primary rounded-lg border border-border-color max-w-3xl mx-auto">
                <Swords className="w-12 h-12 mx-auto text-text-muted mb-4" />
                <p className="text-text-secondary">No bosses defeated yet.</p>
                <p className="text-text-muted mt-2">Complete Major Goals to see your victories recorded here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Badges;