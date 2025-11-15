import React, { useState } from 'react';
import { User } from 'lucide-react';

interface LoginModalProps {
  onLogin: (username: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[100] p-4">
      <div className="bg-primary rounded-lg p-8 w-full max-w-sm border border-border-color text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-text-primary">LevelUp: AI Awakening</h1>
        <p className="text-text-secondary mt-2 mb-6">Enter your name to begin or resume your journey.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="w-full bg-background border border-border-color rounded-lg py-3 px-10 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-accent-primary text-white font-bold py-3 rounded-lg transition-colors hover:bg-opacity-90 disabled:bg-border-color disabled:text-text-muted disabled:cursor-not-allowed"
          >
            Load / Create Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
