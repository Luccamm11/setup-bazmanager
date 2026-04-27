import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Skill, Realm } from '../types';
import { SKILL_REALMS } from '../constants';
import AiTextGenerator from './AiTextGenerator';

interface AddEditSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (skillData: { id?: string; name: string; realm: Realm }) => void;
  skillToEdit: Skill | null;
  apiKey: string;
}

const AddEditSkillModal: React.FC<AddEditSkillModalProps> = ({ isOpen, onClose, onSave, skillToEdit, apiKey }) => {
  const [name, setName] = useState(skillToEdit?.name || '');
  const [realm, setRealm] = useState<Realm>(skillToEdit?.realm || SKILL_REALMS[0]);

  useEffect(() => {
    if (skillToEdit) {
      setName(skillToEdit.name);
      setRealm(skillToEdit.realm);
    } else {
      setName('');
      setRealm(SKILL_REALMS[0]);
    }
  }, [skillToEdit, isOpen]);

  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
        id: skillToEdit?.id,
        name,
        realm,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-md relative border border-border-color" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-text-primary">{skillToEdit ? 'Edit Skill' : 'Add New Skill'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="skill-name" className="block text-sm font-medium text-text-secondary mb-1">Skill Name</label>
             <div className="relative">
                <input 
                    type="text" 
                    id="skill-name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary sm:text-sm pr-10" 
                />
                <AiTextGenerator
                    apiKey={apiKey}
                    context="a name for a new skill"
                    onGenerated={setName}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                />
            </div>
          </div>
          
          <div>
            <label htmlFor="skill-realm" className="block text-sm font-medium text-text-secondary">Realm</label>
            <select 
                id="skill-realm" 
                value={realm} 
                onChange={e => setRealm(e.target.value as Realm)} 
                className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary sm:text-sm"
            >
              {SKILL_REALMS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button type="button" onClick={onClose} className="bg-border-color hover:bg-opacity-80 text-text-primary font-bold py-2 px-4 rounded mr-2">Cancel</button>
            <button type="submit" className="bg-accent-primary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded">Save Skill</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditSkillModal;