import React, { useState, useEffect } from 'react';
import { X, Wand2, Loader2, Layers } from 'lucide-react';
import { MajorGoal, User } from '../types';
import { generateMajorGoals } from '../services/geminiService';
import { useTranslation } from 'react-i18next';

// FIX: Renamed props interface.
interface BulkAddMajorGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goals: Omit<MajorGoal, 'id'>[]) => void;
  user: User;
  xpForNextSixLevels: number;
  apiKey: string;
}

// FIX: Renamed interface.
interface GeneratedGoal extends Omit<MajorGoal, 'id'> {
    checked: boolean;
}

// FIX: Renamed component.
const BulkAddMajorGoalsModal: React.FC<BulkAddMajorGoalsModalProps> = ({ isOpen, onClose, onSave, user, xpForNextSixLevels, apiKey }) => {
  const { t } = useTranslation(['goals', 'common']);
  const [manualInput, setManualInput] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedGoals, setGeneratedGoals] = useState<GeneratedGoal[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setManualInput('');
    setAiPrompt('');
    setGeneratedGoals([]);
    setError(null);
    setIsGenerating(false);
    onClose();
  }

  useEffect(() => {
    // Reset state when modal is opened
    if (isOpen) {
        setManualInput('');
        setAiPrompt('');
        setGeneratedGoals([]);
        setError(null);
        setIsGenerating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualAdd = () => {
    const titles = manualInput.split(',').map(name => name.trim()).filter(Boolean);
    if (titles.length === 0) return;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    futureDate.setHours(23, 59, 59, 999);

    const newGoals: Omit<MajorGoal, 'id'>[] = titles.map(title => ({
        title,
        description: 'Manually added goal.',
        type: 'Forge',
        deadline: futureDate.toISOString(),
        xp_reward: 200,
        credit_reward: 50,
    }));

    onSave(newGoals);
    handleClose();
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedGoals([]);
    try {
        const goals = await generateMajorGoals(apiKey, aiPrompt, user, xpForNextSixLevels);
        setGeneratedGoals(goals.map(g => ({ ...g, checked: true })));
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(errorMessage);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGoalCheck = (index: number) => {
    setGeneratedGoals(prev => {
        const newGoals = [...prev];
        newGoals[index].checked = !newGoals[index].checked;
        return newGoals;
    });
  };
  
  const handleAddGenerated = () => {
    const selectedGoals = generatedGoals.filter(g => g.checked).map(({ checked, ...rest }) => rest);
    if (selectedGoals.length > 0) {
        onSave(selectedGoals);
        handleClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-2xl relative border border-border-color max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-text-primary flex items-center"><Layers className="mr-3"/>{t('bulk_modal.title')}</h2>
        
        {/* AI Generation Section */}
        <div className="bg-background/50 p-4 rounded-lg mb-6">
             <h3 className="text-lg font-semibold mb-2 text-text-primary">{t('bulk_modal.generate_with_ai')}</h3>
             <p className="text-xs text-text-secondary mb-2">{t('bulk_modal.ai_desc')}</p>
             <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                rows={4}
                placeholder={t('bulk_modal.ai_placeholder')}
                className="w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-accent-primary"
            />
             <button
                onClick={handleGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="mt-2 w-full flex items-center justify-center space-x-2 bg-accent-tertiary hover:bg-opacity-80 disabled:bg-accent-tertiary/50 text-white font-bold py-2 px-4 rounded"
             >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                <span>{isGenerating ? t('bulk_modal.generating') : t('bulk_modal.generate_button')}</span>
             </button>
        </div>

        {error && <p className="text-accent-red text-sm text-center mb-4">{error}</p>}
        
        {generatedGoals.length > 0 && (
            <>
            <h3 className="text-lg font-semibold mb-2 text-text-primary">{t('bulk_modal.generated_goals')}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto bg-background/50 p-3 rounded-md mb-4">
                {generatedGoals.map((goal, index) => (
                    <label key={index} className="flex items-start space-x-3 p-2 rounded hover:bg-border-color/50 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={goal.checked}
                            onChange={() => handleGoalCheck(index)}
                            className="h-5 w-5 rounded bg-background border-border-color text-accent-tertiary focus:ring-accent-tertiary mt-1"
                        />
                        <div className="flex-1">
                            <p className="text-text-primary font-semibold">{goal.title} <span className="text-xs font-mono text-text-secondary">({t(`types.${goal.type}`)})</span></p>
                            <p className="text-xs text-text-secondary">{goal.description}</p>
                            <p className="text-xs text-accent-primary mt-1">{t('bulk_modal.reward')}: {goal.xp_reward} XP, {goal.credit_reward} CR | {t('goal_deadline')}: {new Date(goal.deadline).toLocaleDateString()}</p>
                        </div>
                    </label>
                ))}
            </div>
            </>
        )}
        
        <div className="pt-4 flex justify-end">
          <button type="button" onClick={handleClose} className="bg-border-color hover:bg-opacity-80 text-text-primary font-bold py-2 px-4 rounded mr-2">{t('common:buttons.cancel')}</button>
          <button 
            onClick={handleAddGenerated}
            disabled={generatedGoals.filter(g => g.checked).length === 0}
            className="bg-accent-green hover:bg-accent-green-hover disabled:bg-border-color disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded"
          >
            {t('bulk_modal.add_selected')} ({generatedGoals.filter(g => g.checked).length})
          </button>
        </div>
      </div>
    </div>
  );
};
export default BulkAddMajorGoalsModal;