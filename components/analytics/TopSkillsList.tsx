import React from 'react';
import { Skill, Realm } from '../../types';
import { BrainCircuit, Heart, Zap, Sparkles } from 'lucide-react';

const realmConfig = {
  [Realm.Mind]: { icon: <BrainCircuit size={18} />, color: "bg-accent-primary" },
  [Realm.Body]: { icon: <Heart size={18} />, color: "bg-accent-red" },
  [Realm.Creation]: { icon: <Zap size={18} />, color: "bg-accent-secondary" },
  [Realm.Spirit]: { icon: <Sparkles size={18} />, color: "bg-accent-tertiary" },
  [Realm.Creativity]: { icon: <Sparkles size={18} />, color: "bg-accent-primary" },
  [Realm.Finance]: { icon: <Sparkles size={18} />, color: "bg-accent-green" },
  [Realm.Social]: { icon: <Sparkles size={18} />, color: "bg-accent-primary" },
  [Realm.Meta]: { icon: <Sparkles size={18} />, color: "bg-text-secondary" },
};

interface TopSkillsListProps {
    skills: { [id: string]: Skill };
}

const TopSkillsList: React.FC<TopSkillsListProps> = ({ skills }) => {
    const topSkills = Object.values(skills)
        .sort((a: Skill, b: Skill) => {
            if (b.level !== a.level) {
                return b.level - a.level;
            }
            return b.xp - a.xp;
        })
        .slice(0, 5);

    return (
        <div className="space-y-3">
            {topSkills.map((skill: Skill) => {
                 const config = realmConfig[skill.realm];
                 const progress = (skill.xp / skill.xpToNextLevel) * 100;
                return (
                    <div key={skill.id} className="bg-background p-3 rounded-lg border border-border-color">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-2">
                                {config.icon}
                                <span className="font-semibold text-text-primary">{skill.name}</span>
                            </div>
                            <span className="font-bold text-lg text-text-primary">Lvl {skill.level}</span>
                        </div>
                        <div className="w-full bg-border-color rounded-full h-1.5">
                            <div className={`${config.color} h-1.5 rounded-full`} style={{ width: `${progress}%` }}></div>
                        </div>
                         <div className="text-right text-xs text-text-secondary mt-1">
                            {skill.xp} / {skill.xpToNextLevel} XP
                        </div>
                    </div>
                )
            })}
        </div>
    )
};

export default TopSkillsList;