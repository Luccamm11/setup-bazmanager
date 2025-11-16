import React, { useState, useEffect } from 'react';
import { X, Wand2, Loader2, Shield } from 'lucide-react';
import { Arc } from '../types';
import { generateArc } from '../services/geminiService';
import AiTextGenerator from './AiTextGenerator';

interface AddEditArcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (arcData: Omit<Arc, 'id'>, isFromAi: boolean) => void;
  apiKey: string;
}

const AddEditArcModal: React.FC<AddEditArcModalProps> = ({ isOpen, onClose, onSave, apiKey }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Exam' | 'Fitness' | 'Cyber Dungeon'>('Cyber Dungeon');
  const [effects, setEffects] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromAi, setIsFromAi] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form on open
      setTitle('');
      setDescription('');
      setType('Cyber Dungeon');
      setEffects('');
      setAiPrompt('');
      setIsGenerating(false);
      setError(null);
      setIsFromAi(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const generatedData = await generateArc(apiKey, aiPrompt);
      setTitle(generatedData.title);
      setDescription(generatedData.description);
      setType(generatedData.type);
      setEffects(generatedData.effects.join('\n'));
      setIsFromAi(true);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to generate Arc.";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectsArray = effects.split('\n').map(e => e.trim()).filter(Boolean);
    if (!title.trim() || !description.trim() || effectsArray.length === 0) {
      alert("Please fill in all fields: Title, Description, and at least one Effect.");
      return;
    }
    onSave({ title, description, type, effects: effectsArray }, isFromAi);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-2xl relative border border-border-color max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-text-primary flex items-center"><Shield className="mr-3"/>Create New Arc</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Generation Section */}
          <div className="space-y-3">
             <h3 className="text-lg font-semibold text-text-primary">Generate with AI</h3>
             <p className="text-xs text-text-muted">Describe your idea, and the AI will create an Arc for you.</p>
             <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                rows={3}
                placeholder="e.g., A month-long fitness challenge focused on running and strength."
                className="w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-tertiary sm:text-sm"
            />
             <button
                onClick={handleGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full flex items-center justify-center space-x-2 bg-accent-tertiary hover:bg-opacity-80 disabled:bg-opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded"
             >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                <span>{isGenerating ? 'Generating...' : 'Generate Arc'}</span>
             </button>
             {error && <p className="text-accent-red text-sm text-center">{error}</p>}
          </div>

          {/* Manual Form Section */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <h3 className="text-lg font-semibold text-text-primary">Or Create Manually</h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
              <div className="relative">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary sm:text-sm pr-10" />
                <AiTextGenerator context="a title for a story arc" onGenerated={setTitle} className="absolute right-2 top-1/2 -translate-y-1/2" apiKey={apiKey} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
               <div className="relative">
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary sm:text-sm pr-10" />
                 <AiTextGenerator context="a short description for a story arc" onGenerated={setDescription} className="absolute right-2 top-1/2 -translate-y-1/2" apiKey={apiKey} />
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-text-secondary">Type</label>
              <select value={type} onChange={e => setType(e.target.value as any)} className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary sm:text-sm">
                <option>Cyber Dungeon</option>
                <option>Exam</option>
                <option>Fitness</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Effects (one per line)</label>
              <div className="relative">
                <textarea value={effects} onChange={e => setEffects(e.target.value)} rows={3} required className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary sm:text-sm pr-10" />
                 <AiTextGenerator context="a list of 2-3 thematic in-game effects for a story arc, separated by newlines" onGenerated={setEffects} className="absolute right-2 top-2" apiKey={apiKey} />
              </div>
            </div>
          </form>
        </div>
        <div className="pt-6 flex justify-end">
            <button type="button" onClick={onClose} className="bg-border-color hover:bg-opacity-80 text-text-primary font-bold py-2 px-4 rounded mr-2">Cancel</button>
            <button type="button" onClick={handleSubmit} className="bg-accent-green hover:bg-accent-green-hover text-white font-bold py-2 px-4 rounded">Save Arc</button>
        </div>
      </div>
    </div>
  );
};

export default AddEditArcModal;