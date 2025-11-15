import React from 'react';
import { StoryLogEntry } from '../types';
import { BookMarked } from 'lucide-react';

interface StoryLogProps {
  entries: StoryLogEntry[];
}

const StoryLog: React.FC<StoryLogProps> = ({ entries }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">Story Log</h2>
      <div className="max-w-3xl mx-auto space-y-8">
        {entries.map((entry, index) => (
          <div key={entry.id} className="bg-primary p-4 sm:p-6 rounded-lg border border-border-color border-l-4 border-accent-tertiary">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
              <h3 className="text-xl sm:text-2xl font-bold text-accent-primary">{entry.title}</h3>
              <span className="text-sm text-text-secondary">{entry.date}</span>
            </div>
            <p className="text-text-primary leading-relaxed whitespace-pre-line">{entry.narrative}</p>
          </div>
        ))}
        {entries.length === 0 && (
             <div className="text-center py-10 px-4 bg-primary rounded-lg border border-border-color">
                <BookMarked className="w-12 h-12 mx-auto text-text-muted mb-4" />
                <p className="text-text-secondary">Your story is yet to be written.</p>
                <p className="text-text-muted mt-2">Complete quests and a narrative of your week will appear here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default StoryLog;