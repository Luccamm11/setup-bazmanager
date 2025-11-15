import React, { useState, useEffect } from 'react';
import { X, Wand2, Loader2, Lightbulb, GraduationCap, ArrowRight } from 'lucide-react';
import { AiRecommendations, AiSkillRecommendation, AiTopicRecommendation, Realm, Skill } from '../types';

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: AiRecommendations | null;
  onSave: (
    selectedSkills: { name: string; realm: Realm }[],
    selectedTopics: { name: string; skillId: string }[]
  ) => void;
  isLoading: boolean;
  userSkills: { [id: string]: Skill };
}

const RecommendationsModal: React.FC<RecommendationsModalProps> = ({ isOpen, onClose, recommendations, onSave, isLoading, userSkills }) => {
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (recommendations) {
      setSelectedSkills(new Set(recommendations.skills.map(s => s.name)));
      setSelectedTopics(new Set(recommendations.topics.map(t => t.name)));
    } else {
      setSelectedSkills(new Set());
      setSelectedTopics(new Set());
    }
  }, [recommendations]);

  if (!isOpen) return null;

  const handleSkillToggle = (skillName: string) => {
    setSelectedSkills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skillName)) {
        newSet.delete(skillName);
      } else {
        newSet.add(skillName);
      }
      return newSet;
    });
  };

  const handleTopicToggle = (topicName: string) => {
    setSelectedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicName)) {
        newSet.delete(topicName);
      } else {
        newSet.add(topicName);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    const skillsToSave = recommendations?.skills.filter(s => selectedSkills.has(s.name)) || [];
    const topicsToSave = recommendations?.topics.filter(t => selectedTopics.has(t.name)) || [];
    onSave(skillsToSave, topicsToSave);
  };

  const totalSelected = selectedSkills.size + selectedTopics.size;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center min-h-[20rem] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-accent-tertiary animate-spin mx-auto" />
          <p className="mt-4 text-text-secondary">The System is analyzing your profile...</p>
          <p className="text-sm text-text-muted">Generating personalized recommendations.</p>
        </div>
      );
    }

    if (!recommendations) {
        return (
             <div className="text-center min-h-[20rem] flex flex-col items-center justify-center">
                <X className="w-12 h-12 text-accent-red mx-auto" />
                <p className="mt-4 text-text-secondary">Failed to generate recommendations.</p>
                <p className="text-sm text-text-muted">Please try again.</p>
            </div>
        )
    }

    const { skills, topics } = recommendations;

    return (
        <div className="space-y-6">
            {skills.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center"><GraduationCap className="mr-2"/>Recommended New Skills</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto bg-background p-3 rounded-md">
                        {skills.map((skill) => (
                             <label key={skill.name} className="flex items-start space-x-3 p-2 rounded hover:bg-border-color/50 cursor-pointer">
                                <input type="checkbox" checked={selectedSkills.has(skill.name)} onChange={() => handleSkillToggle(skill.name)} className="h-5 w-5 rounded bg-background-tertiary border-border-color text-accent-tertiary focus:ring-accent-tertiary mt-1" />
                                <div className="flex-1">
                                    <p className="text-text-primary font-semibold">{skill.name} <span className="text-xs font-mono text-text-secondary">({skill.realm})</span></p>
                                    <p className="text-xs text-text-secondary italic">"{skill.reason}"</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            {topics.length > 0 && (
                 <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center"><Lightbulb className="mr-2"/>Recommended New Topics</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-background p-3 rounded-md">
                        {topics.map((topic) => (
                             <label key={topic.name} className="flex items-start space-x-3 p-2 rounded hover:bg-border-color/50 cursor-pointer">
                                <input type="checkbox" checked={selectedTopics.has(topic.name)} onChange={() => handleTopicToggle(topic.name)} className="h-5 w-5 rounded bg-background-tertiary border-border-color text-accent-tertiary focus:ring-accent-tertiary mt-1" />
                                <div className="flex-1">
                                    <p className="text-text-primary font-semibold">{topic.name}</p>
                                    <p className="text-xs text-text-secondary flex items-center">
                                        For Skill: <span className="font-bold text-accent-primary ml-1.5">{userSkills[topic.skillId]?.name || 'Unknown Skill'}</span>
                                    </p>
                                    <p className="text-xs text-text-secondary italic mt-1">"{topic.reason}"</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
  };


  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-2xl relative border border-border-color max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-3 mb-4">
          <Wand2 className="w-8 h-8 text-accent-tertiary" />
          <div>
            <h2 className="text-2xl font-bold text-text-primary">AI Recommendations</h2>
            <p className="text-text-secondary">Your personalized growth path suggestions.</p>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
            {renderContent()}
        </div>

        <div className="pt-6 flex justify-end space-x-2 border-t border-border-color mt-4">
          <button type="button" onClick={onClose} className="bg-border-color hover:bg-opacity-80 text-text-primary font-bold py-2 px-4 rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || totalSelected === 0}
            className="bg-accent-tertiary hover:bg-opacity-80 disabled:bg-border-color disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded"
          >
            Add Selected ({totalSelected})
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;