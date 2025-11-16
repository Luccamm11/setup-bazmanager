import React from 'react';
import { Key } from 'lucide-react';

interface SelectApiKeyModalProps {
  onSelect: () => void;
}

const SelectApiKeyModal: React.FC<SelectApiKeyModalProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[100] p-4">
      <div className="bg-primary rounded-lg p-8 w-full max-w-sm border border-border-color text-center shadow-2xl">
        <Key className="w-12 h-12 mx-auto text-accent-primary mb-4" />
        <h1 className="text-2xl font-bold text-text-primary">Select API Key</h1>
        <p className="text-text-secondary mt-2 mb-6">
          To use the AI features of this application, you need to select a Google AI API key.
        </p>
        <button
          onClick={onSelect}
          className="w-full bg-accent-primary text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-3 transition-colors hover:bg-opacity-80"
        >
          <span>Select API Key</span>
        </button>
        <p className="text-xs text-text-muted mt-4">
          Project activity may incur API usage charges. For more information, see{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-accent-primary"
          >
            Google AI billing documentation
          </a>.
        </p>
      </div>
    </div>
  );
};

export default SelectApiKeyModal;
