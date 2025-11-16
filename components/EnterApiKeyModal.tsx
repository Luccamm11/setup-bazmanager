import React, { useState } from 'react';
import { Key } from 'lucide-react';

interface EnterApiKeyModalProps {
  onSave: (apiKey: string) => void;
}

const EnterApiKeyModal: React.FC<EnterApiKeyModalProps> = ({ onSave }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[100] p-4">
      <div className="bg-primary rounded-lg p-8 w-full max-w-md border border-border-color text-center shadow-2xl">
        <Key className="w-12 h-12 mx-auto text-accent-primary mb-4" />
        <h1 className="text-2xl font-bold text-text-primary">Enter Your API Key</h1>
        <p className="text-text-secondary mt-2 mb-6">
          To use the AI features, please provide your Google AI API key. Your key will be saved securely in your browser's local storage.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your API key here"
          className="w-full bg-background text-text-primary rounded-lg p-3 border border-border-color focus:outline-none focus:ring-2 focus:ring-accent-primary text-center"
        />
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="w-full mt-4 bg-accent-primary text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-3 transition-colors hover:bg-opacity-80 disabled:opacity-50"
        >
          <span>Save & Continue</span>
        </button>
         <p className="text-xs text-text-muted mt-4">
          You can get your key from{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-accent-primary"
          >
            Google AI Studio
          </a>.
        </p>
      </div>
    </div>
  );
};

export default EnterApiKeyModal;