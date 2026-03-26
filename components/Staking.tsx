import React, { useState } from 'react';
import { User, StoreItem } from '../types';
import { Landmark, Shield, TrendingUp, Coins, ArrowRight, ArrowLeft, Lock, Zap, HelpCircle, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('store');
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
            {t('staking_section.title')}
        </h2>
        <p className="text-text-secondary mt-1">{t('staking_section.subtitle')}</p>
      </div>
      
      {/* Daily Core Sync */}
      <div className="bg-primary p-6 rounded-lg border border-border-color">
         <h3 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-3"><Flame className="text-accent-primary"/>{t('staking_section.daily_sync')}</h3>
         <p className="text-sm text-text-secondary mb-4">{t('staking_section.daily_sync_desc')}</p>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
             <div className="bg-background p-4 rounded-lg border border-border-color">
                 <h4 className="text-sm font-semibold text-text-secondary flex items-center justify-center gap-2"><TrendingUp size={16}/>{t('staking_section.current_streak')}</h4>
                 <p className="text-3xl font-bold text-accent-primary">{user.streaks.daily_streak} {t('common:time.days')}</p>
             </div>
             <div className="bg-background p-4 rounded-lg border border-border-color">
                 <h4 className="text-sm font-semibold text-text-secondary flex items-center justify-center gap-2"><Zap size={16}/>{t('staking_section.total_xp_bonus')}</h4>
                 <p className="text-3xl font-bold text-accent-green">+{dailySyncBonus}%</p>
             </div>
         </div>
         <p className="text-xs text-text-muted mt-4 text-center">{t('staking_section.infinite_bonus_note')}</p>
      </div>

      {/* Credit Staking Section */}
      <div className="bg-primary p-6 rounded-lg border border-border-color">
         <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-3"><Coins className="text-accent-secondary"/>{t('staking_section.credit_staking')}</h3>
        {user.level_overall < CREDIT_STAKING_UNLOCK_LEVEL ? (
            <div className="text-center p-4 rounded-lg bg-background border border-border-color">
                 <Lock className="w-8 h-8 mx-auto text-text-muted mb-2" />
                 <p className="text-lg text-accent-primary font-semibold">
                    {t('staking_section.unlock_msg', { level: CREDIT_STAKING_UNLOCK_LEVEL })}
                </p>
            </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-background p-4 rounded-lg border border-border-color">
                    <h3 className="text-sm font-semibold text-text-secondary flex items-center justify-center gap-2"><Shield size={16}/>{t('staking_section.staked_credits')}</h3>
                    <p className="text-2xl font-bold text-text-primary">{user.staked_credits.toLocaleString()}</p>
                </div>
                <div className="bg-background p-4 rounded-lg border border-border-color">
                    <h3 className="text-sm font-semibold text-text-secondary flex items-center justify-center gap-2"><TrendingUp size={16}/>{t('staking_section.passive_boost')}</h3>
                    <p className="text-2xl font-bold text-accent-green">+{ boostPercentage.toFixed(3) }%</p>
                </div>
                <div className="bg-background p-4 rounded-lg border border-border-color">
                    <h3 className="text-sm font-semibold text-text-secondary flex items-center justify-center gap-2"><Coins size={16}/>{t('staking_section.credits_available')}</h3>
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
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2"><ArrowRight className="text-accent-green"/>{t('staking_section.stake')}</h3>
                    <div className="flex items-center space-x-2">
                        <input type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} placeholder={t('staking_section.amount_placeholder')} className="w-full bg-primary border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"/>
                        <button onClick={handleStake} className="bg-accent-green text-white font-bold py-2 px-4 rounded">{t('staking_section.stake_btn')}</button>
                    </div>
                </div>
                <div className="bg-background p-4 rounded-lg border border-border-color">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2"><ArrowLeft className="text-accent-secondary"/>{t('staking_section.withdraw')}</h3>
                    <div className="flex items-center space-x-2">
                        <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder={t('staking_section.amount_placeholder')} className="w-full bg-primary border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-secondary"/>
                        <button onClick={handleWithdraw} className="bg-accent-secondary text-background font-bold py-2 px-4 rounded">{t('staking_section.withdraw_btn')}</button>
                    </div>
                </div>
            </div>
          </>
        )}
      </div>

       {/* Buff Staking Section */}
       <div className="bg-primary p-6 rounded-lg border border-border-color">
            <h3 className="text-xl font-bold text-text-primary mb-1 flex items-center gap-3"><Shield className="text-accent-tertiary" />{t('staking_section.buff_infusion')}</h3>
            <p className="text-sm text-text-secondary mb-4">{t('staking_section.buff_infusion_desc')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Available to Stake */}
                <div>
                    <h4 className="font-semibold text-text-secondary mb-2">{t('staking_section.inventory_buffs')}</h4>
                    <div className="space-y-2 p-3 bg-background border border-border-color rounded-lg min-h-[100px]">
                        {inventoryBuffs.length > 0 ? inventoryBuffs.map(item => {
                            const buffStakingLimit = Math.floor(user.level_overall / 10) + 1;
                            const currentStakedCount = user.stakedBuffs[item.id] || 0;
                            const canStake = currentStakedCount < buffStakingLimit;
                            return (
                                <div key={item.id} className="flex items-center justify-between bg-primary border border-border-color p-2 rounded">
                                    <div>
                                        <p className="font-semibold text-text-primary">{item.name}</p>
                                        <p className="text-xs text-text-secondary">{t('staking_section.in_inventory', { count: item.quantity })}</p>
                                    </div>
                                    <button 
                                      onClick={() => onStakeBuff(item.id)}
                                      disabled={!canStake}
                                      className="bg-accent-tertiary text-white disabled:bg-border-color disabled:cursor-not-allowed text-xs font-bold py-1 px-3 rounded">
                                        {t('staking_section.infuse')}
                                      </button>
                                </div>
                            )
                        }) : <p className="text-xs text-text-muted text-center pt-4">{t('staking_section.no_buffs_inventory')}</p>}
                    </div>
                </div>
                 {/* Current Staked Bonuses */}
                 <div>
                    <h4 className="font-semibold text-text-secondary mb-2">{t('staking_section.permanent_bonuses')}</h4>
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
                                        {t('staking_section.effect_msg', { multiplier, percent: ((multiplier - 1) * 100).toFixed(0) })}
                                        {itemInfo.effect.realms && itemInfo.effect.realms.length > 0 ? t('staking_section.on_realms', { realms: itemInfo.effect.realms.join(' & ') }) : t('staking_section.on_all')}
                                    </p>
                                </div>
                             )
                        }) : <p className="text-xs text-text-muted text-center pt-4">{t('staking_section.no_buffs_infused')}</p>}
                    </div>
                </div>
            </div>
            <div className="text-xs text-text-muted mt-3 p-2 bg-background border border-border-color rounded-lg flex items-start space-x-2">
                <HelpCircle size={28} className="flex-shrink-0" />
                <div>
                    <span className="font-bold">{t('staking_section.how_it_works')}</span> {t('staking_section.how_it_works_desc')}
                </div>
            </div>
       </div>
    </div>
  );
};

export default Staking;