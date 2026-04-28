import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuestBoardProps {
  onGenerateQuests: () => void;
  isLoading: boolean;
}

const QuestBoard: React.FC<QuestBoardProps> = ({ onGenerateQuests, isLoading }) => {
  const { t } = useTranslation(['common']);
  return (
    <button 
      onClick={onGenerateQuests} 
      disabled={isLoading}
      className="flex items-center justify-center space-x-2 bg-accent-green disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors hover:bg-accent-green-hover"
    >
      <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
      <span>{isLoading ? t('common:quest_board.generating') : t('common:quest_board.new_quests')}</span>
    </button>
  );
};

export default QuestBoard;