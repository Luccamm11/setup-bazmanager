import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MajorGoal } from '../types';
import { Bot, User, Send, BookText, MessageSquare, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatbotProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  completedMajorGoals: MajorGoal[];
  onJournalSubmit: (goalId: string, reflection: string) => void;
}

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.sender === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUser ? 'bg-accent-tertiary' : 'bg-border-color'}`}>
                {isUser ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-text-primary" />}
            </div>
            <div className={`p-4 rounded-lg max-w-lg ${isUser ? 'bg-accent-tertiary text-white rounded-br-none' : 'bg-primary text-text-primary rounded-bl-none'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                <p className="text-xs text-text-secondary mt-2 text-right">{message.timestamp}</p>
            </div>
        </div>
    )
};

const Chatbot: React.FC<ChatbotProps> = ({ history, onSendMessage, isLoading, completedMajorGoals, onJournalSubmit }) => {
  const { t } = useTranslation('chat');
  const [mode, setMode] = useState<'chat' | 'journal'>('chat');
  const [input, setInput] = useState('');
  const [reflection, setReflection] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (completedMajorGoals && completedMajorGoals.length > 0 && !selectedGoalId) {
      setSelectedGoalId(completedMajorGoals[0].id);
    }
  }, [completedMajorGoals, selectedGoalId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history, isLoading]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reflection.trim() && selectedGoalId && !isLoading) {
      onJournalSubmit(selectedGoalId, reflection.trim());
      setReflection('');
    }
  };

  return (
    <div className="flex flex-col flex-grow max-w-4xl mx-auto w-full">
       <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">{t('chatbot')}</h2>
       <div className="flex-grow bg-primary rounded-lg border border-border-color flex flex-col overflow-hidden">
        {/* Mode switcher */}
        <div className="flex border-b border-border-color">
          <button
            onClick={() => setMode('chat')}
            className={`flex-1 p-3 font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'chat' ? 'bg-background text-accent-primary' : 'text-text-secondary hover:bg-border-color/50'}`}
          >
            <MessageSquare size={18} /> {t('chat_mode')}
          </button>
          <button
            onClick={() => setMode('journal')}
            className={`flex-1 p-3 font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'journal' ? 'bg-background text-accent-primary' : 'text-text-secondary hover:bg-border-color/50'}`}
          >
            <BookText size={18} /> {t('journal_mode')}
          </button>
        </div>

        {mode === 'chat' && (
          <>
            <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                {history.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                {isLoading && (
                    <div className="flex items-start gap-3 flex-row">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-border-color">
                            <Bot className="w-6 h-6 text-text-primary" />
                        </div>
                        <div className="p-4 rounded-lg bg-primary text-text-primary rounded-bl-none">
                            <div className="flex items-center space-x-2">
                               <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse"></div>
                               <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                               <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-primary border-t border-border-color">
                <form onSubmit={handleChatSubmit} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('type_message')}
                        disabled={isLoading}
                        className="w-full bg-background text-text-primary rounded-lg p-4 pr-20 border border-border-color focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-accent-primary text-white disabled:bg-border-color disabled:text-text-muted hover:bg-opacity-80 transition-colors"
                        aria-label={t('send')}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
          </>
        )}
        {mode === 'journal' && (
          <div className="flex-grow p-6 overflow-y-auto">
            <h3 className="text-xl font-bold text-text-primary">{t('journal_mode')}</h3>
            <p className="text-sm text-text-secondary mb-4">{t('chatbot_subtitle')}</p>
            {completedMajorGoals.length === 0 ? (
              <div className="text-center p-8 bg-background rounded-lg border border-border-color">
                <p className="text-text-secondary">{t('no_messages')}</p>
              </div>
            ) : (
              <form onSubmit={handleJournalSubmit} className="space-y-4">
                <div>
                  <label htmlFor="journal-goal" className="block text-sm font-medium text-text-secondary mb-1">{t('system_log')}</label>
                  <select
                    id="journal-goal"
                    value={selectedGoalId}
                    onChange={e => setSelectedGoalId(e.target.value)}
                    className="mt-1 block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm"
                  >
                    {completedMajorGoals.map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="journal-reflection" className="block text-sm font-medium text-text-secondary mb-1">{t('story_log')}</label>
                  <textarea
                    id="journal-reflection"
                    value={reflection}
                    onChange={e => setReflection(e.target.value)}
                    rows={8}
                    placeholder={t('no_story_entries')}
                    required
                    className="block w-full bg-background border border-border-color rounded-md py-2 px-3 text-white focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading || !reflection.trim() || !selectedGoalId}
                    className="flex items-center justify-center space-x-2 bg-accent-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 disabled:bg-border-color disabled:text-text-muted transition-colors"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <span>{t('thinking')}</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
       </div>
    </div>
  );
};

export default Chatbot;