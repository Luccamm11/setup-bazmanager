import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Quest, Realm, Difficulty, QuestStatus } from '../types';
import { SKILL_REALMS } from '../constants';
import AiTextGenerator from './AiTextGenerator';

interface AddQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuest: (questData: Omit<Quest, 'id' | 'status' | 'source'>) => void;
  apiKey: string;
}

const AddQuestModal: React.FC<AddQuestModalProps> = ({ isOpen, onClose, onAddQuest, apiKey }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [realm, setRealm] = useState<Realm>(SKILL_REALMS[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Easy);
  const [xp, setXp] = useState(10);
  const [credits, setCredits] = useState(5);
  const [duration, setDuration] = useState(30);

  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddQuest({
        title,
        description,
        realm,
        difficulty,
        xp_reward: Number(xp),
        credit_reward: Number(credits),
        duration_est_min: Number(duration),
        knowledgeTopics: [], // Personal quests don't tie to specific skills for now
    });
    // Reset form
    setTitle('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-lg relative border border-border-color" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-text-primary">Add Personal Quest</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <div className="relative">
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm pr-10" />
                <AiTextGenerator
                    apiKey={apiKey}
                    context="a title for a personal quest"
                    onGenerated={setTitle}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <div className="relative">
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm pr-10" />
                 <AiTextGenerator
                    apiKey={apiKey}
                    context="a short description for a personal quest"
                    onGenerated={setDescription}
                    className="absolute right-2 top-2"
                />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="realm" className="block text-sm font-medium text-text-secondary">Realm</label>
              <select id="realm" value={realm} onChange={e => setRealm(e.target.value as Realm)} className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm">
                {SKILL_REALMS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-text-secondary">Difficulty</label>
              <select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm">
                {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label htmlFor="xp" className="block text-sm font-medium text-text-secondary">XP Reward</label>
                <input type="number" id="xp" value={xp} onChange={e => setXp(Number(e.target.value))} min="0" className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm" />
            </div>
             <div>
                <label htmlFor="credits" className="block text-sm font-medium text-text-secondary">Credit Reward</label>
                <input type="number" id="credits" value={credits} onChange={e => setCredits(Number(e.target.value))} min="0" className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm" />
            </div>
            <div>
                <label htmlFor="duration" className="block text-sm font-medium text-text-secondary">Est. Mins</label>
                <input type="number" id="duration" value={duration} onChange={e => setDuration(Number(e.target.value))} min="0" className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm" />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button type="button" onClick={onClose} className="bg-border-color hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded mr-2">Cancel</button>
            <button type="submit" className="bg-accent-primary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded">Add Quest</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuestModal;