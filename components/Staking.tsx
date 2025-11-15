import React, { useState } from 'react';
import { User, StoreItem } from '../types';
import { Landmark, Shield, TrendingUp, Coins, ArrowRight, ArrowLeft, Lock, Zap, HelpCircle, Flame } from 'lucide-react';

interface StakingProps {
  user: User;
  storeItems: StoreItem[];
  onStakeCredits: (amount: number) => void;
  onWithdrawCredits: (amount: number) => void;
  onStakeBuff: (itemId: string) => void;
}

const CREDIT_STAKING_UNLOCK_LEVEL = 7;
const CREDIT_STAKING_LIMIT_MULTIPLIER = 100;
const CREDIT_STAKING_BOOST_DIVISOR = 20000;

const Staking: React.FC<StakingProps> = ({ user, storeItems, onStakeCredits, onWithdrawCredits, onStakeBuff }) => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const stakingLimit = user.level_overall * CREDIT_STAKING_LIMIT_MULTIPLIER;
  const boostPercentage = (user.staked_credits / CREDIT_STAKING_BOOST_DIVISOR) * 100;
  const creditProgressPercentage = stakingLimit > 0 ? (user.staked_credits / stakingLimit) * 100 : 0;
  const dailySyncBonus = user.streaks.daily_streak * 1;


  const handleStake = () => {
    const amount = parseInt(stakeAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      onStakeCredits(amount);
      setStakeAmount('');
    }
  };
  
  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      onWithdrawCredits(amount);
      setWithdrawAmount('');
    }
  };

  const inventoryBuffs = user.inventory
    .map(invItem => {
        const storeItem = storeItems.find(si => si.id === invItem.itemId);
        if (storeItem && storeItem.category === 'Buff') {
            return { ...storeItem, quantity: invItem.quantity };
        }
        return null;
    })
    .filter(item => item !== null) as (StoreItem & { quantity: number })[];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center justify-center gap-3">
            <Landmark className="w-8 h-8"/>
            System Core
        </h2>
        <p className="text-text-secondary mt-1">Stake Credits for passive boosts or infuse Buffs for permanent upgrades.</p>
      </div>
      
      {/* Daily Core Sync */}
      <div className="bg-primary p-6 rounded-lg border border-border-color">
         <h3 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-3"><Flame className="text-accent-primary"/>Daily Core Sync</h3>
         <p className="text-sm text-text-secondary mb-4">A permanent XP boost that grows with your daily quest completion streak.</p>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
             <div className="bg-background p-4 rounded-lg border border-border-color">
                 <h4 className="text-sm font-semibold text-text-secondary flex items-center justify-center gap-2"><TrendingUp size={16}/>Current Daily Streak</h4>
                 <p className="text-3xl font-bold text-accent-primary">{user.streaks.daily_streak} Days</p>
             </div>
             <div className="bg-background p-4 rounded-lg border border-border-color">
                 <h4 className="text-sm font-semibold text-text-secondary flex items-center justify-center gap-2"><Zap size={16}/>Total XP Bonus</h4>
                 <p className="text-3xl font-bold text-accent-green">+{dailySyncBonus}%</p>
             </div>
         </div>
         <p className="text-xs text-text-muted mt-4 text-center">This bonus stacks infinitely and applies on top of all other multipliers. There is no upper limit.</p>
      </div>

      {/* Credit Staking Section */}
      <div className="bg-primary p-6 rounded-lg border border-border-color">
         <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-3"><Coins className="text-accent-secondary"/>Credit Staking</h3>
        {user.level_overall < CREDIT_STAKING_UNLOCK_LEVEL ? (
            <div className="text-center p-4 rounded-lg bg-background border border-border-color">
                 <Lock className="w-8 h-8 mx-auto text-text-muted mb-2" />
                 <p className="text-lg text-accent-primary font-semibold">
                    Reach Level {CREDIT_STAKING_UNLOCK_LEVEL} to unlock Credit Staking.
                </p>
            </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-background p-4 rounded-lg border border-border-color">
                    <h3 className="text-sm font-semibold text-text-secondary flex items-center justify-center gap-2"><Shield size={16}/>Staked Credits</h3>
                    <p className="text-2xl font-bold text-text-primary">{user.staked_credits.toLocaleString()}</p>
                </div>
                <div className="bg-background p-4 rounded-lg border border-border-color">
                    <h3 className="text-sm font-semibold text-text-secondary flex items-center justify-center gap-2"><TrendingUp size={16}/>Passive XP Boost</h3>
                    <p className="text-2xl font-bold text-accent-green">+{ boostPercentage.toFixed(3) }%</p>
                </div>
                <div className="bg-background p-4 rounded-lg border border-border-color">
                    <h3 className="text-sm font-semibold text-text-secondary flex items-center justify-center gap-2"><Coins size={16}/>Credits Available</h3>
                    <p className="text-2xl font-bold text-accent-secondary">{user.wallet.credits.toLocaleString()}</p>
                </div>
            </div>
            <div className="mt-6">
                <div className="flex justify-between items-center text-sm text-text-primary mb-1">
                    <span>Staking Limit</span>
                    <span>{user.staked_credits.toLocaleString()} / {stakingLimit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-background rounded-full h-4 border border-border-color p-0.5">
                    <div className="bg-gradient-to-r from-accent-tertiary to-accent-primary h-full rounded-full transition-all duration-500 ease-out text-center text-xs text-white font-bold flex items-center justify-center" style={{ width: `${creditProgressPercentage}%` }}>
                       {creditProgressPercentage > 10 && `${creditProgressPercentage.toFixed(0)}%`}
                    </div>
                </div>
                 <p className="text-xs text-text-muted mt-1 text-center">Your staking limit increases as you level up.</p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-background p-4 rounded-lg border border-border-color">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2"><ArrowRight className="text-accent-green"/>Stake Credits</h3>
                    <div className="flex items-center space-x-2">
                        <input type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} placeholder="Amount" className="w-full bg-primary border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"/>
                        <button onClick={handleStake} className="bg-accent-green text-white font-bold py-2 px-4 rounded">Stake</button>
                    </div>
                </div>
                <div className="bg-background p-4 rounded-lg border border-border-color">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2"><ArrowLeft className="text-accent-secondary"/>Withdraw Credits</h3>
                    <div className="flex items-center space-x-2">
                        <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount" className="w-full bg-primary border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-secondary"/>
                        <button onClick={handleWithdraw} className="bg-accent-secondary text-background font-bold py-2 px-4 rounded">Withdraw</button>
                    </div>
                </div>
            </div>
          </>
        )}
      </div>

       {/* Buff Staking Section */}
       <div className="bg-primary p-6 rounded-lg border border-border-color">
            <h3 className="text-xl font-bold text-text-primary mb-1 flex items-center gap-3"><Shield className="text-accent-tertiary" />Buff Infusion</h3>
            <p className="text-sm text-text-secondary mb-4">Permanently consume buffs from your inventory to gain stacking passive bonuses.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Available to Stake */}
                <div>
                    <h4 className="font-semibold text-text-secondary mb-2">Buffs in Inventory</h4>
                    <div className="space-y-2 p-3 bg-background border border-border-color rounded-lg min-h-[100px]">
                        {inventoryBuffs.length > 0 ? inventoryBuffs.map(item => {
                            const buffStakingLimit = Math.floor(user.level_overall / 10) + 1;
                            const currentStakedCount = user.stakedBuffs[item.id] || 0;
                            const canStake = currentStakedCount < buffStakingLimit;
                            return (
                                <div key={item.id} className="flex items-center justify-between bg-primary border border-border-color p-2 rounded">
                                    <div>
                                        <p className="font-semibold text-text-primary">{item.name}</p>
                                        <p className="text-xs text-text-secondary">In Inventory: {item.quantity}</p>
                                    </div>
                                    <button 
                                      onClick={() => onStakeBuff(item.id)}
                                      disabled={!canStake}
                                      className="bg-accent-tertiary text-white disabled:bg-border-color disabled:cursor-not-allowed text-xs font-bold py-1 px-3 rounded">
                                        Infuse
                                    </button>
                                </div>
                            )
                        }) : <p className="text-xs text-text-muted text-center pt-4">No buffs in inventory to stake.</p>}
                    </div>
                </div>
                 {/* Current Staked Bonuses */}
                 <div>
                    <h4 className="font-semibold text-text-secondary mb-2">Permanent Bonuses</h4>
                     <div className="space-y-2 p-3 bg-background border border-border-color rounded-lg min-h-[100px]">
                        {Object.keys(user.stakedBuffs).length > 0 ? (Object.entries(user.stakedBuffs) as [string, number][]).map(([itemId, count]) => {
                             const itemInfo = storeItems.find(i => i.id === itemId);
                             if (!itemInfo) return null;
                             const buffStakingLimit = Math.floor(user.level_overall / 10) + 1;
                             const multiplier = Math.pow(2, count);
                             return (
                                <div key={itemId} className="bg-primary border border-border-color p-2 rounded">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-text-primary">{itemInfo.name}</p>
                                        <p className="text-xs text-accent-primary font-mono bg-border-color/50 px-1.5 py-0.5 rounded">
                                            {count}/{buffStakingLimit}
                                        </p>
                                    </div>
                                    <p className="text-xs text-accent-green font-semibold">
                                        Effect: {multiplier}x XP Boost (+{((multiplier - 1) * 100).toFixed(0)}%)
                                        {itemInfo.effect.realms && itemInfo.effect.realms.length > 0 ? ` on ${itemInfo.effect.realms.join(' & ')}` : ' on All'}
                                    </p>
                                </div>
                             )
                        }) : <p className="text-xs text-text-muted text-center pt-4">No buffs infused yet.</p>}
                    </div>
                </div>
            </div>
            <div className="text-xs text-text-muted mt-3 p-2 bg-background border border-border-color rounded-lg flex items-start space-x-2">
                <HelpCircle size={28} className="flex-shrink-0" />
                <div>
                    <span className="font-bold">How it works:</span> Each infused buff provides a permanent, exponentially stacking bonus (2x, 4x, 8x...). The number of times you can infuse a single type of buff increases with your overall level.
                </div>
            </div>
       </div>
    </div>
  );
};

export default Staking;