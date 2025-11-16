import React, { useState } from 'react';
import { Wand2, Loader2, Send } from 'lucide-react';
import { generateShortText } from '../services/geminiService';

interface AiTextGeneratorProps {
  context: string;
  onGenerated: (text: string) => void;
  className?: string;
  apiKey: string;
}

const AiTextGenerator: React.FC<AiTextGeneratorProps> = ({ context, onGenerated, className, apiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const fullPrompt = `Generate ${context} based on the following idea: "${prompt}"`;
      const result = await generateShortText(apiKey, fullPrompt);
      onGenerated(result);
      setIsOpen(false);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-accent-primary hover:text-opacity-80 p-1 rounded-full hover:bg-border-color"
        title="Generate with AI"
      >
        <Wand2 size={18} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-primary border border-border-color rounded-lg shadow-xl p-3 z-10">
          <p className="text-xs text-text-secondary mb-2">Generate {context}...</p>
          <form onSubmit={handleGenerate}>
            <div className="relative">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Cyberpunk theme'"
                    className="w-full bg-background text-text-primary rounded-md p-2 pr-10 text-sm border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-accent-primary text-white disabled:bg-border-color hover:bg-opacity-80"
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
            </div>
          </form>
          {error && <p className="text-xs text-accent-red mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default AiTextGenerator;