import React, { useState, useEffect } from 'react';
import { X, Wand2, Loader2 } from 'lucide-react';
import { StoreItem, User, Realm } from '../types';
import { generateStoreItem } from '../services/geminiService';

interface AddStoreItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<StoreItem, 'id'>) => void;
  itemToEdit: StoreItem | null;
  user: User;
}

const AddStoreItemModal: React.FC<AddStoreItemModalProps> = ({ isOpen, onClose, onSave, itemToEdit, user }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(100);
  const [category, setCategory] = useState<StoreItem['category']>('Buff');
  const [effectType, setEffectType] = useState<StoreItem['effect']['type']>('XP_BOOST');
  const [effectValue, setEffectValue] = useState<number | undefined>(2);
  const [effectDuration, setEffectDuration] = useState<number | undefined>(24);
  const [effectRealms, setEffectRealms] = useState<Realm[]>([]);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setItemState = (item: Omit<StoreItem, 'id'>) => {
    setName(item.name);
    setDescription(item.description);
    setCost(item.cost);
    setCategory(item.category);
    setEffectType(item.effect.type);
    setEffectValue(item.effect.value);
    setEffectDuration(item.effect.duration);
    setEffectRealms(item.effect.realms || []);
  };

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setItemState(itemToEdit);
      } else {
        // Reset form
        setName('');
        setDescription('');
        setCost(100);
        setCategory('Buff');
        setEffectType('XP_BOOST');
        setEffectValue(2);
        setEffectDuration(24);
        setEffectRealms([]);
        setAiPrompt('');
        setError(null);
      }
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const generatedData = await generateStoreItem(aiPrompt, user);
      setItemState(generatedData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRealmToggle = (realm: Realm) => {
    setEffectRealms(prev => 
        prev.includes(realm) ? prev.filter(r => r !== realm) : [...prev, realm]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert("Please fill in a name and description.");
      return;
    }
    onSave({
        name,
        description,
        cost: Number(cost),
        category,
        effect: {
            type: effectType,
            value: effectType === 'XP_BOOST' ? Number(effectValue) : undefined,
            duration: effectType === 'XP_BOOST' ? Number(effectDuration) : undefined,
            realms: (effectType === 'XP_BOOST' && effectRealms.length > 0) ? effectRealms : undefined,
        },
        isGenerated: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-2xl relative border border-border-color max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-text-primary">{itemToEdit ? 'Edit Item' : 'Create New Item'}</h2>
        
        {/* AI Generation Section */}
        <div className="bg-background/50 p-4 rounded-lg mb-6">
             <h3 className="text-lg font-semibold mb-2 text-text-primary">Generate with AI</h3>
             <p className="text-xs text-text-muted mb-2">Describe the item you want, and the AI will design it for you.</p>
             <div className="flex items-center space-x-2">
                <input
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g., 'A buff for Body and Creation XP for a short time'"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Cost (Credits)</label>
                    <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} required className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary" />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} required className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value as any)} className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary">
                        <option value="Buff">Buff</option>
                        <option value="Utility">Utility</option>
                        <option value="Reward">Reward</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Effect Type</label>
                    <select value={effectType} onChange={e => setEffectType(e.target.value as any)} className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary">
                        <option value="XP_BOOST">XP Boost</option>
                        <option value="STREAK_SAVER">Streak Saver</option>
                        <option value="QUEST_REROLL">Quest Re-roll</option>
                        <option value="INSTANT_STREAK">Instant Streak</option>
                        <option value="REAL_WORLD_REWARD">Real World Reward</option>
                    </select>
                </div>
            </div>

            {effectType === 'XP_BOOST' && (
                <div className="p-3 bg-background/50 rounded-lg space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">XP Multiplier (e.g., 2 for 2x)</label>
                            <input type="number" value={effectValue} onChange={e => setEffectValue(Number(e.target.value))} className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Duration (hours)</label>
                            <input type="number" value={effectDuration} onChange={e => setEffectDuration(Number(e.target.value))} className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Affected Realms (optional)</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(Realm).map(r => (
                                <button key={r} type="button" onClick={() => handleRealmToggle(r)} className={`px-3 py-1 text-sm rounded-full border-2 ${effectRealms.includes(r) ? 'bg-accent-tertiary border-accent-primary text-white' : 'bg-background border-border-color text-text-secondary hover:border-text-secondary'}`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          
          <div className="pt-6 flex justify-end">
            <button type="button" onClick={onClose} className="bg-border-color hover:bg-opacity-80 text-text-primary font-bold py-2 px-4 rounded mr-2">Cancel</button>
            <button type="submit" className="bg-accent-green hover:bg-accent-green-hover text-white font-bold py-2 px-4 rounded">Save Item</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStoreItemModal;