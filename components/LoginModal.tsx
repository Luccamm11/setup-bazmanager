import React, { useRef, useState, useEffect } from 'react';
import { Upload, Sparkles, Shield, LogIn, Database } from 'lucide-react';
import { renderSignInButton } from '../auth/googleAuth';

interface LoginModalProps {
  onRestoreFromFile: (file: File) => void;
  error?: string | null;
}

const LoginModal: React.FC<LoginModalProps> = ({ onRestoreFromFile, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    renderSignInButton('google-signin-button');
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          onRestoreFromFile(file);
      }
  };

  const handleUploadClick = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      {/* Decorative background glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-primary/20 rounded-full blur-[100px]"></div>
      </div>

      <div className={`relative z-10 w-full max-w-md bg-primary/90 backdrop-blur-xl border border-border-color rounded-2xl shadow-2xl p-8 text-center transition-all duration-700 transform ${mounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}>
        
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-accent-primary/10 rounded-2xl border border-accent-primary/20">
            <Sparkles className="w-10 h-10 text-accent-primary" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">Welcome Back</h1>
        <p className="text-text-secondary mb-8">Sign in with your Google account to continue your journey.</p>
        
        {error && (
          <div className="bg-accent-red/10 border border-accent-red/30 text-accent-red px-4 py-3 rounded-xl mb-6 flex items-start text-left">
            <Shield className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="font-semibold block text-sm">Sign-in Error</strong>
              <span className="text-sm opacity-90">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-5">
            {/* Google Identity Services Container */}
            <div className="flex justify-center bg-white/5 py-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <div id="google-signin-button" className="min-h-[44px]"></div>
            </div>

            <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-border-color"></div>
                <span className="flex-shrink mx-4 text-text-muted text-xs font-semibold uppercase tracking-wider">Or</span>
                <div className="flex-grow border-t border-border-color"></div>
            </div>

            <button
                onClick={handleUploadClick}
                className="w-full bg-border-color/30 text-text-primary font-medium py-3.5 px-4 rounded-xl flex items-center justify-center space-x-3 transition-all hover:bg-border-color/60 hover:shadow-md border border-border-color group"
            >
                <Database className="w-5 h-5 text-text-secondary group-hover:text-accent-secondary transition-colors" />
                <span>Load from Local Save</span>
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json,application/json"
                onChange={handleFileChange}
            />
        </div>
        
        <p className="text-xs text-text-muted mt-8">
            By signing in, you are granting access to sync your progress securely.
        </p>
      </div>
    </div>
  );
};

export default LoginModal;