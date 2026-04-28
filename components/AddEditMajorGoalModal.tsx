import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
// FIX: Replaced BossChallenge with MajorGoal.
import { MajorGoal, Skill } from '../types';
import AiTextGenerator from './AiTextGenerator';

// FIX: Renamed props interface for clarity.
interface AddEditMajorGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Omit<MajorGoal, 'id'>) => void;
  goalToEdit: MajorGoal | null;
  skills: Skill[];
  apiKey: string;
}

// FIX: Renamed component for clarity.
const AddEditMajorGoalModal: React.FC<AddEditMajorGoalModalProps> = ({ isOpen, onClose, onSave, goalToEdit, skills, apiKey }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Siege' | 'Forge' | 'Gauntlet'>('Forge');
  const [deadline, setDeadline] = useState('');
  const [xpReward, setXpReward] = useState(500);
  const [creditReward, setCreditReward] = useState(100);
  // FIX: Renamed battlePlan to syllabus.
  const [syllabus, setSyllabus] = useState('');
  const [skillId, setSkillId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title);
      setDescription(goalToEdit.description);
      setType(goalToEdit.type);
      setDeadline(new Date(goalToEdit.deadline).toISOString().substring(0, 10));
      setXpReward(goalToEdit.xp_reward);
      setCreditReward(goalToEdit.credit_reward);
      // FIX: Use syllabus property.
      setSyllabus(goalToEdit.syllabus || '');
      setSkillId(goalToEdit.skillId || '');
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setType('Forge');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      setDeadline(futureDate.toISOString().substring(0, 10));
      setXpReward(500);
      setCreditReward(100);
      setSyllabus('');
      setSkillId(skills.length > 0 ? skills[0].id : '');
    }
  }, [goalToEdit, isOpen, skills]);

  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;
    
    const deadlineDate = new Date(deadline);
    // Set time to end of day to avoid timezone issues
    deadlineDate.setHours(23, 59, 59, 999);

    onSave({
        title,
        description,
        type,
        deadline: deadlineDate.toISOString(),
        xp_reward: Number(xpReward),
        credit_reward: Number(creditReward),
        // FIX: Use syllabus property.
        syllabus: type === 'Siege' ? syllabus : undefined,
        skillId: type === 'Siege' ? skillId : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-lg relative border border-border-color" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-text-primary">{goalToEdit ? 'Edit Major Goal' : 'Add Major Goal'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="challenge-title" className="block text-sm font-medium text-text-secondary mb-1">Title</label>
             <div className="relative">
                <input type="text" id="challenge-title" value={title} onChange={e => setTitle(e.target.value)} required className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm pr-10" />
                <AiTextGenerator
                    apiKey={apiKey}
                    context="a title for a major goal"
                    onGenerated={setTitle}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                />
            </div>
          </div>
          <div>
            <label htmlFor="challenge-description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <div className="relative">
                <textarea id="challenge-description" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm pr-10" />
                 <AiTextGenerator
                    apiKey={apiKey}
                    context="a short description for a major goal"
                    onGenerated={setDescription}
                    className="absolute right-2 top-2"
                />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="challenge-type" className="block text-sm font-medium text-text-secondary">Type</label>
              <select id="challenge-type" value={type} onChange={e => setType(e.target.value as 'Siege' | 'Forge' | 'Gauntlet')} className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm">
                <option value="Forge">Forge (Project)</option>
                <option value="Siege">Siege (Exam)</option>
                <option value="Gauntlet">Gauntlet (Event)</option>
              </select>
            </div>
            <div>
                <label htmlFor="challenge-deadline" className="block text-sm font-medium text-text-secondary">Deadline</label>
                <input type="date" id="challenge-deadline" value={deadline} onChange={e => setDeadline(e.target.value)} required className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm" />
            </div>
          </div>

          {type === 'Siege' && (
            <>
              <div>
                <label htmlFor="challenge-skill" className="block text-sm font-medium text-text-secondary">Associated Skill</label>
                <select id="challenge-skill" value={skillId} onChange={e => setSkillId(e.target.value)} required className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm">
                  {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="challenge-syllabus" className="block text-sm font-medium text-text-secondary">Syllabus / Key Topics</label>
                <textarea id="challenge-syllabus" value={syllabus} onChange={e => setSyllabus(e.target.value)} rows={4} placeholder="e.g., Chapter 1: Topic A, Chapter 2: Topic B, etc." className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm" />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label htmlFor="challenge-xp" className="block text-sm font-medium text-text-secondary">XP Reward</label>
                <input type="number" id="challenge-xp" value={xpReward} onChange={e => setXpReward(Number(e.target.value))} min="0" className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm" />
            </div>
             <div>
                <label htmlFor="challenge-credits" className="block text-sm font-medium text-text-secondary">Credit Reward</label>
                <input type="number" id="challenge-credits" value={creditReward} onChange={e => setCreditReward(Number(e.target.value))} min="0" className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary sm:text-sm" />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button type="button" onClick={onClose} className="bg-border-color hover:bg-opacity-80 text-text-primary font-bold py-2 px-4 rounded mr-2">Cancel</button>
            <button type="submit" className="bg-accent-primary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded">Save Goal</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditMajorGoalModal;