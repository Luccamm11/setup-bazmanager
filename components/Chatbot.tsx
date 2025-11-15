import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Bot, User, Send, CornerDownLeft } from 'lucide-react';

interface ChatbotProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
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

const Chatbot: React.FC<ChatbotProps> = ({ history, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col flex-grow max-w-4xl mx-auto w-full">
       <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">System Chat</h2>
       <div className="flex-grow bg-primary rounded-lg border border-border-color flex flex-col overflow-hidden">
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
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask the System for guidance..."
                    disabled={isLoading}
                    className="w-full bg-background text-text-primary rounded-lg p-4 pr-20 border border-border-color focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-accent-primary text-white disabled:bg-border-color disabled:text-text-muted hover:bg-opacity-80 transition-colors"
                    aria-label="Send message"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
       </div>
    </div>
  );
};

export default Chatbot;