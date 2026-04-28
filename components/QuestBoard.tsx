import React from 'react';
import { RefreshCw } from 'lucide-react';

interface QuestBoardProps {
  onGenerateQuests: () => void;
  isLoading: boolean;
}

const QuestBoard: React.FC<QuestBoardProps> = ({ onGenerateQuests, isLoading }) => {
  return (
    <button 
      onClick={onGenerateQuests} 
      disabled={isLoading}
      className="flex items-center justify-center space-x-2 bg-accent-green disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors hover:bg-accent-green-hover"
    >
      <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
      <span>{isLoading ? 'Generating...' : 'New Quests'}</span>
    </button>
  );
};

export default QuestBoard;