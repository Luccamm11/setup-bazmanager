import React from 'react';
import { RANKS, TOPIC_XP_MAP } from '../constants';
import { Dna, TrendingUp, Zap, Award, Target, Info } from 'lucide-react';

const SystemMechanics: React.FC = () => {
  return (
    <div className="space-y-8 pb-10">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-3">
          <Dna className="text-accent-primary" />
          System Mechanics
        </h2>
        <p className="text-text-secondary mt-1">Foundational algorithms of the Awakening System.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Leveling Logic */}
        <section className="bg-primary/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-glass">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent-primary">
            <TrendingUp size={20} />
            Leveling Algorithm
          </h3>
          <div className="space-y-4">
            <div className="bg-background/50 p-4 rounded-xl border border-white/5">
              <p className="text-sm font-bold text-text-primary mb-1">XP Threshold Formula</p>
              <code className="text-accent-secondary text-xs">Next_XP = Math.floor(Current_XP_Threshold * 1.5)</code>
              <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                The energy required to reach the next stage of awakening increases exponentially, reflecting the increasing complexity of transcendence.
              </p>
            </div>
            <div className="bg-background/50 p-4 rounded-xl border border-white/5">
              <p className="text-sm font-bold text-text-primary mb-3">Ranking Hierarchy</p>
              <div className="space-y-2">
                {RANKS.map((rank, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary">LVL {rank.level}+</span>
                    <span className="font-bold text-accent-tertiary">{rank.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Reward Mechanics */}
        <section className="bg-primary/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-glass">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent-secondary">
            <Zap size={20} />
            Reward Multipliers
          </h3>
          <div className="space-y-4">
            <div className="bg-background/50 p-4 rounded-xl border border-white/5">
              <p className="text-sm font-bold text-text-primary mb-2">Base Quest Rewards</p>
              <div className="space-y-2 text-xs">
                 {Object.entries(TOPIC_XP_MAP).map(([difficulty, xp]) => (
                   <div key={difficulty} className="flex justify-between">
                     <span className="text-text-secondary">{difficulty} Topic</span>
                     <span className="font-bold text-accent-primary">{xp} XP</span>
                   </div>
                 ))}
              </div>
            </div>
            <div className="bg-background/50 p-4 rounded-xl border border-white/5">
              <p className="text-sm font-bold text-text-primary mb-2">Streak Bonus</p>
              <p className="text-xs text-text-secondary leading-relaxed font-medium">
                Every consecutive day of quest completion increases your <span className="text-accent-secondary">Daily Sync Bonus</span> by <span className="text-white">1%</span>, up to a maximum defined by the system core (currently capped at 50%).
              </p>
            </div>
          </div>
        </section>

        {/* Skill Development */}
        <section className="bg-primary/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-glass flex-1">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent-tertiary">
            <Target size={20} />
            Skill Dynamics
          </h3>
          <div className="bg-background/50 p-4 rounded-xl border border-white/5">
            <p className="text-sm font-bold text-text-primary mb-2">XP Scaling Factor</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Each unique skill has an inherent <span className="text-accent-tertiary italic">XP Scale</span>. Complex skills like <span className="text-white">Machine Learning</span> or <span className="text-white">Microprocessors</span> require more cognitive load (1.5x - 2.5x base XP) to level up.
            </p>
          </div>
        </section>

        {/* System Protocols */}
        <section className="bg-primary/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-glass">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent-green">
            <Info size={20} />
            Protocols
          </h3>
          <div className="space-y-3">
             <div className="flex items-start gap-3">
               <div className="p-1 rounded bg-accent-red/10 text-accent-red mt-1"><Award size={14}/></div>
               <div>
                  <p className="text-xs font-bold text-white">Failure Penalty</p>
                  <p className="text-[10px] text-text-muted">Standard penalty for missed deadlines is 25% of the XP/Credit reward.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <div className="p-1 rounded bg-accent-tertiary/10 text-accent-tertiary mt-1"><Zap size={14}/></div>
               <div>
                  <p className="text-xs font-bold text-white">Arc Influences</p>
                  <p className="text-[10px] text-text-muted">Active Story Arcs can modify specific realm gains and system behavior.</p>
               </div>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemMechanics;
