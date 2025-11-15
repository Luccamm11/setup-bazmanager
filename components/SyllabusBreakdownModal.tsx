import React, { useState, useEffect } from 'react';
import { X, Wand2, Loader2, AlertTriangle } from 'lucide-react';
// FIX: Replaced BossChallenge with MajorGoal.
import { MajorGoal } from '../types';

// FIX: Renamed props interface.
interface SyllabusBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: MajorGoal | null;
  isLoading: boolean;
  generatedTopics: string[];
  onConfirm: (selectedTopics: string[]) => void;
}

interface SelectableTopic {
    name: string;
    checked: boolean;
}

// FIX: Renamed component and props.
const SyllabusBreakdownModal: React.FC<SyllabusBreakdownModalProps> = ({ isOpen, onClose, goal, isLoading, generatedTopics, onConfirm }) => {
  const [selectableTopics, setSelectableTopics] = useState<SelectableTopic[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (generatedTopics.length > 0) {
      setSelectableTopics(generatedTopics.map(name => ({ name, checked: true })));
      setError(null);
    } else if (!isLoading && isOpen) {
        // If it's open but there are no topics and it's not loading, there might be an error.
        // A more robust implementation would pass an error prop.
    }
  }, [generatedTopics, isLoading, isOpen]);
  
  const handleToggleTopic = (index: number) => {
    setSelectableTopics(prev => {
        const newTopics = [...prev];
        newTopics[index].checked = !newTopics[index].checked;
        return newTopics;
    });
  }

  const handleConfirm = () => {
    const selected = selectableTopics.filter(t => t.checked).map(t => t.name);
    onConfirm(selected);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-lg relative border border-border-color" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-3 mb-4">
            <Wand2 className="w-8 h-8 text-accent-tertiary" />
            <div>
                <h2 className="text-2xl font-bold text-text-primary">Syllabus Analysis</h2>
                <p className="text-text-secondary">AI-generated topics for: <span className="font-semibold text-accent-primary">{goal?.title}</span></p>
            </div>
        </div>
        
        <div className="my-6 min-h-[10rem] flex items-center justify-center">
            {isLoading && (
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-accent-tertiary animate-spin mx-auto"/>
                    <p className="mt-4 text-text-secondary">Analyzing syllabus and generating topics...</p>
                </div>
            )}
            {!isLoading && error && (
                 <div className="text-center text-accent-red">
                    <AlertTriangle className="w-12 h-12 mx-auto"/>
                    <p className="mt-4 font-semibold">An error occurred.</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}
            {!isLoading && !error && selectableTopics.length > 0 && (
                <div className="w-full space-y-2 max-h-60 overflow-y-auto p-3 bg-background rounded-md">
                    {selectableTopics.map((topic, index) => (
                        <label key={index} className="flex items-center space-x-3 p-2 rounded hover:bg-border-color/50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={topic.checked}
                                onChange={() => handleToggleTopic(index)}
                                className="h-5 w-5 rounded bg-background-tertiary border-border-color text-accent-tertiary focus:ring-accent-tertiary"
                            />
                            <span className="text-text-primary">{topic.name}</span>
                        </label>
                    ))}
                </div>
            )}
            {!isLoading && !error && selectableTopics.length === 0 && generatedTopics.length === 0 && (
                <div className="text-center">
                    <p className="text-text-secondary">No new topics were generated.</p>
                    <p className="text-sm text-text-muted">This could be because all syllabus topics are already in your knowledge base.</p>
                </div>
            )}
        </div>

        <div className="pt-4 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-border-color hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded">Cancel</button>
            <button
                onClick={handleConfirm}
                disabled={selectableTopics.filter(t => t.checked).length === 0}
                className="bg-accent-tertiary hover:bg-opacity-80 disabled:bg-border-color disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded"
            >
                Add Selected ({selectableTopics.filter(t => t.checked).length})
            </button>
        </div>
      </div>
    </div>
  );
};

export default SyllabusBreakdownModal;