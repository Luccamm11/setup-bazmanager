import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { KnowledgeTopic, Skill, TopicDifficulty } from '../types';
import AiTextGenerator from './AiTextGenerator';

interface AddEditTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (topicData: { id?: string; name: string; skillId: string; difficulty: TopicDifficulty }) => void;
  topicToEdit: KnowledgeTopic | null;
  skills: Skill[];
  defaultSkillId?: string;
  apiKey: string;
}

const AddEditTopicModal: React.FC<AddEditTopicModalProps> = ({ isOpen, onClose, onSave, topicToEdit, skills, defaultSkillId, apiKey }) => {
  const [name, setName] = useState('');
  const [skillId, setSkillId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<TopicDifficulty>(TopicDifficulty.Easy);

  useEffect(() => {
    if (topicToEdit) {
      setName(topicToEdit.name);
      setSkillId(topicToEdit.skillId);
      setDifficulty(topicToEdit.difficulty);
    } else {
      setName('');
      setSkillId(defaultSkillId || (skills.length > 0 ? skills[0].id : ''));
      setDifficulty(TopicDifficulty.Easy);
    }
  }, [topicToEdit, isOpen, skills, defaultSkillId]);

  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !skillId) {
        alert("Please provide a name and select a skill.");
        return;
    };
    onSave({
        id: topicToEdit?.id,
        name,
        skillId,
        difficulty
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-md relative border border-border-color" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-text-primary">{topicToEdit ? 'Edit Topic' : 'Add New Topic'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="topic-name" className="block text-sm font-medium text-text-secondary mb-1">Topic Name</label>
            <div className="relative">
                <input 
                    type="text" 
                    id="topic-name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary sm:text-sm pr-10" 
                />
                 <AiTextGenerator
                    apiKey={apiKey}
                    context={`a knowledge topic name related to the skill "${skills.find(s => s.id === skillId)?.name || ''}"`}
                    onGenerated={setName}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                />
            </div>
          </div>
          
          <div>
            <label htmlFor="topic-skill" className="block text-sm font-medium text-text-secondary">Associated Skill</label>
            <select 
                id="topic-skill" 
                value={skillId} 
                onChange={e => setSkillId(e.target.value)} 
                className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary sm:text-sm"
            >
              {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

           <div>
            <label htmlFor="topic-difficulty" className="block text-sm font-medium text-text-secondary">Difficulty</label>
            <select 
                id="topic-difficulty" 
                value={difficulty} 
                onChange={e => setDifficulty(e.target.value as TopicDifficulty)} 
                className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary sm:text-sm"
            >
              {Object.values(TopicDifficulty).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button type="button" onClick={onClose} className="bg-border-color hover:bg-opacity-80 text-text-primary font-bold py-2 px-4 rounded mr-2">Cancel</button>
            <button type="submit" className="bg-accent-primary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded">Save Topic</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditTopicModal;