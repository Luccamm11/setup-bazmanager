import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoginModalProps {
  onLoginSuccess: (username: string) => void;
  isLoading: boolean;
}

const VALID_USERS = ['Jonas', 'Gustavo', 'Lucca', 'Enzo', 'Guilherme', 'Anexo', 'Clarice'];

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, isLoading }) => {
  const { t } = useTranslation('common');
  const [selectedUser, setSelectedUser] = useState<string>(VALID_USERS[0]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedUser, password }),
      });

      const data = await response.json();

      if (data.success) {
        onLoginSuccess(selectedUser);
      } else {
        setError(data.message || 'Senha incorreta.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao servidor.');
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      {/* Decorative background glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-primary/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-primary/90 backdrop-blur-xl border border-border-color rounded-2xl shadow-2xl p-8 text-center">
        
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-accent-primary/10 rounded-2xl border border-accent-primary/20">
            <Lock className="w-10 h-10 text-accent-primary" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">System Login</h1>
        <p className="text-text-secondary mb-8">Access restricted. Authenticate to sync state.</p>
        
        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              User ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-text-secondary" />
              </div>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={isLoading}
                className="w-full bg-border-color/30 border border-border-color rounded-lg pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all appearance-none"
              >
                {VALID_USERS.map(user => (
                  <option key={user} value={user} className="bg-primary">{user}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-border-color/30 border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all font-mono"
              />
            </div>
            {error && (
              <p className="text-accent-red text-xs mt-2 animate-pulse">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-accent-primary hover:bg-accent-primary-hover text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed tracking-wider text-sm mt-4 shadow-lg shadow-accent-primary/20"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>Authenticate</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;