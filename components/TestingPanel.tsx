import React, { useState, useEffect } from 'react';
// FIX: Imported MajorGoal type to resolve definition errors.
import { User, StoreItem, Realm, Skill, MajorGoal, Arc } from '../types';
import { ALL_ARCS } from '../constants';
import { TestTube2, ChevronsRight, RefreshCcw, ArrowUp, DollarSign, Gift, Plus, AlertTriangle, Power, ChevronDown, User as UserIcon, Dna, Settings, Package, Gem, TrendingUp, BrainCircuit, Heart, Zap, Sparkles, Wand2, Trash2, FlaskConical, ShieldCheck, Loader2 } from 'lucide-react';

interface TestingPanelProps {
  user: User;
  storeItems: StoreItem[];
  simulateApiError: boolean;
  onAddXp: (amount: number) => void;
  onAddCredits: (amount: number) => void;
  onResetUser: () => void;
  onAddItem: (itemId: string) => void;
  onResetLootbox: () => void;
  onToggleApiError: () => void;
  onAddSkillXp: (skillId: string, amount: number) => void;
  onClearQuests: () => void;
  onClearInventory: () => void;
  onSetStat: (realm: Realm, value: number) => void;
  onSetStreak: (streak: number) => void;
  onAddGems: (amount: number) => void;
  onAddQuest: (type: 'timed' | 'mystery') => void;
  onDevGenerateText: (prompt: string) => Promise<string>;
  userGoal: string;
  majorGoals: MajorGoal[];
  timeOffsetInHours: number;
  onUpdateGoal: (goal: string) => void;
  onUpdateMajorGoals: (goals: MajorGoal[]) => void;
  onSetTimeOffsetHours: (offset: number) => void;
  onInduceAnomaly: () => void;
  onRunDiagnostics: () => string[];
  currentDate: Date;
}

const CollapsibleSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
    const [isSectionOpen, setIsSectionOpen] = useState(defaultOpen);
    return (
        <div>
            <button onClick={() => setIsSectionOpen(!isSectionOpen)} className="w-full flex justify-between items-center font-semibold my-2 text-orange-300 hover:text-orange-200">
                <span className="flex items-center space-x-2">{icon} <span>{title}</span></span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isSectionOpen ? 'rotate-180' : ''}`} />
            </button>
            {isSectionOpen && (
                <div className="space-y-2 bg-gray-800 p-3 rounded-lg">
                    {children}
                </div>
            )}
        </div>
    )
};


const TestingPanel: React.FC<TestingPanelProps> = (props) => {
  const { user, storeItems, onAddXp, onSetStat, onSetStreak, onAddGems, onAddQuest, onAddSkillXp, onClearQuests, onClearInventory, onDevGenerateText, userGoal, majorGoals, timeOffsetInHours, onUpdateGoal, onUpdateMajorGoals, onSetTimeOffsetHours, onInduceAnomaly, onRunDiagnostics, currentDate } = props;
  const [isOpen, setIsOpen] = useState(false);

  // State for inputs
  const [xpAmount, setXpAmount] = useState(100);
  const [creditsAmount, setCreditsAmount] = useState(50);
  const [gemsAmount, setGemsAmount] = useState(10);
  const [streakAmount, setStreakAmount] = useState(user.streaks.daily_streak);
  const [selectedItemId, setSelectedItemId] = useState(storeItems[0]?.id || '');
  const [selectedSkillId, setSelectedSkillId] = useState(Object.keys(user.skill_tree)[0] || '');
  const [skillXpAmount, setSkillXpAmount] = useState(100);
  const [stats, setStats] = useState(user.stats);
  const [devPrompt, setDevPrompt] = useState('Tell me a short story about a futuristic engineer.');
  const [devResponse, setDevResponse] = useState('');
  const [isDevGenerating, setIsDevGenerating] = useState(false);
  const [goalText, setGoalText] = useState(userGoal);
  const [timeOffsetText, setTimeOffsetText] = useState(timeOffsetInHours.toString());
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDays, setNewGoalDays] = useState('7');

  // Diagnostics state
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<string[] | null>(null);

  useEffect(() => {
    setTimeOffsetText(timeOffsetInHours.toString());
  }, [timeOffsetInHours]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition-transform transform hover:scale-110 z-[60]"
        aria-label="Open Testing Panel"
      >
        <TestTube2 className="w-6 h-6" />
      </button>
    );
  }

  const xpForLevelUp = Math.max(0, user.xpToNextLevel - user.xp_total);

  const handleStatChange = (realm: Realm, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setStats(prev => ({ ...prev, [realm]: numValue }));
  }
  const applyStatChange = (realm: Realm) => {
    onSetStat(realm, stats[realm]);
  }
  
  const handleDevPrompt = async () => {
    setIsDevGenerating(true);
    setDevResponse('Generating...');
    const response = await onDevGenerateText(devPrompt);
    setDevResponse(response);
    setIsDevGenerating(false);
  }

  const handleRunDiagnosticScan = () => {
      setIsDiagnosing(true);
      setDiagnosticReport(null);
      setTimeout(() => {
          const report = onRunDiagnostics();
          setDiagnosticReport(report);
          setIsDiagnosing(false);
      }, 500); // Simulate scan time
  }

  return (
    <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-gray-900 border-l-2 border-orange-500 shadow-2xl z-[60] overflow-y-auto text-sm p-4 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-orange-400 flex items-center">
            <TestTube2 className="w-6 h-6 mr-2"/>
            Testing Panel
        </h2>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
            <ChevronsRight className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-1">

        <CollapsibleSection title="Player" icon={<UserIcon size={16}/>} defaultOpen>
            <div className="flex items-center space-x-2">
                <input type="number" value={xpAmount} onChange={e => setXpAmount(parseInt(e.target.value, 10) || 0)} className="w-20 bg-gray-700 p-1 rounded" />
                <button onClick={() => onAddXp(xpAmount)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-1"><Plus size={14} /><span>XP</span></button>
            </div>
            <div className="flex items-center space-x-2">
                <input type="number" value={creditsAmount} onChange={e => setCreditsAmount(parseInt(e.target.value, 10))} className="w-20 bg-gray-700 p-1 rounded" />
                <button onClick={() => props.onAddCredits(creditsAmount)} className="flex-1 bg-green-600 hover:bg-green-700 text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-1"><DollarSign size={14} /><span>Credits</span></button>
            </div>
             <div className="flex items-center space-x-2">
                <input type="number" value={gemsAmount} onChange={e => setGemsAmount(parseInt(e.target.value, 10) || 0)} className="w-20 bg-gray-700 p-1 rounded" />
                <button onClick={() => onAddGems(gemsAmount)} className="flex-1 bg-pink-600 hover:bg-pink-700 text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-1"><Gem size={14} /><span>Gems</span></button>
            </div>
             <div className="flex items-center space-x-2">
                <input type="number" value={streakAmount} onChange={e => setStreakAmount(parseInt(e.target.value, 10) || 0)} className="w-20 bg-gray-700 p-1 rounded" />
                <button onClick={() => onSetStreak(streakAmount)} className="flex-1 bg-red-600 hover:bg-red-700 text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-1"><TrendingUp size={14} /><span>Set Streak</span></button>
            </div>
            <button onClick={() => onAddXp(xpForLevelUp)} className="w-full bg-yellow-600 hover:bg-yellow-700 text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-1">
                <ArrowUp size={14}/> <span>Level Up (+{xpForLevelUp} XP)</span>
            </button>
        </CollapsibleSection>

        <CollapsibleSection title="System Diagnostics" icon={<ShieldCheck size={16}/>}>
             <p className="text-xs text-gray-400 mb-2">
                Scan the application state for logical inconsistencies and bugs.
            </p>
            <button
                onClick={handleRunDiagnosticScan}
                disabled={isDiagnosing}
                className="w-full text-xs font-bold py-2 px-2 rounded flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800"
            >
                {isDiagnosing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14}/>}
                <span>{isDiagnosing ? 'Scanning...' : 'Run Diagnostics'}</span>
            </button>
            {diagnosticReport && (
                <div className="mt-2 p-2 bg-gray-900 rounded text-xs space-y-1">
                    {diagnosticReport.length === 0 ? (
                        <p className="text-green-400 font-semibold">System Nominal. No issues found.</p>
                    ) : (
                        <>
                            <p className="text-red-400 font-semibold">{diagnosticReport.length} issue(s) found:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-300">
                                {diagnosticReport.map((finding, index) => (
                                    <li key={index}>{finding}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}
        </CollapsibleSection>
        
        <CollapsibleSection title="System Corruption" icon={<FlaskConical size={16}/>}>
            <p className="text-xs text-gray-400 mb-2">
                Intentionally inject non-crashing bugs into the application state to test UI resilience.
            </p>
            <div className="space-y-2">
                <button
                    onClick={onInduceAnomaly}
                    className="w-full text-xs font-bold py-2 px-2 rounded flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-500 text-black"
                >
                    <FlaskConical size={14}/><span>Induce Random Anomaly</span>
                </button>
                 <button
                    onClick={props.onResetUser}
                    className="w-full text-xs font-bold py-2 px-2 rounded flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-500"
                >
                    <RefreshCcw size={14}/><span>Repair System</span>
                </button>
            </div>
        </CollapsibleSection>

        <CollapsibleSection title="Environment" icon={<Settings size={16}/>}>
            <div className="space-y-2 p-2 bg-gray-700/50 rounded">
                <label className="text-xs font-semibold">Time Control</label>
                <p className="text-xs text-gray-400">Current Sim Date: {currentDate.toLocaleString()}</p>
                <div className="flex items-center space-x-2">
                    <input type="number" value={timeOffsetText} onChange={e => setTimeOffsetText(e.target.value)} className="w-20 bg-gray-700 p-1 rounded" />
                    <button onClick={() => onSetTimeOffsetHours(parseInt(timeOffsetText, 10) || 0)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-xs font-bold py-1 px-2 rounded">Set Hour Offset</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => onSetTimeOffsetHours(timeOffsetInHours + 1)} className="bg-gray-600 hover:bg-gray-500 text-xs font-bold py-1 px-2 rounded">+1 Hr</button>
                    <button onClick={() => onSetTimeOffsetHours(timeOffsetInHours + 6)} className="bg-gray-600 hover:bg-gray-500 text-xs font-bold py-1 px-2 rounded">+6 Hrs</button>
                    <button onClick={() => onSetTimeOffsetHours(timeOffsetInHours + 12)} className="bg-gray-600 hover:bg-gray-500 text-xs font-bold py-1 px-2 rounded">+12 Hrs</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => onSetTimeOffsetHours(timeOffsetInHours + 24)} className="bg-gray-600 hover:bg-gray-500 text-xs font-bold py-1 px-2 rounded">+1 Day</button>
                    <button onClick={() => onSetTimeOffsetHours(timeOffsetInHours + 168)} className="bg-gray-600 hover:bg-gray-500 text-xs font-bold py-1 px-2 rounded">+7 Days</button>
                    <button onClick={() => { onSetTimeOffsetHours(0); setTimeOffsetText('0'); }} className="bg-gray-600 hover:bg-gray-500 text-xs font-bold py-1 px-2 rounded">Reset</button>
                </div>
            </div>
            <div className="space-y-1 p-2 bg-gray-700/50 rounded mt-2">
                <label className="text-xs font-semibold">User's Long-Term Goal</label>
                <textarea 
                    value={goalText}
                    onChange={e => setGoalText(e.target.value)}
                    className="w-full h-24 bg-gray-700 p-2 rounded text-xs font-mono"
                />
                <button onClick={() => onUpdateGoal(goalText)} className="w-full text-xs font-bold py-1 px-2 rounded bg-indigo-600 hover:bg-indigo-500">Save Goal</button>
            </div>
            <div className="space-y-1 p-2 bg-gray-700/50 rounded mt-2">
                <label className="text-xs font-semibold">Major Goals / Deadlines</label>
                <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                    {majorGoals.map(goal => (
                        <div key={goal.id} className="flex justify-between items-center bg-gray-800 p-1 rounded">
                            <span>{goal.title} ({new Date(goal.deadline).toLocaleDateString()})</span>
                            <button onClick={() => onUpdateMajorGoals(majorGoals.filter(e => e.id !== goal.id))} className="text-red-400 hover:text-red-300 p-0.5"><Trash2 size={14} /></button>
                        </div>
                    ))}
                    {majorGoals.length === 0 && <p className="text-gray-500 italic text-center text-xs">No major goals.</p>}
                </div>
                <div className="flex items-center space-x-2 pt-2 border-t border-gray-600">
                     <input type="text" placeholder="Goal Title" value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} className="flex-grow bg-gray-700 p-1 rounded text-xs"/>
                     <input type="number" title="Days from now" value={newGoalDays} onChange={e => setNewGoalDays(e.target.value)} className="w-16 bg-gray-700 p-1 rounded text-xs"/>
                     <button onClick={() => {
                        if (!newGoalTitle.trim()) return;
                        const newDate = new Date(currentDate);
                        newDate.setDate(newDate.getDate() + parseInt(newGoalDays, 10));
                        const newGoal: MajorGoal = {
                            id: `dev-goal-${Date.now()}`,
                            title: newGoalTitle,
                            description: 'Developer-added goal.',
                            deadline: newDate.toISOString(),
                            type: 'Forge',
                            xp_reward: 500,
                            credit_reward: 100
                        };
                        onUpdateMajorGoals([...majorGoals, newGoal]);
                        setNewGoalTitle('');
                        setNewGoalDays('7');
                     }} className="bg-green-600 hover:bg-green-500 text-xs font-bold py-1 px-2 rounded">Add</button>
                </div>
                <button onClick={() => onUpdateMajorGoals([])} className="w-full mt-2 text-xs font-bold py-1 px-2 rounded bg-red-800 hover:bg-red-700">Clear All Goals</button>
            </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Skills & Stats" icon={<Settings size={16}/>}>
            <div className="flex items-center space-x-2">
                <select value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)} className="flex-grow bg-gray-700 p-1 rounded text-xs w-full">
                    {
                        Object.values(user.skill_tree).map((skill: Skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)
                    }
                </select>
                <input type="number" value={skillXpAmount} onChange={e => setSkillXpAmount(parseInt(e.target.value, 10) || 0)} className="w-20 bg-gray-700 p-1 rounded" />
                <button onClick={() => onAddSkillXp(selectedSkillId, skillXpAmount)} className="bg-blue-600 hover:bg-blue-700 text-xs font-bold py-1 px-2 rounded">Add XP</button>
            </div>
             <div className="grid grid-cols-2 gap-2 mt-2">
                {[Realm.Mind, Realm.Body, Realm.Creation, Realm.Spirit].map(realm => (
                    <div key={realm} className="flex items-center space-x-1">
                        <span className="text-xs w-12">{realm}</span>
                        <input type="number" value={stats[realm]} onChange={e => handleStatChange(realm, e.target.value)} className="w-16 bg-gray-700 p-1 rounded" />
                        <button onClick={() => applyStatChange(realm)} className="bg-gray-600 hover:bg-gray-500 p-1 rounded text-xs">Set</button>
                    </div>
                ))}
            </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Game State" icon={<Settings size={16}/>}>
            <button onClick={onClearQuests} className="w-full text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-500">
                <span>Clear All Quests</span>
            </button>
             <button onClick={onClearInventory} className="w-full text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-500">
                <span>Clear Inventory</span>
            </button>
            <div className="flex items-center justify-between">
                <label htmlFor="api-error-toggle" className="text-gray-300 text-xs font-medium flex items-center space-x-2">
                    <AlertTriangle size={14} /><span>Simulate API Error</span>
                </label>
                <button id="api-error-toggle" onClick={props.onToggleApiError} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${props.simulateApiError ? 'bg-red-500' : 'bg-gray-600'}`}>
                    <span className={`block w-4 h-4 rounded-full bg-white transform transition-transform ${props.simulateApiError ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>
            <button onClick={props.onResetLootbox} className="w-full text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700"><Gift size={14} /><span>Reset Lootbox</span></button>
            <button onClick={props.onResetUser} className="w-full bg-red-600 hover:bg-red-700 text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-2"><Power size={14} /><span>Full State Reset</span></button>
        </CollapsibleSection>
        
        <CollapsibleSection title="AI Prompting" icon={<Wand2 size={16}/>}>
            <textarea 
                value={devPrompt}
                onChange={e => setDevPrompt(e.target.value)}
                className="w-full h-32 bg-gray-700 p-2 rounded text-xs font-mono"
                placeholder="Enter a custom prompt for Gemini..."
            />
            <button onClick={handleDevPrompt} disabled={isDevGenerating} className="w-full text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-500">
                {isDevGenerating ? 'Generating...' : 'Generate Text'}
            </button>
            {devResponse && (
                <pre className="mt-2 bg-gray-800 p-3 rounded-lg text-xs overflow-x-auto h-48 border border-gray-600">
                    {devResponse}
                </pre>
            )}
        </CollapsibleSection>

        <CollapsibleSection title="Inventory" icon={<Package size={16}/>}>
            <div className="flex items-center space-x-2">
                <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="flex-grow bg-gray-700 p-1 rounded text-xs w-full">
                    {storeItems.map((item: StoreItem) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <button onClick={() => props.onAddItem(selectedItemId)} className="bg-blue-600 hover:bg-blue-700 text-xs font-bold py-1 px-2 rounded">Add</button>
            </div>
        </CollapsibleSection>

         <CollapsibleSection title="Quests" icon={<Dna size={16}/>}>
            <div className="flex space-x-2">
                <button onClick={() => onAddQuest('timed')} className="w-full text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-500">Add Timed Quest</button>
                <button onClick={() => onAddQuest('mystery')} className="w-full text-xs font-bold py-1 px-2 rounded flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-500">Add Mystery Quest</button>
            </div>
        </CollapsibleSection>

        <CollapsibleSection title="User State" icon={<UserIcon size={16} />}>
            <pre className="bg-gray-800 p-3 rounded-lg text-xs overflow-x-auto h-96">
                {JSON.stringify(user, null, 2)}
            </pre>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default TestingPanel;