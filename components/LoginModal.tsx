
import React from 'react';
import { User } from 'lucide-react';

interface LoginModalProps {
  onLogin: () => void;
  error?: string | null;
}

const GoogleIcon = () => (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);


const LoginModal: React.FC<LoginModalProps> = ({ onLogin, error }) => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[100] p-4">
      <div className="bg-primary rounded-lg p-8 w-full max-w-sm border border-border-color text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-text-primary">LevelUp: AI Awakening</h1>
        <p className="text-text-secondary mt-2 mb-8">Sign in to begin or resume your journey.</p>
        
        {error ? (
          <div className="bg-accent-red/20 border border-accent-red text-accent-red px-4 py-3 rounded-lg relative text-left my-4">
            <strong className="font-bold">Configuration Error!</strong>
            <span className="block mt-2 text-sm">
              {error}
            </span>
            <p className="text-xs mt-2 text-text-secondary">
              You can get your Client ID from the{' '}
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent-primary">
                Google Cloud Console
              </a>.
            </p>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="w-full bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-3 transition-colors hover:bg-gray-200"
          >
            <GoogleIcon />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
