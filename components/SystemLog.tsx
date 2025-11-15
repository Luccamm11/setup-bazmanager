import React from 'react';
import { SystemMessage } from '../types';
import { Info, AlertTriangle, Terminal, Gift } from 'lucide-react';

interface SystemLogProps {
  messages: SystemMessage[];
}

const typeConfig = {
    info: { icon: <Info size={16} />, color: 'text-accent-primary' },
    warning: { icon: <AlertTriangle size={16} />, color: 'text-accent-secondary' },
    system: { icon: <Terminal size={16} />, color: 'text-accent-green' },
    reward: { icon: <Gift size={16} />, color: 'text-accent-tertiary' },
}

const SystemLog: React.FC<SystemLogProps> = ({ messages }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">System Log</h2>
      <div className="max-w-3xl mx-auto bg-primary p-4 sm:p-6 rounded-lg border border-border-color">
        <div className="space-y-4">
          {messages.map((msg) => {
            const config = typeConfig[msg.type];
            return (
              <div key={msg.id} className="flex items-start space-x-3 text-sm">
                <div className={`mt-0.5 ${config.color}`}>{config.icon}</div>
                <div className="flex-1">
                  <p className="text-text-primary">
                    <span className={`font-semibold ${config.color}`}>[SYSTEM]: </span>
                    {msg.text}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{msg.timestamp}</p>
                </div>
              </div>
            );
          })}
           {messages.length === 0 && (
             <div className="text-center py-10 px-4">
                <Terminal className="w-12 h-12 mx-auto text-text-muted mb-4" />
                <p className="text-text-secondary">No system messages.</p>
                <p className="text-text-muted mt-2">Updates from the System will appear here.</p>
            </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SystemLog;