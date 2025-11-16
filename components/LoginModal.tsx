import React, { useRef } from 'react';
import { User, Upload } from 'lucide-react';

interface LoginModalProps {
  onRestoreFromFile: (file: File) => void;
  error?: string | null;
}

const LoginModal: React.FC<LoginModalProps> = ({ onRestoreFromFile, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[100] p-4">
      <div className="bg-primary rounded-lg p-8 w-full max-w-sm border border-border-color text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-text-primary">LevelUp: AI Awakening</h1>
        <p className="text-text-secondary mt-2 mb-8">Sign in or load from a file to begin.</p>
        
        {error && (
          <div className="bg-accent-red/20 border border-accent-red text-accent-red px-4 py-3 rounded-lg relative text-left my-4">
            <strong className="font-bold">Error!</strong>
            <span className="block mt-2 text-sm">
              {error}
            </span>
          </div>
        )}

        <div className="flex flex-col space-y-4">
            {/* This div will be populated by the Google Identity Services library */}
            <div id="google-signin-button" className="flex justify-center"></div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border-color"></div>
                <span className="flex-shrink mx-4 text-text-muted text-sm">OR</span>
                <div className="flex-grow border-t border-border-color"></div>
            </div>

            <button
                onClick={handleUploadClick}
                className="w-full bg-border-color text-text-primary font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-3 transition-colors hover:bg-border-color/80"
            >
                <Upload size={20} />
                <span>Load from File</span>
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json,application/json"
                onChange={handleFileChange}
            />
        </div>
      </div>
    </div>
  );
};

export default LoginModal;