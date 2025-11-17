import React from 'react';
import { JournalEntry, Quest } from '../types';
import QuestCard from './QuestCard';
import { BookText } from 'lucide-react';

interface JournalProps {
  journalEntries: JournalEntry[];
  quests: Quest[];
  onCompleteQuest: (questId: string) => void;
  currentDate: Date;
}

const Journal: React.FC<JournalProps> = ({ journalEntries, quests, onCompleteQuest, currentDate }) => {
  const sortedEntries = [...journalEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">Journal & AARs</h2>
      <div className="max-w-3xl mx-auto space-y-8">
        {sortedEntries.length > 0 ? sortedEntries.map(entry => {
          const checklistQuests = entry.generatedChecklistQuestIds
            .map(id => quests.find(q => q.id === id))
            .filter((q): q is Quest => !!q);

          return (
            <div key={entry.id} className="bg-primary p-4 sm:p-6 rounded-lg border border-border-color">
              <div className="border-b border-border-color pb-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-accent-primary">AAR: {entry.majorGoalTitle}</h3>
                  <span className="text-sm text-text-secondary">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{entry.reflectionText}</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-3">Improvement Plan</h4>
                {checklistQuests.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {checklistQuests.map(quest => (
                      <QuestCard key={quest.id} quest={quest} onComplete={onCompleteQuest} currentDate={currentDate} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted italic">All improvement tasks completed.</p>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-10 px-4 bg-primary rounded-lg border border-border-color">
            <BookText className="w-12 h-12 mx-auto text-text-muted mb-4" />
            <p className="text-text-secondary">Your journal is empty.</p>
            <p className="text-text-muted mt-2">Use the "Journal" tab in the Chat interface to reflect on completed Major Goals.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
