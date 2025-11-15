import React, { useState } from 'react';
import { X, Wand2, Loader2 } from 'lucide-react';
import { Skill } from '../types';

interface AddBulkTopicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: Skill | null;
  onSaveTopics: (skillId: string, topicNames: string[]) => void;
  onGenerateTopics: (skill: Skill) => Promise<string[]>;
}

interface GeneratedTopic {
    name: string;
    checked: boolean;
}

const AddBulkTopicsModal: React.FC<AddBulkTopicsModalProps> = ({ isOpen, onClose, skill, onSaveTopics, onGenerateTopics }) => {
  const [manualInput, setManualInput] = useState('');
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setManualInput('');
    setGeneratedTopics([]);
    setError(null);
    setIsGenerating(false);
    onClose();
  }

  if (!isOpen || !skill) return null;

  const handleManualAdd = () => {
    const topicNames = manualInput.split(',').map(name => name.trim()).filter(Boolean);
    if (topicNames.length > 0) {
      onSaveTopics(skill.id, topicNames);
      setManualInput('');
    }
  };
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedTopics([]);
    try {
        const topics = await onGenerateTopics(skill);
        setGeneratedTopics(topics.map(name => ({ name, checked: true })));
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(errorMessage);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleTopicCheck = (index: number) => {
    setGeneratedTopics(prev => {
        const newTopics = [...prev];
        newTopics[index].checked = !newTopics[index].checked;
        return newTopics;
    });
  };
  
  const handleAddGenerated = () => {
    const selectedTopics = generatedTopics.filter(t => t.checked).map(t => t.name);
    if (selectedTopics.length > 0) {
        onSaveTopics(skill.id, selectedTopics);
        setGeneratedTopics([]);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-lg relative border border-border-color" onClick={e => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-1 text-text-primary">Bulk Add Topics</h2>
        <p className="text-text-secondary mb-6">For skill: <span className="font-semibold text-accent-primary">{skill.name}</span></p>

        {/* Manual Input Section */}
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-text-primary">Add Manually</h3>
            <p className="text-xs text-text-muted mb-2">Enter topic names separated by commas.</p>
            <textarea
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                rows={3}
                placeholder="e.g., Topic A, Topic B, Another Topic"
                className="w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm"
            />
            <button
                onClick={handleManualAdd}
                disabled={!manualInput.trim()}
                className="mt-2 w-full bg-border-color hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary font-bold py-2 px-4 rounded"
            >
                Add from List
            </button>
        </div>

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border-color"></div>
            <span className="flex-shrink mx-4 text-text-muted">OR</span>
            <div className="flex-grow border-t border-border-color"></div>
        </div>

        {/* AI Generation Section */}
        <div className="mb-4">
             <h3 className="text-lg font-semibold mb-2 text-text-primary">Auto-Generate with AI</h3>
             <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center space-x-2 bg-accent-tertiary hover:bg-opacity-80 disabled:bg-accent-tertiary/50 text-white font-bold py-2 px-4 rounded"
             >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                <span>{isGenerating ? 'Generating...' : 'Generate Suggestions'}</span>
             </button>
        </div>

        {error && <p className="text-accent-red text-sm text-center mb-4">{error}</p>}
        
        {generatedTopics.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto bg-background p-3 rounded-md mb-4">
                {generatedTopics.map((topic, index) => (
                    <label key={index} className="flex items-center space-x-3 p-2 rounded hover:bg-border-color/50 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={topic.checked}
                            onChange={() => handleTopicCheck(index)}
                            className="h-5 w-5 rounded bg-background border-border-color text-accent-tertiary focus:ring-accent-tertiary"
                        />
                        <span className="text-text-primary">{topic.name}</span>
                    </label>
                ))}
            </div>
        )}

        {generatedTopics.length > 0 && (
            <div className="pt-4 flex justify-end">
                <button type="button" onClick={handleClose} className="bg-border-color hover:bg-opacity-80 text-text-primary font-bold py-2 px-4 rounded mr-2">Cancel</button>
                <button onClick={handleAddGenerated} className="bg-accent-green hover:bg-accent-green-hover text-white font-bold py-2 px-4 rounded">
                    Add Selected ({generatedTopics.filter(t => t.checked).length})
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AddBulkTopicsModal;