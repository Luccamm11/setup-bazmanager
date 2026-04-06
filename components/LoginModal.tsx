import React, { useState } from 'react';
import { Lock, User as UserIcon, Shield, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../types';
import { ALL_MEMBERS, TECHNICIAN_USERNAMES, getMemberByUsername } from '../data/members';

interface LoginModalProps {
  onLoginSuccess: (username: string, role: UserRole) => void;
  isLoading: boolean;
}

const VALID_USERS = ALL_MEMBERS.map(m => m.username);

// Award focus labels for display
const AWARD_LABELS: Record<string, string> = {
  Sustentabilidade: '🌱 Sustentabilidade',
  PensamentoCriativo: '💡 Pensamento Criativo',
  Conexao: '🤝 Conexão',
  Alcance: '📢 Alcance',
  Controle: '🤖 Controle',
  DesignInovacao: '🔧 Design e Inovação',
};

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, isLoading }) => {
  const { t } = useTranslation('common');
  const [selectedUser, setSelectedUser] = useState<string>(VALID_USERS[2]); // Default to first non-technician
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedMember = getMemberByUsername(selectedUser);

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
        onLoginSuccess(selectedUser, data.role || 'member');
      } else {
        setError(data.message || t('incorrectPassword'));
      }
    } catch (err) {
      console.error(err);
      setError(t('serverConnectionError'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40">
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute w-[600px] h-[600px] bg-yellow-500/20 rounded-full blur-[120px]" 
        />
        <motion.div 
            animate={{ 
                scale: [1.2, 1, 1.2],
                rotate: [90, 0, 90],
                opacity: [0.4, 0.2, 0.4]
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute w-[800px] h-[800px] bg-sky-500/10 rounded-full blur-[150px]" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-md bg-zinc-950/40 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] p-10 overflow-hidden"
      >
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

        <div className="flex justify-center mb-4">
          <motion.div 
            whileHover={{ rotate: [0, -10, 10, 0] }}
            className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
          >
            <Lock className="w-10 h-10 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          </motion.div>
        </div>

        {/* Title with team branding */}
        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight text-center">Bazinga! 73</h1>
        <p className="text-yellow-500/70 text-xs font-bold text-center uppercase tracking-[0.2em] mb-1">BazManager</p>
        <p className="text-zinc-400 mb-8 text-center text-balance text-sm">{t('accessRestricted')}</p>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              {t('user')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-yellow-500 transition-colors">
                <UserIcon className="h-5 w-5 text-zinc-500 transition-colors" />
              </div>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 transition-all appearance-none cursor-pointer font-medium hover:bg-white/10"
              >
                {/* Technicians group */}
                <optgroup label="Técnicos">
                  {ALL_MEMBERS.filter(m => m.role === 'technician').map(m => (
                    <option key={m.username} value={m.username} className="bg-zinc-900 border-none">
                      🛡️ {m.displayName}
                    </option>
                  ))}
                </optgroup>
                {/* Members group */}
                <optgroup label="Membros">
                  {ALL_MEMBERS.filter(m => m.role === 'member').map(m => (
                    <option key={m.username} value={m.username} className="bg-zinc-900 border-none">
                      {m.displayName} — {m.awardFocus ? AWARD_LABELS[m.awardFocus] || m.awardFocus : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Award focus badge for selected user */}
            {selectedMember?.awardFocus && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                key={selectedMember.username}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl"
              >
                <Award className="w-3.5 h-3.5 text-yellow-500/70" />
                <span className="text-[11px] font-bold text-yellow-500/80">
                  {AWARD_LABELS[selectedMember.awardFocus]}
                </span>
              </motion.div>
            )}
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">
              {t('enterPasscode')}
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 transition-all font-mono tracking-widest text-center text-lg hover:bg-white/10 placeholder:text-white/10"
              />
            </div>
            
            <AnimatePresence mode="wait">
                {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl mt-3"
                >
                    <div className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                    <p className="text-red-400 text-[11px] font-medium leading-none">{error}</p>
                </motion.div>
                )}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || !password}
            className="w-full relative group mt-4"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <div className="relative w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed tracking-tight text-base shadow-xl uppercase">
                {isLoading ? (
                <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                <>
                    <span>{t('authenticate')}</span>
                    <motion.svg 
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </motion.svg>
                </>
                )}
            </div>
          </motion.button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-5">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{t('authorizedTeam')}</h3>
            <div className="flex flex-wrap justify-center gap-2">
                {ALL_MEMBERS.map((member, idx) => {
                    const isTech = member.role === 'technician';
                    return (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.03 * idx }}
                        whileHover="hover"
                        key={member.username} 
                        className={`h-8 rounded-xl border flex items-center px-2.5 cursor-help transition-all shrink-0 shadow-lg overflow-hidden whitespace-nowrap ${
                            isTech
                                ? 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/15 hover:border-orange-500/40'
                                : 'border-white/10 bg-white/5 hover:bg-yellow-500/10 hover:border-yellow-500/30'
                        }`}
                        title={member.awardFocus ? AWARD_LABELS[member.awardFocus] : 'Técnico'}
                    >
                        {isTech && <Shield className="w-3 h-3 text-orange-400 mr-1.5 shrink-0" />}
                        <span className={`shrink-0 text-xs font-black ${isTech ? 'text-orange-400' : 'text-yellow-500/80'}`}>{member.displayName[0]}</span>
                        <motion.span 
                            variants={{
                                hover: { width: 'auto', opacity: 1, marginLeft: 6 }
                            }}
                            initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="text-[10px] uppercase tracking-wider font-bold text-white/70"
                        >
                            {member.displayName.substring(1)}
                        </motion.span>
                    </motion.div>
                    );
                })}
            </div>
            <p className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-black">{t('teamMembersCount', { count: ALL_MEMBERS.length })}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginModal;