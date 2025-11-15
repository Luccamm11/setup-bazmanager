import React from 'react';
// FIX: Replaced BossChallenge with MajorGoal for consistency.
import { Quest, Realm, Arc, MajorGoal, User } from '../types';
import QuestBoard from './QuestBoard';
import QuestCard from './QuestCard';
import MajorGoals from './MajorGoals';
import ActiveBuffs from './ActiveBuffs';
import { Target, Zap, Gift, PlusCircle } from 'lucide-react';

interface DashboardProps {
  user: User;
  quests: Quest[];
  activeArc: Arc | null;
  // FIX: Renamed `challenges` to `majorGoals` and updated type.
  majorGoals: MajorGoal[];
  onCompleteQuest: (questId: string) => void;
  onGenerateQuests: () => void;
  isLoading: boolean;
  error: string | null;
  onOpenLootbox: () => void;
  isLootboxClaimed: boolean;
  onAddQuestClick: () => void;
  // FIX: Renamed props to match App.tsx and new component names.
  onAddMajorGoal: () => void;
  onBulkAddMajorGoal: () => void;
  onEditMajorGoal: (goal: MajorGoal) => void;
  onCompleteMajorGoal: (goal: MajorGoal) => void;
  onSyllabusBreakdown: (goal: MajorGoal) => void;
  currentDate: Date;
}

const ActiveArcDisplay: React.FC<{ arc: Arc }> = ({ arc }) => (
    <div className="bg-primary rounded-lg p-4 border border-border-color mb-6">
        <div className="flex items-center space-x-3 mb-2">
            <Target className="w-6 h-6 text-accent-tertiary" />
            <h2 className="text-lg sm:text-xl font-bold text-text-primary"><span className="text-text-secondary">ARC ACTIVE:</span> {arc.title}</h2>
        </div>
        <p className="text-sm text-text-secondary sm:ml-9">{arc.description}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 sm:ml-9">
            {arc.effects.map((effect, index) => (
                <div key={index} className="flex items-center text-sm text-accent-primary">
                    <Zap size={14} className="mr-1.5"/>
                    <span>{effect}</span>
                </div>
            ))}
        </div>
    </div>
);

const DailyLootboxDrop: React.FC<{ onOpen: () => void; isClaimed: boolean }> = ({ onOpen, isClaimed }) => (
    <div className="bg-primary p-4 rounded-lg border border-border-color flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-text-primary flex items-center justify-center sm:justify-start"><Gift className="w-5 h-5 mr-2 text-accent-primary"/>Daily Lootbox Drop</h3>
            <p className="text-sm text-text-secondary">Claim your daily randomized reward from the System.</p>
        </div>
        <button
            onClick={onOpen}
            disabled={isClaimed}
            className={`px-4 py-2 font-semibold rounded-lg transition-all w-full sm:w-auto ${isClaimed ? 'bg-primary border border-border-color text-text-secondary cursor-not-allowed' : 'bg-primary border border-border-color text-accent-primary hover:bg-border-color'}`}
        >
            {isClaimed ? 'Claimed' : 'Claim Reward'}
        </button>
    </div>
);


const Dashboard: React.FC<DashboardProps> = (props) => {
  // FIX: Destructure renamed props.
  const { user, quests, activeArc, onCompleteQuest, onGenerateQuests, isLoading, error, onOpenLootbox, isLootboxClaimed, onAddQuestClick, majorGoals, onAddMajorGoal, onBulkAddMajorGoal, onEditMajorGoal, onCompleteMajorGoal, onSyllabusBreakdown, currentDate } = props;
  return (
    <div className="space-y-6">
       {error && (
        <div className="bg-accent-red/20 border border-accent-red text-accent-red px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {activeArc && <ActiveArcDisplay arc={activeArc} />}
      <ActiveBuffs activeBuffs={user.activeBuffs} />
      <DailyLootboxDrop onOpen={onOpenLootbox} isClaimed={isLootboxClaimed} />

      <div className="bg-primary p-3 sm:p-4 rounded-lg border border-border-color">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 sm:gap-2">
          <h2 className="text-2xl font-bold text-text-primary text-center sm:text-left">Daily Quests</h2>
          <div className="flex flex-col sm:flex-row sm:space-x-2 gap-2 sm:gap-0">
            <button 
                onClick={onAddQuestClick}
                className="flex items-center justify-center space-x-2 bg-primary border border-border-color hover:bg-border-color text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors"
            >
                <PlusCircle className="w-5 h-5" />
                <span>Add Personal</span>
            </button>
            <QuestBoard 
                onGenerateQuests={onGenerateQuests}
                isLoading={isLoading} 
            />
          </div>
        </div>
        {quests.length > 0 ? (
            <div className="flex flex-col gap-4 mt-4">
                {quests.map(quest => (
                    <QuestCard key={quest.id} quest={quest} onComplete={onCompleteQuest} currentDate={currentDate} />
                ))}
            </div>
        ) : (
            <div className="text-center py-10 px-4 bg-background border border-border-color rounded-lg mt-4">
                <p className="text-text-secondary">No quests available.</p>
                <p className="text-text-muted mt-2">Click "New Quests" to generate your tasks for the day!</p>
            </div>
        )}
      </div>

      <MajorGoals 
        goals={majorGoals}
        onAdd={onAddMajorGoal}
        onBulkAdd={onBulkAddMajorGoal}
        onEdit={onEditMajorGoal}
        onComplete={onCompleteMajorGoal}
        onBreakdown={onSyllabusBreakdown}
        currentDate={currentDate}
      />

    </div>
  );
};

export default Dashboard;