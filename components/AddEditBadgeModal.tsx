import React, { useState, useEffect } from 'react';
import { X, Wand2, Loader2, Award } from 'lucide-react';
import { Badge } from '../types';
import { ICON_MAP } from '../constants';

interface AddEditBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (badgeData: Omit<Badge, 'id'>) => void;
  badgeToEdit: Badge | null;
  onGenerateBadge: (description: string) => Promise<Omit<Badge, 'id' | 'isGenerated'>>;
}

const AddEditBadgeModal: React.FC<AddEditBadgeModalProps> = ({ isOpen, onClose, onSave, badgeToEdit, onGenerateBadge }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Award');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const iconEntries = Object.entries(ICON_MAP);

  useEffect(() => {
    if (badgeToEdit) {
      setName(badgeToEdit.name);
      setDescription(badgeToEdit.description);
      setIcon(badgeToEdit.icon);
    } else {
      // Reset form
      setName('');
      setDescription('');
      setIcon('Award');
      setAiPrompt('');
      setError(null);
    }
  }, [badgeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const generatedData = await onGenerateBadge(aiPrompt);
      setName(generatedData.name);
      setDescription(generatedData.description);
      setIcon(generatedData.icon);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert("Please fill in a name and description.");
      return;
    }
    onSave({ name, description, icon, isGenerated: true });
  };

  const SelectedIcon = ICON_MAP[icon] || Award;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-2xl relative border border-border-color max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-text-primary">{badgeToEdit ? 'Edit Badge' : 'Create New Badge'}</h2>
        
        {/* AI Generation Section */}
        <div className="bg-background/50 p-4 rounded-lg mb-6">
             <h3 className="text-lg font-semibold mb-2 text-text-primary">Generate with AI</h3>
             <p className="text-xs text-text-muted mb-2">Describe the achievement, and the AI will design a badge for you.</p>
             <div className="flex items-center space-x-2">
                <input
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g., A badge for completing 100 quests"
                    className="flex-grow bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-tertiary"
                />
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="flex items-center justify-center space-x-2 bg-accent-tertiary hover:bg-opacity-80 disabled:bg-opacity-50 w-32 text-white font-bold py-2 px-4 rounded"
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    <span>{isGenerating ? 'Generating' : 'Generate'}</span>
                </button>
             </div>
             {error && <p className="text-accent-red text-sm text-center mt-2">{error}</p>}
        </div>

        {/* Manual Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold mb-2 text-text-primary">Badge Details</h3>
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-grow space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} required className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary" />
                    </div>
                </div>
                 <div className="flex-shrink-0 text-center">
                    <label className="block text-sm font-medium text-text-secondary mb-2">Icon Preview</label>
                    <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center bg-accent-secondary/10 border-2 border-accent-secondary/50">
                        <SelectedIcon className="w-12 h-12 text-accent-secondary" />
                    </div>
                </div>
            </div>
            
            <div>
                 <label className="block text-sm font-medium text-text-secondary mb-2">Select Icon</label>
                 <div className="max-h-48 overflow-y-auto grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 bg-background/50 p-3 rounded-lg">
                    {iconEntries.map(([iconName, IconComponent]) => (
                        <button
                            key={iconName}
                            type="button"
                            onClick={() => setIcon(iconName)}
                            className={`p-2 rounded-md transition-colors flex items-center justify-center ${icon === iconName ? 'bg-accent-tertiary ring-2 ring-accent-primary' : 'bg-background hover:bg-border-color'}`}
                            title={iconName}
                        >
                            <IconComponent className="w-6 h-6 text-text-primary" />
                        </button>
                    ))}
                 </div>
            </div>
          
          <div className="pt-6 flex justify-end">
            <button type="button" onClick={onClose} className="bg-border-color hover:bg-opacity-80 text-text-primary font-bold py-2 px-4 rounded mr-2">Cancel</button>
            <button type="submit" className="bg-accent-green hover:bg-accent-green-hover text-white font-bold py-2 px-4 rounded">Save Badge</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditBadgeModal;