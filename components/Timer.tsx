import React, { useState, useEffect } from 'react';
import { Timer as TimerIcon, Play, CheckCircle } from 'lucide-react';
import { Realm, ActiveTimedQuest } from '../types';
import { SKILL_REALMS } from '../constants';
import AiTextGenerator from './AiTextGenerator';

interface TimerProps {
  activeQuest: ActiveTimedQuest | null;
  onStartQuest: (title: string, realm: Realm, estimatedMinutes: number) => void;
  onCompleteQuest: () => void;
  apiKey: string;
}

const TimerDisplay: React.FC<{ startTime: string, targetMinutes: number }> = ({ startTime, targetMinutes }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startTimestamp = new Date(startTime).getTime();
    const updateTimer = () => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTimestamp) / 1000));
    };
    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [startTime]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const targetSeconds = targetMinutes * 60;
  const isOvertime = elapsedSeconds > targetSeconds;

  return (
    <div className="text-center">
      <p className={`font-mono text-7xl md:text-8xl font-bold transition-colors ${isOvertime ? 'text-accent-red' : 'text-text-primary'}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </p>
      <p className="text-lg text-text-secondary">Target: {targetMinutes}:00</p>
    </div>
  );
};

const Timer: React.FC<TimerProps> = ({ activeQuest, onStartQuest, onCompleteQuest, apiKey }) => {
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [realm, setRealm] = useState<Realm>(SKILL_REALMS[0]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && estimatedMinutes > 0) {
      onStartQuest(title, realm, estimatedMinutes);
    }
  };

  if (activeQuest) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center h-full py-8">
        <div className="bg-primary p-8 rounded-lg border border-border-color w-full">
          <p className="text-text-secondary text-lg">Quest in Progress</p>
          <h2 className="text-3xl font-bold text-accent-primary my-4">{activeQuest.title}</h2>
          <TimerDisplay startTime={activeQuest.startTime} targetMinutes={activeQuest.estimatedMinutes} />
          <button
            onClick={onCompleteQuest}
            className="mt-8 w-full flex items-center justify-center space-x-3 bg-accent-green hover:bg-accent-green-hover text-white font-bold py-4 px-6 rounded-lg transition-transform transform hover:scale-105 text-xl"
          >
            <CheckCircle size={24} />
            <span>Complete Quest</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-3">
            <TimerIcon className="w-8 h-8"/>
            Timed Quest
        </h2>
        <p className="text-text-secondary mt-1">Start a timer for an ad-hoc task and earn rewards.</p>
      </div>
      <div className="bg-primary p-6 rounded-lg border border-border-color">
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Quest Title</label>
            <div className="relative">
              <input
                type="text"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="e.g., Study Chapter 3"
                className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary sm:text-sm pr-10"
              />
              <AiTextGenerator
                apiKey={apiKey}
                context="a title for a short, timed quest"
                onGenerated={setTitle}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="minutes" className="block text-sm font-medium text-text-secondary">Est. Time (minutes)</label>
              <input
                type="number"
                id="minutes"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                min="1"
                required
                className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="realm" className="block text-sm font-medium text-text-secondary">Realm</label>
              <select
                id="realm"
                value={realm}
                onChange={e => setRealm(e.target.value as Realm)}
                className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary sm:text-sm"
              >
                {SKILL_REALMS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-accent-primary hover:bg-opacity-80 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
            >
              <Play size={20} />
              <span>Start Timer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Timer;